# 🚀 Backend Setup - Vollständige Anleitung

## Status Quo
- ✅ Frontend läuft
- ✅ Backend läuft mit Mock-Daten (temporär)
- ❌ Keine Datenbank (Uploads gehen verloren)

## Ziel
- ✅ Docker + PostgreSQL läuft
- ✅ Backend mit echter Datenbank
- ✅ Uploads werden persistent gespeichert

---

## 📋 Schritt 1: Docker Desktop installieren

### Installation
1. Download: https://www.docker.com/products/docker-desktop/
2. "Docker Desktop for Windows" herunterladen
3. Als Administrator installieren
4. **Computer neu starten**

### Nach Neustart
1. Docker Desktop starten (aus Startmenü)
2. Warten bis grünes Symbol in Taskleiste erscheint
3. Test im Terminal:
   ```powershell
   docker --version
   # Sollte zeigen: Docker version 24.x.x oder höher
   ```

---

## 📋 Schritt 2: Prisma Binaries generieren

**⚠️ WICHTIG: Außerhalb des Firmen-VPN ausführen!**

### Option A: Mit Handy-Hotspot (empfohlen)
1. Handy-Hotspot aktivieren
2. Laptop mit Hotspot verbinden
3. Im Projekt-Ordner ausführen:
   ```powershell
   cd "C:\Users\n420287\Sixt GmbH & Co. Autovermietung KG\Int. Franchise Controlling - Franchise CO App\Sx-interfacing-app"
   
   $env:NODE_TLS_REJECT_UNAUTHORIZED='0'
   pnpm --filter backend exec prisma generate
   ```
4. Warten bis "Generated Prisma Client" erscheint
5. Zurück ins Firmen-WLAN

### Option B: Privates WLAN
- Gleicher Befehl wie Option A

### Erwartete Ausgabe:
```
✔ Generated Prisma Client to .\node_modules\@prisma\client
```

---

## 📋 Schritt 3: PostgreSQL Datenbank starten

**Voraussetzung:** Docker läuft, Prisma generiert

```powershell
# Im Projekt-Ordner:
docker compose up -d

# Überprüfen:
docker ps
# Sollte zeigen: sixt-interfacing-db (healthy)
```

---

## 📋 Schritt 4: Datenbank-Schema anlegen

```powershell
# Migrationen ausführen:
pnpm --filter backend exec prisma migrate dev --name init

# Prisma Studio öffnen (optional - zur Datenansicht):
pnpm db:studio
# Öffnet Browser: http://localhost:5555
```

---

## 📋 Schritt 5: Original Prisma Client aktivieren

```powershell
# Führe das Restore-Script aus:
.\restore-prisma.ps1

# Backend wird automatisch neu starten
```

---

## ✅ Fertig! Backend läuft mit echter Datenbank

### Test:
1. Browser: http://localhost:3000
2. Dokument hochladen
3. Server neu starten: `pnpm dev`
4. Uploads sind noch da! 🎉

---

## 🔧 Troubleshooting

### Docker startet nicht
```powershell
# WSL 2 aktivieren (falls erforderlich):
wsl --install
# Computer neu starten
```

### Prisma generate schlägt fehl
- **Lösung:** Außerhalb VPN versuchen (Hotspot!)
- Fehler "403 Forbidden" = VPN blockiert

### Datenbank startet nicht
```powershell
# Port 5432 belegt?
netstat -ano | findstr :5432

# Alte Container entfernen:
docker compose down
docker compose up -d
```

### Backend startet nicht nach Restore
```powershell
# Mock wieder aktivieren:
Copy-Item packages/backend/src/prismaClient.mock.ts packages/backend/src/prismaClient.ts -Force
```

---

## 📝 Befehle Übersicht

| Aktion | Befehl |
|--------|--------|
| Server starten | `pnpm dev` |
| Datenbank starten | `docker compose up -d` |
| Datenbank stoppen | `docker compose down` |
| DB ansehen | `pnpm db:studio` |
| Prisma generieren | `pnpm --filter backend exec prisma generate` |

---

## 🎯 Nächste Schritte

1. **Jetzt:** Docker Desktop installieren → Neustart
2. **Mit Hotspot:** Prisma generieren
3. **Danach:** Datenbank starten + Migrationen
4. **Fertig:** Backend läuft vollständig!

Bei Fragen oder Problemen: Cursor Chat nutzen! 🚀
