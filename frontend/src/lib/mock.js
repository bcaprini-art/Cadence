import { addDays, startOfWeek, setHours, setMinutes, format } from 'date-fns';

export const mockUser = {
  id: 'u1',
  name: 'Jordan Mitchell',
  email: 'jordan@state.edu',
  role: 'athlete',
  sport: 'Basketball',
  team_id: 't1',
  school_id: 's1',
  school: 'State University',
};

export const mockCoach = {
  id: 'u2',
  name: 'Coach Rivera',
  email: 'rivera@state.edu',
  role: 'coach',
  sport: 'Basketball',
  team_id: 't1',
  school_id: 's1',
  school: 'State University',
};

const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

export const mockBlocks = [
  {
    id: 'b1',
    title: 'ECON 201',
    type: 'CLASS',
    start: setMinutes(setHours(weekStart, 9), 0).toISOString(),
    end: setMinutes(setHours(weekStart, 10), 30).toISOString(),
    is_hard_block: true,
    visibility: 'BUSY',
    source: 'MANUAL',
  },
  {
    id: 'b2',
    title: 'Study Hall',
    type: 'STUDY',
    start: setMinutes(setHours(weekStart, 13), 0).toISOString(),
    end: setMinutes(setHours(weekStart, 15), 0).toISOString(),
    is_hard_block: false,
    visibility: 'PUBLIC',
    source: 'MANUAL',
  },
  {
    id: 'b3',
    title: 'HIST 110',
    type: 'CLASS',
    start: setMinutes(setHours(addDays(weekStart, 1), 11), 0).toISOString(),
    end: setMinutes(setHours(addDays(weekStart, 1), 12), 15).toISOString(),
    is_hard_block: true,
    visibility: 'BUSY',
    source: 'MANUAL',
  },
  {
    id: 'b4',
    title: 'Gym',
    type: 'PERSONAL',
    start: setMinutes(setHours(addDays(weekStart, 2), 7), 0).toISOString(),
    end: setMinutes(setHours(addDays(weekStart, 2), 8), 0).toISOString(),
    is_hard_block: false,
    visibility: 'PRIVATE',
    source: 'MANUAL',
  },
];

export const mockEvents = [
  {
    id: 'e1',
    title: 'Morning Practice',
    type: 'PRACTICE',
    start: setMinutes(setHours(weekStart, 6), 0).toISOString(),
    end: setMinutes(setHours(weekStart, 8), 0).toISOString(),
    venue: { name: 'Main Gymnasium' },
    created_by: 'Coach Rivera',
  },
  {
    id: 'e2',
    title: 'Film Session',
    type: 'FILM',
    start: setMinutes(setHours(addDays(weekStart, 2), 16), 0).toISOString(),
    end: setMinutes(setHours(addDays(weekStart, 2), 17), 30).toISOString(),
    venue: { name: 'Film Room' },
    created_by: 'Coach Rivera',
  },
  {
    id: 'e3',
    title: 'vs. Riverside College',
    type: 'GAME',
    start: setMinutes(setHours(addDays(weekStart, 4), 19), 0).toISOString(),
    end: setMinutes(setHours(addDays(weekStart, 4), 21), 30).toISOString(),
    venue: { name: 'Home Arena' },
    created_by: 'Coach Rivera',
  },
  {
    id: 'e4',
    title: 'Travel Day',
    type: 'TRAVEL',
    start: setMinutes(setHours(addDays(weekStart, 3), 8), 0).toISOString(),
    end: setMinutes(setHours(addDays(weekStart, 3), 18), 0).toISOString(),
    venue: { name: 'Away' },
    created_by: 'Coach Rivera',
  },
  {
    id: 'e5',
    title: 'Team Meeting',
    type: 'MEETING',
    start: setMinutes(setHours(addDays(weekStart, 1), 15), 0).toISOString(),
    end: setMinutes(setHours(addDays(weekStart, 1), 16), 0).toISOString(),
    venue: { name: 'Meeting Room A' },
    created_by: 'Coach Rivera',
  },
];

export const mockRoster = [
  { id: 'a1', name: 'Jordan Mitchell', number: 11, year: 'Junior', position: 'Guard', cara_hours: 16.5, cara_limit: 20 },
  { id: 'a2', name: 'Marcus Thompson', number: 23, year: 'Senior', position: 'Forward', cara_hours: 18, cara_limit: 20 },
  { id: 'a3', name: 'Destiny Clarke', number: 5, year: 'Sophomore', position: 'Center', cara_hours: 12, cara_limit: 20 },
  { id: 'a4', name: 'Alex Rivera', number: 14, year: 'Freshman', position: 'Guard', cara_hours: 19.5, cara_limit: 20 },
  { id: 'a5', name: 'Taylor Washington', number: 32, year: 'Junior', position: 'Forward', cara_hours: 14, cara_limit: 20 },
  { id: 'a6', name: 'Casey Johnson', number: 21, year: 'Senior', position: 'Guard', cara_hours: 17, cara_limit: 20 },
  { id: 'a7', name: 'Sam Peterson', number: 44, year: 'Sophomore', position: 'Center', cara_hours: 10, cara_limit: 20 },
  { id: 'a8', name: 'Morgan Lee', number: 3, year: 'Junior', position: 'Forward', cara_hours: 15.5, cara_limit: 20 },
];

// Generate availability heatmap mock data
export const generateHeatmapData = () => {
  const data = {};
  const days = 7;
  const slotsPerDay = 32; // 6am - 10pm in 30min slots

  for (let d = 0; d < days; d++) {
    const day = addDays(weekStart, d);
    data[format(day, 'yyyy-MM-dd')] = {};

    for (let s = 0; s < slotsPerDay; s++) {
      const hour = 6 + Math.floor(s / 2);
      const min = s % 2 === 0 ? 0 : 30;
      const key = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

      // Simulate busy patterns
      let available = mockRoster.length;
      if (hour >= 8 && hour < 10) available = Math.floor(available * 0.5); // Morning practice
      else if (hour >= 9 && hour < 11 && d % 2 === 0) available = Math.floor(available * 0.6);
      else if (hour >= 13 && hour < 15) available = Math.floor(available * 0.75);
      else if (hour >= 19 && d === 4) available = Math.floor(available * 0.1); // Game day
      else if (d >= 5) available = mockRoster.length; // Weekend more available

      const pct = Math.round((available / mockRoster.length) * 100);
      const unavailable = mockRoster.slice(0, mockRoster.length - available).map(a => ({
        id: a.id,
        name: a.name,
        reason: 'BUSY',
      }));

      data[format(day, 'yyyy-MM-dd')][key] = {
        available,
        total: mockRoster.length,
        pct,
        unavailable,
      };
    }
  }
  return data;
};

export const mockConflictResult = {
  hasConflicts: true,
  summary: {
    hard: 2,
    soft: 3,
    clear: mockRoster.length - 5,
  },
  conflicts: [
    { athlete: 'Alex Rivera', type: 'HARD', reason: 'Class conflict (shown as BUSY)' },
    { athlete: 'Marcus Thompson', type: 'HARD', reason: 'Hard block conflict' },
    { athlete: 'Jordan Mitchell', type: 'SOFT', reason: 'CARA hours near limit (19.5/20)' },
    { athlete: 'Casey Johnson', type: 'SOFT', reason: 'Study block overlap' },
    { athlete: 'Taylor Washington', type: 'SOFT', reason: 'Personal commitment' },
  ],
  suggestedWindows: [
    { start: 'Tomorrow 6:00 AM', end: '8:00 AM', score: 94, available: 8 },
    { start: 'Wednesday 4:00 PM', end: '6:00 PM', score: 88, available: 7 },
    { start: 'Thursday 7:00 AM', end: '9:00 AM', score: 82, available: 7 },
  ],
};
