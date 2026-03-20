## InfraDesk (Next.js + Django + Postgres)

This repo is a starter scaffold to turn your `infradesk-v2-2.html` demo into a real web app.

### What you get right now
- **Frontend**: Next.js (App Router) in `frontend/`
- **Backend**: Django + DRF + JWT in `backend/`
- **DB**: Postgres (Docker) + Redis (Docker)
- **API (v1 skeleton)**:
  - `POST /api/auth/login/` (JWT)
  - `POST /api/auth/refresh/`
  - `GET /api/auth/me/`
  - `GET /api/zones/`
  - `GET /api/complaint-types/`
  - `GET/POST /api/tickets/` (authenticated)
  - `GET /api/tickets/{uuid}/`
  - `POST /api/tickets/{uuid}/status/`
  - `GET /api/tickets/{uuid}/updates/`
  - `POST /api/public/tickets/` (public submit → returns tracking token)
  - `POST /api/public/tickets/track/` (public track using ticket_no + token)

---

## Step-by-step startup guide (Docker, recommended)

### 1) Prerequisites
- Install **Docker Desktop** (Windows)

### 2) Create env file for backend
Copy the example env and rename it:

- From `backend/.env.example` create `backend/.env`

Defaults are already set to work with `docker-compose.yml`.

### 3) Start everything
From `e:\InfraDesk`:

```bash
docker compose up --build
```

### 4) Open the apps
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/zones/`
- **Django admin**: `http://localhost:8000/admin/`

### 5) Create an admin user
In a new terminal:

```bash
docker compose exec backend python manage.py createsuperuser
```

Then login at `/admin/`.

---

## Step-by-step startup guide (local dev without Docker)

### 1) Start Postgres (optional)
You can either:
- use **SQLite** for quick dev (no Postgres needed), or
- run Postgres locally, or
- run only DB/Redis from docker:

```bash
docker compose up db redis
```

### 2) Backend
From `e:\InfraDesk`:

```bash
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
copy backend\.env.example backend\.env
set DB_ENGINE=sqlite
.\.venv\Scripts\python backend\manage.py migrate
.\.venv\Scripts\python backend\manage.py seed_core
.\.venv\Scripts\python backend\manage.py createsuperuser
.\.venv\Scripts\python backend\manage.py runserver 8000
```

### 3) Frontend
From `e:\InfraDesk\frontend`:

```bash
npm install
set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
npm run dev
```

Open `http://localhost:3000`.

---

## Next steps you should implement next (internet-ready)
- **Public submission + tracking**: implemented using a **tracking token** (stored hashed server-side).
- **RBAC** (JE/AE/EE/SE) and staff scoping by zone/type.
- **Email outbox** + Celery worker (assignment + status emails).
- **Attachments** (S3 + presigned URLs).

---

## Public tracking-token flow (how it works)

### 1) Submit (public)
`POST /api/public/tickets/` with:
- `name`, `email`, `phone` (optional)
- `zone_id`, `complaint_type_id`
- `subject`, `description`, `location_text`, `priority`

Response:
- `ticket_no`
- `tracking_token` (**shown only once** — you must store it on the client / show user to save it)

### 2) Track (public)
`POST /api/public/tickets/track/` with:
- `ticket_no`
- `token` (the `tracking_token` you received)

Response: limited ticket fields (status/priority/zone/type/etc).

---

## How to sync frontend ↔ backend changes (important)

### 1) Keep the API base URL aligned
- Backend runs on `http://localhost:8000`
- Frontend uses `NEXT_PUBLIC_API_BASE_URL`

Set it in one place:
- `frontend/.env.local` (copy from `frontend/.env.local.example`)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Restart `npm run dev` after changing env vars.

### 2) When you change Django models (backend)
Any time you edit `backend/*/models.py`:

```bash
.\.venv\Scripts\python backend\manage.py makemigrations
.\.venv\Scripts\python backend\manage.py migrate
```

If you’re using Docker:

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### 3) When you change API request/response shapes
Right now the frontend types live in `frontend/src/lib/api.ts`.
- If you add/remove a field in a serializer or endpoint, update the corresponding TypeScript type in that file.

### 4) Recommended next: generate types automatically (so they never drift)
Best practice is to add an OpenAPI schema in DRF and generate TS types from it.
- Backend: expose OpenAPI schema (Swagger)
- Frontend: run a generator to create types from that schema

When you’re ready, ask and I’ll wire this up so a single command regenerates frontend types.

