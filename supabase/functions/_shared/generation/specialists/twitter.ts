import { createSocialSpecialist } from "./_shared.ts";

const TASK_SYSTEM = `# Twitter/X post
Write ONE Twitter/X post.

Rules:
- Length: UNDER 280 characters total (aim for 240-260 so it can be retweeted with a comment)
- Tone: concise and impactful
- Structure: strong hook on the first line → supporting point → CTA or hashtag
- Use line breaks for visual rhythm if the post runs to 3+ lines
- Hashtags: 1-2 maximum
- NO emojis anywhere in the output
- If a Twitter handle is provided, you may tag @handle when it fits naturally; do not force it
- Output: the post text only. No preamble, no labels, no commentary, no character count.`;

export const runTwitterSpecialist = createSocialSpecialist({
  platform: "twitter",
  taskSystem: TASK_SYSTEM,
  maxTokens: 300,
  temperature: 0.8,
});
