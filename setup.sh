#!/bin/bash
set -e

echo "=== Sixt Interfacing App Setup ==="
echo ""

# 1. Install dependencies
echo "1. Dependencies installieren..."
pnpm install

# 2. Build shared package
echo "2. Shared Package bauen..."
cd packages/shared && npx tsc && cd ../..

# 3. Generate Prisma client
echo "3. Prisma Client generieren..."
cd packages/backend && npx prisma generate && cd ../..

# 4. Check PostgreSQL
echo "4. PostgreSQL prüfen..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
  echo "   Docker erkannt – starte PostgreSQL Container..."
  docker-compose up -d
  sleep 3
elif command -v pg_isready &> /dev/null && pg_isready -q 2>/dev/null; then
  echo "   Lokale PostgreSQL erkannt und läuft ✓"
elif command -v brew &> /dev/null; then
  echo "   PostgreSQL über Homebrew installieren/starten..."
  brew install postgresql@16 2>/dev/null || true
  brew services start postgresql@16 2>/dev/null || true
  sleep 2
  # Create user + database if needed
  export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
  psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='sixt'" | grep -q 1 || \
    psql postgres -c "CREATE USER sixt WITH PASSWORD 'sixt_secret' CREATEDB;"
  psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='interfacing'" | grep -q 1 || \
    psql postgres -c "CREATE DATABASE interfacing OWNER sixt;"
  echo "   PostgreSQL eingerichtet ✓"
else
  echo "   ⚠️  Kein PostgreSQL gefunden!"
  echo "   Bitte installiere Docker Desktop oder PostgreSQL via Homebrew:"
  echo "   brew install postgresql@16 && brew services start postgresql@16"
  exit 1
fi

# 5. Run migrations
echo "5. Datenbank-Migrationen ausführen..."
cd packages/backend && npx prisma migrate dev && cd ../..

# 6. Seed database
echo "6. Stammdaten laden..."
pnpm db:seed

echo ""
echo "=== Setup abgeschlossen! ==="
echo ""
echo "Starte die App mit: pnpm dev"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""
echo "Weitere Befehle:"
echo "  pnpm db:seed      – Stammdaten neu laden"
echo "  pnpm db:studio    – Datenbank UI öffnen"
echo "  pnpm db:backup    – Datenbank-Backup erstellen"
echo "  pnpm db:restore <file.dump> – Backup wiederherstellen"
