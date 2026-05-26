// Specialist-call helper with Anthropic prompt caching.
//
// All Phase 2 specialists call Claude through this wrapper so that the
// per-church style guide + shared voice rules sit in one cache_control block.
// Same church → byte-identical prefix → cache hit on every call after the first.
//
// The shared voice/safety/writing-style block is identical across churches and
// across specialists, so it's bolted on top of the per-church style guide
// inside a single cached prefix. Specialists supply their own (small, uncached)
// platform rules and user prompt.
//
// Specialists may opt into a Gemini failover (passing `failoverEnabled: true`)
// for the rare case where Anthropic's output content filter trips even after
// the in-loop retry. Bible-study is the only opt-in today.

import type { AnthropicUsage } from "./director.ts";
import { callGemini } from "./gemini-client.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

// Stable across all churches and all specialists — lives at the top of the
// cached prefix. Keep this block byte-stable to maximise cache hit rate.
export const SHARED_VOICE_BLOCK = `# Writing Style (these rules OVERRIDE any contrary patterns in the style guide examples below)
- Maintain a respectful tone, aligned with Christian values, with accurate Scripture
- Natural, conversational tone; vary sentence structure and length; straightforward language
- UK English spelling throughout (colour, realise, centre)
- NO emojis anywhere. Not in social posts, not in devotionals, not in podcast descriptions, not as section breaks. Zero emojis in any output.
- NO em dashes (—) and NO en dashes (–). Not for parentheticals, not for explanations, not for asides, not for emphasis. Even if the style guide examples below use them, you must not. Use commas, parentheses, colons, semicolons, or separate sentences instead.
- Regular hyphens (-) are fine ONLY in compound words like "well-known" or in verse ranges like "Mark 6:30-44".`;

// Strip em/en dashes. Used in three places:
//   1. Sanitise the church's style guide before caching (so the model doesn't copy them)
//   2. Sanitise the editorial brief before specialists see it
//   3. Sanitise every specialist's output as a final safety net
// Byte-stable: same input → same output, so caches still hit.
// Require whitespace on at least one side of the dash so verse ranges like
// "Mark 6:30–44" (en dash, no surrounding whitespace) are preserved verbatim.
export function stripDashes(raw: string): string {
  return raw
    .replace(/(?:\s+—\s*|\s*—\s+)/g, ", ")
    .replace(/(?:\s+–\s*|\s*–\s+)/g, ", ");
}

// Back-compat alias used inside buildCachedPrefix below.
export const sanitiseStyleGuide = stripDashes;

// Predicate for the Gemini failover trigger. Matches errors thrown by
// callAnthropicSpecialist when Anthropic returns 400 + content filtering.
// Exported so tests can pin the trigger criteria without mocking fetch.
export function isContentFilterError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /Anthropic API 400/.test(err.message)
    && /content filtering/i.test(err.message);
}

export interface SpecialistCallParams {
  // Per-church style guide. The wrapper composes the full cached prefix as
  // SHARED_VOICE_BLOCK + "\n\n# Church Voice & Style (authoritative)\n" + styleGuide.
  styleGuide: string;

  // Specialist-specific instructions (platform rules, output format).
  // NOT cached.
  taskSystem: string;

  // The user message — usually the editorial brief + church context.
  userPrompt: string;

  maxTokens: number;
  temperature?: number;

  // Opt-in for Gemini failover on Anthropic content-filter exhaustion.
  // Only bible-study uses this today.
  failoverEnabled?: boolean;

  // For logging only — not sent to Anthropic.
  churchId?: string;
  specialistName?: string;
}

export interface SpecialistCallResult {
  text: string;
  usage: AnthropicUsage;
  stopReason: string | null;
}

function buildCachedPrefix(styleGuide: string): string {
  return `${SHARED_VOICE_BLOCK}\n\n# Church Voice & Style (authoritative for tone and vocabulary; writing-style rules above override any conflicting punctuation in the examples)\n${sanitiseStyleGuide(styleGuide)}`;
}

async function callAnthropicSpecialist(
  params: SpecialistCallParams,
): Promise<SpecialistCallResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const cachedPrefix = buildCachedPrefix(params.styleGuide);
  const requestBody = JSON.stringify({
    model: MODEL,
    max_tokens: params.maxTokens,
    temperature: params.temperature ?? 0.7,
    system: [
      {
        type: "text",
        text: cachedPrefix,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: params.taskSystem,
      },
    ],
    messages: [{ role: "user", content: params.userPrompt }],
  });

  // Retry policy (max 3 attempts):
  //   - 429 / rate_limit_error: retry ONCE after 1.5s to ride out brief
  //     concurrent-connection contention. Orchestrator-level throttling is the
  //     primary defence; this is a safety net.
  //   - 400 with "content filtering" in body: retry ONCE immediately. Claude
  //     samples non-deterministically at our temperature (0.6–0.7), so a fresh
  //     sample usually clears the classifier. Frequent firings in logs would
  //     mean the prompt still primes the filter and needs further work.
  // Each error type gets at most one retry; we never compound.
  let response: Response;
  let errorText = "";
  let rateLimitRetried = false;
  let contentFilterRetried = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: requestBody,
    });
    if (response.ok) break;
    errorText = await response.text();
    const isRateLimit = response.status === 429 || errorText.includes("rate_limit_error");
    const isContentFilter =
      response.status === 400 && /content filtering/i.test(errorText);

    if (isRateLimit && !rateLimitRetried) {
      rateLimitRetried = true;
      console.warn(
        `[${params.specialistName ?? "specialist"}] 429 rate-limited, retrying in 1.5s`,
      );
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    if (isContentFilter && !contentFilterRetried) {
      contentFilterRetried = true;
      console.warn(
        `[${params.specialistName ?? "specialist"}] 400 content-filter trip, retrying once (non-deterministic sampling)`,
      );
      continue;
    }
    throw new Error(
      `[${params.specialistName ?? "specialist"}] Anthropic API ${response.status}: ${errorText}`,
    );
  }
  // After loop, response is guaranteed assigned and ok (otherwise we threw).
  response = response!;
  if (!response.ok) {
    throw new Error(
      `[${params.specialistName ?? "specialist"}] Anthropic API ${response.status}: ${errorText}`,
    );
  }

  const data = await response.json();
  const stopReason: string | null = data.stop_reason ?? null;
  if (stopReason === "max_tokens") {
    console.warn(
      `[${params.specialistName ?? "specialist"}] truncated at max_tokens — output may be incomplete`,
    );
  }

  const rawText: string = data?.content?.[0]?.text ?? "";
  if (!rawText) {
    throw new Error(
      `[${params.specialistName ?? "specialist"}] empty response from Anthropic`,
    );
  }
  // Final safety net: strip any em/en dashes the model may have produced despite the prompt rule.
  const text = stripDashes(rawText);

  const usage: AnthropicUsage = {
    input_tokens: data.usage?.input_tokens ?? 0,
    output_tokens: data.usage?.output_tokens ?? 0,
    cache_read_input_tokens: data.usage?.cache_read_input_tokens,
    cache_creation_input_tokens: data.usage?.cache_creation_input_tokens,
  };

  console.log(
    `[${params.specialistName ?? "specialist"}] church=${params.churchId ?? "?"} ` +
      `in=${usage.input_tokens} out=${usage.output_tokens} ` +
      `cache_read=${usage.cache_read_input_tokens ?? 0} ` +
      `cache_write=${usage.cache_creation_input_tokens ?? 0} ` +
      `stop=${stopReason}`,
  );

  return { text, usage, stopReason };
}

// Gemini-backed failover for the rare cases when Anthropic refuses a specialist
// call with a content-filter 400 even after the in-loop retry. The same system
// prompt (cached prefix + task system) and user prompt are sent to Gemini; the
// output goes through the same dash-strip safety net as Anthropic output.
async function callGeminiFailover(
  params: SpecialistCallParams,
): Promise<SpecialistCallResult> {
  const system = `${buildCachedPrefix(params.styleGuide)}\n\n${params.taskSystem}`;
  const result = await callGemini({
    system,
    user: params.userPrompt,
    maxTokens: params.maxTokens,
    temperature: params.temperature ?? 0.6,
  });

  const text = stripDashes(result.text);

  const usage: AnthropicUsage = {
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cache_read_input_tokens: undefined,
    cache_creation_input_tokens: undefined,
  };

  console.log(
    `[${params.specialistName ?? "specialist"}] FAILOVER ${result.model} ` +
      `church=${params.churchId ?? "?"} in=${usage.input_tokens} out=${usage.output_tokens}`,
  );

  return { text, usage, stopReason: "end_turn" };
}

export async function callSpecialist(
  params: SpecialistCallParams,
): Promise<SpecialistCallResult> {
  try {
    return await callAnthropicSpecialist(params);
  } catch (err) {
    if (params.failoverEnabled && isContentFilterError(err)) {
      console.warn(
        `[${params.specialistName ?? "specialist"}] anthropic content-filter sustained after retry, falling back to Gemini`,
      );
      return await callGeminiFailover(params);
    }
    throw err;
  }
}
