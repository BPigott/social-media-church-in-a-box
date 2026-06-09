# ivangel Go-To-Market Launch Implementation Plan

> ⚠️ **SUPERSEDED (2026-05-30):** The billing provider described below (LemonSqueezy) was
> later replaced by Paddle, and ivangel now uses **Stripe**. The LemonSqueezy webhook,
> `ls_*` columns, and `VITE_LS_*` variables referenced in this document no longer exist —
> see the Stripe migration (`supabase/functions/stripe-webhook/`,
> `supabase/migrations/20260530221027_replace_paddle_with_stripe.sql`). The non-billing parts of
> this plan remain accurate. The LemonSqueezy code samples are kept as a historical record only.

---

## 🚀 Pre-Launch Readiness Audit (2026-06-09)

A full repo/production review reconciled git with production (Stripe + comp-code work that
was live but uncommitted), pruned stale branches, and archived shipped plans. The remaining
work before go-live, in priority order:

1. **Onboarding redesign (Stream 3) — LAUNCH BLOCKER.** `src/pages/Onboarding.tsx` is still
   the old 4-step flow (Church info → Upload sermons → Generating → Review). The voice-first
   5-step flow with the hard sermon gate, website-voice import, and guided first generation is
   unbuilt. Plan: `docs/superpowers/plans/2026-04-04-stream3-onboarding.md`.
2. **Pricing must agree everywhere.** CLAUDE.md states a single **£25/month** plan; the
   landing-page copy referenced **£19/£49**. Confirm the launch price and make the landing
   page, the `VITE_STRIPE_CHECKOUT_URL` payment link, and the Stripe product match.
3. **Verify production secrets are set:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, Resend key.
   (`stripe-webhook` correctly runs with `verify_jwt=false`.)
4. **Confirm Stripe live-mode wiring:** webhook endpoint registered in the Stripe dashboard
   pointing at the deployed `stripe-webhook` URL with the matching signing secret; the payment
   link is **live**, not test.
5. **Finalise legal pages** (Privacy/Terms/Refund) — now name Stripe + In Focus Operations Ltd
   as merchant of record; confirm launch-ready.
6. **Redeploy `retranslate-content` and `api-health-check`** from this repo — their deployed
   `entrypoint_path` still points at an old directory, so live source may not match git.
7. **End-to-end smoke test:** sign up → trial → generate → checkout → webhook flips to
   `active` → comp-code redemption grants exemption.
8. **Residual migration-history debt:** the pre-existing `20260404_add_paddle_columns` version
   collides with `20260404_add_generations_table` in a fresh `db push`. Harmless to the current
   prod (schema is correct) but worth a `supabase migration repair` before provisioning any new
   environment.
9. **Pre-existing lint debt:** `npm run lint` reports ~71 errors (mostly `any` in edge functions
   + a `require()` in `tailwind.config.ts`) — not introduced by launch work; clean up post-launch.
10. *(Optional)* Custom domain / DNS.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take ivangel from a working personal tool to a market-ready SaaS with LemonSqueezy subscription billing, a compelling landing page, and free trial onboarding — so churches can self-serve without Bob having to sell.

**Architecture:** Existing Vercel (frontend) + Supabase (database + Edge Functions) stack is kept unchanged. A new `subscriptions` table tracks billing state per user. A new Supabase Edge Function handles LemonSqueezy webhooks to keep that table current. React route guards are extended to enforce subscription status. The landing page (Index.tsx) is rebuilt as a high-quality marketing page.

**Tech Stack:** React 18 + TypeScript + Vite, shadcn/ui + Tailwind CSS, Supabase (PostgreSQL + Edge Functions with Deno), LemonSqueezy (billing), Vercel (hosting)

---

## File Map

### New files to create

| File | Purpose |
|------|---------|
| `supabase/migrations/20260316_add_subscriptions.sql` | Subscriptions table + RLS |
| `supabase/functions/lemonsqueezy-webhook/index.ts` | Handles LS billing events |
| `supabase/functions/create-trial/index.ts` | Creates trial record on new signup |
| `src/hooks/useSubscription.ts` | Reads subscription status for current user |
| `src/components/SubscribedRoute.tsx` | Route guard: auth + church + active subscription |
| `src/components/TrialBanner.tsx` | Persistent banner showing trial days remaining |
| `src/components/UpgradePrompt.tsx` | Full-screen prompt shown when trial expires |
| `src/pages/Billing.tsx` | Billing management page (status, upgrade, manage) |

### Files to modify

| File | What changes |
|------|-------------|
| `src/App.tsx` | Add `SubscribedRoute`, add `/billing` route, add `TrialBanner` |
| `src/components/Navigation.tsx` | Add Billing link in nav |
| `src/pages/Signup.tsx` | Call `create-trial` Edge Function after signup |
| `src/pages/Index.tsx` | Rebuild as marketing landing page |
| `src/integrations/supabase/types.ts` | Add `subscriptions` table types |

---

## Chunk 1: Code Review & Dependency Audit

**Goal:** Identify security issues, outdated dependencies, and fragile code before adding billing. This chunk produces a written audit report — no code changes yet.

### Task 1: Dependency audit

**Files:**
- Read: `package.json`
- Read: `supabase/functions/generate-social-posts/index.ts` (uses `deno.land/std@0.168.0` — very old)

- [ ] **Step 1: Run npm audit**
```bash
cd /Users/bobpigott/Documents/ivangel
npm audit
```
Expected: List of vulnerabilities by severity. Note any `high` or `critical` items.

- [ ] **Step 2: Check for outdated packages**
```bash
npm outdated
```
Expected: Table of packages with current vs latest versions.

- [ ] **Step 3: Check Deno std version in Edge Functions**

Look at all Edge Function imports. The generate-social-posts function uses `deno.land/std@0.168.0` — current version is 0.220.x. Note all outdated Deno imports.

```bash
grep -r "deno.land/std" supabase/functions/
```

- [ ] **Step 4: Fix npm vulnerabilities**
```bash
npm audit fix
```
Only use `--force` if you understand what it's changing. For any `high`/`critical` issues that can't be auto-fixed, note them.

- [ ] **Step 5: Update Deno std imports in all Edge Functions**

In each Edge Function, change:
```ts
// Before
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// After — use supabase's built-in serve
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
```

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json supabase/functions/
git commit -m "chore: update dependencies and Deno std imports"
```

---

### Task 2: Security review of Edge Functions

**Files:**
- Read: `supabase/functions/generate-social-posts/index.ts`
- Read: `supabase/functions/_shared/content-safety.ts`

- [ ] **Step 1: Check CORS headers**

Current code has:
```ts
'Access-Control-Allow-Origin': '*'
```
This is acceptable for a Supabase Edge Function called from your own frontend, but note it.

- [ ] **Step 2: Check that all Edge Functions verify the caller is authenticated**

Every function that reads/writes user data must extract and verify the JWT from the `authorization` header. Verify each function does:
```ts
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
if (!user) return new Response('Unauthorized', { status: 401 });
```

- [ ] **Step 3: Check content safety flag**

In `generate-social-posts/index.ts`, line 26:
```ts
const CONTENT_SAFETY_ENABLED = false;
```
Consider whether to enable this before going live. Leave a comment explaining the decision.

- [ ] **Step 4: Review RLS policies**

Run this in Supabase SQL editor (or via MCP) to list all RLS policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```
Verify every table has RLS enabled and policies that prevent cross-user data access.

- [ ] **Step 5: Document findings**

Create `docs/security-audit-2026-03-16.md` with:
- What was found
- What was fixed
- What is an accepted risk and why

- [ ] **Step 6: Commit**
```bash
git add .
git commit -m "security: review and document security posture before launch"
```

---

## Chunk 2: Subscriptions Database Schema

**Goal:** Add a `subscriptions` table that tracks each user's billing state.

### Task 3: Create subscriptions migration

**Files:**
- Create: `supabase/migrations/20260316_add_subscriptions.sql`
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260316_add_subscriptions.sql`:

```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,

  -- LemonSqueezy identifiers (null during trial before checkout)
  ls_subscription_id TEXT UNIQUE,
  ls_customer_id TEXT,
  ls_variant_id TEXT,
  ls_order_id TEXT,

  -- Status: trialing | active | cancelled | expired | past_due
  status TEXT NOT NULL DEFAULT 'trialing',

  -- Dates
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role (webhooks, edge functions) can insert/update
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 2: Apply migration locally**
```bash
npx supabase db push --local
```
Expected: Migration applied successfully.

- [ ] **Step 3: Verify table exists**
```bash
npx supabase db dump --local --schema public | grep -A 20 "subscriptions"
```

- [ ] **Step 4: Update TypeScript types**

Add the subscriptions type to `src/integrations/supabase/types.ts` in the `Tables` section of the `public` schema, after the `user_roles` entry:

```ts
      subscriptions: {
        Row: {
          id: string
          user_id: string
          church_id: string | null
          ls_subscription_id: string | null
          ls_customer_id: string | null
          ls_variant_id: string | null
          ls_order_id: string | null
          status: 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due'
          trial_ends_at: string
          current_period_ends_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          church_id?: string | null
          ls_subscription_id?: string | null
          ls_customer_id?: string | null
          ls_variant_id?: string | null
          ls_order_id?: string | null
          status?: 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due'
          trial_ends_at?: string
          current_period_ends_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          church_id?: string | null
          ls_subscription_id?: string | null
          ls_customer_id?: string | null
          ls_variant_id?: string | null
          ls_order_id?: string | null
          status?: 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due'
          trial_ends_at?: string
          current_period_ends_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
```

Also add `'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due'` to the `Constants` block:
```ts
  public: {
    Enums: {
      app_role: ["owner", "admin", "editor", "viewer"],
      subscription_status: ["trialing", "active", "cancelled", "expired", "past_due"],
    },
  },
```

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/20260316_add_subscriptions.sql src/integrations/supabase/types.ts
git commit -m "feat: add subscriptions table with RLS policies"
```

---

## Chunk 3: Trial Auto-Creation on Signup

**Goal:** When a user signs up, automatically create a 14-day trial subscription record.

### Task 4: Create the create-trial Edge Function

**Files:**
- Create: `supabase/functions/create-trial/index.ts`
- Modify: `src/pages/Signup.tsx`

- [ ] **Step 1: Write the Edge Function**

Create `supabase/functions/create-trial/index.ts`:

```ts
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the JWT and get the user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if a subscription already exists for this user
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Already has a subscription — idempotent, return success
      return new Response(JSON.stringify({ success: true, message: 'Subscription already exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to create trial:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create trial' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Read the current Signup.tsx to understand where to add the call**
```
Read: src/pages/Signup.tsx
```
Find the point after `supabase.auth.signUp()` succeeds and add a call to `create-trial`.

- [ ] **Step 3: Add create-trial call to Signup.tsx**

After a successful `signUp` call in `src/pages/Signup.tsx`, add:

```ts
// After successful signup, create the 14-day trial
const { data: { session: newSession } } = await supabase.auth.getSession();
if (newSession) {
  await supabase.functions.invoke('create-trial');
}
```

Note: The `invoke` call uses the user's current session automatically for the `Authorization` header.

> **Important:** If your Supabase project has email confirmation enabled, `getSession()` may return null immediately after `signUp` (before the user confirms their email). Check your Supabase Auth settings (Authentication → Email → Enable email confirmations). If confirmation is on, the trial will be created when the user confirms and logs in for the first time instead. For a frictionless trial, consider disabling email confirmation, or calling `create-trial` from a post-login hook instead.

- [ ] **Step 4: Deploy the Edge Function locally and test**
```bash
npx supabase functions serve create-trial --env-file .env.local
```
Then in another terminal, test with curl (replace TOKEN with a real auth token from browser devtools after signing up):
```bash
curl -X POST http://localhost:54321/functions/v1/create-trial \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```
Expected: `{"success":true}`

- [ ] **Step 5: Verify the subscription was created**
```sql
-- Run in Supabase SQL editor or via MCP
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;
```

- [ ] **Step 6: Commit**
```bash
git add supabase/functions/create-trial/ src/pages/Signup.tsx
git commit -m "feat: auto-create 14-day trial on user signup"
```

---

## Chunk 4: LemonSqueezy Webhook Handler

**Goal:** Handle billing lifecycle events from LemonSqueezy to keep subscription status accurate.

### Task 5: Set up LemonSqueezy account and products

This task is manual configuration — no code.

- [ ] **Step 1: Create LemonSqueezy account**
  - Go to lemonsqueezy.com and create a store
  - Set up your store name and currency (GBP recommended for a UK-based founder)

- [ ] **Step 2: Create two products**
  - **Single Church** — £19/month recurring subscription
  - **Multi-site** — £49/month recurring subscription
  - Note the **Variant ID** for each (you'll need this in the webhook handler)

- [ ] **Step 3: Get your API credentials**
  - API Key: Settings → API → Generate new key
  - Store ID: visible in your store URL
  - Webhook Secret: you'll create this in Task 6

- [ ] **Step 4: Add secrets to Supabase**
```bash
npx supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
npx supabase secrets set LEMONSQUEEZY_API_KEY=your_api_key
```

- [ ] **Step 5: Add the checkout URL to your frontend env**

Add to `.env.local` (and Vercel environment variables):
```
VITE_LS_SINGLE_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID
VITE_LS_MULTI_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID
```

---

### Task 6: Write the webhook Edge Function

**Files:**
- Create: `supabase/functions/lemonsqueezy-webhook/index.ts`

- [ ] **Step 1: Write the webhook handler**

Create `supabase/functions/lemonsqueezy-webhook/index.ts`:

```ts
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.220.1/crypto/mod.ts";

// Verify the request comes from LemonSqueezy using HMAC-SHA256
async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSig = Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return signature === expectedSig;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get('X-Signature') ?? '';
  const secret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? '';

  // Verify signature
  const isValid = await verifySignature(secret, body, signature);
  if (!isValid) {
    console.error('Invalid webhook signature');
    return new Response('Unauthorized', { status: 401 });
  }

  const event = JSON.parse(body);
  const eventName = event.meta?.event_name;
  const data = event.data?.attributes;
  const lsSubscriptionId = String(event.data?.id);
  const userEmail = data?.user_email;
  const customerId = String(data?.customer_id);
  const variantId = String(data?.variant_id);
  const endsAt = data?.ends_at ?? data?.trial_ends_at;

  console.log(`Received event: ${eventName} for subscription ${lsSubscriptionId}`);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Map LemonSqueezy status to our status
  const statusMap: Record<string, string> = {
    'subscription_created': 'active',
    'subscription_updated': 'active',
    'subscription_payment_success': 'active',
    'subscription_payment_failed': 'past_due',
    'subscription_payment_recovered': 'active',
    'subscription_cancelled': 'cancelled',
    'subscription_expired': 'expired',
    'subscription_resumed': 'active',
    'subscription_unpaused': 'active',
  };

  const newStatus = statusMap[eventName];
  if (!newStatus) {
    console.log(`Unhandled event type: ${eventName}`);
    return new Response('OK', { status: 200 });
  }

  // Find the user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Failed to list users:', userError);
    return new Response('Error', { status: 500 });
  }

  const matchedUser = users.users.find(u => u.email === userEmail);
  if (!matchedUser) {
    console.error(`No user found with email: ${userEmail}`);
    return new Response('User not found', { status: 404 });
  }

  // Upsert the subscription record
  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: matchedUser.id,
      ls_subscription_id: lsSubscriptionId,
      ls_customer_id: customerId,
      ls_variant_id: variantId,
      status: newStatus,
      current_period_ends_at: endsAt ?? null,
      cancelled_at: eventName === 'subscription_cancelled' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (upsertError) {
    console.error('Failed to upsert subscription:', upsertError);
    return new Response('Error', { status: 500 });
  }

  console.log(`Updated subscription for ${userEmail}: ${newStatus}`);
  return new Response('OK', { status: 200 });
});
```

- [ ] **Step 2: Register the webhook in LemonSqueezy**
  - In LemonSqueezy dashboard: Settings → Webhooks → Add webhook
  - URL: `https://<your-supabase-project-ref>.supabase.co/functions/v1/lemonsqueezy-webhook`
  - Events to subscribe to:
    - `subscription_created`
    - `subscription_updated`
    - `subscription_cancelled`
    - `subscription_expired`
    - `subscription_payment_success`
    - `subscription_payment_failed`
    - `subscription_payment_recovered`
    - `subscription_resumed`
  - Copy the signing secret and save as `LEMONSQUEEZY_WEBHOOK_SECRET` in Supabase

- [ ] **Step 3: Deploy the function**
```bash
npx supabase functions deploy lemonsqueezy-webhook
```

- [ ] **Step 4: Test with LemonSqueezy test mode**

  Use LemonSqueezy's built-in "Send test event" feature in the webhook settings to verify the function handles events correctly. Check Supabase function logs:
```bash
npx supabase functions logs lemonsqueezy-webhook
```

- [ ] **Step 5: Commit**
```bash
git add supabase/functions/lemonsqueezy-webhook/
git commit -m "feat: add LemonSqueezy webhook handler for subscription lifecycle"
```

---

## Chunk 5: Frontend Subscription State & Route Gating

**Goal:** Make the React app aware of subscription status and block expired/unchecked users from core features.

### Task 7: useSubscription hook

**Files:**
- Create: `src/hooks/useSubscription.ts`

- [ ] **Step 1: Write the hook**

Create `src/hooks/useSubscription.ts`:

```ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'past_due'
  | 'none'; // no record found

export interface SubscriptionState {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEndsAt: Date | null;
  daysLeftInTrial: number | null;
  isAccessAllowed: boolean; // trialing (not expired) or active
  loading: boolean;
}

export function useSubscription(user: User | null): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    status: 'none',
    trialEndsAt: null,
    currentPeriodEndsAt: null,
    daysLeftInTrial: null,
    isAccessAllowed: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const fetchSubscription = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setState({
          status: 'none',
          trialEndsAt: null,
          currentPeriodEndsAt: null,
          daysLeftInTrial: null,
          isAccessAllowed: false,
          loading: false,
        });
        return;
      }

      const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
      const currentPeriodEndsAt = data.current_period_ends_at
        ? new Date(data.current_period_ends_at)
        : null;

      const now = new Date();
      const daysLeftInTrial = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      // Trial is valid if status is 'trialing' AND trial hasn't expired
      const trialValid = data.status === 'trialing' && trialEndsAt !== null && trialEndsAt > now;
      const isAccessAllowed = trialValid || data.status === 'active';

      setState({
        status: data.status as SubscriptionStatus,
        trialEndsAt,
        currentPeriodEndsAt,
        daysLeftInTrial,
        isAccessAllowed,
        loading: false,
      });
    };

    fetchSubscription();
  }, [user]);

  return state;
}
```

- [ ] **Step 2: Verify the hook compiles**
```bash
npm run build 2>&1 | head -30
```
Expected: No TypeScript errors related to the new hook.

- [ ] **Step 3: Commit**
```bash
git add src/hooks/useSubscription.ts
git commit -m "feat: add useSubscription hook for billing state"
```

---

### Task 8: SubscribedRoute component

**Files:**
- Create: `src/components/SubscribedRoute.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write SubscribedRoute**

Create `src/components/SubscribedRoute.tsx`:

```tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";

interface SubscribedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard that requires:
 * 1. User is authenticated
 * 2. User has completed church onboarding
 * 3. User has an active subscription or valid trial
 */
export default function SubscribedRoute({ children }: SubscribedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasChurch, loading: churchLoading } = useChurch(user?.id);
  const { isAccessAllowed, status, loading: subLoading } = useSubscription(user);

  if (authLoading || churchLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasChurch) return <Navigate to="/onboarding" replace />;
  if (!isAccessAllowed) return <UpgradePrompt status={status} />;

  return <>{children}</>;
}
```

- [ ] **Step 2: Update App.tsx to use SubscribedRoute**

In `src/App.tsx`:

Add the import at the top:
```ts
import SubscribedRoute from "@/components/SubscribedRoute";
```

Replace the `ProtectedRoute` wrapper on `/dashboard`, `/library`, and `/settings` routes with `SubscribedRoute`:
```tsx
<Route
  path="/dashboard"
  element={
    <SubscribedRoute>
      <Dashboard />
    </SubscribedRoute>
  }
/>
<Route
  path="/library"
  element={
    <SubscribedRoute>
      <Library />
    </SubscribedRoute>
  }
/>
<Route
  path="/settings"
  element={
    <SubscribedRoute>
      <Settings />
    </SubscribedRoute>
  }
/>
```

Also add the billing route (you'll create the page in Task 10). Note: `AuthenticatedRoute` is already defined in `src/App.tsx` at line 23 — it only requires auth, not a church or subscription, so billing is accessible even during/after trial expiry:
```tsx
import Billing from "./pages/Billing";
// ...
<Route
  path="/billing"
  element={
    <AuthenticatedRoute>
      <Billing />
    </AuthenticatedRoute>
  }
/>
```

- [ ] **Step 3: Build to verify no errors**
```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 4: Commit**
```bash
git add src/components/SubscribedRoute.tsx src/App.tsx
git commit -m "feat: add SubscribedRoute guard that enforces subscription status"
```

---

## Chunk 6: Trial Banner, Upgrade Prompt & Billing Page

**Goal:** Give users clear visibility of their trial status and a path to upgrade.

### Task 9: TrialBanner component

**Files:**
- Create: `src/components/TrialBanner.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write TrialBanner**

Create `src/components/TrialBanner.tsx`:

```tsx
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

const CHECKOUT_URL = import.meta.env.VITE_LS_SINGLE_CHECKOUT_URL;

export default function TrialBanner() {
  const { user } = useAuth();
  const { status, daysLeftInTrial, isAccessAllowed } = useSubscription(user);

  // Only show during an active trial
  if (status !== 'trialing' || !isAccessAllowed || daysLeftInTrial === null) return null;

  const urgency = daysLeftInTrial <= 3;

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-between text-sm ${
      urgency ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
    }`}>
      <span>
        {daysLeftInTrial === 0
          ? 'Your trial expires today.'
          : `${daysLeftInTrial} day${daysLeftInTrial === 1 ? '' : 's'} left in your free trial.`}
      </span>
      <Button
        size="sm"
        variant={urgency ? 'secondary' : 'default'}
        onClick={() => window.open(CHECKOUT_URL, '_blank')}
      >
        Upgrade now — £19/month
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Add TrialBanner to App.tsx**

In `src/App.tsx`, inside the `BrowserRouter` but wrapping the content, add `TrialBanner` so it appears on all authenticated pages. The simplest approach is to add it inside `ProtectedRoute` / `SubscribedRoute` rendered content. Add it inside the `BrowserRouter`:

```tsx
<BrowserRouter>
  <TrialBanner />
  <Routes>
    {/* ... existing routes ... */}
  </Routes>
</BrowserRouter>
```

Add the import:
```ts
import TrialBanner from "@/components/TrialBanner";
```

- [ ] **Step 3: Commit**
```bash
git add src/components/TrialBanner.tsx src/App.tsx
git commit -m "feat: add trial countdown banner for active trial users"
```

---

### Task 10: UpgradePrompt component

**Files:**
- Create: `src/components/UpgradePrompt.tsx`

- [ ] **Step 1: Write UpgradePrompt**

Create `src/components/UpgradePrompt.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubscriptionStatus } from "@/hooks/useSubscription";

const SINGLE_CHECKOUT_URL = import.meta.env.VITE_LS_SINGLE_CHECKOUT_URL;
const MULTI_CHECKOUT_URL = import.meta.env.VITE_LS_MULTI_CHECKOUT_URL;

interface UpgradePromptProps {
  status: SubscriptionStatus;
}

export default function UpgradePrompt({ status }: UpgradePromptProps) {
  const messages: Record<SubscriptionStatus, { title: string; description: string }> = {
    expired: {
      title: 'Your trial has ended',
      description: 'Upgrade to continue generating sermon content for your church.',
    },
    cancelled: {
      title: 'Your subscription has been cancelled',
      description: 'Reactivate your subscription to regain access.',
    },
    past_due: {
      title: 'Payment issue',
      description: 'There was a problem with your last payment. Please update your billing details.',
    },
    none: {
      title: 'Subscription required',
      description: 'Choose a plan to get started with ivangel.',
    },
    trialing: { title: '', description: '' }, // shouldn't reach here
    active: { title: '', description: '' },   // shouldn't reach here
  };

  const { title, description } = messages[status] ?? messages.none;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <p className="font-semibold">Single Church</p>
              <p className="text-2xl font-bold">£19<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Unlimited generations</li>
                <li>✓ All 15+ languages</li>
                <li>✓ All platforms</li>
                <li>✓ Bible study guides</li>
              </ul>
              <Button className="w-full" onClick={() => window.open(SINGLE_CHECKOUT_URL, '_blank')}>
                Choose Single Church
              </Button>
            </div>
            <div className="border rounded-lg p-4 space-y-2 border-primary">
              <p className="font-semibold">Multi-site</p>
              <p className="text-2xl font-bold">£49<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Everything in Single</li>
                <li>✓ Multiple campuses</li>
                <li>✓ Team members</li>
                <li>✓ Priority support</li>
              </ul>
              <Button className="w-full" variant="default" onClick={() => window.open(MULTI_CHECKOUT_URL, '_blank')}>
                Choose Multi-site
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/UpgradePrompt.tsx
git commit -m "feat: add upgrade prompt shown when subscription expires"
```

---

### Task 11: Billing page

**Files:**
- Create: `src/pages/Billing.tsx`
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Write the Billing page**

Create `src/pages/Billing.tsx`:

```tsx
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";

const SINGLE_CHECKOUT_URL = import.meta.env.VITE_LS_SINGLE_CHECKOUT_URL;

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  trialing: { label: 'Free Trial', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
  past_due: { label: 'Payment Failed', variant: 'destructive' },
  none: { label: 'No Subscription', variant: 'secondary' },
};

export default function Billing() {
  const { user } = useAuth();
  const { status, trialEndsAt, currentPeriodEndsAt, daysLeftInTrial, isAccessAllowed } = useSubscription(user);

  const { label, variant } = statusLabels[status] ?? statusLabels.none;

  const formatDate = (date: Date | null) =>
    date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Billing</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription Status</CardTitle>
              <Badge variant={variant}>{label}</Badge>
            </div>
            <CardDescription>
              {status === 'trialing' && `Trial ends ${formatDate(trialEndsAt)} (${daysLeftInTrial} days remaining)`}
              {status === 'active' && `Next billing date: ${formatDate(currentPeriodEndsAt)}`}
              {status === 'cancelled' && 'Your subscription has been cancelled.'}
              {status === 'expired' && 'Your subscription has expired.'}
              {status === 'past_due' && 'Your last payment failed. Please update your payment method.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isAccessAllowed || status === 'trialing' ? (
              <Button onClick={() => window.open(SINGLE_CHECKOUT_URL, '_blank')}>
                {status === 'trialing' ? 'Upgrade to paid plan' : 'Reactivate subscription'}
              </Button>
            ) : null}
            {status === 'active' && (
              <p className="text-sm text-muted-foreground">
                To manage your subscription, cancel, or update payment details,{' '}
                <a
                  href="mailto:support@ivangel.app?subject=Subscription Management"
                  className="underline"
                >
                  contact support
                </a>
                . (Self-service portal coming soon.)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Unlimited sermon-to-content generations</li>
              <li>✓ Facebook, Instagram, TikTok, Twitter/X</li>
              <li>✓ Daily devotionals & Bible study guides</li>
              <li>✓ 15+ languages with translation</li>
              <li>✓ Church style guide generation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Billing link to Navigation.tsx**

In `src/components/Navigation.tsx`, add `CreditCard` to the phosphor-react import and add a Billing entry to `navItems`:

```tsx
// Add to existing import:
import { House, FileText, Gear as SettingsIcon, SignOut, CreditCard } from "phosphor-react";

// Add to navItems array (after Settings, before the closing bracket):
{ to: "/billing", label: "Billing", icon: CreditCard },
```

The full updated `navItems` array becomes:
```tsx
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: House },
  { to: "/library", label: "Library", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/billing", label: "Billing", icon: CreditCard },
];
```

- [ ] **Step 3: Build to verify**
```bash
npm run build 2>&1 | head -50
```

- [ ] **Step 4: Commit**
```bash
git add src/pages/Billing.tsx src/components/Navigation.tsx
git commit -m "feat: add billing page with subscription status and upgrade CTA"
```

---

## Chunk 7: Landing Page Full Redesign

**Goal:** Replace the existing AI-generated-looking landing page with a distinctive, high-quality design that builds trust with church communications teams and converts visitors to trial signups.

**Why a full redesign:** The current Index.tsx (650+ lines) suffers from common AI-generated design patterns: excessive gradient cards, inconsistent icon usage, wall-of-features layout, and generic church-tech aesthetics. It needs a ground-up redesign to stand out and earn trust.

**Design brief:**
- Clean, warm, editorial aesthetic — feels like it was designed for churches, not built by a startup
- Strong typographic hierarchy — let the copy do the work, not icons and gradients
- Single strong CTA above the fold — "Start your 14-day free trial. No credit card required."
- Social proof and specificity — replace generic stats with real, credible claims
- Two pricing tiers clearly presented — Single Church £19/mo, Multi-site £49/mo
- Mobile-first responsive layout

> **IMPORTANT — Skill invocation required:** When executing this chunk, invoke the `frontend-design:frontend-design` skill BEFORE writing any code. That skill provides the correct design workflow: layout → theme → animation → HTML. Do not skip this step.

### Task 12: Full landing page redesign

**Files:**
- Modify: `src/pages/Index.tsx` (full rewrite — archive the old version first)

- [ ] **Step 1: Archive the current landing page**
```bash
cp src/pages/Index.tsx src/pages/Index.tsx.bak
```

- [ ] **Step 2: Invoke the frontend-design skill**

Before writing any code, invoke:
```
Skill: frontend-design:frontend-design
```

Brief for the skill:
- **Product:** ivangel — a SaaS tool that turns church sermon transcripts into social media posts, devotionals, and Bible study guides. Supports 22 languages.
- **Audience:** Church communications volunteers and paid staff. Non-technical. Time-poor. Often skeptical of AI.
- **Tone:** Warm, professional, trustworthy. Not corporate. Not overly "techy". Think Notion meets Christianity Today.
- **Stack:** React + TypeScript, shadcn/ui, Tailwind CSS, phosphor-react icons. Must use these — do not introduce new UI libraries.
- **Key sections needed:**
  1. Hero — headline, subheadline, single CTA ("Start free trial — no card required"), logo
  2. Problem statement — "Your comms team is spending Sunday afternoons writing posts that could take 5 minutes."
  3. How it works — 3 steps (upload transcript → generate → copy & post)
  4. Features — 3 focused feature blocks (not 8 cards): multi-language, church voice, all platforms
  5. Pricing — Single £19/mo, Multi-site £49/mo, both with 14-day trial
  6. FAQ — 5 questions, clean accordion
  7. Footer — company info, ToS link, support email
- **What to avoid:** Too many icons, gradient card grids, "AI-powered" buzzwords, generic stock photo feel, blue color schemes

- [ ] **Step 3: Implement the design from the frontend-design skill output**

The skill will guide you through layout → theme → component implementation. Follow it exactly. The output should be a complete replacement for `src/pages/Index.tsx`.

Key content constraints (must be preserved from original):
- Trial is **14 days**, no credit card required
- Pricing: **£19/month** (Single Church), **£49/month** (Multi-site)
- Company footer: **IN FOCUS OPERATIONS LIMITED, Company No. 16707659**
- ToS link: `/terms`
- The product generates **text only** (no images/video) — make this clear in copy
- CTA buttons link to `/signup`
- If user is already logged in, show "Go to Dashboard" instead (use `useAuth` hook: `const { user } = useAuth()`)

- [ ] **Step 4: Verify FAQ accordion has no duplicate values**

After writing the component, run:
```bash
grep -n 'value="item-' src/pages/Index.tsx
```
Ensure every `value` attribute is unique (no duplicates). Fix any that are not.

- [ ] **Step 5: Build and preview**
```bash
npm run build && npm run preview
```
Open `http://localhost:4173` and verify:
- Loads without console errors
- Trial duration shows 14 days everywhere
- Two pricing tiers visible
- "No credit card required" visible in hero
- Fully responsive on mobile (resize browser to 375px width)
- Logged-in state shows "Go to Dashboard" CTA

- [ ] **Step 6: Delete the backup once satisfied**
```bash
rm src/pages/Index.tsx.bak
```

- [ ] **Step 7: Commit**
```bash
git add src/pages/Index.tsx
git commit -m "feat: full landing page redesign with improved UX and updated pricing"
```

---

## Chunk 8: Pre-Launch Checklist

### Task 13: Production environment setup

- [ ] **Step 1: Set all production secrets in Supabase**
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your_secret
npx supabase secrets set LEMONSQUEEZY_API_KEY=your_api_key
# If using translation:
npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='...'
# If using Firecrawl:
npx supabase secrets set FIRECRAWL_API_KEY=fc-...
```

- [ ] **Step 2: Set Vercel environment variables**

In Vercel dashboard → Project → Settings → Environment Variables, add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_LS_SINGLE_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID
VITE_LS_MULTI_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID
```

- [ ] **Step 3: Push database migrations to production**
```bash
npx supabase db push
```
Expected: All migrations applied including the new `subscriptions` table.

- [ ] **Step 4: Deploy all Edge Functions**
```bash
npx supabase functions deploy
```

- [ ] **Step 5: Run end-to-end smoke test**

Do this manually in the production environment:
1. Sign up with a new email → verify trial subscription created in DB
2. Log in → verify TrialBanner shows correct days remaining
3. Navigate to Dashboard → verify access granted
4. Go to Billing → verify status shows "Free Trial"
5. Test checkout link opens LemonSqueezy correctly

- [ ] **Step 6: Set up custom domain (optional)**

If you have a domain for ivangel, configure it in Vercel: Project → Settings → Domains.

---

### Task 14: Soft launch — church communications communities

This task is marketing actions, not code. No code changes.

- [ ] **Step 1: Join key Facebook groups**
  - "Church Communications" (100k+ members)
  - "Church Social Media" groups
  - Your denomination's pastor/admin groups

- [ ] **Step 2: Write a launch post (not a sales post)**

Template:
> "I built a tool that I've been using at my own church for the past year. It turns sermon transcripts into ready-to-post social media content — Facebook, Instagram, TikTok, Twitter — plus devotionals and Bible studies. It also supports 15+ languages which has been a game changer for our multilingual services.
>
> I've finally opened it up with a free trial. Curious if it would be useful for others. Happy to answer questions."

- [ ] **Step 3: Respond to every comment personally**

This is the one time direct engagement is appropriate — it's not selling, it's being a human being who made a thing.

- [ ] **Step 4: Set up a simple support email**

Create `support@[your-domain].com` or use a simple forwarding alias. Put this address in the app footer and Billing page. You don't need a help desk system yet.

---

## Launch Sequence Summary

1. **Week 1** — Complete Chunks 1–2 (code review + subscriptions DB)
2. **Week 2** — Complete Chunks 3–4 (trial creation + webhook handler)
3. **Week 3** — Complete Chunks 5–6 (frontend gating + billing UI)
4. **Week 4** — Complete Chunk 7 (full landing page redesign — invoke `frontend-design` skill)
5. **Week 5** — Complete Chunk 8 (production deploy + soft launch)

Total estimated effort: ~5 weeks of part-time vibe coding sessions.

**Skill dependencies:**
- Chunk 1: optionally use `code-review:code-review` and `security-scanning:security-sast`
- Chunk 7: **MUST** invoke `frontend-design:frontend-design` before writing any code

---

*Plan written 2026-03-16. Brainstorm context: ivangel is a sermon-to-social-media tool for churches, built on React/TypeScript/Supabase/Vercel/Claude AI. Founder is a self-described vibe coder who uses the product weekly at their own church. Go-to-market strategy: LemonSqueezy billing, self-serve trial, content-led discovery in church community groups.*
