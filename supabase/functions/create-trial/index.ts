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
