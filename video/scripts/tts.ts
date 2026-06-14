/**
 * Generates narration audio for each storyboard beat, writes WAV files to
 * public/audio/, and writes `audio` + `durationInFrames` back into the storyboard
 * manifest.
 *
 * Two providers, selected by TTS_PROVIDER (default "elevenlabs"):
 *   - elevenlabs: ElevenLabs TTS. The same voice id is highly consistent across
 *     separate requests, so the narration voice no longer drifts between slides.
 *     Returns MP3, which we convert to WAV with ffmpeg (works on every plan tier).
 *   - gemini: Gemini 2.5 TTS (legacy fallback). A separate request per beat, so
 *     prosody drifts unless TEMPERATURE is held low.
 *
 * Accepts the storyboard name as an optional positional argument (default: onboarding).
 *
 * Requires ELEVENLABS_API_KEY (elevenlabs) or GOOGLE_AI_API_KEY / GEMINI_API_KEY (gemini).
 * Run with: npm run tts:onboarding  OR  tsx scripts/tts.ts <name>
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { VIDEO } from "../src/theme";
import type { Manifest } from "../src/manifest";

const STORYBOARD_NAME = process.argv[2] ?? "onboarding";
const MANIFEST_PATH = resolve(`src/storyboards/${STORYBOARD_NAME}.json`);
const AUDIO_DIR = resolve("public/audio");

const PROVIDER = (process.env.TTS_PROVIDER ?? "elevenlabs").toLowerCase();

// ── ElevenLabs config ────────────────────────────────────────────────────────
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
// Default: "Alice — Clear, Engaging Educator" (British female). Other good British
// options: George JBFqnCBsd6RMkjVDRZzb, Daniel onwK4e9ZLuTAKqWW03F9,
// Lily pFZP5JQG7iQjIQuC4Bku. Override with ELEVENLABS_VOICE_ID.
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID ?? "Xb7hH8MSUJpSbSDYk0k2";
// turbo_v2_5 supports language_code enforcement (multilingual_v2 does not). The
// narration is 100% English, so locking to English stops the model reading made-up
// brand spellings (ivangel/ivanjel) as Spanish — keeping the soft-g "EYE-VAN-jel".
const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL ?? "eleven_turbo_v2_5";
const ELEVEN_LANG = process.env.ELEVENLABS_LANGUAGE ?? "en";
// Continuous mode: synthesise the whole script in ONE request and play it as a
// single track, so the narration flows across slides instead of restarting per
// beat. Slide timings come from ElevenLabs' character-level timestamps. Only the
// elevenlabs provider supports this; set TTS_CONTINUOUS=0 for the legacy per-beat path.
const CONTINUOUS = PROVIDER === "elevenlabs" && process.env.TTS_CONTINUOUS !== "0";

// ── Gemini config (legacy fallback) ──────────────────────────────────────────
const API_KEY = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
const VOICE = process.env.GEMINI_TTS_VOICE ?? "Sulafat";
const STYLE =
  process.env.GEMINI_TTS_STYLE ??
  "Read this aloud in a warm, friendly British English (UK) accent, at a calm, unhurried pace";
const TEMPERATURE = Number(process.env.GEMINI_TTS_TEMPERATURE ?? "0.35");

// Tail padding (seconds) so scenes don't clip the final word and have breathing room.
const TAIL_PADDING_SEC = 0.7;
const MIN_BEAT_SEC = 2.5;

interface Clip {
  wav: Buffer;
  seconds: number;
}

interface Pcm {
  bytes: Buffer;
  sampleRate: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SAMPLE_RATE = 24000; // mono 16-bit WAV the scenes expect

/** Seconds of a mono 16-bit WAV from its byte length (excludes the 44-byte header). */
function wavSeconds(wav: Buffer): number {
  return Math.max(0, wav.length - 44) / (SAMPLE_RATE * 2);
}

/** ElevenLabs: returns MP3, converted to mono 16-bit WAV via ffmpeg. */
async function elevenOnce(text: string): Promise<Clip> {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}` +
    `?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_KEY ?? "",
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: ELEVEN_MODEL,
      language_code: ELEVEN_LANG,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const mp3 = Buffer.from(await res.arrayBuffer());
  const tmp = tmpdir();
  const mp3Path = join(tmp, `tts-${process.pid}-${Date.now()}.mp3`);
  const wavPath = join(tmp, `tts-${process.pid}-${Date.now()}.wav`);
  try {
    writeFileSync(mp3Path, mp3);
    // Down-mix to mono 16-bit PCM at SAMPLE_RATE — matches what the scenes/manifest expect.
    execFileSync("ffmpeg", [
      "-y", "-i", mp3Path,
      "-ac", "1", "-ar", String(SAMPLE_RATE), "-c:a", "pcm_s16le",
      wavPath,
    ], { stdio: "ignore" });
    const wav = readFileSync(wavPath);
    return { wav, seconds: wavSeconds(wav) };
  } finally {
    rmSync(mp3Path, { force: true });
    rmSync(wavPath, { force: true });
  }
}

/** Wraps mono 16-bit PCM in a minimal WAV container. */
function pcmToWav({ bytes, sampleRate }: Pcm): Buffer {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + bytes.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(bytes.length, 40);
  return Buffer.concat([header, bytes]);
}

/** Gemini 2.5 TTS (legacy fallback): one request per beat, returns a WAV clip. */
async function geminiOnce(text: string): Promise<Clip> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE}: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        temperature: TEMPERATURE,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini TTS HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find(
    (p: any) => p?.inlineData?.data,
  );
  if (!part) {
    // The preview TTS model intermittently returns finishReason "OTHER" with no
    // audio; treat it as transient so synthesize() retries it.
    throw new Error(`RETRYABLE No audio in TTS response: ${JSON.stringify(json).slice(0, 300)}`);
  }
  const mime: string = part.inlineData.mimeType ?? "";
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  const pcm: Pcm = { bytes: Buffer.from(part.inlineData.data, "base64"), sampleRate };
  return { wav: pcmToWav(pcm), seconds: pcm.bytes.length / (pcm.sampleRate * 2) };
}

const synthesizeOnce = (text: string): Promise<Clip> =>
  PROVIDER === "gemini" ? geminiOnce(text) : elevenOnce(text);

/** Retries on transient errors (5xx / 429 / no-audio) with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String((err as Error)?.message ?? err);
      const transient = /HTTP (5\d\d|429)|RETRYABLE/.test(msg);
      if (!transient || i === attempts - 1) throw err;
      const backoff = 1500 * 2 ** i;
      process.stdout.write(`(retry ${i + 1} after ${backoff}ms) `);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

const synthesize = (text: string, attempts = 4): Promise<Clip> =>
  withRetry(() => synthesizeOnce(text), attempts);

interface Continuous {
  mp3: Buffer;
  /** Per-character start time (seconds), aligned to the request text. */
  charStart: number[];
  /** Total spoken length (seconds). */
  totalSec: number;
  /** Length of the alignment array — equals text.length when alignment is exact. */
  aligned: number;
}

/**
 * ElevenLabs "with-timestamps": synthesises the entire script in one request and
 * returns the MP3 plus character-level start times. One request = one continuous,
 * gap-free take, and the timestamps tell us exactly when each beat's slide should change.
 */
async function elevenContinuousOnce(text: string): Promise<Continuous> {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}/with-timestamps` +
    `?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_KEY ?? "",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: ELEVEN_MODEL,
      language_code: ELEVEN_LANG,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json: any = await res.json();
  const al = json.alignment ?? json.normalized_alignment;
  if (!json.audio_base64 || !al?.character_start_times_seconds?.length) {
    throw new Error(`RETRYABLE no audio/alignment in response: ${JSON.stringify(json).slice(0, 200)}`);
  }
  const charEnd: number[] = al.character_end_times_seconds;
  return {
    mp3: Buffer.from(json.audio_base64, "base64"),
    charStart: al.character_start_times_seconds,
    totalSec: charEnd[charEnd.length - 1],
    aligned: al.characters.length,
  };
}

async function main() {
  if (PROVIDER === "elevenlabs" && !ELEVEN_KEY) {
    throw new Error(
      "Missing ELEVENLABS_API_KEY. Export it before running (or set TTS_PROVIDER=gemini): " +
        `export ELEVENLABS_API_KEY=... && npm run tts:${STORYBOARD_NAME}`,
    );
  }
  if (PROVIDER === "gemini" && !API_KEY) {
    throw new Error(
      "Missing GOOGLE_AI_API_KEY (or GEMINI_API_KEY). Export it before running: " +
        `export GOOGLE_AI_API_KEY=... && npm run tts:${STORYBOARD_NAME}`,
    );
  }
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Storyboard not found: ${MANIFEST_PATH}\nRun capture first: npm run capture:${STORYBOARD_NAME}`,
    );
  }

  console.log(
    `🎙️  Storyboard: ${STORYBOARD_NAME} · provider: ${PROVIDER}` +
      (CONTINUOUS ? " · continuous" : ""),
  );
  mkdirSync(AUDIO_DIR, { recursive: true });
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

  if (CONTINUOUS) {
    await generateContinuous(manifest);
  } else {
    manifest.audioMaster = null; // per-beat mode: Root plays each beat's own clip
    for (const beat of manifest.beats) {
      process.stdout.write(`🔊 ${beat.id} … `);
      const { wav, seconds } = await synthesize(beat.narration);

      const rel = `audio/${beat.id}.wav`;
      writeFileSync(resolve("public", rel), wav);

      const padded = Math.max(seconds + TAIL_PADDING_SEC, MIN_BEAT_SEC);
      beat.audio = rel;
      beat.durationInFrames = Math.ceil(padded * VIDEO.fps);

      console.log(`${seconds.toFixed(1)}s → ${beat.durationInFrames} frames`);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  const total = manifest.beats.reduce((s, b) => s + (b.durationInFrames ?? 0), 0);
  console.log(
    `\n✅ ${manifest.beats.length} beats. Total ≈ ${(total / VIDEO.fps).toFixed(1)}s ` +
      `(${total} frames). Manifest updated.`,
  );
}

/**
 * Continuous mode: one ElevenLabs request for the whole script, saved as a single
 * master MP3. Each beat's slide duration is derived from the character timestamps
 * so the slides change in sync with the gap-free narration.
 */
async function generateContinuous(manifest: Manifest): Promise<void> {
  const SEP = " ";
  const beats = manifest.beats;

  // Joined script + the character offset where each beat's narration begins.
  const offsets: number[] = [];
  let cum = 0;
  for (const b of beats) {
    offsets.push(cum);
    cum += b.narration.length + SEP.length;
  }
  const text = beats.map((b) => b.narration).join(SEP);

  process.stdout.write(`🔊 continuous · ${text.length} chars … `);
  const { mp3, charStart, totalSec, aligned } = await withRetry(() =>
    elevenContinuousOnce(text),
  );

  const rel = `audio/${STORYBOARD_NAME}-master.mp3`;
  writeFileSync(resolve("public", rel), mp3);
  manifest.audioMaster = rel;

  // alignment.characters should match the request text 1:1; if it doesn't (e.g. the
  // model normalised something), fall back to proportional-by-character-count timing.
  const exact = aligned === text.length;
  if (!exact) {
    console.warn(
      `\n⚠️  alignment length ${aligned} != text length ${text.length} — using proportional timing.`,
    );
  }
  const timeAt = (charIdx: number): number => {
    if (charIdx <= 0) return 0;
    if (!exact) return (charIdx / text.length) * totalSec;
    return charIdx >= charStart.length ? totalSec : charStart[charIdx];
  };

  // Cumulative-rounded frame boundaries keep slide changes locked to the audio:
  // each beat ends exactly where the next begins, so timing never drifts.
  const frameAt = (sec: number) => Math.round(sec * VIDEO.fps);
  for (let i = 0; i < beats.length; i++) {
    const startSec = timeAt(offsets[i]);
    const endSec =
      i < beats.length - 1 ? timeAt(offsets[i + 1]) : totalSec + TAIL_PADDING_SEC;
    beats[i].audio = null;
    beats[i].durationInFrames = Math.max(1, frameAt(endSec) - frameAt(startSec));
  }
  console.log(`${totalSec.toFixed(1)}s total`);
}

main().catch((err) => {
  console.error("\n❌ TTS failed:", err.message ?? err);
  process.exit(1);
});
