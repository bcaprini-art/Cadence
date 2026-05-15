/**
 * Startup script — runs prisma db push then starts the Express server.
 * Falls back to reading .env.production if Railway doesn't inject user-defined variables.
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const backendDir = path.join(__dirname, 'backend')

// Try loading dotenv for local dev — ignore if not available
try {
  require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') })
} catch {
  // dotenv is optional — Railway provides env vars natively (or we fallback below)
}

// Railway often fails to inject user-defined env vars (DATABASE_URL, JWT_SECRET, etc.)
// to the Node.js process or to Prisma CLI. If missing, read them directly from the
// committed .env.production file and set them on process.env.
if (!process.env.DATABASE_URL) {
  console.log('[startup] DATABASE_URL not in process.env — reading .env.production directly')

  const prodEnvPath = path.join(backendDir, '.env.production')
  if (fs.existsSync(prodEnvPath)) {
    const content = fs.readFileSync(prodEnvPath, 'utf-8')
    let count = 0
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim()
          if (key && !process.env[key]) {
            process.env[key] = val
            count++
          }
        }
      }
    }
    console.log(`[startup] Set ${count} env vars from .env.production`)
  } else {
    console.log('[startup] .env.production not found at', prodEnvPath)
  }
}

console.log('[startup] DATABASE_URL set?', !!process.env.DATABASE_URL)
console.log('[startup] JWT_SECRET set?', !!process.env.JWT_SECRET)

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
