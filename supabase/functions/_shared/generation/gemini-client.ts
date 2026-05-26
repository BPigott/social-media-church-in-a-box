// Gemini API client used as a failover when Anthropic refuses a specialist
// call with a content-filter 400. Not used on the happy path.
//
// Direct Google AI Studio API (no OpenRouter): the generativelanguage.googleapis.com
// endpoint reads GOOGLE_AI_API_KEY from the function environment. The key
// is set via `supabase secrets set GOOGLE_AI_API_KEY=...` and is the same
// key used by Bob's excalidraw skill locally.

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Default failover model. Chosen after a side-by-side smoke test against
// gemini-3.1-pro-preview on the "Being a fool for Jesus" content category:
// quality was indistinguishable, Flash was ~4x cheaper and ~30% faster.
// Override via GEMINI_FAILOVER_MODEL env var if needed (no redeploy required).
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export interface GeminiCallParams {
  // The combined system prompt. Gemini doesn't support Anthropic-style cache
  // breakpoints, so the caller concatenates cached_prefix + task_system here.
  system: string;
  user: string;
  // The Anthropic-style visible output ceiling. We multiply internally to leave
  // room for Gemini 3.x's invisible "thinking" tokens.
  maxTokens: number;
  temperature?: number;
}

export interface GeminiCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export async function callGemini(params: GeminiCallParams): Promise<GeminiCallResult> {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY not configured for Gemini failover");
  }

  const model = Deno.env.get("GEMINI_FAILOVER_MODEL") ?? DEFAULT_GEMINI_MODEL;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  // Gemini 3.x spends invisible tokens on chain-of-thought before producing
  // visible output. The smoke test showed our 1500-token visible budget
  // needs ~4x headroom to avoid mid-sentence truncation.
  const generationBudget = Math.max(params.maxTokens * 4, 4000);

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: params.system }] },
    contents: [{ role: "user", parts: [{ text: params.user }] }],
    generationConfig: {
      temperature: params.temperature ?? 0.6,
      maxOutputTokens: generationBudget,
    },
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const finishReason: string = candidate?.finishReason ?? "UNKNOWN";

  if (finishReason === "SAFETY") {
    throw new Error(`Gemini blocked by safety filter (failover failed)`);
  }

  const parts = candidate?.content?.parts ?? [];
  const text = parts.map((p: { text?: string }) => p.text ?? "").join("").trim();

  if (!text) {
    throw new Error(`Gemini returned no visible text (finishReason=${finishReason})`);
  }

  return {
    text,
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    model,
  };
}
