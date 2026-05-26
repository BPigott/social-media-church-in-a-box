import type { EditorialBrief } from "../director.ts";
import { callSpecialist } from "../style-guide-cache.ts";
import {
  buildSpecialistUserPrompt,
  type SpecialistContext,
  type SpecialistResult,
} from "./_shared.ts";

export const TASK_SYSTEM = `# Bible Study Guide

Write a Bible Study Guide based on the editorial brief, following the structure exactly.

Scripture handling:
- Use only the scripture references that appear in the brief's scriptureReferences.
- For each scripture, use the NIV text exactly as provided in the brief. If the brief does not include the NIV text for a reference, omit the verse text and write a one-sentence summary of what the passage covers.

Focus and framing:
- Build the study around the constructive, hopeful application of the brief's themes. If the brief alludes to a difficult season in someone's life, refer to it abstractly (e.g. "a season of loss") without historical reconstruction.

Output format — use this EXACT markdown structure (omit any Scripture Reference section that has no entries):

# Bible Study Guide

## Passage in Context
80 to 120 words. A preacher's paraphrase of what the passage covers and the sermon's reading of it. Voice-anchored to the church's style guide. Plain prose, no bullets.

## Scripture References

### [Reference 1 e.g. Mark 6:30-44]
**[Book Chapter:Verse]** (NIV)
[NIV text if provided in brief; otherwise a one-sentence summary of what the passage covers]

[Repeat for each reference in the brief, no more and no fewer]

## Observation Questions
1. [One sentence, max 20 words. Text-anchored: what does the passage say?]
2. [One sentence, max 20 words.]
3. [One sentence, max 20 words.]

## Application Prompts
1. [One sentence, max 25 words. How does this land for the group this week?]
2. [One sentence, max 25 words.]
3. [One sentence, max 25 words.]

## Closing Prayer Cue
40 to 60 words. A suggested prayer direction for the small group, written as instructions to the leader (e.g. "Invite the group to pray for...").

Formatting rules:
- Markdown headers (#, ##, ###) only, no hashtags for anything else
- Do not use ** for emphasis other than the Scripture reference label as shown
- Do not use *italic*
- Plain text with proper paragraph breaks
- Output: the guide only, no preamble, no commentary.`;

export async function runBibleStudySpecialist(
  brief: EditorialBrief,
  ctx: SpecialistContext,
): Promise<SpecialistResult> {
  const { text, usage } = await callSpecialist({
    churchId: ctx.churchId,
    specialistName: "bible-study",
    styleGuide: ctx.styleGuide,
    taskSystem: TASK_SYSTEM,
    userPrompt: buildSpecialistUserPrompt(brief, ctx),
    maxTokens: 1500,
    temperature: 0.6,
  });
  return { text: text.trim(), usage };
}
