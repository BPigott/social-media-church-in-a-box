/**
 * Generates narration audio for each storyboard beat using Gemini 2.5 TTS, writes
 * WAV files to public/audio/, and writes `audio` + `durationInFrames` back into the
 * storyboard manifest. The model call is isolated in synthesize() so swapping to
 * ElevenLabs later is a one-function change.
 *
 * Accepts the storyboard name as an optional positional argument (default: onboarding).
 *
 * Requires GOOGLE_AI_API_KEY (or GEMINI_API_KEY) in the environment.
 * Run with: npm run tts:onboarding  OR  tsx scripts/tts.ts <name>
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { VIDEO } from "../src/theme";
import type { Manifest } from "../src/manifest";

const STORYBOARD_NAME = process.argv[2] ?? "onboarding";
const MANIFEST_PATH = resolve(`src/storyboards/${STORYBOARD_NAME}.json`);
const AUDIO_DIR = resolve("public/audio");

const API_KEY = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
// Warm, measured narration voices: Kore (firm), Sulafat (warm), Aoede (breezy).
const VOICE = process.env.GEMINI_TTS_VOICE ?? "Sulafat";
// Natural-language style direction. Gemini TTS follows the instruction before the
// colon and speaks only the text after it — this is how we steer the accent.
const STYLE =
  process.env.GEMINI_TTS_STYLE ??
  "Read this aloud in a warm, friendly British English (UK) accent, at a calm, unhurried pace";

// Tail padding (seconds) so scenes don't clip the final word and have breathing room.
const TAIL_PADDING_SEC = 0.7;
const MIN_BEAT_SEC = 2.5;

interface Pcm {
  bytes: Buffer;
  sampleRate: number;
}

/** Calls Gemini TTS and returns raw PCM (signed 16-bit LE, mono). */
async function synthesize(text: string): Promise<Pcm> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE}: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
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
    throw new Error(`No audio in TTS response: ${JSON.stringify(json).slice(0, 400)}`);
  }
  const mime: string = part.inlineData.mimeType ?? "";
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  return { bytes: Buffer.from(part.inlineData.data, "base64"), sampleRate };
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

async function main() {
  if (!API_KEY) {
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

  console.log(`🎙️  Storyboard: ${STORYBOARD_NAME}`);
  mkdirSync(AUDIO_DIR, { recursive: true });
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

  for (const beat of manifest.beats) {
    process.stdout.write(`🔊 ${beat.id} … `);
    const pcm = await synthesize(beat.narration);
    const wav = pcmToWav(pcm);

    const rel = `audio/${beat.id}.wav`;
    writeFileSync(resolve("public", rel), wav);

    const seconds = pcm.bytes.length / (pcm.sampleRate * 2); // mono, 16-bit
    const padded = Math.max(seconds + TAIL_PADDING_SEC, MIN_BEAT_SEC);
    beat.audio = rel;
    beat.durationInFrames = Math.ceil(padded * VIDEO.fps);

    console.log(`${seconds.toFixed(1)}s → ${beat.durationInFrames} frames`);
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  const total = manifest.beats.reduce((s, b) => s + (b.durationInFrames ?? 0), 0);
  console.log(
    `\n✅ Wrote ${manifest.beats.length} clips. Total ≈ ${(total / VIDEO.fps).toFixed(1)}s ` +
      `(${total} frames). Manifest updated.`,
  );
}

main().catch((err) => {
  console.error("\n❌ TTS failed:", err.message ?? err);
  process.exit(1);
});
