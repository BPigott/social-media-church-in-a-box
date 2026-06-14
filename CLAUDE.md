# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ivangel** — a SaaS platform that turns church sermon transcripts into social media posts, devotionals, and Bible study guides. AI generation is powered by Anthropic Claude 4.5 Haiku via Supabase Edge Functions.

- **Frontend**: React 18 + TypeScript + Vite, deployed on Vercel
- **Backend**: Supabase (PostgreSQL + Edge Functions running Deno)
- **Payments**: Stripe (£25/month subscription via a Stripe Payment Link; `stripe-webhook` Edge Function keeps the `subscriptions` table in sync). In Focus Operations Ltd is the merchant of record.
- **Supabase project**: `gxgijxmwipnurubqupbt` (eu-west-2)

## Commands

```bash
# Frontend
npm run dev          # Vite dev server on :5173
npm run build        # Production build
npm run lint         # ESLint

# Dev against production Supabase (use when local Supabase isn't running)
VITE_SUPABASE_URL=https://gxgijxmwipnurubqupbt.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=<key from .env.production> \
npx vite --port 8083

# Local Supabase
npx supabase start
npx supabase stop
npx supabase functions serve   # serve edge functions locally

# Edge Functions
supabase functions deploy                              # deploy all
supabase functions deploy generate-social-posts       # deploy one

# Edge Function tests (Deno required)
deno test supabase/functions/generate-social-posts/index.test.ts

# Database
supabase db push   # apply pending migrations to linked project
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set FIRECRAWL_API_KEY=fc-...
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='...'
```

## Architecture

### Route Guards (`src/App.tsx`)

There are two guards wrapping routes:

- **`AuthenticatedRoute`** — requires only a logged-in user. Used for `/upgrade`, `/billing`, `/onboarding`.
- **`ProtectedRoute`** — requires login + a church record + an active subscription. Redirects to `/onboarding` if no church, `/upgrade` if subscription is inactive. Used for `/dashboard`, `/library`, `/settings`.

Both guards wait for all three async checks (`useAuth`, `useChurch`, `useSubscription`) to resolve before rendering.

### Core Hooks (`src/hooks/`)

- **`useAuth`** — listens to Supabase auth state. On `SIGNED_IN`, automatically invokes the `create-trial` edge function to provision a trial subscription. Intentionally ignores transient `null` sessions during token refresh; only clears state on `SIGNED_OUT`.
- **`useChurch`** — fetches the user's church via `get_user_churches` RPC (security definer), with a direct query fallback. Has a 5-minute in-memory cache (`churchCache` Map) and up to 3 retries with exponential backoff. Call `clearChurchCache(userId)` after creating/updating church data.
- **`useSubscription`** — fetches from the `subscriptions` table. `isActive` is true if `exempt`, `status === 'active'`, or `status === 'trialing'` with days remaining.

### Edge Functions (`supabase/functions/`)

All functions run on Deno. Imports use `https://deno.land/std` and `https://esm.sh` — not npm packages.

| Function | Purpose |
|---|---|
| `generate-social-posts` | Main AI function. Enforces subscription, validates idempotency key, checks token budget, runs content safety, calls Claude, writes to `generations` ledger. |
| `generate-style-guide` | Analyses church data + sermon samples to produce a reusable style guide. |
| `retranslate-content` | Re-translates edited English content back to the target language. |
| `scrape-church-website` | Firecrawl-based website scraping for onboarding context. |
| `create-trial` | Creates a `trialing` subscription row on first sign-in. Called automatically by `useAuth`. |
| `stripe-webhook` | Handles Stripe subscription lifecycle + `invoice.payment_failed`. Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets. |
| `api-health-check` | Health check endpoint. |

Shared utilities in `supabase/functions/_shared/`: `translate.ts` (Google Translate), `content-safety.ts` (input/output validation).

### Database Key Tables

- `churches` + `user_roles` — church profile and per-user RBAC (`owner | admin | editor | viewer`)
- `style_guides` — one per church, stores Claude-generated style guide content
- `sermon_transcripts` — uploaded sermon text files
- `generated_content` — results of each generation run (posts, devotional, bible study, etc.)
- `subscriptions` — one per user; statuses: `trialing | active | cancelled | expired | past_due`; `exempt` boolean bypasses all subscription checks
- `generations` — ledger table recording every AI generation with token usage

### Supabase Client

Import as: `import { supabase } from "@/integrations/supabase/client"`

TypeScript types live in two places:
- `src/integrations/supabase/types.ts` — auto-generated, do not edit
- `src/types/database.ts` — hand-crafted application types; edit this one

## Content & Copy

- UK English throughout all user-facing copy.
- Church brand/copy style reference: `Leicester Vineyard-style-guide-UPDATED.md`

## Active Development Context

- Trunk: `main`.
- **Onboarding (Stream 3) — rebuilt, in review.** `src/pages/Onboarding.tsx` is now a
  voice-first editorial flow: **01 Your Church** → **02 Website** (scrape with manual-paste /
  skip fallback) → **03 Sermons** (file upload, hard gate at **7** sermons, prominent
  "X / 7" counter) → **04 Your Voice** (style-guide generation → editable review) → dashboard.
  Step components live in `src/components/onboarding/`; shared sermon text extraction
  (TXT/DOCX/PDF) is in `src/lib/extractText.ts`. The guided "first generation" (the spec's
  step 5) is **deferred** as a fast-follow — the flow lands on `/dashboard` after the style
  guide is accepted. Church creation still happens at the *end* of the flow, preserving the
  orphan-record detection, verification retry loop, and style-guide upsert.
- Pre-launch readiness checklist lives at the top of
  `docs/superpowers/plans/2026-03-16-go-to-market-launch.md`. With onboarding built, the
  remaining blockers are mostly operational: confirm Stripe live-mode wiring + £25 price,
  production secrets, redeploy `retranslate-content`/`api-health-check`, and a full
  signup→checkout→webhook smoke test.
- Auth/subscription stability: `useSubscription` waits for auth to resolve before reporting
  status (fixes a false "inactive" that bounced trial users to `/upgrade`); a follow-up
  centralises `useAuth` into a single `AuthProvider` so independent hook instances can't
  disagree. See `src/hooks/useAuth.tsx` / `src/hooks/useSubscription.tsx`.
- Checkout uses a single Stripe Payment Link via `VITE_STRIPE_CHECKOUT_URL` (set in `.env.*`
  and Vercel). Single plan only — no multi-site tier.
