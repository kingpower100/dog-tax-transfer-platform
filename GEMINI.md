# Once-Only Dog Tax Transfer Platform

A digital platform for the secure, cross-municipality transfer of dog tax registrations. It implements the "Once-Only Principle" by allowing data to flow directly between authorities upon citizen consent.

## Project Structure

```text
.
├── backend/                # FastAPI application
│   ├── app/                # Main application logic
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic layer
│   │   ├── models.py       # SQLAlchemy database models
│   │   ├── schemas.py      # Pydantic validation schemas
│   │   └── main.py         # App entry point & middleware
│   ├── dog_tax.db          # SQLite database (auto-generated)
│   └── requirements.txt    # Python dependencies
└── frontend/               # React application (Vite)
    ├── src/
    │   ├── api/            # API client and context
    │   ├── components/     # Reusable UI components
    │   └── pages/          # Application views
    ├── tailwind.config.js  # Styling configuration
    └── package.json        # Node.js dependencies
```

## Tech Stack

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy (SQLite), Pydantic.
- **Frontend:** React, Vite, TailwindCSS.
- **Core Workflow:** Transfer of "Dog" and "Registration" objects between "Municipality" tenants via "TransferRequests".

## Building and Running

### Backend

1.  **Setup Virtual Environment:**
    ```bash
    cd backend
    python -m venv .venv
    source .venv/bin/activate  # Linux/macOS
    # OR: .\.venv\Scripts\Activate.ps1  # Windows
    pip install -r requirements.txt
    ```

2.  **Initialize Database:**
    ```bash
    # Reset and seed with demo data
    python -m app.seed --reset
    ```

3.  **Run Development Server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`. Documentation at `/docs`.

### Frontend

1.  **Install Dependencies:**
    ```bash
    cd frontend
    npm install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The UI will be available at `http://localhost:5173`.

## Development Conventions

### Multi-Tenancy
The platform uses a "Mandant" (Tenant) architecture. 
- Frontend sends the `X-Mandant-ID` header (containing the municipality code, e.g., `MU-123`).
- Backend uses `TenantService` to filter data based on this header.

### State Machine (Transfer Workflow)
The `TransferRequest` follows a multi-step state machine:
`draft` -> `citizen_submitted` -> `consent_given` -> `source_verified` -> `source_approved` -> `target_verified` -> `target_accepted` -> `completed`.

### Audit Logging
All state transitions and data modifications are logged in the `audit_logs` table with a hash-chain mechanism for integrity. Use the `AuditService` for all logging.

### Code Style
- **Backend:** Follow PEP 8. Use Pydantic models for request/response bodies.
- **Frontend:** Functional React components with Tailwind utility classes. Use the centralized `apiGet` and `apiPost` in `src/api/client.js`.

## Key Files
- `backend/app/models.py`: Defines the core domain entities (Municipality, User, Owner, Dog, Registration, TransferRequest).
- `backend/app/services/transfer_service.py`: Orchestrates the complex transfer logic.
- `frontend/src/api/accessContext.js`: Manages the current role and tenant selection in the UI.
- `frontend/src/components/TransferFlow.jsx`: Visualizes the cross-authority process.
