import type { EditorialBrief } from "../director.ts";
import { callSpecialist } from "../style-guide-cache.ts";
import {
  buildSpecialistUserPrompt,
  type SpecialistContext,
  type SpecialistResult,
} from "./_shared.ts";

const TASK_SYSTEM = `# Executive summary
Write an executive summary of the sermon (or event), 400-500 words.

Rules:
- Structure: opening theme → main points → practical application
- Write in third person about what was covered (e.g. "the sermon explored", "the message anchored on")
- Scripture: only cite scripture that actually appears in the brief's scriptureReferences; do not invent
- End with a line "Key Takeaways:" followed by 3-5 bullet points (using "- ", not asterisks)
- Plain text with proper paragraph breaks, no markdown headers
- Output: the summary text only. No preamble, no commentary, no JSON.`;

export async function runExecutiveSummarySpecialist(
  brief: EditorialBrief,
  ctx: SpecialistContext,
): Promise<SpecialistResult> {
  const { text, usage } = await callSpecialist({
    churchId: ctx.churchId,
    specialistName: "executive-summary",
    styleGuide: ctx.styleGuide,
    taskSystem: TASK_SYSTEM,
    userPrompt: buildSpecialistUserPrompt(brief, ctx),
    maxTokens: 1500,
    temperature: 0.7,
  });
  return { text: text.trim(), usage };
}
