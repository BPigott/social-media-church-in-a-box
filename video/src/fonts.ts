// Shared font loading — import fontFamily strings from here, never use @import url().
// Matches the app: Playfair Display (headings) + Inter (body).
import { loadFont as loadPlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: playfairDisplay } = loadPlayfairDisplay();
export const { fontFamily: inter } = loadInter();
