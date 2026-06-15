// Sign-off card. Sage background, reversed logo on a white pill, CTA + handle.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Logo } from "../components/Logo";
import { Grain } from "../effects/Grain";
import { palette } from "../theme";
import { inter, playfairDisplay } from "../fonts";

export const OutroScene: React.FC<{ cta: string; handle: string }> = ({
  cta,
  handle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
    durationInFrames: 30,
  });
  const logoY = interpolate(logoProgress, [0, 1], [28, 0]);

  const ctaOpacity = interpolate(frame, [18, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const handleOpacity = interpolate(frame, [34, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: palette.sage,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <div
        style={{
          transform: `translateY(${logoY}px)`,
          opacity: logoProgress,
          background: palette.white,
          padding: "32px 56px",
          borderRadius: 28,
          boxShadow: "0 18px 50px -12px rgba(58,53,47,0.3)",
        }}
      >
        <Logo height={140} />
      </div>

      <p
        style={{
          fontFamily: playfairDisplay,
          fontSize: 52,
          fontWeight: 700,
          color: palette.white,
          opacity: ctaOpacity,
          textAlign: "center",
          maxWidth: 1200,
          lineHeight: 1.3,
          margin: 0,
          padding: "0 80px",
        }}
      >
        {cta}
      </p>

      <p
        style={{
          fontFamily: inter,
          fontSize: 28,
          color: "rgba(255,255,255,0.78)",
          opacity: handleOpacity,
          letterSpacing: "0.08em",
          margin: 0,
        }}
      >
        {handle}
      </p>

      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
