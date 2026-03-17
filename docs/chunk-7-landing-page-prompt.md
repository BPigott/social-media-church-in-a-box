# Chunk 7: Landing Page Full Redesign — Context & Prompt

## Project Context

I'm working on **ivangel** — a React/TS/Vite SaaS app that generates social media content from church sermon transcripts. The codebase is at `/Users/bobpigott/Documents/social-media-church-in-a-box`.

**Tech stack:** React 18 + TypeScript + Vite, shadcn/ui + Tailwind CSS, Supabase (PostgreSQL + Edge Functions in Deno), LemonSqueezy billing, Vercel deployment.

**Supabase project ref:** `gxgijxmwipnurubqupbt`

## What's Been Built (All Complete)

### Go-To-Market Chunks 1–6 (done)
- Chunk 1: Dependency audit & security hardening
- Chunk 2: Subscriptions DB schema (subscriptions table with RLS)
- Chunk 3: 14-day trial auto-creation on signup (owner exempt)
- Chunk 4: LemonSqueezy webhook handler for subscription lifecycle
- Chunk 5: Frontend subscription gating (SubscribedRoute, useSubscription hook)
- Chunk 6: Trial banner, upgrade prompt, billing page

### Content Features 1–4 (done, on top of Chunks 1–6)
- Feature 1: Podcast Descriptions (150-250 word episode descriptions)
- Feature 2: Email Newsletter Drafts (400-600 word weekly newsletters)
- Feature 3: Sermon Series Awareness (cross-content continuity, SeriesSelector component)
- Feature 4: Event/Announcement Mode (mode toggle: "From a Sermon" / "Promote an Event", structured event fields)

### Full Content Type List (what the product generates)
1. **Social media posts** — Facebook, Instagram, TikTok, Twitter/X (with per-platform optimisation)
2. **Bible study guides** — comprehensive with scripture references and discussion questions
3. **Daily devotionals** — following the Blended Approach format
4. **Podcast descriptions** — 150-250 word episode descriptions with tags
5. **Email newsletters** — 400-600 word drafts with subject line, preview text, sections
6. **All of the above** support 15+ languages via Google Translate integration

### Other Key Product Features
- Sermon series tracking for cross-content continuity
- Event promotion mode with structured event fields (alternative to sermon input)
- Multi-language output (up to 3 languages simultaneously, 15+ supported)
- Style guide integration (crawls church website to match voice/tone)
- Multiple post variations per platform (1-3)
- Inline editing with Markdown support
- PDF and DOCX export for devotionals and bible studies
- Social handle integration

## The Task: Full Landing Page Redesign

**File to rewrite:** `src/pages/Index.tsx` (currently 656 lines — full replacement needed)

### Why It Needs Redesigning
The current landing page suffers from common AI-generated design patterns: excessive gradient cards, inconsistent icon usage, wall-of-features layout, and generic church-tech aesthetics. It also doesn't mention the 3 newest content types (podcast, newsletter, event mode) or the sermon series feature. It needs a ground-up redesign to stand out and earn trust with church communications teams.

### Design Brief

**Aesthetic:** Clean, warm, editorial — feels like it was designed for churches, not built by a startup. Think Notion meets Christianity Today.

**Audience:** Church communications volunteers and paid staff. Non-technical. Time-poor. Often skeptical of AI.

**Tone:** Warm, professional, trustworthy. Not corporate. Not overly "techy".

**Key sections needed:**
1. **Hero** — headline, subheadline, single strong CTA ("Start your 14-day free trial. No credit card required."), logo
2. **Problem statement** — "Your comms team is spending Sunday afternoons writing posts that could take 5 minutes."
3. **How it works** — 3 steps: upload transcript → choose content types → copy & publish
4. **Content types** — Showcase all 6 content types (social media, bible study, devotional, podcast description, email newsletter, event promotion). Not 6 identical cards — use a more editorial layout
5. **Features** — 3 focused blocks (not 8 cards): multi-language (15+ languages), church voice matching (style guide), all platforms
6. **Pricing** — Two tiers: Single Church **£19/mo**, Multi-site **£49/mo**, both with 14-day free trial, no credit card
7. **FAQ** — 5 questions, clean accordion using shadcn `Accordion` component
8. **Footer** — IN FOCUS OPERATIONS LIMITED, Company No. 16707659, ToS link (`/terms`), support email

### Hard Constraints (Must Preserve)

- Trial is **14 days**, no credit card required
- Pricing: **£19/month** (Single Church), **£49/month** (Multi-site)
- Company footer: **IN FOCUS OPERATIONS LIMITED, Company No. 16707659**
- ToS link: `/terms`
- The product generates **text only** (no images/video) — make this clear in copy
- CTA buttons link to `/signup`
- If user is already logged in, show "Go to Dashboard" instead — use `useAuth` hook: `const { user } = useAuth()` (imported from `@/hooks/useAuth`)
- FAQ accordion values must all be unique (verify with `grep -n 'value="item-' src/pages/Index.tsx`)

### What to Avoid
- Too many icons — let typography do the work
- Gradient card grids — feels AI-generated
- "AI-powered" buzzwords — say what it does, not how it does it
- Generic stock photo feel
- Blue/indigo color schemes (per project CLAUDE.md styling rules)
- Walls of features — 3 focused blocks, not 8

### Stack Constraints
- **Use only:** React + TypeScript, shadcn/ui components, Tailwind CSS, phosphor-react icons
- **Do NOT** introduce new UI libraries
- **Available shadcn components** include: Accordion, Button, Card, Badge, Separator, Tabs, and many more (full set in `src/components/ui/`)
- **Custom fonts already configured** in Tailwind: `font-playfair` (Playfair Display — serif) and `font-inter` (Inter — sans-serif)
- **Existing imports available:** `useAuth` from `@/hooks/useAuth`, `useNavigate` from `react-router-dom`, `Button` from `@/components/ui/button`, etc.

### Workflow

1. **Archive first:** `cp src/pages/Index.tsx src/pages/Index.tsx.bak`
2. **Invoke the `frontend-design:frontend-design` skill** BEFORE writing any code — it provides the design workflow: layout → theme → animation → implementation
3. **Build and verify:** `npx tsc --noEmit && npx vite build`
4. **Check:** FAQ accordion values are unique, responsive at 375px, logged-in state shows "Go to Dashboard"
5. **Delete backup:** `rm src/pages/Index.tsx.bak`
6. **Commit:** `git add src/pages/Index.tsx && git commit -m "feat: full landing page redesign with improved UX and updated pricing"`
7. **Push:** `git push` to trigger Vercel

### Important Notes
- I am a non-specialist "vibe coder" — flag anything I need to do manually
- The detailed Go-To-Market plan is at `docs/superpowers/plans/2026-03-16-go-to-market-launch.md` (Chunk 7 section) if you need more context
- After this, Chunk 8 (Pre-Launch Checklist) is the final step — it's mostly manual tasks (secrets, env vars, smoke testing, soft launch)
