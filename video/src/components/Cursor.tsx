// An animated pointer that glides to a target and emits a click "pulse" ring.
// Coordinates are in composition space (see theme.captureToComp for mapping from
// capture-space clickPoints). Rendered inside a Sequence so useCurrentFrame() is
// scene-relative.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { palette } from "../theme";

interface CursorProps {
  toX: number;
  toY: number;
  fromX?: number;
  fromY?: number;
  /** Frame the cursor begins moving (scene-relative). */
  moveStart?: number;
  /** Frames the glide takes. */
  moveDuration?: number;
  /** Scene-relative frame at which the click pulse fires. */
  clickFrame?: number;
}

export const Cursor: React.FC<CursorProps> = ({
  toX,
  toY,
  fromX,
  fromY,
  moveStart = 6,
  moveDuration = 22,
  clickFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter from lower-right of the target by default.
  const startX = fromX ?? toX + 320;
  const startY = fromY ?? toY + 260;

  const moveProgress = spring({
    frame: frame - moveStart,
    fps,
    config: { damping: 26, stiffness: 90 },
    durationInFrames: moveDuration,
  });

  const x = interpolate(moveProgress, [0, 1], [startX, toX]);
  const y = interpolate(moveProgress, [0, 1], [startY, toY]);

  // Click press: brief scale-down right at clickFrame.
  const press =
    clickFrame != null
      ? interpolate(
          frame,
          [clickFrame - 3, clickFrame, clickFrame + 5],
          [1, 0.82, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 1;

  // Pulse ring expands + fades after clickFrame.
  const pulseT =
    clickFrame != null
      ? interpolate(frame, [clickFrame, clickFrame + 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const pulseActive = clickFrame != null && frame >= clickFrame && frame <= clickFrame + 18;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        transform: "translate(-4px, -2px)",
      }}
    >
      {pulseActive && (
        <div
          style={{
            position: "absolute",
            left: 2,
            top: 0,
            width: 8 + pulseT * 64,
            height: 8 + pulseT * 64,
            marginLeft: -(4 + pulseT * 32),
            marginTop: -(4 + pulseT * 32),
            borderRadius: "50%",
            border: `3px solid ${palette.terracotta}`,
            opacity: (1 - pulseT) * 0.7,
          }}
        />
      )}
      <svg
        width="36"
        height="44"
        viewBox="0 0 24 30"
        style={{
          transform: `scale(${press})`,
          transformOrigin: "2px 2px",
          filter: "drop-shadow(0 2px 3px rgba(58,53,47,0.35))",
        }}
      >
        <path
          d="M2 2 L2 22 L7.5 16.5 L11 25 L14 23.7 L10.6 15.2 L18 15 Z"
          fill={palette.white}
          stroke={palette.earth}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
