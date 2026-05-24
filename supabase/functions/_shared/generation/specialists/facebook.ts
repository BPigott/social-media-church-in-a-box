import { createSocialSpecialist } from "./_shared.ts";

const TASK_SYSTEM = `# Facebook post
Write ONE Facebook post.

Rules:
- Length: 40-80 words MAXIMUM (count words; if over 80, trim it down)
- Tone: conversational and engaging
- Structure: hook → body → CTA, with double line breaks between paragraphs
- Break into 2-3 short paragraphs; avoid walls of text
- Include a question, CTA, or thought-provoking statement
- Hashtags: 1-3 relevant ones
- NO emojis anywhere in the output
- If a Facebook social handle is provided, you may mention "Find us at facebook.com/[handle]" naturally; do not force it
- Output: the post text only. No preamble, no labels, no commentary.`;

export const runFacebookSpecialist = createSocialSpecialist({
  platform: "facebook",
  taskSystem: TASK_SYSTEM,
  maxTokens: 600,
  temperature: 0.8,
});
