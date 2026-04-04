import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Determine the current academic season and week number.
 */
function getSeasonInfo() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  let season, seasonStart;

  if (month >= 8 && month <= 11) {
    season = 'Fall';
    seasonStart = new Date(now.getFullYear(), 7, 1); // Aug 1
  } else if (month === 12 || month <= 2) {
    season = 'Winter';
    const year = month === 12 ? now.getFullYear() : now.getFullYear() - 1;
    seasonStart = new Date(year, 11, 1); // Dec 1
  } else {
    season = 'Spring';
    seasonStart = new Date(now.getFullYear(), 2, 1); // Mar 1
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNum = Math.max(1, Math.ceil((now - seasonStart) / msPerWeek));

  return { season, weekNum };
}

const SEASON_BADGE = {
  Fall:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  Winter: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Spring: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

export default function SportHeroBanner() {
  const theme = useTheme();
  const { user } = useAuth();
  const { season, weekNum } = getSeasonInfo();

  if (!user) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden relative mb-6"
      style={{ minHeight: 110 }}
    >
      {/* Background: hero pattern */}
      <div
        className="absolute inset-0"
        style={{ background: theme.heroPattern || theme.gradient }}
        aria-hidden="true"
      />

      {/* Subtle vignette for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.25) 100%)'
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        {/* Sport identity */}
        <div className="flex items-center gap-4">
          <span className="text-5xl drop-shadow-lg" role="img" aria-label={user.sport}>
            {theme.icon}
          </span>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight drop-shadow">
              {user.sport || 'Athletics'}
            </h2>
            <p className="text-sm text-white/70 mt-0.5">
              {user.school || 'Your Program'}
            </p>
          </div>
        </div>

        {/* Season info */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${SEASON_BADGE[season]}`}>
            {season} Season
          </span>
          <span className="text-xs text-white/60 bg-black/20 px-3 py-1.5 rounded-full font-medium">
            Week {weekNum}
          </span>
          <span className="text-xs text-white/60 bg-black/20 px-3 py-1.5 rounded-full font-medium">
            {theme.fieldName}
          </span>
        </div>
      </div>

      {/* Accent bottom border using sport primary */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ backgroundColor: theme.primary }}
        aria-hidden="true"
      />
    </div>
  );
}
