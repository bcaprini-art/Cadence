#!/bin/bash
# start-dev.sh — Start Cadence in local development mode
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "🏃 Starting Cadence dev environment..."

# Check .env exists for backend
if [ ! -f "$ROOT/backend/.env" ]; then
  echo "⚠️  No backend/.env found. Copying from .env.example..."
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  echo "   Edit backend/.env with your local settings, then re-run."
  exit 1
fi

# Start backend in background
echo "▶ Starting backend (port 4001)..."
cd "$ROOT/backend"
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in {1..20}; do
  if curl -s http://localhost:4001/health > /dev/null 2>&1; then
    echo "✅ Backend ready"
    break
  fi
  sleep 1
done

# Start frontend in background
echo "▶ Starting frontend (port 5173)..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Cadence is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:4001"
echo ""
echo "Press Ctrl+C to stop all services."

# Open browser after short delay
sleep 2
if command -v open > /dev/null; then
  open http://localhost:5173
elif command -v xdg-open > /dev/null; then
  xdg-open http://localhost:5173
fi

# Wait and clean up on exit
trap "echo ''; echo '🛑 Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
