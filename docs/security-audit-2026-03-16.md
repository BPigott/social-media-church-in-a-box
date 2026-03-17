# Security Audit — 2026-03-16

## npm Dependencies

**Before:** 17 vulnerabilities (1 critical, 9 high, 7 moderate)

**After `npm audit fix`:** 4 remaining (3 moderate, 1 critical)

### Fixed automatically
- react-router (HIGH) — XSS via open redirects
- axios (HIGH) — DoS via proto key
- rollup (HIGH) — arbitrary file write via path traversal
- minimatch, glob, flatted, underscore (HIGH) — ReDoS/recursion DoS
- lodash, ajv, js-yaml, mdast-util-to-hast (MODERATE) — prototype pollution, ReDoS

### Remaining (require breaking changes)
| Package | Severity | Why deferred |
|---------|----------|-------------|
| dompurify <3.2.4 | MODERATE | Fix requires jspdf@4.2.0 (breaking change). jspdf is used for PDF export only. |
| esbuild <=0.24.2 | MODERATE | Fix requires vite@8.0.0 (breaking change). Dev server only, not production. |

**Action:** Revisit these when upgrading Vite or jspdf in a future chunk.

## Deno std Imports

Updated all 5 Edge Functions from `deno.land/std@0.168.0` to `deno.land/std@0.220.1`:
- `generate-social-posts/index.ts`
- `generate-style-guide/index.ts`
- `retranslate-content/index.ts`
- `scrape-church-website/index.ts`
- `api-health-check/index.ts`

## Security Findings & Fixes

### FIXED: scrape-church-website missing auth (HIGH)
- **Issue:** No JWT verification — anyone with the function URL could trigger website scrapes, consuming Firecrawl credits.
- **Fix:** Added Supabase client creation + `auth.getUser()` JWT check after the OPTIONS handler, matching the pattern in generate-style-guide and retranslate-content.

### FIXED: Debug logging leaks sensitive data (HIGH)
- **Issue:** `translate.ts` lines 43-47 logged private key metadata; lines 95-96 logged JWT preview. `scrape-church-website` line 26 logged env var names.
- **Fix:** All sensitive `console.log` statements removed.

### ACCEPTED: api-health-check has no auth (MEDIUM)
- **Risk:** Exposes service health info to unauthenticated callers. Does not modify data.
- **Decision:** Acceptable for now. Health check endpoints are commonly public. Revisit if infra details become sensitive.

### ACCEPTED: CONTENT_SAFETY_ENABLED = false (LOW)
- **Location:** `generate-social-posts/index.ts` line 26
- **Risk:** Content safety filter is disabled.
- **Decision:** Acceptable for a church app generating sermon-based content. Document and revisit if use case broadens.

### ACCEPTED: CORS wildcard (*) (LOW)
- **Risk:** All Edge Functions use `Access-Control-Allow-Origin: *`.
- **Decision:** Acceptable for Supabase Edge Functions that sit behind auth. Standard practice for API endpoints.

## RLS Policies

All 5 tables have RLS enabled with proper `auth.uid()`-scoped policies. No changes needed.
- churches
- user_roles
- style_guides
- sermon_transcripts
- generated_content

## Secrets

No hardcoded API keys or credentials found in source. `.env` files properly gitignored.
