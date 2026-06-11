/**
 * Captures screenshots for the ivangel onboarding walkthrough video.
 *
 * The flow (voice-first redesign, 4 steps):
 *   01 Your Church (form) → 02 Your Voice Online (website) →
 *   03 Your Sermons (upload) → 04 Your Voice Profile (generate → review)
 *
 * Auth is fully mocked — no real backend writes. See harness.ts for the session
 * seeding pattern and route-stub mechanism.
 *
 * Prereqs: dev server running (default http://localhost:8080). Override with
 * IVANGEL_URL and VITE_SUPABASE_URL env vars.
 *
 * Run with: npm run capture:onboarding
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import {
  CAPTURE_VIEWPORT,
  DEMO_USER_ID,
  fakeSession,
  storageKey,
  setupRoutes,
  shot,
  clickTarget,
  topOfPage,
  type RouteSpec,
} from "../lib/harness";
import type { Manifest } from "../../src/manifest";

const IVANGEL_URL = process.env.IVANGEL_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const STORAGE_KEY = storageKey(SUPABASE_URL);
const MANIFEST_PATH = resolve("src/storyboards/onboarding.json");
const STYLE_GUIDE_FIXTURE = resolve("fixtures/style-guide.md");

const SCRAPED_PAGES = [
  { title: "Home", url: "https://www.leicestervineyard.org/" },
  { title: "About Us", url: "https://www.leicestervineyard.org/about" },
  { title: "What We Believe", url: "https://www.leicestervineyard.org/beliefs" },
  { title: "Sunday Gatherings", url: "https://www.leicestervineyard.org/sundays" },
  { title: "Community & Groups", url: "https://www.leicestervineyard.org/community" },
  { title: "Get Connected", url: "https://www.leicestervineyard.org/connect" },
].map((p) => ({ ...p, markdown: `# ${p.title}\n\nWelcome to our church family.` }));

const SAMPLE_SERMONS = [
  "2024-09-08 — The Prodigal Returns.txt",
  "2024-09-15 — Living Water.txt",
  "2024-09-22 — Faith Over Fear.txt",
  "2024-09-29 — The Good Shepherd.txt",
  "2024-10-06 — A Heart of Worship.txt",
  "2024-10-13 — Grace Upon Grace.txt",
  "2024-10-20 — Called to Serve.txt",
];

const SERMON_BODY = `In today's message we turn to the heart of the gospel — the relentless,
seeking love of God for his people. We were lost, and yet we are found. We were far off,
and yet we have been brought near. This shapes everything we do as a church family: to
follow the way, to understand the truth, and to live a fruitful life led by the Spirit.`;

async function main() {
  console.log(`🌐 App:      ${IVANGEL_URL}`);
  console.log(`🔑 Storage:  ${STORAGE_KEY}`);

  const styleGuide = readFileSync(STYLE_GUIDE_FIXTURE, "utf8");

  const specs: RouteSpec[] = [
    { match: "/functions/v1/generate-style-guide", body: { styleGuide }, delay: 2200 },
    {
      match: "/functions/v1/scrape-church-website",
      body: { success: true, data: { pagesScraped: SCRAPED_PAGES.length, content: SCRAPED_PAGES } },
    },
    { match: "/rpc/get_user_churches", body: [] },
    { match: "/rest/v1/churches", body: [] },
    { match: "/rest/v1/subscriptions", body: [] },
    { match: "/auth/v1/", body: {} },
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
  const setBeat = (id: string, screenshot: string, clickPoint: ReturnType<typeof Object.create>) => {
    const beat = manifest.beats.find((b) => b.id === id);
    if (beat) {
      beat.screenshot = screenshot;
      beat.clickPoint = clickPoint;
    }
  };

  await page.goto(`${IVANGEL_URL}/onboarding`, { waitUntil: "networkidle" });
  if (page.url().includes("/login")) {
    throw new Error(
      `Redirected to /login — the seeded session wasn't accepted. Ensure the dev ` +
        `server's VITE_SUPABASE_URL matches "${SUPABASE_URL}" (storage key ${STORAGE_KEY}).`,
    );
  }

  // ── Step 1: Your Church ───────────────────────────────────────────────────
  await page.locator("#name").waitFor({ timeout: 15_000 });
  await page.fill("#name", "Leicester Vineyard");
  await page.fill("#email", "hello@leicestervineyard.org");
  await page.fill("#location", "Leicester, UK");
  await page.locator("#denomination").fill("Vineyard").catch(() => {});
  await page.fill("#website_url", "https://www.leicestervineyard.org");
  await page.fill("#contact_email", "office@leicestervineyard.org");
  await page.fill(
    "#vision_statement",
    "A Bible-based church community seeking to follow the way, understand the truth of who God has made us to be, and live a fruitful life led by the Spirit.",
  );
  try {
    const combos = page.getByRole("combobox");
    await combos.nth(0).click();
    await page.getByRole("option", { name: "Sunday" }).click();
    await combos.nth(1).click();
    await page.getByRole("option", { name: "10:00 AM" }).click();
  } catch {
    console.warn("⚠️  Could not set service time selects (non-fatal).");
  }
  try {
    await page.getByPlaceholder("Instagram (@username)").fill("@leicestervineyard");
    await page.getByPlaceholder("Facebook (username or URL)").fill("LeicesterVineyard");
  } catch { /* non-fatal */ }

  const submitBtn = page.locator('form button[type="submit"]');
  const step1Click = await clickTarget(page, submitBtn);
  await topOfPage(page);
  setBeat("step1-church", await shot(page, "step1-church"), step1Click);
  await submitBtn.click();

  // ── Step 2: Your Voice Online (website) ───────────────────────────────────
  const websiteContinue = page.getByRole("button", { name: /Looks right/i });
  await websiteContinue.waitFor({ timeout: 15_000 });
  await topOfPage(page);
  setBeat("step2-website", await shot(page, "step2-website"), await clickTarget(page, websiteContinue));
  await websiteContinue.click();

  // ── Step 3: Your Sermons ──────────────────────────────────────────────────
  await page.getByText("Upload your sermons", { exact: false }).waitFor({ timeout: 15_000 });
  await page.setInputFiles(
    "#file-input",
    SAMPLE_SERMONS.map((name) => ({
      name,
      mimeType: "text/plain",
      buffer: Buffer.from(`${name.replace(".txt", "")}\n\n${SERMON_BODY}`),
    })),
  );
  const sermonsContinue = page.getByRole("button", { name: /Build my voice profile/i });
  await sermonsContinue.waitFor({ timeout: 10_000 });
  const step3Click = await clickTarget(page, sermonsContinue);
  await topOfPage(page);
  setBeat("step3-sermons", await shot(page, "step3-sermons"), step3Click);
  await sermonsContinue.click();

  // ── Step 4: generating (delay gives us time to capture the spinner) ───────
  await page.getByText("Creating Your Style Guide", { exact: false }).waitFor({ timeout: 10_000 });
  setBeat("step4-generating", await shot(page, "step4-generating"), null);

  // ── Step 4: review style guide ────────────────────────────────────────────
  await page.getByText("Review Your Style Guide", { exact: false }).waitFor({ timeout: 15_000 });
  const acceptBtn = page.getByRole("button", { name: /Accept & Complete Setup/i });
  const acceptClick = await clickTarget(page, acceptBtn);
  await topOfPage(page);
  setBeat("step4-review", await shot(page, "step4-review"), acceptClick);
  // NOTE: deliberately NOT clicking Accept — that would attempt real church creation.

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log("\n✅ Capture complete. Screenshots in public/screens, manifest updated.");
  await browser.close();
}

main().catch((err) => {
  console.error("\n❌ Capture failed:", err?.message ?? err);
  process.exit(1);
});
