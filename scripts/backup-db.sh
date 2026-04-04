#!/bin/bash
# backup-db.sh — Create a dated pg_dump backup of the Cadence database
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
BACKUP_DIR="$ROOT/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/cadence_$DATE.sql.gz"

# Create backup directory if needed
mkdir -p "$BACKUP_DIR"

# Load environment
if [ -f "$ROOT/backend/.env" ]; then
  export $(grep -v '^#' "$ROOT/backend/.env" | xargs)
elif [ -f "$ROOT/.env" ]; then
  export $(grep -v '^#' "$ROOT/.env" | xargs)
fi

# Parse DATABASE_URL or use individual vars
if [ -n "$DATABASE_URL" ]; then
  # Extract components from DATABASE_URL
  # Format: postgresql://user:password@host:port/dbname
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export PGPASSWORD
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-cadence}"
DB_NAME="${DB_NAME:-cadence}"

echo "🗄️  Backing up database '$DB_NAME' from $DB_HOST..."

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  | gzip > "$BACKUP_FILE"

echo "✅ Backup saved to: $BACKUP_FILE"

# Optional: remove backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "🧹 Cleaned up backups older than 30 days."
