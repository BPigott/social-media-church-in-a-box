import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { translateText, translateMultiple } from "../_shared/translate.ts";
import { validateInput, validateGeneratedContent } from "../_shared/content-safety.ts";
import { director, type AnthropicUsage } from "../_shared/generation/director.ts";
import { runFacebookSpecialist } from "../_shared/generation/specialists/facebook.ts";
import { runInstagramSpecialist } from "../_shared/generation/specialists/instagram.ts";
import { runTikTokSpecialist } from "../_shared/generation/specialists/tiktok.ts";
import { runTwitterSpecialist } from "../_shared/generation/specialists/twitter.ts";
import { runExecutiveSummarySpecialist } from "../_shared/generation/specialists/executive-summary.ts";
import { runBibleStudySpecialist } from "../_shared/generation/specialists/bible-study.ts";
import { runDevotionalSpecialist } from "../_shared/generation/specialists/devotional.ts";
import { runPodcastSpecialist } from "../_shared/generation/specialists/podcast.ts";
import type { SpecialistContext, SpecialistResult, SocialPlatform } from "../_shared/generation/specialists/_shared.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", pt: "Portuguese", de: "German",
  ko: "Korean", zh: "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)",
  ar: "Arabic", fa: "Persian (Farsi)", pl: "Polish", uk: "Ukrainian",
  it: "Italian", ru: "Russian", ja: "Japanese",
};

const SOCIAL_SPECIALISTS: Record<SocialPlatform, (b: any, c: SpecialistContext) => Promise<SpecialistResult>> = {
  facebook: runFacebookSpecialist,
  instagram: runInstagramSpecialist,
  tiktok: runTikTokSpecialist,
  twitter: runTwitterSpecialist,
  linkedin: runFacebookSpecialist, // unreachable: linkedin is filtered out before dispatch
};
const SUPPORTED_SOCIAL: SocialPlatform[] = ["facebook", "instagram", "tiktok", "twitter"];

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Haiku 4.5 pricing per million tokens.
function estimateCostUsd(usage: AnthropicUsage): number {
  const input = (usage.input_tokens / 1_000_000) * 1.0;
  const output = (usage.output_tokens / 1_000_000) * 5.0;
  const cacheWrite = ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * 1.25;
  const cacheRead = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * 0.1;
  return input + output + cacheWrite + cacheRead;
}

function addUsage(into: AnthropicUsage, from: AnthropicUsage): void {
  into.input_tokens += from.input_tokens;
  into.output_tokens += from.output_tokens;
  into.cache_read_input_tokens = (into.cache_read_input_tokens ?? 0) + (from.cache_read_input_tokens ?? 0);
  into.cache_creation_input_tokens = (into.cache_creation_input_tokens ?? 0) + (from.cache_creation_input_tokens ?? 0);
}

// Run tasks with a max-concurrency cap, returning settled results in the
// original input order (same contract as Promise.allSettled).
// Tasks must be thunks so this function controls when each network call fires.
async function runWithLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  const workers: Promise<void>[] = [];
  const workerCount = Math.min(Math.max(1, limit), tasks.length);
  for (let w = 0; w < workerCount; w++) {
    workers.push((async () => {
      while (true) {
        const i = next++;
        if (i >= tasks.length) return;
        try {
          results[i] = { status: "fulfilled", value: await tasks[i]() };
        } catch (reason) {
          results[i] = { status: "rejected", reason };
        }
      }
    })());
  }
  await Promise.all(workers);
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let idempotencyKey: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: ReturnType<typeof createClient<any, any, any>> | undefined;

  try {
    console.log("=== generate-social-posts (Phase 2) START ===");
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 6 * 1024 * 1024) {
      return jsonResponse(413, { error: "Request too large. Please reduce the size of your transcript." });
    }

    supabase = createClient<any, any, any>(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) throw new Error("Unauthorized");

    // === Subscription enforcement ===
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at, exempt")
      .eq("user_id", user.id)
      .maybeSingle();
    if (subError || !subscription) {
      return jsonResponse(402, { error: "No active subscription found. Please sign up to continue." });
    }
    const trialValid = subscription.status === "trialing" && new Date(subscription.trial_ends_at) > new Date();
    const isSubscriptionActive = subscription.exempt || subscription.status === "active" || trialValid;
    if (!isSubscriptionActive) {
      return jsonResponse(402, { error: "Subscription required", subscription_status: subscription.status });
    }

    // === Parse body ===
    let body: any;
    try { body = await req.json(); }
    catch { return jsonResponse(400, { error: "Invalid request body — must be valid JSON." }); }

    idempotencyKey = body.idempotency_key;
    if (!idempotencyKey) return jsonResponse(400, { error: "idempotency_key required" });

    const {
      transcript, styleGuide, customCTA, churchId,
      postsPerPlatform = 1, speakerName, socialHandles,
      contentTypes = ["social_media"], outputLanguages = ["en"], primaryLanguage = "en",
      seriesName, seriesDescription, seriesWeekNumber, seriesTotalWeeks,
      generationMode = "sermon", eventDetails,
      churchName,
    } = body;

    const platforms: string[] = Array.isArray(body.platforms) ? body.platforms : (body.platforms ? [body.platforms] : []);

    const hasSocialMedia = contentTypes.includes("social_media");
    const hasBibleStudy = contentTypes.includes("bible_study");
    const hasDevotional = contentTypes.includes("devotional");
    const hasPodcastDescription = contentTypes.includes("podcast_description");

    if (!hasSocialMedia && !hasBibleStudy && !hasDevotional && !hasPodcastDescription) {
      return jsonResponse(400, { error: "Please select at least one content type to generate." });
    }
    if (hasSocialMedia && platforms.length === 0) {
      return jsonResponse(400, { error: "Please select at least one platform for social media posts." });
    }

    const isEventMode = generationMode === "event";
    const hasTranscript = typeof transcript === "string" && transcript.trim().length >= 100;
    const hasCTA = typeof customCTA === "string" && customCTA.trim().length >= 10;
    const hasEventDetails = isEventMode && eventDetails?.eventName?.trim().length > 0;

    if (isEventMode && !hasEventDetails) {
      return jsonResponse(400, { error: "Please provide an event name for event promotion mode." });
    }
    if (!isEventMode && !hasTranscript && !hasCTA) {
      return jsonResponse(400, { error: "Please provide either a sermon transcript (100+ words) or a CTA/event (10+ words)." });
    }

    // === Token budget pre-flight ($6/month, exempt users bypass) ===
    if (!subscription.exempt) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: usageRows } = await supabase
        .from("generations")
        .select("estimated_cost_usd")
        .eq("user_id", user.id).eq("status", "completed").gte("created_at", thirtyDaysAgo);
      const monthlyCostUsd = (usageRows ?? []).reduce(
        (sum: number, row: { estimated_cost_usd: number | null }) => sum + (row.estimated_cost_usd ?? 0), 0);
      const MONTHLY_LIMIT_USD = 6.0;
      if (monthlyCostUsd >= MONTHLY_LIMIT_USD) {
        return jsonResponse(402, {
          error: "Monthly generation limit reached. Your limit resets in 30 days.",
          monthly_cost_usd: monthlyCostUsd, limit_usd: MONTHLY_LIMIT_USD,
        });
      }
    }

    // === Idempotency ===
    const { data: existing } = await supabase
      .from("generations").select("status, result").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing?.status === "completed") {
      return jsonResponse(200, existing.result);
    }
    if (existing?.status === "pending") {
      return jsonResponse(429, { error: "Generation already in progress" });
    }

    const { error: insertError } = await supabase.from("generations").insert({
      idempotency_key: idempotencyKey, user_id: user.id, church_id: churchId,
      content_types: contentTypes, platforms, generation_mode: generationMode, status: "pending",
    });
    if (insertError) return jsonResponse(429, { error: "Generation already in progress" });

    const idempotencyKeyConfirmed: string = idempotencyKey;
    const failGeneration = async (reason: string) => {
      console.error("Generation failed:", reason);
      await supabase!.from("generations")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("idempotency_key", idempotencyKeyConfirmed);
    };

    // === Content safety on input ===
    for (const [field, value] of [["transcript", transcript], ["customCTA", customCTA], ["speakerName", speakerName]] as const) {
      if (!value) continue;
      const v = validateInput(value);
      if (!v.isSafe) {
        await failGeneration(`${field} safety violation`);
        return jsonResponse(400, { error: `${field} contains inappropriate content.`, violations: v.violations });
      }
    }

    // === Director: build the editorial brief ===
    console.log("=== Calling director ===");
    const { brief, usage: directorUsage } = await director({
      transcript: hasTranscript ? transcript : undefined,
      isEventMode,
      eventDetails: hasEventDetails ? eventDetails : undefined,
      speakerName, seriesName, seriesWeekNumber, seriesTotalWeeks, seriesDescription,
      customCTA: hasCTA ? customCTA : undefined,
      churchName: churchName ?? "this church",
    });
    console.log(`Director produced ${brief.themes.length} themes, ${brief.hookAngles.length} hook angles, ${brief.verbatimMoments.length} verbatim moments`);

    // === Specialists in parallel ===
    const ctx: SpecialistContext = {
      styleGuide: styleGuide ?? "",
      churchId: churchId ?? "unknown",
      churchName: churchName ?? "this church",
      speakerName, seriesName, seriesWeekNumber, seriesTotalWeeks, seriesDescription,
      customCTA: hasCTA ? customCTA : undefined,
      isEventMode,
      eventDetails: hasEventDetails ? eventDetails : undefined,
      socialHandles,
    };

    type Call = { key: string; start: () => Promise<SpecialistResult> };
    const calls: Call[] = [];

    if (hasSocialMedia) {
      const validPlatforms = platforms.filter((p): p is SocialPlatform => SUPPORTED_SOCIAL.includes(p as SocialPlatform));
      for (const platform of validPlatforms) {
        const spec = SOCIAL_SPECIALISTS[platform];
        for (let i = 0; i < Math.max(1, postsPerPlatform); i++) {
          calls.push({ key: `social:${platform}:${i}`, start: () => spec(brief, ctx) });
        }
      }
      calls.push({ key: "executiveSummary", start: () => runExecutiveSummarySpecialist(brief, ctx) });
    }
    if (hasBibleStudy) calls.push({ key: "bibleStudyGuide", start: () => runBibleStudySpecialist(brief, ctx) });
    if (hasDevotional) calls.push({ key: "devotional", start: () => runDevotionalSpecialist(brief, ctx) });
    if (hasPodcastDescription) calls.push({ key: "podcastDescription", start: () => runPodcastSpecialist(brief, ctx) });

    // Anthropic per-account concurrent-connection cap is low (≈5-10).
    // Cap specialist concurrency at 4 to leave headroom for the director call
    // and any other in-flight requests on the same account.
    const SPECIALIST_CONCURRENCY = 4;
    console.log(`Dispatching ${calls.length} specialist calls (max ${SPECIALIST_CONCURRENCY} concurrent)`);
    const settled = await runWithLimit(calls.map(c => c.start), SPECIALIST_CONCURRENCY);

    // === Aggregate into the response shape the frontend expects ===
    const generatedContent: Record<string, any> = {};
    const usageTotal: AnthropicUsage = {
      input_tokens: directorUsage.input_tokens,
      output_tokens: directorUsage.output_tokens,
      cache_read_input_tokens: directorUsage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: directorUsage.cache_creation_input_tokens ?? 0,
    };
    const generationWarnings: string[] = [];

    // Collect social successes per platform so failed slots are dropped
    // (no sparse arrays with null holes in the frontend response).
    const socialResults: Record<string, string[]> = {};

    for (let i = 0; i < settled.length; i++) {
      const call = calls[i];
      const r = settled[i];
      if (r.status === "rejected") {
        const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
        console.error(`[orchestrator] specialist failed: ${call.key} — ${reason}`);
        generationWarnings.push(`${call.key.split(":")[0]} could not be generated (${reason.slice(0, 120)})`);
        continue;
      }
      addUsage(usageTotal, r.value.usage);
      if (call.key.startsWith("social:")) {
        const [, platform] = call.key.split(":");
        (socialResults[platform] ??= []).push(r.value.text);
      } else {
        generatedContent[call.key] = r.value.text;
      }
    }

    // Flatten per-platform successes into the response shape.
    // Single-post mode → string; multi-post mode → compact string[].
    for (const [platform, texts] of Object.entries(socialResults)) {
      if (texts.length === 0) continue;
      generatedContent[platform] = postsPerPlatform <= 1 ? texts[0] : texts;
    }

    // If literally every specialist failed, that's a hard error.
    if (Object.keys(generatedContent).length === 0) {
      await failGeneration(`all specialists failed: ${generationWarnings.join("; ")}`);
      throw new Error(`All content generation failed: ${generationWarnings.join("; ")}`);
    }

    // === Output content safety ===
    const toValidate: string[] = [];
    if (hasSocialMedia) {
      for (const p of platforms) {
        const v = generatedContent[p];
        if (typeof v === "string") toValidate.push(v);
        else if (Array.isArray(v)) toValidate.push(...v.filter((s): s is string => typeof s === "string"));
      }
      if (generatedContent.executiveSummary) toValidate.push(generatedContent.executiveSummary);
    }
    if (hasBibleStudy && generatedContent.bibleStudyGuide) toValidate.push(generatedContent.bibleStudyGuide);
    if (hasDevotional && generatedContent.devotional) toValidate.push(generatedContent.devotional);
    if (hasPodcastDescription && generatedContent.podcastDescription) toValidate.push(generatedContent.podcastDescription);

    for (const content of toValidate) {
      const v = validateGeneratedContent(content);
      if (!v.isSafe) {
        await failGeneration(`output safety: ${v.violations.join(",")}`);
        throw new Error(`Generated content blocked: ${v.violations.join(", ")}`);
      }
    }

    // === Build english content object (matches old shape) ===
    const englishContent: Record<string, any> = {};
    if (hasSocialMedia) {
      for (const p of platforms) if (generatedContent[p] != null) englishContent[p] = generatedContent[p];
      if (generatedContent.executiveSummary) englishContent.executiveSummary = generatedContent.executiveSummary;
    }
    if (hasBibleStudy && generatedContent.bibleStudyGuide) englishContent.bibleStudyGuide = generatedContent.bibleStudyGuide;
    if (hasDevotional && generatedContent.devotional) englishContent.devotional = generatedContent.devotional;
    if (hasPodcastDescription && generatedContent.podcastDescription) englishContent.podcastDescription = generatedContent.podcastDescription;

    // === Translation flow (preserved from previous orchestrator) ===
    const multiLanguageContent: Record<string, any> = {};
    const nonEnglishLanguages: string[] = outputLanguages.filter((l: string) => l !== "en");

    if (nonEnglishLanguages.length > 0) {
      console.log(`Translating to ${nonEnglishLanguages.length} language(s)`);
      try {
        const translationPromises = nonEnglishLanguages.map(async (targetLang: string) => {
          const translated: Record<string, any> = {};
          if (hasSocialMedia) {
            for (const platform of platforms) {
              const pc = generatedContent[platform];
              if (!pc) continue;
              try {
                translated[platform] = Array.isArray(pc)
                  ? await translateMultiple(pc, targetLang)
                  : await translateText(pc, targetLang);
              } catch (e) {
                console.error(`Translation ${platform}→${targetLang} failed:`, e);
                translated[platform] = pc;
              }
            }
            if (generatedContent.executiveSummary) {
              try { translated.executiveSummary = await translateText(generatedContent.executiveSummary, targetLang); }
              catch { translated.executiveSummary = generatedContent.executiveSummary; }
            }
          }
          if (hasBibleStudy && generatedContent.bibleStudyGuide) {
            try { translated.bibleStudyGuide = await translateText(generatedContent.bibleStudyGuide, targetLang); }
            catch { translated.bibleStudyGuide = generatedContent.bibleStudyGuide; }
          }
          if (hasDevotional && generatedContent.devotional) {
            try { translated.devotional = await translateText(generatedContent.devotional, targetLang); }
            catch { translated.devotional = generatedContent.devotional; }
          }
          if (hasPodcastDescription && generatedContent.podcastDescription) {
            try { translated.podcastDescription = await translateText(generatedContent.podcastDescription, targetLang); }
            catch { translated.podcastDescription = generatedContent.podcastDescription; }
          }
          return { language: targetLang, content: translated };
        });
        const translationResults = await Promise.all(translationPromises);
        for (const r of translationResults) multiLanguageContent[r.language] = r.content;
      } catch (translateError) {
        console.error("Translation pipeline failed:", translateError);
        return jsonResponse(200, {
          ...englishContent,
          englishVersions: null,
          multiLanguageVersions: null,
          translationError: `Multi-language translation failed: ${translateError instanceof Error ? translateError.message : "Unknown error"}.`,
        });
      }
    }

    const responseContent = primaryLanguage === "en"
      ? englishContent
      : (multiLanguageContent[primaryLanguage] ?? englishContent);

    const cleanResponseContent: Record<string, any> = {};
    for (const [k, v] of Object.entries(responseContent)) if (v != null) cleanResponseContent[k] = v;

    const estimatedCostUsd = estimateCostUsd(usageTotal);
    console.log(`Total usage: in=${usageTotal.input_tokens} out=${usageTotal.output_tokens} cache_read=${usageTotal.cache_read_input_tokens} cache_write=${usageTotal.cache_creation_input_tokens} cost=$${estimatedCostUsd.toFixed(4)}`);

    const responsePayload = {
      ...cleanResponseContent,
      englishVersions: (primaryLanguage !== "en" || outputLanguages.length > 1) ? englishContent : null,
      multiLanguageVersions: nonEnglishLanguages.length > 0 ? multiLanguageContent : null,
      outputLanguages,
      primaryLanguage,
      ...(generationWarnings.length > 0 ? { generationWarnings } : {}),
    };

    await supabase.from("generations").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      input_tokens: usageTotal.input_tokens,
      output_tokens: usageTotal.output_tokens,
      estimated_cost_usd: estimatedCostUsd,
      result: responsePayload,
    }).eq("idempotency_key", idempotencyKey);

    return jsonResponse(200, responsePayload);
  } catch (error) {
    console.error("=== ERROR in generate-social-posts ===", error);
    if (typeof idempotencyKey === "string" && supabase) {
      try {
        await supabase.from("generations")
          .update({ status: "failed", completed_at: new Date().toISOString() })
          .eq("idempotency_key", idempotencyKey);
      } catch (cleanupError) { console.error("Failed to mark generation as failed:", cleanupError); }
    }
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const isConfigError = errorMessage.includes("not configured") || errorMessage.includes("API key");
    return jsonResponse(isConfigError ? 400 : 500, {
      error: isConfigError ? "Service configuration error. Please contact support." : errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
});
