/**
 * Auth route tests
 * Tests register, login, and token protection.
 *
 * NOTE: These tests require a running PostgreSQL database.
 * Set TEST_DATABASE_URL or DATABASE_URL in your environment.
 * Run: npm test
 */

require('./setup') // sets TEST_DATABASE_URL and JWT_SECRET

const request = require('supertest')
const { app } = require('../index')
const { prisma } = require('./setup')

// Unique suffix to avoid collisions between test runs
const TS = Date.now()
const TEST_EMAIL = `jest-auth-${TS}@cadence-test.com`
const TEST_PASSWORD = 'TestPass1!'
const TEST_NAME = `JestUser-${TS}`

let schoolId
let authToken

beforeAll(async () => {
  // Create a school for registration tests
  const school = await prisma.school.create({
    data: { name: `Jest School ${TS}`, city: 'Testville', state: 'TX' },
  })
  schoolId = school.id
})

afterAll(async () => {
  // Clean up test user and school
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prisma.school.deleteMany({ where: { name: `Jest School ${TS}` } })
  await prisma.$disconnect()
})

// ─── Register ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD, schoolId })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_EMAIL)
    authToken = res.body.token
  })

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD, schoolId })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already registered/i)
  })

  it('rejects missing fields (no name)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `missing-${TS}@test.com`, password: TEST_PASSWORD, schoolId })
    expect(res.status).toBe(400)
  })

  it('rejects missing fields (no email)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Email', password: TEST_PASSWORD, schoolId })
    expect(res.status).toBe(400)
  })

  it('rejects missing fields (no password)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Pass', email: `nopass-${TS}@test.com`, schoolId })
    expect(res.status).toBe(400)
  })
})

// ─── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_EMAIL)
  })

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPassword99!' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid credentials/i)
  })

  it('rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: `nonexistent-${TS}@test.com`, password: TEST_PASSWORD })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid credentials/i)
  })
})

// ─── Token protection ──────────────────────────────────────────────────────────

describe('Protected routes', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/schedule-blocks')
    expect(res.status).toBe(401)
  })

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/schedule-blocks')
      .set('Authorization', 'Bearer this.is.not.valid')
    expect(res.status).toBe(401)
  })

  it('returns 200 with a valid token', async () => {
    const res = await request(app)
      .get('/api/schedule-blocks')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
  })
})
