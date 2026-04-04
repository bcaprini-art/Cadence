#!/bin/bash
# start-prod.sh — Start Cadence in production mode using Docker Compose
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "🚀 Starting Cadence in production mode..."

# Check .env exists
if [ ! -f "$ROOT/.env" ]; then
  echo "❌ No .env file found at project root."
  echo "   Copy .env.production.example to .env and fill in values:"
  echo "   cp .env.production.example .env"
  exit 1
fi

cd "$ROOT"

# Pull latest images (if using registry) or build locally
echo "🔨 Building images..."
docker compose build

echo "▶ Starting services..."
docker compose up -d

echo ""
echo "✅ Cadence is running!"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:4001"
echo ""
echo "View logs: docker compose logs -f"
echo "Stop:      docker compose down"
