# SQLite Migration - Abgeschlossen ✅

## Zusammenfassung

Die Anwendung verwendet jetzt eine **persistente SQLite-Datenbank** anstelle des In-Memory Mock-Clients. Alle Daten bleiben nach Server-Neustarts erhalten.

## Was wurde geändert

### 1. Prisma Schema
- **Datei:** `packages/backend/prisma/schema.prisma`
- Datasource von `postgresql` auf `sqlite` umgestellt
- 5 neue GDS/DCF-Modelle hinzugefügt:
  - `GdsDcfPartner` - Partner-Konfigurationen (Amadeus, Sabre, etc.)
  - `GdsDcfUpload` - Upload-Historie
  - `GdsDcfReservation` - Reservierungs-Rohdaten
  - `GdsDcfValidationResult` - Validierungs-Ergebnisse
  - `FranchiseMandant` - Franchise-Ländercodes

### 2. Umgebungsvariablen
- **Dateien:** `.env` und `packages/backend/.env`
- DATABASE_URL geändert von PostgreSQL zu: `file:./dev.db`

### 3. Prisma Client
- **Datei:** `packages/backend/src/prismaClient.ts`
- Mock-Client durch echten Prisma Client ersetzt
- Alter Mock gesichert als `prismaClient.mock.ts`

### 4. GDS/DCF Routes
- **Datei:** `packages/backend/src/routes/gdsDcf.ts`
- JSON-Serialisierung für SQLite hinzugefügt
- Neue Hilfs-Funktionen in `packages/backend/src/utils/jsonHelpers.ts`

### 5. Datenbank-Datei
- **Speicherort:** `packages/backend/prisma/dev.db`
- Aktuell: 258 KB (mit Schema und Default-Daten)
- Wird automatisch von Prisma verwaltet

## Datenpersistenz

### Was wird gespeichert
✅ Alle Daten bleiben nach Server-Neustart erhalten:
- Länder (Countries)
- Master-Daten
- Uploads (SAP, Billing, Deposits)
- GDS/DCF-Partner und Reservierungen
- Feedback-Items und Kommentare
- Team-Mitglieder
- Streams und Sub-Apps
- Interfacing Plans
- Und alle anderen Modelle

### Was passiert beim ersten Start
- Datenbank ist leer
- GDS-Partner werden automatisch mit Defaults initialisiert
- Andere Daten müssen über die UI oder Uploads hinzugefügt werden

## Datenbank-Verwaltung

### Backup erstellen
```powershell
Copy-Item packages\backend\prisma\dev.db packages\backend\prisma\dev.db.backup
```

### Backup wiederherstellen
```powershell
Copy-Item packages\backend\prisma\dev.db.backup packages\backend\prisma\dev.db
```

### Datenbank zurücksetzen (alles löschen)
```powershell
Remove-Item packages\backend\prisma\dev.db
pnpm --filter backend exec prisma db push
```

### Datenbank anzeigen (Prisma Studio)
```powershell
pnpm db:studio
# Öffnet Browser: http://localhost:5555
```

## Vorteile

- ✅ **Keine Docker-Installation nötig** - SQLite ist eine einfache Datei
- ✅ **Portabel** - Die .db-Datei kann einfach kopiert/geteilt werden
- ✅ **Persistent** - Daten überleben Server-Neustarts
- ✅ **Einfach zu debuggen** - Mit Tools wie DB Browser für SQLite
- ✅ **Schnell** - Lokale Datei ohne Netzwerk-Overhead

## Technische Details

### JSON-Felder in SQLite
Da SQLite keinen nativen JSON-Typ wie PostgreSQL hat, werden komplexe Datenstrukturen als Strings gespeichert:

- `GdsDcfPartner.sourceChannels` → JSON String
- `GdsDcfPartner.feesByRegion` → JSON String
- `GdsDcfPartner.voucherRules` → JSON String
- `GdsDcfValidationResult.validationSteps` → JSON String

Die Serialisierung/Deserialisierung erfolgt automatisch in `utils/jsonHelpers.ts`.

## Migration von PostgreSQL

Falls Sie später zu PostgreSQL wechseln möchten:

1. Schema in `schema.prisma` zurück auf `postgresql` ändern
2. DATABASE_URL in `.env` aktualisieren
3. PostgreSQL-Container starten: `docker compose up -d`
4. Prisma generieren und migrieren:
   ```powershell
   pnpm --filter backend exec prisma generate
   pnpm --filter backend exec prisma migrate dev
   ```

## Support

Bei Fragen oder Problemen:
- Prisma Dokumentation: https://www.prisma.io/docs/
- SQLite Dokumentation: https://www.sqlite.org/docs.html
- Cursor Chat für Hilfe nutzen

---

**Status:** ✅ Erfolgreich migriert am 9. März 2026
**Datenbank:** SQLite 3
**Prisma Version:** 6.19.2
