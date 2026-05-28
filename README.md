# Grade Portal — Dampol 1st National High School

Production-target monorepo for the school grading portal.

## Structure

```text
gradeportal2/
├── frontend/          # React (CRA)
├── backend/           # Django + DRF + MySQL/SQLite
├── docker-compose.yml # Local MySQL + API
├── nginx/             # Production reverse proxy example
└── README.md
```

## Quick start (development)

### Backend (Django API)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

API root: `http://localhost:8000/api/v1/`

- Health: `GET /api/v1/health/`
- Login: `POST /api/v1/auth/login/` — body: `{ "email": "...", "password": "..." }`
- reCAPTCHA: `POST /api/v1/auth/verify-recaptcha/` — body: `{ "token": "..." }`

Domain apps (`students`, `enrollment`, etc.) return scaffold responses until models and endpoints are implemented.

### Frontend (React)

```bash
cd frontend
npm install
copy .env.example .env
npm start
```

Set `REACT_APP_API_BASE_URL=http://localhost:8000/api/v1` in `frontend/.env`.

Use `src/services/apiClient.js` for all new API calls.

### Docker (MySQL + backend)

```bash
docker compose up --build
```

## Architecture

- **Backend**: domain Django apps under `backend/apps/`, shared utilities in `backend/shared/`
- **Settings**: `config/settings/base.py`, `development.py`, `production.py`
- **Auth**: JWT (SimpleJWT), custom `User` with roles
- **Database**: SQLite for local dev (`USE_SQLITE=true`); MySQL for production/docker

## Phase 1 — Enrollment, students, academics (implemented)

### Backend APIs

| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/v1/enrollment/` | List / create enrollments |
| `GET /api/v1/enrollment/registrar-requests/` | Registrar queue |
| `GET /api/v1/enrollment/admin-incoming/` | Admin approval queue |
| `POST /api/v1/enrollment/{id}/registrar-status/` | Registrar approve/reject |
| `POST /api/v1/enrollment/{id}/admin-status/` | Admin approve/reject |
| `POST /api/v1/enrollment/bulk-section-assignments/` | Section assignment |
| `GET /api/v1/students/` | Student profiles |
| `GET /api/v1/academics/grades/` | Grade records |

### Seed development data

```bash
cd backend
python manage.py seed_enrollment
python manage.py seed_students
python manage.py seed_academics
python manage.py seed_staff --password changeme123
```

Staff JWT login: `registrar@dampol.edu.ph` / `changeme123` (change before production).

### Phase 2 — Student & parent JWT + dashboard

```bash
python manage.py seed_student_accounts --password changeme123
```

| Role | Login | Password |
|------|-------|----------|
| Student | LRN `2025-001` at `/api/v1/auth/login/student/` | `changeme123` |
| Parent | `parent@dampol.edu.ph` + child LRN `2025-001` at `/api/v1/auth/login/parent/` | `changeme123` |

- `GET /api/v1/students/dashboard/` — grades and profile (JWT required)
- Parents pass `?lrn=` for linked child

### Phase 2b — Teacher grade APIs

```bash
python manage.py seed_teacher_assignments
```

| Endpoint | Description |
|----------|-------------|
| `GET/POST/PATCH/DELETE /api/v1/academics/grades/` | Grade CRUD (teacher assignments enforced) |
| `POST /api/v1/academics/grades/bulk/` | Bulk encode grades |
| `GET /api/v1/academics/grades/by-student/?lrn=` | View student grades (parent consent required) |
| `GET /api/v1/teachers/roster/` | Teacher student roster |
| `GET /api/v1/teachers/assignments/` | Teacher subject assignments |

Teacher login: `teacher@dampol.edu.ph` / `changeme123`

### Frontend

Set `REACT_APP_API_BASE_URL=http://localhost:8000/api/v1` in `frontend/.env`.  
`enrollmentStore.js` uses the API when configured, with local fallback if the API is unreachable.

## Migration from legacy layout

The React app was copied from `gradeportal2/gradeportal/gradeportal/gradeportal/` into `frontend/`. Use **`frontend/`** as the active app. The Express `server/` stub is superseded by Django `apps/authentication/`.

## Deployment

1. Deploy **backend** first (migrations, env vars, Gunicorn).
2. Deploy **frontend** static build with `REACT_APP_API_BASE_URL` pointing to production API.
3. Configure Nginx (see `nginx/gradeportal.conf`) for TLS, `/api/`, and static files.

## Security

- Never commit `.env` files.
- Do not use demo passwords in production.
- Set `DEBUG=False` and strict `CORS_ALLOWED_ORIGINS` in production.
