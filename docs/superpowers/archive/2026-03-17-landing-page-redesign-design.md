# Landing Page Redesign — Design Spec

**Date:** 2026-03-17
**Status:** Review v2
**File:** `src/pages/Index.tsx`

## Context

Ivangel is a React/TS/Vite SaaS that generates social media content, bible studies, devotionals, newsletters, and podcast descriptions from church sermon transcripts. The current landing page uses generic AI-generated aesthetics (gradient cards, icon walls, blue/indigo tones). This redesign adopts a warm, earthy, editorial direction inspired by a prototype the user created.

**Audience:** Church communications volunteers and paid staff. Non-technical. Time-poor. Often skeptical of AI.

**Aesthetic target:** "Notion meets Christianity Today" — warm editorial, handcrafted feel, designed for churches not by a startup.

## Aesthetic Framework

### Typography

- **Headlines:** `font-playfair` (Playfair Display) — serif, editorial authority
- **Body:** `font-inter` (Inter) — clean readability
- Both already configured in `tailwind.config.ts`

### Color Palette

Applied as CSS custom properties in HSL space-separated format (matching existing `src/index.css` convention), consumed through Tailwind's `hsl(var(--*))` pattern.

| Role | Name | HSL Value | CSS Variable | Usage |
|------|------|-----------|-------------|-------|
| Background | Sand | `38 28% 94%` | `--background` | Page bg, alternating sections |
| Foreground | Earth | `30 10% 20%` | `--foreground` | Headlines, primary text |
| Primary | Terracotta | `10 56% 54%` | `--primary` | CTAs, brand accents |
| Secondary | Sage | `100 13% 54%` | `--secondary` | Badges, supporting accents |
| Muted text | Clay | `24 14% 42%` | `--muted-foreground` | Body text, secondary copy |
| Accent | Ochre | `36 62% 57%` | `--accent` | Warm highlights, pricing |
| Card surface | White | `0 0% 100%` | `--card` | Card backgrounds |

### Visual Texture

- Soft blurred background shapes (large radial divs with `mix-blend-multiply`, `blur-3xl`, low opacity) for warmth
- Tactile card shadows: `box-shadow: 0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)`
- Slight card rotations (2-6deg) for handcrafted feel
- Generous whitespace throughout
- No gradient cards, no icon grids

## Stack Constraints

- React 18 + TypeScript
- shadcn/ui components: Accordion, Button, Card, Badge, Tabs
- Tailwind CSS (existing config)
- phosphor-react icons (used sparingly)
- `useAuth` hook from `@/hooks/useAuth` for auth-aware CTAs
- `useNavigate` / `Link` from react-router-dom
- No new UI libraries

## Page Structure

### 1. Navigation (enhancement beyond chunk-7 scope — added for UX)

- **Left:** Logo — terracotta circle dot + "Ivangel" in Playfair bold
- **Center (desktop):** Links — How It Works, Features, Pricing, FAQ (anchor links)
- **Right:** CTA button — "Start Free Trial" when logged out → `/signup`, "Go to Dashboard" when logged in → `/dashboard` (via `useAuth`)
- **Mobile:** Hamburger menu using shadcn `Sheet` component (slide-out drawer)
- Sticky on scroll with subtle background blur

### 2. Hero

- **Badge:** "For Church Communications Teams" — sage background, small caps
- **Headline (Playfair, ~text-6xl to text-8xl):** "Your sermon satisfies Sunday. What about the other six days?"
- **Subheadline (Inter, clay, text-xl):** "Ivangel transforms your sermon into social posts, study guides, devotionals, newsletters, and more — in 15+ languages. Text content only, ready to copy and publish."
- **CTA:** shadcn Button, terracotta bg — "Start your 14-day free trial" → `/signup`
- **Right side (desktop only):** Two overlapping tactile cards with slight rotations:
  - White card: "Daily Devotional" with placeholder text lines
  - Sage card: "Guia de Estudio" (Spanish) with placeholder text lines
- **Note:** Explicitly mentions "text content" to set expectations (no images/video)

### 3. Problem Statement

- Sand background, full-width, typography-only — no cards, no icons
- **Headline (Playfair):** "Sunday's message deserves more than a Monday morning scramble."
- **Body (Inter, clay):** 2-3 short paragraphs describing the pain: comms volunteers spending hours reformatting, translating, writing posts. By Wednesday the sermon's momentum is gone. What if it was all done before they finished their coffee?
- Let the words land. White space does the work.

### 4. How It Works — 3 Steps

- White background section
- **Headline:** "Three steps. Five minutes."
- Horizontal layout (desktop), vertical (mobile)
- Each step:
  - Large Playfair numeral (terracotta, ~text-5xl)
  - Short title (Inter bold)
  - One line description (Inter, clay)
- **Step 1:** "Paste your transcript" — "Upload, paste, or type your sermon. That's it."
- **Step 2:** "Choose your content" — "Social posts, study guides, devotionals, newsletters, podcast descriptions — pick what you need."
- **Step 3:** "Edit and publish" — "Review, tweak if you like, then copy or export. Done in minutes."

### 5. Content Types — Tabbed Showcase

- Sand background
- **Headline (Playfair):** "One sermon. Six ways to reach your community."
- **Implementation:** shadcn `Tabs` component — six tabs across top, content area below
- Each tab reveals:
  - Content type name and 2-line description
  - Mock output card (tactile shadow, slight rotation) showing representative content
- **Tabs:**
  1. **Social Media Posts** — "Platform-optimised posts for Facebook, Instagram, TikTok, and X. Multiple variations, hashtags included."
  2. **Bible Study Guides** — "Discussion questions, scripture references, and application points. Ready for your small group leaders."
  3. **Daily Devotionals** — "A week of devotionals from one sermon. Blended format with scripture and reflection."
  4. **Podcast Descriptions** — "Episode summaries with timestamps, tags, and SEO-friendly descriptions. 150-250 words."
  5. **Email Newsletters** — "Subject line, preview text, and full draft. 400-600 words, structured sections."
  6. **Event Promotions** — "Not from a sermon — structured event fields for announcements, outreach, and special services."

### 6. The Tapestry Map — Language Feature (replaces chunk-7's "multi-language" feature block — elevated to signature interactive section)

- White background
- **Headline (Playfair):** "Speak to their heart."
- **Subheadline:** "Hover a language to see how your pastoral voice translates across cultures. 15+ languages supported."
- **Implementation:** Interactive area with floating language nodes (circles with language codes)
  - Nodes float gently (CSS keyframe animation, 5-8s cycles, staggered delays)
  - Hover/click a node → central card updates with translated text
  - Central card shows: language name, coloured dot, translated quote in that language
  - RTL support for Arabic (and similar)
- **Languages shown as nodes:** English, Espanol, Korean, Arabic, Welsh (5 representative nodes)
- **Note below map:** "Also available in: French, Portuguese, German, Mandarin, Hindi, Tagalog, and more."
- This is the signature interactive element — the one thing people remember

### 7. Features — 3 Focused Blocks

- Sand background
- Alternating layout: text left / visual right, then swap
- No icons doing heavy lifting — typography and mock cards

**Block 1: "Your voice, not ours"**
- Text: "Ivangel crawls your church website and learns your tone, vocabulary, and style. Every output sounds like you wrote it."
- Visual: Mock card showing "Voice Match: 94%" with church name

**Block 2: "Series-aware content"**
- Text: "Running a sermon series? Ivangel connects this week's message to last week's. Cross-references, callbacks, and continuity across every content type."
- Visual: Two connected sermon cards with a visual thread between them

**Block 3: "Every platform, ready to go"**
- Text: "Optimised for Facebook, Instagram, TikTok, X, email, and podcast directories. Export as PDF, DOCX, or copy to clipboard. Social handles auto-inserted."
- Visual: Row of platform + format badges (Facebook, Instagram, TikTok, X, PDF, DOCX)

### 8. Pricing — Two Tiers

- White background
- **Headline (Playfair):** "Simple, honest pricing."
- Two side-by-side cards (shadcn Card), tactile shadows

**Single Church — £19/month**
- All 6 content types
- 15+ languages
- Style guide matching
- Sermon series tracking
- PDF & DOCX export
- CTA: "Start 14-day free trial" → `/signup`

**Multi-site — £49/month**
- Everything in Single Church
- Multiple church profiles
- CTA: "Start 14-day free trial" → `/signup`

- Note below cards: "14-day free trial. No credit card required."

### 9. FAQ — Accordion

- Sand background
- shadcn `Accordion` component, 5 items with unique values (`item-1` through `item-5`)

1. **"What kind of content does Ivangel create?"** — Text-based content only: social media posts, bible study guides, daily devotionals, podcast descriptions, email newsletters, and event promotions. No images or video.
2. **"How does the free trial work?"** — 14 days, full access to all features, no credit card required. Cancel anytime.
3. **"Can it match our church's voice and style?"** — Yes. Provide your church website URL and Ivangel learns your tone, vocabulary, and theological emphasis.
4. **"What languages are supported?"** — 15+ including Spanish, Korean, Arabic, French, Portuguese, German, Mandarin, Hindi, Tagalog, Welsh, and more.
5. **"Do I need technical skills to use this?"** — No. Paste your sermon transcript, choose what you want, and copy the results. If you can use email, you can use Ivangel.

### 10. Warm CTA Section

- Terracotta background, white/sand text
- **Headline (Playfair, white):** "Ready to give your team their week back?"
- **Subheadline (Inter, sand):** "Join the beta. Keep your voice. Save your team hours. Welcome everyone in their language."
- **CTA:** Button with sand/white bg, earth text — "Start your 14-day free trial" → `/signup`
- No secondary link (no example outputs page exists yet)

### 11. Footer

- Sand background, subtle top border
- **Left:** Ivangel logo (terracotta dot + text — matches nav)
- **Center:** Links — Terms of Service (`/terms`), Privacy, Support
- **Right:** "IN FOCUS OPERATIONS LIMITED, Company No. 16707659"
- **Bottom center:** "Built with care for the modern church."

## Animation Design

### Page Load — Staggered Reveal
- Nav: fade in, 200ms
- Hero elements stagger: badge → headline → subheadline → CTA, each Y+20→0 translate, 400ms, 100ms delay between
- Hero tactile cards: slide in from right with rotation settling, 600ms ease-out
- All via CSS transitions triggered by mount state

### Scroll-Triggered Sections
- Each section: fade in + Y+30→0 as it enters viewport
- Implementation: IntersectionObserver hook, CSS transitions
- Cards within sections stagger with 100ms delays
- One consistent pattern throughout — no per-section novelty

### The Tapestry Map (Signature Moment)
- Floating nodes: `@keyframes float` — Y+-15px with slight rotation, 5-8s cycles, staggered `animation-delay`
- Node hover: scale 1→1.1 with coloured box-shadow bloom, 200ms
- Central card text: crossfade on language change (opacity transition, 300ms)
- RTL direction switch for Arabic

### Interactive Elements
- Buttons: Y0→-2px lift on hover, shadow deepens, 150ms
- Tab switches: content crossfade, 200ms opacity
- Accordion: shadcn default smooth height transition
- Nav links: colour → terracotta on hover, 200ms

### What We're NOT Doing
- No parallax
- No typewriter effects
- No particle/canvas animations
- No scroll-jacking
- No page transition animations

## Hard Constraints Checklist

- [ ] Trial: 14 days, no credit card
- [ ] Pricing: £19/mo Single Church, £49/mo Multi-site
- [ ] Footer: IN FOCUS OPERATIONS LIMITED, Company No. 16707659
- [ ] ToS link: `/terms`
- [ ] Text-only product — made clear in hero copy and FAQ
- [ ] CTA → `/signup`
- [ ] Auth-aware: logged in → "Go to Dashboard" → `/dashboard` via `useAuth`
- [ ] FAQ accordion values unique (`item-1` through `item-5`)
- [ ] No blue/indigo colours
- [ ] No new UI libraries — shadcn/ui, Tailwind, phosphor-react only
- [ ] Responsive at 375px
- [ ] Uses existing `font-playfair` and `font-inter` from Tailwind config

## Files Modified

- `src/pages/Index.tsx` — full replacement
- `src/index.css` — updated CSS custom properties for new colour palette
