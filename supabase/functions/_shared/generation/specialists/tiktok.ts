import { createSocialSpecialist } from "./_shared.ts";

const TASK_SYSTEM = `# TikTok caption
Write ONE TikTok caption.

Rules:
- Total length: UNDER 150 characters
- Tone: authentic, relatable, conversational — sounds like a real person, not a brand
- Structure: each line should land like its own beat — line breaks between thoughts for rhythm
- Hashtags: 3-5 (mix of trending and niche)
- NO emojis anywhere in the output
- If a TikTok handle is provided, you may reference @handle naturally; do not force it
- Output: the caption text only. No preamble, no labels, no commentary.`;

export const runTikTokSpecialist = createSocialSpecialist({
  platform: "tiktok",
  taskSystem: TASK_SYSTEM,
  maxTokens: 400,
  temperature: 0.8,
});
