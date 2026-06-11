// Lower-third caption + small step label, synced to the beat's narration.
// Sits in a tinted band so it stays legible over any screenshot.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { palette } from "../theme";
import { inter, playfairDisplay } from "../fonts";

interface CaptionProps {
  /** Big caption line (the spoken idea, condensed). */
  text: string;
  /** Optional small eyebrow label, e.g. "Step 1 · Tell us about your church". */
  label?: string;
}

export const Caption: React.FC<CaptionProps> = ({ text, label }) => {
  const frame = useCurrentFrame();

  const inOpacity = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const inY = interpolate(frame, [4, 16], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "120px 96px 64px",
        background:
          "linear-gradient(to top, rgba(58,53,47,0.82) 0%, rgba(58,53,47,0.55) 55%, rgba(58,53,47,0) 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: inOpacity,
        transform: `translateY(${inY}px)`,
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: inter,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: palette.ochre,
          }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          fontFamily: playfairDisplay,
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.15,
          color: palette.white,
          maxWidth: 1400,
        }}
      >
        {text}
      </span>
    </div>
  );
};
