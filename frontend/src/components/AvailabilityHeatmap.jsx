import { useState } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';

const HOURS = Array.from({ length: 32 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { label: `${h % 12 || 12}:${m.toString().padStart(2, '0')}${h < 12 ? 'a' : 'p'}`, h, m };
});

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pctColor(pct) {
  if (pct >= 100) return 'bg-green-500 hover:bg-green-400';
  if (pct >= 90) return 'bg-green-600 hover:bg-green-500';
  if (pct >= 70) return 'bg-yellow-500 hover:bg-yellow-400';
  if (pct >= 50) return 'bg-orange-500 hover:bg-orange-400';
  return 'bg-red-500 hover:bg-red-400';
}

function pctTextColor(pct) {
  if (pct >= 70) return 'text-white';
  return 'text-white';
}

export default function AvailabilityHeatmap({ heatmapData = {} }) {
  const [selected, setSelected] = useState(null);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleCellClick = (dayKey, slotKey) => {
    const cell = heatmapData[dayKey]?.[slotKey];
    if (!cell) return;
    setSelected({ dayKey, slotKey, cell });
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
        <span className="font-medium text-slate-300">Team availability:</span>
        {[
          { color: 'bg-green-500', label: '100%' },
          { color: 'bg-yellow-500', label: '70–99%' },
          { color: 'bg-orange-500', label: '50–69%' },
          { color: 'bg-red-500', label: '<50%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-slate-700/50 overflow-auto">
        <div className="inline-grid min-w-full" style={{ gridTemplateColumns: '56px repeat(7, minmax(80px, 1fr))' }}>
          {/* Header row */}
          <div className="h-10 border-b border-r border-slate-700/50 sticky top-0 bg-[#0f172a] z-10" />
          {days.map((day, i) => (
            <div
              key={i}
              className="h-10 flex flex-col items-center justify-center border-b border-r border-slate-700/50 last:border-r-0 sticky top-0 bg-[#0f172a] z-10"
            >
              <span className="text-xs font-medium text-slate-400">{DAY_LABELS[i]}</span>
              <span className="text-xs text-slate-500">{format(day, 'M/d')}</span>
            </div>
          ))}

          {/* Time rows */}
          {HOURS.map(({ label, h, m }, si) => {
            const slotKey = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            const showLabel = m === 0; // Only show label on the hour

            return (
              <>
                <div
                  key={`label-${si}`}
                  className="h-7 flex items-center justify-end pr-2 border-b border-r border-slate-700/20 text-slate-500"
                  style={{ fontSize: '10px' }}
                >
                  {showLabel ? label : ''}
                </div>
                {days.map((day, di) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const cell = heatmapData[dayKey]?.[slotKey];
                  const pct = cell?.pct ?? 100;
                  const isSelected = selected?.dayKey === dayKey && selected?.slotKey === slotKey;

                  return (
                    <div
                      key={`${si}-${di}`}
                      className={`h-7 border-b border-r border-slate-700/20 last:border-r-0 cursor-pointer transition-all ${
                        pctColor(pct)
                      } ${isSelected ? 'ring-2 ring-white/50 ring-inset' : ''}`}
                      onClick={() => handleCellClick(dayKey, slotKey)}
                      title={`${pct}% available (${cell?.available ?? 0}/${cell?.total ?? 0})`}
                    />
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      {/* Cell detail panel */}
      {selected && (
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-white">
                {format(new Date(selected.dayKey), 'EEEE, MMM d')} · {selected.slotKey}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {selected.cell.available}/{selected.cell.total} athletes available ({selected.cell.pct}%)
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {selected.cell.unavailable?.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Unavailable</p>
              <div className="flex flex-wrap gap-2">
                {selected.cell.unavailable.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 bg-[#0f172a] rounded-lg px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">
                      {a.name[0]}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{a.name}</p>
                      <p className="text-xs text-slate-500">BUSY</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-green-400">✓ All athletes available</p>
          )}
        </div>
      )}
    </div>
  );
}
