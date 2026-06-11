// Branded 1280x720 thumbnail title card — pure brand, no screenshot.
// Single template, parametrised per video via composition.title / category / durationLabel.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Grain } from "../effects/Grain";
import { palette } from "../theme";
import { playfairDisplay, inter } from "../fonts";

// Remotion's Composition expects component props to satisfy Record<string, unknown>.
type ThumbnailProps = {
  title: string;
  category: string;
  durationLabel?: string;
  [key: string]: unknown;
};

export const ThumbnailScene: React.FC<ThumbnailProps> = ({
  title,
  category,
  durationLabel,
}) => {
  return (
    <AbsoluteFill style={{ background: palette.sand, overflow: "hidden" }}>
      {/* Soft blurred brand circles — depth without a screenshot. */}
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -160,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: palette.terracotta,
          opacity: 0.18,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: -180,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: palette.sage,
          opacity: 0.22,
          filter: "blur(90px)",
        }}
      />

      {/* Main padded canvas. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "64px 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top: category chip + accent bar. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              alignSelf: "flex-start",
              fontFamily: inter,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: palette.white,
              background: palette.terracotta,
              padding: "14px 26px",
              borderRadius: 999,
            }}
          >
            {category}
          </div>

          <div
            style={{
              width: 72,
              height: 5,
              background: palette.terracotta,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Title — Playfair, earth, up to 3 lines, left-aligned. */}
        <div
          style={{
            fontFamily: playfairDisplay,
            fontWeight: 700,
            fontSize: 88,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: palette.earth,
            maxWidth: 920,
          }}
        >
          {title}
        </div>

        {/* Bottom row: wordmark + play glyph + duration. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Inline wordmark — terracotta dot + "ivangel" in Playfair, tracks the app brand. */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: palette.terracotta,
              }}
            />
            <div
              style={{
                fontFamily: playfairDisplay,
                fontWeight: 600,
                fontSize: 40,
                color: palette.earth,
                letterSpacing: "-0.005em",
              }}
            >
              ivangel
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Circular play glyph. */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: palette.terracotta,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(203, 93, 71, 0.35)",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  marginLeft: 6,
                  borderTop: "16px solid transparent",
                  borderBottom: "16px solid transparent",
                  borderLeft: `26px solid ${palette.white}`,
                }}
              />
            </div>

            {durationLabel && (
              <div
                style={{
                  fontFamily: inter,
                  fontSize: 18,
                  fontWeight: 600,
                  color: palette.earth,
                  background: palette.white,
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: `1px solid ${palette.clay}33`,
                }}
              >
                {durationLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      <Grain opacity={0.03} />
    </AbsoluteFill>
  );
};
