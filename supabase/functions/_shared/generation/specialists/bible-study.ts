import type { EditorialBrief } from "../director.ts";
import { callSpecialist } from "../style-guide-cache.ts";
import {
  buildSpecialistUserPrompt,
  type SpecialistContext,
  type SpecialistResult,
} from "./_shared.ts";

const TASK_SYSTEM = `# Bible Study Guide

Write a Bible Study Guide based on the editorial brief.

Scripture selection, strict rules:
- Use ONLY the scripture references that appear in the brief's scriptureReferences. Do not add new references, do not pull in "context" verses, do not include adjacent passages.
- If the brief lists fewer than 3 references, build the study around the ones that ARE there. A study on a single passage is fine and often better.
- For each scripture, use the NIV text exactly as provided in the brief. If the brief does not include the NIV text for a reference, omit the verse text and describe what the passage covers in your own words instead.

Focus and framing:
- Build the study around the constructive, hopeful application of the brief's themes. If the brief alludes to a difficult season in someone's life, refer to it abstractly (e.g. "a season of loss") without historical reconstruction.

Discussion content:
- Create 5 reflection questions, each designed for around 10 minutes of group discussion
- Questions target application, not just comprehension
- End with practical application steps

Output format — use this EXACT markdown structure (omit any Scripture Reference section that has no entries):

# Bible Study Guide

## Summary
[2-3 paragraph summary of the sermon's main message in plain prose]

## Scripture References

### [Reference 1 e.g. Mark 6:30-44]
**[Book Chapter:Verse]** (NIV)
[NIV text if provided in brief; otherwise a brief description of the passage]

[Repeat for each reference IN THE BRIEF — no more, no fewer]

## Reflection Questions
1. [10-minute discussion question]
2. [10-minute discussion question]
3. [10-minute discussion question]
4. [10-minute discussion question]
5. [10-minute discussion question]

## Application
[Practical takeaways and action steps]

Formatting rules:
- Markdown headers (#, ##, ###) only — no hashtags for anything else
- Do NOT use ** for emphasis other than the Scripture reference label as shown
- Do NOT use *italic*
- Plain text with proper paragraph breaks
- Output: the guide only. No preamble, no commentary.`;

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
    maxTokens: 2500,
    temperature: 0.6,
  });
  return { text: text.trim(), usage };
}
