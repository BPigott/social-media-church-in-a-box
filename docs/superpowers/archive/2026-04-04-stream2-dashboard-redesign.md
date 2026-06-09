# Stream 2: Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the landing page's warm editorial aesthetic to the dashboard, add a generation progress bar, decompose the 3,161-line Dashboard.tsx into focused components, and remove newsletter from the UI.

**Architecture:** Purely frontend — no backend changes. `Dashboard.tsx` is decomposed into five focused components. The progress bar is a timed simulation (the edge function returns a single response, not a stream). Design tokens are already defined in `tailwind.config.ts` and `index.css` — this work applies them consistently. The results panel reads the last generation from the Supabase `generations` table on mount (once Stream 1 is merged; a mock is used during development).

**Tech Stack:** React 18, TypeScript, Vite, Vitest, shadcn/ui, Tailwind CSS, Supabase JS client

**Branch:** `feature/dashboard-redesign`

**Spec:** `docs/superpowers/specs/2026-04-04-launch-readiness-design.md` → Stream 2

**Runs in parallel with:** `feature/backend-reliability` — no shared files, no merge dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `vitest.config.ts` | Vitest configuration |
| Create | `src/test/setup.ts` | Testing library setup |
| Create | `src/components/dashboard/ContentTypeSelector.tsx` | Content type + platform picker |
| Create | `src/components/dashboard/GenerationForm.tsx` | Transcript input, language, series, CTA |
| Create | `src/components/dashboard/ProgressIndicator.tsx` | Timed generation progress bar |
| Create | `src/components/dashboard/ResultsPanel.tsx` | Output display with copy buttons |
| Create | `src/components/dashboard/GenerationHistory.tsx` | Load last generation from DB |
| Modify | `src/pages/Dashboard.tsx` | Gutted — imports and orchestrates the new components |
| Create | `src/components/dashboard/__tests__/ProgressIndicator.test.tsx` | Progress bar tests |
| Create | `src/components/dashboard/__tests__/ResultsPanel.test.tsx` | Results panel tests |
| Create | `src/components/dashboard/__tests__/ContentTypeSelector.test.tsx` | Selector tests |

---

## Task 1: Create branch and set up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create feature branch**

```bash
cd /Users/bobpigott/Documents/ivangel
git checkout main
git checkout -b feature/dashboard-redesign
```

- [ ] **Step 2: Install Vitest and testing library**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom
```

- [ ] **Step 3: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Create test setup file**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Verify Vitest works**

```bash
npm test -- --reporter=verbose --run 2>&1 | head -20
```

Expected: "No test files found" — that's correct, no tests yet.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "chore: add Vitest testing infrastructure"
```

---

## Task 2: Create ProgressIndicator component (test-first)

**Files:**
- Create: `src/components/dashboard/__tests__/ProgressIndicator.test.tsx`
- Create: `src/components/dashboard/ProgressIndicator.tsx`

The progress bar advances through stages with timed intervals while `isGenerating` is true. When `isGenerating` goes false, it jumps to 100% briefly then hides.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/dashboard/__tests__/ProgressIndicator.test.tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProgressIndicator } from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render when not generating', () => {
    render(<ProgressIndicator isGenerating={false} hasTranslation={false} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders when generating starts', () => {
    render(<ProgressIndicator isGenerating={true} hasTranslation={false} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Reading your sermon…')).toBeInTheDocument();
  });

  it('advances to crafting stage after 8 seconds', () => {
    render(<ProgressIndicator isGenerating={true} hasTranslation={false} />);
    act(() => { vi.advanceTimersByTime(8000); });
    expect(screen.getByText('Crafting your posts…')).toBeInTheDocument();
  });

  it('shows translation stage when hasTranslation is true', () => {
    render(<ProgressIndicator isGenerating={true} hasTranslation={true} />);
    act(() => { vi.advanceTimersByTime(25000); });
    expect(screen.getByText(/Translating/)).toBeInTheDocument();
  });

  it('skips translation stage when hasTranslation is false', () => {
    render(<ProgressIndicator isGenerating={true} hasTranslation={false} />);
    act(() => { vi.advanceTimersByTime(25000); });
    expect(screen.queryByText(/Translating/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run
```

Expected: FAIL — `ProgressIndicator` does not exist.

- [ ] **Step 3: Implement ProgressIndicator**

```typescript
// src/components/dashboard/ProgressIndicator.tsx
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface Stage {
  label: string;
  targetPct: number;
  durationMs: number;
}

interface ProgressIndicatorProps {
  isGenerating: boolean;
  hasTranslation: boolean;
}

function buildStages(hasTranslation: boolean): Stage[] {
  const stages: Stage[] = [
    { label: 'Reading your sermon…', targetPct: 20, durationMs: 8000 },
    { label: 'Crafting your posts…', targetPct: 60, durationMs: 18000 },
  ];
  if (hasTranslation) {
    stages.push({ label: 'Translating your content…', targetPct: 88, durationMs: 12000 });
  }
  stages.push({ label: 'Finishing up…', targetPct: 99, durationMs: 6000 });
  return stages;
}

export function ProgressIndicator({ isGenerating, hasTranslation }: ProgressIndicatorProps) {
  const [pct, setPct] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const stages = buildStages(hasTranslation);

  useEffect(() => {
    if (!isGenerating) {
      setPct(0);
      setStageIndex(0);
      return;
    }

    let elapsed = 0;
    const tick = 200; // ms
    const totalDuration = stages.reduce((s, st) => s + st.durationMs, 0);

    const interval = setInterval(() => {
      elapsed += tick;

      // Find current stage
      let stageStart = 0;
      for (let i = 0; i < stages.length; i++) {
        const stageEnd = stageStart + stages[i].durationMs;
        if (elapsed <= stageEnd) {
          setStageIndex(i);
          const prevPct = i === 0 ? 0 : stages[i - 1].targetPct;
          const stagePct = (elapsed - stageStart) / stages[i].durationMs;
          setPct(Math.round(prevPct + stagePct * (stages[i].targetPct - prevPct)));
          break;
        }
        stageStart = stageEnd;
      }

      if (elapsed >= totalDuration) {
        setPct(99);
        clearInterval(interval);
      }
    }, tick);

    return () => clearInterval(interval);
  }, [isGenerating, hasTranslation]);

  if (!isGenerating) return null;

  return (
    <div className="w-full space-y-3 py-8" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">{stages[stageIndex]?.label}</span>
        <span className="text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5 bg-muted" />
    </div>
  );
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npm run test:run
```

Expected: all 5 ProgressIndicator tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ProgressIndicator.tsx \
        src/components/dashboard/__tests__/ProgressIndicator.test.tsx
git commit -m "feat: add generation progress indicator with staged timing"
```

---

## Task 3: Create ContentTypeSelector component (test-first)

**Files:**
- Create: `src/components/dashboard/__tests__/ContentTypeSelector.test.tsx`
- Create: `src/components/dashboard/ContentTypeSelector.tsx`

This extracts the content type and platform selection UI from Dashboard.tsx. Newsletter is NOT included.

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/dashboard/__tests__/ContentTypeSelector.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ContentTypeSelector } from '../ContentTypeSelector';

const defaultProps = {
  selectedTypes: [] as string[],
  selectedPlatforms: [] as string[],
  onTypesChange: vi.fn(),
  onPlatformsChange: vi.fn(),
};

describe('ContentTypeSelector', () => {
  it('renders social_media option', () => {
    render(<ContentTypeSelector {...defaultProps} />);
    expect(screen.getByText(/Social Media/i)).toBeInTheDocument();
  });

  it('does NOT render email newsletter option', () => {
    render(<ContentTypeSelector {...defaultProps} />);
    expect(screen.queryByText(/newsletter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
  });

  it('calls onTypesChange when a type is selected', async () => {
    const onTypesChange = vi.fn();
    render(<ContentTypeSelector {...defaultProps} onTypesChange={onTypesChange} />);
    await userEvent.click(screen.getByText(/Social Media/i));
    expect(onTypesChange).toHaveBeenCalled();
  });

  it('shows platform options when social_media is selected', () => {
    render(<ContentTypeSelector {...defaultProps} selectedTypes={['social_media']} />);
    expect(screen.getByText(/Facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/Instagram/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm run test:run
```

- [ ] **Step 3: Implement ContentTypeSelector**

```typescript
// src/components/dashboard/ContentTypeSelector.tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const CONTENT_TYPES = [
  { id: 'social_media', label: 'Social Media Posts' },
  { id: 'devotional', label: 'Daily Devotional' },
  { id: 'bible_study', label: 'Bible Study Guide' },
  { id: 'podcast_description', label: 'Podcast Description' },
  // email_newsletter intentionally excluded
] as const;

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'tiktok', label: 'TikTok' },
] as const;

interface ContentTypeSelectorProps {
  selectedTypes: string[];
  selectedPlatforms: string[];
  onTypesChange: (types: string[]) => void;
  onPlatformsChange: (platforms: string[]) => void;
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

export function ContentTypeSelector({
  selectedTypes,
  selectedPlatforms,
  onTypesChange,
  onPlatformsChange,
}: ContentTypeSelectorProps) {
  const showPlatforms = selectedTypes.includes('social_media');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">What would you like to generate?</p>
        <div className="grid grid-cols-2 gap-2">
          {CONTENT_TYPES.map(type => (
            <label
              key={type.id}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedTypes.includes(type.id)}
                onCheckedChange={() => onTypesChange(toggle(selectedTypes, type.id))}
              />
              <span className="text-sm font-medium">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {showPlatforms && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Which platforms?</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(platform => (
              <label
                key={platform.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm cursor-pointer transition-colors ${
                  selectedPlatforms.includes(platform.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/50 hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => onPlatformsChange(toggle(selectedPlatforms, platform.id))}
                  className="sr-only"
                />
                {platform.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npm run test:run
```

Expected: all ContentTypeSelector tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ContentTypeSelector.tsx \
        src/components/dashboard/__tests__/ContentTypeSelector.test.tsx
git commit -m "feat: add ContentTypeSelector component (newsletter excluded)"
```

---

## Task 4: Create ResultsPanel component (test-first)

**Files:**
- Create: `src/components/dashboard/__tests__/ResultsPanel.test.tsx`
- Create: `src/components/dashboard/ResultsPanel.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/dashboard/__tests__/ResultsPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ResultsPanel } from '../ResultsPanel';

const mockResult = {
  socialPosts: {
    facebook: ['This is a test Facebook post about grace and community.'],
    instagram: [],
  },
  devotional: null,
  bibleStudy: null,
  podcastDescription: 'A short podcast description here.',
};

describe('ResultsPanel', () => {
  it('renders nothing when result is null', () => {
    const { container } = render(<ResultsPanel result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Facebook posts when present', () => {
    render(<ResultsPanel result={mockResult} />);
    expect(screen.getByText(/This is a test Facebook post/)).toBeInTheDocument();
  });

  it('renders podcast description when present', () => {
    render(<ResultsPanel result={mockResult} />);
    expect(screen.getByText(/A short podcast description here/)).toBeInTheDocument();
  });

  it('renders a copy button for each content piece', () => {
    render(<ResultsPanel result={mockResult} />);
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('copy button calls clipboard writeText with the content', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ResultsPanel result={mockResult} />);
    const [firstCopy] = screen.getAllByRole('button', { name: /copy/i });
    await userEvent.click(firstCopy);

    expect(writeText).toHaveBeenCalledWith(
      'This is a test Facebook post about grace and community.'
    );
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm run test:run
```

- [ ] **Step 3: Implement ResultsPanel**

```typescript
// src/components/dashboard/ResultsPanel.tsx
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GenerationResult {
  socialPosts?: Record<string, string[]>;
  devotional?: string | null;
  bibleStudy?: string | null;
  podcastDescription?: string | null;
}

interface ResultsPanelProps {
  result: GenerationResult | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      aria-label="copy"
      className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function ContentCard({ title, content }: { title: string; content: string }) {
  return (
    <Card className="shadow-tactile border-border/40">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
        <CopyButton text={content} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  tiktok: 'TikTok',
};

export function ResultsPanel({ result }: ResultsPanelProps) {
  if (!result) return null;

  const sections: { title: string; content: string }[] = [];

  if (result.socialPosts) {
    for (const [platform, posts] of Object.entries(result.socialPosts)) {
      for (const post of posts) {
        if (post) sections.push({ title: PLATFORM_LABELS[platform] ?? platform, content: post });
      }
    }
  }
  if (result.devotional) sections.push({ title: 'Daily Devotional', content: result.devotional });
  if (result.bibleStudy) sections.push({ title: 'Bible Study Guide', content: result.bibleStudy });
  if (result.podcastDescription) sections.push({ title: 'Podcast Description', content: result.podcastDescription });

  return (
    <div className="space-y-4">
      <h2 className="font-playfair text-2xl font-bold text-foreground">Your Content</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s, i) => (
          <ContentCard key={`${s.title}-${i}`} title={s.title} content={s.content} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run
```

Expected: all ResultsPanel tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ResultsPanel.tsx \
        src/components/dashboard/__tests__/ResultsPanel.test.tsx
git commit -m "feat: add ResultsPanel with one-click copy buttons"
```

---

## Task 5: Create GenerationHistory component

**Files:**
- Create: `src/components/dashboard/GenerationHistory.tsx`

This loads the user's last completed generation from Supabase on mount, providing persistence across tab switches and refreshes. It depends on the `generations` table from Stream 1. During Stream 2 development, it uses a mock return until Stream 1 is merged.

- [ ] **Step 1: Implement GenerationHistory**

```typescript
// src/components/dashboard/GenerationHistory.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GenerationRecord {
  id: string;
  result: Record<string, unknown> | null;
  content_types: string[];
  platforms: string[] | null;
  completed_at: string | null;
}

interface GenerationHistoryProps {
  userId: string | undefined;
  onLatestLoaded: (result: GenerationRecord | null) => void;
}

export function GenerationHistory({ userId, onLatestLoaded }: GenerationHistoryProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    supabase
      .from('generations')
      .select('id, result, content_types, platforms, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading last generation:', error);
          onLatestLoaded(null);
        } else {
          onLatestLoaded(data as GenerationRecord | null);
        }
        setLoading(false);
      });
  }, [userId]);

  // This component has no UI — it's a data-fetching side-effect
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/GenerationHistory.tsx
git commit -m "feat: add GenerationHistory to restore last result on mount"
```

---

## Task 6: Rebuild Dashboard.tsx with new components and design

**Files:**
- Modify: `src/pages/Dashboard.tsx`

This is the main integration task. The 3,161-line file is replaced with a clean orchestrator that imports the new components and applies the landing page design system.

Read the existing `Dashboard.tsx` first to understand all state variables and function signatures before replacing. The goal is to preserve all existing functionality while applying the new structure and visual design.

- [ ] **Step 1: Read the existing Dashboard.tsx to map all state and functions**

```bash
grep -n "useState\|useEffect\|const handle\|const on\|async function" \
  src/pages/Dashboard.tsx | head -60
```

Make note of all state variables — these need to be preserved in the new version.

- [ ] **Step 2: Replace Dashboard.tsx**

The new Dashboard has three visual states: `form` | `generating` | `results`. Replace the file content:

```typescript
// src/pages/Dashboard.tsx
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChurch } from '@/hooks/useChurch';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { TrialBanner } from '@/components/TrialBanner';
import { ContentTypeSelector } from '@/components/dashboard/ContentTypeSelector';
import { ProgressIndicator } from '@/components/dashboard/ProgressIndicator';
import { ResultsPanel } from '@/components/dashboard/ResultsPanel';
import { GenerationHistory } from '@/components/dashboard/GenerationHistory';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type DashboardView = 'form' | 'generating' | 'results';

const Dashboard = () => {
  const { user } = useAuth();
  const { primaryChurch } = useChurch(user?.id);
  const { toast } = useToast();

  // Form state
  const [transcript, setTranscript] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['social_media']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);

  // UI state
  const [view, setView] = useState<DashboardView>('form');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const hasTranslation = false; // TODO: wire up language selector

  // Restore last generation on mount
  const handleLatestLoaded = useCallback((latest: { result: Record<string, unknown> | null } | null) => {
    if (latest?.result) {
      setResult(latest.result);
      setView('results');
    }
  }, []);

  const handleGenerate = async () => {
    if (!transcript.trim() || !primaryChurch?.id) return;

    const idempotencyKey = crypto.randomUUID();
    setView('generating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-social-posts', {
        body: {
          idempotency_key: idempotencyKey,
          transcript,
          contentTypes: selectedTypes,
          platforms: selectedPlatforms,
          churchId: primaryChurch.id,
          generationMode: 'sermon',
          outputLanguages: ['en'],
          primaryLanguage: 'en',
          styleGuide: primaryChurch.style_guide ?? '',
        },
      });

      if (error) throw error;

      setResult(data);
      setView('results');
    } catch (err) {
      console.error('Generation error:', err);
      toast({
        title: 'Generation failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setView('form');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TrialBanner />

      <GenerationHistory userId={user?.id} onLatestLoaded={handleLatestLoaded} />

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <div>
          <h1 className="font-playfair text-4xl font-bold text-foreground">
            {primaryChurch?.name ?? 'Your Church'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Turn your sermon into a full week of content.
          </p>
        </div>

        {/* Form view */}
        {view === 'form' && (
          <div className="space-y-8">
            <ContentTypeSelector
              selectedTypes={selectedTypes}
              selectedPlatforms={selectedPlatforms}
              onTypesChange={setSelectedTypes}
              onPlatformsChange={setSelectedPlatforms}
            />

            <div className="space-y-2">
              <Label htmlFor="transcript" className="text-sm font-semibold">
                Sermon Transcript
              </Label>
              <Textarea
                id="transcript"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste your sermon transcript here…"
                className="min-h-[240px] font-serif text-[15px] leading-relaxed resize-none border-border/50 focus:border-primary/40"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 100 words for best results.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={transcript.trim().length < 100 || selectedTypes.length === 0}
              size="lg"
              className="w-full text-base"
            >
              Generate Content
            </Button>
          </div>
        )}

        {/* Generating view */}
        {view === 'generating' && (
          <div className="py-12">
            <ProgressIndicator
              isGenerating={true}
              hasTranslation={hasTranslation}
            />
          </div>
        )}

        {/* Results view */}
        {view === 'results' && result && (
          <div className="space-y-6">
            <ResultsPanel result={result as Parameters<typeof ResultsPanel>[0]['result']} />
            <Button
              variant="outline"
              onClick={() => setView('form')}
              className="w-full"
            >
              Generate Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
```

Note: This is a structural replacement. Features from the original Dashboard (language selection, series awareness, event mode, speaker name, social handles, CTA, posts per platform) need to be wired in as follow-up tasks once this baseline is working. Capture what's in the original before replacing.

- [ ] **Step 3: Verify the app compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: successful build, or TypeScript errors that need fixing (fix them before committing).

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173/dashboard`. Confirm:
- Form view shows
- Progress bar appears on Generate click
- Results panel shows with copy buttons
- Visual design matches the landing page warmth

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: rebuild Dashboard with new components and editorial design system"
```

---

## Task 7: Apply design tokens throughout dashboard

- [ ] **Step 1: Audit for any remaining default shadcn colours**

```bash
grep -n "bg-blue\|text-blue\|border-blue\|ring-blue\|indigo\|violet\|purple" \
  src/pages/Dashboard.tsx src/components/dashboard/*.tsx
```

Replace any found with the warm palette tokens:
- Primary actions → `bg-primary` (earthy warm)
- Secondary/muted → `bg-secondary` (sage)
- Accents → `text-accent-warm` or `text-accent-action`

- [ ] **Step 2: Verify Playfair Display headings**

```bash
grep -n "font-playfair" src/pages/Dashboard.tsx src/components/dashboard/*.tsx
```

Any heading that's currently `text-2xl font-bold` without `font-playfair` should have it added.

- [ ] **Step 3: Verify shadow-tactile on cards**

```bash
grep -n "shadow-tactile" src/components/dashboard/ResultsPanel.tsx
```

Expected: `shadow-tactile` is present on content cards. Add to any card missing it.

- [ ] **Step 4: Shorten podcast description label**

In `ContentTypeSelector.tsx`, find:
```typescript
{ id: 'podcast_description', label: 'Podcast Description' },
```

Change to:
```typescript
{ id: 'podcast_description', label: 'Podcast Notes' },
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/
git commit -m "feat: apply editorial design tokens — Playfair headings, warm palette, shadow-tactile cards"
```

---

## Task 8: Run full test suite and raise PR

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: all tests PASS with 0 failures.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Visual check in browser at multiple breakpoints**

Open `http://localhost:5173` and check:
- Landing page still looks correct (unchanged)
- Dashboard form view matches warm editorial palette
- Progress bar visible when generating
- Results panel with copy buttons matches design
- Mobile breakpoint (375px) — nothing broken

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin feature/dashboard-redesign
```

PR title: `feat: dashboard redesign — editorial design, progress bar, component decomposition`

Body: reference `docs/superpowers/specs/2026-04-04-launch-readiness-design.md` Stream 2.
