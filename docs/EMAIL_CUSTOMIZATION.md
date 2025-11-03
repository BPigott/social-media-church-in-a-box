# Email Template Customization Guide

This guide explains how to customize the email templates sent by Supabase to appear as though they're from ivangel instead of the generic Supabase branding.

## Overview

Supabase sends several types of authentication emails:
- **Signup Confirmation** - Sent when a new user signs up
- **Password Reset** - Sent when a user requests a password reset
- **Email Change Confirmation** - Sent when a user changes their email address

## Important Notes

- Email templates **cannot** be configured via the Supabase CLI for hosted projects
- Templates must be configured through the **Supabase Dashboard**
- We've created template files in `supabase/templates/` that you can copy into the Dashboard

## Step-by-Step Dashboard Configuration

### 1. Access Email Templates

1. Log in to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (project ID: `gxgijxmwipnurubqupbt`)
3. Navigate to **Authentication** → **Email Templates** in the left sidebar

### 2. Configure Each Template

For each email template (Signup, Password Reset, Email Change), follow these steps:

#### Signup Confirmation Email

1. Click on **"Confirm signup"** template
2. Copy the content from `supabase/templates/confirm-signup.html`
3. Paste it into the template editor
4. **Subject Line**: `Welcome to ivangel - Confirm Your Email`
5. **Sender Name**: `ivangel` (or your preferred name)
6. Click **Save**

#### Password Reset Email

1. Click on **"Reset password"** template
2. Copy the content from `supabase/templates/reset-password.html`
3. Paste it into the template editor
4. **Subject Line**: `Reset Your ivangel Password`
5. **Sender Name**: `ivangel`
6. Click **Save**

#### Email Change Confirmation

1. Click on **"Change email address"** template
2. Copy the content from `supabase/templates/change-email.html`
3. Paste it into the template editor
4. **Subject Line**: `Confirm Your New Email Address - ivangel`
5. **Sender Name**: `ivangel`
6. Click **Save**

### 3. Template Variables

The templates use these Supabase template variables that are automatically replaced:

- `{{ .ConfirmationURL }}` - The confirmation/reset link URL
- `{{ .Email }}` - The user's email address (if needed)
- `{{ .Token }}` - The confirmation token (if needed)

**Important**: Do not modify these variables in the templates - they are automatically replaced by Supabase.

### 4. Configure Redirect URLs

Ensure your password reset redirect URL is whitelisted:

1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `https://yourdomain.com/reset-password`
   - `http://localhost:5173/reset-password` (for local development)
3. Click **Save**

### 5. Optional: Configure Custom SMTP (Recommended for Production)

For better deliverability and full control over sender email addresses, configure a custom SMTP provider. Below are detailed instructions for Resend.

#### Setting Up Resend with Supabase

Resend is an excellent choice for transactional emails - it's developer-friendly, has great deliverability, and offers a generous free tier.

**Step 1: Get Your Resend API Key**

1. Log in to your Resend account at https://resend.com
2. Go to **API Keys** in the left sidebar (or visit https://resend.com/api-keys)
3. Click **Create API Key**
4. Give it a name (e.g., "Supabase Email")
5. Copy the API key immediately (you won't be able to see it again!)
6. Save it securely

**Step 2: Verify Your Domain (Recommended)**

For better deliverability, verify your domain:

1. In Resend, go to **Domains** (or visit https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain's DNS settings:
   - SPF record (TXT record)
   - DKIM records (CNAME records)
   - DMARC record (optional but recommended)
5. Wait for verification (usually a few minutes to an hour)

**Note**: You can use Resend without domain verification by using `onboarding@resend.dev` or `noreply@resend.dev` as the sender email, but verified domains have much better deliverability.

**Step 3: Configure SMTP in Supabase**

1. In your Supabase Dashboard, go to **Authentication** → **Providers**
2. Scroll down to find **SMTP Settings** (or go directly to **Project Settings** → **Auth** → **SMTP Settings**)
3. Toggle **Enable Custom SMTP** to ON
4. Fill in the Resend SMTP credentials:

   **SMTP Host**: `smtp.resend.com`  
   **SMTP Port**: `465` (or `587` for TLS)  
   **SMTP User**: `resend`  
   **SMTP Password**: Your Resend API key (the one you copied in Step 1)  
   **Sender Email**: 
   - If you verified a domain: `noreply@yourdomain.com` (use your verified domain)
   - If not verified: `onboarding@resend.dev` or `noreply@resend.dev`  
   **Sender Name**: `ivangel`

5. Click **Save** or **Update**

**Step 4: Test the Integration**

1. In Supabase, go to **Authentication** → **Users**
2. Try creating a test user or resetting a password
3. Check your Resend dashboard at https://resend.com/emails to see if the email was sent
4. Verify the email arrives in the inbox (check spam folder if needed)

**Step 5: Configure Email Templates (Still Required)**

Even with custom SMTP, you still need to configure the email templates as described in Step 2 above. The SMTP settings only control HOW emails are sent, not WHAT they contain.

#### Troubleshooting Resend Setup

**Emails not sending:**
- Verify your API key is correct (no extra spaces)
- Check that SMTP port is correct (465 or 587)
- Ensure "Enable Custom SMTP" toggle is ON
- Check Resend dashboard for error messages

**Emails going to spam:**
- Verify your domain with Resend and add all DNS records
- Use a verified domain email address as sender
- Ensure SPF, DKIM, and DMARC records are properly configured

**API key issues:**
- Make sure you're using the full API key (starts with `re_`)
- Regenerate the API key if needed
- Check that the API key hasn't been revoked

**Still using Supabase default emails:**
- Double-check that "Enable Custom SMTP" is toggled ON
- Refresh the Supabase dashboard
- Try disabling and re-enabling the SMTP toggle

#### Other SMTP Provider Options

If you prefer a different provider:

- **SendGrid** - Reliable, enterprise-grade (https://sendgrid.com)
- **AWS SES** - Cost-effective for high volume (https://aws.amazon.com/ses/)
- **Postmark** - Great for transactional emails (https://postmarkapp.com)

Each provider will have similar SMTP settings - you'll need their SMTP host, port, username, and password/API key.

## Template Customization

### Branding Elements

The templates include:
- **Logo/Name**: "ivangel" (can be customized in the HTML)
- **Color Scheme**: Blue (#2563eb) - can be changed to match your brand
- **Tone**: Friendly and professional

### Customizing Templates

To customize the templates further:

1. Edit the HTML files in `supabase/templates/`
2. Update colors, fonts, or messaging as needed
3. Copy the updated content into the Supabase Dashboard

### Testing Templates

1. Use Supabase's **"Send test email"** feature in the Email Templates section
2. Or create a test user account and trigger each email type
3. Verify that:
   - Emails appear to come from "ivangel"
   - Links work correctly
   - Styling renders properly in email clients

## Local Development

For local development, templates can be configured in `supabase/config.toml`:

```toml
[auth.email.template.confirm_signup]
subject = "Welcome to ivangel - Confirm Your Email"
content_path = "./supabase/templates/confirm-signup.html"

[auth.email.template.reset_password]
subject = "Reset Your ivangel Password"
content_path = "./supabase/templates/reset-password.html"

[auth.email.template.change_email]
subject = "Confirm Your New Email Address - ivangel"
content_path = "./supabase/templates/change-email.html"
```

Then restart local Supabase:

```bash
supabase stop && supabase start
```

## Troubleshooting

### Emails still showing Supabase branding
- Ensure you've saved the templates in the Dashboard
- Clear browser cache and refresh the Dashboard
- Verify you're editing the correct project

### Links not working
- Check that redirect URLs are whitelisted
- Verify the URL in the template matches your application's reset password route
- Test the full URL flow from email to application

### Emails going to spam
- Set up custom SMTP with proper domain authentication (SPF, DKIM)
- Use a professional sender email address
- Avoid spam trigger words in subject lines

## Security Considerations

- Password reset links expire after 1 hour (configured in Supabase)
- Email confirmation links are single-use
- Always use HTTPS for production redirect URLs
- Monitor email delivery rates and bounce rates

## Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth/email-templates
2. Verify your Supabase project settings
3. Check email provider logs if using custom SMTP

