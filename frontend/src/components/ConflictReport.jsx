export default function ConflictReport({ result, onDismiss }) {
  if (!result) return null;

  const { hasConflicts, summary, conflicts, suggestedWindows } = result;

  const overallStatus = !hasConflicts
    ? 'clear'
    : summary.hard > 0
    ? 'hard'
    : 'soft';

  const statusConfig = {
    clear: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: '✓',
      label: 'No conflicts — all athletes available',
    },
    soft: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: '⚠',
      label: `Soft conflicts detected (${summary.soft} athletes)`,
    },
    hard: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: '✕',
      label: `Hard conflicts detected (${summary.hard} athletes)`,
    },
  };

  const cfg = statusConfig[overallStatus];

  return (
    <div className={`rounded-xl border p-4 space-y-4 ${cfg.bg} ${cfg.border}`}>
      {/* Summary header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${cfg.bg} ${cfg.text}`}>
            {cfg.icon}
          </div>
          <div>
            <p className={`font-semibold ${cfg.text}`}>{cfg.label}</p>
            {summary && (
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-green-400">✓ {summary.clear} clear</span>
                {summary.soft > 0 && <span className="text-xs text-yellow-400">⚠ {summary.soft} soft</span>}
                {summary.hard > 0 && <span className="text-xs text-red-400">✕ {summary.hard} hard</span>}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-slate-400 hover:text-white text-sm">✕</button>
        )}
      </div>

      {/* Conflict list */}
      {conflicts?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Conflict Details</p>
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg px-3 py-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  c.type === 'HARD' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{c.athlete}</p>
                  <p className="text-xs text-slate-400 truncate">{c.reason}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.type === 'HARD'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {c.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested windows */}
      {suggestedWindows?.length > 0 && hasConflicts && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Suggested Alternative Windows
          </p>
          <div className="space-y-2">
            {suggestedWindows.slice(0, 3).map((w, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{w.start} – {w.end}</p>
                  <p className="text-xs text-slate-400">{w.available} athletes available</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">{w.score}</div>
                  <div className="text-xs text-slate-500">score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
