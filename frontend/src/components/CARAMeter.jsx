export default function CARAMeter({ athlete }) {
  const { name, cara_hours, cara_limit, number, year, position } = athlete;
  const pct = Math.min((cara_hours / cara_limit) * 100, 100);
  const remaining = cara_limit - cara_hours;
  const isNearLimit = pct >= 90;
  const isAtLimit = pct >= 100;

  const barColor = isAtLimit
    ? 'bg-red-500'
    : isNearLimit
    ? 'bg-yellow-500'
    : 'bg-green-500';

  const textColor = isAtLimit
    ? 'text-red-400'
    : isNearLimit
    ? 'text-yellow-400'
    : 'text-green-400';

  return (
    <div className={`bg-[#1e2d4a] rounded-xl border p-4 transition-all ${
      isAtLimit ? 'border-red-500/40' : isNearLimit ? 'border-yellow-500/40' : 'border-slate-700/50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
            {number ? `#${number}` : name[0]}
          </div>
          <div>
            <p className="font-medium text-white text-sm">{name}</p>
            <p className="text-xs text-slate-400">{position} · {year}</p>
          </div>
        </div>
        {isAtLimit && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">AT LIMIT</span>
        )}
        {isNearLimit && !isAtLimit && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">NEAR LIMIT</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={`font-medium ${textColor}`}>{cara_hours}h used</span>
          <span className="text-slate-400">{cara_limit}h limit</span>
        </div>
      </div>

      {remaining > 0 && (
        <p className="text-xs text-slate-500 mt-1">{remaining}h remaining this week</p>
      )}
    </div>
  );
}
