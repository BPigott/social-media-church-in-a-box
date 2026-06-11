// Shared shape for the storyboard manifest — the single interface between the
// capture step (writes screenshot/clickPoint), the narration we author by hand,
// and the TTS step (writes audio + durationInFrames). Root.tsx consumes it.

export interface Point {
  x: number;
  y: number;
}

export type BeatType = "intro" | "screen" | "scroll" | "outro";

export interface Beat {
  id: string;
  type: BeatType;
  /** Condensed on-screen caption (the spoken idea, shortened). */
  caption: string;
  /** Optional eyebrow label, e.g. "Step 1 · Tell us about your church". */
  label?: string;
  /** Exact narration script — the source text for TTS. */
  narration: string;

  // --- screen beats only ---
  /** Path under public/, e.g. "screens/step1-church-info.png" (written by capture.ts). */
  screenshot?: string;
  /** Click target in capture-space CSS px (written by capture.ts). */
  clickPoint?: Point | null;
  /**
   * scroll beats only: aspect ratio (height / width) of the full-page screenshot,
   * written by capture.ts. ScrollScene uses this to compute the vertical pan range.
   */
  scrollAspect?: number;

  // --- filled by tts.ts ---
  /** Path under public/, e.g. "audio/beat-01.wav". */
  audio?: string | null;
  /** Derived from the generated audio length at the composition fps. */
  durationInFrames?: number;
}

export interface Manifest {
  composition: {
    /** Intro tagline. */
    tagline: string;
    /** Outro call-to-action. */
    cta: string;
    /** Outro handle / URL line. */
    handle: string;
    /** Thumbnail title (falls back to tagline if absent). */
    title?: string;
    /** Thumbnail category chip, e.g. "How-to". */
    category?: string;
    /** Thumbnail duration chip, e.g. "2 min". */
    durationLabel?: string;
  };
  beats: Beat[];
}

/** Fallback beat length (frames) used before TTS has filled real durations. */
export const DEFAULT_BEAT_FRAMES = 120;
