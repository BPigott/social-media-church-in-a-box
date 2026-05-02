# Stream 3: Onboarding Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing cold-start onboarding with a voice-first five-step flow that requires a minimum of 5 sermon transcripts before proceeding — capturing the church's voice before any content is generated.

**Architecture:** The existing `/onboarding` route and routing logic in `App.tsx` are retained. The `Onboarding.tsx` page is rebuilt to implement the five-step flow. Existing onboarding components (`ChurchInfoForm`, `WebsiteScraping`, `SermonUpload`, `StyleGuideGeneration`, `StyleGuideReview`) are enhanced rather than replaced where possible. A new `FirstGeneration` component handles the guided first generation in Step 5.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, shadcn/ui, Tailwind CSS, Supabase Edge Functions

**Branch:** `feature/onboarding`

**Spec:** `docs/superpowers/specs/2026-04-04-launch-readiness-design.md` → Stream 3

**Depends on:** `feature/backend-reliability` (Stream 1) merged first — requires the `generations` table and the working `scrape-church-website` function.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/pages/Onboarding.tsx` | Rebuilt: five-step orchestrator |
| Modify | `src/components/onboarding/ChurchInfoForm.tsx` | Existing: add denomination field |
| Modify | `src/components/onboarding/WebsiteScraping.tsx` | Existing: improve error UX + manual fallback |
| Modify | `src/components/onboarding/SermonUpload.tsx` | Existing: enforce 5-sermon minimum hard gate |
| Keep | `src/components/onboarding/StyleGuideGeneration.tsx` | Existing: no changes needed |
| Modify | `src/components/onboarding/StyleGuideReview.tsx` | Existing: add editorial styling |
| Create | `src/components/onboarding/FirstGeneration.tsx` | New: guided first generation |
| Create | `src/components/onboarding/OnboardingProgress.tsx` | New: step indicator |
| Create | `src/components/onboarding/__tests__/SermonUpload.test.tsx` | Hard gate tests |
| Create | `src/components/onboarding/__tests__/OnboardingProgress.test.tsx` | Step indicator tests |

---

## Task 1: Create branch and read existing onboarding code

- [ ] **Step 1: Create feature branch (from main after Stream 1 is merged)**

```bash
cd /Users/bobpigott/Documents/ivangel
git checkout main
git pull origin main  # ensure Stream 1 is merged first
git checkout -b feature/onboarding
```

- [ ] **Step 2: Read existing onboarding components**

```bash
cat src/pages/Onboarding.tsx
cat src/components/onboarding/SermonUpload.tsx
cat src/components/onboarding/WebsiteScraping.tsx
cat src/components/onboarding/ChurchInfoForm.tsx
```

Make note of:
- How many sermons can currently be added (the current limit)
- How the website scraping success/failure is currently handled
- What data `ChurchInfoForm` collects and how it's submitted

- [ ] **Step 3: Commit nothing — this is a read-only task**

---

## Task 2: Create OnboardingProgress step indicator (test-first)

**Files:**
- Create: `src/components/onboarding/__tests__/OnboardingProgress.test.tsx`
- Create: `src/components/onboarding/OnboardingProgress.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/onboarding/__tests__/OnboardingProgress.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OnboardingProgress } from '../OnboardingProgress';

const STEPS = ['Your Church', 'Website', 'Sermons', 'Your Voice', 'First Look'];

describe('OnboardingProgress', () => {
  it('renders all step labels', () => {
    render(<OnboardingProgress currentStep={1} totalSteps={5} steps={STEPS} />);
    STEPS.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('marks completed steps correctly', () => {
    render(<OnboardingProgress currentStep={3} totalSteps={5} steps={STEPS} />);
    // Steps 1 and 2 should be marked completed (before current)
    const completedSteps = screen.getAllByTestId('step-completed');
    expect(completedSteps).toHaveLength(2);
  });

  it('marks current step as active', () => {
    render(<OnboardingProgress currentStep={2} totalSteps={5} steps={STEPS} />);
    expect(screen.getByTestId('step-active')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm run test:run
```

- [ ] **Step 3: Implement OnboardingProgress**

```typescript
// src/components/onboarding/OnboardingProgress.tsx
import { Check } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
  steps: string[];
}

export function OnboardingProgress({ currentStep, totalSteps, steps }: OnboardingProgressProps) {
  return (
    <nav aria-label="Onboarding progress" className="w-full">
      <ol className="flex items-center justify-between gap-1">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const isPending = stepNum > currentStep;

          return (
            <li key={label} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                data-testid={isCompleted ? 'step-completed' : isActive ? 'step-active' : 'step-pending'}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary/15 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <div className="absolute" /> // connector handled by CSS flex gap
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run
```

Expected: all OnboardingProgress tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/OnboardingProgress.tsx \
        src/components/onboarding/__tests__/OnboardingProgress.test.tsx
git commit -m "feat: add OnboardingProgress step indicator"
```

---

## Task 3: Enforce 5-sermon minimum hard gate in SermonUpload (test-first)

**Files:**
- Create: `src/components/onboarding/__tests__/SermonUpload.test.tsx`
- Modify: `src/components/onboarding/SermonUpload.tsx`

This is the most critical behavioural change. The "Next" button must be disabled until 5 sermons are added.

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/onboarding/__tests__/SermonUpload.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SermonUpload } from '../SermonUpload';

describe('SermonUpload — 5-sermon hard gate', () => {
  it('Next button is disabled with 0 sermons', () => {
    render(<SermonUpload sermons={[]} onSermonsChange={vi.fn()} onNext={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /next/i });
    expect(btn).toBeDisabled();
  });

  it('Next button is disabled with 4 sermons', () => {
    const sermons = Array.from({ length: 4 }, (_, i) => `Sermon ${i + 1} text `.repeat(30));
    render(<SermonUpload sermons={sermons} onSermonsChange={vi.fn()} onNext={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /next/i });
    expect(btn).toBeDisabled();
  });

  it('Next button is enabled with exactly 5 sermons', () => {
    const sermons = Array.from({ length: 5 }, (_, i) => `Sermon ${i + 1} text `.repeat(30));
    render(<SermonUpload sermons={sermons} onSermonsChange={vi.fn()} onNext={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /next/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows progress count "X of 5 sermons added"', () => {
    const sermons = Array.from({ length: 3 }, (_, i) => `Sermon text `.repeat(30));
    render(<SermonUpload sermons={sermons} onSermonsChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText(/3 of 5/)).toBeInTheDocument();
  });

  it('calls onNext when button is clicked with 5+ sermons', async () => {
    const onNext = vi.fn();
    const sermons = Array.from({ length: 5 }, (_, i) => `Sermon text `.repeat(30));
    render(<SermonUpload sermons={sermons} onSermonsChange={vi.fn()} onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onNext).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm run test:run
```

- [ ] **Step 3: Read current SermonUpload.tsx to understand existing structure**

```bash
cat src/components/onboarding/SermonUpload.tsx
```

- [ ] **Step 4: Modify SermonUpload to accept props and enforce the hard gate**

The component needs to accept `sermons: string[]`, `onSermonsChange: (sermons: string[]) => void`, and `onNext: () => void` as props (state lifts up to `Onboarding.tsx`).

Key changes to make:
1. Add `onNext` prop
2. Add disabled logic: `disabled={sermons.length < 5}`
3. Add progress label: `{sermons.length} of 5 sermons added`
4. Change copy to lead with sermons as primary, other content as secondary

The component should render a list of textarea slots — starting with 5 empty slots, with an "Add another sermon" button to add more. Each slot shows a textarea. The "Next" button is disabled until all 5 minimum slots have content.

```typescript
// Key interface changes to SermonUpload.tsx:
interface SermonUploadProps {
  sermons: string[];
  onSermonsChange: (sermons: string[]) => void;
  onNext: () => void;
}

const MIN_SERMONS = 5;

// Within the component:
const canProceed = sermons.filter(s => s.trim().length > 100).length >= MIN_SERMONS;
```

The "Next" button:
```typescript
<Button onClick={onNext} disabled={!canProceed} size="lg" className="w-full">
  {canProceed
    ? 'Build My Voice Profile →'
    : `Add ${MIN_SERMONS - sermons.filter(s => s.trim().length > 100).length} more sermon${
        MIN_SERMONS - sermons.filter(s => s.trim().length > 100).length !== 1 ? 's' : ''
      } to continue`}
</Button>
```

Progress indicator above the button:
```typescript
<p className="text-sm text-muted-foreground text-center">
  {sermons.filter(s => s.trim().length > 100).length} of {MIN_SERMONS} sermons added
  {!canProceed && ' — add more to continue'}
</p>
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run
```

Expected: all SermonUpload tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/SermonUpload.tsx \
        src/components/onboarding/__tests__/SermonUpload.test.tsx
git commit -m "feat: enforce 5-sermon minimum hard gate in SermonUpload"
```

---

## Task 4: Improve WebsiteScraping with reliable fallback

**Files:**
- Modify: `src/components/onboarding/WebsiteScraping.tsx`

- [ ] **Step 1: Read current WebsiteScraping.tsx**

```bash
cat src/components/onboarding/WebsiteScraping.tsx
```

- [ ] **Step 2: Ensure scrape failure shows manual paste fallback — not an error screen**

The component must handle three states:
1. **Loading** — "Importing your website content…" with a spinner
2. **Success** — show what was found, offer to continue
3. **Failure** — show manual paste textarea, DO NOT block progress

In the failure state, replace whatever currently shows with:

```typescript
// Failure state UI
<div className="space-y-4">
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
    <p className="font-medium mb-1">We couldn't read your website automatically.</p>
    <p>Paste some text from your church website below instead — your About page, values, or a recent blog post works well.</p>
  </div>
  <Textarea
    value={manualContent}
    onChange={e => setManualContent(e.target.value)}
    placeholder="Paste website content here…"
    className="min-h-[160px] font-serif text-[15px] leading-relaxed"
  />
  <Button
    onClick={() => onComplete(manualContent)}
    disabled={manualContent.trim().length < 50}
    size="lg"
    className="w-full"
  >
    Use This Content →
  </Button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/WebsiteScraping.tsx
git commit -m "feat: add manual content fallback when website scraping fails"
```

---

## Task 5: Create FirstGeneration component

**Files:**
- Create: `src/components/onboarding/FirstGeneration.tsx`

This is Step 5 of onboarding — a guided first generation using the content already uploaded in the flow. It reuses the `generate-social-posts` function and shows results using `ResultsPanel` from Stream 2.

- [ ] **Step 1: Implement FirstGeneration**

```typescript
// src/components/onboarding/FirstGeneration.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProgressIndicator } from '@/components/dashboard/ProgressIndicator';
import { ResultsPanel } from '@/components/dashboard/ResultsPanel';
import { Button } from '@/components/ui/button';

interface FirstGenerationProps {
  churchId: string;
  sermons: string[]; // from Step 3
  styleGuide: string; // from Step 4
  onComplete: () => void;
}

export function FirstGeneration({ churchId, sermons, styleGuide, onComplete }: FirstGenerationProps) {
  const [state, setState] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  // Auto-start generation when component mounts
  useEffect(() => {
    generateFirstContent();
  }, []);

  const generateFirstContent = async () => {
    setState('generating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-social-posts', {
        body: {
          idempotency_key: crypto.randomUUID(),
          transcript: sermons[0], // Use the first sermon as the source
          contentTypes: ['social_media'],
          platforms: ['facebook', 'instagram'],
          churchId,
          generationMode: 'sermon',
          outputLanguages: ['en'],
          primaryLanguage: 'en',
          styleGuide,
        },
      });

      if (error) throw error;

      setResult(data);
      setState('done');
    } catch (err) {
      console.error('First generation error:', err);
      setState('error');
    }
  };

  if (state === 'generating') {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="font-playfair text-2xl font-bold text-foreground">
            Let's see your voice in action
          </h2>
          <p className="text-muted-foreground text-sm">
            We're generating your first posts using your sermon and voice profile…
          </p>
        </div>
        <ProgressIndicator isGenerating={true} hasTranslation={false} />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-muted-foreground">
          Something went wrong with the first generation. You can try again from your dashboard.
        </p>
        <Button onClick={onComplete} size="lg">
          Go to Dashboard →
        </Button>
      </div>
    );
  }

  if (state === 'done' && result) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-playfair text-2xl font-bold text-foreground">
            This is your church's voice.
          </h2>
          <p className="text-muted-foreground text-sm">
            Generated from your sermon, in your style. Every future generation will sound just like this.
          </p>
        </div>

        <ResultsPanel result={result as Parameters<typeof ResultsPanel>[0]['result']} />

        <Button onClick={onComplete} size="lg" className="w-full">
          Start Creating →
        </Button>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/FirstGeneration.tsx
git commit -m "feat: add FirstGeneration component for guided onboarding step 5"
```

---

## Task 6: Rebuild Onboarding.tsx orchestrator

**Files:**
- Modify: `src/pages/Onboarding.tsx`

This is the main integration task. The page orchestrates all five steps and manages shared state.

- [ ] **Step 1: Read existing Onboarding.tsx fully before modifying**

```bash
cat src/pages/Onboarding.tsx
```

Note which Supabase calls create the church record and style guide — these must be preserved.

- [ ] **Step 2: Replace Onboarding.tsx**

```typescript
// src/pages/Onboarding.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChurch, clearChurchCache } from '@/hooks/useChurch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { ChurchInfoForm } from '@/components/onboarding/ChurchInfoForm';
import { WebsiteScraping } from '@/components/onboarding/WebsiteScraping';
import { SermonUpload } from '@/components/onboarding/SermonUpload';
import { StyleGuideGeneration } from '@/components/onboarding/StyleGuideGeneration';
import { StyleGuideReview } from '@/components/onboarding/StyleGuideReview';
import { FirstGeneration } from '@/components/onboarding/FirstGeneration';
import type { Church } from '@/types/database';

const STEPS = ['Your Church', 'Website', 'Sermons', 'Your Voice', 'First Look'];
const TOTAL_STEPS = 5;

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [churchData, setChurchData] = useState<Partial<Church>>({});
  const [churchId, setChurchId] = useState<string | null>(null);
  const [websiteContent, setWebsiteContent] = useState<string>('');
  const [sermons, setSermons] = useState<string[]>([]);
  const [styleGuide, setStyleGuide] = useState<string>('');

  // Step 1 → 2: save church, proceed to website scraping
  const handleChurchSubmit = async (data: Partial<Church>) => {
    if (!user) return;

    try {
      const { data: church, error } = await supabase
        .from('churches')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setChurchData(data);
      setChurchId(church.id);
      clearChurchCache(user.id);
      setStep(2);
    } catch (err) {
      toast({ title: 'Error saving church details', variant: 'destructive' });
    }
  };

  // Step 2 → 3: website scraping complete (or fallback content)
  const handleWebsiteComplete = (content: string) => {
    setWebsiteContent(content);
    setStep(3);
  };

  // Step 3 → 4: sermons uploaded, trigger style guide generation
  const handleSermonsComplete = () => {
    setStep(4);
  };

  // Step 4 → 5: style guide approved, proceed to first generation
  const handleStyleGuideComplete = (guide: string) => {
    setStyleGuide(guide);
    setStep(5);
  };

  // Step 5 complete: navigate to dashboard
  const handleOnboardingComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        {/* Logo / brand */}
        <div className="text-center">
          <h1 className="font-playfair text-3xl font-bold text-foreground">ivangel</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generic AI writes generic content. Your voice is what makes this yours.
          </p>
        </div>

        <OnboardingProgress
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          steps={STEPS}
        />

        {step === 1 && (
          <ChurchInfoForm onSubmit={handleChurchSubmit} />
        )}

        {step === 2 && churchData.website_url && (
          <WebsiteScraping
            websiteUrl={churchData.website_url}
            onComplete={handleWebsiteComplete}
          />
        )}

        {step === 2 && !churchData.website_url && (
          // No URL provided — skip directly to sermons
          <div className="text-center space-y-4 py-8">
            <p className="text-muted-foreground">No website URL provided — let's go straight to your sermons.</p>
            <button onClick={() => setStep(3)} className="text-primary underline text-sm">
              Continue to Sermon Upload →
            </button>
          </div>
        )}

        {step === 3 && (
          <SermonUpload
            sermons={sermons}
            onSermonsChange={setSermons}
            onNext={handleSermonsComplete}
          />
        )}

        {step === 4 && churchId && (
          <StyleGuideGeneration
            churchId={churchId}
            sermons={sermons}
            websiteContent={websiteContent}
            onComplete={handleStyleGuideComplete}
          />
        )}

        {step === 5 && churchId && (
          <FirstGeneration
            churchId={churchId}
            sermons={sermons}
            styleGuide={styleGuide}
            onComplete={handleOnboardingComplete}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
```

Note: `StyleGuideGeneration` may need its props updated to accept `sermons` and `websiteContent` directly. Check its current prop signature and update as needed.

- [ ] **Step 3: Verify the app compiles**

```bash
npm run build 2>&1 | tail -30
```

Fix any TypeScript errors before committing.

- [ ] **Step 4: Verify routing still works**

```bash
npm run dev
```

Create a new test account, sign up, confirm the flow redirects to `/onboarding`. Walk through all 5 steps manually.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Onboarding.tsx
git commit -m "feat: rebuild onboarding as five-step voice-first flow"
```

---

## Task 7: Apply editorial design to onboarding

- [ ] **Step 1: Apply design tokens throughout onboarding components**

Check each onboarding component for:
- Headings → `font-playfair font-bold`
- Cards → `shadow-tactile border-border/40 rounded-2xl`
- Primary copy: warm, encouraging — not corporate ("Your voice is what makes this yours")
- Muted labels: `text-xs font-bold uppercase tracking-widest text-muted-foreground`

```bash
grep -rn "font-playfair" src/components/onboarding/
```

Add `font-playfair` to any major heading missing it.

- [ ] **Step 2: Verify step indicator matches landing page palette**

The active step circle should use `bg-primary` (earthy warm), not default blue.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/
git commit -m "feat: apply editorial design system to onboarding flow"
```

---

## Task 8: End-to-end test and PR

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```

Expected: all tests PASS.

- [ ] **Step 2: Full manual walkthrough as a new user**

1. Sign up with a fresh email
2. Confirm trial created automatically
3. Redirected to `/onboarding` ✓
4. Step 1: Fill in church details including website URL → Next
5. Step 2: Website scraped, summary shown → Next (or fallback paste)
6. Step 3: Add 4 sermons → Next button stays disabled ✓
7. Step 3: Add 5th sermon → Next button enables ✓
8. Step 4: Style guide generated and shown → edit one line → Approve
9. Step 5: First generation runs automatically, results shown ✓
10. "Start Creating →" → lands on `/dashboard` with results visible ✓

- [ ] **Step 3: Confirm the onboarding never shows again on return**

```bash
# After completing onboarding, manually navigate to /onboarding
# Should redirect to /dashboard (hasChurch is now true)
```

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin feature/onboarding
```

PR title: `feat: voice-first onboarding — 5-sermon hard gate, website import, guided first generation`

Body: reference `docs/superpowers/specs/2026-04-04-launch-readiness-design.md` Stream 3.

Note in PR: this depends on `feature/backend-reliability` being merged first (scraper fix + generations table).
