/**
 * Startup script — runs prisma db push then starts the Express server.
 * Wrapped in Node.js so Railway's env vars are properly available
 * (npx doesn't always inherit them on Railway's build step).
 */
const { execSync } = require('child_process')
const path = require('path')

// Load dotenv for local dev — Railway injects env vars into the Node process directly
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') })
} catch { /* dotenv might not be loaded yet, that's fine */ }

console.log('[startup] DATABASE_URL set?', !!process.env.DATABASE_URL)

// Run prisma db push to sync schema
try {
  console.log('[startup] Running prisma db push...')
  execSync('npx prisma db push --skip-generate', {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env },
  })
  console.log('[startup] Schema synced.')
} catch (err) {
  console.error('[startup] prisma db push failed:', err.message)
  console.log('[startup] Continuing anyway — the app may have limited functionality.')
}

// Start the main app
require('./src/index.js')
