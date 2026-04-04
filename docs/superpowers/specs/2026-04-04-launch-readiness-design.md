# Launch Readiness Design
**Date:** 2026-04-04  
**Status:** Approved  

## Context

Ivangel is an AI-powered content generation SaaS for churches — sermon transcripts in, social posts, devotionals, study guides, and podcast descriptions out, in 15+ languages. Chunks 1–7 of development are complete: all content types built, subscription gating, trial flow, and landing page redesign are done. The platform is not yet launched to paying customers.

This design covers the work required to reach a solid public launch state. An infrastructure audit identified reliability and security gaps. User testing surfaced a critical UX failure (generated content lost on tab switch). The newsletter content type does not function and should be deferred. The dashboard visual design does not match the landing page. New churches have no guided onboarding and churn before reaching the product's core value.

**Intended outcome:** A platform that is reliable, visually coherent, and converts trial sign-ups into active users through a voice-first onboarding experience.

---

## Approach: Two Parallel Streams + Sequential Onboarding

### Stream 1 — Backend Reliability
**Branch:** `feature/backend-reliability`  
**Nature:** Server-side only. No frontend changes.

### Stream 2 — Dashboard Redesign
**Branch:** `feature/dashboard-redesign`  
**Nature:** Frontend only. No backend changes.

### Stream 3 — Onboarding
**Branch:** `feature/onboarding`  
**Sequencing:** Begins after Stream 1 merges. Requires the generation ledger and scraper fix from Stream 1.

### Payment Integration
Paddle webhook and checkout integration. Built speculatively within Stream 1, activated once merchant account is approved. Stripe as fallback if Paddle rejects.

---

## Stream 1: Backend Reliability

### 1. Generation Ledger (fixes tab-switching content loss)

**Problem:** Generated content lives only in React state. Tab switch, refresh, or re-render loses everything.

**Solution:** A `generations` table in Supabase. Every generation request writes a row before calling Claude; the row is updated on completion.

**Schema:**
```sql
create table generations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid unique not null,
  user_id uuid references auth.users not null,
  church_id uuid references churches not null,
  created_at timestamptz default now(),
  completed_at timestamptz,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  content_types text[] not null,
  platforms text[],
  generation_mode text not null,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10,6),
  result jsonb
);
```

RLS: users can read/write their own rows only. Service role manages all.

The frontend loads the most recent completed generation on dashboard mount — so content survives any browser event.

### 2. Idempotency on Generation Requests

**Problem:** Double-click or network retry fires two Haiku calls, both billed.

**Solution:** Frontend generates a UUID `idempotency_key` per generation attempt. Edge function inserts into `generations` with the key (unique constraint). If insert fails (duplicate), return the existing result. If a `pending` row exists for this user, return 429 — one in-flight generation at a time.

### 3. Server-Side Subscription Enforcement

**Problem:** Subscription check lives in `src/hooks/useSubscription.tsx` (frontend). Anyone with a valid JWT and the edge function URL can generate without a paid subscription.

**Solution:** Move the check into `generate-social-posts/index.ts`. After auth, query the `subscriptions` table. If status is not `active | trialing | exempt`, return 402 before calling Claude. Frontend gating remains as a UX layer only.

### 4. Token Budget Tracking

**Problem:** No per-user cost visibility. Power users can consume disproportionate tokens with no guardrails.

**Solution:** Write `input_tokens` and `output_tokens` from the Anthropic API response to the `generations` row. Add a pre-flight check: compute rolling 30-day token cost for the user; if over tier limit, return 402 before calling Claude. Start with a generous limit (e.g. £5/month of compute per user on the £25/month tier).

### 5. Content Safety Re-enabled

**Problem:** `CONTENT_SAFETY_ENABLED = false` in `generate-social-posts/index.ts`. The module is written and functional. A church SaaS with disabled content filtering is a liability.

**Solution:** Remove the feature flag. Enable unconditionally.

**File:** `supabase/functions/generate-social-posts/index.ts:26`

### 6. Newsletter Removal

Remove `email_newsletter` from:
- `generate-social-posts/index.ts` — delete content type flag, prompt block, and output handling
- Frontend content type selector in `src/pages/Dashboard.tsx`

Defer to a future release when the feature is working correctly.

### 7. Web Scraper Fix

The `scrape-church-website` edge function is a dependency for onboarding (Stream 3). Verify it works end-to-end against real church websites. Fix any failures. Add a manual paste fallback in the UI if the URL fails — but the URL route is primary.

**File:** `supabase/functions/scrape-church-website/`

### 8. Paddle Payment Integration

Replace LemonSqueezy with Paddle:
- New webhook handler at `supabase/functions/paddle-webhook/` (replaces `lemonsqueezy-webhook/`)
- Subscription table columns renamed from `ls_*` to `paddle_*`
- Checkout URL environment variable updated to Paddle link
- `src/pages/Billing.tsx` updated to reference Paddle checkout

Built in this stream. Activated once merchant account approved.

### Testing (Stream 1)

Written test-first. A sub-agent writes integration tests before implementation and only reports back when all pass.

Key invariants:
- Duplicate `idempotency_key` returns existing result, not a second Claude call
- Over-quota user receives 402 before Claude is called (verify via logs — no API call made)
- Request with `ANTHROPIC_API_KEY` unset returns structured error, not a runtime crash
- Content matching profanity patterns returns 400 with `violations` field
- Valid JWT for free-tier over-quota user returns 402 from edge function directly (not frontend-gated)
- Large transcript (5.9MB) processes; 6.1MB returns 413 with user-friendly message

---

## Stream 2: Dashboard Redesign

### Visual Direction

Apply the landing page's established design system to the dashboard:
- **Palette:** earthy warm tones, the `--accent-warm`, `--accent-action`, `--accent-trust` tokens already defined in Tailwind config
- **Typography:** Playfair Display for headings, Inter for body — already loaded
- **Cards:** `shadow-tactile` utility, `rounded-2xl`, warm border tones
- **States:** form, generating, and results are three visually distinct states, not a spinner overlay

No new design decisions. Consistency with what's already shipped.

### Generation Progress Bar

**Problem:** 20–60 second generation wait with no feedback. Looks broken.

**Solution:** A staged progress indicator with labelled steps that advance during generation:
1. "Reading your sermon…" (0–20%)
2. "Crafting your posts…" (20–60%)
3. "Translating to [language]…" (60–90%, only shown if translation selected)
4. "Finishing up…" (90–99%)

Timed simulation — the edge function returns a single response, not a stream. Steps are timed estimates that look credible. Bar completes to 100% when the response arrives.

### UX Improvements

- **One-click copy** per content piece in results panel
- **Three distinct states:** form view → generating view (progress bar, no form) → results view (results + "Generate again" CTA)
- **Results persist on mount** — loads last completed generation from the DB (requires Stream 1's generation ledger)

### Minor Tidy

- Podcast descriptor label shortened
- Newsletter removed from content type selector

### Dashboard Decomposition

`src/pages/Dashboard.tsx` is 3,161 lines. Required to redesign cleanly. Decomposed into:
- `ContentTypeSelector.tsx`
- `GenerationForm.tsx`
- `ProgressIndicator.tsx`
- `ResultsPanel.tsx`
- `GenerationHistory.tsx` (loads from DB)

No logic changes — pure structural decomposition alongside the visual update.

### Testing (Stream 2)

- Progress bar reaches 100% when API response arrives (not before, not stuck)
- Results panel renders correctly for each content type
- Copy button copies correct content to clipboard
- Dashboard loads last generation from DB on mount (mocked DB response in test)
- Newsletter option absent from content type selector

---

## Stream 3: Onboarding

**Sequencing:** After Stream 1 merges. Requires: generation ledger, scraper fix, church profile DB.

### Design Philosophy

Ivangel's core differentiator is voice matching — content that sounds like the specific church, not generic Christian content. A church that skips the voice capture step will generate generic output, blame the product, and churn. The onboarding must frame voice capture as the product itself, not as setup overhead.

**Tagline for the flow:** *"Generic AI writes generic content. Your voice is what makes this yours."*

### Flow: Five Steps, No Skip on Steps 2–4

Runs once on first login. Accessible again from Settings. Lives at `/welcome` route.

**Step 1 — Your church** (required, 1 minute)
- Church name
- Country
- Primary language
- Denomination (optional)
- Website URL (carried into Step 2)

**Step 2 — Website voice import** (required)
- The `scrape-church-website` function runs against the URL from Step 1
- Shows what was found: "We found your About page, 3 sermon summaries, and your values statement"
- If scrape fails: manual paste fallback — "Paste some text from your website instead"
- Frames this as: "We're reading how your church already communicates"

**Step 3 — Upload your sermons** (primary) + **past content** (secondary)
- Lead input: minimum 5 sermon transcript pastes (most powerful voice signal — the more sermons, the more accurately the voice is captured)
- UI shows 5 slots with the ability to add more. Progress indicator: "3 of 5 sermons added."
- Secondary: newsletter excerpt, bulletin notice, social post
- Copy: "Paste at least 5 recent sermon transcripts — this is the clearest window into your church's voice. The more you add, the better Ivangel knows how you speak."
- Churches without 5 sermons ready see: "Add what you have now — you can complete this from Settings before your first generation."
- Sermons are stored, named, and reusable as source material for future generations

**Step 4 — Style guide preview** (required)
- System generates voice profile from Steps 2–3 inputs
- Displays: tone descriptors, example phrases, what to avoid
- Example: "Warm and pastoral. Conversational without being casual. Avoids theological jargon. Uses inclusive, community-centred language."
- Editable inline
- Copy: "This is how Ivangel understands your church. You can refine it any time."

**Step 5 — First generation** (guided)
- Uses the actual content from Steps 2–3 — not a sample
- Pre-selects sensible defaults (Facebook + Instagram, social media content type)
- "Let's see what your voice looks like in the wild"
- On completion, transitions to the full dashboard with results visible

### Testing (Stream 3)

- Completing all 5 steps creates a church profile, style guide record, and at least one generation record in DB
- Scraper failure on Step 2 shows manual paste fallback, not an error screen
- Attempting to skip the sermon input on Step 3 shows the warning copy
- Style guide preview displays generated content from the scrape + sermon inputs
- Completing the flow sets an `onboarding_completed` flag; flow does not show again on next login

---

## Verification: End-to-End Acceptance Criteria

Before any stream is considered done:

1. **Stream 1:** Call `generate-social-posts` directly via curl with a valid JWT for an over-quota user → 402 returned, no Claude API call in logs
2. **Stream 1:** Submit identical requests with the same `idempotency_key` → one DB row, one Claude call
3. **Stream 2:** Open dashboard, generate content, switch to a different browser tab and back → content still visible
4. **Stream 2:** Trigger a generation and observe the progress bar advance through all labelled stages
5. **Stream 3:** Complete full onboarding flow as a new user → style guide generated, first generation visible, dashboard loads with results on return visit

---

## Files of Note

| Area | Path |
|------|------|
| Main edge function | `supabase/functions/generate-social-posts/index.ts` |
| Content safety (disabled) | `supabase/functions/generate-social-posts/index.ts:26` |
| Scraper | `supabase/functions/scrape-church-website/` |
| LemonSqueezy webhook | `supabase/functions/lemonsqueezy-webhook/` |
| Subscription hook (frontend) | `src/hooks/useSubscription.tsx` |
| Dashboard (3,161 lines) | `src/pages/Dashboard.tsx` |
| Landing page | `src/pages/Index.tsx` |
| Billing page | `src/pages/Billing.tsx` |
| Tailwind config | `tailwind.config.ts` |
| Subscription migration | `supabase/migrations/20260316_add_subscriptions.sql` |
| Go-to-market plan | `docs/superpowers/plans/2026-03-16-go-to-market-launch.md` |
