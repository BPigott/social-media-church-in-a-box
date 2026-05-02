import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'ivangel <noreply@ivangel.co>';
const BRAND_COLOUR = '#4F46E5';

// ---------------------------------------------------------------------------
// HTML template helpers
// ---------------------------------------------------------------------------

function buildEmailHtml(bodyText: string, ctaLabel: string, ctaHref: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${ctaLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;
                      box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOUR};padding:24px 32px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                ivangel
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;color:#111827;font-size:16px;line-height:1.6;">
                ${bodyText}
              </p>
              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background:${BRAND_COLOUR};">
                    <a href="${ctaHref}"
                       style="display:inline-block;padding:12px 24px;color:#ffffff;
                              font-size:15px;font-weight:600;text-decoration:none;
                              border-radius:6px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:13px;">
                ivangel &mdash; turning sermons into social media content.
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

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), {
      status: 401,
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
  // Pattern 1 — generic send
  // -------------------------------------------------------------------------
  if (!payload.type) {
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
  // Patterns 2 & 3 — typed sends requiring Supabase auth admin
  // -------------------------------------------------------------------------
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

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

    const upgradeUrl =
      Deno.env.get('VITE_PADDLE_SINGLE_CHECKOUT_URL') ?? '/upgrade';

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

      const html = buildEmailHtml(
        "We couldn't process your payment. Update your billing details to restore access.",
        'Update Payment',
        '/billing',
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
