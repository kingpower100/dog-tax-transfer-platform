# Once-Only Dog Tax Frontend

React + Vite demo UI for the Once-Only Dog Tax secure transfer layer.

## Run

```bash
npm install
npm run dev
```

The backend must be running at:

```text
http://127.0.0.1:8000
```

The API client defaults to `http://127.0.0.1:8000`. You can override it with:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Tenant-scoped requests send `X-Mandant-ID` with the selected tenant code.

## Demo Roles

- Citizen / Dog Owner
- Municipality Officer
- Platform Admin

The role selector is frontend-only and does not implement authentication. All tables and forms use real FastAPI endpoints.
