/**
 * Startup script — runs prisma db push then starts the Express server.
 * Lives at repo root since Railway deploys from the root.
 */
const { execSync } = require('child_process')
const path = require('path')

const backendDir = path.join(__dirname, 'backend')

// Load dotenv for local dev — Railway injects env vars into the Node process directly
try {
  require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') })
} catch {
  // dotenv is optional
}

console.log('[startup] DATABASE_URL set?', !!process.env.DATABASE_URL)

// Run prisma db push to sync schema
try {
  console.log('[startup] Running prisma db push...')
  execSync('npx prisma db push --skip-generate', {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env },
  })
  console.log('[startup] Schema synced.')
} catch (err) {
  console.error('[startup] prisma db push failed:', err.message)
  console.log('[startup] Continuing anyway — the app may have limited functionality.')
}

// Start the main app
require(path.join(backendDir, 'src', 'index.js'))
