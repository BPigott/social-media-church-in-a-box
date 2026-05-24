// Tests for director.ts.
//
// Run all tests:           deno test --allow-env --allow-net supabase/functions/_shared/generation/director.test.ts
// Live test only runs when ANTHROPIC_API_KEY is exported in the shell.

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  director,
  EditorialBriefSchema,
  type DirectorInput,
  type EditorialBrief,
} from "./director.ts";

// -- Schema-only tests (offline, always run) --------------------------------

Deno.test("EditorialBriefSchema: accepts a minimal valid brief", () => {
  const minimal: EditorialBrief = {
    themes: ["a", "b", "c"],
    scriptureReferences: [],
    hookAngles: ["h1", "h2", "h3"],
    suggestedCTAs: ["cta1", "cta2"],
    toneNotes: "warm and pastoral",
    verbatimMoments: [],
  };
  const parsed = EditorialBriefSchema.parse(minimal);
  assertEquals(parsed, minimal);
});

Deno.test("EditorialBriefSchema: rejects fewer than 3 themes", () => {
  const result = EditorialBriefSchema.safeParse({
    themes: ["only one"],
    scriptureReferences: [],
    hookAngles: ["h1", "h2", "h3"],
    suggestedCTAs: ["cta1", "cta2"],
    toneNotes: "warm",
    verbatimMoments: [],
  });
  assert(!result.success);
});

Deno.test("EditorialBriefSchema: rejects fewer than 2 CTAs", () => {
  const result = EditorialBriefSchema.safeParse({
    themes: ["a", "b", "c"],
    scriptureReferences: [],
    hookAngles: ["h1", "h2", "h3"],
    suggestedCTAs: ["cta1"],
    toneNotes: "warm",
    verbatimMoments: [],
  });
  assert(!result.success);
});

Deno.test("EditorialBriefSchema: scripture refs allow niv-less entries", () => {
  const parsed = EditorialBriefSchema.parse({
    themes: ["a", "b", "c"],
    scriptureReferences: [{ reference: "John 3:16" }],
    hookAngles: ["h1", "h2", "h3"],
    suggestedCTAs: ["cta1", "cta2"],
    toneNotes: "warm",
    verbatimMoments: [],
  });
  assertEquals(parsed.scriptureReferences.length, 1);
});

// -- Live integration tests (require ANTHROPIC_API_KEY) ---------------------

const liveKey = Deno.env.get("ANTHROPIC_API_KEY");
const liveTest = liveKey
  ? Deno.test
  : (name: string, _fn: () => unknown) => {
    Deno.test.ignore(name, () => {});
  };

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

liveTest("director: produces a valid brief from a real sermon transcript", async () => {
  const input: DirectorInput = {
    transcript: FIXTURE_SERMON,
    isEventMode: false,
    speakerName: "Bob Pigott",
    churchName: "Leicester Vineyard",
  };

  const { brief, usage } = await director(input);

  console.log("\n[director smoke test] brief themes:", brief.themes);
  console.log("[director smoke test] hook angles:", brief.hookAngles);
  console.log("[director smoke test] usage:", usage);

  // Schema validation already happens inside director(), but double-check key shape.
  assertExists(brief.themes);
  assert(brief.themes.length >= 3 && brief.themes.length <= 6);
  assert(brief.hookAngles.length >= 3 && brief.hookAngles.length <= 5);
  assert(brief.suggestedCTAs.length >= 2 && brief.suggestedCTAs.length <= 5);
  assertExists(brief.toneNotes);
  assert(brief.toneNotes.length > 0);

  // Mark 6 / feeding of the 5,000 should turn up somewhere.
  const briefText = JSON.stringify(brief).toLowerCase();
  assert(
    briefText.includes("mark") || briefText.includes("loaves") ||
      briefText.includes("feed") || briefText.includes("shepherd"),
    "expected brief to reference the sermon's actual content",
  );
});

liveTest("director: produces a valid brief in event mode", async () => {
  const input: DirectorInput = {
    isEventMode: true,
    churchName: "Leicester Vineyard",
    eventDetails: {
      eventName: "Alpha Course Spring 2026",
      eventDate: "2026-04-15",
      eventLocation: "Leicester Vineyard Centre",
      eventDescription:
        "A ten-week course exploring the Christian faith — for anyone curious, sceptical, or just hungry for something more. Free meal each week.",
      signupLink: "https://example.com/alpha",
    },
  };

  const { brief, usage } = await director(input);
  console.log("\n[director event-mode smoke test] themes:", brief.themes);
  console.log("[director event-mode smoke test] usage:", usage);

  assertEquals(brief.verbatimMoments.length, 0, "event mode should produce no verbatim quotes");
  assert(brief.themes.length >= 3);
});
