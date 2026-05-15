/**
 * AthletiSync Seed File
 * Demo: 1 school, 2 teams (basketball + soccer), 1 coach + 5 athletes per team
 * Compliance rulesets for D1, D2, D3, NAIA, NJCAA
 * Sample schedule blocks and events
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding AthletiSync database...')

  // ─── Compliance Rulesets ─────────────────────────────────────────────────────
  console.log('  → Compliance rulesets')

  const d1Ruleset = await prisma.complianceRuleset.upsert({
    where: { division: 'D1' },
    update: {},
    create: {
      division: 'D1',
      maxCaraHoursDay: 4,
      maxCaraHoursWeek: 20,
      mandatoryRestHours: 1,
      deadWeekRules: { noAthletics: true, examPeriodDays: 7 },
    },
  })

  const d2Ruleset = await prisma.complianceRuleset.upsert({
    where: { division: 'D2' },
    update: {},
    create: {
      division: 'D2',
      maxCaraHoursDay: 4,
      maxCaraHoursWeek: 20,
      mandatoryRestHours: 1,
      deadWeekRules: { noAthletics: true, examPeriodDays: 5 },
    },
  })

  const d3Ruleset = await prisma.complianceRuleset.upsert({
    where: { division: 'D3' },
    update: {},
    create: {
      division: 'D3',
      maxCaraHoursDay: 5,
      maxCaraHoursWeek: 25,
      mandatoryRestHours: 0,
      deadWeekRules: null,
    },
  })

  const naiaRuleset = await prisma.complianceRuleset.upsert({
    where: { division: 'NAIA' },
    update: {},
    create: {
      division: 'NAIA',
      maxCaraHoursDay: 4,
      maxCaraHoursWeek: 24,
      mandatoryRestHours: 1,
      deadWeekRules: null,
    },
  })

  await prisma.complianceRuleset.upsert({
    where: { division: 'NJCAA' },
    update: {},
    create: {
      division: 'NJCAA',
      maxCaraHoursDay: 4,
      maxCaraHoursWeek: 20,
      mandatoryRestHours: 1,
      deadWeekRules: null,
    },
  })

  // ─── School ───────────────────────────────────────────────────────────────────
  console.log('  → School: Lakewood University')

  const school = await prisma.school.upsert({
    where: { id: 'school_lakewood' },
    update: {},
    create: {
      id: 'school_lakewood',
      name: 'Lakewood University',
      timezone: 'America/Chicago',
      conference: 'Midwest Athletic Conference',
    },
  })

  // ─── Venues ───────────────────────────────────────────────────────────────────
  console.log('  → Venues')

  const gymVenue = await prisma.venue.upsert({
    where: { id: 'venue_gym' },
    update: {},
    create: {
      id: 'venue_gym',
      schoolId: school.id,
      name: 'Lakewood Athletic Center',
      type: 'GYM',
      capacity: 5000,
    },
  })

  const fieldVenue = await prisma.venue.upsert({
    where: { id: 'venue_field' },
    update: {},
    create: {
      id: 'venue_field',
      schoolId: school.id,
      name: 'Lakewood Soccer Complex',
      type: 'FIELD',
      capacity: 2500,
    },
  })

  // ─── Teams ────────────────────────────────────────────────────────────────────
  console.log('  → Teams: Basketball + Soccer')

  const basketballTeam = await prisma.team.upsert({
    where: { id: 'team_basketball' },
    update: {},
    create: {
      id: 'team_basketball',
      sport: 'Basketball',
      division: 'D1',
      schoolId: school.id,
      complianceRulesetId: d1Ruleset.id,
    },
  })

  const soccerTeam = await prisma.team.upsert({
    where: { id: 'team_soccer' },
    update: {},
    create: {
      id: 'team_soccer',
      sport: 'Soccer',
      division: 'D2',
      schoolId: school.id,
      complianceRulesetId: d2Ruleset.id,
    },
  })

  // ─── Users ────────────────────────────────────────────────────────────────────
  const hashPw = (pw) => bcrypt.hash(pw, 12)

  console.log('  → Users: coaches + athletes')

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lakewood.edu' },
    update: {},
    create: {
      id: 'user_admin',
      name: 'Admin User',
      email: 'admin@lakewood.edu',
      password: await hashPw('admin123'),
      role: 'ADMIN',
      schoolId: school.id,
    },
  })

  // Basketball Coach
  const bballCoach = await prisma.user.upsert({
    where: { email: 'coach.harris@lakewood.edu' },
    update: {},
    create: {
      id: 'user_coach_bball',
      name: 'Marcus Harris',
      email: 'coach.harris@lakewood.edu',
      password: await hashPw('coach123'),
      role: 'COACH',
      schoolId: school.id,
      teamId: basketballTeam.id,
    },
  })

  // Soccer Coach
  const soccerCoach = await prisma.user.upsert({
    where: { email: 'coach.rivera@lakewood.edu' },
    update: {},
    create: {
      id: 'user_coach_soccer',
      name: 'Sofia Rivera',
      email: 'coach.rivera@lakewood.edu',
      password: await hashPw('coach123'),
      role: 'COACH',
      schoolId: school.id,
      teamId: soccerTeam.id,
    },
  })

  // Basketball athletes
  const bballAthletes = [
    { id: 'user_bball_1', name: 'Jordan Lee', email: 'jordan.lee@lakewood.edu' },
    { id: 'user_bball_2', name: 'Darius Mills', email: 'darius.mills@lakewood.edu' },
    { id: 'user_bball_3', name: 'Ty Williams', email: 'ty.williams@lakewood.edu' },
    { id: 'user_bball_4', name: 'Cam Parker', email: 'cam.parker@lakewood.edu' },
    { id: 'user_bball_5', name: 'Alex Torres', email: 'alex.torres@lakewood.edu' },
  ]

  for (const a of bballAthletes) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        id: a.id,
        name: a.name,
        email: a.email,
        password: await hashPw('athlete123'),
        role: 'ATHLETE',
        schoolId: school.id,
        teamId: basketballTeam.id,
      },
    })
  }

  // Soccer athletes
  const soccerAthletes = [
    { id: 'user_soccer_1', name: 'Mia Chen', email: 'mia.chen@lakewood.edu' },
    { id: 'user_soccer_2', name: 'Priya Patel', email: 'priya.patel@lakewood.edu' },
    { id: 'user_soccer_3', name: 'Emma Johnson', email: 'emma.johnson@lakewood.edu' },
    { id: 'user_soccer_4', name: 'Nia Brown', email: 'nia.brown@lakewood.edu' },
    { id: 'user_soccer_5', name: 'Lena Kovacs', email: 'lena.kovacs@lakewood.edu' },
  ]

  for (const a of soccerAthletes) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        id: a.id,
        name: a.name,
        email: a.email,
        password: await hashPw('athlete123'),
        role: 'ATHLETE',
        schoolId: school.id,
        teamId: soccerTeam.id,
      },
    })
  }

  // ─── Schedule Blocks ──────────────────────────────────────────────────────────
  console.log('  → Schedule blocks')

  const now = new Date()
  const monday = new Date(now)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - day + 1) // this Monday
  monday.setHours(0, 0, 0, 0)

  function dayOf(offset, hours, minutes = 0) {
    const d = new Date(monday)
    d.setDate(d.getDate() + offset)
    d.setHours(hours, minutes, 0, 0)
    return d
  }

  // Delete and recreate schedule blocks for Jordan Lee (idempotent)
  await prisma.scheduleBlock.deleteMany({ where: { userId: 'user_bball_1' } })

  // Jordan Lee — MWF morning class, study session, personal block
  const jordanBlocks = [
    {
      userId: 'user_bball_1',
      title: 'Introduction to Psychology',
      start: dayOf(0, 9), end: dayOf(0, 10, 30),
      type: 'CLASS', isHardBlock: true, visibility: 'BUSY', source: 'SIS_SYNC',
    },
    {
      userId: 'user_bball_1',
      title: 'Introduction to Psychology',
      start: dayOf(2, 9), end: dayOf(2, 10, 30),
      type: 'CLASS', isHardBlock: true, visibility: 'BUSY', source: 'SIS_SYNC',
    },
    {
      userId: 'user_bball_1',
      title: 'Introduction to Psychology',
      start: dayOf(4, 9), end: dayOf(4, 10, 30),
      type: 'CLASS', isHardBlock: true, visibility: 'BUSY', source: 'SIS_SYNC',
    },
    {
      userId: 'user_bball_1',
      title: 'Study Group — Psych',
      start: dayOf(1, 14), end: dayOf(1, 16),
      type: 'STUDY', isHardBlock: false, visibility: 'BUSY', source: 'MANUAL',
    },
    {
      userId: 'user_bball_1',
      title: 'Physical Therapy',
      start: dayOf(3, 8), end: dayOf(3, 9),
      type: 'PERSONAL', isHardBlock: true, visibility: 'PRIVATE', source: 'MANUAL',
    },
  ]

  for (const block of jordanBlocks) {
    await prisma.scheduleBlock.create({ data: block })
  }

  // Delete and recreate schedule blocks for Mia Chen
  await prisma.scheduleBlock.deleteMany({ where: { userId: 'user_soccer_1' } })

  // Mia Chen — soccer athlete
  const miaBlocks = [
    {
      userId: 'user_soccer_1',
      title: 'Calculus II',
      start: dayOf(0, 11), end: dayOf(0, 12, 15),
      type: 'CLASS', isHardBlock: true, visibility: 'BUSY', source: 'SIS_SYNC',
    },
    {
      userId: 'user_soccer_1',
      title: 'Calculus II',
      start: dayOf(2, 11), end: dayOf(2, 12, 15),
      type: 'CLASS', isHardBlock: true, visibility: 'BUSY', source: 'SIS_SYNC',
    },
    {
      userId: 'user_soccer_1',
      title: 'Calculus II',
      start: dayOf(4, 11), end: dayOf(4, 12, 15),
      type: 'CLASS', isHardBlock: true, visibility: 'BUSY', source: 'SIS_SYNC',
    },
  ]

  for (const block of miaBlocks) {
    await prisma.scheduleBlock.create({ data: block })
  }

  // ─── Events ───────────────────────────────────────────────────────────────────
  console.log('  → Events')

  const bballPractice = await prisma.event.upsert({
    where: { id: 'event_bball_practice_1' },
    update: {
      start: dayOf(0, 15),
      end: dayOf(0, 17),
    },
    create: {
      id: 'event_bball_practice_1',
      teamId: basketballTeam.id,
      title: 'Monday Practice',
      start: dayOf(0, 15),
      end: dayOf(0, 17),
      type: 'PRACTICE',
      venueId: gymVenue.id,
      createdById: bballCoach.id,
    },
  })

  // Upsert venue booking for bball practice
  const existingBballBooking = await prisma.venueBooking.findFirst({ where: { eventId: bballPractice.id } })
  if (!existingBballBooking) {
    await prisma.venueBooking.create({
      data: {
        venueId: gymVenue.id,
        eventId: bballPractice.id,
        start: dayOf(0, 15),
        end: dayOf(0, 17),
      },
    })
  }

  // Upsert attendees to basketball practice
  for (const athlete of bballAthletes) {
    await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId: bballPractice.id, userId: athlete.id } },
      update: {},
      create: {
        eventId: bballPractice.id,
        userId: athlete.id,
        status: 'REQUIRED',
      },
    })
  }

  const soccerPractice = await prisma.event.upsert({
    where: { id: 'event_soccer_practice_1' },
    update: {
      start: dayOf(1, 16),
      end: dayOf(1, 18),
    },
    create: {
      id: 'event_soccer_practice_1',
      teamId: soccerTeam.id,
      title: 'Tuesday Practice',
      start: dayOf(1, 16),
      end: dayOf(1, 18),
      type: 'PRACTICE',
      venueId: fieldVenue.id,
      createdById: soccerCoach.id,
    },
  })

  // Upsert venue booking for soccer practice
  const existingSoccerBooking = await prisma.venueBooking.findFirst({ where: { eventId: soccerPractice.id } })
  if (!existingSoccerBooking) {
    await prisma.venueBooking.create({
      data: {
        venueId: fieldVenue.id,
        eventId: soccerPractice.id,
        start: dayOf(1, 16),
        end: dayOf(1, 18),
      },
    })
  }

  for (const athlete of soccerAthletes) {
    await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId: soccerPractice.id, userId: athlete.id } },
      update: {},
      create: {
        eventId: soccerPractice.id,
        userId: athlete.id,
        status: 'REQUIRED',
      },
    })
  }

  // Game event (skip if exists)
  const existingGame = await prisma.event.findFirst({ where: { teamId: basketballTeam.id, type: 'GAME' } })
  if (!existingGame) {
    await prisma.event.create({
      data: {
        teamId: basketballTeam.id,
        title: 'Home Game vs. Riverside College',
        start: dayOf(5, 19),
        end: dayOf(5, 21, 30),
        type: 'GAME',
        venueId: gymVenue.id,
        createdById: bballCoach.id,
      },
    })
  }

  // ─── CARA Logs ────────────────────────────────────────────────────────────────
  console.log('  → CARA logs (varied for demo realism)')

  const weekStart = new Date(monday)

  // Basketball athletes — varied CARA hours for good demo spread
  // user_bball_1 = Jordan Lee    → 9h  (well within limit)
  // user_bball_2 = Darius Mills  → 13h (moderate)
  // user_bball_3 = Ty Williams   → 16h (elevated)
  // user_bball_4 = Cam Parker    → 18h (warning zone)
  // user_bball_5 = Alex Torres   → 19.5h (near limit)
  const bballHours = [9, 13, 16, 18, 19.5]

  for (let i = 0; i < bballAthletes.length; i++) {
    const athlete = bballAthletes[i]
    const targetHours = bballHours[i]
    // Clear any existing logs for this athlete this week
    await prisma.cARALog.deleteMany({
      where: { athleteId: athlete.id, weekStart },
    })
    await prisma.cARALog.create({
      data: {
        athleteId: athlete.id,
        eventId: bballPractice.id,
        hours: targetHours,
        weekStart,
      },
    })
  }

  // Soccer athletes — varied CARA hours
  // user_soccer_1 = Mia Chen      → 8h  (well within limit)
  // user_soccer_2 = Priya Patel   → 12h (moderate)
  // user_soccer_3 = Emma Johnson  → 14h (moderate-high)
  // user_soccer_4 = Nia Brown     → 17h (elevated)
  // user_soccer_5 = Lena Kovacs   → 18h (warning zone)
  const soccerHours = [8, 12, 14, 17, 18]

  for (let i = 0; i < soccerAthletes.length; i++) {
    const athlete = soccerAthletes[i]
    const targetHours = soccerHours[i]
    // Clear any existing logs for this athlete this week
    await prisma.cARALog.deleteMany({
      where: { athleteId: athlete.id, weekStart },
    })
    await prisma.cARALog.create({
      data: {
        athleteId: athlete.id,
        eventId: soccerPractice.id,
        hours: targetHours,
        weekStart,
      },
    })
  }

  console.log('✅ Seed complete!')
  console.log('')
  console.log('Demo accounts:')
  console.log('  admin@lakewood.edu       / admin123   (ADMIN)')
  console.log('  coach.harris@lakewood.edu / coach123   (COACH - Basketball)')
  console.log('  coach.rivera@lakewood.edu / coach123   (COACH - Soccer)')
  console.log('  jordan.lee@lakewood.edu  / athlete123  (ATHLETE - Basketball)')
  console.log('  mia.chen@lakewood.edu    / athlete123  (ATHLETE - Soccer)')

  // ─── Teachers ─────────────────────────────────────────────────────────────
  console.log('  → Teachers')

  const teacher1 = await prisma.user.upsert({
    where: { email: 'professor.wilson@lakewood.edu' },
    update: {},
    create: {
      id: 'user_teacher_1',
      name: 'Dr. Sarah Wilson',
      email: 'professor.wilson@lakewood.edu',
      password: await hashPw('teacher123'),
      role: 'TEACHER',
      schoolId: school.id,
    },
  })

  const teacher2 = await prisma.user.upsert({
    where: { email: 'professor.chen@lakewood.edu' },
    update: {},
    create: {
      id: 'user_teacher_2',
      name: 'Prof. David Chen',
      email: 'professor.chen@lakewood.edu',
      password: await hashPw('teacher123'),
      role: 'TEACHER',
      schoolId: school.id,
    },
  })

  // ─── Player Profiles ──────────────────────────────────────────────────────
  console.log('  → Player profiles')

  const bballProfiles = [
    { userId: 'user_bball_1', hometown: 'Chicago, IL', likes: 'Video games, hip hop, sneaker collecting', dislikes: 'Early mornings, seafood', foodAllergies: 'None', bio: 'Point guard with a passion for the game. Studying sports management.', jerseyNumber: 3, position: 'PG', height: "6'2\"", weight: 185, year: 'Sophomore', major: 'Sports Management' },
    { userId: 'user_bball_2', hometown: 'Detroit, MI', likes: 'Cooking, hiking, jazz music', dislikes: 'Loud noises, crowds', foodAllergies: 'Peanuts', bio: 'Forward who loves to cook on the off-season.', jerseyNumber: 22, position: 'F', height: "6'7\"", weight: 215, year: 'Junior', major: 'Nutrition' },
    { userId: 'user_bball_3', hometown: 'St. Louis, MO', likes: 'Fishing, movies, weight training', dislikes: 'Mondays, cold weather', foodAllergies: 'Lactose intolerant', bio: 'Center. Fishing is my escape from the court.', jerseyNumber: 15, position: 'C', height: "6'10\"", weight: 245, year: 'Senior', major: 'Business Administration' },
    { userId: 'user_bball_4', hometown: 'Indianapolis, IN', likes: 'Reading, chess, dogs', dislikes: 'Losing, traffic', foodAllergies: 'Shellfish', bio: 'Shooting guard. Chess player off the court.', jerseyNumber: 7, position: 'SG', height: "6'4\"", weight: 195, year: 'Freshman', major: 'Computer Science' },
    { userId: 'user_bball_5', hometown: 'Memphis, TN', likes: 'Guitar, traveling, photography', dislikes: 'Spiders, spicy food', foodAllergies: 'Gluten', bio: 'Small forward and amateur photographer.', jerseyNumber: 11, position: 'SF', height: "6'6\"", weight: 205, year: 'Junior', major: 'Communications' },
  ]

  const soccerProfiles = [
    { userId: 'user_soccer_1', hometown: 'Portland, OR', likes: 'Coffee shops, yoga, hiking', dislikes: 'Early practice, beets', foodAllergies: 'None', bio: 'Midfielder who loves the outdoors.', jerseyNumber: 10, position: 'MF', height: "5'7\"", weight: 145, year: 'Sophomore', major: 'Environmental Science' },
    { userId: 'user_soccer_2', hometown: 'Atlanta, GA', likes: 'Dancing, painting, vegan cooking', dislikes: 'Cold weather, loud restaurants', foodAllergies: 'Soy', bio: 'Forward and aspiring artist.', jerseyNumber: 9, position: 'F', height: "5'9\"", weight: 155, year: 'Senior', major: 'Fine Arts' },
    { userId: 'user_soccer_3', hometown: 'Minneapolis, MN', likes: 'Running, knitting, podcasts', dislikes: 'Humidity, tomatoes', foodAllergies: 'None', bio: 'Defender who runs marathons in the off-season.', jerseyNumber: 4, position: 'D', height: "5'10\"", weight: 160, year: 'Junior', major: 'Biology' },
    { userId: 'user_soccer_4', hometown: 'Denver, CO', likes: 'Snowboarding, board games, dogs', dislikes: 'Seafood, bugs', foodAllergies: 'Fish', bio: 'Goalkeeper who also snowboards competitively.', jerseyNumber: 1, position: 'GK', height: "5'11\"", weight: 170, year: 'Freshman', major: 'Engineering' },
    { userId: 'user_soccer_5', hometown: 'Kansas City, MO', likes: 'Singing, thrift shopping, baking', dislikes: 'Mornings, confrontation', foodAllergies: 'Eggs', bio: 'Midfielder who sings in an acapella group.', jerseyNumber: 8, position: 'MF', height: "5'6\"", weight: 140, year: 'Sophomore', major: 'Music' },
  ]

  for (const profile of [...bballProfiles, ...soccerProfiles]) {
    await prisma.playerProfile.upsert({
      where: { userId: profile.userId },
      update: {},
      create: profile,
    })
  }

  // ─── To-Do Items ──────────────────────────────────────────────────────────
  console.log('  → To-do items')

  const jordanTodos = [
    { title: 'Study for Psychology midterm', dueDate: dayOf(4, 23, 59), priority: 'high', category: 'academics' },
    { title: 'Shoot 100 free throws', dueDate: dayOf(3, 18), priority: 'medium', category: 'athletics' },
    { title: 'Call mom — birthday this weekend', dueDate: dayOf(2, 20), priority: 'medium', category: 'personal' },
    { title: 'Pick up books from library', dueDate: dayOf(1, 17), priority: 'low', category: 'academics' },
  ]

  for (const todo of jordanTodos) {
    await prisma.todoItem.create({
      data: { userId: 'user_bball_1', ...todo },
    })
  }

  const miaTodos = [
    { title: 'Calc II problem set due Friday', dueDate: dayOf(4, 23, 59), priority: 'high', category: 'academics' },
    { title: 'Film review — last game footage', dueDate: dayOf(2, 20), priority: 'high', category: 'athletics' },
    { title: 'Meal prep for the week', dueDate: dayOf(0, 12), priority: 'medium', category: 'personal' },
  ]

  for (const todo of miaTodos) {
    await prisma.todoItem.create({
      data: { userId: 'user_soccer_1', ...todo },
    })
  }

  // ─── Grades ───────────────────────────────────────────────────────────────
  console.log('  → Grades')

  // Dr. Wilson teaches Psychology — Jordan Lee is enrolled
  await prisma.grade.upsert({
    where: { athleteId_courseName_term_year: { athleteId: 'user_bball_1', courseName: 'Introduction to Psychology', term: 'SPRING', year: 2026 } },
    update: {},
    create: {
      schoolId: school.id,
      athleteId: 'user_bball_1',
      teacherId: teacher1.id,
      courseName: 'Introduction to Psychology',
      grade: 'B+',
      term: 'SPRING',
      year: 2026,
      notes: 'Good participation, strong on essays.',
    },
  })

  await prisma.grade.upsert({
    where: { athleteId_courseName_term_year: { athleteId: 'user_bball_2', courseName: 'Introduction to Psychology', term: 'SPRING', year: 2026 } },
    update: {},
    create: {
      schoolId: school.id,
      athleteId: 'user_bball_2',
      teacherId: teacher1.id,
      courseName: 'Introduction to Psychology',
      grade: 'A-',
      term: 'SPRING',
      year: 2026,
      notes: 'Excellent work on research paper.',
    },
  })

  // Prof. Chen teaches Calculus II — Mia Chen is enrolled
  await prisma.grade.upsert({
    where: { athleteId_courseName_term_year: { athleteId: 'user_soccer_1', courseName: 'Calculus II', term: 'SPRING', year: 2026 } },
    update: {},
    create: {
      schoolId: school.id,
      athleteId: 'user_soccer_1',
      teacherId: teacher2.id,
      courseName: 'Calculus II',
      grade: 'B',
      term: 'SPRING',
      year: 2026,
      notes: 'Solid work, needs improvement on integration techniques.',
    },
  })

  // More grades for demo depth
  await prisma.grade.upsert({
    where: { athleteId_courseName_term_year: { athleteId: 'user_bball_3', courseName: 'Business Ethics', term: 'SPRING', year: 2026 } },
    update: {},
    create: {
      schoolId: school.id,
      athleteId: 'user_bball_3',
      teacherId: teacher1.id,
      courseName: 'Business Ethics',
      grade: 'A',
      term: 'SPRING',
      year: 2026,
      notes: 'Outstanding class participation.',
    },
  })

  await prisma.grade.upsert({
    where: { athleteId_courseName_term_year: { athleteId: 'user_soccer_2', courseName: 'Art History', term: 'SPRING', year: 2026 } },
    update: {},
    create: {
      schoolId: school.id,
      athleteId: 'user_soccer_2',
      teacherId: teacher2.id,
      courseName: 'Art History',
      grade: 'A+',
      term: 'SPRING',
      year: 2026,
      notes: 'Exceptional portfolio work.',
    },
  })

  // ─── Trips ────────────────────────────────────────────────────────────────
  console.log('  → Trips')

  const bballTrip = await prisma.trip.upsert({
    where: { id: 'trip_bball_1' },
    update: {},
    create: {
      id: 'trip_bball_1',
      teamId: basketballTeam.id,
      destination: 'Columbus, OH — Riverside College',
      hotelName: 'Hampton Inn & Suites Columbus Downtown',
      hotelAddress: '501 N High St, Columbus, OH 43215',
      hotelPhone: '(614) 555-0100',
      checkIn: dayOf(5, 15),
      checkOut: dayOf(6, 12),
      departTime: dayOf(5, 10),
      returnTime: dayOf(6, 14),
      foodOptions: [
        { name: 'Buckeye Donuts', address: '1998 N High St', type: 'Breakfast', mealTime: 'Breakfast' },
        { name: 'Melt Bar & Grilled', address: '840 N High St', type: 'Lunch/Dinner', mealTime: 'Lunch' },
        { name: 'The Thurman Cafe', address: '183 Thurman Ave', type: 'Dinner', mealTime: 'Dinner' },
        { name: 'Bruegger\'s Bagels', address: '1736 N High St', type: 'Breakfast/Lunch', mealTime: 'Breakfast' },
      ],
      notes: 'Team bus departs at 10am from Lakewood Athletic Center. Bring both home and away jerseys.',
      createdById: bballCoach.id,
    },
  })

  // Link the game event to the trip
  const bballGame = await prisma.event.findFirst({ where: { teamId: basketballTeam.id, type: 'GAME' } })
  if (bballGame) {
    await prisma.event.update({
      where: { id: bballGame.id },
      data: { tripId: bballTrip.id },
    })
  }

  const soccerTrip = await prisma.trip.upsert({
    where: { id: 'trip_soccer_1' },
    update: {},
    create: {
      id: 'trip_soccer_1',
      teamId: soccerTeam.id,
      destination: 'Madison, WI — State University',
      hotelName: 'The Madison Concourse Hotel',
      hotelAddress: '1 W Dayton St, Madison, WI 53703',
      hotelPhone: '(608) 555-0200',
      checkIn: dayOf(6, 14),
      checkOut: dayOf(0, 11),
      departTime: dayOf(6, 9),
      returnTime: dayOf(0, 13),
      foodOptions: [
        { name: 'Dotty Dumpling\'s Dowry', address: '317 N Frances St', type: 'Lunch', mealTime: 'Lunch' },
        { name: 'The Old Fashioned', address: '23 N Pinckney St', type: 'Dinner', mealTime: 'Dinner' },
        { name: 'Short Stack Eatery', address: '302 N Henry St', type: 'Breakfast', mealTime: 'Breakfast' },
        { name: 'Ian\'s Pizza on State', address: '100 State St', type: 'Late Night', mealTime: 'Dinner' },
      ],
      notes: 'Travel in school vans. Bring cold weather gear — expected low of 38°F.',
      createdById: soccerCoach.id,
    },
  })

  // ─── Assistant Coaches ────────────────────────────────────────────────────
  console.log('  → Assistant coaches')

  // Create assistant coach users
  await prisma.user.upsert({
    where: { email: 'asst.coach.thompson@lakewood.edu' },
    update: {},
    create: {
      id: 'user_asst_bball',
      name: 'Coach Derek Thompson',
      email: 'asst.coach.thompson@lakewood.edu',
      password: await hashPw('coach123'),
      role: 'ASSISTANT_COACH',
      schoolId: school.id,
      teamId: basketballTeam.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'asst.coach.martinez@lakewood.edu' },
    update: {},
    create: {
      id: 'user_asst_soccer',
      name: 'Coach Isabella Martinez',
      email: 'asst.coach.martinez@lakewood.edu',
      password: await hashPw('coach123'),
      role: 'ASSISTANT_COACH',
      schoolId: school.id,
      teamId: soccerTeam.id,
    },
  })

  // Link assistant coaches to teams with permissions
  await prisma.assistantCoachTeam.upsert({
    where: { userId_teamId: { userId: 'user_asst_bball', teamId: basketballTeam.id } },
    update: {},
    create: {
      userId: 'user_asst_bball',
      teamId: basketballTeam.id,
      canManageRoster: true,
      canSchedule: true,
      canViewGrades: true,
      canViewTravel: true,
    },
  })

  await prisma.assistantCoachTeam.upsert({
    where: { userId_teamId: { userId: 'user_asst_soccer', teamId: soccerTeam.id } },
    update: {},
    create: {
      userId: 'user_asst_soccer',
      teamId: soccerTeam.id,
      canManageRoster: false,
      canSchedule: true,
      canViewGrades: true,
      canViewTravel: true,
    },
  })

  console.log('✅ Seed complete!')
  console.log('')
  console.log('Demo accounts:')
  console.log('  admin@lakewood.edu              / admin123   (ADMIN)')
  console.log('  coach.harris@lakewood.edu        / coach123   (COACH - Basketball)')
  console.log('  coach.rivera@lakewood.edu        / coach123   (COACH - Soccer)')
  console.log('  asst.coach.thompson@lakewood.edu / coach123   (ASSISTANT COACH - Basketball)')
  console.log('  asst.coach.martinez@lakewood.edu / coach123   (ASSISTANT COACH - Soccer)')
  console.log('  professor.wilson@lakewood.edu    / teacher123 (TEACHER)')
  console.log('  professor.chen@lakewood.edu      / teacher123 (TEACHER)')
  console.log('  jordan.lee@lakewood.edu          / athlete123 (ATHLETE - Basketball)')
  console.log('  mia.chen@lakewood.edu            / athlete123 (ATHLETE - Soccer)')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
