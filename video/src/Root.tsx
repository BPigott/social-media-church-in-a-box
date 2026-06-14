import React from "react";
import { Audio, Composition, Series, staticFile } from "remotion";
import { STORYBOARDS } from "./storyboards/index";
import { IntroScene } from "./scenes/IntroScene";
import { OutroScene } from "./scenes/OutroScene";
import { ScreenshotScene } from "./scenes/ScreenshotScene";
import { ScrollScene } from "./scenes/ScrollScene";
import { ThumbnailScene } from "./scenes/ThumbnailScene";
import { DEFAULT_BEAT_FRAMES, type Beat, type Manifest } from "./manifest";
import { VIDEO } from "./theme";

const beatFrames = (b: Beat): number => b.durationInFrames ?? DEFAULT_BEAT_FRAMES;

function totalFrames(storyboard: Manifest): number {
  return storyboard.beats.reduce((sum, b) => sum + beatFrames(b), 0);
}

// Total duration → m:ss label, e.g. 106 frames @30fps → "0:04", 3176 frames → "1:46".
// Always wall-clock accurate; storyboard.composition.durationLabel can override for marketing.
function formatDuration(storyboard: Manifest): string {
  const totalSeconds = Math.round(totalFrames(storyboard) / VIDEO.fps);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Stable component reference — defined at module level so Remotion doesn't see a
// new component class on each RemotionRoot render.
const VideoFromManifest: React.FC<{ storyboard: Manifest }> = ({ storyboard }) => {
  const { composition, beats, audioMaster } = storyboard;
  return (
    <>
      {/* Continuous mode: one narration track spans the whole video so the voice
          flows smoothly across slide changes. Falls back to per-beat audio below. */}
      {audioMaster ? <Audio src={staticFile(audioMaster)} /> : null}
      <Series>
        {beats.map((beat) => (
          <Series.Sequence key={beat.id} durationInFrames={beatFrames(beat)}>
            {!audioMaster && beat.audio ? <Audio src={staticFile(beat.audio)} /> : null}

            {beat.type === "intro" && <IntroScene tagline={composition.tagline} />}

            {beat.type === "outro" && (
              <OutroScene cta={composition.cta} handle={composition.handle} />
            )}

            {beat.type === "screen" && beat.screenshot && (
              <ScreenshotScene
                screenshot={beat.screenshot}
                caption={beat.caption}
                label={beat.label}
                clickPoint={beat.clickPoint}
                durationInFrames={beatFrames(beat)}
              />
            )}

            {beat.type === "scroll" && beat.screenshot && (
              <ScrollScene
                screenshot={beat.screenshot}
                caption={beat.caption}
                label={beat.label}
                scrollAspect={beat.scrollAspect ?? 1}
                durationInFrames={beatFrames(beat)}
              />
            )}
          </Series.Sequence>
        ))}
      </Series>
    </>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    {STORYBOARDS.map(({ id, storyboard }) => (
      <Composition
        key={id}
        id={id}
        component={VideoFromManifest}
        defaultProps={{ storyboard }}
        durationInFrames={totalFrames(storyboard)}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    ))}
    {STORYBOARDS.map(({ id, storyboard }) => {
      const { title, category, durationLabel, tagline } = storyboard.composition;
      return (
        <Composition
          key={`${id}Thumbnail`}
          id={`${id}Thumbnail`}
          component={ThumbnailScene}
          defaultProps={{
            title: title ?? tagline,
            category: category ?? "How-to",
            // Auto-derive from beat durations; storyboard override only for marketing
            // edits (e.g. the overview cut).
            durationLabel: durationLabel ?? formatDuration(storyboard),
          }}
          durationInFrames={1}
          fps={VIDEO.fps}
          width={1280}
          height={720}
        />
      );
    })}
  </>
);
