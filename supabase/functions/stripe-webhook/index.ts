import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2026-05-27.dahlia',
  // Deno has no Node http stack, so Stripe must use fetch + SubtleCrypto.
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Map Stripe's subscription.status values onto our subscriptions.status enum.
const STRIPE_STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'cancelled',
  paused: 'cancelled',
};

// Resolve a Stripe customer id to its email by fetching the customer.
// (subscription.* events carry only the customer id, not the email.)
async function emailForCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      return customer.email ?? null;
    }
  } catch (err) {
    console.error('Failed to retrieve Stripe customer', customerId, err);
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Missing signature or secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error('Stripe signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Stripe event: ${event.type}`, event.id);

    // Figure out the customer email, status, and identifiers for this event.
    let customerEmail: string | null = null;
    let newStatus: string | null = null;
    let stripeSubscriptionId: string | null = null;
    let stripeCustomerId: string | null = null;
    let currentPeriodEndsAt: string | null = null;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        stripeSubscriptionId = sub.id;
        stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        newStatus = event.type === 'customer.subscription.deleted'
          ? 'cancelled'
          : (STRIPE_STATUS_MAP[sub.status] ?? null);

        // current_period_end moved onto subscription items in recent API versions;
        // fall back to the legacy top-level field for safety.
        const periodEnd =
          (sub as unknown as { current_period_end?: number }).current_period_end ??
          sub.items?.data?.[0]?.current_period_end ??
          null;
        currentPeriodEndsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        customerEmail = await emailForCustomer(stripeCustomerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        stripeCustomerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id ?? null;
        newStatus = 'past_due';
        customerEmail = invoice.customer_email
          ?? (stripeCustomerId ? await emailForCustomer(stripeCustomerId) : null);
        break;
      }

      default:
        // Unsubscribed event type — acknowledge so Stripe doesn't retry.
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    if (!newStatus) {
      console.warn(`No status mapping for event ${event.type}; acknowledging without change.`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!customerEmail) {
      console.warn('Stripe event missing customer email', event.id);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Match the Stripe customer back to a Supabase user by email.
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const matchedUser = users.find((u: { email?: string }) => u.email === customerEmail);
    if (!matchedUser) {
      console.warn('No Supabase user found for email:', customerEmail);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only overwrite identifier columns when this event actually carries them.
    const upsertRow: Record<string, unknown> = {
      user_id: matchedUser.id,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (stripeSubscriptionId) upsertRow.stripe_subscription_id = stripeSubscriptionId;
    if (stripeCustomerId) upsertRow.stripe_customer_id = stripeCustomerId;
    if (currentPeriodEndsAt) upsertRow.current_period_ends_at = currentPeriodEndsAt;

    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(upsertRow, { onConflict: 'user_id' });
    if (upsertError) throw upsertError;

    if (event.type === 'invoice.payment_failed') {
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'payment_failed', user_id: matchedUser.id }),
      }).catch((err) => console.error('Failed to send payment_failed email:', err));
    }

    console.log(`Updated subscription for ${customerEmail} → ${newStatus}`);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
