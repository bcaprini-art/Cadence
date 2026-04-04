/**
 * Test setup helpers — shared across test files.
 * Uses a real Prisma client against TEST_DATABASE_URL (or DATABASE_URL as fallback).
 */

// Override DATABASE_URL before anything loads
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}

// Ensure JWT_SECRET is set for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest'

const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

/**
 * Generate a signed JWT for a mock user (no DB required for basic auth tests)
 */
function makeToken(userOverrides = {}) {
  const user = {
    id: 'test-user-id',
    email: 'test@test.com',
    role: 'ATHLETE',
    schoolId: 'test-school-id',
    teamId: null,
    ...userOverrides,
  }
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' })
}

module.exports = { prisma, makeToken }
