/**
 * Captures screenshots for the ivangel "Your content library" video.
 *
 * Flow (all on /library, fully mocked):
 *   lib-list        — full history, date groups collapsed
 *   lib-search      — searching "grace" filters the list
 *   lib-expand      — a date group opened, item cards + platform badges
 *   lib-content     — a devotional section expanded, read in full (scroll)
 *   lib-variations  — a Facebook post with two variations, flicked to "2 of 2"
 *   lib-download    — the per-session Download menu open
 *
 * The /rest/v1/generated_content GET is stubbed with four dated rows. See
 * harness.ts for the session/route mechanism.
 *
 * Run with: npm run capture:library
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import type { Locator, Page } from "playwright";
import {
  CAPTURE_VIEWPORT,
  DEMO_CHURCH,
  fakeSession,
  storageKey,
  setupRoutes,
  protectedStubs,
  shot,
  elementShot,
  topOfPage,
  type RouteSpec,
} from "../lib/harness";
import type { Manifest } from "../../src/manifest";

const IVANGEL_URL = process.env.IVANGEL_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const STORAGE_KEY = storageKey(SUPABASE_URL);
const MANIFEST_PATH = resolve("src/storyboards/library.json");
const STYLE_GUIDE_FIXTURE = resolve("fixtures/style-guide.md");

const DEVOTIONAL =
  "# The Weight of a Small Kindness\n\n\"Carry each other's burdens, and in this way you will fulfil the law of Christ.\" — Galatians 6:2\n\nGrace doesn't always announce itself. Sometimes it arrives as a text message, a meal left on a doorstep, or five quiet minutes of listening to someone who simply needs to be heard.\n\nThis week, Pastor Rob reminded us that grace is never passive. It moves. It carries. It shows up on a Monday morning when no one is watching.\n\n**Reflect:** Who in your circle needs a small kindness today? What would it cost you to offer it — and what might it mean to them?\n\n**Pray:** Lord, make me quick to notice and slow to pass by. Let your grace move through my hands this week.";

const BIBLE_STUDY =
  "# Small Group Discussion Guide\n\n## This Week's Theme: Active Grace\n\n1. What does \"active grace\" look like in your workplace or neighbourhood this week?\n2. Read James 2:14–17. How does this passage reframe the sermon's central idea?\n3. Share a moment when someone extended grace to you unexpectedly. What changed?\n4. How might our church community practise this more intentionally this season?";

// Four dated generations (most recent first). Midday UTC keeps the local date stable.
const CONTENT_ROWS = [
  {
    id: "00000000-0000-4000-8000-0000000000a1",
    church_id: DEMO_CHURCH.id,
    sermon_transcript_id: null,
    platforms: ["facebook", "instagram", "tiktok", "twitter"],
    custom_cta: "Alpha course starts next Sunday",
    facebook_post: [
      "Grace isn't passive — it's the most active force in the universe. This Sunday we explored what it means to carry that love into Monday morning. 💛\n\nJoin us next Sunday at 10am. #SundaySermon #LeicesterVineyard",
      "\"The prodigal son didn't earn his way home — he was simply welcomed.\" That's the gospel in one sentence. 🙌\n\nCatch the full message on our website. #ActiveGrace #Leicester",
    ],
    instagram_post: [
      "Grace isn't passive — it's the most active force in the universe. 💛\n\nFull message on our website — link in bio. #SundaySermon #LeicesterVineyard #ActiveGrace",
    ],
    tiktok_post: [
      "When was the last time someone's grace changed everything for you? 🙏 #ChurchTok #Grace",
    ],
    twitter_post: [
      "\"Grace isn't passive — it's the most active force in the universe.\" 💛 Sunday's message in one sentence.",
    ],
    devotional: DEVOTIONAL,
    bible_study_guide: BIBLE_STUDY,
    output_language: "en",
    output_languages: ["en"],
    content_types: ["social_media", "bible_study", "devotional"],
    posts_per_platform: 2,
    generated_at: "2024-10-20T12:05:00Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a2",
    church_id: DEMO_CHURCH.id,
    sermon_transcript_id: null,
    platforms: ["facebook", "instagram"],
    custom_cta: "Harvest Sunday — bring tinned goods",
    facebook_post: [
      "Harvest Sunday is here. Bring what you can; leave with a fuller heart. Every tin, every packet, becomes someone's relief this week. 🌾",
    ],
    instagram_post: [
      "Harvest Sunday 🌾 Generosity is worship in motion. Bring a tin, bring a friend. #Harvest #LeicesterVineyard",
    ],
    tiktok_post: null,
    twitter_post: null,
    devotional:
      "# Enough, and to Spare\n\n\"Bring the whole tithe into the storehouse...\" — Malachi 3:10\n\nGenerosity rarely feels convenient. But the kingdom runs on open hands, not full cupboards.",
    bible_study_guide: null,
    output_language: "en",
    output_languages: ["en", "es"],
    facebook_post_english: [
      "Harvest Sunday is here. Bring what you can; leave with a fuller heart.",
    ],
    content_types: ["social_media", "devotional"],
    posts_per_platform: 1,
    generated_at: "2024-10-13T12:30:00Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a3",
    church_id: DEMO_CHURCH.id,
    sermon_transcript_id: null,
    platforms: [],
    custom_cta: null,
    facebook_post: null,
    instagram_post: null,
    tiktok_post: null,
    twitter_post: null,
    devotional:
      "# Be Still\n\n\"Be still, and know that I am God.\" — Psalm 46:10\n\nStillness is not the absence of activity; it is the presence of trust.",
    bible_study_guide: BIBLE_STUDY,
    output_language: "en",
    output_languages: ["en"],
    content_types: ["bible_study", "devotional"],
    posts_per_platform: 1,
    generated_at: "2024-10-06T12:15:00Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a4",
    church_id: DEMO_CHURCH.id,
    sermon_transcript_id: null,
    platforms: ["facebook", "instagram", "tiktok"],
    custom_cta: "New term of youth group",
    facebook_post: [
      "Youth group is back this Friday! Games, pizza, and a place to belong. Bring a mate. 🍕",
    ],
    instagram_post: [
      "Fridays just got better. Youth group is back 🙌 #YouthMinistry #Leicester",
    ],
    tiktok_post: ["POV: it's Friday and youth group is ON 🍕🙌 #ChurchYouth"],
    twitter_post: null,
    devotional:
      "# Raising Up\n\n\"Train up a child in the way they should go...\" — Proverbs 22:6",
    bible_study_guide: null,
    output_language: "en",
    output_languages: ["en"],
    content_types: ["social_media"],
    posts_per_platform: 1,
    generated_at: "2024-09-29T12:00:00Z",
  },
];

/** Scrolls an element to the vertical centre (instant), defeating the app's smooth-scroll. */
async function centerOn(page: Page, locator: Locator): Promise<void> {
  await locator.evaluate((el) => {
    document.documentElement.style.scrollBehavior = "auto";
    el.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await page.waitForTimeout(250);
}

async function main() {
  console.log(`🌐 App:      ${IVANGEL_URL}`);
  console.log(`🔑 Storage:  ${STORAGE_KEY}`);

  const styleGuide = readFileSync(STYLE_GUIDE_FIXTURE, "utf8");

  // generated_content GET returns our dated rows; place before protectedStubs.
  const specs: RouteSpec[] = [
    { match: "/rest/v1/generated_content", body: CONTENT_ROWS },
    ...protectedStubs(styleGuide),
  ];

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { ...CAPTURE_VIEWPORT },
    deviceScaleFactor: 2,
  });
  await context.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key as string, session as string);
    },
    [STORAGE_KEY, JSON.stringify(fakeSession())] as const,
  );
  await setupRoutes(context, specs);

  const page = await context.newPage();
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const setScreen = (id: string, screenshot: string) => {
    const beat = manifest.beats.find((b) => b.id === id);
    if (beat) {
      beat.screenshot = screenshot;
      beat.clickPoint = null;
    }
  };

  await page.goto(`${IVANGEL_URL}/library`, { waitUntil: "networkidle" });
  if (page.url().includes("/login") || page.url().includes("/onboarding")) {
    throw new Error(`Unexpected redirect to ${page.url()} — check session/church stubs.`);
  }

  // ── Beat: lib-list — date groups, collapsed ─────────────────────────────────
  await page.getByText("Content Library").waitFor({ timeout: 15_000 });
  await page.getByText(/\d+ generations?/).first().waitFor({ timeout: 10_000 });
  await topOfPage(page);
  setScreen("lib-list", await shot(page, "lib-list"));

  // ── Beat: lib-search — filter to "grace" ────────────────────────────────────
  const search = page.getByPlaceholder(/Search by keywords/i);
  await search.fill("grace");
  await page.waitForTimeout(500);
  await topOfPage(page);
  setScreen("lib-search", await shot(page, "lib-search"));
  await search.fill("");
  await page.waitForTimeout(300);

  // ── Beat: lib-expand — open the top date group ──────────────────────────────
  const firstGroup = page.getByRole("button", { name: /\d+ generations?/ }).first();
  await firstGroup.click();
  await page.waitForTimeout(500);
  // Wait for an item's content section to render (Daily Devotional appears in row 1).
  await page.getByText("Daily Devotional").first().waitFor({ timeout: 8_000 });
  await topOfPage(page);
  setScreen("lib-expand", await shot(page, "lib-expand"));

  // ── Beat: lib-content — expand the devotional, capture the item card tall ────
  const devotionalTrigger = page.getByText("Daily Devotional").first();
  await devotionalTrigger.click();
  await page.waitForTimeout(600);
  const itemCard = page.locator(".border-l-primary").first();
  const { screenshot: contentShot, aspect } = await elementShot(page, itemCard, "lib-content");
  const contentBeat = manifest.beats.find((b) => b.id === "lib-content");
  if (contentBeat) {
    contentBeat.screenshot = contentShot;
    contentBeat.scrollAspect = aspect;
  }

  // ── Beat: lib-variations — open Facebook (2 variations), flick to 2 of 2 ─────
  const facebookTrigger = page.getByText(/Facebook \(2 variations\)/).first();
  await facebookTrigger.scrollIntoViewIfNeeded().catch(() => {});
  await facebookTrigger.click();
  await page.waitForTimeout(400);
  const varRow = page.getByText(/\d+ of 2/).first().locator("..");
  await varRow.getByRole("button").last().click(); // next → "2 of 2"
  await page.waitForTimeout(400);
  await centerOn(page, page.getByText(/2 of 2/).first());
  setScreen("lib-variations", await shot(page, "lib-variations"));

  // ── Beat: lib-download — open the per-session Download menu ──────────────────
  const downloadTrigger = page
    .locator(".border-l-primary")
    .first()
    .getByRole("button")
    .filter({ has: page.locator("svg") })
    .first();
  await centerOn(page, downloadTrigger);
  // The first icon-only button in the item header is the Download dropdown trigger.
  await downloadTrigger.click();
  await page.getByText("Word (.docx)").waitFor({ timeout: 5_000 });
  await page.waitForTimeout(300);
  setScreen("lib-download", await shot(page, "lib-download"));

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log("\n✅ Capture complete. Screenshots in public/screens, manifest updated.");
  await browser.close();
}

main().catch((err) => {
  console.error("\n❌ Capture failed:", err?.message ?? err);
  process.exit(1);
});
