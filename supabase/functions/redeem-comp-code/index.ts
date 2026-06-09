import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maps the redeem_comp_code RPC's `reason` to an HTTP status + user-facing message.
// `granted` / `already_redeemed` are both successes (idempotent).
const OUTCOMES: Record<string, { status: number; success: boolean; message: string }> = {
  granted:          { status: 200, success: true,  message: "Code redeemed — your account now has full access." },
  already_redeemed: { status: 200, success: true,  message: "You've already redeemed this code — you have full access." },
  invalid:          { status: 404, success: false, message: "That code isn't valid." },
  inactive:         { status: 410, success: false, message: "That code is no longer available." },
  expired:          { status: 410, success: false, message: "That code has expired." },
  exhausted:        { status: 410, success: false, message: "That code has already been fully redeemed." },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Service-role client: only this can execute redeem_comp_code (RPC is locked to service_role).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the caller's JWT — the user id comes from here, never from the request body.
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

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code) {
      return new Response(JSON.stringify({ error: 'A comp code is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('redeem_comp_code', {
      p_code: code,
      p_user_id: user.id,
    });

    if (error) {
      console.error('redeem_comp_code RPC failed:', error);
      return new Response(JSON.stringify({ error: 'Could not redeem code. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reason = (data as { reason?: string })?.reason ?? 'invalid';
    const outcome = OUTCOMES[reason] ?? OUTCOMES.invalid;

    return new Response(
      JSON.stringify({ success: outcome.success, message: outcome.message }),
      { status: outcome.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
