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
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
