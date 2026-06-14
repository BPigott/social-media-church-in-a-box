// ivangel "Earthy Editorial" palette — mirrors src/index.css design tokens so the
// video matches the live app. Keep these in sync if the app palette changes.
export const palette = {
  sand: "#f5f2eb", // --background
  earth: "#3a352f", // --foreground
  terracotta: "#cb5d47", // --primary
  sage: "#8b997b", // --secondary
  ochre: "#d69f4c", // --accent
  clay: "#7c6a5d", // --muted-foreground
  white: "#ffffff",
} as const;

// Composition is 16:9 — a web-app walkthrough reads best in landscape and embeds
// cleanly in-app, on the landing page, and in a help library.
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

// Screenshots are captured at this CSS viewport (then scaled up by deviceScaleFactor
// for crispness). clickPoint / focusRect coordinates in the manifest are in THIS space.
export const CAPTURE_VIEWPORT = {
  width: 1280,
  height: 720,
} as const;

// Factor to map capture-space coordinates into composition space.
export const captureToComp = {
  x: VIDEO.width / CAPTURE_VIEWPORT.width,
  y: VIDEO.height / CAPTURE_VIEWPORT.height,
} as const;
