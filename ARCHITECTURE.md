# System Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI (Python 3.12) |
| ORM | SQLAlchemy |
| Database | SQLite (local/demo) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Multi-tenancy | `X-Mandant-ID` request header |

## Multi-Tenancy

All API requests require the `X-Mandant-ID` header containing the municipality code (e.g., `BERLIN`, `HAMBURG`). The `resolve_tenant()` service (`backend/app/services/tenant_service.py`) maps this to a `Municipality` row and all subsequent queries are scoped to that tenant's `municipality_id`.

No cross-tenant data is returned except by platform admin endpoints.

## Database Models

```
Municipality ──< DogTaxRule
             ──< Owner ──< Dog ──< Registration
                              └──< TaxAssessment
Municipality ──< TransferRequest ──< TransferPayload
                                 ──< TransferDocument
                                 ──< TransferApproval
                                 └──< TaxAssessment
AuditLog (hash-chained, never deleted)
```

## Transfer State Machine

```
citizen_submitted
  → consent_given
  → abmeldung_generated
  → source_finance_verified
  → source_finance_approved
  → target_finance_verified
  → target_finance_approved
  → completed

Any state → source_rejected / target_rejected / cancelled / rejected
```

The simplified `POST /ummeldung` endpoint bypasses this workflow and completes in one atomic transaction (demo shortcut).

## Audit Trail

`AuditLog` records are hash-chained: each row contains a `previous_hash` (SHA-256 of the prior row's content) and its own `current_hash`. This creates a tamper-evident ledger — any modification to a past record breaks the chain.

Records are **never deleted**; deregistered registrations keep their history with `status = "deregistered"`.

## API Router Map

```
/anmeldung              POST  – Register dog (creates owner, dog, registration, tax assessment)
/ummeldung              POST  – Direct transfer (one-shot, bypasses multi-step workflow)
/transfer-requests      POST  – Initiate multi-step transfer workflow
/transfer-requests/{id}/consent           POST
/transfers/{id}/generate-abmeldung        POST
/transfers/{id}/source-finance/verify     POST
/transfers/{id}/source-finance/approve    POST
/transfers/{id}/target-finance/verify     POST
/transfers/{id}/target-finance/approve    POST
/transfers/{id}/complete                  POST
/transfer-requests/{id}/source-approve    POST  – Legacy simple workflow
/transfer-requests/{id}/target-accept     POST
/municipalities         GET   – List all tenants
/mandanten              GET   – Alias for /municipalities
/tax-rules              GET   – Tax rules (filtered by X-Mandant-ID)
/citizen/me             GET   – Citizen's dogs and registrations
/dogs                   GET/POST
/registrations          GET
/audit-logs             GET   – Tamper-evident audit chain
/health                 GET
/debug/tables           GET
```

## Frontend Role Model

The frontend is role-gated (UI-only, no backend auth):

| Role | Value | Pages |
|------|-------|-------|
| Citizen / Dog Owner | `CITIZEN` | Dashboard, Register Dog, Transfer, My Transfers |
| Municipality Officer | `MUNICIPALITY` | Outgoing Transfers, Incoming Transfers |
| Platform Admin | `PLATFORM_ADMIN` | Platform Overview, Dashboard, Municipalities, All Dogs, All Registrations, All Transfers, Tax Rules, Audit Logs |

Role and selected tenant are persisted in `localStorage` via `accessContext.js`.
