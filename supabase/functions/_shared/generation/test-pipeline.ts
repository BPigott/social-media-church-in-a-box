// Local pipeline runner — calls director + all 8 specialists against a fixture
// sermon and the Leicester Vineyard style guide. Prints every output so you can
// eyeball quality before deploying to production.
//
// Run:
//   ANTHROPIC_API_KEY=sk-ant-... \
//     deno run --allow-env --allow-net --allow-read \
//     supabase/functions/_shared/generation/test-pipeline.ts
//
// Optional: PIPELINE_TRANSCRIPT=/path/to/sermon.txt to use a real LV sermon.

import { director } from "./director.ts";
import { runFacebookSpecialist } from "./specialists/facebook.ts";
import { runInstagramSpecialist } from "./specialists/instagram.ts";
import { runTikTokSpecialist } from "./specialists/tiktok.ts";
import { runTwitterSpecialist } from "./specialists/twitter.ts";
import { runExecutiveSummarySpecialist } from "./specialists/executive-summary.ts";
import { runBibleStudySpecialist } from "./specialists/bible-study.ts";
import { runDevotionalSpecialist } from "./specialists/devotional.ts";
import { runPodcastSpecialist } from "./specialists/podcast.ts";
import type { SpecialistContext } from "./specialists/_shared.ts";

const FIXTURE_SERMON = `
Good morning church. This Sunday we're in Mark chapter 6, the feeding of the five thousand.
Jesus has just heard that John the Baptist has been killed. He's grieving. And what does
he do? He gets in a boat to go to a quiet place. He needs rest. He needs space. But the
crowds follow him on foot around the lake — and when he lands, instead of pushing them
away, the text says he had compassion on them. Because they were like sheep without a
shepherd.

Here's what I want you to notice. Jesus is exhausted. Jesus is grieving. And he still
shepherds them. He still feeds them. Five loaves and two fish. Twelve baskets left over.

We live in a hurry-sick culture. We treat rest like a luxury and exhaustion like a
badge. But Jesus shows us a third way: he rests when he can, and when compassion calls,
he answers from a deep enough well that there's still twelve baskets left over.

So here's the invitation this morning. Where in your life are you running on empty?
Where is hurry stealing your capacity to notice the sheep around you? And what would
it look like — this week — to come to Jesus and let him fill your basket first?
`.trim();

const STYLE_GUIDE_PATH = "Leicester Vineyard-style-guide-UPDATED.md";

function divider(title: string): void {
  console.log("\n" + "═".repeat(72));
  console.log(`  ${title}`);
  console.log("═".repeat(72));
}

async function main(): Promise<void> {
  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    console.error("ANTHROPIC_API_KEY not set. Re-run with the key as an env var.");
    Deno.exit(1);
  }

  const transcriptPath = Deno.env.get("PIPELINE_TRANSCRIPT");
  const transcript = transcriptPath
    ? await Deno.readTextFile(transcriptPath)
    : FIXTURE_SERMON;
  const styleGuide = await Deno.readTextFile(STYLE_GUIDE_PATH);
  console.log(`Transcript: ${transcript.length} chars (${transcriptPath ?? "fixture"})`);
  console.log(`Style guide: ${styleGuide.length} chars`);

  // === Director ===
  divider("DIRECTOR");
  const dStart = Date.now();
  const { brief, usage: dUsage } = await director({
    transcript,
    isEventMode: false,
    speakerName: "Bob Pigott",
    churchName: "Leicester Vineyard",
  });
  console.log(`Director: ${Date.now() - dStart}ms, in=${dUsage.input_tokens} out=${dUsage.output_tokens} cache_write=${dUsage.cache_creation_input_tokens ?? 0}`);
  console.log("\nThemes:");
  brief.themes.forEach(t => console.log(`  - ${t}`));
  console.log("\nHook angles:");
  brief.hookAngles.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
  console.log("\nScripture references:");
  brief.scriptureReferences.forEach(s => console.log(`  - ${s.reference}`));
  console.log("\nVerbatim moments:");
  brief.verbatimMoments.forEach(v => console.log(`  - "${v}"`));
  console.log("\nTone notes:");
  console.log(`  ${brief.toneNotes}`);
  console.log("\nSuggested CTAs:");
  brief.suggestedCTAs.forEach(c => console.log(`  - ${c}`));

  // === Specialists in parallel ===
  const ctx: SpecialistContext = {
    styleGuide,
    churchId: "lv-test",
    churchName: "Leicester Vineyard",
    speakerName: "Bob Pigott",
    isEventMode: false,
  };

  const sStart = Date.now();
  const settled = await Promise.allSettled([
    runFacebookSpecialist(brief, ctx),
    runInstagramSpecialist(brief, ctx),
    runTikTokSpecialist(brief, ctx),
    runTwitterSpecialist(brief, ctx),
    runExecutiveSummarySpecialist(brief, ctx),
    runBibleStudySpecialist(brief, ctx),
    runDevotionalSpecialist(brief, ctx),
    runPodcastSpecialist(brief, ctx),
  ]);
  const names = ["facebook", "instagram", "tiktok", "twitter", "executiveSummary", "bibleStudy", "devotional", "podcast"] as const;
  const unwrap = (i: number) => {
    const r = settled[i];
    if (r.status === "fulfilled") return r.value;
    const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
    return { text: `[${names[i]} FAILED: ${reason}]`, usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } };
  };
  const [facebook, instagram, tiktok, twitter, executiveSummary, bibleStudy, devotional, podcast] = settled.map((_, i) => unwrap(i));
  const failures = settled.map((r, i) => r.status === "rejected" ? names[i] : null).filter(Boolean);
  console.log(`\nSpecialists completed in ${Date.now() - sStart}ms (parallel). Failures: ${failures.length === 0 ? "none" : failures.join(", ")}`);

  divider("FACEBOOK");
  console.log(facebook.text);
  divider("INSTAGRAM");
  console.log(instagram.text);
  divider("TIKTOK");
  console.log(tiktok.text);
  divider("TWITTER");
  console.log(twitter.text);
  divider("EXECUTIVE SUMMARY");
  console.log(executiveSummary.text);
  divider("BIBLE STUDY GUIDE");
  console.log(bibleStudy.text);
  divider("DEVOTIONAL");
  console.log(devotional.text);
  divider("PODCAST DESCRIPTION");
  console.log(podcast.text);

  // === Usage + cost ===
  divider("USAGE & COST");
  const allUsages = [
    ["director", dUsage],
    ["facebook", facebook.usage],
    ["instagram", instagram.usage],
    ["tiktok", tiktok.usage],
    ["twitter", twitter.usage],
    ["executive-summary", executiveSummary.usage],
    ["bible-study", bibleStudy.usage],
    ["devotional", devotional.usage],
    ["podcast", podcast.usage],
  ] as const;
  let totalIn = 0, totalOut = 0, totalCacheRead = 0, totalCacheWrite = 0;
  for (const [name, u] of allUsages) {
    const cacheR = u.cache_read_input_tokens ?? 0;
    const cacheW = u.cache_creation_input_tokens ?? 0;
    console.log(`  ${name.padEnd(20)} in=${String(u.input_tokens).padStart(5)} out=${String(u.output_tokens).padStart(5)} cache_read=${String(cacheR).padStart(5)} cache_write=${String(cacheW).padStart(5)}`);
    totalIn += u.input_tokens;
    totalOut += u.output_tokens;
    totalCacheRead += cacheR;
    totalCacheWrite += cacheW;
  }
  // Haiku 4.5: $1/M in, $5/M out, $1.25/M cache_write, $0.10/M cache_read
  const cost = (totalIn / 1e6) * 1.0 + (totalOut / 1e6) * 5.0 + (totalCacheWrite / 1e6) * 1.25 + (totalCacheRead / 1e6) * 0.1;
  console.log(`\n  TOTAL          in=${totalIn} out=${totalOut} cache_read=${totalCacheRead} cache_write=${totalCacheWrite}`);
  console.log(`  Estimated cost (single run): $${cost.toFixed(5)}`);
  console.log(`\n  Tip: on the SECOND run for the same church, cache_read should rise and cache_write should drop — that's the prompt cache working.`);

  // === Quality sanity checks ===
  divider("QUALITY CHECKS");
  const allOutputs = [facebook.text, instagram.text, tiktok.text, twitter.text, executiveSummary.text, bibleStudy.text, devotional.text, podcast.text].join("\n");
  const dashCount = (allOutputs.match(/[—–]/g) ?? []).length;
  console.log(`  Em/en dashes in output: ${dashCount} ${dashCount === 0 ? "✓" : "✗ (Phase 1 fix is meant to keep this at 0)"}`);
  console.log(`  Past-tense check: look at executive summary above and confirm it reads as recap, not preview`);
}

main().catch(err => {
  console.error("Pipeline test failed:", err);
  Deno.exit(1);
});
