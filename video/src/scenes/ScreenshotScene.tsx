// Animates ONE captured screen: a screenshot framed on a sand backdrop with a slow
// Ken Burns push toward the action point, an animated cursor + click pulse, and the
// lower-third caption. This is the workhorse scene of the walkthrough.
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Cursor } from "../components/Cursor";
import { Caption } from "../components/Caption";
import { Grain } from "../effects/Grain";
import { palette, captureToComp, VIDEO } from "../theme";

export interface Point {
  x: number;
  y: number;
}

interface ScreenshotSceneProps {
  screenshot: string; // staticFile-relative path, e.g. "screens/step1.png"
  caption: string;
  label?: string;
  /** Click target in capture-space (CSS px at CAPTURE_VIEWPORT). */
  clickPoint?: Point | null;
  /** Whole-scene duration in frames (used to time the Ken Burns + click). */
  durationInFrames: number;
}

export const ScreenshotScene: React.FC<ScreenshotSceneProps> = ({
  screenshot,
  caption,
  label,
  clickPoint,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Map the click target into composition space.
  const target = clickPoint
    ? { x: clickPoint.x * captureToComp.x, y: clickPoint.y * captureToComp.y }
    : { x: VIDEO.width / 2, y: VIDEO.height / 2 };

  // Ken Burns: gentle push from 1.0 → 1.06 across the scene, origin at the action.
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const originX = (target.x / VIDEO.width) * 100;
  const originY = (target.y / VIDEO.height) * 100;

  // Image fade-in.
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Click happens ~60% through the scene, after the cursor has arrived.
  const clickFrame = Math.round(durationInFrames * 0.58);

  return (
    <AbsoluteFill style={{ background: palette.sand }}>
      {/* Screenshot fills the frame (capture aspect matches 16:9). */}
      <AbsoluteFill
        style={{
          opacity: fadeIn,
          transform: `scale(${scale})`,
          transformOrigin: `${originX}% ${originY}%`,
        }}
      >
        <Img
          src={staticFile(screenshot)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {clickPoint && (
        <Cursor
          toX={target.x}
          toY={target.y}
          moveStart={Math.min(8, Math.round(durationInFrames * 0.1))}
          moveDuration={Math.round(fps * 0.8)}
          clickFrame={clickFrame}
        />
      )}

      <Caption text={caption} label={label} />
      <Grain opacity={0.035} />
    </AbsoluteFill>
  );
};
