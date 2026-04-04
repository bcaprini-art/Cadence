import { startOfWeek, addDays, format, parseISO, differenceInMinutes, isToday } from 'date-fns';

const BLOCK_COLORS = {
  CLASS: 'bg-blue-500/80 border-blue-400',
  STUDY: 'bg-purple-500/80 border-purple-400',
  PERSONAL: 'bg-orange-500/80 border-orange-400',
  ATHLETIC: 'bg-green-500/80 border-green-400',
  PRACTICE: 'bg-green-600/80 border-green-500',
  GAME: 'bg-red-500/80 border-red-400',
  TRAVEL: 'bg-yellow-500/80 border-yellow-400',
  FILM: 'bg-indigo-500/80 border-indigo-400',
  MEETING: 'bg-teal-500/80 border-teal-400',
};

const BLOCK_LABELS = {
  CLASS: 'Class',
  STUDY: 'Study',
  PERSONAL: 'Personal',
  ATHLETIC: 'Athletic',
  PRACTICE: 'Practice',
  GAME: 'Game',
  TRAVEL: 'Travel',
  FILM: 'Film',
  MEETING: 'Meeting',
};

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function BlockBar({ block, dayStart }) {
  const blockStart = parseISO(block.start);
  const blockEnd = parseISO(block.end);

  const startOffset = differenceInMinutes(blockStart, dayStart);
  const duration = differenceInMinutes(blockEnd, blockStart);

  // Each hour = 48px. Each minute = 48/60 px
  const PX_PER_MIN = 48 / 60;
  const top = startOffset * PX_PER_MIN;
  const height = Math.max(duration * PX_PER_MIN, 20);

  const colorClass = BLOCK_COLORS[block.type] || 'bg-slate-500/80 border-slate-400';
  const label = block.title || BLOCK_LABELS[block.type] || block.type;

  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all ${colorClass}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${label} (${format(blockStart, 'h:mm a')} – ${format(blockEnd, 'h:mm a')})`}
    >
      <p className="text-xs font-medium text-white truncate leading-tight pt-0.5">{label}</p>
      {height > 30 && (
        <p className="text-xs text-white/70 truncate">
          {format(blockStart, 'h:mm')}–{format(blockEnd, 'h:mm a')}
        </p>
      )}
    </div>
  );
}

export default function WeeklyCalendar({ weekOffset = 0, blocks = [], events = [], onCellClick }) {
  const today = new Date();
  const weekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Day headers */}
      <div className="grid border-b border-slate-700/50" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
        <div className="p-2 border-r border-slate-700/50" />
        {days.map((day, i) => (
          <div
            key={i}
            className={`p-2 text-center border-r border-slate-700/50 last:border-r-0 ${
              isToday(day) ? 'bg-green-500/10' : ''
            }`}
          >
            <div className={`text-xs font-medium ${isToday(day) ? 'text-green-400' : 'text-slate-400'}`}>
              {DAY_LABELS[i]}
            </div>
            <div className={`text-sm font-bold ${isToday(day) ? 'text-green-400' : 'text-white'}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid relative" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
          {/* Time column */}
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-12 flex items-start justify-end pr-2 pt-1 text-xs text-slate-500 border-b border-slate-700/30"
              >
                {format(new Date(2024, 0, 1, h), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            const dayStart = new Date(day);
            dayStart.setHours(6, 0, 0, 0);

            const dayBlocks = blocks.filter((b) => {
              const bStart = parseISO(b.start);
              return format(bStart, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
            });

            const dayEvents = events.filter((e) => {
              const eStart = parseISO(e.start);
              return format(eStart, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
            });

            return (
              <div
                key={di}
                className={`relative border-r border-slate-700/50 last:border-r-0 ${
                  isToday(day) ? 'bg-green-500/5' : ''
                }`}
                style={{ height: `${HOURS.length * 48}px` }}
              >
                {/* Hour lines */}
                {HOURS.map((h, hi) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-slate-700/30"
                    style={{ top: `${hi * 48}px`, height: '48px' }}
                    onClick={() => onCellClick?.({ day, hour: h })}
                  />
                ))}

                {/* Blocks */}
                {dayBlocks.map((b) => (
                  <BlockBar key={b.id} block={b} dayStart={dayStart} />
                ))}

                {/* Events */}
                {dayEvents.map((e) => (
                  <BlockBar key={e.id} block={e} dayStart={dayStart} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
