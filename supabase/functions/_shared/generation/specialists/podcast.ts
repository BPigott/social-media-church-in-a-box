import type { EditorialBrief } from "../director.ts";
import { callSpecialist } from "../style-guide-cache.ts";
import {
  buildSpecialistUserPrompt,
  type SpecialistContext,
  type SpecialistResult,
} from "./_shared.ts";

const TASK_SYSTEM = `# Podcast Episode Description

Write a podcast episode description of 150-250 words based on the editorial brief.

Tone: conversational, inviting, accessible. Write as if describing the episode to a friend. Avoid churchy jargon.

Output format — use this EXACT structure:

**Episode Title:** [Compelling episode title that hooks listeners]

**Episode Description:**
[Opening hook/teaser sentence that creates curiosity — 1-2 sentences]

[Key topics and themes covered in this episode — 2-3 sentences summarising what listeners will learn or be challenged by]

[Call-to-listen: why this episode matters and what listeners will take away — 1-2 sentences]

**Tags:** [3-5 relevant podcast tags, comma-separated]

Rules:
- Total length: 150-250 words for the description section
- Output: the description only. No preamble, no commentary.`;

export async function runPodcastSpecialist(
  brief: EditorialBrief,
  ctx: SpecialistContext,
): Promise<SpecialistResult> {
  const { text, usage } = await callSpecialist({
    churchId: ctx.churchId,
    specialistName: "podcast",
    styleGuide: ctx.styleGuide,
    taskSystem: TASK_SYSTEM,
    userPrompt: buildSpecialistUserPrompt(brief, ctx),
    maxTokens: 1200,
    temperature: 0.7,
  });
  return { text: text.trim(), usage };
}
