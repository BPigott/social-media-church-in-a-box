import type { EditorialBrief } from "../director.ts";
import { callSpecialist } from "../style-guide-cache.ts";
import {
  buildSpecialistUserPrompt,
  type SpecialistContext,
  type SpecialistResult,
} from "./_shared.ts";

const TASK_SYSTEM = `# Daily Devotional, Blended Approach

Write a daily devotional based on the editorial brief, following the Blended Approach format exactly.

Approach:
- Extract the core spiritual truth from the brief
- Make it personal, practical, and Spirit-expectant
- Move the reader from information toward encounter with Jesus
- Tone: warm, relational (NOT "religious"), accessible language, story-driven, practical, hopeful

Focus and framing:
- Build the devotional around the constructive, hopeful application of the brief's themes. If the brief alludes to a difficult season in someone's life, refer to it abstractly (e.g. "a season of loss") without historical reconstruction.

Output format — use this EXACT structure:

# [Engaging Title]

**[Anchor Verse]** (Book Chapter:Verse)
[Full NIV text of the anchor verse]

**The Hook (Contemporary Observation)**
80 to 120 words. A relatable scene from present-day everyday life (a café queue, the school run, a work commute, watching TV, a moment with family, a friend's text, a holiday memory). It bridges the reader into the spiritual truth from a contemporary angle. Stay light and observational; the sermon's content belongs in "The Truth", not here.

**The Truth**
[Clear explanation of the spiritual truth and why it matters, grounded in the brief's themes]

**The Practice**
[One specific, actionable spiritual discipline for today, concrete and doable, not vague]

**Reflection**
[A single sharp question that cuts to the heart, personal, not theoretical]

Formatting rules:
- Use ** for the bold labels shown above (The Hook, The Truth, etc.) — that's the only bold permitted
- Anchor verse must come from the brief's scriptureReferences — do not invent
- Output: the devotional only. No preamble, no commentary.`;

export async function runDevotionalSpecialist(
  brief: EditorialBrief,
  ctx: SpecialistContext,
): Promise<SpecialistResult> {
  const { text, usage } = await callSpecialist({
    churchId: ctx.churchId,
    specialistName: "devotional",
    styleGuide: ctx.styleGuide,
    taskSystem: TASK_SYSTEM,
    userPrompt: buildSpecialistUserPrompt(brief, ctx),
    maxTokens: 2000,
    temperature: 0.5,
  });
  return { text: text.trim(), usage };
}
