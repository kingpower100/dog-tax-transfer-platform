# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Once-Only Dog Tax Transfer Platform** is a hackathon MVP for a secure dog tax registration and transfer system across municipalities in Germany. It enables citizens to register dogs, transfer them between municipalities, and track ownership changes. Municipality officers manage incoming/outgoing transfers, and platform admins oversee the entire system.

The application is a full-stack system with:
- **Frontend**: React + Vite with Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy ORM
- **Database**: SQLite (local development)
- **Multi-tenancy**: Tenant-scoped requests via `X-Mandant-ID` header

## Development Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Initialize the database:
```bash
python -m app.seed --reset  # Creates dog_tax.db in backend/
```

Run the API server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

Health check and debug endpoints:
- `GET /health` — API status
- `GET /debug/tables` — Database table summary

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` or `http://localhost:5174`

The development server proxies API requests to `http://127.0.0.1:8000` (configurable via `VITE_API_BASE_URL` env var).

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Build for production:
```bash
npm run build
```

## Architecture

### Backend Structure

**`app/main.py`** — FastAPI application setup, CORS middleware, router registration, database initialization

**`app/models.py`** — SQLAlchemy ORM models defining:
- `Municipality` — municipalities with unique codes and tax configurations
- `Citizen` — dog owners with identification
- `Dog` — dogs with breed, microchip, and ownership records
- `DogRegistration` — registration entries per municipality
- `Transfer` — inter-municipality dog ownership transfers
- `TaxRule` — tax configurations per municipality
- `AuditLog` — system activity tracking

**`app/database.py`** — SQLAlchemy session management, engine, and declarative base

**`app/schemas.py`** — Pydantic models for request/response validation

**`app/routers/`** — Domain-organized API endpoints:
- `municipalities.py` — CRUD for municipalities
- `tax_rules.py` — Tax configuration management
- `citizen.py` — Citizen/dog owner operations
- `dogs.py` — Dog CRUD operations
- `registrations.py` — Dog registration management
- `transfers.py` — Transfer request workflow (initiate, approve, reject, complete)
- `anmeldung.py` — Registration workflow (German: Anmeldung = registration)
- `ummeldung.py` — Re-registration workflow (German: Ummeldung = re-registration)
- `audit_logs.py` — Audit trail queries

**`app/services/`** — Business logic and orchestration:
- `tenant_service.py` — Tenant/municipality context management
- `dog_registration_service.py` — Dog registration workflows
- `tax_service.py` — Tax calculation and application
- `audit_service.py` — Audit log recording

**`app/seed.py`** — Database seeding with test municipalities and sample data

### Frontend Structure

**`src/App.jsx`** — Main application component, role-based page routing, access context management (tenant/role selection stored in localStorage)

**`src/api/`** — API integration:
- `client.js` — HTTP client with automatic `X-Mandant-ID` header injection
- `accessContext.js` — localStorage management for selected tenant and role

**`src/components/`** — Reusable UI components:
- `AppHeader.jsx` — Navigation header with role/tenant selectors
- `RoleSelector.jsx`, `TenantSelector.jsx` — User selection dropdowns
- `DataTable.jsx` — Generic table component with sorting/filtering
- `TransferFlow.jsx` — Visual transfer workflow indicator
- `Stepper.jsx`, `WorkflowStep.jsx` — Multi-step form progression
- Utility components: `AlertBox`, `StatusBadge`, `MetricCard`, `LoadingState`, `EmptyState`, `JsonViewer`

**`src/pages/`** — Feature pages organized by role/workflow:
- **Citizen Pages**: `CitizenHome.jsx`, `RegisterDog.jsx`, `TransferDog.jsx`, `MyDogs.jsx`, `MyRegistrations.jsx`, `IncomingTransfers.jsx`, `OutgoingTransfers.jsx`
- **Officer Pages**: `OfficerOverview.jsx` (incoming/outgoing transfer management)
- **Admin Pages**: `PlatformOverview.jsx`, `Dashboard.jsx`, `Tenants.jsx`, `Dogs.jsx`, `Registrations.jsx`, `Transfers.jsx`, `TaxRules.jsx`, `AuditLogs.jsx`
- **Utility Pages**: `LandingPage.jsx`, `TransferStatus.jsx`, `ComplianceChecklist.jsx`, `TableCounts.jsx`

### API Flow Example: Dog Transfer

1. **Citizen initiates transfer** → `POST /transfers` (transfer request created with status=pending)
2. **Source municipality reviews** → Officer page shows in `OutgoingTransfers`
3. **Officer approves/rejects** → `PATCH /transfers/{id}` with approval action
4. **Destination municipality reviews** → Officer page shows in `IncomingTransfers`
5. **Destination approves** → Transfer completes, dog ownership transferred
6. **Audit logging** — Each action recorded in `audit_logs` table

### Multi-Tenancy Implementation

- **Request Header**: `X-Mandant-ID` sent with every API request containing municipality code (e.g., "BERLIN")
- **Frontend Context**: `accessContext.js` stores and injects the selected tenant code
- **Backend Filtering**: Services use `tenant_service.get_tenant()` to filter all queries to the current tenant
- **Demo Mode**: Frontend role selector is UI-only; no authentication is implemented

## Key Patterns

### Backend

**Dependency Injection**: All routes use `Depends(get_db)` to inject SQLAlchemy session
```python
@router.get("/dogs")
def get_dogs(db: Session = Depends(get_db), tenant_id: str = Header(...)):
    tenant = get_tenant(tenant_id, db)
    return db.query(models.Dog).filter(models.Dog.tenant_id == tenant.id).all()
```

**Service Layer**: Business logic in `app/services/` decoupled from routes
```python
# In routers/dogs.py
from app.services.dog_registration_service import register_dog
register_dog(citizen_id, dog_data, db)
```

**Audit Logging**: Critical operations logged via `audit_service.log_action()`

### Frontend

**Access Context**: Global state for selected tenant/role (localStorage + React state)
```javascript
const { selectedTenant, setSelectedTenant } = useState(loadAccessContext()?.selectedMunicipalityCode);
saveAccessContext({ selectedMunicipality: name, selectedMunicipalityCode: code });
```

**API Client**: Automatic header injection
```javascript
// src/api/client.js
const { selectedMunicipalityCode } = loadAccessContext();
headers["X-Mandant-ID"] = selectedMunicipalityCode;
```

**Role-Based Navigation**: Pages and features change based on `selectedRole`
```javascript
const pages = useMemo(() => rolePages[selectedRole], [selectedRole]);
```

## Development Workflow

### Adding a New API Endpoint

1. Define Pydantic schema in `app/schemas.py`
2. Add database model or query to `app/models.py` if needed
3. Implement business logic in appropriate service in `app/services/`
4. Create router function in `app/routers/` with tenant filtering
5. Include router in `app/main.py`
6. Add corresponding frontend page/component
7. Test with both tenant contexts via frontend selector

### Adding a New Frontend Page

1. Create component in `src/pages/`
2. Import and add to `rolePages` object in `src/App.jsx`
3. Use `apiGet()`, `apiPost()`, etc. from `src/api/client.js` (tenant header auto-injected)
4. Display data using shared components from `src/components/`

### Testing Transfers End-to-End

The frontend provides role/tenant selectors to simulate the full workflow:
1. Select **CITIZEN** role + **BERLIN** tenant
2. Register a dog and initiate a transfer to **HAMBURG**
3. Switch to **MUNICIPALITY** role + **BERLIN** to approve outgoing transfer
4. Switch to **MUNICIPALITY** role + **HAMBURG** to approve incoming transfer
5. Verify dog appears in **HAMBURG**'s registration

## Database

SQLite database file: `backend/dog_tax.db`

Key tables:
- `municipalities` — Tenant configurations
- `citizens` — Dog owners
- `dogs` — Dog records with microchip/registration tracking
- `dog_registrations` — Per-municipality registration status
- `transfers` — Inter-municipality transfer requests with status (pending/approved/rejected/completed)
- `tax_rules` — Tax amounts per municipality
- `audit_logs` — All system actions with timestamp, actor, and details

Seed data created by `python -m app.seed --reset` includes 3 municipalities (Berlin, Hamburg, Munich) with sample citizens, dogs, registrations, and tax rules.

## Debugging

**Backend logs**: Run `uvicorn app.main:app --reload` with `--log-level debug` for verbose output

**Frontend network**: Browser DevTools Network tab shows all API requests including `X-Mandant-ID` headers

**Database inspection**: Use any SQLite browser on `backend/dog_tax.db` or query via backend debug endpoint `/debug/tables`

**API documentation**: FastAPI auto-generates OpenAPI docs at `http://127.0.0.1:8000/docs` (Swagger UI)

## Notes

- This is a hackathon MVP — no production authentication/authorization is implemented
- The frontend role selector is UI-only; all multi-tenancy enforcement is on the backend
- Database is SQLite (suitable for development/demo); production should migrate to PostgreSQL/MySQL
- Transfer workflow state machine is simplified; real implementation may need additional status transitions
