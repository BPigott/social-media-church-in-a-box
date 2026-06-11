// Subtle film-grain overlay. Wrap scenes in this at opacity ~0.04 for a crafted,
// non-"flat digital" feel (same technique as the IFO video system).
import { noise2D } from "@remotion/noise";
import React, { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.04 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Render grain at a downscaled resolution for performance, then let the
    // canvas element scale it up — full-res per-pixel noise on 1920x1080 is slow.
    const gw = Math.ceil(width / 2);
    const gh = Math.ceil(height / 2);
    const imageData = ctx.createImageData(gw, gh);
    for (let x = 0; x < gw; x++) {
      for (let y = 0; y < gh; y++) {
        const n = noise2D("grain", x / 50, y / 50 + frame * 0.07);
        const index = (y * gw + x) * 4;
        const value = Math.floor(((n + 1) / 2) * 255);
        imageData.data[index] = value;
        imageData.data[index + 1] = value;
        imageData.data[index + 2] = value;
        imageData.data[index + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={Math.ceil(width / 2)}
      height={Math.ceil(height / 2)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};
