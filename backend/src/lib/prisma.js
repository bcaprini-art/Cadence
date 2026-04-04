const { PrismaClient } = require('@prisma/client')

let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // Avoid multiple instances in development (hot reload)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'warn', 'error'],
    })
  }
  prisma = global.__prisma
}

module.exports = prisma
