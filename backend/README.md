# Once-Only Dog Tax - Backend

Local FastAPI and SQLAlchemy database layer for the hackathon MVP.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Database

Create and seed the local SQLite database:

```powershell
python -m app.seed --reset
```

This creates `dog_tax.db` in the `backend` directory.

## Run

```powershell
uvicorn app.main:app --reload
```

Development endpoints:

- `GET /health`
- `GET /debug/tables`
