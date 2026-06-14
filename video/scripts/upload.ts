/**
 * Uploads rendered MP4s and poster stills from video/out/ to the Supabase
 * help-videos storage bucket. Re-running after a re-render safely overwrites
 * existing objects (upsert: true).
 *
 * Prerequisites:
 *   VITE_SUPABASE_URL        — read from .env.production or .env.local
 *   SUPABASE_SERVICE_ROLE_KEY — must be set in env (bypasses RLS for upload)
 *
 * Run with: npx tsx scripts/upload.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, extname, basename } from "node:path";

// Load env: prefer .env.production, fall back to .env.local
const ROOT = resolve(__dirname, "../..");
const envProduction = resolve(ROOT, ".env.production");
const envLocal = resolve(ROOT, ".env.local");

if (existsSync(envProduction)) {
  dotenvConfig({ path: envProduction });
} else if (existsSync(envLocal)) {
  dotenvConfig({ path: envLocal });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "help-videos";
const OUT_DIR = resolve(__dirname, "../out");

if (!SUPABASE_URL) {
  console.error(
    "❌  VITE_SUPABASE_URL is not set. Add it to .env.production or .env.local.",
  );
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error(
    "❌  SUPABASE_SERVICE_ROLE_KEY is not set.\n" +
      "    Export it before running:\n" +
      "      export SUPABASE_SERVICE_ROLE_KEY=<service_role_key> && npx tsx scripts/upload.ts",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function uploadFile(
  localPath: string,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const data = readFileSync(localPath);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

async function main(): Promise<void> {
  if (!existsSync(OUT_DIR)) {
    console.error(`❌  Output directory not found: ${OUT_DIR}`);
    console.error("    Run a render first, e.g.: npm run render:onboarding");
    process.exit(1);
  }

  const allFiles = readdirSync(OUT_DIR);
  const mp4Files = allFiles.filter((f) => extname(f) === ".mp4");

  if (mp4Files.length === 0) {
    console.error(`❌  No .mp4 files found in ${OUT_DIR}`);
    console.error("    Run a render first, e.g.: npm run render:onboarding");
    process.exit(1);
  }

  console.log(`Uploading to Supabase Storage bucket: ${BUCKET}\n`);

  for (const mp4File of mp4Files) {
    const stem = basename(mp4File, ".mp4");
    const mp4Path = resolve(OUT_DIR, mp4File);

    process.stdout.write(`  ${mp4File} … `);
    const mp4Url = await uploadFile(mp4Path, mp4File, "video/mp4");
    console.log(`✓\n    ${mp4Url}`);

    // Upload matching poster if it exists — try .jpg first, then .png
    const jpgPoster = `${stem}.jpg`;
    const pngPoster = `${stem}.jpg`; // remotion still currently outputs .png
    const pngCandidate = `${stem}-poster.png`;

    const posterCandidates = [
      { file: jpgPoster, contentType: "image/jpeg" },
      { file: `${stem}.jpg`, contentType: "image/jpeg" },
      { file: pngCandidate, contentType: "image/png" },
    ].filter((c, i, arr) => arr.findIndex((x) => x.file === c.file) === i);

    let posterUploaded = false;
    for (const { file: posterFile, contentType } of posterCandidates) {
      const posterPath = resolve(OUT_DIR, posterFile);
      if (existsSync(posterPath)) {
        process.stdout.write(`  ${posterFile} … `);
        // Always upload poster under the <stem>.jpg name so the app URL is predictable
        const storageName = `${stem}.jpg`;
        const posterUrl = await uploadFile(posterPath, storageName, contentType);
        console.log(`✓\n    ${posterUrl}`);
        posterUploaded = true;
        break;
      }
    }

    if (!posterUploaded) {
      console.log(
        `  (no poster found for ${stem} — expected ${stem}.jpg or ${stem}-poster.png)`,
      );
    }
  }

  console.log("\n✅  All uploads complete.");
}

main().catch((err: Error) => {
  console.error("\n❌  Upload failed:", err.message ?? err);
  process.exit(1);
});
