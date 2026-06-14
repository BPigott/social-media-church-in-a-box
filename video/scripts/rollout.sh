#!/bin/zsh
# Rolls out continuous-Alice narration across the whole how-to library.
# Sequential by design: one render at a time (concurrent renders to out/*.mp4 corrupt the file).
cd /Users/bobpigott/Documents/ivangel/video
source ~/.zshrc 2>/dev/null

RM="ss:///help-videos"
PUB="https://gxgijxmwipnurubqupbt.supabase.co/storage/v1/object/public/help-videos"

host() {  # $1 local file, $2 remote name, $3 content-type
  echo y | supabase storage rm "$RM/$2" --linked --experimental >/dev/null 2>&1
  sleep 1
  supabase storage cp "$(pwd)/$1" "$RM/$2" --linked --experimental --content-type "$3" >/dev/null 2>&1
}

# ── Overview: already TTS'd + rendered + approved. Re-thumb (duration changed) + host. ──
echo "=== overview: thumb + host (audio already approved) ==="
npm run thumb:overview >/dev/null 2>&1
host out/overview-c.mp4 overview.mp4 video/mp4
host out/overview.jpg overview.jpg image/jpeg
echo "overview hosted: $(curl -s -o /dev/null -w '%{http_code}/%{size_download}' "$PUB/overview.mp4")"

for name in onboarding dashboard edit-translate library style-guide; do
  echo ""
  echo "=== $name: TTS (continuous) ==="
  npm run tts:$name 2>&1 | tail -2
  echo "=== $name: render ==="
  rm -f out/$name.mp4 out/$name-c.mp4
  npm run render:$name >/dev/null 2>&1
  if [ ! -f out/$name.mp4 ]; then echo "!! $name render FAILED"; continue; fi
  echo "=== $name: compress ==="
  ffmpeg -y -i out/$name.mp4 -c:v libx264 -crf 26 -preset medium -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out/$name-c.mp4 >/dev/null 2>&1
  echo "=== $name: thumb ==="
  npm run thumb:$name >/dev/null 2>&1
  echo "=== $name: host ==="
  host out/$name-c.mp4 $name.mp4 video/mp4
  host out/$name.jpg $name.jpg image/jpeg
  echo "$name hosted: mp4=$(curl -s -o /dev/null -w '%{http_code}/%{size_download}' "$PUB/$name.mp4") jpg=$(curl -s -o /dev/null -w '%{http_code}' "$PUB/$name.jpg")"
done

echo ""
echo "=== ROLLOUT COMPLETE ==="
