// Registry of all how-to video storyboards.
// Add new entries here when a new storyboard JSON is created.
import type { Manifest } from "../manifest";
import onboarding from "./onboarding.json";
import dashboard from "./dashboard.json";
import editTranslate from "./edit-translate.json";
import library from "./library.json";
import styleGuide from "./style-guide.json";
import overview from "./overview.json";

export interface StoryboardEntry {
  id: string;       // Remotion Composition id (used in `remotion render ... <id>`)
  storyboard: Manifest;
}

export const STORYBOARDS: StoryboardEntry[] = [
  { id: "IvangelOnboarding", storyboard: onboarding as unknown as Manifest },
  { id: "IvangelDashboard",     storyboard: dashboard as unknown as Manifest },
  { id: "IvangelEditTranslate", storyboard: editTranslate as unknown as Manifest },
  { id: "IvangelLibrary",       storyboard: library as unknown as Manifest },
  { id: "IvangelStyleGuide",    storyboard: styleGuide as unknown as Manifest },
  { id: "IvangelOverview",      storyboard: overview as unknown as Manifest },
];
