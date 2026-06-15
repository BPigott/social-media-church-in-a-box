// Brand title card. Sand background, logo springs up, tagline reveals word-by-word.
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
import { inter } from "../fonts";

export const IntroScene: React.FC<{ tagline: string }> = ({ tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
    durationInFrames: 30,
  });
  const logoY = interpolate(logoProgress, [0, 1], [40, 0]);

  // Sage rule grows in.
  const ruleW = interpolate(frame, [18, 38], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const words = tagline.split(" ");

  return (
    <AbsoluteFill
      style={{
        background: palette.sand,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div style={{ transform: `translateY(${logoY}px)`, opacity: logoProgress }}>
        <Logo height={200} />
      </div>

      <div
        style={{
          width: ruleW,
          height: 3,
          background: palette.sage,
          borderRadius: 2,
        }}
      />

      <div
        style={{
          fontFamily: inter,
          fontSize: 34,
          color: palette.clay,
          letterSpacing: "0.01em",
          maxWidth: 1100,
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0.32em",
          padding: "0 80px",
        }}
      >
        {words.map((word, i) => {
          const wordProgress = spring({
            frame: frame - 28 - i * 3,
            fps,
            config: { damping: 22, stiffness: 120 },
            durationInFrames: 18,
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: wordProgress,
                transform: `translateY(${interpolate(wordProgress, [0, 1], [12, 0])}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
