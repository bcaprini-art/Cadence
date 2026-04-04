const SPORTS = [
  // ── Fall Sports ──────────────────────────────────────────────
  { id: 'football-m',          name: 'Football',              icon: '🏈', gender: 'M',     season: 'fall'   },
  { id: 'soccer-m',            name: "Men's Soccer",          icon: '⚽', gender: 'M',     season: 'fall'   },
  { id: 'soccer-w',            name: "Women's Soccer",        icon: '⚽', gender: 'W',     season: 'fall'   },
  { id: 'volleyball-w',        name: "Women's Volleyball",    icon: '🏐', gender: 'W',     season: 'fall'   },
  { id: 'cross-country-m',     name: "Men's Cross Country",   icon: '🏃', gender: 'M',     season: 'fall'   },
  { id: 'cross-country-w',     name: "Women's Cross Country", icon: '🏃', gender: 'W',     season: 'fall'   },
  { id: 'field-hockey-w',      name: 'Field Hockey',          icon: '🏑', gender: 'W',     season: 'fall'   },
  { id: 'equestrian-w',        name: 'Equestrian',            icon: '🐎', gender: 'W',     season: 'fall'   },
  { id: 'water-polo-m',        name: "Men's Water Polo",      icon: '🤽', gender: 'M',     season: 'fall'   },

  // ── Winter Sports ─────────────────────────────────────────────
  { id: 'basketball-m',        name: "Men's Basketball",      icon: '🏀', gender: 'M',     season: 'winter' },
  { id: 'basketball-w',        name: "Women's Basketball",    icon: '🏀', gender: 'W',     season: 'winter' },
  { id: 'wrestling-m',         name: 'Wrestling',             icon: '🤼', gender: 'M',     season: 'winter' },
  { id: 'swimming-m',          name: "Men's Swimming & Diving",   icon: '🏊', gender: 'M', season: 'winter' },
  { id: 'swimming-w',          name: "Women's Swimming & Diving", icon: '🏊', gender: 'W', season: 'winter' },
  { id: 'gymnastics-m',        name: "Men's Gymnastics",      icon: '🤸', gender: 'M',     season: 'winter' },
  { id: 'gymnastics-w',        name: "Women's Gymnastics",    icon: '🤸', gender: 'W',     season: 'winter' },
  { id: 'ice-hockey-m',        name: "Men's Ice Hockey",      icon: '🏒', gender: 'M',     season: 'winter' },
  { id: 'ice-hockey-w',        name: "Women's Ice Hockey",    icon: '🏒', gender: 'W',     season: 'winter' },
  { id: 'water-polo-w',        name: "Women's Water Polo",    icon: '🤽', gender: 'W',     season: 'winter' },
  { id: 'fencing-mixed',       name: 'Fencing',               icon: '🤺', gender: 'mixed', season: 'winter' },
  { id: 'skiing-mixed',        name: 'Skiing',                icon: '⛷️', gender: 'mixed', season: 'winter' },
  { id: 'rifle-mixed',         name: 'Rifle',                 icon: '🎯', gender: 'mixed', season: 'winter' },
  { id: 'bowling-w',           name: "Women's Bowling",       icon: '🎳', gender: 'W',     season: 'winter' },

  // ── Spring Sports ─────────────────────────────────────────────
  { id: 'baseball-m',          name: 'Baseball',              icon: '⚾', gender: 'M',     season: 'spring' },
  { id: 'softball-w',          name: 'Softball',              icon: '🥎', gender: 'W',     season: 'spring' },
  { id: 'tennis-m',            name: "Men's Tennis",          icon: '🎾', gender: 'M',     season: 'spring' },
  { id: 'tennis-w',            name: "Women's Tennis",        icon: '🎾', gender: 'W',     season: 'spring' },
  { id: 'track-m',             name: "Men's Track & Field",   icon: '🏃', gender: 'M',     season: 'spring' },
  { id: 'track-w',             name: "Women's Track & Field", icon: '🏃', gender: 'W',     season: 'spring' },
  { id: 'golf-m',              name: "Men's Golf",            icon: '⛳', gender: 'M',     season: 'spring' },
  { id: 'golf-w',              name: "Women's Golf",          icon: '⛳', gender: 'W',     season: 'spring' },
  { id: 'lacrosse-m',          name: "Men's Lacrosse",        icon: '🥍', gender: 'M',     season: 'spring' },
  { id: 'lacrosse-w',          name: "Women's Lacrosse",      icon: '🥍', gender: 'W',     season: 'spring' },
  { id: 'rowing-w',            name: "Women's Rowing",        icon: '🚣', gender: 'W',     season: 'spring' },
  { id: 'volleyball-m',        name: "Men's Volleyball",      icon: '🏐', gender: 'M',     season: 'spring' },
  { id: 'beach-volleyball-w',  name: 'Beach Volleyball',      icon: '🏖️', gender: 'W',     season: 'spring' },
  { id: 'triathlon-w',         name: 'Triathlon',             icon: '🏅', gender: 'W',     season: 'spring' },
]

module.exports = { SPORTS }
