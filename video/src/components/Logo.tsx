// ivangel wordmark/dove logo, served from public/logo.png (copied from the app).
import React from "react";
import { Img, staticFile } from "remotion";

export const Logo: React.FC<{ height?: number }> = ({ height = 220 }) => {
  return (
    <Img
      src={staticFile("logo.png")}
      style={{ height, width: "auto", objectFit: "contain" }}
    />
  );
};
