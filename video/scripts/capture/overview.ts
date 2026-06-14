/**
 * Captures screenshots for the ivangel platform overview (landing-page) video.
 *
 * A marketing cut, so it spans two contexts:
 *   ov-hero        — the public landing hero (no auth, no stubs)
 *   ov-create      — dashboard create panel, fully filled out
 *   ov-generate    — generating spinner
 *   ov-social      — social-media results (Facebook)
 *   ov-devotional  — devotional results
 *
 * The dashboard frames reuse the same fill logic and stubs as capture/dashboard.ts.
 *
 * Run with: npm run capture:overview
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import type { BrowserContext } from "playwright";
import {
  CAPTURE_VIEWPORT,
  fakeSession,
  storageKey,
  setupRoutes,
  protectedStubs,
  shot,
  topOfPage,
  type RouteSpec,
} from "../lib/harness";
import type { Manifest } from "../../src/manifest";

const IVANGEL_URL = process.env.IVANGEL_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const STORAGE_KEY = storageKey(SUPABASE_URL);
const MANIFEST_PATH = resolve("src/storyboards/overview.json");
const STYLE_GUIDE_FIXTURE = resolve("fixtures/style-guide.md");

// Reuse the dashboard generation fixture shape.
const GENERATION_BODY = {
  facebook: [
    "Grace isn't passive — it's the most active force in the universe. This Sunday we explored what it means to carry that love into Monday morning. 💛\n\nJoin us next Sunday at 10am. #SundaySermon #LeicesterVineyard",
    "\"The prodigal son didn't earn his way home — he was simply welcomed.\" That's the gospel in one sentence. 🙌\n\nCatch the full message on our website. #ActiveGrace #Leicester",
  ],
  instagram: [
    "Grace isn't passive — it's the most active force in the universe. 💛\n\nFull message on our website — link in bio. #SundaySermon #LeicesterVineyard #ActiveGrace",
  ],
  tiktok: [
    "When was the last time someone's grace changed everything for you? 🙏 #ChurchTok #LeicesterVineyard #Grace",
  ],
  twitter: [
    "\"Grace isn't passive — it's the most active force in the universe.\" 💛 — Sunday's message in one sentence.",
  ],
  devotional:
    "# Day 1 — The Weight of a Small Kindness\n\n\"Carry each other's burdens, and in this way you will fulfil the law of Christ.\" — Galatians 6:2\n\nGrace doesn't always announce itself. Sometimes it arrives as a text message, a meal left on a doorstep, or five quiet minutes of listening.\n\n**Reflect:** Who in your circle needs a small kindness today?",
  bibleStudyGuide:
    "# Small Group Discussion Guide\n\n## This Week's Theme: Active Grace\n\n1. What does \"active grace\" look like in your week?\n2. Read James 2:14–17. How does it reframe the sermon's idea?\n3. Share a moment when someone extended grace to you.",
};

const setScreen = (manifest: Manifest, id: string, screenshot: string) => {
  const beat = manifest.beats.find((b) => b.id === id);
  if (beat) {
    beat.screenshot = screenshot;
    beat.clickPoint = null;
  }
};

async function main() {
  console.log(`🌐 App:      ${IVANGEL_URL}`);
  console.log(`🔑 Storage:  ${STORAGE_KEY}`);

  const styleGuide = readFileSync(STYLE_GUIDE_FIXTURE, "utf8");
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

  const browser = await chromium.launch();

  // ── Context A: public landing hero (logged out, no stubs) ───────────────────
  const publicCtx = await browser.newContext({
    viewport: { ...CAPTURE_VIEWPORT },
    deviceScaleFactor: 2,
  });
  // Stub auth so the logged-out landing renders instantly (no hanging on a dead
  // local Supabase); everything else falls through to an empty body.
  await setupRoutes(publicCtx, [{ match: "/auth/v1/", body: {} }]);
  const landing = await publicCtx.newPage();
  await landing.goto(`${IVANGEL_URL}/`, { waitUntil: "networkidle" });
  await landing
    .getByText("Your sermon satisfies Sunday.", { exact: false })
    .waitFor({ timeout: 15_000 });
  // Let the hero's entrance transitions settle.
  await landing.waitForTimeout(900);
  await topOfPage(landing);
  setScreen(manifest, "ov-hero", await shot(landing, "ov-hero"));
  await publicCtx.close();

  // ── Context B: authenticated dashboard frames ───────────────────────────────
  const specs: RouteSpec[] = [
    { match: "/functions/v1/generate-social-posts", delay: 2500, body: GENERATION_BODY },
    { match: "/rest/v1/generated_content", body: { id: "00000000-0000-4000-8000-000000009c0a" } },
    ...protectedStubs(styleGuide),
  ];
  const appCtx: BrowserContext = await browser.newContext({
    viewport: { ...CAPTURE_VIEWPORT },
    deviceScaleFactor: 2,
  });
  await appCtx.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key as string, session as string);
    },
    [STORAGE_KEY, JSON.stringify(fakeSession())] as const,
  );
  await setupRoutes(appCtx, specs);

  const page = await appCtx.newPage();
  await page.goto(`${IVANGEL_URL}/dashboard`, { waitUntil: "networkidle" });
  if (page.url().includes("/login") || page.url().includes("/onboarding")) {
    throw new Error(`Unexpected redirect to ${page.url()} — check session/church stubs.`);
  }

  // Fill the create panel (mirrors capture/dashboard.ts).
  await page.getByText("Your content will appear here").waitFor({ timeout: 15_000 });
  for (const name of [/Social posts/i, /Bible study/i, /Devotional/i]) {
    const btn = page.getByRole("button", { name });
    const pressed = await btn.getAttribute("aria-pressed").catch(() => null);
    if (pressed !== "true") await btn.click();
  }
  await page.setInputFiles("#transcript-upload", [
    {
      name: "2024-10-20-active-grace.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Active Grace — Luke 15:11–32\n\nGrace isn't passive — it's the most active force in the universe..." +
          "\n[continues for 1200 words about the parable of the prodigal son and active grace]",
      ),
    },
  ]);
  await page.fill("#speaker-name", "Pastor Rob").catch(() => {});
  await page
    .fill("#custom-cta", "Our new Alpha course starts next Sunday at 7pm. Everyone is welcome!")
    .catch(() => {});
  for (const name of ["Facebook", "Instagram", "TikTok", "X"] as const) {
    const btn = page.getByRole("button", { name });
    const pressed = await btn.getAttribute("aria-pressed").catch(() => null);
    if (pressed !== "true") await btn.click();
  }

  // ── Beat: ov-create — the filled create panel ───────────────────────────────
  await page.keyboard.press("Escape").catch(() => {});
  await topOfPage(page);
  await page.waitForTimeout(300);
  setScreen(manifest, "ov-create", await shot(page, "ov-create"));

  // ── Beat: ov-generate — the crafting spinner ────────────────────────────────
  await page.getByRole("button", { name: /Generate/i }).click();
  await page.getByText("Crafting your content…").waitFor({ timeout: 5_000 });
  await topOfPage(page);
  setScreen(manifest, "ov-generate", await shot(page, "ov-generate"));

  // ── Beat: ov-social — Facebook results ──────────────────────────────────────
  await page.getByText("Crafting your content…").waitFor({ state: "hidden", timeout: 15_000 });
  await page.getByRole("tab", { name: /Social Media/i }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Facebook" }).click().catch(() => {});
  await page.waitForTimeout(400);
  await topOfPage(page);
  setScreen(manifest, "ov-social", await shot(page, "ov-social"));

  // ── Beat: ov-devotional — devotional results ────────────────────────────────
  await page.getByRole("tab", { name: /Devotional/i }).click().catch(() => {});
  await page.waitForTimeout(400);
  await topOfPage(page);
  setScreen(manifest, "ov-devotional", await shot(page, "ov-devotional"));

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log("\n✅ Capture complete. Screenshots in public/screens, manifest updated.");
  await browser.close();
}

main().catch((err) => {
  console.error("\n❌ Capture failed:", err?.message ?? err);
  process.exit(1);
});
