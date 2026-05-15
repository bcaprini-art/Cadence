/**
 * Startup script — runs prisma db push then starts the Express server.
 * Falls back to writing .env if Railway doesn't inject user-defined variables.
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const backendDir = path.join(__dirname, 'backend')

// Load dotenv for local dev
try {
  require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') })
} catch {
  // dotenv is optional
}

// Railway injects PORT (8080) automatically but USER-DEFINED env vars
// (DATABASE_URL, JWT_SECRET, CLIENT_URL) sometimes don't get through
// to the Prisma CLI. If missing, write them to .env so Prisma can read them.
if (!process.env.DATABASE_URL) {
  console.log('[startup] DATABASE_URL not in process.env — checking for .env.production')

  // Try .env.production first (committed file with production values)
  const prodEnvPath = path.join(backendDir, '.env.production')
  if (fs.existsSync(prodEnvPath)) {
    fs.copyFileSync(prodEnvPath, path.join(backendDir, '.env'))
    console.log('[startup] Copied .env.production → .env')
    // Reload env
    try {
      require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') })
    } catch {}
  }
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
