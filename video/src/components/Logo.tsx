// ivangel brand lockup for video: the dove mark (public/dove-mark.png, copied
// from the app) above the "ivangel" wordmark in Playfair, mirroring the app's
// shared Logo component. `height` sizes the dove glyph; the wordmark scales from it.
import React from "react";
import { Img, staticFile } from "remotion";
import { palette } from "../theme";
import { playfairDisplay } from "../fonts";

export const Logo: React.FC<{ height?: number }> = ({ height = 170 }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: height * 0.1,
      }}
    >
      <Img
        src={staticFile("dove-mark.png")}
        style={{ height, width: height, objectFit: "contain" }}
      />
      <span
        style={{
          fontFamily: playfairDisplay,
          fontWeight: 700,
          fontSize: height * 0.62,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: palette.earth,
        }}
      >
        ivangel
      </span>
    </div>
  );
};
