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

# 4. Start PostgreSQL
echo "4. PostgreSQL starten..."
docker-compose up -d

# 5. Wait for DB
echo "5. Warte auf Datenbank..."
sleep 3

# 6. Run migrations
echo "6. Datenbank-Migrationen ausführen..."
cd packages/backend && npx prisma migrate dev --name init && cd ../..

echo ""
echo "=== Setup abgeschlossen! ==="
echo "Starte die App mit: pnpm dev"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
