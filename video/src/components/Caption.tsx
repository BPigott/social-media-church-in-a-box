// Lower-third caption + small step label, synced to the beat's narration.
// A clean, contained "tactile" card (matching the app's UI) keeps the caption
// legible over any screenshot — no full-bleed gradient scrim.
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
  const inY = interpolate(frame, [4, 16], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        bottom: 72,
        maxWidth: 1180,
        opacity: inOpacity,
        transform: `translateY(${inY}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: palette.white,
          borderRadius: 20,
          padding: "30px 40px",
          boxShadow: "0 24px 60px -18px rgba(58,53,47,0.45)",
        }}
      >
        {/* Brand accent rule (mirrors the app's terracotta tab markers). */}
        <div
          style={{ height: 3, width: 44, borderRadius: 2, background: palette.terracotta }}
        />
        {label && (
          <span
            style={{
              fontFamily: inter,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: palette.terracotta,
            }}
          >
            {label}
          </span>
        )}
        <span
          style={{
            fontFamily: playfairDisplay,
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.15,
            color: palette.earth,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
