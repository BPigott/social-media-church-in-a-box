import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'ivangel <noreply@ivangel.co.uk>';
const APP_BASE_URL = Deno.env.get('APP_URL') ?? 'https://ivangel.co.uk';
// Warm dove brand (see src/index.css design tokens).
const BRAND_COLOUR = '#cb5d47'; // Terracotta (primary)
const BRAND_BG = '#f5f2eb'; // Sand
const BRAND_TEXT = '#3a352f'; // Earth
const BRAND_MUTED = '#7c6a5d'; // Clay
const LOGO_URL = 'https://ivangel.co.uk/dove-mark.png';

// ---------------------------------------------------------------------------
// HTML escape helper (Fix 3)
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// HTML template helpers
// ---------------------------------------------------------------------------

function buildEmailHtml(bodyText: string, ctaLabel: string, ctaHref: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(ctaLabel)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
                      box-shadow:0 1px 3px rgba(58,53,47,0.12);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background:${BRAND_BG};padding:28px 32px 20px;border-bottom:1px solid #e7e1d6;">
              <img src="${LOGO_URL}" width="44" height="44" alt="ivangel"
                   style="display:block;margin:0 auto 8px;border:0;" />
              <span style="color:${BRAND_TEXT};font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                ivangel
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;color:${BRAND_TEXT};font-size:16px;line-height:1.6;">
                ${escapeHtml(bodyText)}
              </p>
              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:${BRAND_COLOUR};">
                    <a href="${escapeHtml(ctaHref)}"
                       style="display:inline-block;padding:13px 26px;color:#ffffff;
                              font-family:Arial,sans-serif;font-size:15px;font-weight:600;
                              text-decoration:none;border-radius:8px;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e7e1d6;">
              <p style="margin:0;color:${BRAND_MUTED};font-size:13px;">
                ivangel &mdash; one sermon, a week of content.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Resend send helper
// ---------------------------------------------------------------------------

interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  resendApiKey: string;
}

async function sendViaResend(params: SendEmailParams): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }

  return { ok: res.ok, status: res.status, body };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fix 1 — caller authentication
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const isServiceRole = Boolean(serviceRoleKey && token === serviceRoleKey);

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fix 2 — guard SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // -------------------------------------------------------------------------
  // Pattern 1 — generic send (service role only)
  // -------------------------------------------------------------------------
  if (!payload.type) {
    // Fix 1 — Pattern 1 requires service role
    if (!isServiceRole) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { to, subject, html } = payload as { to?: string; subject?: string; html?: string };

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    try {
      const result = await sendViaResend({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
        resendApiKey,
      });

      if (!result.ok) {
        console.error('Resend API error (generic):', result.status, result.body);
        return new Response(JSON.stringify({ error: 'Failed to send email', detail: result.body }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data: result.body }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Unexpected error (generic send):', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Patterns 2 & 3 — typed sends requiring Supabase auth admin.
  // These resolve an arbitrary user_id to a real email address and send an
  // official billing notice, so they are restricted to the service role
  // (the Stripe webhook is the only legitimate caller). A user JWT must not
  // be able to make ivangel email an arbitrary user_id.
  // -------------------------------------------------------------------------
  if (!isServiceRole) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fix 2 — use guarded supabaseUrl and supabaseServiceKey (not ?? '')
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // -------------------------------------------------------------------------
  // Pattern 2 — trial_expiring (batch)
  // -------------------------------------------------------------------------
  if (payload.type === 'trial_expiring') {
    const userIds = payload.user_ids as string[] | undefined;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_ids (non-empty array)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Use the Stripe checkout link, with an absolute fallback to the in-app upgrade page.
    const upgradeUrl =
      Deno.env.get('STRIPE_CHECKOUT_URL') ?? `${APP_BASE_URL}/upgrade`;

    const results: Array<{ user_id: string; success: boolean; error?: string }> = [];

    for (const userId of userIds) {
      try {
        const { data: { user }, error: userError } =
          await supabase.auth.admin.getUserById(userId);

        if (userError || !user?.email) {
          const msg = userError?.message ?? 'User not found or has no email';
          console.error(`trial_expiring: skipping ${userId} — ${msg}`);
          results.push({ user_id: userId, success: false, error: msg });
          continue;
        }

        const html = buildEmailHtml(
          'Your ivangel trial ends in 3 days. Upgrade to keep generating content.',
          'Upgrade Now',
          upgradeUrl,
        );

        const result = await sendViaResend({
          from: FROM_ADDRESS,
          to: user.email,
          subject: 'Your ivangel trial ends in 3 days',
          html,
          resendApiKey,
        });

        if (!result.ok) {
          const msg = `Resend error ${result.status}`;
          console.error(`trial_expiring: send failed for ${userId} — ${msg}`, result.body);
          results.push({ user_id: userId, success: false, error: msg });
          continue;
        }

        results.push({ user_id: userId, success: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`trial_expiring: unexpected error for ${userId}:`, err);
        results.push({ user_id: userId, success: false, error: msg });
      }
    }

    const failed = results.filter((r) => !r.success);
    return new Response(
      JSON.stringify({ success: true, results, failed_count: failed.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // -------------------------------------------------------------------------
  // Pattern 3 — payment_failed (single user)
  // -------------------------------------------------------------------------
  if (payload.type === 'payment_failed') {
    const userId = payload.user_id as string | undefined;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    try {
      const { data: { user }, error: userError } =
        await supabase.auth.admin.getUserById(userId);

      if (userError || !user?.email) {
        const msg = userError?.message ?? 'User not found or has no email';
        console.error(`payment_failed: cannot find user ${userId} — ${msg}`);
        return new Response(JSON.stringify({ error: msg }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fix 4 — replace relative /billing with absolute URL
      const html = buildEmailHtml(
        "We couldn't process your payment. Update your billing details to restore access.",
        'Update Payment',
        `${APP_BASE_URL}/billing`,
      );

      const result = await sendViaResend({
        from: FROM_ADDRESS,
        to: user.email,
        subject: 'Action required: payment failed for ivangel',
        html,
        resendApiKey,
      });

      if (!result.ok) {
        console.error(`payment_failed: Resend error ${result.status}`, result.body);
        return new Response(
          JSON.stringify({ error: 'Failed to send email', detail: result.body }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ success: true, data: result.body }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Unexpected error (payment_failed):', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Unknown type
  // -------------------------------------------------------------------------
  return new Response(
    JSON.stringify({ error: `Unknown type: ${payload.type}` }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
