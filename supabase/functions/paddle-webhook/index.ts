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
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find Supabase user by email
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

      await supabase.from('subscriptions').upsert({
        user_id: matchedUser.id,
        paddle_subscription_id: paddleData.id,
        paddle_customer_id: paddleData.customer_id,
        status: newStatus,
        current_period_ends_at: paddleData.current_billing_period?.ends_at ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (eventType === 'subscription.past_due') {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'payment_failed', user_id: matchedUser.id }),
        }).catch((err) => console.error('Failed to send payment_failed email:', err));
      }

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
