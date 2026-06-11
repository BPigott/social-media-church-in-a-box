// Remotion render config. See https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// The captured screenshots are large PNGs; allow generous concurrency headroom.
Config.setConcurrency(null);
