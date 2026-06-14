/**
 * Shared Playwright capture harness for ivangel how-to videos.
 *
 * Provides: fake auth session, storage-key derivation, route-stubbing, and the
 * shot/clickTarget/topOfPage screenshot helpers. Each per-video capture script
 * imports from here and supplies its own RouteSpec list.
 *
 * Auth pattern: we seed a fake restored session into localStorage which fires
 * INITIAL_SESSION (not SIGNED_IN), so trial/email side-effects are skipped.
 * supabase-js only checks expiry locally — no real JWT verification happens.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { BrowserContext, Page } from "playwright";
import { CAPTURE_VIEWPORT } from "../../src/theme";
import type { Point } from "../../src/manifest";

export { CAPTURE_VIEWPORT };

export const DEMO_USER_ID = "00000000-0000-4000-8000-00000000d3m0";

/** A far-future, signature-free session token accepted by supabase-js v2. */
export function fakeSession() {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    access_token: "demo.capture.token",
    refresh_token: "demo-refresh",
    token_type: "bearer",
    expires_in: 1_000_000,
    expires_at: nowSec + 1_000_000,
    user: {
      id: DEMO_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: "demo@ivangel.app",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { full_name: "Demo Church" },
      created_at: new Date(nowSec * 1000).toISOString(),
    },
  };
}

/** supabase-js v2 storage key: sb-<first hostname label>-auth-token */
export function storageKey(supabaseUrl: string): string {
  const host = new URL(supabaseUrl).hostname;
  return `sb-${host.split(".")[0]}-auth-token`;
}

// ── Route stubbing ─────────────────────────────────────────────────────────────

export interface RouteSpec {
  match: string;
  body: unknown;
  delay?: number;
}

/**
 * Intercepts all Supabase (REST, auth, Edge Function) traffic and fulfils each
 * request from the first matching RouteSpec. Non-Supabase traffic passes through.
 * Falls through to an empty `{}` if no spec matches.
 */
export async function setupRoutes(
  context: BrowserContext,
  specs: RouteSpec[],
): Promise<void> {
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    const isSupabase =
      url.includes(".supabase.co") ||
      url.includes("/functions/v1/") ||
      url.includes("/rest/v1/") ||
      url.includes("/auth/v1/");
    if (!isSupabase) return route.continue();

    for (const { match, body, delay } of specs) {
      if (url.includes(match)) {
        if (delay) await new Promise((r) => setTimeout(r, delay));
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      }
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

// ── Shared demo fixtures ───────────────────────────────────────────────────────

export const DEMO_CHURCH = {
  id: "00000000-0000-4000-8000-000000000c1a",
  user_id: DEMO_USER_ID,
  name: "Leicester Vineyard",
  location: "Leicester, UK",
  website_url: "https://www.leicestervineyard.org",
  denomination: "Vineyard",
  email: "hello@leicestervineyard.org",
  contact_email: "hello@leicestervineyard.org",
  vision_statement:
    "A Bible-based church community seeking to follow the way, understand the truth of who God has made us to be, and live a fruitful life led by the Spirit.",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const DEMO_SUBSCRIPTION = {
  id: "00000000-0000-4000-8000-000000005b51",
  user_id: DEMO_USER_ID,
  status: "active",
  exempt: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

/**
 * Route stubs common to all protected-route videos (Dashboard, Library, Settings).
 * These satisfy ProtectedRoute's church + subscription checks and useChurch/useSubscription.
 * Pass the style guide content from the fixture file. Video-specific stubs should be
 * placed BEFORE these in the specs array so they take priority.
 */
export function protectedStubs(styleGuideContent: string): RouteSpec[] {
  return [
    { match: "/rpc/get_user_churches", body: [DEMO_CHURCH] },
    { match: "/rest/v1/churches", body: DEMO_CHURCH },
    {
      match: "/rest/v1/style_guides",
      body: {
        id: "00000000-0000-4000-8000-000000005591",
        church_id: DEMO_CHURCH.id,
        content: styleGuideContent,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    { match: "/rest/v1/subscriptions", body: DEMO_SUBSCRIPTION },
    { match: "/rest/v1/sermon_series", body: [] },
    { match: "/auth/v1/", body: {} },
  ];
}

// ── Screenshot helpers ─────────────────────────────────────────────────────────

/** Takes a viewport screenshot, saves it to public/screens/<beatId>.png, returns the relative path. */
export async function shot(page: Page, beatId: string): Promise<string> {
  mkdirSync(resolve("public/screens"), { recursive: true });
  const rel = `screens/${beatId}.png`;
  await page.screenshot({ path: resolve("public", rel) });
  console.log(`📸 ${rel}`);
  return rel;
}

/**
 * Captures a full-height screenshot of a single element (not just the viewport),
 * saving it to public/screens/<beatId>.png. Returns the relative path plus the
 * element's aspect ratio (height / width) for ScrollScene's vertical pan.
 */
export async function elementShot(
  page: Page,
  locator: any,
  beatId: string,
): Promise<{ screenshot: string; aspect: number }> {
  mkdirSync(resolve("public/screens"), { recursive: true });
  const rel = `screens/${beatId}.png`;
  await locator.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
  const box = await locator.boundingBox();
  await locator.screenshot({ path: resolve("public", rel) });
  const aspect = box && box.width > 0 ? box.height / box.width : 1;
  console.log(`📸 ${rel} (aspect ${aspect.toFixed(3)})`);
  return { screenshot: rel, aspect };
}

/** Returns the centre point of a locator's bounding box in capture-space CSS px. */
export async function clickTarget(page: Page, locator: any): Promise<Point | null> {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 4000 });
    const box = await locator.boundingBox();
    if (!box) return null;
    return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  } catch {
    return null;
  }
}

/** Blurs focus and scrolls to the top so screenshots have a clean, consistent start. */
export async function topOfPage(page: Page): Promise<void> {
  // The app sets `scroll-behavior: smooth`, so window.scrollTo animates. A prior
  // scrollIntoViewIfNeeded (e.g. from clickTarget on a button low on the page) may
  // still be animating; force instant scrolling and jump to top.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
  // Second instant jump overrides any residual smooth-scroll that resumed after the
  // first jump (capture page is disposable, so leaving scroll-behavior=auto is fine).
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
}
