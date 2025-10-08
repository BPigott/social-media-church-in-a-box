# Lovable Deployment Prompt

Copy and paste this prompt into Lovable to ensure proper deployment:

---

## Prompt for Lovable:

```
I need to deploy critical updates from GitHub to enable Claude 4.5 Sonnet integration. Please help me:

1. **Sync Latest Code from GitHub**
   - Pull the latest commit: `59bdfa5`
   - Commit message: "feat: Migrate from Gemini to Claude 4.5 Sonnet"
   - Ensure all files are synced, especially:
     - supabase/functions/generate-style-guide/index.ts
     - supabase/functions/generate-social-posts/index.ts
     - src/App.tsx
     - src/pages/Login.tsx
     - src/hooks/useAuth.tsx

2. **Verify Environment Secret**
   - Confirm ANTHROPIC_API_KEY is set in edge function environment
   - Value starts with: sk-ant-api03-...
   - Make sure it's accessible to both edge functions

3. **Deploy Edge Functions**
   - Deploy: generate-style-guide
   - Deploy: generate-social-posts
   - Ensure both functions deploy successfully without errors
   - Check deployment logs for any issues

4. **Verify Deployment**
   - Confirm the edge functions are now calling:
     - API endpoint: https://api.anthropic.com/v1/messages
     - Model: claude-sonnet-4-20250514
     - NOT the old Lovable AI Gateway
   - Check that console logs show: "Calling Anthropic API with Claude 4.5 Sonnet..."

5. **Frontend Deployment**
   - Ensure frontend changes are also deployed (login navigation fixes, etc.)
   - No build errors
   - App is accessible via preview/published URL

Please show me:
- The current deployed commit hash
- Edge function deployment status
- Any deployment errors or warnings
- Confirmation that ANTHROPIC_API_KEY environment variable is active

Once complete, I need to test the onboarding flow (style guide generation) and dashboard (social post generation) to verify Claude 4.5 is working correctly.
```

---

## Alternative Shorter Prompt:

If Lovable prefers concise prompts, use this:

```
Pull latest code from GitHub (commit 59bdfa5: "Claude 4.5 Sonnet migration"), verify ANTHROPIC_API_KEY secret is set, deploy both edge functions (generate-style-guide and generate-social-posts), confirm they're calling api.anthropic.com with model claude-sonnet-4-20250514. Show deployment status and any errors.
```

---

## What to Check After Running This Prompt:

1. ✅ Lovable confirms it pulled commit `59bdfa5`
2. ✅ Edge functions show "Deployed successfully"
3. ✅ No errors in deployment logs
4. ✅ ANTHROPIC_API_KEY is confirmed as accessible
5. ✅ Frontend builds without errors

If Lovable shows any of these, let me know immediately:
- ❌ "Cannot find commit"
- ❌ "Deployment failed"
- ❌ "Environment variable not found"
- ❌ "Build errors"

---

## After Successful Deployment:

Run these tests in the app:

**Test 1: Onboarding** (tests generate-style-guide)
1. Sign up with test account
2. Complete church info
3. Upload 3 sermon files
4. Verify style guide generates

**Test 2: Dashboard** (tests generate-social-posts)
1. Login to test account
2. Upload sermon to dashboard
3. Select platforms (Facebook, Instagram, etc.)
4. Generate posts
5. Verify content appears for each platform

---

## Success Indicators:

✅ Style guide generates in 30-60 seconds
✅ Social posts appear for all selected platforms
✅ No console errors
✅ Content is relevant and well-formatted
✅ Can complete full workflow without issues

---

## If Tests Fail:

Share with me:
1. The exact error message (screenshot if possible)
2. Browser console logs
3. What step failed (onboarding or dashboard)
4. Any deployment warnings from Lovable

I'll help debug and fix any issues immediately.
