import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
