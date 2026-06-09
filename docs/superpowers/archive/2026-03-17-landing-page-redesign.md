# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing landing page (`src/pages/Index.tsx`) with a warm, earthy, editorial design that showcases all 6 content types, the Tapestry Map language feature, pricing, and FAQ.

**Architecture:** Single-file page component (`Index.tsx`) with CSS variable updates in `src/index.css`. No new components — everything lives in Index.tsx to match the existing pattern. Uses a custom `useScrollReveal` hook (inline in the file) for IntersectionObserver animations.

**Tech Stack:** React 18 + TypeScript, shadcn/ui (Accordion, Button, Card, Badge, Tabs, Sheet), Tailwind CSS, phosphor-react icons (sparingly), existing `useAuth` hook.

**Spec:** `docs/superpowers/specs/2026-03-17-landing-page-redesign-design.md`

---

### Task 1: Archive and Update CSS Variables

**Files:**
- Modify: `src/index.css:10-57` (`:root` CSS variables)
- Backup: `src/pages/Index.tsx` → `src/pages/Index.tsx.bak`

- [ ] **Step 1: Create backup of current landing page**

```bash
cp src/pages/Index.tsx src/pages/Index.tsx.bak
```

- [ ] **Step 2: Update `:root` CSS variables in `src/index.css`**

Replace lines 10-57 (the `:root` block) with the new earthy palette. Keep the `.dark` block and everything after unchanged.

```css
:root {
    /* Ivangel Earthy Editorial Palette */
    --background: 38 28% 94%; /* Sand #f5f2eb */
    --foreground: 30 10% 20%; /* Earth #3a352f */

    --card: 0 0% 100%; /* White */
    --card-foreground: 30 10% 20%;

    --popover: 0 0% 100%;
    --popover-foreground: 30 10% 20%;

    --primary: 10 56% 54%; /* Terracotta #cb5d47 */
    --primary-foreground: 0 0% 100%;

    --secondary: 100 13% 54%; /* Sage #8b997b */
    --secondary-foreground: 0 0% 100%;

    --muted: 38 20% 90%;
    --muted-foreground: 24 14% 42%; /* Clay #7c6a5d */

    --accent: 36 62% 57%; /* Ochre #d69f4c */
    --accent-foreground: 0 0% 100%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;

    --border: 38 15% 85%;
    --input: 38 15% 85%;
    --ring: 10 56% 54%;

    --radius: 0.75rem;

    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

Expected: Build succeeds. The existing page still renders (with new colours).

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/pages/Index.tsx.bak
git commit -m "chore: update CSS palette to earthy editorial theme and backup old landing page"
```

---

### Task 2: Scaffold New Index.tsx — Navigation + Hero

**Files:**
- Rewrite: `src/pages/Index.tsx`

Replace the entire file with the new page scaffold. This task creates the nav bar and hero section.

- [ ] **Step 1: Write new Index.tsx with imports, nav, and hero**

The file must import:
- `{ Link } from "react-router-dom"`
- `{ Button } from "@/components/ui/button"`
- `{ useAuth } from "@/hooks/useAuth"`
- `{ Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"` (for mobile nav)
- `{ List } from "phosphor-react"` (hamburger icon)
- `{ useState } from "react"`

Structure:
```tsx
const Index = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-inter">
      {/* Abstract background shapes */}
      {/* Nav */}
      {/* Hero */}
    </div>
  );
};
export default Index;
```

**Nav details:**
- Sticky, `z-50`, with `bg-background/80 backdrop-blur-sm` on scroll
- Left: terracotta dot (`w-5 h-5 rounded-full bg-primary`) + "Ivangel" in `font-playfair font-bold text-xl`
- Desktop center: 4 anchor links (How It Works `#how-it-works`, Features `#features`, Pricing `#pricing`, FAQ `#faq`) — `text-muted-foreground hover:text-primary transition-colors`
- Right: `<Button>` — logged out: "Start Free Trial" → `/signup`, logged in: "Go to Dashboard" → `/dashboard`
- Mobile: `<Sheet>` with `<List size={24} />` trigger, links inside sheet

**Hero details:**
- Badge: `<span>` with `bg-secondary/20 text-secondary` — "For Church Communications Teams"
- Headline: `font-playfair text-5xl md:text-6xl lg:text-7xl font-bold` — "Your sermon satisfies Sunday. What about the other six days?" (no highlighted word — clean earth-toned text throughout)
- Subheadline: `text-xl text-muted-foreground` — mentions text content, 15+ languages
- CTA: `<Button asChild>` with `<Link to={user ? "/dashboard" : "/signup"}>` — "Start your 14-day free trial" or "Go to Dashboard"
- Right side (hidden on mobile): two overlapping cards with `rotate-3` and `-rotate-6`, tactile shadows:
  - White card: "Daily Devotional" title + placeholder text lines (grey `bg-muted` bars)
  - Sage card (`bg-secondary text-secondary-foreground`): "Guía de Estudio" title + placeholder text lines

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: scaffold new landing page with nav and hero section"
```

---

### Task 3: Problem Statement + How It Works

**Files:**
- Modify: `src/pages/Index.tsx` (add sections after hero)

- [ ] **Step 1: Add problem statement section**

After the hero `</header>`, add a new section on sand background. Typography-only — no cards, no icons.

- Headline: `font-playfair text-3xl md:text-4xl font-bold` — "Sunday's message deserves more than a Monday morning scramble."
- Body: 2 short paragraphs in `text-lg text-muted-foreground`, max-w-3xl centered
- Generous vertical padding: `py-20 md:py-28`

- [ ] **Step 2: Add how-it-works section**

White background section with `id="how-it-works"`.

- Headline: "Three steps. Five minutes."
- 3 items in a `grid md:grid-cols-3 gap-12` layout
- Each item: large Playfair numeral in `text-5xl font-playfair font-bold text-primary`, title in `text-xl font-bold`, description in `text-muted-foreground`
- Step 1: "Paste your transcript" — "Upload, paste, or type your sermon. That's it."
- Step 2: "Choose your content" — "Social posts, study guides, devotionals, newsletters, podcast descriptions — pick what you need."
- Step 3: "Edit and publish" — "Review, tweak if you like, then copy or export. Done in minutes."

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: add problem statement and how-it-works sections"
```

---

### Task 4: Content Types Tabbed Showcase

**Files:**
- Modify: `src/pages/Index.tsx` (add section + import Tabs)

- [ ] **Step 1: Add Tabs import and content types section**

Add import: `{ Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"`

Sand background section. Headline: "One sermon. Six ways to reach your community."

Use shadcn `<Tabs defaultValue="social">` with 6 triggers and 6 content panels.

Each `<TabsTrigger>` value must be unique: `social`, `study`, `devotional`, `podcast`, `newsletter`, `event`.

Each `<TabsContent>` contains:
- Content type name (`text-2xl font-playfair font-bold`)
- 2-line description (`text-muted-foreground`)
- A mock output card with tactile shadow and slight rotation, showing representative placeholder content

**Tab content (descriptions):**
1. **Social Media Posts** (`social`) — "Platform-optimised posts for Facebook, Instagram, TikTok, and X. Multiple variations, hashtags included."
2. **Bible Study Guides** (`study`) — "Discussion questions, scripture references, and application points. Ready for your small group leaders."
3. **Daily Devotionals** (`devotional`) — "A week of devotionals from one sermon. Blended format with scripture and reflection."
4. **Podcast Descriptions** (`podcast`) — "Episode summaries with timestamps, tags, and SEO-friendly descriptions. 150-250 words."
5. **Email Newsletters** (`newsletter`) — "Subject line, preview text, and full draft. 400-600 words, structured sections."
6. **Event Promotions** (`event`) — "Not from a sermon — structured event fields for announcements, outreach, and special services."

**TabsList styling:** Use `flex flex-wrap` for mobile responsiveness. `bg-background border` for the list. Triggers get `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground` styling.

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: add tabbed content types showcase"
```

---

### Task 5: The Tapestry Map — Language Feature

**Files:**
- Modify: `src/pages/Index.tsx` (add section + state)

- [ ] **Step 1: Add Tapestry Map section**

This is the signature interactive element. White background.

**Section header (centered, above the map):**
- Headline: `font-playfair text-4xl md:text-5xl font-bold` — "Speak to their heart."
- Subheadline: `text-xl text-muted-foreground max-w-2xl mx-auto` — "Hover over a language to see how your pastoral voice translates across cultures. 15+ languages supported."
- `mb-16` spacing before the map

**Data:** Define a `languageNodes` array at the top of the component (or outside it):
```tsx
const languageNodes = [
  { id: 'en', name: 'English', color: 'hsl(100 13% 54%)', text: "Don't just broadcast. Converse. Bring your community closer, no matter what language they speak at home.", pos: { top: '40%', left: '50%' } },
  { id: 'es', name: 'Español', color: 'hsl(10 56% 54%)', text: "No solo transmitas. Conversa. Acerca a tu comunidad, sin importar el idioma que hablen en casa.", pos: { top: '15%', left: '25%' } },
  { id: 'kr', name: '한국어', color: 'hsl(36 62% 57%)', text: "단순히 방송하지 마십시오. 대화하십시오. 집에서 어떤 언어를 사용하든 커뮤니티를 더 가깝게 만드십시오.", pos: { top: '65%', left: '80%' } },
  { id: 'ar', name: 'العربية', color: 'hsl(24 14% 42%)', text: "لا تكتفِ بالبث. تواصل. قرّب مجتمعك، بغض النظر عن اللغة التي يتحدثون بها في المنزل.", pos: { top: '20%', left: '70%' } },
  { id: 'cy', name: 'Cymraeg', color: 'hsl(10 56% 54%)', text: "Peidiwch â darlledu yn unig. Sgwrsiwch. Dewch â'ch cymuned yn nes, ni waeth pa iaith y maent yn ei siarad gartref.", pos: { top: '70%', left: '20%' } },
];
```

**State:** `const [activeLang, setActiveLang] = useState(languageNodes[0]);`

**Layout:**
- `max-w-4xl` container, `h-[500px] relative bg-background rounded-3xl` with tactile shadow
- Central card: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, white bg, shows `activeLang.name` and `activeLang.text` (with RTL for Arabic: `dir={activeLang.id === 'ar' ? 'rtl' : 'ltr'}`)
- Floating nodes: `<button>` elements with absolute positioning from `lang.pos`, `rounded-full`, coloured backgrounds, `onMouseEnter` and `onClick` set `activeLang`
- Active node gets `ring-4 ring-white ring-offset-2 scale-110`

**CSS keyframes:** Add to a `<style>` tag or use Tailwind `animate-` classes. Float animation:
```css
@keyframes float {
  0% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
  50% { transform: translate(-50%, -50%) translateY(-15px) rotate(2deg); }
  100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
}
```

Use inline style on each node for `animationDelay` and `animationDuration` variation.

**Note below map:** `<p className="text-muted-foreground text-center mt-6">` — "Also available in: French, Portuguese, German, Mandarin, Hindi, Tagalog, and more."

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: add interactive Tapestry Map language feature"
```

---

### Task 6: Features — 3 Focused Blocks

**Files:**
- Modify: `src/pages/Index.tsx` (add section)

- [ ] **Step 1: Add features section**

Sand background, `id="features"`. Alternating layout using `grid md:grid-cols-2 gap-12 lg:gap-20 items-center`.

3 feature blocks, alternating text/visual sides:

**Block 1: "Your voice, not ours"**
- Text side: headline + paragraph about style guide crawl
- Visual side: mock card (`bg-primary text-white rounded-2xl p-8`) with inner white card showing "Voice Match: 94%" with a church name placeholder

**Block 2: "Series-aware content"** (reversed order on desktop using `md:order-*`)
- Text side: headline + paragraph about sermon series continuity
- Visual side: mock card (`bg-secondary text-white rounded-2xl p-8`) with two small connected cards inside

**Block 3: "Every platform, ready to go"**
- Text side: headline + paragraph about platform optimisation + export
- Visual side: mock card with format/platform badges (styled `<span>` elements with `bg-card rounded-lg px-3 py-2`)

All visuals use tactile shadows and slight rotations (rotate-2 or -rotate-2).

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: add three focused feature blocks"
```

---

### Task 7: Pricing Section

**Files:**
- Modify: `src/pages/Index.tsx` (add section + import Card)

- [ ] **Step 1: Add pricing section**

Add imports:
- `{ Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"`
- `{ CheckCircle } from "phosphor-react"` (add to existing phosphor-react import)

White background, `id="pricing"`. Headline: "Simple, honest pricing."

Two side-by-side cards using `grid md:grid-cols-2 gap-8 max-w-3xl mx-auto`:

**Single Church — £19/month:**
- `<Card>` with tactile shadow
- Price: `text-4xl font-playfair font-bold` with `/month` in `text-lg text-muted-foreground`
- Features list (6 items, each with a `CheckCircle` from phosphor-react in `text-secondary`):
  - All 6 content types
  - 15+ languages
  - Style guide matching
  - Sermon series tracking
  - PDF & DOCX export
- CTA: `<Button asChild className="w-full">` → `<Link to="/signup">Start 14-day free trial</Link>`

**Multi-site — £49/month:**
- Same card style, with `border-primary` for emphasis
- Optional badge: `<Badge>` — "Most Popular" (if desired, or skip for honesty)
- Features: "Everything in Single Church, plus:"
  - Multiple church profiles
- CTA: same pattern

**Note below cards:** `text-sm text-muted-foreground text-center` — "14-day free trial. No credit card required."

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: add two-tier pricing section"
```

---

### Task 8: FAQ Accordion + Warm CTA + Footer

**Files:**
- Modify: `src/pages/Index.tsx` (add sections + import Accordion)

- [ ] **Step 1: Add FAQ section**

Add import: `{ Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"`

Sand background, `id="faq"`. Headline: "Frequently Asked Questions."

`<Accordion type="single" collapsible>` with 5 items. **Values MUST be unique:** `item-1` through `item-5`.

1. `item-1`: "What kind of content does Ivangel create?" — text-only answer listing all 6 types
2. `item-2`: "How does the free trial work?" — 14 days, full access, no credit card
3. `item-3`: "Can it match our church's voice and style?" — yes, style guide crawl
4. `item-4`: "What languages are supported?" — 15+ with examples
5. `item-5`: "Do I need technical skills to use this?" — no, paste and copy

- [ ] **Step 2: Add warm CTA section**

Terracotta background using `bg-primary`. White/sand text.

- Headline: `font-playfair text-4xl md:text-5xl text-primary-foreground` — "Ready to give your team their week back?"
- Subheadline: `text-primary-foreground/80` — "Join the beta. Keep your voice. Save your team hours. Welcome everyone in their language."
- CTA: `<Button asChild variant="secondary">` with light bg → `<Link to="/signup">` — "Start your 14-day free trial" (not auth-aware here — the nav CTA handles logged-in state)

- [ ] **Step 3: Add footer**

Sand background, `border-t border-border/50`.

`flex flex-col md:flex-row justify-between items-center` layout:
- Left: terracotta dot + "Ivangel" (matches nav)
- Center: Links — `<Link to="/terms">Terms of Service</Link>`, Privacy (href="#"), Support (href="mailto:support@ivangel.co" or placeholder)
- Right: "IN FOCUS OPERATIONS LIMITED, Company No. 16707659"
- Bottom center: "Built with care for the modern church."

- [ ] **Step 4: Verify build and FAQ uniqueness**

```bash
npx tsc --noEmit && npx vite build
grep -n 'value="item-' src/pages/Index.tsx
```

Expected: 5 unique values (`item-1` through `item-5`), build passes.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: add FAQ, warm CTA, and footer sections"
```

---

### Task 9: Scroll Reveal Animations

**Files:**
- Modify: `src/pages/Index.tsx` (add animation hook + apply to sections)

- [ ] **Step 1: Add useScrollReveal hook and apply to sections**

Add a simple inline hook at the top of the file (before the component):

```tsx
import { useEffect, useRef } from "react";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}
```

Wrap each major section's container in a div that:
- Uses `ref={useScrollReveal()}`
- Has initial classes: `opacity-0 translate-y-8 transition-all duration-700 ease-out`

Apply to: problem statement, how-it-works, content types, tapestry map, features, pricing, FAQ, warm CTA.

**Do NOT animate with scroll reveal:** hero (uses mount animation instead), footer.

**Nav:** Apply a simple mount fade-in (200ms) using the same `mounted` state as the hero — `transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`.

**Hero stagger animation:** Add mount-triggered state:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
```

Apply to hero children with staggered delays:
- Badge: `transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`
- Headline: same with `delay-100`
- Subheadline: `delay-200`
- CTA: `delay-300`
- Cards: `delay-500`

- [ ] **Step 2: Add float keyframe for Tapestry Map**

Add a `<style>` tag inside the component return (before the main div), or use Tailwind's `@keyframes` in index.css. Preferred: inline `<style>` tag to keep it self-contained:

```tsx
<style>{`
  @keyframes float {
    0% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
    50% { transform: translate(-50%, -50%) translateY(-15px) rotate(2deg); }
    100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
  }
  .floating-node { animation: float 6s ease-in-out infinite; }
  .floating-node:nth-child(2) { animation-delay: -2s; animation-duration: 7s; }
  .floating-node:nth-child(3) { animation-delay: -4s; animation-duration: 5s; }
  .floating-node:nth-child(4) { animation-delay: -1s; animation-duration: 8s; }
  .floating-node:nth-child(5) { animation-delay: -3s; animation-duration: 6.5s; }
`}</style>
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: add scroll reveal animations and hero stagger"
```

---

### Task 10: Final Verification and Cleanup

**Files:**
- Delete: `src/pages/Index.tsx.bak`

- [ ] **Step 1: Full build verification**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 2: Verify all hard constraints**

```bash
# FAQ accordion values are unique
grep -n 'value="item-' src/pages/Index.tsx

# Auth-aware CTA exists
grep -n 'useAuth\|Go to Dashboard\|/dashboard' src/pages/Index.tsx

# Pricing correct
grep -n '£19\|£49\|14-day' src/pages/Index.tsx

# Company footer
grep -n 'IN FOCUS OPERATIONS\|16707659' src/pages/Index.tsx

# ToS link
grep -n '/terms' src/pages/Index.tsx

# No blue/indigo colors
grep -n 'blue-\|indigo-' src/pages/Index.tsx
```

Expected: All checks pass, no blue/indigo colors, 5 unique FAQ values.

- [ ] **Step 3: Delete backup**

```bash
rm src/pages/Index.tsx.bak
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete landing page redesign with earthy editorial theme"
```

- [ ] **Step 5: Push to trigger Vercel deployment**

```bash
git push
```

**FLAG FOR BOB:** After push, manually check the Vercel preview deployment at your Vercel URL. Verify:
- Responsive layout at 375px (mobile), 768px (tablet), 1280px (desktop)
- Tapestry Map interaction works (hover/click language nodes)
- All anchor links scroll smoothly
- Logged-in state shows "Go to Dashboard" (test by logging in)
- Copy review — you mentioned wanting copy changes, note them here
