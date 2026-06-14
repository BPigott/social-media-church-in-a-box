/**
 * Captures screenshots for the ivangel "Edit, translate & refine" video.
 *
 * Flow (all on /dashboard, fully mocked):
 *   et-results       — English social posts generated, Facebook post with Edit/Copy
 *   et-edit          — the post opened inline in the MDEditor (Save/Cancel)
 *   et-add-language  — left-panel LanguagePicker popover, Spanish searched
 *   et-retranslate   — "Re-translate from English" clicked, spinner showing
 *   et-translated    — Spanish version revealed in its collapsible
 *
 * Reuses the dashboard generation fixture (trimmed to social-only) plus a stubbed
 * retranslate-content response. See harness.ts for the session/route mechanism.
 *
 * Prereqs: dev server running. Point at it with IVANGEL_URL / VITE_SUPABASE_URL.
 * Run with: npm run capture:edit-translate
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import type { Locator, Page } from "playwright";
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
const MANIFEST_PATH = resolve("src/storyboards/edit-translate.json");
const STYLE_GUIDE_FIXTURE = resolve("fixtures/style-guide.md");

// Social-only generation fixture so the results panel stays focused on posts.
const GENERATION_BODY = {
  facebook: [
    "Grace isn't passive — it's the most active force in the universe. This Sunday we explored what it means to carry that love into Monday morning. 💛\n\nJoin us next Sunday at 10am. Link in bio for our weekly devotional. #SundaySermon #LeicesterVineyard",
  ],
  instagram: [
    "Grace isn't passive — it's the most active force in the universe. 💛\n\nThis Sunday Pastor Rob unpacked Luke 15 in a way that stopped us in our tracks. Full message on our website — link in bio.\n\n#SundaySermon #LeicesterVineyard #ActiveGrace",
  ],
  tiktok: [
    "When was the last time someone's grace changed everything for you? 🙏 Sunday's message hit different. #ChurchTok #LeicesterVineyard #Grace",
  ],
  twitter: [
    "\"Grace isn't passive — it's the most active force in the universe.\" 💛 — Sunday's message in one sentence. Full sermon online 👇",
  ],
};

// Stubbed retranslate-content response (single language → es). Shape mirrors
// supabase/functions/retranslate-content/index.ts for one target language.
const SPANISH_FACEBOOK =
  "La gracia no es pasiva: es la fuerza más activa del universo. Este domingo exploramos lo que significa llevar ese amor al lunes por la mañana. 💛\n\nAcompáñanos el próximo domingo a las 10h. Enlace en la biografía para nuestro devocional semanal. #SermónDominical #LeicesterVineyard";
const RETRANSLATE_BODY = {
  translatedContents: { es: SPANISH_FACEBOOK },
  translatedContent: SPANISH_FACEBOOK,
  targetLanguage: "es",
};

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

  const specs: RouteSpec[] = [
    { match: "/functions/v1/generate-social-posts", delay: 1800, body: GENERATION_BODY },
    { match: "/functions/v1/retranslate-content", delay: 2500, body: RETRANSLATE_BODY },
    { match: "/rest/v1/generated_content", body: { id: "00000000-0000-4000-8000-000000009c0a" } },
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
  const setBeat = (id: string, screenshot: string) => {
    const beat = manifest.beats.find((b) => b.id === id);
    if (beat) {
      beat.screenshot = screenshot;
      beat.clickPoint = null;
    }
  };

  await page.goto(`${IVANGEL_URL}/dashboard`, { waitUntil: "networkidle" });
  if (page.url().includes("/login")) {
    throw new Error(
      `Redirected to /login — seeded session rejected. Ensure dev server VITE_SUPABASE_URL matches "${SUPABASE_URL}" (storage key ${STORAGE_KEY}).`,
    );
  }

  // ── Generate English social posts ──────────────────────────────────────────
  await page.getByText("Your content will appear here").waitFor({ timeout: 15_000 });

  // social_media is on by default; just provide a transcript.
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

  const generateBtn = page.getByRole("button", { name: /Generate/i });
  await generateBtn.click();
  await page.getByText("Crafting your content…").waitFor({ timeout: 5_000 });
  await page
    .getByText("Crafting your content…")
    .waitFor({ state: "hidden", timeout: 20_000 });

  // Ensure Social Media tab + Facebook sub-tab are active.
  await page.getByRole("tab", { name: /Social Media/i }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Facebook" }).first().click().catch(() => {});
  await page.waitForTimeout(400);

  const resultsCard = page.locator(".border-t-secondary").first();

  // English content opens in the inline MDEditor by default (Dashboard auto-enables
  // editing for English), so there is no separate "Edit" button to click here.
  const editor = resultsCard.locator("textarea").first();
  await editor.waitFor({ timeout: 10_000 });

  // ── Beat: et-results — posts ready, editable inline ──────────────────────────
  await topOfPage(page);
  setBeat("et-results", await shot(page, "et-results"));

  // ── Beat: et-add-language — add the target language FIRST, before editing ─────
  // The flow we teach: choose your language, *then* edit English, *then* re-translate,
  // so your edits carry across. So we add Spanish before touching the editor.
  const addBtn = page.getByRole("button", { name: /^Add$/ });
  await centerOn(page, addBtn);
  await addBtn.click();
  await page.getByPlaceholder(/Search .*languages/i).fill("Spanish");
  await page.waitForTimeout(300);
  setBeat("et-add-language", await shot(page, "et-add-language"));
  // Choose Spanish from the popover results.
  await page
    .getByRole("button", { name: /Spanish/i })
    .first()
    .click();
  await page.waitForTimeout(500);

  // ── Beat: et-edit — now refine the English wording right in the editor ───────
  const englishEditor = resultsCard.locator("textarea").first();
  await englishEditor.waitFor({ timeout: 10_000 });
  await centerOn(page, englishEditor);
  const current = await englishEditor.inputValue();
  await englishEditor.fill(current + "\n\nEveryone is welcome — bring a friend. 🙌");
  await page.waitForTimeout(300);
  await centerOn(page, englishEditor);
  setBeat("et-edit", await shot(page, "et-edit"));
  // Persist the edit so it becomes the source for re-translation.
  const saveBtn = resultsCard.getByRole("button", { name: /^Save$/ });
  await saveBtn.click().catch(() => {});
  await page.waitForTimeout(400);

  // ── Beat: et-retranslate — click Re-translate, catch the spinner ─────────────
  const retransBtn = resultsCard.getByRole("button", {
    name: /Re-translate from English/i,
  });
  await retransBtn.waitFor({ timeout: 5_000 });
  await centerOn(page, retransBtn);
  await retransBtn.click();
  await resultsCard.getByText("Re-translating...").waitFor({ timeout: 5_000 });
  await page.waitForTimeout(200);
  await centerOn(page, resultsCard.getByText("Re-translating..."));
  setBeat("et-retranslate", await shot(page, "et-retranslate"));

  // ── Beat: et-translated — wait for completion, expand the Spanish version ────
  await resultsCard
    .getByText("Re-translating...")
    .waitFor({ state: "hidden", timeout: 15_000 });
  await page.waitForTimeout(500);
  const spanishTrigger = resultsCard.locator('button:has-text("Spanish")').last();
  await spanishTrigger.scrollIntoViewIfNeeded().catch(() => {});
  await spanishTrigger.click().catch(() => {});
  await page.waitForTimeout(500);
  await centerOn(page, spanishTrigger);
  setBeat("et-translated", await shot(page, "et-translated"));

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log("\n✅ Capture complete. Screenshots in public/screens, manifest updated.");
  await browser.close();
}

main().catch((err) => {
  console.error("\n❌ Capture failed:", err?.message ?? err);
  process.exit(1);
});
