export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'pt': 'Portuguese',
  'de': 'German',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ar': 'Arabic',
  'fa': 'Persian (Farsi)',
  'pl': 'Polish',
  'uk': 'Ukrainian',
  'it': 'Italian',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ro': 'Romanian',
  'pa': 'Punjabi',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'gu': 'Gujarati',
  'cy': 'Welsh',
  'lt': 'Lithuanian',
};

export const LANGUAGE_NATIVE: Record<string, string> = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'pt': 'Português',
  'de': 'Deutsch',
  'ko': '한국어',
  'zh': '简体中文',
  'zh-TW': '繁體中文',
  'ar': 'العربية',
  'fa': 'فارسی',
  'pl': 'Polski',
  'uk': 'Українська',
  'it': 'Italiano',
  'ru': 'Русский',
  'ja': '日本語',
  'ro': 'Română',
  'pa': 'ਪੰਜਾਬੀ',
  'ur': 'اردو',
  'bn': 'বাংলা',
  'gu': 'ગુજરાતી',
  'cy': 'Cymraeg',
  'lt': 'Lietuvių',
};

export const getSortedLanguages = (): [string, string][] => {
  const entries = Object.entries(LANGUAGE_NAMES);
  const english = entries.filter(([code]) => code === 'en') as [string, string][];
  const others = entries
    .filter(([code]) => code !== 'en')
    .sort((a, b) => a[1].localeCompare(b[1])) as [string, string][];
  return [...english, ...others];
};
