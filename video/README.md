# ivangel — onboarding videos (code-generated)

Short, on-brand walkthrough videos for ivangel, built **without screen recording**.
The live app is driven by Playwright to capture pixel-perfect screenshots; those are
animated in Remotion with an animated cursor, captions, and a Gemini-TTS voiceover.

This project is self-contained and is **not** part of the Vite app build.

## Pipeline

```
storyboard (src/storyboards/onboarding.json)
   │  narration written by hand
   ▼
npm run capture   →  drives the live app, writes public/screens/*.png + clickPoints
npm run tts       →  Gemini 2.5 TTS → public/audio/*.wav + durationInFrames
npm run studio    →  preview in Remotion Studio
npm run render    →  out/onboarding.mp4
```

`npm run build` runs capture → tts → render in sequence.

## Prerequisites

1. **Node deps:** `npm install` then `npx playwright install chromium`.
2. **The ivangel dev server must be running** for `capture`:
   - `npm run dev` in the repo root (→ http://localhost:5173), or the
     production-Supabase variant on :8083 (see root `CLAUDE.md`).
   - Override the URL with `IVANGEL_URL=http://localhost:8083`.
   - Set `VITE_SUPABASE_URL` to match the dev server's Supabase URL so the seeded
     auth session uses the right storage key (defaults to the production project).
3. **Gemini key** for `tts`: `export GOOGLE_AI_API_KEY=...`
   - Voice/model override: `GEMINI_TTS_VOICE` (default `Sulafat`), `GEMINI_TTS_MODEL`.

## Notes

- Capture seeds a fake **restored** session and routes all Supabase calls to fixtures,
  so it runs offline and writes nothing to the real backend. It never clicks
  "Accept & Complete Setup" (which would create a church).
- The palette/fonts in `src/theme.ts` + `src/fonts.ts` mirror the app's design tokens
  (`src/index.css`). Keep them in sync if the app's brand changes.
- To make another video: add a storyboard JSON + capture routine, reuse the scenes.
