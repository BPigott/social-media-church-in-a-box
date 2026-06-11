/**
 * Single source of truth for all how-to video embeds.
 * Import TUTORIALS (or getTutorial) wherever a VideoCard or VideoDialog needs
 * a video URL — never hard-code storage paths elsewhere.
 *
 * URLs are constructed from VITE_SUPABASE_URL so they work across all
 * environments (local dev against prod Supabase, staging, production).
 */

export interface Tutorial {
  id: string;
  title: string;
  blurb: string;
  category: 'onboarding' | 'how-to' | 'overview';
  src: string;      // public CDN URL for the MP4
  poster: string;   // public CDN URL for the branded thumbnail (carries title + duration)
  /** Only hosted, verified videos should be true — the Help grid filters by this. */
  published: boolean;
}

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/help-videos`;

// Bump when a poster image is re-uploaded so browsers fetch the new file
// instead of serving a stale cached one at the same URL.
const POSTER_V = "3";

export const TUTORIALS: Tutorial[] = [
  {
    id: 'onboarding',
    title: 'Set up your church',
    blurb: 'Walk through the four-step onboarding: church details, website, sermons, and your voice profile.',
    category: 'onboarding',
    src: `${BASE}/onboarding.mp4`,
    poster: `${BASE}/onboarding.jpg?v=${POSTER_V}`,
    published: true,
  },
  {
    id: 'dashboard',
    title: 'Generate your first posts',
    blurb: 'See how to choose content types, paste a sermon, pick platforms, and generate a full set of social posts.',
    category: 'how-to',
    src: `${BASE}/dashboard.mp4`,
    poster: `${BASE}/dashboard.jpg?v=${POSTER_V}`,
    published: true,
  },
  {
    id: 'overview',
    title: 'ivangel in 60 seconds',
    blurb: 'A quick tour of what ivangel does and how a sermon becomes a week of content.',
    category: 'overview',
    src: `${BASE}/overview.mp4`,
    poster: `${BASE}/overview.jpg?v=${POSTER_V}`,
    published: false,
  },
  {
    id: 'edit-translate',
    title: 'Edit, translate & refine',
    blurb: 'Edit your generated content inline, add a language, and retranslate with one click.',
    category: 'how-to',
    src: `${BASE}/edit-translate.mp4`,
    poster: `${BASE}/edit-translate.jpg?v=${POSTER_V}`,
    published: false,
  },
  {
    id: 'library',
    title: 'Your content library',
    blurb: 'Browse, search, and download every piece of content ivangel has ever generated for your church.',
    category: 'how-to',
    src: `${BASE}/library.mp4`,
    poster: `${BASE}/library.jpg?v=${POSTER_V}`,
    published: false,
  },
  {
    id: 'style-guide',
    title: 'Style guide & settings',
    blurb: 'Review and edit your voice profile, update church details, and re-crawl your website.',
    category: 'how-to',
    src: `${BASE}/style-guide.mp4`,
    poster: `${BASE}/style-guide.jpg?v=${POSTER_V}`,
    published: false,
  },
];

export function getTutorial(id: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
