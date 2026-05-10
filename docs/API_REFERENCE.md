# API Reference

Base URL: `http://127.0.0.1:8000`  
Interactive docs: `http://127.0.0.1:8000/docs`

All tenant-scoped endpoints require the `X-Mandant-ID` header.

---

## Registration

### `POST /anmeldung`
Register a dog for dog tax in a municipality.

**Headers:** `X-Mandant-ID: <MUNICIPALITY_CODE>`

**Request:**
```json
{
  "halter": {
    "vorname": "Max", "nachname": "Mustermann",
    "geburtsdatum": "1985-06-15",
    "strasse": "Hauptstr.", "hausnummer": "1",
    "plz": "10115", "ort": "Berlin",
    "email": "max@example.de", "telefon": "030123456"
  },
  "hund": {
    "name": "Bello", "chipnummer": "276098102000001",
    "rasse": "Labrador", "geburtsdatum": "2021-03-10",
    "geschlecht": "male", "typ": "NORMAL"
  },
  "assistance_dog": false,
  "liability_insurance_available": true,
  "insurance_policy_number": "INS-123456"
}
```

**Response (201):**
```json
{
  "status": 201, "message": "Anmeldung erfolgreich erstellt",
  "mandant": "BERLIN",
  "personId": 42, "hundId": 17, "registrierungId": 99,
  "steuerbetrag": 120, "waehrung": "EUR",
  "veranlagungsjahr": 2026, "dog_position": 1, "tax_rule_id": 3
}
```

**Validation:**
- `chipnummer` is mandatory → HTTP 400 if missing
- Duplicate chip in same tenant → HTTP 409

---

### `POST /ummeldung`
Transfer a registered dog from one municipality to another (one-shot, atomic).

**Headers:** `X-Mandant-ID: <TARGET_MUNICIPALITY_CODE>`

**Request:**
```json
{
  "von_mandant": "BERLIN",
  "chipnummer": "276098102000001",
  "neue_adresse": {
    "strasse": "Bahnhofstr.", "hausnummer": "5",
    "plz": "30159", "ort": "Hannover"
  }
}
```

**Response (200):**
```json
{
  "status": 200, "message": "Ummeldung erfolgreich abgeschlossen",
  "uebernommen_von": "BERLIN", "ziel_mandant": "HANNOVER",
  "personId": 55, "hundId": 22, "registrierungId": 110,
  "neuer_steuerbetrag": 150, "waehrung": "EUR",
  "veranlagungsjahr": 2026, "dog_position": 1,
  "tax_rule_id": 7, "protokoll_id": 8
}
```

**Side effects:**
- Source dog status → `transferred`
- Source registration status → `deregistered` (retained, not deleted)
- New `Owner`, `Dog`, `Registration`, `TaxAssessment` created in target tenant
- Audit log entries created for every step

---

## Transfer Workflow (Multi-Step)

### `POST /transfer-requests`
Initiate a multi-step transfer (citizen-driven, with consent and finance approvals).

### `POST /transfers/{id}/consent`
Citizen gives GDPR consent for data transfer.

### `POST /transfers/{id}/generate-abmeldung`
Generates the deregistration document (Abmeldebescheinigung).

### `POST /transfers/{id}/source-finance/verify`
Source municipality finance officer verifies the request.

### `POST /transfers/{id}/source-finance/approve`
Source municipality releases the dog (marks source as deregistered).

### `POST /transfers/{id}/target-finance/verify`
Target municipality verifies incoming data.

### `POST /transfers/{id}/target-finance/approve`
Target municipality approves — triggers new registration + tax calculation.

### `POST /transfers/{id}/complete`
Finalizes the transfer.

---

## Audit Logs

### `GET /audit-logs`
Returns tamper-evident hash-chained audit entries.

**Headers:** `X-Mandant-ID: <MUNICIPALITY_CODE>` (or platform admin context)

Each entry includes `previous_hash` and `current_hash` forming a verifiable chain.

---

## Tax Rules

### `GET /tax-rules`
Returns tax rules for the current tenant.

**Headers:** `X-Mandant-ID: <MUNICIPALITY_CODE>`

---

## Utilities

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | API health status |
| `/debug/tables` | GET | Row counts for all tables |
| `/municipalities` | GET | All municipalities (no header required) |
| `/mandanten` | GET | Alias for `/municipalities` |
| `/citizen/me` | GET | Current citizen's dogs and registrations |
