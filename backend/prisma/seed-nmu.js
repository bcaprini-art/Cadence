/**
 * NMU Demo Seed — Northern Michigan University Volleyball
 * D2 | NMU Wildcats | Green & Gold
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🏐 Seeding NMU Volleyball demo...');

  // Compliance ruleset — D2
  const d2 = await prisma.complianceRuleset.upsert({
    where: { division: 'D2' },
    update: {},
    create: {
      division: 'D2',
      maxCaraHoursDay: 4,
      maxCaraHoursWeek: 20,
      mandatoryRestHours: 9,
    },
  });
  console.log('  ✓ D2 compliance ruleset');

  // School
  const school = await prisma.school.upsert({
    where: { id: 'school_nmu' },
    update: { name: 'Northern Michigan University', conference: 'GLIAC', timezone: 'America/Detroit' },
    create: {
      id: 'school_nmu',
      name: 'Northern Michigan University',
      conference: 'GLIAC',
      timezone: 'America/Detroit',
    },
  });
  console.log('  ✓ Northern Michigan University');

  // Team — Women's Volleyball
  const team = await prisma.team.upsert({
    where: { id: 'team_nmu_vball' },
    update: {},
    create: {
      id: 'team_nmu_vball',
      sport: "Women's Volleyball",
      division: 'D2',
      schoolId: school.id,
      complianceRulesetId: d2.id,
    },
  });
  console.log("  ✓ Women's Volleyball team");

  const hash = async (pw) => bcrypt.hash(pw, 10);

  // Coach
  const coach = await prisma.user.upsert({
    where: { email: 'coach@nmu-demo.cadenceapp.io' },
    update: {},
    create: {
      id: 'nmu_coach',
      name: 'Coach Sarah Mitchell',
      email: 'coach@nmu-demo.cadenceapp.io',
      password: await hash('wildcats2026'),
      role: 'COACH',
      
      teamId: team.id,
      schoolId: school.id,
    },
  });
  console.log('  ✓ Coach: coach@nmu-demo.cadenceapp.io / wildcats2026');

  // Athletes — realistic NMU-style roster
  const athletes = [
    { id: 'nmu_a1', name: 'Emma Kowalski',    pos: 'Setter',          year: 'Junior',   cara: 14.5 },
    { id: 'nmu_a2', name: 'Brianna Sarkinen',  pos: 'Outside Hitter',  year: 'Senior',   cara: 17.0 },
    { id: 'nmu_a3', name: 'Jayda Compeau',     pos: 'Middle Blocker',  year: 'Sophomore', cara: 12.0 },
    { id: 'nmu_a4', name: 'Riley Thompson',    pos: 'Libero',          year: 'Junior',   cara: 16.5 },
    { id: 'nmu_a5', name: 'Madison Carlson',   pos: 'Outside Hitter',  year: 'Freshman', cara:  9.0 },
    { id: 'nmu_a6', name: 'Olivia Beauchamp',  pos: 'Right Side',      year: 'Senior',   cara: 18.5 },
    { id: 'nmu_a7', name: 'Taylor Bergstrom',  pos: 'Middle Blocker',  year: 'Junior',   cara: 13.0 },
    { id: 'nmu_a8', name: 'Kayla Niemi',       pos: 'Setter',          year: 'Sophomore', cara: 11.0 },
  ];

  const athleteRecords = [];
  for (const a of athletes) {
    const user = await prisma.user.upsert({
      where: { email: `${a.id}@nmu-demo.cadenceapp.io` },
      update: {},
      create: {
        id: a.id,
        name: a.name,
        email: `${a.id}@nmu-demo.cadenceapp.io`,
        password: await hash('wildcats2026'),
        role: 'ATHLETE',
        
        teamId: team.id,
        schoolId: school.id,
      },
    });
    athleteRecords.push({ ...user, cara: a.cara });
  }
  console.log(`  ✓ ${athletes.length} athletes seeded`);

  // Demo athlete login (the person Brian wants to show)
  const demoAthlete = await prisma.user.upsert({
    where: { email: 'athlete@nmu-demo.cadenceapp.io' },
    update: {},
    create: {
      id: 'nmu_demo_athlete',
      name: 'Emma Kowalski',
      email: 'athlete@nmu-demo.cadenceapp.io',
      password: await hash('wildcats2026'),
      role: 'ATHLETE',
      
      teamId: team.id,
      schoolId: school.id,
    },
  });
  console.log('  ✓ Demo athlete: athlete@nmu-demo.cadenceapp.io / wildcats2026');

  // Realistic class schedule for Emma (demo athlete)
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - now.getDay() + 1);
  mon.setHours(0, 0, 0, 0);

  const day = (d, h, m) => { const dt = new Date(mon); dt.setDate(mon.getDate() + d); dt.setHours(h, m, 0, 0); return dt; };

  const blocks = [
    // Monday/Wednesday/Friday classes
    { title: 'BIOL 305 - Human Anatomy', type: 'CLASS', start: day(0, 8, 0), end: day(0, 9, 15), isHardBlock: true, visibility: 'BUSY' },
    { title: 'COMM 220 - Public Speaking', type: 'CLASS', start: day(0, 10, 0), end: day(0, 11, 15), isHardBlock: true, visibility: 'BUSY' },
    { title: 'Study Hall', type: 'STUDY', start: day(0, 13, 0), end: day(0, 15, 0), isHardBlock: false, visibility: 'PUBLIC' },
    { title: 'BIOL 305 - Human Anatomy', type: 'CLASS', start: day(2, 8, 0), end: day(2, 9, 15), isHardBlock: true, visibility: 'BUSY' },
    { title: 'COMM 220 - Public Speaking', type: 'CLASS', start: day(2, 10, 0), end: day(2, 11, 15), isHardBlock: true, visibility: 'BUSY' },
    { title: 'BIOL 305 - Human Anatomy', type: 'CLASS', start: day(4, 8, 0), end: day(4, 9, 15), isHardBlock: true, visibility: 'BUSY' },
    // Tuesday/Thursday classes
    { title: 'KINE 310 - Sport Psychology', type: 'CLASS', start: day(1, 9, 30), end: day(1, 10, 45), isHardBlock: true, visibility: 'BUSY' },
    { title: 'MATH 141 - Calculus I', type: 'CLASS', start: day(1, 13, 0), end: day(1, 14, 15), isHardBlock: true, visibility: 'BUSY' },
    { title: 'KINE 310 - Sport Psychology', type: 'CLASS', start: day(3, 9, 30), end: day(3, 10, 45), isHardBlock: true, visibility: 'BUSY' },
    { title: 'MATH 141 - Calculus I', type: 'CLASS', start: day(3, 13, 0), end: day(3, 14, 15), isHardBlock: true, visibility: 'BUSY' },
    // Personal
    { title: 'Strength & Conditioning', type: 'PERSONAL', start: day(1, 7, 0), end: day(1, 8, 0), isHardBlock: false, visibility: 'PUBLIC' },
    { title: 'Study Hall', type: 'STUDY', start: day(2, 20, 0), end: day(2, 22, 0), isHardBlock: false, visibility: 'BUSY' },
  ];

  for (const b of blocks) {
    await prisma.scheduleBlock.create({
      data: { ...b, userId: 'nmu_demo_athlete', source: 'MANUAL' },
    }).catch(() => {}); // skip duplicates
  }
  console.log(`  ✓ ${blocks.length} schedule blocks for Emma`);

  // Team events this week
  const events = [
    { title: 'Morning Practice', type: 'PRACTICE', start: day(0, 6, 0), end: day(0, 8, 0), desc: 'Serving & passing drills' },
    { title: 'Film Review', type: 'FILM', start: day(1, 16, 0), end: day(1, 17, 30), desc: 'Reviewing last weekend match' },
    { title: 'Afternoon Practice', type: 'PRACTICE', start: day(2, 15, 30), end: day(2, 17, 30), desc: 'Game prep — blocking & attacks' },
    { title: 'Team Meeting', type: 'MEETING', start: day(3, 8, 0), end: day(3, 8, 45), desc: 'Weekly check-in' },
    { title: 'Practice', type: 'PRACTICE', start: day(4, 15, 0), end: day(4, 17, 0), desc: 'Pre-game walkthrough' },
    { title: 'vs. Ferris State (Home)', type: 'GAME', start: day(5, 14, 0), end: day(5, 16, 30), desc: 'GLIAC Conference match' },
  ];

  for (const e of events) {
    await prisma.event.create({
      data: {
        title: e.title,
        type: e.type,
        start: e.start,
        end: e.end,
        teamId: team.id,
        description: e.desc,
        createdById: coach.id,
      },
    }).catch(() => {});
  }
  console.log(`  ✓ ${events.length} team events`);

  // CARA logs
  for (const a of athleteRecords) {
    const hoursToLog = a.cara;
    await prisma.cARALog.create({
      data: {
        athleteId: a.id,
        hours: hoursToLog,
        weekStart: mon,
        eventId: null,
      },
    }).catch(() => {});
  }
  console.log('  ✓ CARA logs');

  console.log('\n🏐 NMU Demo ready!');
  console.log('\nLogin credentials:');
  console.log('  Coach:   coach@nmu-demo.cadenceapp.io  /  wildcats2026');
  console.log('  Athlete: athlete@nmu-demo.cadenceapp.io  /  wildcats2026');
  console.log('\nSchool: Northern Michigan University | Sport: Volleyball | Division: D2 | Conference: GLIAC');
}

main().catch(console.error).finally(() => prisma.$disconnect());
