/**
 * Captures screenshots for the ivangel "Style guide & settings" video.
 *
 * Flow (all on /settings, fully mocked):
 *   sg-church   — Church Information tab, details form (church name, vision, etc.)
 *   sg-refresh  — the "Update Website Content?" recrawl confirm dialog, open
 *   sg-style    — the Style Guide tab, voice-profile editor (monospace textarea)
 *   sg-account  — the Account tab, password / account management
 *
 * The Settings page reads style_guides via `.single()` selecting
 * `guide_content, website_last_crawled_at`, so we stub that shape explicitly
 * BEFORE protectedStubs (whose style_guides body uses a different `content` key).
 *
 * Run with: npm run capture:style-guide
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
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
const MANIFEST_PATH = resolve("src/storyboards/style-guide.json");
const STYLE_GUIDE_FIXTURE = resolve("fixtures/style-guide.md");

async function main() {
  console.log(`🌐 App:      ${IVANGEL_URL}`);
  console.log(`🔑 Storage:  ${STORAGE_KEY}`);

  const styleGuide = readFileSync(STYLE_GUIDE_FIXTURE, "utf8");

  // Settings selects `guide_content, website_last_crawled_at` from style_guides
  // (.single()). Place this shape before protectedStubs' style_guides stub.
  const specs: RouteSpec[] = [
    {
      match: "/rest/v1/style_guides",
      body: {
        id: "00000000-0000-4000-8000-000000005591",
        church_id: "00000000-0000-4000-8000-000000000c1a",
        guide_content: styleGuide,
        website_last_crawled_at: "2024-09-22T10:00:00Z",
      },
    },
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

  await page.goto(`${IVANGEL_URL}/settings`, { waitUntil: "networkidle" });
  if (page.url().includes("/login") || page.url().includes("/onboarding")) {
    throw new Error(`Unexpected redirect to ${page.url()} — check session/church stubs.`);
  }

  // ── Beat: sg-church — Church Information tab (default) ───────────────────────
  await page.getByRole("heading", { name: "Settings" }).waitFor({ timeout: 15_000 });
  await page.getByRole("tab", { name: "Church Information" }).waitFor({ timeout: 10_000 });
  // Wait for the church form to render (its submit button carries this label).
  await page.getByRole("button", { name: "Save Changes" }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await topOfPage(page);
  setScreen("sg-church", await shot(page, "sg-church"));

  // ── Beat: sg-refresh — open the recrawl confirm dialog ──────────────────────
  const refreshBtn = page.getByRole("button", { name: /Refresh/ });
  await refreshBtn.scrollIntoViewIfNeeded().catch(() => {});
  await refreshBtn.click();
  await page.getByText("Update Website Content?").waitFor({ timeout: 5_000 });
  await page.waitForTimeout(400);
  setScreen("sg-refresh", await shot(page, "sg-refresh"));
  // Dismiss the dialog before moving on.
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(300);

  // ── Beat: sg-style — Style Guide tab, voice-profile editor ──────────────────
  await page.getByRole("tab", { name: "Style Guide" }).click();
  await page.getByRole("button", { name: /Save Style Guide/ }).waitFor({ timeout: 8_000 });
  // Confirm the editor holds our fixture text.
  await page.getByText("Communication Style Guide").first().waitFor({ timeout: 5_000 }).catch(() => {});
  await topOfPage(page);
  await page.waitForTimeout(300);
  setScreen("sg-style", await shot(page, "sg-style"));

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log("\n✅ Capture complete. Screenshots in public/screens, manifest updated.");
  await browser.close();
}

main().catch((err) => {
  console.error("\n❌ Capture failed:", err?.message ?? err);
  process.exit(1);
});
