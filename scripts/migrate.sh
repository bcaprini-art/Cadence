#!/bin/bash
# migrate.sh — Run Prisma database migrations
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$SCRIPT_DIR/../backend"

echo "🗄️  Running Prisma migrations..."

# Load .env if it exists
if [ -f "$BACKEND/.env" ]; then
  export $(grep -v '^#' "$BACKEND/.env" | xargs)
fi

cd "$BACKEND"

if [ "$NODE_ENV" = "production" ]; then
  echo "📦 Production mode — running migrate deploy"
  npx prisma migrate deploy
else
  echo "💻 Dev mode — running migrate dev"
  npx prisma migrate dev
fi

echo "✅ Migrations complete."
