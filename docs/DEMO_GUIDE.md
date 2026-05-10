# Demo Guide — Hackathon Walkthrough

## One-Command Startup

```bash
./start.sh
```

Prerequisites: Python 3.11+, Node 18+

- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5173
- API docs (Swagger): http://127.0.0.1:8000/docs

---

## Seeded Demo Data

The database is pre-seeded with:
- **5 municipalities**: Berlin, Hamburg, Hannover, Leverkusen, Freiburg
- **Demo citizen** (user ID 1001) with dogs registered in Berlin and Hamburg
- Tax rules sourced from real German law (see TAX_LOGIC.md)

---

## Demo Scenario 1: Direct Transfer via `POST /ummeldung`

This demonstrates the core hackathon endpoint.

```bash
# Register a dog in Berlin first
curl -X POST http://127.0.0.1:8000/anmeldung \
  -H "Content-Type: application/json" \
  -H "X-Mandant-ID: BERLIN" \
  -d '{
    "halter": {
      "vorname": "Max", "nachname": "Mustermann",
      "strasse": "Unter den Linden", "hausnummer": "1",
      "plz": "10117", "ort": "Berlin"
    },
    "hund": {
      "name": "Bello", "chipnummer": "276098102000001",
      "rasse": "Labrador", "typ": "NORMAL"
    }
  }'
# → Returns: steuerbetrag: 120 (Berlin 1st dog rate)

# Transfer Bello to Hannover
curl -X POST http://127.0.0.1:8000/ummeldung \
  -H "Content-Type: application/json" \
  -H "X-Mandant-ID: HANNOVER" \
  -d '{
    "von_mandant": "BERLIN",
    "chipnummer": "276098102000001",
    "neue_adresse": {
      "strasse": "Bahnhofstrasse", "hausnummer": "5",
      "plz": "30159", "ort": "Hannover"
    }
  }'
# → Returns: neuer_steuerbetrag: 150 (Hannover 1st dog rate — different!)
# → Berlin registration: status = "deregistered" (never deleted)
```

**Key talking points:**
- Same dog, same owner — but tax changes from €120 (Berlin) to €150 (Hannover)
- Source record is DEREGISTERED, not deleted — audit integrity preserved
- No re-entry of dog or owner information required

---

## Demo Scenario 2: Full Workflow via UI

1. Open http://localhost:5173 → Select **Citizen**
2. Go to **Citizen Dashboard** — shows registered dogs and current tax amounts
3. Click **Move Dog to Another Municipality** → Fill transfer form
4. Switch to **Berlin Officer** → **Outgoing Transfers** → Approve
5. Switch to **Hannover Officer** → **Incoming Transfers** → Approve
6. Switch back to **Citizen** → **My Transfers** → Status: Completed
7. See new registration with Hannover tax rate

---

## Demo Scenario 3: Platform Admin View

1. Open http://localhost:5173 → Select **Platform Admin**
2. **Audit Logs** — tamper-evident hash-chained log of all actions
3. **Tax Rules** — compare rates across all municipalities side-by-side
4. **All Transfers** — cross-municipality transfer visibility

---

## Legal References (Slide Material)

| Municipality | Statute | Source URL |
|---|---|---|
| Berlin | Hundesteuersatzung des Landes Berlin | https://gesetze.berlin.de/bsbe/document/jlr-HuStGBErahmen |
| Hamburg | Hamburgisches Hundesteuergesetz (1995, as amended) | https://www.landesrecht-hamburg.de/bsha/document/jlr-HuStGHA1995rahmen |

---

## Tax Difference "Wow Moment"

| Municipality | 1st Dog | Listenhund |
|---|---|---|
| Berlin | **€120** | €600 |
| Hamburg | **€90** | €600 |
| Hannover | **€150** | €720 |
| Leverkusen | **€156** | €720 |
| Freiburg | **€102** | €600 |

Moving a Listenhund from Hamburg (€600) to Hannover (€720) = +€120 automatically recalculated, zero re-entry.
