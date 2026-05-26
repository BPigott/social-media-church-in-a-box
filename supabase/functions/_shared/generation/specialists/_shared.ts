// Shared scaffolding for Phase 2 specialists.
// Each specialist module composes its small task-system prompt + delegates the
// Anthropic call to callSpecialist (which handles cache_control on the church
// style guide).

import type { EditorialBrief, AnthropicUsage } from "../director.ts";
import { callSpecialist } from "../style-guide-cache.ts";

export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "twitter";

export interface EventDetails {
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  eventDescription?: string;
  signupLink?: string;
}

export interface SocialHandles {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
}

export interface SpecialistContext {
  styleGuide: string;
  churchId: string;
  churchName: string;
  speakerName?: string;
  seriesName?: string;
  seriesWeekNumber?: number;
  seriesTotalWeeks?: number;
  seriesDescription?: string;
  customCTA?: string;
  isEventMode: boolean;
  eventDetails?: EventDetails;
  socialHandles?: SocialHandles;
}

export interface SpecialistResult {
  text: string;
  usage: AnthropicUsage;
}

export function buildBriefSection(brief: EditorialBrief): string {
  const lines: string[] = ["# Editorial brief"];

  lines.push("\n## Themes (most central first)");
  for (const t of brief.themes) lines.push(`- ${t}`);

  if (brief.scriptureReferences.length > 0) {
    lines.push("\n## Scripture references");
    for (const s of brief.scriptureReferences) {
      lines.push(s.niv ? `- ${s.reference}: "${s.niv}"` : `- ${s.reference}`);
    }
  }

  lines.push("\n## Hook angles to draw from (pick one, don't blend)");
  brief.hookAngles.forEach((h, i) => lines.push(`${i + 1}. ${h}`));

  lines.push("\n## Tone");
  lines.push(brief.toneNotes);

  if (brief.verbatimMoments.length > 0) {
    lines.push("\n## Verbatim moments (use sparingly; if you quote, quote exactly)");
    for (const v of brief.verbatimMoments) lines.push(`- "${v}"`);
  }

  lines.push("\n## Suggested CTAs (use one of these if no custom CTA is set)");
  for (const c of brief.suggestedCTAs) lines.push(`- ${c}`);

  return lines.join("\n");
}

export function buildContextSection(ctx: SpecialistContext, platform?: SocialPlatform): string {
  const lines: string[] = ["# Context"];
  lines.push(`Church: ${ctx.churchName}`);
  if (ctx.speakerName) lines.push(`Speaker: ${ctx.speakerName}`);

  if (ctx.seriesName) {
    const week = ctx.seriesWeekNumber
      ? ` (week ${ctx.seriesWeekNumber}${ctx.seriesTotalWeeks ? ` of ${ctx.seriesTotalWeeks}` : ""})`
      : "";
    lines.push(`Series: "${ctx.seriesName}"${week}`);
    if (ctx.seriesDescription) lines.push(`Series theme: ${ctx.seriesDescription}`);
    lines.push(
      `Reference the series naturally and use the hashtag #${ctx.seriesName.replace(/[^a-zA-Z0-9]/g, "")} where appropriate.`,
    );
  }

  if (ctx.customCTA) {
    lines.push(`\nCustom CTA (use verbatim or near-verbatim): ${ctx.customCTA}`);
  }

  if (ctx.isEventMode && ctx.eventDetails) {
    const e = ctx.eventDetails;
    lines.push("\nMode: event promotion (forward-looking — this event is upcoming)");
    lines.push(`Event: ${e.eventName}`);
    if (e.eventDate) lines.push(`Date: ${e.eventDate}`);
    if (e.eventLocation) lines.push(`Location: ${e.eventLocation}`);
    if (e.eventDescription) lines.push(`Description: ${e.eventDescription}`);
    if (e.signupLink) lines.push(`Sign-up link: ${e.signupLink}`);
  } else {
    lines.push(
      "\nMode: sermon recap (past tense — this sermon has already been preached). " +
        'Use phrasings like "this Sunday we explored", "in this week\'s message". ' +
        'Never imply the sermon is upcoming.',
    );
  }

  if (platform && ctx.socialHandles?.[platform]) {
    lines.push(`\nSocial handle for ${platform}: ${ctx.socialHandles[platform]}`);
  }

  return lines.join("\n");
}

export function buildSpecialistUserPrompt(
  brief: EditorialBrief,
  ctx: SpecialistContext,
  platform?: SocialPlatform,
): string {
  return `${buildContextSection(ctx, platform)}\n\n${buildBriefSection(brief)}\n\n# Now write the requested content following the rules in the system prompt. Return ONLY the content — no preamble, no commentary, no JSON.`;
}

// Factory used by the 5 social specialists. They differ only in platform name
// and the task-system block (platform rules + length limits).
export interface SocialSpecialistConfig {
  platform: SocialPlatform;
  taskSystem: string;
  maxTokens: number;
  temperature?: number;
}

export function createSocialSpecialist(config: SocialSpecialistConfig) {
  return async function runSocialSpecialist(
    brief: EditorialBrief,
    ctx: SpecialistContext,
  ): Promise<SpecialistResult> {
    const { text, usage } = await callSpecialist({
      churchId: ctx.churchId,
      specialistName: config.platform,
      styleGuide: ctx.styleGuide,
      taskSystem: config.taskSystem,
      userPrompt: buildSpecialistUserPrompt(brief, ctx, config.platform),
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });
    return { text: text.trim(), usage };
  };
}
