/**
 * Sport Theme System for Cadence Mobile
 * Ported from web app — CSS-specific properties (gradient strings) are
 * excluded or adapted for React Native usage.
 */

const THEMES = {
  football: {
    primary: '#4ade80',
    secondary: '#228B22',
    icon: '🏈',
    fieldName: 'Field',
    eventVerb: 'Practice',
  },
  basketball: {
    primary: '#FF6B35',
    secondary: '#F7C59F',
    icon: '🏀',
    fieldName: 'Court',
    eventVerb: 'Practice',
  },
  soccer: {
    primary: '#27AE60',
    secondary: '#FFFFFF',
    icon: '⚽',
    fieldName: 'Pitch',
    eventVerb: 'Practice',
  },
  baseball: {
    primary: '#3B82F6',
    secondary: '#E8D5B7',
    icon: '⚾',
    fieldName: 'Diamond',
    eventVerb: 'Practice',
  },
  softball: {
    primary: '#A855F7',
    secondary: '#E8D5B7',
    icon: '🥎',
    fieldName: 'Diamond',
    eventVerb: 'Practice',
  },
  volleyball: {
    primary: '#FBBF24',
    secondary: '#1D4ED8',
    icon: '🏐',
    fieldName: 'Gymnasium',
    eventVerb: 'Practice',
  },
  swimming: {
    primary: '#06B6D4',
    secondary: '#0EA5E9',
    icon: '🏊',
    fieldName: 'Pool',
    eventVerb: 'Swim',
  },
  track: {
    primary: '#EF4444',
    secondary: '#F59E0B',
    icon: '🏃',
    fieldName: 'Track',
    eventVerb: 'Run',
  },
  wrestling: {
    primary: '#DC2626',
    secondary: '#D97706',
    icon: '🤼',
    fieldName: 'Mat',
    eventVerb: 'Practice',
  },
  'ice-hockey': {
    primary: '#60A5FA',
    secondary: '#E2E8F0',
    icon: '🏒',
    fieldName: 'Rink',
    eventVerb: 'Skate',
  },
  lacrosse: {
    primary: '#A78BFA',
    secondary: '#D97706',
    icon: '🥍',
    fieldName: 'Field',
    eventVerb: 'Practice',
  },
  tennis: {
    primary: '#84CC16',
    secondary: '#FACC15',
    icon: '🎾',
    fieldName: 'Court',
    eventVerb: 'Practice',
  },
  golf: {
    primary: '#22C55E',
    secondary: '#FFFFFF',
    icon: '⛳',
    fieldName: 'Course',
    eventVerb: 'Practice',
  },
  gymnastics: {
    primary: '#EC4899',
    secondary: '#8B5CF6',
    icon: '🤸',
    fieldName: 'Gymnasium',
    eventVerb: 'Practice',
  },
  rowing: {
    primary: '#0EA5E9',
    secondary: '#F59E0B',
    icon: '🚣',
    fieldName: 'Water',
    eventVerb: 'Row',
  },
  default: {
    primary: '#22c55e',
    secondary: '#16a34a',
    icon: '🏆',
    fieldName: 'Venue',
    eventVerb: 'Practice',
  },
};

function normalizeSport(sportString) {
  if (!sportString) return 'default';
  const s = sportString.toLowerCase().trim();
  const stripped = s
    .replace(/^(men'?s?|women'?s?|men|women|male|female|co-?ed)\s+/i, '')
    .trim();

  const aliases = {
    basketball: 'basketball',
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

  if (aliases[stripped]) return aliases[stripped];
  for (const [key, theme] of Object.entries(aliases)) {
    if (stripped.includes(key) || key.includes(stripped)) return theme;
  }
  if (aliases[s]) return aliases[s];
  for (const [key, theme] of Object.entries(aliases)) {
    if (s.includes(key) || key.includes(s)) return theme;
  }
  return 'default';
}

export function getSportTheme(sportString) {
  const key = normalizeSport(sportString);
  return THEMES[key] || THEMES.default;
}

export function getSportThemeByName(sportName) {
  return getSportTheme(sportName);
}

export default THEMES;
