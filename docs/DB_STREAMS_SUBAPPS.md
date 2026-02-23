# Datenbankstruktur: Streams & Sub-Apps

## Tabellen

### `streams`

| Spalte       | Typ    | Beschreibung |
|-------------|--------|--------------|
| id          | Int (PK) | Eindeutige ID |
| name        | String (unique) | Stream-Name, z. B. "Franchise Controlling", "B2P Controlling" |
| sortOrder   | Int (default 0) | Reihenfolge der Streams (0 = zuerst) |
| streamOwner | String? | Verantwortlicher für den gesamten Stream |

**Beziehung:** Ein Stream hat viele Sub-Apps (`sub_apps.streamId` → `streams.id`).

---

### `sub_apps`

| Spalte        | Typ    | Beschreibung |
|---------------|--------|--------------|
| id            | Int (PK) | Eindeutige ID |
| streamId      | Int (FK → streams.id) | Zugehöriger Stream |
| app           | String | Anzeigename der Sub-App, z. B. "Interfacing", "FSM-Calculation" |
| owner         | String? | Sub-App-Owner |
| status        | String (default "Planning") | Live, Dev, Testing, Planning, Backlog, Blocked, Live & IT Approved |
| description   | String? | Kurzbeschreibung |
| deadlineTarget| String? | Ziel-Deadline (z. B. DD/MM/YYYY) |
| budgetHours   | Float? | Current Workload p.m. (Automation Controlling) |
| isStarted     | Boolean (default false) | **Option B:** Sub-App „gestartet“ → Link/Kachel für alle Nutzer sichtbar |

**Unique:** `(streamId, app)` – pro Stream ist jeder App-Name nur einmal möglich.

**Beziehung:** Viele Sub-Apps gehören zu einem Stream (`sub_apps.stream` → `streams`).

---

## Ablauf

- **Streams** definieren die oberste Ebene (z. B. Franchise Controlling, B2P Controlling).
- **Sub-Apps** hängen an genau einem Stream; jede Sub-App hat Owner, Status, optional Budget-Stunden und das Flag **isStarted**.
- Die Reihenfolge der Streams kommt aus `streams.sortOrder`; die API `/api/registry` liefert alles in einer Struktur (streamOrder + registry mit allen Sub-App-Feldern inkl. isStarted).
