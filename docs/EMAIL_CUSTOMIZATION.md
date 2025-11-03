# Email Template Customization Guide

This guide explains how to customize the email templates sent by Supabase to appear as though they're from Evangel instead of the generic Supabase branding.

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
4. **Subject Line**: `Welcome to Evangel - Confirm Your Email`
5. **Sender Name**: `Evangel` (or your preferred name)
6. Click **Save**

#### Password Reset Email

1. Click on **"Reset password"** template
2. Copy the content from `supabase/templates/reset-password.html`
3. Paste it into the template editor
4. **Subject Line**: `Reset Your Evangel Password`
5. **Sender Name**: `Evangel`
6. Click **Save**

#### Email Change Confirmation

1. Click on **"Change email address"** template
2. Copy the content from `supabase/templates/change-email.html`
3. Paste it into the template editor
4. **Subject Line**: `Confirm Your New Email Address - Evangel`
5. **Sender Name**: `Evangel`
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

For better deliverability and full control over sender email addresses:

1. Go to **Authentication** → **Email Templates**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure your SMTP provider (e.g., Resend, SendGrid, AWS SES)
5. Set **From Email**: `no-reply@yourdomain.com` or `noreply@evangel.com`
6. Set **From Name**: `Evangel`

#### Recommended SMTP Providers

- **Resend** - Easy setup, developer-friendly (https://resend.com)
- **SendGrid** - Reliable, enterprise-grade (https://sendgrid.com)
- **AWS SES** - Cost-effective for high volume (https://aws.amazon.com/ses/)
- **Postmark** - Great for transactional emails (https://postmarkapp.com)

## Template Customization

### Branding Elements

The templates include:
- **Logo/Name**: "Evangel" (can be customized in the HTML)
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
   - Emails appear to come from "Evangel"
   - Links work correctly
   - Styling renders properly in email clients

## Local Development

For local development, templates can be configured in `supabase/config.toml`:

```toml
[auth.email.template.confirm_signup]
subject = "Welcome to Evangel - Confirm Your Email"
content_path = "./supabase/templates/confirm-signup.html"

[auth.email.template.reset_password]
subject = "Reset Your Evangel Password"
content_path = "./supabase/templates/reset-password.html"

[auth.email.template.change_email]
subject = "Confirm Your New Email Address - Evangel"
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

