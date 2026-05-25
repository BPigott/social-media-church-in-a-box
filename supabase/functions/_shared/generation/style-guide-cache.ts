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

import type { AnthropicUsage } from "./director.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

// Stable across all churches and all specialists — lives at the top of the
// cached prefix. Keep this block byte-stable to maximise cache hit rate.
export const SHARED_VOICE_BLOCK = `# Content Safety
- Prohibited: erotic, sexual, or explicit content
- Prohibited: racist, discriminatory, or hateful language
- Prohibited: gambling, betting, or casino references
- Prohibited: blasphemous, irreverent, or mocking references to God, Jesus, the Holy Spirit, Scripture
- Prohibited: violence, profanity, offensive language
- Required: respectful tone, aligned with Christian values, accurate Scripture
- If input material contains anything inappropriate, filter it out and refuse to generate based on it

# Writing Style (these rules OVERRIDE any contrary patterns in the style guide examples below)
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
export function stripDashes(raw: string): string {
  return raw
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*–\s*/g, ", ");
}

// Back-compat alias used inside buildCachedPrefix below.
export const sanitiseStyleGuide = stripDashes;

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

export async function callSpecialist(
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

  // Single retry on 429 to ride out brief concurrent-connection contention.
  // Orchestrator-level throttling is the primary defence; this is a safety net.
  let response: Response;
  let errorText = "";
  for (let attempt = 0; attempt < 2; attempt++) {
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
    if (!isRateLimit || attempt === 1) {
      throw new Error(
        `[${params.specialistName ?? "specialist"}] Anthropic API ${response.status}: ${errorText}`,
      );
    }
    console.warn(
      `[${params.specialistName ?? "specialist"}] 429 rate-limited, retrying in 1.5s`,
    );
    await new Promise((r) => setTimeout(r, 1500));
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
