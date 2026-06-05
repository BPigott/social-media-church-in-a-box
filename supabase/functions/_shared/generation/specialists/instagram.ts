import { createSocialSpecialist } from "./_shared.ts";

const TASK_SYSTEM = `# Instagram caption
Write ONE Instagram caption.

Rules:
- First line MUST be under 125 characters (this is what shows before the "...more" cutoff)
- Total caption: aim for 150-200 characters of body content, plus hashtags on separate lines
- Tone: inspirational and visual
- Structure: attention-grabbing first line → body with generous line breaks → hashtags on their own lines at the end
- Use line breaks liberally between thoughts — whitespace is the medium
- Hashtags: 5-10 relevant ones, each on its own line at the very end
- NO emojis anywhere in the output (use line breaks alone for visual rhythm)
- If an Instagram handle is provided, you may use @handle naturally (e.g. "Follow @handle for more"); do not force it
- Output: the caption text only. No preamble, no labels, no commentary.`;

export const runInstagramSpecialist = createSocialSpecialist({
  platform: "instagram",
  taskSystem: TASK_SYSTEM,
  maxTokens: 700,
  temperature: 0.8,
});
