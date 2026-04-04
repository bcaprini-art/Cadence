import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { scheduleAPI, teamAPI } from '../../lib/api';
import { addDays, startOfWeek, format, parseISO } from 'date-fns';

const SLOTS = Array.from({ length: 32 }, (_, i) => {
  const hour = 6 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

function pctColor(pct, theme) {
  if (pct >= 90) return { bg: theme.primary, opacity: 0.9 };
  if (pct >= 70) return { bg: '#FBBF24', opacity: 0.85 };
  if (pct >= 40) return { bg: '#F97316', opacity: 0.85 };
  return { bg: '#EF4444', opacity: 0.85 };
}

/**
 * Build a heatmap structure from raw schedule blocks.
 */
function buildHeatmap(blocks, days, totalAthletes) {
  const heatmap = {};
  for (const day of days) {
    const dateKey = format(day, 'yyyy-MM-dd');
    heatmap[dateKey] = {};
    for (const slot of SLOTS) {
      heatmap[dateKey][slot] = {
        available: totalAthletes,
        total: totalAthletes,
        pct: totalAthletes > 0 ? 100 : 0,
        unavailable: [],
      };
    }
  }

  for (const block of blocks) {
    const blockStart = new Date(block.start);
    const blockEnd = new Date(block.end);
    const dateKey = format(blockStart, 'yyyy-MM-dd');

    if (!heatmap[dateKey]) continue;

    for (const slot of SLOTS) {
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const slotStart = new Date(blockStart);
      slotStart.setHours(slotHour, slotMin, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      if (blockStart < slotEnd && blockEnd > slotStart) {
        const cell = heatmap[dateKey][slot];
        const alreadyCounted = cell.unavailable.some((u) => u.id === block.userId);
        if (!alreadyCounted) {
          cell.available = Math.max(0, cell.available - 1);
          cell.pct = totalAthletes > 0 ? Math.round((cell.available / cell.total) * 100) : 0;
          cell.unavailable.push({
            id: block.userId,
            name: block.user?.name || 'Athlete',
            reason: block.visibility === 'BUSY' ? 'BUSY' : block.type,
          });
        }
      }
    }
  }

  return heatmap;
}

export default function TeamAvailability() {
  const { logout } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const [weekOffset, setWeekOffset] = useState(0);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [heatmapData, setHeatmapData] = useState({});
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    teamAPI.getTeams()
      .then(({ data }) => {
        setTeams(data);
        if (data.length > 0) setSelectedTeam(data[0]);
      })
      .catch(() => setError('Failed to load teams'));
  }, []);

  const fetchHeatmap = useCallback(async () => {
    if (!selectedTeam) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const memberCount = selectedTeam._count?.members ?? selectedTeam.members?.length ?? 0;
      setTotalAthletes(memberCount);

      const { data: blocks } = await scheduleAPI.getBlocks({
        teamId: selectedTeam.id,
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      });

      const hm = buildHeatmap(blocks, days, memberCount);
      setHeatmapData(hm);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load availability data');
      setHeatmapData({});
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Sport-themed page header strip */}
      <div
        className="px-6 py-5 relative overflow-hidden"
        style={{ background: theme.gradient }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: theme.heroPattern }}
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>{theme.icon}</span>
                Team Availability Heatmap
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Click any slot to see who's available. {theme.fieldName} booking ready.
              </p>
            </div>
            <button
              onClick={() => navigate('/schedule-event')}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-colors"
              style={{ backgroundColor: theme.primary }}
            >
              + Schedule Event
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Team picker + week nav */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {teams.length > 1 && (
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const t = teams.find((x) => x.id === e.target.value);
                setSelectedTeam(t || null);
              }}
              className="bg-[#0d1526] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ '--tw-ring-color': theme.primary }}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.sport}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="px-3 py-2 bg-[#0d1526] border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white"
            >
              ← Prev
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 bg-[#0d1526] border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white"
            >
              This Week
            </button>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="px-3 py-2 bg-[#0d1526] border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white"
            >
              Next →
            </button>
            <span className="text-xs text-gray-500 ml-1">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}
            </span>
          </div>
        </div>

        {/* Legend — uses sport primary for top tier */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 flex-wrap">
          <span>Availability:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: theme.primary }} />
            90–100%
          </span>
          {[['#FBBF24', '70–89%'], ['#F97316', '40–69%'], ['#EF4444', '<40%']].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: c }} />{l}
            </span>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchHeatmap} className="text-xs underline">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 text-sm animate-pulse">Loading availability…</div>
          </div>
        ) : (
          <>
            {Object.keys(heatmapData).length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No availability data found for this week.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Day headers */}
                  <div className="flex ml-14 mb-1">
                    {days.map((d) => (
                      <div key={d.toISOString()} className="w-20 text-center text-xs text-gray-400 font-medium">
                        <div>{format(d, 'EEE')}</div>
                        <div className="text-gray-500">{format(d, 'MMM d')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Slots */}
                  {SLOTS.map((slot, si) => (
                    <div key={slot} className="flex items-center mb-0.5">
                      <div className="w-14 text-right pr-2 text-xs text-gray-500 flex-shrink-0">
                        {si % 2 === 0 ? slot : ''}
                      </div>
                      {days.map((d) => {
                        const dateKey = format(d, 'yyyy-MM-dd');
                        const cell = heatmapData[dateKey]?.[slot];
                        const pct = cell?.pct ?? 100;
                        const isSelected = selected?.date === dateKey && selected?.slot === slot;
                        const colorInfo = pctColor(pct, theme);
                        return (
                          <div
                            key={dateKey}
                            onClick={() => setSelected(isSelected ? null : { date: dateKey, slot, cell })}
                            className={`w-20 h-4 mx-0.5 rounded-sm cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: colorInfo.bg, opacity: isSelected ? 1 : colorInfo.opacity }}
                            title={`${pct}% available`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected slot detail */}
        {selected && selected.cell && (
          <div className="mt-6 bg-[#0d1526] rounded-xl border border-white/10 p-5 max-w-md"
            style={{ borderColor: `${theme.primary}30` }}>
            <h3 className="font-semibold mb-1">
              {format(new Date(selected.date), 'EEEE, MMM d')} at {selected.slot}
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              {selected.cell.available} of {selected.cell.total} athletes available ({selected.cell.pct}%)
            </p>
            {selected.cell.unavailable?.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mb-2">Unavailable:</p>
                <div className="space-y-1">
                  {selected.cell.unavailable.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{a.name}</span>
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{a.reason}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={() => navigate('/schedule-event')}
              className="mt-4 w-full py-2 rounded-lg text-sm font-semibold text-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.primary }}
            >
              Schedule {theme.eventVerb} at this time
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
