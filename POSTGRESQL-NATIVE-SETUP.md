# 🐘 PostgreSQL Native Installation (Ohne Docker)

## Warum diese Lösung?
- ✅ Kein Docker nötig
- ✅ Keine Administrator-Rechte für tägliche Nutzung
- ✅ Genau wie dein Kollege auf Mac arbeitet
- ✅ Einfacher als Docker

---

## 📥 Installation

### Schritt 1: PostgreSQL herunterladen

**Download:**
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

**Version wählen:**
- PostgreSQL 16.x (neueste 16er Version)
- Windows x86-64

### Schritt 2: Installation

⚠️ **Einmalig Admin-Rechte nötig** - über IT-Ticket anfragen:

```
Software Request: PostgreSQL 16.x for Windows
Reason: Database for local development of Sixt Franchise Interfacing App
Alternative to Docker Desktop (which cannot be provided)
```

**Bei Installation:**
1. Standard-Port: `5432` ✅
2. Superuser: `postgres`
3. Passwort setzen: `sixt_secret` (oder eigenes merken!)
4. Locale: `German, Germany` oder `C`
5. ✅ "Stack Builder" NICHT installieren (nicht nötig)

### Schritt 3: Datenbank erstellen

**Option A - pgAdmin (GUI):**
- Start → pgAdmin 4
- Rechtsklick auf "Databases" → Create → Database
- Name: `interfacing`
- Save

**Option B - Terminal:**
```powershell
# PostgreSQL bin Ordner (typisch):
cd "C:\Program Files\PostgreSQL\16\bin"

# Datenbank erstellen:
.\psql.exe -U postgres -c "CREATE DATABASE interfacing;"
```

---

## 🔧 Projekt konfigurieren

### Schritt 4: .env Datei anpassen

**Pfad:**
```
packages/backend/.env
```

**Inhalt ändern zu:**
```env
DATABASE_URL=postgresql://postgres:sixt_secret@localhost:5432/interfacing
PORT=3001
FRONTEND_URL=http://localhost:3000
```

⚠️ Falls anderes Passwort bei Installation gesetzt:
```env
DATABASE_URL=postgresql://postgres:DEIN_PASSWORT@localhost:5432/interfacing
```

---

## 🚀 Prisma einrichten

### Schritt 5: Prisma generieren (außerhalb VPN!)

```powershell
# Mit Hotspot verbinden, dann:
cd "C:\Users\n420287\Sixt GmbH & Co. Autovermietung KG\Int. Franchise Controlling - Franchise CO App\Sx-interfacing-app"

$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
pnpm --filter backend exec prisma generate
```

### Schritt 6: Datenbank-Schema anlegen

```powershell
# Zurück im Firmen-WLAN:
pnpm --filter backend exec prisma migrate dev --name init
```

### Schritt 7: Original Prisma Client aktivieren

```powershell
.\restore-prisma.ps1
```

---

## ✅ Server starten

```powershell
pnpm dev
```

**Fertig!** 🎉
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL läuft nativ

---

## 🔧 PostgreSQL verwalten

### Service starten/stoppen (Windows Services)

```powershell
# Als Administrator (oder über Services-GUI):
net start postgresql-x64-16
net stop postgresql-x64-16
```

**Oder:**
- Windows-Taste → "Services" → "postgresql-x64-16"
- Rechtsklick → Start/Stop

### Datenbank ansehen

```powershell
# Prisma Studio (einfachste Methode):
pnpm db:studio
# Browser öffnet: http://localhost:5555
```

**Oder pgAdmin:**
- Start → pgAdmin 4
- Server → PostgreSQL 16 → Databases → interfacing

---

## 📊 Vergleich: Docker vs. Native

| Aspekt | Docker | Native PostgreSQL |
|--------|--------|-------------------|
| Installation | ❌ Nicht erlaubt | ✅ Möglich (via IT) |
| Admin-Rechte | ❌ Täglich nötig | ✅ Nur Installation |
| Performance | ⚠️ Overhead | ✅ Nativ schnell |
| Komplexität | ⚠️ Höher | ✅ Einfacher |
| Wie Kollege arbeitet | ❌ Nein | ✅ **Genau gleich!** |

---

## 🎯 IT-Ticket Text

```
Software Request: PostgreSQL 16.x for Windows (Native Installation)

Reason: 
Required for local development of Sixt Franchise Interfacing Application. 
The Mac development team uses native PostgreSQL installation (via Homebrew), 
and I need the same setup for Windows to maintain environment consistency. 
Docker Desktop cannot be provided due to IT policies, making native PostgreSQL 
the appropriate alternative.

Installation needs:
- PostgreSQL 16.x Windows x86-64 installer
- One-time administrator rights for installation
- Standard configuration (port 5432)

After installation, daily operations require no elevated privileges.

Alternative source if needed: 
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
```

---

## ❓ Troubleshooting

### Port 5432 bereits belegt
```powershell
netstat -ano | findstr :5432
# Wenn etwas läuft: Process beenden oder anderen Port nutzen
```

### PostgreSQL startet nicht
- Services prüfen (Windows Services)
- Logs: `C:\Program Files\PostgreSQL\16\data\log\`

### Connection refused
- PostgreSQL Service läuft? `services.msc` prüfen
- Firewall blockiert? Port 5432 freigeben
- DATABASE_URL korrekt? Passwort stimmt?

---

## ✅ Vorteile dieser Lösung

1. ✅ **Keine Docker-Abhängigkeit**
2. ✅ **Identisch zum Mac-Workflow**
3. ✅ **IT-konform**
4. ✅ **Bessere Performance**
5. ✅ **Einfachere Wartung**

Dein Kollege macht genau das Gleiche - nur mit Homebrew statt Windows Installer! 🎉
