#!/bin/bash
# seed.sh — Seed the database with initial data
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$SCRIPT_DIR/../backend"

echo "🌱 Seeding database..."

# Load .env if it exists
if [ -f "$BACKEND/.env" ]; then
  export $(grep -v '^#' "$BACKEND/.env" | xargs)
fi

cd "$BACKEND"
node prisma/seed.js

echo "✅ Database seeded."
