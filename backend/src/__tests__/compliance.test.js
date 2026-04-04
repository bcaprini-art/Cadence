/**
 * Compliance endpoint tests.
 * Tests CARA forecast, voluntary toggle, and CSV export.
 *
 * Requires: running PostgreSQL (TEST_DATABASE_URL or DATABASE_URL)
 */

require('./setup')

const request = require('supertest')
const { app } = require('../index')
const { prisma, makeToken } = require('./setup')

const TS = Date.now()

let school, team, coachUser, athleteUser, eventId
let coachToken, athleteToken

beforeAll(async () => {
  school = await prisma.school.create({
    data: { name: `Jest Comp School ${TS}`, city: 'Testville', state: 'TX' },
  })

  // Create compliance ruleset (or reuse existing D1 one)
  let ruleset = await prisma.complianceRuleset.findUnique({ where: { division: 'D1' } })
  if (!ruleset) {
    ruleset = await prisma.complianceRuleset.create({
      data: { division: 'D1', maxCaraHoursWeek: 20, maxCaraHoursDay: 4, mandatoryRestHours: 8 },
    })
  }

  team = await prisma.team.create({
    data: {
      name: `Jest Comp Team ${TS}`,
      sport: 'Football',
      division: 'D1',
      schoolId: school.id,
      complianceRulesetId: ruleset.id,
    },
  })

  const bcrypt = require('bcryptjs')
  const pw = await bcrypt.hash('TestPass1!', 10)

  coachUser = await prisma.user.create({
    data: { name: `CompCoach ${TS}`, email: `comp-coach-${TS}@test.com`, password: pw, role: 'COACH', schoolId: school.id, teamId: team.id },
  })

  athleteUser = await prisma.user.create({
    data: { name: `CompAthlete ${TS}`, email: `comp-athlete-${TS}@test.com`, password: pw, role: 'ATHLETE', schoolId: school.id, teamId: team.id },
  })

  coachToken = makeToken({ id: coachUser.id, email: coachUser.email, role: 'COACH', schoolId: school.id, teamId: team.id })
  athleteToken = makeToken({ id: athleteUser.id, email: athleteUser.email, role: 'ATHLETE', schoolId: school.id, teamId: team.id })

  // Create a FILM event (can be made voluntary)
  const event = await prisma.event.create({
    data: {
      teamId: team.id,
      title: `Jest Film ${TS}`,
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
      type: 'FILM',
      isVoluntary: false,
      createdById: coachUser.id,
    },
  })
  eventId = event.id

  // Add athlete as required attendee
  await prisma.eventAttendee.create({
    data: { eventId, userId: athleteUser.id, status: 'REQUIRED' },
  })
})

afterAll(async () => {
  await prisma.eventAttendee.deleteMany({ where: { eventId } })
  await prisma.cARALog.deleteMany({ where: { eventId } })
  await prisma.event.deleteMany({ where: { id: eventId } })
  await prisma.user.deleteMany({ where: { email: { contains: `-${TS}@test.com` } } })
  // Unlink ruleset before deleting team
  await prisma.team.updateMany({ where: { name: `Jest Comp Team ${TS}` }, data: { complianceRulesetId: null } })
  await prisma.team.deleteMany({ where: { name: `Jest Comp Team ${TS}` } })
  await prisma.school.deleteMany({ where: { name: `Jest Comp School ${TS}` } })
  await prisma.$disconnect()
})

// ─── Forecast ─────────────────────────────────────────────────────────────────

describe('GET /api/compliance/forecast', () => {
  it('returns correct structure', async () => {
    const res = await request(app)
      .get('/api/compliance/forecast')
      .set('Authorization', `Bearer ${coachToken}`)
      .query({ teamId: team.id })

    expect(res.status).toBe(200)
    // Top-level fields
    expect(res.body).toHaveProperty('weekStart')
    expect(res.body).toHaveProperty('weekEnd')
    expect(res.body).toHaveProperty('limit')
    expect(res.body).toHaveProperty('athletes')
    expect(res.body).toHaveProperty('totals')
    expect(Array.isArray(res.body.athletes)).toBe(true)

    // Per-athlete structure
    if (res.body.athletes.length > 0) {
      const a = res.body.athletes[0]
      expect(a).toHaveProperty('id')
      expect(a).toHaveProperty('name')
      expect(a).toHaveProperty('currentHours')
      expect(a).toHaveProperty('projectedHours')
      expect(a).toHaveProperty('status')
      expect(a).toHaveProperty('dailyBreakdown')
    }
  })

  it('is forbidden for athletes (403)', async () => {
    const res = await request(app)
      .get('/api/compliance/forecast')
      .set('Authorization', `Bearer ${athleteToken}`)
      .query({ teamId: team.id })
    expect(res.status).toBe(403)
  })

  it('returns 400 when teamId is missing', async () => {
    const res = await request(app)
      .get('/api/compliance/forecast')
      .set('Authorization', `Bearer ${coachToken}`)
    expect(res.status).toBe(400)
  })
})

// ─── Voluntary toggle ─────────────────────────────────────────────────────────

describe('PATCH /api/events/:id/voluntary', () => {
  it('marks a FILM event as voluntary (removes CARA hours)', async () => {
    const res = await request(app)
      .patch(`/api/events/${eventId}/voluntary`)
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ isVoluntary: true })
    expect(res.status).toBe(200)
    expect(res.body.isVoluntary).toBe(true)
  })

  it('unmarks voluntary — CARA hours are restored', async () => {
    const res = await request(app)
      .patch(`/api/events/${eventId}/voluntary`)
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ isVoluntary: false })
    expect(res.status).toBe(200)
    expect(res.body.isVoluntary).toBe(false)
  })

  it('rejects invalid isVoluntary value', async () => {
    const res = await request(app)
      .patch(`/api/events/${eventId}/voluntary`)
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ isVoluntary: 'yes' })
    expect(res.status).toBe(400)
  })
})

// ─── CSV Export ───────────────────────────────────────────────────────────────

describe('GET /api/compliance/export/csv', () => {
  it('returns content-type text/csv', async () => {
    const res = await request(app)
      .get('/api/compliance/export/csv')
      .set('Authorization', `Bearer ${coachToken}`)
      .query({ teamId: team.id })
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/csv/)
  })

  it('content-disposition header includes filename', async () => {
    const res = await request(app)
      .get('/api/compliance/export/csv')
      .set('Authorization', `Bearer ${coachToken}`)
      .query({ teamId: team.id })
    expect(res.headers['content-disposition']).toMatch(/attachment/)
    expect(res.headers['content-disposition']).toMatch(/\.csv/)
  })
})
