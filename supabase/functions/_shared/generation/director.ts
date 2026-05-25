// Director — Phase 2 of the generation pipeline.
// Reads a sermon transcript (or event details) and produces a compact, structured
// EditorialBrief that downstream specialists work from. The director does NOT
// write final copy. It does NOT apply church voice — that is the specialists' job.
//
// Cache strategy: the director's system prompt is church-agnostic and stable,
// so it is marked cache_control: ephemeral. Repeated calls hit the cache.

import { z } from "https://esm.sh/zod@3.23.8";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export const ScriptureReferenceSchema = z.object({
  reference: z.string().min(1),
  niv: z.string().optional(),
});

// Truncate over-production rather than reject it. LLM output is non-deterministic;
// Claude occasionally returns 6 verbatim moments when the prompt asks for "up to 5",
// and a hard reject crashes the entire generation. Mins are now "minimum viable"
// rather than "quality floors": we accept a thin brief on a short sermon rather
// than crash the whole pipeline. Downstream specialists tolerate sparse briefs.
const cappedStringArray = (min: number, max: number) =>
  z.array(z.string().min(1)).min(min).transform((arr) => arr.slice(0, max));

export const EditorialBriefSchema = z.object({
  themes: cappedStringArray(1, 6),
  scriptureReferences: z.array(ScriptureReferenceSchema).min(0).transform((arr) => arr.slice(0, 8)),
  hookAngles: cappedStringArray(1, 5),
  suggestedCTAs: cappedStringArray(1, 5),
  toneNotes: z.string().min(1),
  verbatimMoments: cappedStringArray(0, 5),
});

export type EditorialBrief = z.infer<typeof EditorialBriefSchema>;

export interface EventDetailsInput {
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  eventDescription?: string;
  signupLink?: string;
}

export interface DirectorInput {
  // Transcript mode (sermon recap) vs event mode (forward-looking promotion).
  transcript?: string;
  isEventMode: boolean;
  eventDetails?: EventDetailsInput;

  speakerName?: string;
  seriesName?: string;
  seriesWeekNumber?: number;
  seriesTotalWeeks?: number;
  seriesDescription?: string;
  customCTA?: string;

  churchName: string;
}

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export interface DirectorOutput {
  brief: EditorialBrief;
  usage: AnthropicUsage;
}

const DIRECTOR_SYSTEM_PROMPT = `You are an editorial director for church sermon content. Your job is to read a sermon transcript (or event description) and produce a tight, structured editorial brief that downstream content specialists will use to write social media posts, devotionals, Bible study guides and podcast descriptions.

# What you produce
A single JSON object matching this exact schema. No prose, no commentary, no preamble. Just the JSON.

{
  "themes": [3-6 short phrases — the core ideas of the sermon, ordered from most central to least],
  "scriptureReferences": [{"reference": "Book Chapter:Verse", "niv": "the verse text in NIV if you know it accurately, omit if unsure"}],
  "hookAngles": [3-5 distinct opening angles a writer could use — these are NOT finished hooks, they are framings/entry points e.g. "the loneliness most leaders won't name", "what Mary's silence teaches us about hurry"],
  "suggestedCTAs": [2-5 calls-to-action that fit the sermon's invitation],
  "toneNotes": "one paragraph describing the emotional texture of the sermon — pastoral, prophetic, tender, urgent, playful, etc.",
  "verbatimMoments": [up to 5 short direct quotes (8-25 words each) from the transcript that are especially quotable — leave empty in event mode]
}

# Content safety
- Refuse to produce briefs for content that is erotic, racist, hateful, blasphemous, mocks Scripture, or promotes gambling/violence
- If the input contains such material, return a brief with themes: ["content rejected for safety"] and empty arrays elsewhere

# Quality rules
- Themes must be specific (e.g. "rest as resistance to hustle culture", NOT "rest is good")
- Hook angles must be distinct from each other — three flavours of the same idea is one angle, not three
- Verbatim moments must be EXACT quotes from the transcript, not paraphrases. If you cannot find quotable lines, return fewer or none — never invent
- Scripture references must be ones actually mentioned in the sermon — do not add Scripture the preacher didn't reference

# Output format
Return ONLY the JSON object. Start with { and end with }. No markdown fences, no "Here is the brief:", nothing else.`;

function buildUserPrompt(input: DirectorInput): string {
  const parts: string[] = [];

  parts.push(`# Church\n${input.churchName}`);

  if (input.seriesName) {
    const week = input.seriesWeekNumber
      ? ` (week ${input.seriesWeekNumber}${input.seriesTotalWeeks ? ` of ${input.seriesTotalWeeks}` : ""})`
      : "";
    parts.push(
      `# Series context\nSeries: "${input.seriesName}"${week}${
        input.seriesDescription ? `\nSeries theme: ${input.seriesDescription}` : ""
      }`,
    );
  }

  if (input.customCTA) {
    parts.push(`# Required call-to-action\nThe brief's suggestedCTAs MUST include this call-to-action verbatim or near-verbatim: "${input.customCTA}"`);
  }

  if (input.isEventMode && input.eventDetails) {
    const e = input.eventDetails;
    const eventLines = [
      `Event name: ${e.eventName}`,
      e.eventDate ? `Date: ${e.eventDate}` : null,
      e.eventLocation ? `Location: ${e.eventLocation}` : null,
      e.eventDescription ? `Description: ${e.eventDescription}` : null,
      e.signupLink ? `Sign-up link: ${e.signupLink}` : null,
    ].filter(Boolean).join("\n");
    parts.push(
      `# Mode: event promotion (forward-looking)\nThis is an upcoming event, not a past sermon. Build a brief that helps writers create excited, forward-looking promotional copy. verbatimMoments should be empty (there is no transcript to quote).\n\n## Event details\n${eventLines}`,
    );
  } else if (input.transcript) {
    parts.push(
      `# Mode: sermon recap (past tense)\nThis sermon has already been preached. The transcript below is a record of what was said. Themes, hooks and quotes should reflect the message as delivered.${
        input.speakerName ? `\nSpeaker: ${input.speakerName}` : ""
      }\n\n## Transcript\n${input.transcript}`,
    );
  } else {
    parts.push(
      `# Mode: church announcement\nNo transcript or event details were supplied. Produce a brief from the church/series context alone. verbatimMoments must be empty.`,
    );
  }

  parts.push(`Return the JSON brief now.`);
  return parts.join("\n\n");
}

function extractJSONObject(text: string): string {
  // Strip code fences if present, then find the outermost balanced { ... }.
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = stripped.indexOf("{");
  if (start === -1) throw new Error("director: no JSON object in response");

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return stripped.slice(start, i + 1);
    }
  }
  throw new Error("director: unbalanced JSON object in response");
}

export async function director(input: DirectorInput): Promise<DirectorOutput> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const userPrompt = buildUserPrompt(input);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      temperature: 0.5,
      system: [
        {
          type: "text",
          text: DIRECTOR_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`director: Anthropic API ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (data.stop_reason === "max_tokens") {
    console.warn("[director] truncated at max_tokens — brief may be incomplete");
  }

  const rawText: string = data?.content?.[0]?.text ?? "";
  if (!rawText) throw new Error("director: empty response from Anthropic");

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJSONObject(rawText));
  } catch (err) {
    console.error("[director] JSON parse failed. Raw response:", rawText.slice(0, 800));
    throw new Error(`director: failed to parse JSON brief: ${(err as Error).message}`);
  }

  const result = EditorialBriefSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[director] schema validation failed:", result.error.issues);
    throw new Error(`director: brief failed schema validation: ${result.error.message}`);
  }

  // Strip em/en dashes from the brief so specialists don't copy them downstream.
  // Safe round-trip: JSON.stringify → string replace → JSON.parse keeps structure intact.
  // Require whitespace on at least one side of the dash so verse ranges like
  // "Mark 6:30–44" (en dash, no surrounding whitespace) are preserved verbatim.
  const sanitisedBrief: EditorialBrief = JSON.parse(
    JSON.stringify(result.data)
      .replace(/(?:\s+—\s*|\s*—\s+)/g, ", ")
      .replace(/(?:\s+–\s*|\s*–\s+)/g, ", "),
  );

  const usage: AnthropicUsage = {
    input_tokens: data.usage?.input_tokens ?? 0,
    output_tokens: data.usage?.output_tokens ?? 0,
    cache_read_input_tokens: data.usage?.cache_read_input_tokens,
    cache_creation_input_tokens: data.usage?.cache_creation_input_tokens,
  };

  return { brief: sanitisedBrief, usage };
}
