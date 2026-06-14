/**
 * Captures screenshots for the ivangel dashboard "Generate your first posts" video.
 *
 * Flow:
 *   dash-empty      — dashboard freshly loaded, no content yet
 *   dash-inputs     — create panel filled (social + bible study, sermon text, all platforms, 2 posts)
 *   dash-generate   — spinner captured immediately after clicking Generate (stub adds 2500 ms delay)
 *   dash-results-social  — results panel, Social Media tab, Facebook post visible
 *   dash-results-study   — same results, Bible Study tab activated
 *
 * Auth is fully mocked — no real backend writes. See harness.ts for the session
 * seeding pattern and route-stub mechanism.
 *
 * Prereqs: dev server running (default http://localhost:8080). Override with
 * IVANGEL_URL and VITE_SUPABASE_URL env vars.
 *
 * Run with: npm run capture:dashboard
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
  protectedStubs,
  shot,
  elementShot,
  clickTarget,
  topOfPage,
  type RouteSpec,
} from "../lib/harness";
import type { Manifest } from "../../src/manifest";

const IVANGEL_URL = process.env.IVANGEL_URL ?? "http://localhost:8080";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const STORAGE_KEY = storageKey(SUPABASE_URL);
const MANIFEST_PATH = resolve("src/storyboards/dashboard.json");
const STYLE_GUIDE_FIXTURE = resolve("fixtures/style-guide.md");

// Fixture response returned by the stubbed generate-social-posts edge function.
const GENERATION_BODY = {
  facebook: [
    "Grace isn't passive — it's the most active force in the universe. This Sunday we explored what it means to carry that love into Monday morning. 💛\n\nJoin us next Sunday at 10am. Link in bio for our weekly devotional. #SundaySermon #LeicesterVineyard",
    "\"The prodigal son didn't earn his way home — he was simply welcomed.\" That's the gospel in one sentence. 🙌\n\nCatch the full message on our website. #ActiveGrace #Leicester",
  ],
  instagram: [
    "Grace isn't passive — it's the most active force in the universe. 💛\n\nThis Sunday Pastor Rob unpacked Luke 15 in a way that stopped us in our tracks. Full message on our website — link in bio.\n\n#SundaySermon #LeicesterVineyard #ActiveGrace #ChurchLife",
  ],
  tiktok: [
    "When was the last time someone's grace changed everything for you? 🙏 Sunday's message hit different. #ChurchTok #LeicesterVineyard #Grace #Faith",
  ],
  twitter: [
    "\"Grace isn't passive — it's the most active force in the universe.\" 💛 — Sunday's message in one sentence. Full sermon online 👇",
  ],
  devotional:
    "# Day 1 — The Weight of a Small Kindness\n\n\"Carry each other's burdens, and in this way you will fulfil the law of Christ.\" — Galatians 6:2\n\nGrace doesn't always announce itself. Sometimes it arrives as a text message, a meal left on a doorstep, or five quiet minutes of listening.\n\n**Reflect:** Who in your circle needs a small kindness today?",
  bibleStudyGuide:
    "# Small Group Discussion Guide\n\n## This Week's Theme: Active Grace\n\n1. What does \"active grace\" look like in your workplace or neighbourhood this week?\n2. Read James 2:14–17. How does this passage reframe the sermon's central idea?\n3. Share a moment when someone extended grace to you unexpectedly. What changed?\n4. How might our church community practise this more intentionally?",
  podcastDescription:
    "Episode 47 — Active Grace: Beyond the Pew\n\nPastor Rob unpacks what happens when Sunday's message meets Monday's reality. Drawing from Luke 15 and James 2, this episode challenges us to move grace from concept to practice — and offers three practical ways to start this week.",
};

async function main() {
  console.log(`🌐 App:      ${IVANGEL_URL}`);
  console.log(`🔑 Storage:  ${STORAGE_KEY}`);

  const styleGuide = readFileSync(STYLE_GUIDE_FIXTURE, "utf8");

  // Video-specific stubs come FIRST so they take priority over protectedStubs.
  const specs: RouteSpec[] = [
    {
      match: "/functions/v1/generate-social-posts",
      delay: 2500,
      body: GENERATION_BODY,
    },
    // Stub the DB insert so it doesn't fail; Dashboard reads state from the
    // function response body directly (setGeneratedContent(...data)), not from
    // a re-query, so the returned shape just needs to be non-empty.
    {
      match: "/rest/v1/generated_content",
      body: { id: "00000000-0000-4000-8000-000000009c0a" },
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

  const setBeat = (
    id: string,
    screenshot: string,
    clickPoint: ReturnType<typeof Object.create>,
  ) => {
    const beat = manifest.beats.find((b) => b.id === id);
    if (beat) {
      beat.screenshot = screenshot;
      beat.clickPoint = clickPoint;
    }
  };

  await page.goto(`${IVANGEL_URL}/dashboard`, { waitUntil: "networkidle" });
  if (page.url().includes("/login")) {
    throw new Error(
      `Redirected to /login — the seeded session wasn't accepted. Ensure the dev ` +
        `server's VITE_SUPABASE_URL matches "${SUPABASE_URL}" (storage key ${STORAGE_KEY}).`,
    );
  }
  if (page.url().includes("/onboarding")) {
    throw new Error(
      `Redirected to /onboarding — the church stub wasn't accepted. ` +
        `Check that protectedStubs is returning the correct RPC stub.`,
    );
  }

  // ── Beat 1: dash-empty ────────────────────────────────────────────────────
  // Wait for the empty-state placeholder to confirm the panel has rendered.
  await page.getByText("Your content will appear here").waitFor({ timeout: 15_000 });
  await topOfPage(page);
  setBeat("dash-empty", await shot(page, "dash-empty"), null);

  // ── Beat 2: dash-scroll — fill the WHOLE create panel, then capture it tall ──
  // We populate every option so the scroll-through showcases the full feature set:
  // all four content types, sermon details (speaker + series), a call-to-action,
  // a second language (translation), all platforms, and posts-per-platform.

  // Content types — turn ALL FOUR on (Social posts, Bible study, Devotional, Podcast).
  for (const name of [/Social posts/i, /Bible study/i, /Devotional/i, /Podcast/i]) {
    const btn = page.getByRole("button", { name });
    const pressed = await btn.getAttribute("aria-pressed").catch(() => null);
    if (pressed !== "true") await btn.click();
  }

  // Upload a sermon text file via the hidden file input.
  await page.setInputFiles("#transcript-upload", [
    {
      name: "2024-10-20-active-grace.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Active Grace — Luke 15:11–32\n\nGrace isn't passive — it's the most active force in the universe..." +
          "\n[continues for 1200 words of sermon content about the parable of the prodigal son, active grace," +
          " and what it means for Monday morning living]",
      ),
    },
  ]);

  // Speaker name.
  await page.fill("#speaker-name", "Pastor Rob").catch(() => {});

  // Call-to-action / announcements.
  await page
    .fill(
      "#custom-cta",
      "Don't forget — our new Alpha course starts next Sunday at 7pm. Everyone is welcome!",
    )
    .catch(() => {});

  // Add a second language (Spanish) to showcase translation. The picker is a popover:
  // click "Add", search, then pick the result.
  try {
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByPlaceholder(/Search .*languages/i).fill("Spanish");
    await page.getByRole("button", { name: /Spanish/i }).first().click();
  } catch {
    console.warn("⚠️  Could not add Spanish language (non-fatal).");
  }

  // Platform toggles — ensure all four are active (default is all on).
  for (const name of ["Facebook", "Instagram", "TikTok", "X"] as const) {
    const btn = page.getByRole("button", { name });
    const pressed = await btn.getAttribute("aria-pressed").catch(() => null);
    if (pressed !== "true") await btn.click();
  }

  // Posts per platform — click the "2" option.
  const postsPerRow = page.locator("text=Posts per platform").locator("..");
  const twoBtn = postsPerRow.getByRole("button", { name: "2" });
  await twoBtn.click().catch(async () => {
    await page.getByRole("button", { name: "2" }).first().click();
  });

  // Settle, dismiss any open menu/popover, then capture the whole create card tall.
  await page.keyboard.press("Escape").catch(() => {});
  await topOfPage(page);
  await page.waitForTimeout(300);
  const createCard = page.locator(".border-t-primary").first();
  const { screenshot: scrollShot, aspect: scrollAspect } = await elementShot(
    page,
    createCard,
    "dash-scroll",
  );
  const scrollBeat = manifest.beats.find((b) => b.id === "dash-scroll");
  if (scrollBeat) {
    scrollBeat.screenshot = scrollShot;
    scrollBeat.scrollAspect = scrollAspect;
  }

  // ── Beat 3: dash-generate (spinner) ──────────────────────────────────────
  // Remove Spanish first so generation is English-only and the results screens stay
  // clean (the English fixture has no translated versions).
  try {
    await page.getByRole("button", { name: /^Spanish$/ }).click();
    await page.getByRole("button", { name: /Remove language/i }).click();
  } catch {
    console.warn("⚠️  Could not remove Spanish before generating (non-fatal).");
  }

  const generateBtn = page.getByRole("button", { name: /Generate/i });
  // Click Generate and capture the spinner before the 2500 ms stub delay expires.
  await generateBtn.click();
  // Wait for the spinner text to appear in the results panel.
  await page.getByText("Crafting your content…").waitFor({ timeout: 5_000 });
  // Scroll back to the top so the shot frames both panels — the right panel
  // shows the crafting spinner. (Clicking Generate scrolls the button, low on the
  // long left column, into view.) The 2500 ms stub delay leaves ample time.
  await topOfPage(page);
  setBeat("dash-generate", await shot(page, "dash-generate"), null);

  // ── Beat 4: dash-results-social ──────────────────────────────────────────
  // Wait for the spinner to disappear (generation complete).
  await page.getByText("Crafting your content…").waitFor({ state: "hidden", timeout: 15_000 });
  // The Social Media tab should be the default active tab.
  await page.getByRole("tab", { name: /Social Media/i }).waitFor({ timeout: 10_000 });
  // Make sure Facebook platform sub-tab is active.
  const facebookSubBtn = page.getByRole("button", { name: "Facebook" });
  await facebookSubBtn.click().catch(() => {});
  await page.waitForTimeout(400);
  await topOfPage(page);
  setBeat("dash-results-social", await shot(page, "dash-results-social"), null);

  // ── Beat 5: dash-results-study ────────────────────────────────────────────
  // Click the Bible Study tab trigger.
  const bibleStudyTab = page.getByRole("tab", { name: /Bible Study/i });
  await bibleStudyTab.click();
  await page.waitForTimeout(400);
  await topOfPage(page);
  setBeat("dash-results-study", await shot(page, "dash-results-study"), null);

  // ── Beat 6: dash-results-devotional ──────────────────────────────────────
  // Click the Devotional tab trigger to show another content type's output.
  const devotionalTab = page.getByRole("tab", { name: /Devotional/i });
  await devotionalTab.click().catch(() => {});
  await page.waitForTimeout(400);
  await topOfPage(page);
  setBeat("dash-results-devotional", await shot(page, "dash-results-devotional"), null);

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log("\n✅ Capture complete. Screenshots in public/screens, manifest updated.");
  await browser.close();
}

main().catch((err) => {
  console.error("\n❌ Capture failed:", err?.message ?? err);
  process.exit(1);
});
