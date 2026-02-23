# LocalStorage vs. Datenbank – Übersicht

Diese Übersicht listet **alle Daten**, die aktuell im **localStorage** des Browsers gespeichert werden. Gemeinsam kann entschieden werden, welche davon nach einem Neustart (oder auf anderen Geräten) aus der **Datenbank** kommen sollen.

---

## Bereits in der DB

| Thema | Ehemaliger Key | Beschreibung |
|--------|----------------|--------------|
| **Streams, Sub-Apps, Sub-App-Owner** | `subAppOwners_v2` | Tabellen `streams`, `sub_apps`, API `/api/registry`. |
| **Reihenfolge der Streams** | `streamOrder_v1` | In `streams.sortOrder`, über `/api/registry`. |
| **Team-Mitglieder** | `teamMembers_v2` | Tabelle `team_members`, API `GET/PUT /api/team-members`. Dropdowns und Leaderboard nutzen die DB. |
| **Budget-Stunden (Current Workload p.m.)** | `automationBudgetHours_v1` | Spalte `sub_apps.budgetHours`, über `/api/registry` gelesen/geschrieben. Automation Controlling speichert in der Registry. |

---

## Noch im LocalStorage – gemeinsam beplanen

### Gestartete Sub-Apps („Start Sub-App“)

| Key | Wo genutzt | Inhalt |
|-----|------------|--------|
| `startedSubApps_v1` | Sub-App Owners (API/App/DB Management), Home-Kacheln, GenericSubAppPage | Liste von App-Slugs (z. B. `['parameter-maintenance', 'interfacing']`). |

---

## Was „gestartete Sub-Apps“ konkret bedeutet

**Aktuelles Verhalten:**

1. **Wo:** Im Reiter **Coding Team → Sub-App Owners** (bzw. API, App, DB Management → Sub-App Owners) hat jede Sub-App einen Button **„▶ Start Sub-App“** – aber nur, wenn die Sub-App noch **nicht** „gestartet“ ist.
2. **Was passiert beim Klick:** Der Slug der Sub-App (z. B. `parameter-maintenance`) wird in **localStorage** unter `startedSubApps_v1` gespeichert.
3. **Folge:**  
   - **Sub-App Owners:** Statt „▶ Start Sub-App“ erscheint ein **Link** zur Sub-App (z. B. `/sub-app/parameter-maintenance`).  
   - **Home:** Klick auf die entsprechende **Kachel** (z. B. „Parameter Maintenance“) führt zu dieser Sub-App (Feature-Request-Liste etc.).  
   - **GenericSubAppPage:** Unter `/sub-app/:slug` wird die gefilterte Feature-Request-Ansicht für diese Sub-App angezeigt.
4. **Einschränkung:** Die Liste „gestarteter“ Sub-Apps liegt **nur im Browser** (localStorage). Nach Neustart/Browser-Wechsel/anderem Gerät ist sie leer – die Links/Kacheln verhalten sich wieder so, als wäre keine Sub-App „gestartet“.

**Konkret für die Beplanung:**

- **Option A – weiter nur localStorage:** Jeder Nutzer/jedes Gerät hat seine eigene Liste. Nach Neustart muss man ggf. erneut „Start Sub-App“ klicken. Keine Änderung nötig.
- **Option B – in DB (z. B. Flag pro Sub-App):** Eine Sub-App gilt **global** als „gestartet“ (z. B. Spalte `sub_apps.isStarted` oder eigene Tabelle). Dann sehen **alle** Nutzer dieselben Links/Kacheln, unabhängig von Gerät und Neustart. Dafür braucht es: DB-Schema (Flag oder Tabelle), API zum Setzen/Lesen, Frontend umstellen von localStorage auf API.

**Entscheidung:** Soll „gestartet“ **pro Nutzer/Gerät** bleiben (A) oder **global für alle** in der DB geführt werden (B)? Davon hängt die konkrete Umsetzung ab.
