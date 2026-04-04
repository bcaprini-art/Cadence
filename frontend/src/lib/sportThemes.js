/**
 * Sport Theme System for Cadence
 * Maps sport strings to visual theme tokens.
 * All patterns are pure CSS — no external images.
 */

const THEMES = {
  football: {
    primary: '#4ade80',
    secondary: '#228B22',
    gradient: 'linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 50%, #0d1f0d 100%)',
    icon: '🏈',
    fieldName: 'Field',
    eventVerb: 'Practice',
    accentClass: 'text-green-400',
    bgClass: 'bg-green-900/20',
    borderClass: 'border-green-600/40',
    pattern: 'football-field',
    heroPattern: `
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 9%,
        rgba(255,255,255,0.06) 9%,
        rgba(255,255,255,0.06) 10%
      ),
      linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 50%, #0d1f0d 100%)
    `,
  },
  basketball: {
    primary: '#FF6B35',
    secondary: '#F7C59F',
    gradient: 'linear-gradient(135deg, #1a0800 0%, #3d1500 50%, #1a0800 100%)',
    icon: '🏀',
    fieldName: 'Court',
    eventVerb: 'Practice',
    accentClass: 'text-orange-400',
    bgClass: 'bg-orange-900/20',
    borderClass: 'border-orange-600/40',
    pattern: 'basketball-court',
    heroPattern: `
      radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,107,53,0.15) 0%, transparent 70%),
      radial-gradient(ellipse 60% 30% at 50% 0%, rgba(255,107,53,0.10) 0%, transparent 70%),
      linear-gradient(135deg, #1a0800 0%, #3d1500 50%, #1a0800 100%)
    `,
  },
  soccer: {
    primary: '#27AE60',
    secondary: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #0a1a0a 100%)',
    icon: '⚽',
    fieldName: 'Pitch',
    eventVerb: 'Practice',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-900/20',
    borderClass: 'border-emerald-600/40',
    pattern: 'soccer-pitch',
    heroPattern: `
      radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.05) 49%, transparent 50%),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 14.2%,
        rgba(255,255,255,0.04) 14.2%,
        rgba(255,255,255,0.04) 14.5%
      ),
      linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #0a1a0a 100%)
    `,
  },
  baseball: {
    primary: '#3B82F6',
    secondary: '#E8D5B7',
    gradient: 'linear-gradient(135deg, #0d1a2e 0%, #1b3a6b 50%, #0d1a2e 100%)',
    icon: '⚾',
    fieldName: 'Diamond',
    eventVerb: 'Practice',
    accentClass: 'text-blue-400',
    bgClass: 'bg-blue-900/20',
    borderClass: 'border-blue-600/40',
    pattern: 'baseball-diamond',
    heroPattern: `
      linear-gradient(45deg, rgba(59,130,246,0.08) 0%, transparent 50%),
      linear-gradient(315deg, rgba(59,130,246,0.08) 0%, transparent 50%),
      linear-gradient(135deg, #0d1a2e 0%, #1b3a6b 50%, #0d1a2e 100%)
    `,
  },
  softball: {
    primary: '#A855F7',
    secondary: '#E8D5B7',
    gradient: 'linear-gradient(135deg, #1a0d2e 0%, #3d1a6b 50%, #1a0d2e 100%)',
    icon: '🥎',
    fieldName: 'Diamond',
    eventVerb: 'Practice',
    accentClass: 'text-purple-400',
    bgClass: 'bg-purple-900/20',
    borderClass: 'border-purple-600/40',
    pattern: 'softball-diamond',
    heroPattern: `
      linear-gradient(45deg, rgba(168,85,247,0.08) 0%, transparent 50%),
      linear-gradient(315deg, rgba(168,85,247,0.08) 0%, transparent 50%),
      linear-gradient(135deg, #1a0d2e 0%, #3d1a6b 50%, #1a0d2e 100%)
    `,
  },
  volleyball: {
    primary: '#FBBF24',
    secondary: '#1D4ED8',
    gradient: 'linear-gradient(135deg, #0d1526 0%, #1d2a4a 50%, #0d1526 100%)',
    icon: '🏐',
    fieldName: 'Gymnasium',
    eventVerb: 'Practice',
    accentClass: 'text-yellow-400',
    bgClass: 'bg-yellow-900/20',
    borderClass: 'border-yellow-600/40',
    pattern: 'volleyball-court',
    heroPattern: `
      linear-gradient(90deg, transparent 49%, rgba(251,191,36,0.1) 49%, rgba(251,191,36,0.1) 51%, transparent 51%),
      linear-gradient(135deg, #0d1526 0%, #1d2a4a 50%, #0d1526 100%)
    `,
  },
  swimming: {
    primary: '#06B6D4',
    secondary: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #051a2e 0%, #0a3a5a 50%, #051a2e 100%)',
    icon: '🏊',
    fieldName: 'Pool',
    eventVerb: 'Swim',
    accentClass: 'text-cyan-400',
    bgClass: 'bg-cyan-900/20',
    borderClass: 'border-cyan-600/40',
    pattern: 'swim-lanes',
    heroPattern: `
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 9.5%,
        rgba(6,182,212,0.12) 9.5%,
        rgba(6,182,212,0.12) 10.5%
      ),
      linear-gradient(135deg, #051a2e 0%, #0a3a5a 50%, #051a2e 100%)
    `,
  },
  track: {
    primary: '#EF4444',
    secondary: '#F59E0B',
    gradient: 'linear-gradient(135deg, #1a0a0a 0%, #3d1010 50%, #1a0a0a 100%)',
    icon: '🏃',
    fieldName: 'Track',
    eventVerb: 'Run',
    accentClass: 'text-red-400',
    bgClass: 'bg-red-900/20',
    borderClass: 'border-red-600/40',
    pattern: 'track-lanes',
    heroPattern: `
      radial-gradient(ellipse 90% 40% at 50% 50%, rgba(239,68,68,0.08) 0%, transparent 70%),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 9%,
        rgba(239,68,68,0.06) 9%,
        rgba(239,68,68,0.06) 9.5%
      ),
      linear-gradient(135deg, #1a0a0a 0%, #3d1010 50%, #1a0a0a 100%)
    `,
  },
  wrestling: {
    primary: '#DC2626',
    secondary: '#D97706',
    gradient: 'linear-gradient(135deg, #1a0505 0%, #3d0d0d 50%, #1a0505 100%)',
    icon: '🤼',
    fieldName: 'Mat',
    eventVerb: 'Practice',
    accentClass: 'text-red-400',
    bgClass: 'bg-red-900/20',
    borderClass: 'border-red-700/40',
    pattern: 'wrestling-mat',
    heroPattern: `
      radial-gradient(circle 40% at 50% 50%, rgba(220,38,38,0.12) 0%, transparent 70%),
      linear-gradient(135deg, #1a0505 0%, #3d0d0d 50%, #1a0505 100%)
    `,
  },
  'ice-hockey': {
    primary: '#60A5FA',
    secondary: '#E2E8F0',
    gradient: 'linear-gradient(135deg, #0d1a2e 0%, #1a2e4a 50%, #0d1a2e 100%)',
    icon: '🏒',
    fieldName: 'Rink',
    eventVerb: 'Skate',
    accentClass: 'text-blue-300',
    bgClass: 'bg-blue-900/20',
    borderClass: 'border-blue-400/40',
    pattern: 'hockey-rink',
    heroPattern: `
      radial-gradient(ellipse 80% 50% at 50% 50%, rgba(96,165,250,0.10) 0%, transparent 70%),
      linear-gradient(90deg, transparent 48%, rgba(96,165,250,0.08) 48%, rgba(96,165,250,0.08) 52%, transparent 52%),
      linear-gradient(135deg, #0d1a2e 0%, #1a2e4a 50%, #0d1a2e 100%)
    `,
  },
  lacrosse: {
    primary: '#A78BFA',
    secondary: '#D97706',
    gradient: 'linear-gradient(135deg, #130d2e 0%, #2d1a6b 50%, #130d2e 100%)',
    icon: '🥍',
    fieldName: 'Field',
    eventVerb: 'Practice',
    accentClass: 'text-violet-400',
    bgClass: 'bg-violet-900/20',
    borderClass: 'border-violet-600/40',
    pattern: 'lacrosse-field',
    heroPattern: `
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 9%,
        rgba(167,139,250,0.06) 9%,
        rgba(167,139,250,0.06) 10%
      ),
      linear-gradient(135deg, #130d2e 0%, #2d1a6b 50%, #130d2e 100%)
    `,
  },
  tennis: {
    primary: '#84CC16',
    secondary: '#FACC15',
    gradient: 'linear-gradient(135deg, #0d1a05 0%, #1a3a0a 50%, #0d1a05 100%)',
    icon: '🎾',
    fieldName: 'Court',
    eventVerb: 'Practice',
    accentClass: 'text-lime-400',
    bgClass: 'bg-lime-900/20',
    borderClass: 'border-lime-600/40',
    pattern: 'tennis-court',
    heroPattern: `
      linear-gradient(90deg, transparent 49%, rgba(132,204,22,0.12) 49%, rgba(132,204,22,0.12) 51%, transparent 51%),
      linear-gradient(0deg, transparent 49%, rgba(132,204,22,0.08) 49%, rgba(132,204,22,0.08) 51%, transparent 51%),
      linear-gradient(135deg, #0d1a05 0%, #1a3a0a 50%, #0d1a05 100%)
    `,
  },
  golf: {
    primary: '#22C55E',
    secondary: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #071a07 0%, #0f3a0f 50%, #071a07 100%)',
    icon: '⛳',
    fieldName: 'Course',
    eventVerb: 'Practice',
    accentClass: 'text-green-400',
    bgClass: 'bg-green-900/20',
    borderClass: 'border-green-500/40',
    pattern: 'golf-course',
    heroPattern: `
      radial-gradient(circle 15% at 70% 40%, rgba(255,255,255,0.05) 0%, transparent 100%),
      linear-gradient(135deg, #071a07 0%, #0f3a0f 50%, #071a07 100%)
    `,
  },
  gymnastics: {
    primary: '#EC4899',
    secondary: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #1a0514 0%, #3d0a2d 50%, #1a0514 100%)',
    icon: '🤸',
    fieldName: 'Gymnasium',
    eventVerb: 'Practice',
    accentClass: 'text-pink-400',
    bgClass: 'bg-pink-900/20',
    borderClass: 'border-pink-600/40',
    pattern: 'gymnastics-floor',
    heroPattern: `
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 24px,
        rgba(236,72,153,0.05) 24px,
        rgba(236,72,153,0.05) 25px
      ),
      linear-gradient(135deg, #1a0514 0%, #3d0a2d 50%, #1a0514 100%)
    `,
  },
  rowing: {
    primary: '#0EA5E9',
    secondary: '#F59E0B',
    gradient: 'linear-gradient(135deg, #051525 0%, #0a2a4a 50%, #051525 100%)',
    icon: '🚣',
    fieldName: 'Water',
    eventVerb: 'Row',
    accentClass: 'text-sky-400',
    bgClass: 'bg-sky-900/20',
    borderClass: 'border-sky-600/40',
    pattern: 'rowing-water',
    heroPattern: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 7px,
        rgba(14,165,233,0.06) 7px,
        rgba(14,165,233,0.06) 8px
      ),
      linear-gradient(135deg, #051525 0%, #0a2a4a 50%, #051525 100%)
    `,
  },
  default: {
    primary: '#22c55e',
    secondary: '#16a34a',
    gradient: 'linear-gradient(135deg, #0a0f1e 0%, #0d1526 100%)',
    icon: '🏆',
    fieldName: 'Venue',
    eventVerb: 'Practice',
    accentClass: 'text-green-400',
    bgClass: 'bg-green-900/20',
    borderClass: 'border-green-500/30',
    pattern: 'default',
    heroPattern: 'linear-gradient(135deg, #0a0f1e 0%, #0d1526 100%)',
  },
};

/**
 * Normalize a sport string to a theme key.
 * "Men's Basketball" → "basketball"
 * "Women's Soccer" → "soccer"
 * "Ice Hockey" → "ice-hockey"
 */
function normalizeSport(sportString) {
  if (!sportString) return 'default';

  const s = sportString.toLowerCase().trim();

  // Remove gendered prefix
  const stripped = s
    .replace(/^(men'?s?|women'?s?|men|women|male|female|co-?ed)\s+/i, '')
    .trim();

  const aliases = {
    basketball: 'basketball',
    'basketball (men)': 'basketball',
    'basketball (women)': 'basketball',
    football: 'football',
    soccer: 'soccer',
    'association football': 'soccer',
    baseball: 'baseball',
    softball: 'softball',
    volleyball: 'volleyball',
    'beach volleyball': 'volleyball',
    swimming: 'swimming',
    'swimming & diving': 'swimming',
    'swimming and diving': 'swimming',
    diving: 'swimming',
    'track and field': 'track',
    'track & field': 'track',
    'cross country': 'track',
    'cross-country': 'track',
    track: 'track',
    wrestling: 'wrestling',
    'ice hockey': 'ice-hockey',
    hockey: 'ice-hockey',
    lacrosse: 'lacrosse',
    tennis: 'tennis',
    golf: 'golf',
    gymnastics: 'gymnastics',
    rowing: 'rowing',
    crew: 'rowing',
  };

  // Direct lookup after stripping
  if (aliases[stripped]) return aliases[stripped];

  // Try partial matches
  for (const [key, theme] of Object.entries(aliases)) {
    if (stripped.includes(key) || key.includes(stripped)) return theme;
  }

  // Try the original string
  if (aliases[s]) return aliases[s];
  for (const [key, theme] of Object.entries(aliases)) {
    if (s.includes(key) || key.includes(s)) return theme;
  }

  return 'default';
}

/**
 * Get the full theme object for a sport string.
 * Falls back to 'default' if no match.
 */
export function getSportTheme(sportString) {
  const key = normalizeSport(sportString);
  return THEMES[key] || THEMES.default;
}

/**
 * Get the theme for a specific sport card in the picker
 * (used in Register.jsx to preview a sport's color before user logs in).
 */
export function getSportThemeByName(sportName) {
  return getSportTheme(sportName);
}

export default THEMES;
