# Sixt Franchise Interfacing App

Monorepo-Anwendung zur Verwaltung des monatlichen Interfacing-Prozesses zwischen Sixt und internationalen Franchise-Partnern.

## Voraussetzungen

- **Node.js** >= 18
- **pnpm** >= 8 (`npm install -g pnpm`)
- **Docker** (für PostgreSQL)

## Schnellstart

### Automatisches Setup (empfohlen)

```bash
cd interfacing-app
./setup.sh
```

### Manuelles Setup

#### 1. Dependencies installieren

```bash
cd interfacing-app
pnpm install
```

#### 2. Shared Package bauen

```bash
cd packages/shared && npx tsc && cd ../..
```

#### 3. PostgreSQL starten (Docker erforderlich)

```bash
docker-compose up -d
```

#### 4. Prisma Client generieren und Datenbank einrichten

```bash
cd packages/backend
npx prisma generate
npx prisma migrate dev --name init
```

> **Hinweis**: Falls `prisma generate` fehlschlägt (z.B. wegen Firmen-Proxy/SSL), 
> muss der Befehl außerhalb des Firmen-VPN ausgeführt werden, da Prisma Binaries 
> von `binaries.prisma.sh` herunterlädt.

#### 5. App starten

```bash
# Im Root-Verzeichnis (interfacing-app/)
pnpm dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: `pnpm db:studio` (http://localhost:5555)

## Projektstruktur

```
interfacing-app/
  packages/
    frontend/          # React + TypeScript + Styled Components + Webpack
    backend/           # Node.js + Express + Prisma ORM
    shared/            # Gemeinsame Typen und Konstanten
  docker-compose.yml   # PostgreSQL Container
  pnpm-workspace.yaml  # Monorepo-Konfiguration
```

## Funktionen

| Seite | Pfad | Beschreibung |
|-------|------|-------------|
| Dashboard | `/` | Übersicht aller Funktionen |
| Datenimport | `/import` | SAP CSV-Dateien hochladen |
| Stammdaten Upload | `/stammdaten/upload` | Länderliste und Stammdaten hochladen |
| Stammdaten View | `/stammdaten/view` | Alle Länder mit Stammdaten anzeigen |
| Statement | `/statement` | Monthly Interfacing Statement generieren |
| Upload History | `/uploads` | Alle Uploads verwalten |
| PDF Export | `/export` | Statements als PDF exportieren |

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/api/uploads/sap` | SAP CSV hochladen |
| POST | `/api/uploads/countries` | Länderliste hochladen |
| POST | `/api/uploads/master-data` | Stammdaten hochladen |
| GET | `/api/uploads` | Upload-Historie |
| DELETE | `/api/uploads/:id` | Upload löschen |
| GET | `/api/countries` | Alle Länder |
| GET | `/api/master-data` | Stammdaten mit Länder-Join |
| GET | `/api/statement/:countryId` | Interfacing Statement |
| GET | `/api/export/:countryId/pdf` | PDF Export |
| POST | `/api/billing-runs` | Abrechnungslauf anlegen |

## Technologien

- **Frontend**: React 18, TypeScript, Styled Components, Webpack 5, React Router v6
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Datenbank**: PostgreSQL 16
- **PDF**: Puppeteer (serverseitiges HTML-to-PDF)
- **CSV**: csv-parse (Backend)
