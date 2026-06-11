// Animates a TALL full-page screenshot by panning the camera vertically down it —
// simulating a user scrolling through a long form to reveal every option. Used for
// dense panels (e.g. the dashboard create panel) that don't fit one viewport.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Caption } from "../components/Caption";
import { Grain } from "../effects/Grain";
import { palette, VIDEO } from "../theme";

interface ScrollSceneProps {
  screenshot: string; // staticFile-relative path, e.g. "screens/dash-scroll.png"
  caption: string;
  label?: string;
  /** Aspect ratio (height / width) of the captured full-page image. */
  scrollAspect: number;
  /** Whole-scene duration in frames. */
  durationInFrames: number;
}

export const ScrollScene: React.FC<ScrollSceneProps> = ({
  screenshot,
  caption,
  label,
  scrollAspect,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // A tall, narrow capture (e.g. a single form card) reads best spotlighted at a
  // comfortable width and centred on the sand backdrop — which matches the app's own
  // background, so the card's rounded corners blend seamlessly. A wide capture
  // (closer to landscape) fills the frame instead.
  const displayWidth =
    scrollAspect > 1.3 ? Math.round(VIDEO.width * 0.46) : VIDEO.width;
  const left = Math.round((VIDEO.width - displayWidth) / 2);
  const renderedHeight = displayWidth * scrollAspect;
  // Total vertical travel (0 if the image already fits the frame).
  const travel = Math.max(0, renderedHeight - VIDEO.height);

  // Hold briefly at the top, pan smoothly, hold briefly at the bottom.
  const holdStart = Math.round(durationInFrames * 0.12);
  const holdEnd = Math.round(durationInFrames * 0.88);
  const translateY = interpolate(frame, [holdStart, holdEnd], [0, -travel], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Image fade-in.
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: palette.sand }}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <Img
          src={staticFile(screenshot)}
          style={{
            position: "absolute",
            left,
            width: displayWidth,
            height: renderedHeight,
            transform: `translateY(${translateY}px)`,
          }}
        />
      </AbsoluteFill>

      <Caption text={caption} label={label} />
      <Grain opacity={0.035} />
    </AbsoluteFill>
  );
};
