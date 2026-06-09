# Dashboard & App Shell Redesign — Design Spec

**Date:** 2026-06-05
**Branch:** `feature/launch-prep`
**Status:** Approved direction, ready for implementation plan

## Goal

Bring the signed-in application up to the same high-end editorial standard as the
marketing landing page (`src/pages/Index.tsx`), so the product feels like one
coherent, premium whole at launch. The current dashboard is stock shadcn
(`bg-background p-8`, a generic two-column card grid, a horizontal button nav)
and carries none of the brand. This redesign reskins and restructures the
signed-in shell while preserving **all existing functionality**.

Reference admired for clarity: ChronoTask (Outcrowd) dashboard. The brief:
"clear, high-end, not a generic AI feel."

## Non-Goals / Out of Scope

- No change to generation logic, edge functions, data model, or the content
  pipeline. This is presentation + layout only.
- No new features. We are preparing the *current* functionality for launch.
- No new content types or workflow steps (we explicitly rejected a guided
  step-flow in favour of reskinning the existing single-screen flow).
- Dark mode is not in scope (the app is light, warm "earthy editorial").

## Design Principles

The brand is already defined in `src/index.css` and `tailwind.config.ts` — this
redesign **uses the existing tokens**, it does not invent new ones.

- **Palette:** Sand `--background` (#f5f2eb), Earth `--foreground` (#3a352f),
  Terracotta `--primary` (#cb5d47), Sage `--secondary` (#8b997b), Ochre
  `--accent` (#d69f4c), Clay `--muted-foreground` (#7c6a5d), white cards.
- **Type:** Playfair Display (`font-playfair`) for headings; Inter
  (`font-inter`) for body/UI.
- **Surfaces:** rounded cards (`--radius` 0.75rem and larger), `shadow-tactile`
  for depth, hairline `border-border` separators.
- **Personality dial — "Balanced editorial + a pinch":** ChronoTask-clear
  structure with an unmistakable editorial voice. Specifically:
  - Playfair headings, thin terracotta top-rule on the welcome header,
    accent-topped cards, italic supporting lines.
  - **Serif pull-quote accents** in the review panel (a key line of each
    generated piece set in Playfair with an ochre left-rule).
  - **Oversized italic Playfair numerals** as section markers ("01 Create
    content", "02 Your content"), echoing the landing page's I/II/III.
  - **Gradient Generate button** (terracotta→ochre) as the single hero action;
    every other button stays solid terracotta.
  - **Rejected:** background colour blooms, card tilts on working panels.
    (A single gentle tilt is permitted on the first-run empty-state card only.)
- **Calm working surfaces:** the Create and Review panels stay quiet and legible;
  flourish lives in headers, section markers, the hero button, and pull-quotes —
  never on the dense controls.

## Information Architecture — App Shell

A single shell wraps **all** signed-in pages (Dashboard, Library, Settings,
Billing) for consistency. It replaces the current horizontal `Navigation`
component.

### Collapsible icon-rail sidebar

- **Default state:** expanded, ~180px, showing logo, icon + label nav, and a
  pinned church/account card at the bottom.
- **Collapsed state:** ~64px icon-only rail. Nav items show icons; labels appear
  as **hover flyouts**. The church card collapses to an **avatar**, with the
  full church name on hover.
- **Toggle:** a control to switch between expanded and collapsed; the choice
  persists (localStorage).
- **Church anchor:** always present — "Signed in as {church name}" plus
  subscription status (e.g. "Trial · 9 days left"). This is the persistent
  "you're in the right church" reassurance.
- **Nav items:** Dashboard, Library, Settings, Billing, plus Sign out. Active
  item uses solid terracotta with a soft shadow.
- **Mobile:** the rail becomes a **slide-out drawer** opened by a menu button in
  a slim top bar. This is the hamburger pattern, used only where it belongs.

### Rationale

For four desktop destinations a hamburger hides nav behind a click and drops the
church anchor for only ~64px of extra width over the rail. The icon rail keeps
nav and the church anchor permanently visible while reclaiming nearly all the
space a hamburger would.

## Dashboard Page

Structure is **reskin-in-place** of today's flow: generate on the left, review
on the right, one screen. No relearning for existing users.

### Welcome header

- Thin terracotta top-rule.
- Playfair greeting: "Welcome back, **{church name}**" — confirms the church.
- Italic Inter support line (e.g. "Let's turn Sunday's message into a full week
  of content.").

### Work area — two panels

| Panel | Width | Accent | Contents |
|---|---|---|---|
| **01 Create content** | fixed ~290px | terracotta top-border | all generation options |
| **02 Your content** | flex (fills rest) | sage top-border | review & export |

Section markers are oversized italic Playfair numerals (01 terracotta, 02 sage).

**Responsive:** below the lg breakpoint the panels **stack** — Create on top,
Your content below. The sidebar collapses to the mobile drawer.

### 01 — Create content panel (all current controls, regrouped)

In order:

1. **Mode** — segmented toggle: *Sermon* / *Future event*.
2. **Source** — upload/paste transcript (.pdf · .docx · .txt) drop zone.
   - In **event mode this group swaps** to event fields (name, date, location,
     description, signup link) in the same position.
3. **Sermon series** (optional) — dropdown selector + week number (sermon mode
   only).
4. **Content types** — selectable chips: Social posts, Bible study, Devotional,
   Podcast.
5. **Social platforms** — chips: Facebook, Instagram, TikTok, X (shown when
   Social posts is selected).
6. **Languages** — chip set + searchable picker (see below).
7. **Posts per platform** — 1 / 2 / 3 segmented selector.
8. **Generate** — gradient (terracotta→ochre) hero button.

### Language picker

- **English is always on and locked** — it is the source the others translate
  from (✓, "always on").
- **`+ Add` opens a searchable popover dropdown** listing all 22 supported
  languages, each with English name + native script (Español, 한국어, العربية…).
  Search filters instantly.
- **Maximum 3 languages total** (English + 2). At the limit, `+ Add` is hidden
  and a "Maximum 3 reached — remove one to add another" note shows. No
  dead-ends.
- **Primary language** is marked with a ★. **Tapping any chip** opens a small
  menu: *Set as primary* / *Remove language*.
- Primary renders as the main version in the review panel; other languages appear
  as translated variants beneath each post.
- This preserves the existing logic (`handleLanguageToggle`,
  `handlePrimaryLanguageChange`, English-always, 3-max) behind a cleaner UI than
  the current 22-item checkbox grid.

### 02 — Your content panel (review)

- Top-level tabs by content type (Social / Bible study / Devotional / Podcast /
  Event), with platform sub-tabs under Social.
- Each generated item is a card with:
  - A **serif pull-quote** lead line (Playfair, ochre left-rule).
  - The content body (editable in place via the existing MDEditor flow).
  - Actions: **Edit**, **Export** (PDF/DOCX), **Copy**.
  - Translated variants shown beneath, labelled by language.
- **REMOVED:** the character/word-count quality indicators ("✓ ideal",
  "⚠ recommended", "❌ too long"). The `getLengthIndicator` logic and its badges
  are dropped from the review UI entirely.

### States

- **Generating:** a branded progress state (terracotta accents, reassuring
  copy) in the review panel — not a bare spinner.
- **First-run / empty:** when a church has no content yet, the review panel shows
  a welcoming "Create your first content" card. This is the **one** place a
  gentle card tilt is allowed.
- **Restore-on-focus:** the existing behaviour (last completed generation is
  restored so content survives tab switches/refreshes) is preserved.

## Other Pages (same shell + design system)

- **Library** — warm card grid of past generations (replaces current layout
  with branded cards: Playfair titles, tactile shadows, content-type tags).
- **Settings** — clean form sections as accent-topped cards.
- **Billing** — same card treatment; subscription/plan status presented in the
  brand style.

These follow directly from the shell + tokens; no new interaction patterns.

## Component Architecture (design for isolation)

`src/pages/Dashboard.tsx` is currently a ~2,900-line monolith mixing layout,
state, file parsing, generation, translation, and export. As part of this
redesign we extract presentation into focused, independently-understandable
components. Logic/handlers stay in (or move to hooks called by) the page; the new
components are primarily presentational and receive props.

Proposed structure:

- `src/components/layout/AppShell.tsx` — the sidebar shell wrapping all signed-in
  routes (replaces `Navigation` usage on those pages).
  - `Sidebar.tsx` (collapsible rail, nav items, church anchor), with collapse
    state persisted.
- `src/components/dashboard/WelcomeHeader.tsx`
- `src/components/dashboard/CreateContentPanel.tsx` — composes the control
  groups:
  - `ModeToggle.tsx`, `SourceInput.tsx` (transcript ⟷ event swap),
    `ContentTypeChips.tsx`, `PlatformChips.tsx`, `LanguagePicker.tsx`,
    `PostsPerPlatform.tsx`, `GenerateButton.tsx`.
  - (`SeriesSelector.tsx` already exists and is reused.)
- `src/components/dashboard/ReviewPanel.tsx` — tabs + cards:
  - `GeneratedItemCard.tsx` (pull-quote + body + actions),
    `TranslatedVariant.tsx`, `GeneratingState.tsx`, `EmptyState.tsx`.

Exact decomposition can be refined during planning, but the goal is firm: no
single file should carry the whole dashboard, and each component should be
understandable and testable on its own.

## Acceptance Criteria

- All four signed-in pages share the collapsible icon-rail shell with a
  persistent church/subscription anchor.
- The dashboard preserves the generate→review single-screen flow and every
  existing control (mode, source/event swap, series, content types, platforms,
  languages, posts-per-platform, generate).
- Language `+ Add` is a searchable dropdown; English locked; 3-max enforced with
  no dead-ends; primary selectable per chip.
- Character-count quality indicators no longer appear in the review panel.
- The design uses only existing brand tokens; headings are Playfair, body Inter.
- Balanced-editorial polish present: welcome top-rule, section numerals, serif
  pull-quotes, gradient Generate button; no blooms, no working-panel tilts.
- Branded generating state and first-run empty state implemented.
- Responsive: panels stack and sidebar becomes a drawer on mobile.
- No regression in generation, translation, edit, export, restore-on-focus.

## Open Questions

- None blocking. Library/Settings/Billing visual detail will follow the shared
  system and can be confirmed during implementation.
