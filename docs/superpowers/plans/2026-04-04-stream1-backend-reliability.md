# Stream 1: Backend Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the generate-social-posts edge function with a generation ledger, idempotency, server-side subscription enforcement, token budget tracking, content safety, and Paddle payment integration — eliminating the tab-switching content loss bug and all identified security gaps.

**Architecture:** All changes are server-side (Supabase Edge Functions + DB migrations). A new `generations` table acts as a ledger: every request writes a `pending` row before calling Claude, updates it to `completed` or `failed` after. The frontend reads the latest generation from this table on load, eliminating React state as the source of truth. Subscription enforcement moves from frontend hook to edge function. Paddle replaces LemonSqueezy.

**Tech Stack:** Deno, Supabase (PostgreSQL + Edge Functions), Anthropic Claude API, Paddle webhooks

**Branch:** `feature/backend-reliability`

**Spec:** `docs/superpowers/specs/2026-04-04-launch-readiness-design.md` → Stream 1

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260404_add_generations_table.sql` | Generations ledger schema + RLS |
| Create | `supabase/migrations/20260404_add_paddle_columns.sql` | Add paddle_* columns to subscriptions |
| Modify | `supabase/functions/generate-social-posts/index.ts` | All reliability changes (see tasks) |
| Create | `supabase/functions/paddle-webhook/index.ts` | Paddle event handler |
| Delete | `supabase/functions/lemonsqueezy-webhook/index.ts` | Superseded by paddle-webhook |
| Create | `supabase/functions/generate-social-posts/index.test.ts` | Integration tests |

---

## Task 1: Create branch and generations table migration

**Files:**
- Create: `supabase/migrations/20260404_add_generations_table.sql`

- [ ] **Step 1: Create feature branch**

```bash
cd /Users/bobpigott/Documents/ivangel
git checkout -b feature/backend-reliability
```

- [ ] **Step 2: Write the migration file**

```sql
-- supabase/migrations/20260404_add_generations_table.sql
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid unique not null,
  user_id uuid references auth.users not null,
  church_id uuid not null,
  created_at timestamptz default now(),
  completed_at timestamptz,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  content_types text[] not null,
  platforms text[],
  generation_mode text not null default 'sermon',
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10,6),
  result jsonb
);

alter table public.generations enable row level security;

create policy "Users can read own generations"
  on public.generations for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own generations"
  on public.generations for insert
  with check ((select auth.uid()) = user_id);

create policy "Service role can manage all generations"
  on public.generations for all
  using (auth.jwt() ->> 'role' = 'service_role');

create index generations_user_id_created_at_idx
  on public.generations(user_id, created_at desc);

create index generations_idempotency_key_idx
  on public.generations(idempotency_key);
```

- [ ] **Step 3: Apply migration to local Supabase**

```bash
npx supabase db push --local
```

Expected: migration applied with no errors.

- [ ] **Step 4: Verify table exists**

```bash
npx supabase db diff --local
```

Expected: no diff (migration fully applied).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260404_add_generations_table.sql
git commit -m "feat: add generations ledger table with RLS"
```

---

## Task 2: Add Paddle columns to subscriptions table

**Files:**
- Create: `supabase/migrations/20260404_add_paddle_columns.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260404_add_paddle_columns.sql
alter table public.subscriptions
  add column if not exists paddle_subscription_id text unique,
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_price_id text;

-- Keep ls_* columns — historical data, do not drop
comment on column public.subscriptions.ls_subscription_id
  is 'Legacy LemonSqueezy identifier — superseded by paddle_subscription_id';
```

- [ ] **Step 2: Apply and verify**

```bash
npx supabase db push --local
npx supabase db diff --local
```

Expected: no diff.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260404_add_paddle_columns.sql
git commit -m "feat: add paddle_* columns to subscriptions table"
```

---

## Task 3: Set up Deno test infrastructure

**Files:**
- Create: `supabase/functions/generate-social-posts/index.test.ts`

Deno has a built-in test runner. Tests for edge functions run with `deno test`. No package installation needed.

- [ ] **Step 1: Write the first failing test — duplicate idempotency key returns existing result**

```typescript
// supabase/functions/generate-social-posts/index.test.ts
import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";

// Test the idempotency key logic in isolation by extracting the check function
// We test behaviour via HTTP against a local Supabase instance

const BASE_URL = "http://localhost:54321/functions/v1";
const TEST_JWT = Deno.env.get("TEST_JWT") ?? "";

async function callGenerate(body: Record<string, unknown>) {
  return fetch(`${BASE_URL}/generate-social-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TEST_JWT}`,
    },
    body: JSON.stringify(body),
  });
}

Deno.test("missing idempotency_key returns 400", async () => {
  const res = await callGenerate({
    transcript: "a".repeat(200),
    contentTypes: ["social_media"],
    platforms: ["facebook"],
    churchId: "00000000-0000-0000-0000-000000000001",
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "idempotency_key required");
});

Deno.test("content safety blocks prohibited content", async () => {
  const res = await callGenerate({
    idempotency_key: crypto.randomUUID(),
    transcript: "fuck this sermon about grace",
    contentTypes: ["social_media"],
    platforms: ["facebook"],
    churchId: "00000000-0000-0000-0000-000000000001",
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(typeof body.violations, "object");
});
```

- [ ] **Step 2: Run to verify tests fail (function not yet updated)**

```bash
cd /Users/bobpigott/Documents/ivangel
npx supabase functions serve generate-social-posts &
deno test supabase/functions/generate-social-posts/index.test.ts --allow-net --allow-env
```

Expected: FAIL — tests should fail because the function doesn't yet enforce idempotency or content safety.

- [ ] **Step 3: Commit failing tests**

```bash
git add supabase/functions/generate-social-posts/index.test.ts
git commit -m "test: add failing tests for idempotency and content safety"
```

---

## Task 4: Add server-side subscription enforcement

**Files:**
- Modify: `supabase/functions/generate-social-posts/index.ts`

The subscription check goes immediately after the auth check (after line ~110 in the current file).

- [ ] **Step 1: Add subscription check after auth validation**

In `supabase/functions/generate-social-posts/index.ts`, find the block ending with:
```typescript
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
```

Add immediately after it:
```typescript
    // === SERVER-SIDE SUBSCRIPTION ENFORCEMENT ===
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at, exempt')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError || !subscription) {
      return new Response(JSON.stringify({
        error: 'No active subscription found. Please sign up to continue.'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const trialValid = subscription.status === 'trialing' &&
      new Date(subscription.trial_ends_at) > new Date();
    const isSubscriptionActive = subscription.exempt ||
      subscription.status === 'active' ||
      trialValid;

    if (!isSubscriptionActive) {
      return new Response(JSON.stringify({
        error: 'Subscription required',
        subscription_status: subscription.status
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
```

- [ ] **Step 2: Add test for over-quota subscription**

In `index.test.ts`, add:
```typescript
Deno.test("expired subscription returns 402", async () => {
  // This test requires a test user with an expired subscription in the DB.
  // Set up: UPDATE subscriptions SET status='expired' WHERE user_id='<test-user-id>';
  // Then use that user's JWT as EXPIRED_JWT env var.
  const expiredJwt = Deno.env.get("EXPIRED_JWT");
  if (!expiredJwt) {
    console.warn("EXPIRED_JWT not set — skipping subscription enforcement test");
    return;
  }
  const res = await fetch(`${BASE_URL}/generate-social-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${expiredJwt}`,
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      transcript: "a".repeat(200),
      contentTypes: ["social_media"],
      platforms: ["facebook"],
      churchId: "00000000-0000-0000-0000-000000000001",
    }),
  });
  assertEquals(res.status, 402);
  const body = await res.json();
  assertEquals(body.subscription_status, "expired");
});
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/generate-social-posts/index.ts \
        supabase/functions/generate-social-posts/index.test.ts
git commit -m "feat: add server-side subscription enforcement to generate-social-posts"
```

---

## Task 5: Add idempotency + generation ledger (write pending row)

**Files:**
- Modify: `supabase/functions/generate-social-posts/index.ts`

This adds the idempotency check and writes the pending row *before* calling Claude. Place this block after the subscription check and after `requestBody` is parsed (after `const { transcript, ... } = requestBody`).

- [ ] **Step 1: Add idempotency key validation and pending row insert**

Find the line in `index.ts`:
```typescript
    const { transcript, styleGuide, platforms: rawPlatforms, customCTA, churchId,
```

Before it, add:
```typescript
    // === IDEMPOTENCY KEY VALIDATION ===
    const { idempotency_key: idempotencyKey } = await req.clone().json().catch(() => ({}));
    if (!idempotencyKey) {
      return new Response(JSON.stringify({ error: 'idempotency_key required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
```

Note: `idempotencyKey` is extracted before the full `requestBody` parse since it's needed for early returns. After the full `requestBody` parse, add:

```typescript
    // === GENERATION LEDGER: CHECK FOR EXISTING + INSERT PENDING ===
    const { data: existingGeneration } = await supabase
      .from('generations')
      .select('status, result')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingGeneration?.status === 'completed') {
      console.log('Returning cached generation for idempotency_key:', idempotencyKey);
      return new Response(JSON.stringify(existingGeneration.result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (existingGeneration?.status === 'pending') {
      return new Response(JSON.stringify({ error: 'Generation already in progress' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error: insertError } = await supabase
      .from('generations')
      .insert({
        idempotency_key: idempotencyKey,
        user_id: user.id,
        church_id: churchId,
        content_types: contentTypes,
        platforms: platforms,
        generation_mode: generationMode,
        status: 'pending'
      });

    if (insertError) {
      // Race condition — another concurrent request inserted first
      return new Response(JSON.stringify({ error: 'Generation already in progress' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-social-posts/index.ts
git commit -m "feat: add idempotency key validation and pending generation ledger row"
```

---

## Task 6: Update generation ledger on completion and failure

**Files:**
- Modify: `supabase/functions/generate-social-posts/index.ts`

The update goes in two places: after the successful response is assembled, and in the catch block.

- [ ] **Step 1: Write tokens and result to generation row on success**

Find where the final successful `return new Response(...)` is assembled (near the end of the try block). Before that return, add:

```typescript
    // === GENERATION LEDGER: UPDATE TO COMPLETED ===
    const inputTokens = aiData?.usage?.input_tokens ?? 0;
    const outputTokens = aiData?.usage?.output_tokens ?? 0;
    // Haiku pricing: $1/M input, $5/M output
    const estimatedCostUsd = (inputTokens / 1_000_000 * 1.0) + (outputTokens / 1_000_000 * 5.0);

    await supabase
      .from('generations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost_usd: estimatedCostUsd,
        result: responsePayload  // whatever the final JSON response object is named
      })
      .eq('idempotency_key', idempotencyKey);
```

- [ ] **Step 2: Mark generation as failed in catch block**

Find the catch block (near the bottom of the serve handler). Add before the error response:

```typescript
  } catch (error) {
    console.error('=== FUNCTION ERROR ===', error);

    // Mark generation as failed if we have an idempotency key
    if (typeof idempotencyKey === 'string') {
      const supabaseForCleanup = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseForCleanup
        .from('generations')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotencyKey)
        .catch(() => {}); // best-effort, don't mask the original error
    }
    // ... existing error response
```

- [ ] **Step 3: Add idempotency test to test file**

In `index.test.ts`:
```typescript
Deno.test("duplicate idempotency_key returns existing result without calling Claude again", async () => {
  const key = crypto.randomUUID();
  const payload = {
    idempotency_key: key,
    transcript: "a".repeat(200),
    contentTypes: ["social_media"],
    platforms: ["facebook"],
    churchId: "00000000-0000-0000-0000-000000000001",
  };

  const first = await callGenerate(payload);
  assertEquals(first.status, 200);

  const second = await callGenerate(payload);
  assertEquals(second.status, 200);

  // Both responses should be identical JSON
  const body1 = await first.json();
  const body2 = await second.json();
  assertEquals(JSON.stringify(body1), JSON.stringify(body2));
});
```

- [ ] **Step 4: Run tests**

```bash
deno test supabase/functions/generate-social-posts/index.test.ts --allow-net --allow-env
```

Expected: idempotency tests PASS, content safety test still FAIL (not yet enabled).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/generate-social-posts/index.ts \
        supabase/functions/generate-social-posts/index.test.ts
git commit -m "feat: write generation result and tokens to ledger on completion/failure"
```

---

## Task 7: Add token budget pre-flight check

**Files:**
- Modify: `supabase/functions/generate-social-posts/index.ts`

Place this after the subscription check and before the idempotency check.

- [ ] **Step 1: Add rolling 30-day cost check**

After the `isSubscriptionActive` check, add:

```typescript
    // === TOKEN BUDGET PRE-FLIGHT ===
    if (!subscription.exempt) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: usageRows } = await supabase
        .from('generations')
        .select('estimated_cost_usd')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo);

      const monthlyCostUsd = (usageRows ?? []).reduce(
        (sum, row) => sum + (row.estimated_cost_usd ?? 0),
        0
      );

      // £25/month plan: allow up to $6 USD of compute (generous, ~200 full generations)
      const MONTHLY_LIMIT_USD = 6.0;
      if (monthlyCostUsd >= MONTHLY_LIMIT_USD) {
        return new Response(JSON.stringify({
          error: 'Monthly generation limit reached. Your limit resets in 30 days.',
          monthly_cost_usd: monthlyCostUsd,
          limit_usd: MONTHLY_LIMIT_USD
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-social-posts/index.ts
git commit -m "feat: add rolling 30-day token budget pre-flight check"
```

---

## Task 8: Re-enable content safety

**Files:**
- Modify: `supabase/functions/generate-social-posts/index.ts`

- [ ] **Step 1: Remove the feature flag**

Find line 26 in `generate-social-posts/index.ts`:
```typescript
const CONTENT_SAFETY_ENABLED = false;
```

Delete that line entirely.

- [ ] **Step 2: Update all references**

Find all blocks wrapped in `if (CONTENT_SAFETY_ENABLED) {` and remove the conditional wrapper, leaving the content safety logic unconditionally active. There are two such blocks: one for input validation of `transcript` and one for `customCTA`.

The result should look like:
```typescript
    // Validate input content
    if (transcript) {
      const transcriptValidation = validateInput(transcript);
      if (!transcriptValidation.isSafe) {
        return new Response(JSON.stringify({
          error: `Your sermon transcript contains inappropriate content.`,
          violations: transcriptValidation.violations
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (customCTA) {
      const ctaValidation = validateInput(customCTA);
      if (!ctaValidation.isSafe) {
        return new Response(JSON.stringify({
          error: `Your CTA contains inappropriate content.`,
          violations: ctaValidation.violations
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
```

- [ ] **Step 3: Run tests — content safety test should now pass**

```bash
deno test supabase/functions/generate-social-posts/index.test.ts --allow-net --allow-env
```

Expected: content safety test PASS.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-social-posts/index.ts
git commit -m "feat: re-enable content safety — remove CONTENT_SAFETY_ENABLED flag"
```

---

## Task 9: Remove email_newsletter content type

**Files:**
- Modify: `supabase/functions/generate-social-posts/index.ts`

- [ ] **Step 1: Remove the newsletter flag and all associated logic**

Find and delete:
```typescript
const hasEmailNewsletter = contentTypes.includes('email_newsletter');
```

Find and delete the `if (hasEmailNewsletter)` block in the prompt assembly section (search for `hasEmailNewsletter` — there will be 2–3 occurrences).

Find and delete `'email_newsletter'` from any validation error messages listing supported content types.

- [ ] **Step 2: Verify no remaining references**

```bash
grep -n "email_newsletter\|newsletter\|hasEmailNewsletter" \
  supabase/functions/generate-social-posts/index.ts
```

Expected: zero matches.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/generate-social-posts/index.ts
git commit -m "feat: remove email_newsletter content type (deferred to future release)"
```

---

## Task 10: Verify and fix web scraper

**Files:**
- Modify: `supabase/functions/scrape-church-website/index.ts` (fix as needed)

The scraper is a dependency for Stream 3 (Onboarding). It must work reliably before onboarding is built.

- [ ] **Step 1: Test scraper against a real church website**

```bash
npx supabase functions serve scrape-church-website &

curl -X POST http://localhost:54321/functions/v1/scrape-church-website \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-local-anon-key>" \
  -d '{"websiteUrl": "https://www.vineyardchurches.org.uk"}'
```

Expected: JSON response with scraped content sections (about, sermons, values, etc.).

- [ ] **Step 2: Fix any failures**

Common issues to check:
- CORS headers missing on error responses
- Firecrawl API key not loaded from env (`FIRECRAWL_API_KEY`)
- Response shape not matching what the frontend expects (check `WebsiteScraping.tsx` for expected fields)
- Timeout handling (Firecrawl requests can be slow)

Fix whatever fails. If the scraper returns a 500 or empty result, read the Supabase function logs:
```bash
npx supabase functions logs scrape-church-website --local
```

- [ ] **Step 3: Test with a second URL to confirm reliability**

```bash
curl -X POST http://localhost:54321/functions/v1/scrape-church-website \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-local-anon-key>" \
  -d '{"websiteUrl": "https://www.htb.org"}'
```

- [ ] **Step 4: Commit any fixes**

```bash
git add supabase/functions/scrape-church-website/
git commit -m "fix: ensure scrape-church-website works reliably with real URLs"
```

---

## Task 11: Add Paddle webhook handler

**Files:**
- Create: `supabase/functions/paddle-webhook/index.ts`

Build this speculatively — it will be activated once the Paddle merchant account is approved.

- [ ] **Step 1: Create the webhook handler**

```typescript
// supabase/functions/paddle-webhook/index.ts
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature',
};

async function verifyPaddleSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = Object.fromEntries(signature.split(';').map(p => p.split('=')));
  if (!parts.ts || !parts.h1) return false;

  const payload = `${parts.ts}:${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === parts.h1;
}

const PADDLE_STATUS_MAP: Record<string, string> = {
  'subscription.activated': 'active',
  'subscription.updated': 'active',
  'subscription.cancelled': 'cancelled',
  'subscription.paused': 'cancelled',
  'subscription.past_due': 'past_due',
  'subscription.resumed': 'active',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body = await req.text();
    const signature = req.headers.get('paddle-signature');
    const webhookSecret = Deno.env.get('PADDLE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Missing signature or secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const valid = await verifyPaddleSignature(body, signature, webhookSecret);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const event = JSON.parse(body);
    const eventType: string = event.event_type;
    const newStatus = PADDLE_STATUS_MAP[eventType];

    console.log(`Paddle event: ${eventType}`, event.data?.id);

    if (newStatus) {
      const paddleData = event.data;
      const customerEmail = paddleData.customer?.email;

      if (!customerEmail) {
        console.warn('Paddle event missing customer email', event);
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
      }

      // Find Supabase user by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const matchedUser = users.find(u => u.email === customerEmail);
      if (!matchedUser) {
        console.warn('No Supabase user found for email:', customerEmail);
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
      }

      await supabase.from('subscriptions').upsert({
        user_id: matchedUser.id,
        paddle_subscription_id: paddleData.id,
        paddle_customer_id: paddleData.customer_id,
        status: newStatus,
        current_period_ends_at: paddleData.current_billing_period?.ends_at ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      console.log(`Updated subscription for ${customerEmail} → ${newStatus}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Paddle webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

- [ ] **Step 2: Register webhook in Supabase**

```bash
# Deploy the function (only deploy when Paddle account is approved)
# npx supabase functions deploy paddle-webhook

# Set the Paddle webhook secret (do this when Paddle account is ready)
# npx supabase secrets set PADDLE_WEBHOOK_SECRET=<from-paddle-dashboard>
```

Note: Do NOT deploy until Paddle merchant account is approved. Commit the code now; activate later.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/paddle-webhook/
git commit -m "feat: add Paddle webhook handler (activate once merchant account approved)"
```

---

## Task 12: Run full test suite and raise PR

- [ ] **Step 1: Run all tests**

```bash
npx supabase functions serve &
deno test supabase/functions/generate-social-posts/index.test.ts --allow-net --allow-env
```

Expected: all tests PASS.

- [ ] **Step 2: Smoke test manually**

Open the app locally (`npm run dev`), generate content, switch browser tabs, come back — result should still be visible (fetched from DB, not React state — note: frontend DB read is built in Stream 2).

- [ ] **Step 3: Final commit and push branch**

```bash
git push -u origin feature/backend-reliability
```

- [ ] **Step 4: Open PR**

Title: `feat: backend reliability — generation ledger, idempotency, server-side subscription enforcement, Paddle`

Body: reference `docs/superpowers/specs/2026-04-04-launch-readiness-design.md` Stream 1.

Do NOT merge until Stream 2 is also ready for review (they are independent but the tab-switching fix only shows end-to-end once both streams are merged).
