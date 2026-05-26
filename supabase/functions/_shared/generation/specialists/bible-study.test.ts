// Tests for the bible-study specialist prompt structure.
//
// Run: deno test --allow-env --allow-net --allow-read supabase/functions/_shared/generation/specialists/bible-study.test.ts
//
// Background: bible-study was intermittently tripping Anthropic's output content
// filter on certain sermons while devotional and other specialists passed cleanly.
// Root cause was the prompt asking for 5 open-ended reflection questions across
// 2,500 tokens with "10-minute group discussion" framing — structure and language
// that primed the classifier. These tests guard against regression toward that
// shape: they assert the new templated sections are present and the old priming
// phrases are absent.

import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { TASK_SYSTEM } from "./bible-study.ts";

Deno.test("bible-study prompt: contains the Passage in Context section", () => {
  assertStringIncludes(TASK_SYSTEM, "## Passage in Context");
});

Deno.test("bible-study prompt: contains the Observation Questions section", () => {
  assertStringIncludes(TASK_SYSTEM, "## Observation Questions");
});

Deno.test("bible-study prompt: contains the Application Prompts section", () => {
  assertStringIncludes(TASK_SYSTEM, "## Application Prompts");
});

Deno.test("bible-study prompt: contains the Closing Prayer Cue section", () => {
  assertStringIncludes(TASK_SYSTEM, "## Closing Prayer Cue");
});

Deno.test("bible-study prompt: asks for three observation questions, not five", () => {
  const observationCount = (TASK_SYSTEM.match(/observation question/gi) ?? []).length;
  assert(observationCount >= 1, "expected the prompt to mention observation questions");
  assert(
    !/5 reflection questions/i.test(TASK_SYSTEM),
    "prompt still references the old 5-question shape",
  );
});

// Priming phrases that previously appeared in the bible-study prompt and that
// the investigation traced to the content-filter trips. Each must be absent.
const PROHIBITED_PRIMING_PHRASES = [
  "10 minutes",
  "10-minute",
  "group discussion",
  "target application",
  "in your own words",
  "Practical application steps",
  "Discussion content",
];

for (const phrase of PROHIBITED_PRIMING_PHRASES) {
  Deno.test(`bible-study prompt: priming phrase removed — "${phrase}"`, () => {
    assertEquals(
      TASK_SYSTEM.toLowerCase().includes(phrase.toLowerCase()),
      false,
      `prompt still contains classifier-priming phrase "${phrase}"`,
    );
  });
}

Deno.test("bible-study prompt: scripture constraint is framed positively", () => {
  // The negative form ("Do not add new references, do not pull in 'context' verses")
  // used to live in the prompt; rewritten as a positive instruction so we don't
  // prime the classifier with prohibition stacks (per the team's prompt-architecture
  // guidance: subtract language, instruct positively).
  assertStringIncludes(
    TASK_SYSTEM,
    "Use only the scripture references that appear in the brief's scriptureReferences",
  );
  assertEquals(
    /Do not add new references/i.test(TASK_SYSTEM),
    false,
    "prompt still uses the old negative scripture constraint",
  );
});
