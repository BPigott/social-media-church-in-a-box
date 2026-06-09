# Dashboard & App Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the signed-in application (Dashboard, Library, Settings, Billing) to the landing page's editorial brand, behind a collapsible icon-rail shell, while preserving 100% of existing functionality — especially in-place content editing.

**Architecture:** Additive and incremental. We build a new app shell and a new searchable language picker, then reskin existing markup in place. Generation, translation, editing (MDEditor), export, and restore-on-focus logic are **reused verbatim** — we change presentation (Tailwind classes, component wrappers, brand tokens) and wire new presentational components to the *existing* state and handlers in `src/pages/Dashboard.tsx`. The high-risk review internals (`renderSocialPlatform` and the edit/save/retranslate flow) are restyled in place, **not rewritten**.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind (HSL design tokens in `src/index.css`), shadcn/ui, phosphor-react icons, `@uiw/react-md-editor`. Brand fonts: Playfair Display (`font-playfair`), Inter (`font-inter`).

---

## Verification approach (read first)

This repo has **no frontend test framework** (no vitest/jest/testing-library; `npm` scripts are `dev`, `build`, `build:dev`, `lint`, `preview`). We will **not** add one as part of this launch-prep work. Each task is verified by:

1. **`npm run lint`** — must pass (no new errors).
2. **`npm run build`** — must pass (TypeScript typecheck + production build).
3. **Manual browser verification** via the dev server (`npm run dev`, http://localhost:5173) using the preview tools. To exercise authenticated pages without local Supabase, use the production-Supabase dev command from `CLAUDE.md`:
   ```bash
   VITE_SUPABASE_URL=https://gxgijxmwipnurubqupbt.supabase.co \
   VITE_SUPABASE_PUBLISHABLE_KEY=<key from .env.production> \
   npx vite --port 8083
   ```

**Editing is a first-class verification concern.** Any task that touches the review panel MUST manually confirm, in the browser, that: Edit → modify text → Save persists; Cancel discards; multi-language MDEditor edits + "Re-translate from English" still work; Copy still works. These checks are written explicitly into the relevant tasks.

Commit after every task so regressions are easy to bisect.

---

## File Structure

**New files:**

| File | Responsibility |
|---|---|
| `src/components/layout/AppShell.tsx` | Page frame: sidebar + main content slot. Wraps signed-in pages. |
| `src/components/layout/Sidebar.tsx` | Collapsible icon-rail nav, church/subscription anchor, collapse persistence. |
| `src/components/layout/SidebarNavItem.tsx` | One nav row: icon + label, active state, hover flyout when collapsed. |
| `src/components/ui/section-marker.tsx` | Oversized italic Playfair numeral + title ("01 Create content"). |
| `src/components/dashboard/LanguagePicker.tsx` | Searchable language popover + selected chips + per-chip primary/remove menu. |

**Modified files:**

| File | Change |
|---|---|
| `src/pages/Dashboard.tsx` | New layout (shell + welcome + 01/02 panels), reskinned controls, new LanguagePicker, reskinned review, remove length labels, branded generating + empty states. |
| `src/pages/Library.tsx` | Wrap in AppShell; reskin to warm card grid. |
| `src/pages/Settings.tsx` | Wrap in AppShell; accent-topped form cards. |
| `src/pages/Billing.tsx` | Wrap in AppShell; brand card treatment. |
| `src/components/Navigation.tsx` | Becomes unused on these pages (kept for any non-shell routes; do not delete blindly). |
| `tailwind.config.ts` | Add a `bg-gradient` utility only if needed for the Generate button (otherwise inline). |

**Reused verbatim (do not change logic):** all hooks (`useAuth`, `useChurch`, `useSubscription`), `SeriesSelector.tsx`, `TrialBanner.tsx`, all Dashboard handlers (`handleGenerate`, `handleFileUpload`, `handleStartEdit/SaveEdit/CancelEdit`, `handleRetranslate`, `handleLanguageToggle`, `handlePrimaryLanguageChange`, `handleStartFresh`, `copyToClipboard`, `downloadAll`).

---

## Task 1: Section marker primitive

**Files:**
- Create: `src/components/ui/section-marker.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from "@/lib/utils";

interface SectionMarkerProps {
  /** Two-digit string, e.g. "01" */
  numeral: string;
  title: string;
  /** Accent colour for the numeral. Defaults to terracotta (primary). */
  tone?: "primary" | "secondary";
  className?: string;
}

/**
 * Editorial section header: an oversized italic Playfair numeral beside a
 * Playfair title. Mirrors the landing page's I/II/III treatment.
 */
export function SectionMarker({ numeral, title, tone = "primary", className }: SectionMarkerProps) {
  return (
    <div className={cn("flex items-baseline gap-3 mb-5", className)}>
      <span
        className={cn(
          "font-playfair italic leading-none text-3xl md:text-4xl opacity-55 select-none",
          tone === "primary" ? "text-primary" : "text-secondary"
        )}
        aria-hidden="true"
      >
        {numeral}
      </span>
      <h2 className="font-playfair font-bold text-lg md:text-xl text-foreground">{title}</h2>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS (no new errors).

- [ ] **Step 3: Build (typecheck)**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/section-marker.tsx
git commit -m "feat(ui): add editorial SectionMarker primitive"
```

---

## Task 2: Sidebar nav item

**Files:**
- Create: `src/components/layout/SidebarNavItem.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Icon } from "phosphor-react";

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: Icon;
  active: boolean;
  collapsed: boolean;
}

/**
 * Single sidebar nav row. When collapsed, shows icon only and reveals the
 * label as a hover flyout (CSS group-hover, no JS).
 */
export function SidebarNavItem({ to, label, icon: IconCmp, active, collapsed }: SidebarNavItemProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/navitem relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary text-primary-foreground font-semibold shadow-[0_7px_16px_-7px_hsl(var(--primary)/0.6)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <IconCmp size={18} weight={active ? "fill" : "regular"} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 z-50 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md group-hover/navitem:block"
        >
          {label}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/SidebarNavItem.tsx
git commit -m "feat(layout): add SidebarNavItem with collapsed hover flyout"
```

---

## Task 3: Sidebar

**Files:**
- Create: `src/components/layout/Sidebar.tsx`

Reuses the nav model and sign-out logic from the current `src/components/Navigation.tsx` (House/FileText/Gear/CreditCard/SignOut icons, `signOut` from `@/lib/auth`).

- [ ] **Step 1: Create the component**

```tsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { House, FileText, Gear, CreditCard, SignOut, CaretLeft, CaretRight } from "phosphor-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useSubscription } from "@/hooks/useSubscription";
import { SidebarNavItem } from "./SidebarNavItem";

const COLLAPSE_KEY = "ivangel:sidebarCollapsed";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: House },
  { to: "/library", label: "Library", icon: FileText },
  { to: "/settings", label: "Settings", icon: Gear },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

interface SidebarProps {
  /** Mobile drawer open state (controlled by AppShell). */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function subscriptionLabel(sub: ReturnType<typeof useSubscription>): string {
  if (!sub) return "";
  if (sub.exempt) return "Active";
  if (sub.status === "trialing") {
    const days = sub.daysRemaining ?? 0;
    return `Trial · ${days} day${days === 1 ? "" : "s"} left`;
  }
  if (sub.status === "active") return "Active";
  return sub.status ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1) : "";
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { primaryChurch } = useChurch(user?.id);
  const subscription = useSubscription(user?.id);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === "true"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, String(collapsed)); } catch { /* ignore */ }
  }, [collapsed]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    } else {
      navigate("/login");
    }
  };

  const churchName = primaryChurch?.name ?? "Your church";
  const subLabel = subscriptionLabel(subscription);
  const initials = churchName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden transition-opacity",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "z-50 flex flex-col border-r border-sidebar-border bg-sidebar-background px-3 py-4",
          // desktop
          "md:sticky md:top-0 md:h-screen transition-[width] duration-200",
          collapsed ? "md:w-[64px]" : "md:w-[200px]",
          // mobile drawer
          "fixed inset-y-0 left-0 w-[240px] transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand + collapse toggle */}
        <div className={cn("mb-5 flex items-center gap-2 px-1", collapsed && "md:justify-center")}>
          <div className="h-4 w-4 shrink-0 rounded-full bg-primary" />
          {!collapsed && <span className="font-playfair text-lg font-bold text-foreground">Ivangel</span>}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto hidden rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:block"
          >
            {collapsed ? <CaretRight size={14} /> : <CaretLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1" onClick={onMobileClose}>
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={location.pathname === item.to}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Church anchor + sign out */}
        <div className="mt-auto flex flex-col gap-2">
          {collapsed ? (
            <div
              title={`${churchName}${subLabel ? ` — ${subLabel}` : ""}`}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
            >
              {initials}
            </div>
          ) : (
            <div className="rounded-xl border border-sidebar-border bg-card p-3">
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Signed in as</p>
              <p className="truncate text-xs font-bold text-foreground">{churchName}</p>
              {subLabel && <p className="mt-1 text-[10px] font-semibold text-secondary">● {subLabel}</p>}
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "md:justify-center md:px-0"
            )}
          >
            <SignOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Verify `useSubscription` shape matches the helper**

Open `src/hooks/useSubscription.tsx`. Confirm the returned object exposes `status`, `exempt`, and a days-remaining value. If the days field is named differently than `daysRemaining`, update `subscriptionLabel` accordingly. If `useSubscription` takes no argument or a different signature, adjust the call. (This step prevents a type mismatch — do not skip.)

Run: `npm run build`
Expected: PASS. If it fails on `subscription.daysRemaining` or the hook signature, fix per the actual hook shape, then re-run.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(layout): add collapsible icon-rail sidebar with church anchor"
```

---

## Task 4: AppShell

**Files:**
- Create: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState, type ReactNode } from "react";
import { List } from "phosphor-react";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Frame for all signed-in pages: collapsible sidebar + main content area.
 * On mobile the sidebar is a slide-out drawer toggled by the top bar button.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background md:flex">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-border bg-sidebar-background px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-1 text-foreground"
          >
            <List size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-primary" />
            <span className="font-playfair text-base font-bold">Ivangel</span>
          </div>
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat(layout): add AppShell frame with mobile drawer toggle"
```

---

## Task 5: Mount the shell on the Dashboard (structure only, controls untouched)

This task swaps the page chrome only: replace `<Navigation/>` + `bg-background p-8` wrapper with `<AppShell>`, and rebrand the welcome header. The Create/Review card internals are left exactly as-is in this task (they get reskinned in Tasks 7–10). This isolates layout risk from control/review risk.

**Files:**
- Modify: `src/pages/Dashboard.tsx` (imports near top; render `~1601-1611`)

- [ ] **Step 1: Update imports**

In the import block at the top of `src/pages/Dashboard.tsx`, remove the `Navigation` import line:

```tsx
import { Navigation } from "@/components/Navigation";
```

and add:

```tsx
import { AppShell } from "@/components/layout/AppShell";
import { SectionMarker } from "@/components/ui/section-marker";
```

(Keep the `TrialBanner` import.)

- [ ] **Step 2: Replace the page wrapper and welcome header**

Find (around lines 1601–1611):

```tsx
  return <>
      <Navigation />
      <TrialBanner />
      <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold mb-2">
            Welcome back, {primaryChurch?.name}!
          </h1>
          <p className="text-muted-foreground">Generate social media content and Bible study guides from your sermon transcripts or events</p>
        </div>
```

Replace with:

```tsx
  return (
    <AppShell>
      <TrialBanner />
      <div className="p-6 md:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <div className="mb-2 h-[3px] w-10 rounded bg-primary" />
            <h1 className="font-playfair text-3xl font-bold text-foreground md:text-4xl">
              Welcome back, <span className="font-bold">{primaryChurch?.name ?? "friend"}</span>
            </h1>
            <p className="mt-1 italic text-muted-foreground">
              Let's turn Sunday's message into a full week of content.
            </p>
          </div>
```

- [ ] **Step 3: Close the new wrappers at the end of the return**

The original return ends with two closing `</div>`s, the closing of the `bg-background` div, and `</>`. Find the end of the JSX (after the Output `Card` closes — around the final `</div></div></>`). The structure must now close: inner `max-w-6xl` div, the `p-6` div, then `</AppShell>` and `)`.

Locate the tail (it currently looks like):

```tsx
        </div>
      </div>
    </>;
```

Replace with:

```tsx
        </div>
      </div>
    </AppShell>
  );
```

Note: the original opened `<div className="min-h-screen bg-background p-8">` then `<div className="max-w-6xl mx-auto space-y-8">` — two divs. The new code opens `<div className="p-6 md:p-10">` then `<div className="mx-auto max-w-6xl space-y-8">` — also two divs. So the number of closing `</div>` tags is unchanged; only the outer `<>...</>` becomes `<AppShell>...</AppShell>` wrapped in `( )`. Verify brace/tag balance with the build in Step 5.

- [ ] **Step 4: Update the loading early-return to match (optional but consistent)**

Find (lines ~1596–1600):

```tsx
  if (loading || churchLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>;
  }
```

Leave as-is (it's fine outside the shell). No change required.

- [ ] **Step 5: Build (catches tag/brace imbalance)**

Run: `npm run build`
Expected: PASS. If it fails with JSX errors, re-check the opening/closing tag balance from Steps 2–3.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Manual verification**

Start the dev server (production-Supabase variant from CLAUDE.md), open the dashboard. Confirm:
- The sidebar renders with Dashboard active; Library/Settings/Billing navigate correctly; church name + trial status show at the bottom.
- Collapse toggle shrinks the sidebar to the icon rail; hovering a nav icon shows the label; the choice persists across reload.
- On a narrow viewport (preview_resize to ~390px), the sidebar hides and the top bar menu button opens it as a drawer.
- The welcome header shows the church name with the terracotta rule.
- **Generation still works end-to-end and editing still works** (Edit → Save on a generated post) — the internals are unchanged, but confirm the shell didn't break event handlers.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): mount AppShell and rebrand welcome header"
```

---

## Task 6: Wrap the Create and Review columns in branded panels

Wrap the two existing `Card`s in editorial panels with section markers and accent top-borders, without changing their inner content yet.

**Files:**
- Modify: `src/pages/Dashboard.tsx` (the `grid lg:grid-cols-2` block, ~1613; the two `<Card>` wrappers ~1615 and ~1959)

- [ ] **Step 1: Restyle the grid + Create card header**

Find (~1613–1619):

```tsx
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-playfair">Content Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
```

Replace with:

```tsx
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* Create content panel */}
          <Card className="border-t-4 border-t-primary shadow-tactile">
            <CardHeader>
              <SectionMarker numeral="01" title="Create content" tone="primary" />
            </CardHeader>
            <CardContent className="space-y-6">
```

(This makes the Create column a fixed-ish 360px and the Review column flexible, matching the design. `CardTitle`/`CardHeader` are still imported; `SectionMarker` replaces the title.)

- [ ] **Step 2: Restyle the Review card header**

Find (~1959–1962):

```tsx
          {/* Output Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-playfair">Generated Content</CardTitle>
```

Replace with:

```tsx
          {/* Your content panel */}
          <Card className="border-t-4 border-t-secondary shadow-tactile">
            <CardHeader>
              <div className="flex items-center justify-between">
                <SectionMarker numeral="02" title="Your content" tone="secondary" className="mb-0" />
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Confirm the two panels show "01 Create content" (terracotta numeral, terracotta top-rule) and "02 Your content" (sage numeral, sage top-rule); the Create column is narrower than the Review column; everything still functions.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): wrap create/review columns in editorial panels"
```

---

## Task 7: Reskin Create-panel controls to chips & segmented toggles

Convert the checkbox/radio controls to the chip/segmented style from the mockups. **Wiring is unchanged** — every control calls the same existing handler/setter. We only change markup/classes.

**Files:**
- Modify: `src/pages/Dashboard.tsx` — content-type block (~1620-1657), generation-mode block (~1659-1688), platform block (~1908-1921), posts-per-platform block (~1923-1936).

- [ ] **Step 1: Content types → chips**

Replace the content-type block (the `<div className="space-y-3"><Label>What would you like to generate?</Label>...` through its closing `</div>` at ~1657) with a chip group. Each chip toggles via the existing `handleContentTypeToggle`:

```tsx
              {/* Content Type Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What would you like to generate?</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "social_media", label: "Social posts" },
                    { key: "bible_study", label: "Bible study" },
                    { key: "devotional", label: "Devotional" },
                    { key: "podcast_description", label: "Podcast" },
                  ] as const).map(({ key, label }) => {
                    const on = contentTypes.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => handleContentTypeToggle(key)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                          on
                            ? "border-primary bg-primary font-semibold text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
```

- [ ] **Step 2: Generation mode → segmented control**

Replace the generation-mode block (~1659-1688) with a segmented toggle calling the existing `setGenerationMode`:

```tsx
              {/* Generation Mode Toggle */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What are you creating from?</p>
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                  {([
                    { key: "sermon", label: "Sermon" },
                    { key: "event", label: "Future event" },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGenerationMode(key)}
                      className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
                        generationMode === key
                          ? "bg-card font-semibold text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
```

- [ ] **Step 3: Platforms → chips**

Replace the platform block (~1908-1921) with chips calling the existing `handlePlatformToggle`:

```tsx
              {/* Platform Selection - Only show if Social Media is selected */}
              {contentTypes.includes('social_media') && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Social platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {(['facebook', 'instagram', 'tiktok', 'twitter'] as Platform[]).map(platform => {
                      const on = platforms.includes(platform);
                      const label = platform === 'twitter' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1);
                      return (
                        <button
                          key={platform}
                          type="button"
                          aria-pressed={on}
                          onClick={() => handlePlatformToggle(platform)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                            on
                              ? "border-primary bg-primary font-semibold text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
```

- [ ] **Step 4: Posts per platform → segmented**

Replace the posts-per-platform block (~1923-1936) keeping the existing `setPostsPerPlatform`:

```tsx
              {/* Posts per Platform - Only show if Social Media is selected */}
              {contentTypes.includes('social_media') && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Posts per platform</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPostsPerPlatform(num)}
                        className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                          postsPerPlatform === num
                            ? "border-foreground bg-foreground font-semibold text-background"
                            : "border-border text-muted-foreground hover:border-foreground/40"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
```

- [ ] **Step 5: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS. (If `Checkbox`/`Label` become unused imports and lint flags them, remove them from the import block — but only if no longer used elsewhere in the file; the event-detail and language sections may still use `Label`/`Input`/`Textarea`.)

- [ ] **Step 6: Manual verification**

Toggle content types, mode, platforms, and posts-per-platform. Confirm each reflects selection state and that switching to "Future event" mode swaps the Source area to event fields (existing conditional logic). Run a generation to confirm the selected options still flow through.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): reskin create controls as chips and segmented toggles"
```

---

## Task 8: Searchable LanguagePicker component

Replace the 22-checkbox grid + summary with a searchable popover + chips, wired to the **existing** `outputLanguages`, `primaryLanguage`, `handleLanguageToggle`, and `handlePrimaryLanguageChange`. The component receives data + callbacks as props; it owns no business logic.

**Files:**
- Create: `src/components/dashboard/LanguagePicker.tsx`
- Modify: `src/pages/Dashboard.tsx` — replace the language block (~1860-1906); export `LANGUAGE_NAMES`/`getSortedLanguages` or pass them in.

- [ ] **Step 1: Export the language data from Dashboard (or duplicate into a shared module)**

In `src/pages/Dashboard.tsx`, the `LANGUAGE_NAMES` map and `getSortedLanguages()` are module-scoped (top of file, ~74-107). To reuse them without a circular import, move both into a new shared file.

Create `src/lib/languages.ts`:

```ts
export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'pt': 'Portuguese',
  'de': 'German', 'ko': 'Korean', 'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)', 'ar': 'Arabic', 'fa': 'Persian (Farsi)',
  'pl': 'Polish', 'uk': 'Ukrainian', 'it': 'Italian', 'ru': 'Russian',
  'ja': 'Japanese', 'ro': 'Romanian', 'pa': 'Punjabi', 'ur': 'Urdu',
  'bn': 'Bengali', 'gu': 'Gujarati', 'cy': 'Welsh', 'lt': 'Lithuanian',
};

/** Native-script display names (shown as secondary text in the picker). */
export const LANGUAGE_NATIVE: Record<string, string> = {
  'en': 'English', 'es': 'Español', 'fr': 'Français', 'pt': 'Português',
  'de': 'Deutsch', 'ko': '한국어', 'zh': '简体中文', 'zh-TW': '繁體中文',
  'ar': 'العربية', 'fa': 'فارسی', 'pl': 'Polski', 'uk': 'Українська',
  'it': 'Italiano', 'ru': 'Русский', 'ja': '日本語', 'ro': 'Română',
  'pa': 'ਪੰਜਾਬੀ', 'ur': 'اردو', 'bn': 'বাংলা', 'gu': 'ગુજરાતી',
  'cy': 'Cymraeg', 'lt': 'Lietuvių',
};

export const getSortedLanguages = (): [string, string][] => {
  const entries = Object.entries(LANGUAGE_NAMES);
  const english = entries.filter(([code]) => code === 'en');
  const others = entries
    .filter(([code]) => code !== 'en')
    .sort((a, b) => a[1].localeCompare(b[1]));
  return [...english, ...others];
};
```

Then in `src/pages/Dashboard.tsx`: delete the local `LANGUAGE_NAMES` const (~74-97) and the local `getSortedLanguages` (~100-107), and add to the imports:

```tsx
import { LANGUAGE_NAMES, getSortedLanguages } from "@/lib/languages";
```

(Leave all usages of `LANGUAGE_NAMES`/`getSortedLanguages` in the file as-is; they now resolve to the import.)

- [ ] **Step 2: Build to confirm the move didn't break references**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Create the LanguagePicker**

Uses the shadcn `Popover` + `Command` components if present; the repo uses shadcn, so `@/components/ui/popover` and `@/components/ui/command` should exist. If `command` is absent, fall back to a plain input + filtered list (code below uses Popover + a simple filtered list to avoid the dependency).

```tsx
import { useState, useMemo } from "react";
import { Plus, Star, X, MagnifyingGlass, Check } from "phosphor-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { LANGUAGE_NAMES, LANGUAGE_NATIVE, getSortedLanguages } from "@/lib/languages";
import { cn } from "@/lib/utils";

interface LanguagePickerProps {
  outputLanguages: string[];
  primaryLanguage: string;
  /** Existing Dashboard handler — toggles a language on/off (English locked, 3 max). */
  onToggle: (code: string) => void;
  /** Existing Dashboard handler — sets the primary language. */
  onPrimaryChange: (code: string) => void;
}

const MAX_LANGUAGES = 3;

export function LanguagePicker({ outputLanguages, primaryLanguage, onToggle, onPrimaryChange }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const atLimit = outputLanguages.length >= MAX_LANGUAGES;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getSortedLanguages().filter(([code, name]) => {
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        (LANGUAGE_NATIVE[code] ?? "").toLowerCase().includes(q) ||
        code.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Languages ({outputLanguages.length} of {MAX_LANGUAGES})
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {outputLanguages.map((code) => {
          const isPrimary = code === primaryLanguage;
          const locked = code === "en";
          return (
            <div key={code} className="relative">
              <button
                type="button"
                onClick={() => setMenuFor((m) => (m === code ? null : code))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  "border-accent bg-accent font-semibold text-accent-foreground",
                  isPrimary && "ring-2 ring-accent ring-offset-2 ring-offset-card"
                )}
              >
                {isPrimary && <Star size={12} weight="fill" />}
                {LANGUAGE_NAMES[code] ?? code}
              </button>

              {menuFor === code && (
                <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => { onPrimaryChange(code); setMenuFor(null); }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Star size={14} /> Set as primary
                    </button>
                  )}
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => { onToggle(code); setMenuFor(null); }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-destructive hover:bg-muted"
                    >
                      <X size={14} /> Remove language
                    </button>
                  )}
                  {locked && (
                    <p className="px-2.5 py-2 text-xs text-muted-foreground">English is always included.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!atLimit && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Plus size={14} /> Add
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
              <div className="mb-2 flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
                <MagnifyingGlass size={14} className="text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 22 languages…"
                  className="h-6 border-0 p-0 text-sm focus-visible:ring-0"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {results.map(([code, name]) => {
                  const selected = outputLanguages.includes(code);
                  const locked = code === "en";
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={locked || (selected ? false : outputLanguages.length >= MAX_LANGUAGES)}
                      onClick={() => { if (!locked && !selected) { onToggle(code); setOpen(false); setQuery(""); } }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted disabled:cursor-default",
                        selected && "bg-accent/10"
                      )}
                    >
                      <span>
                        {name}{" "}
                        <span className="text-xs text-muted-foreground">
                          {locked ? "· always on" : LANGUAGE_NATIVE[code] ?? ""}
                        </span>
                      </span>
                      {selected && <Check size={14} className="text-accent" weight="bold" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {atLimit && (
        <p className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          Maximum {MAX_LANGUAGES} languages reached — remove one to add another.
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">★ = primary · tap a chip to manage it. English is the source for all translations.</p>
    </div>
  );
}
```

- [ ] **Step 4: Wire it into Dashboard**

In `src/pages/Dashboard.tsx`, add to imports:

```tsx
import { LanguagePicker } from "@/components/dashboard/LanguagePicker";
```

Replace the entire language block (~1860-1906, the `{contentTypes.length > 0 && ( ... )}` containing the grid + summary) with:

```tsx
              {/* Language Selection - Show when ANY content type is selected */}
              {contentTypes.length > 0 && (
                <LanguagePicker
                  outputLanguages={outputLanguages}
                  primaryLanguage={primaryLanguage}
                  onToggle={handleLanguageToggle}
                  onPrimaryChange={handlePrimaryLanguageChange}
                />
              )}
```

- [ ] **Step 5: Confirm Popover exists**

Run: `ls src/components/ui/popover.tsx`
Expected: file exists. If it does not, create it via the shadcn pattern used by other `ui` components, or replace the `Popover` usage with a simple absolutely-positioned `div` toggled by `open` (mirroring the per-chip menu above). Do not add a new npm dependency.

- [ ] **Step 6: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 7: Manual verification**

- English shows as a locked chip with ★ (primary by default).
- "+ Add" opens the searchable popover; typing "kor"/"한" filters to Korean; native scripts show.
- Adding two languages hides "+ Add" and shows the "Maximum 3 reached" note.
- Tapping a non-English chip → menu → "Set as primary" moves the ★; "Remove language" removes it.
- Run a multi-language generation and confirm the primary/other languages render in the review panel exactly as before.

- [ ] **Step 8: Commit**

```bash
git add src/lib/languages.ts src/components/dashboard/LanguagePicker.tsx src/pages/Dashboard.tsx
git commit -m "feat(dashboard): searchable language picker replacing checkbox grid"
```

---

## Task 9: Remove character-count quality indicators

Drop the length/quality badges from the social review while leaving everything else (edit/save/copy/retranslate) intact.

**Files:**
- Modify: `src/pages/Dashboard.tsx` — `getLengthIndicator` definition (~143-241), its call (~1999), and the badge render line (~2207-2210).

- [ ] **Step 1: Remove the badge render**

In `renderSocialPlatform`, find (~2207-2210):

```tsx
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${lengthInfo.color}`}>
                                {lengthInfo.status} {lengthInfo.message} {platform === 'instagram' && `• Total: ${displayContent.length} chars`} {platform !== 'instagram' && platform !== 'tiktok' && platform !== 'twitter' && `• ${displayContent.length} chars`}
                              </p>
                              <div className="flex gap-2">
```

Replace with (drop the length `<p>`, keep the action buttons right-aligned):

```tsx
                            <div className="flex items-center justify-end">
                              <div className="flex gap-2">
```

- [ ] **Step 2: Remove the now-unused `lengthInfo` local**

In `renderSocialPlatform`, delete the line (~1999):

```tsx
                    const lengthInfo = getLengthIndicator(displayContent, platform);
```

- [ ] **Step 3: Remove the `getLengthIndicator` function and `countWords` if unused**

Delete the `getLengthIndicator` definition (~143-241). Then check whether `countWords` (~138-140) is referenced anywhere else:

Run: `grep -n "countWords\|getLengthIndicator" src/pages/Dashboard.tsx`
Expected after deletion: no remaining references. If `countWords` is now unused, delete it too. If `grep` shows other uses, leave those definitions.

- [ ] **Step 4: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS (and lint should no longer warn about unused `getLengthIndicator`).

- [ ] **Step 5: Manual verification**

Generate social posts. Confirm no "✓ ideal / ⚠ / ❌ / N chars" labels appear, and Edit/Save/Copy still work on each post.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "refactor(dashboard): remove character-count quality indicators from review"
```

---

## Task 10: Reskin review items + serif pull-quote (editing preserved)

Restyle the review content cards and add a Playfair pull-quote lead per item. **Do not alter** `handleStartEdit`, `handleSaveEdit`, `handleCancelEdit`, `handleRetranslate`, `copyToClipboard`, the `MDEditor` elements, or the collapsible multi-language structure. Only wrapper markup/classes and the addition of a pull-quote derived from existing content.

**Files:**
- Modify: `src/pages/Dashboard.tsx` — the `renderSocialPlatform` return wrapper (~2018-2022 area) and the analogous bible-study/devotional/podcast tab wrappers (further down the file, same pattern).

- [ ] **Step 1: Add a pull-quote helper near the other render helpers**

Inside the Dashboard component (or module scope), add a small pure helper:

```tsx
// Extract a short lead line for the editorial pull-quote. Falls back to the
// first sentence/line; returns null when content is too short to quote.
const leadQuote = (text: string): string | null => {
  if (!text) return null;
  const firstLine = text.replace(/[#*_>`]/g, "").split("\n").map(l => l.trim()).find(Boolean);
  if (!firstLine || firstLine.length < 20) return null;
  const sentence = firstLine.split(/(?<=[.!?])\s/)[0];
  const quote = (sentence.length > 8 ? sentence : firstLine).slice(0, 140);
  return quote.length < firstLine.length ? `${quote}…` : quote;
};
```

- [ ] **Step 2: Add the pull-quote to the social platform render**

In `renderSocialPlatform`, the returned JSX begins (~2018-2022):

```tsx
                    return (
                      <div className="space-y-3">
                        <div className="text-xs text-muted-foreground mb-4">
                          {platformTips[platform]}
                        </div>
```

Replace the `platformTips` hint block with a pull-quote (the platform tips referenced character counts we're moving away from; the pull-quote is the editorial replacement):

```tsx
                    const quote = leadQuote(displayContent);
                    return (
                      <div className="space-y-3">
                        {quote && (
                          <p className="border-l-2 border-accent pl-3 font-playfair text-base leading-snug text-foreground/80">
                            "{quote}"
                          </p>
                        )}
```

(You may delete the now-unused `platformTips` object just above the return.)

- [ ] **Step 3: Reskin the non-multilanguage view container**

The non-multilanguage branch shows either the `MDEditor` or a `ScrollArea`. Leave the `MDEditor` block untouched. The `ScrollArea` fallback (~2201-2205) can keep its structure; optionally soften its background from `bg-muted` to `bg-card`:

```tsx
                              <ScrollArea className="border rounded-lg h-[500px]">
                                <div className="bg-card p-4">
                                  <p className="whitespace-pre-wrap">{displayContent}</p>
                                </div>
                              </ScrollArea>
```

Do not change the `isEditing` logic, Save/Cancel/Edit buttons, or the MDEditor props.

- [ ] **Step 4: Apply the same pull-quote treatment to the other content tabs**

Locate the bible-study, devotional, and podcast `TabsContent` render blocks (below `renderSocialPlatform`, same file). For each, where the primary content is shown, add the same pull-quote lead above the content using `leadQuote(<that content's display value>)`. Keep all edit/save/copy/retranslate handlers and MDEditor instances unchanged. (The exact display variable differs per tab — use the variable already passed to that tab's `MDEditor`/markdown render.)

- [ ] **Step 5: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS. Remove any now-unused locals lint flags (e.g. `platformTips`).

- [ ] **Step 6: Manual verification — EDITING IS THE PRIORITY CHECK**

Generate content with at least one social platform, a Bible study, and two languages. Then verify ALL of:
- Each item shows a Playfair pull-quote lead.
- **Social, English-only:** Edit → change text → Save persists after re-render; Cancel discards.
- **Multi-language:** edit the primary-language MDEditor; click "Re-translate from English"; confirm translations update and the English reference/other-language collapsibles still open and copy.
- **Bible study / devotional:** Edit → Save works; pull-quote shows.
- **Copy** buttons copy the right content; **Download All** (txt/docx/pdf/html) still works.
- **Start Fresh** clears and the empty state shows.

If any editing path is broken, STOP and diff against the pre-task version — the handlers must be byte-for-byte unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): editorial review cards with serif pull-quotes"
```

---

## Task 11: Branded generating state + gradient Generate button + empty state

**Files:**
- Modify: `src/pages/Dashboard.tsx` — Generate button (~1938-1954), empty state (~1988-1990), and the generating indicator shown in the review panel during `generating`.

- [ ] **Step 1: Gradient Generate button**

Replace the Generate `<Button>` (~1938-1954) `className` to use the terracotta→ochre gradient while keeping the disabled logic and label expression unchanged:

```tsx
              <Button
                onClick={handleGenerate}
                disabled={
                  contentTypes.length === 0 ||
                  (generationMode === 'sermon' && !transcriptText.trim() && !customCTA.trim()) ||
                  (generationMode === 'event' && !eventName.trim()) ||
                  (contentTypes.includes('social_media') && platforms.length === 0) ||
                  generating
                }
                className="w-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_10px_22px_-7px_hsl(var(--primary)/0.55)] hover:opacity-95"
                size="lg"
              >
                {generating ? <>
                    <CircleNotch size={16} className="mr-2 animate-spin" />
                    Generating...
                  </> : generationMode === 'event' ? 'Generate Event Content' : `Generate ${contentTypes.includes('social_media') && contentTypes.includes('bible_study') && contentTypes.includes('devotional') ? 'Content' : contentTypes.includes('social_media') && contentTypes.includes('bible_study') ? 'Social Media & Bible Study' : contentTypes.includes('social_media') && contentTypes.includes('devotional') ? 'Social Media & Devotional' : contentTypes.includes('bible_study') && contentTypes.includes('devotional') ? 'Bible Study & Devotional' : contentTypes.includes('social_media') ? 'Social Media Posts' : contentTypes.includes('bible_study') ? 'Bible Study Guide' : contentTypes.includes('devotional') ? 'Daily Devotional' : 'Content'}`}
              </Button>
```

- [ ] **Step 2: Branded empty state**

Replace the empty-state block (~1988-1990):

```tsx
              {!generatedContent ? <div className="text-center py-12 text-muted-foreground">
                  <p>Your generated content will appear here</p>
                </div> : (() => {
```

with a welcoming card (the one place a gentle tilt is allowed):

```tsx
              {!generatedContent ? (
                generating ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <CircleNotch size={32} className="animate-spin text-primary" />
                    <p className="font-playfair text-lg text-foreground">Crafting your content…</p>
                    <p className="text-sm text-muted-foreground">Writing in your church's voice. This usually takes under a minute.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="-rotate-2 rounded-2xl border border-border bg-card p-6 shadow-tactile">
                      <p className="font-playfair text-xl text-foreground">Your content will appear here</p>
                      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                        Add a sermon or event on the left, choose what you'd like, then press <span className="font-semibold text-primary">Generate</span>.
                      </p>
                    </div>
                  </div>
                )
              ) : (() => {
```

(The `generating` branch gives the branded progress state when no prior content exists. When prior content exists, the Generate button spinner already covers the in-progress feedback.)

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 4: Manual verification**

- Fresh church / after Start Fresh: the tilted welcome card shows.
- Press Generate: the branded "Crafting your content…" state shows while generating; content replaces it on completion.
- The Generate button shows the terracotta→ochre gradient.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): gradient generate button, branded generating + empty states"
```

---

## Task 12: Apply AppShell to Library, Settings, Billing

For each page, replace its `<Navigation />` + page wrapper with `<AppShell>` and apply the brand card treatment. Each page is its own task-step group; verify and commit per page.

**Files:**
- Modify: `src/pages/Library.tsx`, `src/pages/Settings.tsx`, `src/pages/Billing.tsx`

- [ ] **Step 1: Library — read current structure**

Run: `grep -n "Navigation\|min-h-screen\|max-w-\|return (" src/pages/Library.tsx`
Note the wrapper pattern (it mirrors Dashboard: `<><Navigation/>...<div className="min-h-screen ...">`).

- [ ] **Step 2: Library — swap to AppShell**

Remove the `Navigation` import; add `import { AppShell } from "@/components/layout/AppShell";`. Replace the outer `<><Navigation />...<div className="min-h-screen bg-background ...">` wrapper with `<AppShell><div className="p-6 md:p-10"><div className="mx-auto max-w-6xl ...">`, and close with `</div></div></AppShell>`. Reskin the page heading to match the Dashboard welcome pattern (terracotta rule + Playfair). Reskin generation cards to `border border-border shadow-tactile rounded-xl` with Playfair titles and content-type tags. Keep all existing data fetching/actions unchanged.

- [ ] **Step 3: Library — build, lint, verify, commit**

```bash
npm run build && npm run lint
```
Verify in the browser: Library shows in the shell, the card grid is warm/branded, opening/searching/deleting past content still works.
```bash
git add src/pages/Library.tsx
git commit -m "feat(library): mount AppShell and reskin to warm card grid"
```

- [ ] **Step 4: Settings — swap to AppShell + accent-topped form cards**

Apply the same wrapper swap. Group settings into `Card`s with `border-t-4 border-t-primary shadow-tactile` and `SectionMarker` or Playfair headings. Keep all form logic/handlers unchanged.

```bash
npm run build && npm run lint
```
Verify: Settings renders in the shell; saving settings still works.
```bash
git add src/pages/Settings.tsx
git commit -m "feat(settings): mount AppShell and reskin form sections"
```

- [ ] **Step 5: Billing — swap to AppShell + brand cards**

Apply the wrapper swap; present plan/subscription status in branded cards. Keep all Stripe/subscription logic and links unchanged.

```bash
npm run build && npm run lint
```
Verify: Billing renders in the shell; subscription status and any checkout/manage links work.
```bash
git add src/pages/Billing.tsx
git commit -m "feat(billing): mount AppShell and reskin subscription cards"
```

---

## Task 13: Full-flow regression pass

**Files:** none (verification only).

- [ ] **Step 1: Cross-page navigation**

In the browser, click through Dashboard → Library → Settings → Billing via the sidebar (expanded and collapsed). Confirm active states, church anchor, and mobile drawer all behave.

- [ ] **Step 2: End-to-end generation + editing**

Run a full generation (sermon mode, 2 content types, 2 languages, 2 posts/platform). Then:
- Edit and Save a social post (English-only and multi-language).
- Re-translate from English.
- Edit and Save a Bible study.
- Copy several items; Download All in each format.
- Switch tabs/platforms; switch the active variation.
- Start Fresh; confirm empty state; reload to confirm restore-on-focus behaviour is intact.

- [ ] **Step 3: Event mode**

Switch to Future event mode; confirm the Source area swaps to event fields; generate event content; confirm output renders and edits/saves.

- [ ] **Step 4: Responsive**

preview_resize to mobile width; confirm panels stack (Create above Your content), sidebar becomes a drawer, and the language popover + edit flow still work.

- [ ] **Step 5: Screenshot proof**

Capture screenshots of the redesigned Dashboard (with content), the collapsed sidebar, and a mobile view to share with the user.

- [ ] **Step 6: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "fix(dashboard): regression fixes from full-flow verification"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Brand tokens / Playfair+Inter — Tasks 1, 5–11 use existing tokens and fonts. ✓
- Collapsible icon-rail shell + church anchor + mobile drawer — Tasks 2–4, mounted Task 5, applied to all pages Task 12. ✓
- Reskin-in-place generate→review single screen — Tasks 5–10. ✓
- Section numerals 01/02 — Tasks 1, 6. ✓
- Event-mode source swap — preserved (existing conditional), verified Tasks 7/13. ✓
- Searchable language picker, English-locked, 3-max, primary per chip — Task 8. ✓
- Serif pull-quotes — Task 10. ✓
- Gradient Generate button — Task 11. ✓
- Remove character-count labels — Task 9. ✓
- Branded generating + first-run empty (with allowed tilt) — Task 11. ✓
- Library/Settings/Billing on same system — Task 12. ✓
- Responsive stacking — Task 6 grid + Task 13 verification. ✓
- **Preserve editing** (explicit user requirement) — handlers reused verbatim; dedicated editing verification in Tasks 5, 10, 13. ✓
- Component extraction of the monolith — done for the safe units (shell, section marker, language picker, shared languages module); the review internals are reskinned in place rather than rewritten, to protect the edit flow at launch. This is a deliberate, documented refinement of the spec's architecture section (which noted decomposition "can be refined during planning").

**Placeholder scan:** No TBD/TODO; every code step contains real code. Task 12 steps 2/4/5 describe edits to files not yet read (Library/Settings/Billing) in prose rather than full diffs — by design, since their current markup is unknown; step 1 reads the structure first, and the wrapper-swap pattern is fully specified from the Dashboard precedent.

**Type consistency:** `handleLanguageToggle`/`handlePrimaryLanguageChange` signatures `(code: string) => void` match `LanguagePicker` props. `LANGUAGE_NAMES`/`getSortedLanguages` moved to `@/lib/languages` and re-imported in Dashboard. `useSubscription` field names are explicitly verified in Task 3 Step 2 before relying on them.

**Known follow-up (not blocking launch):** fuller extraction of `renderSocialPlatform` and the per-tab review blocks into `ReviewPanel`/`GeneratedItemCard` components can be done post-launch once an editing regression test harness exists.
