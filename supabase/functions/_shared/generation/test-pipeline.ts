// Local pipeline runner — calls director + all specialists against a fixture
// sermon and the Leicester Vineyard style guide. Exercises the production
// 16-call fan-out (postsPerPlatform=3 × 4 social + 4 long-form) through the
// same max-4-concurrent throttle the orchestrator uses, so this script
// validates the concurrency fix end-to-end.
//
// Run:
//   ANTHROPIC_API_KEY=sk-ant-... \
//     deno run --allow-env --allow-net --allow-read \
//     supabase/functions/_shared/generation/test-pipeline.ts
//
// Optional:
//   PIPELINE_TRANSCRIPT=/path/to/sermon.txt  use a real LV sermon
//   PIPELINE_POSTS_PER_PLATFORM=3            override variations per platform

import { director } from "./director.ts";
import { runFacebookSpecialist } from "./specialists/facebook.ts";
import { runInstagramSpecialist } from "./specialists/instagram.ts";
import { runTikTokSpecialist } from "./specialists/tiktok.ts";
import { runTwitterSpecialist } from "./specialists/twitter.ts";
import { runExecutiveSummarySpecialist } from "./specialists/executive-summary.ts";
import { runBibleStudySpecialist } from "./specialists/bible-study.ts";
import { runDevotionalSpecialist } from "./specialists/devotional.ts";
import { runPodcastSpecialist } from "./specialists/podcast.ts";
import type { SpecialistContext, SpecialistResult } from "./specialists/_shared.ts";

const POSTS_PER_PLATFORM = Number(Deno.env.get("PIPELINE_POSTS_PER_PLATFORM") ?? "3");
const SPECIALIST_CONCURRENCY = 4;

// Mirrors the runWithLimit helper in generate-social-posts/index.ts so this
// script tests the same throttling behaviour the production orchestrator uses.
async function runWithLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  const workerCount = Math.min(Math.max(1, limit), tasks.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

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

  // === Build 16 specialist thunks (12 social + 4 long-form) ===
  type Call = { key: string; start: () => Promise<SpecialistResult> };
  const SOCIAL_SPECS: Record<string, (b: typeof brief, c: SpecialistContext) => Promise<SpecialistResult>> = {
    facebook: runFacebookSpecialist,
    instagram: runInstagramSpecialist,
    tiktok: runTikTokSpecialist,
    twitter: runTwitterSpecialist,
  };
  const calls: Call[] = [];
  for (const [platform, spec] of Object.entries(SOCIAL_SPECS)) {
    for (let i = 0; i < POSTS_PER_PLATFORM; i++) {
      calls.push({ key: `social:${platform}:${i}`, start: () => spec(brief, ctx) });
    }
  }
  calls.push({ key: "executiveSummary", start: () => runExecutiveSummarySpecialist(brief, ctx) });
  calls.push({ key: "bibleStudy", start: () => runBibleStudySpecialist(brief, ctx) });
  calls.push({ key: "devotional", start: () => runDevotionalSpecialist(brief, ctx) });
  calls.push({ key: "podcast", start: () => runPodcastSpecialist(brief, ctx) });

  console.log(`\nDispatching ${calls.length} specialist calls (max ${SPECIALIST_CONCURRENCY} concurrent, postsPerPlatform=${POSTS_PER_PLATFORM})`);
  const sStart = Date.now();
  const settled = await runWithLimit(calls.map(c => c.start), SPECIALIST_CONCURRENCY);
  const elapsedMs = Date.now() - sStart;

  // === Aggregate, compacting social arrays (no nulls) ===
  const socialResults: Record<string, string[]> = {};
  const longFormResults: Record<string, SpecialistResult> = {};
  const failures: Array<{ key: string; reason: string }> = [];
  const usagesForCost: Array<readonly [string, SpecialistResult["usage"]]> = [["director", dUsage]];

  for (let i = 0; i < settled.length; i++) {
    const call = calls[i];
    const r = settled[i];
    if (r.status === "rejected") {
      const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
      failures.push({ key: call.key, reason });
      continue;
    }
    usagesForCost.push([call.key, r.value.usage]);
    if (call.key.startsWith("social:")) {
      const [, platform] = call.key.split(":");
      (socialResults[platform] ??= []).push(r.value.text);
    } else {
      longFormResults[call.key] = r.value;
    }
  }

  console.log(`Specialists completed in ${elapsedMs}ms (concurrency=${SPECIALIST_CONCURRENCY}).`);
  console.log(`  Successes: ${settled.length - failures.length} / ${settled.length}`);
  if (failures.length > 0) {
    console.log(`  Failures:`);
    for (const f of failures) console.log(`    - ${f.key}: ${f.reason.slice(0, 160)}`);
  }

  // === Print sample output per platform/type ===
  for (const platform of Object.keys(SOCIAL_SPECS)) {
    const texts = socialResults[platform] ?? [];
    divider(`${platform.toUpperCase()} (${texts.length} variations)`);
    if (texts.length === 0) {
      console.log("  [no successful variations]");
      continue;
    }
    texts.forEach((t, i) => {
      console.log(`\n--- variation ${i + 1} ---`);
      console.log(t);
    });
  }
  for (const key of ["executiveSummary", "bibleStudy", "devotional", "podcast"]) {
    divider(key.toUpperCase());
    console.log(longFormResults[key]?.text ?? "[failed]");
  }

  // === Usage + cost ===
  divider("USAGE & COST");
  let totalIn = 0, totalOut = 0, totalCacheRead = 0, totalCacheWrite = 0;
  for (const [name, u] of usagesForCost) {
    const cacheR = u.cache_read_input_tokens ?? 0;
    const cacheW = u.cache_creation_input_tokens ?? 0;
    console.log(`  ${name.padEnd(24)} in=${String(u.input_tokens).padStart(5)} out=${String(u.output_tokens).padStart(5)} cache_read=${String(cacheR).padStart(5)} cache_write=${String(cacheW).padStart(5)}`);
    totalIn += u.input_tokens;
    totalOut += u.output_tokens;
    totalCacheRead += cacheR;
    totalCacheWrite += cacheW;
  }
  // Haiku 4.5: $1/M in, $5/M out, $1.25/M cache_write, $0.10/M cache_read
  const cost = (totalIn / 1e6) * 1.0 + (totalOut / 1e6) * 5.0 + (totalCacheWrite / 1e6) * 1.25 + (totalCacheRead / 1e6) * 0.1;
  console.log(`\n  TOTAL                in=${totalIn} out=${totalOut} cache_read=${totalCacheRead} cache_write=${totalCacheWrite}`);
  console.log(`  Estimated cost (single run): $${cost.toFixed(5)}`);
  console.log(`  Wall time: ${elapsedMs}ms`);

  // === Concurrency-fix assertions ===
  divider("CONCURRENCY FIX CHECKS");
  let allChecksPassed = true;
  for (const platform of Object.keys(SOCIAL_SPECS)) {
    const texts = socialResults[platform] ?? [];
    const hasNulls = texts.some(t => t == null);
    const ok = !hasNulls;
    if (!ok) allChecksPassed = false;
    console.log(`  ${platform.padEnd(12)} variations=${texts.length}/${POSTS_PER_PLATFORM} nulls=${hasNulls ? "YES (BUG)" : "no"} ${ok ? "✓" : "✗"}`);
  }
  console.log(`  Wall time under 30s:    ${elapsedMs < 30000 ? "✓" : "✗"} (${elapsedMs}ms)`);
  console.log(`  All 16 calls succeeded: ${failures.length === 0 ? "✓" : `✗ (${failures.length} failed)`}`);

  // === Quality sanity checks ===
  divider("QUALITY CHECKS");
  const allOutputs = [
    ...Object.values(socialResults).flat(),
    ...Object.values(longFormResults).map(r => r.text),
  ].join("\n");
  const dashCount = (allOutputs.match(/[—–]/g) ?? []).length;
  console.log(`  Em/en dashes in output: ${dashCount} ${dashCount === 0 ? "✓" : "✗ (style-guide-cache stripDashes should keep this at 0)"}`);
  console.log(`  Past-tense check: look at executive summary above and confirm it reads as recap, not preview`);

  if (!allChecksPassed || failures.length > 0) {
    console.error("\nOne or more concurrency-fix checks failed. Inspect output above before redeploying.");
    Deno.exit(2);
  }
}

main().catch(err => {
  console.error("Pipeline test failed:", err);
  Deno.exit(1);
});
