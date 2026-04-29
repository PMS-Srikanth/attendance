# AttendEase (Attendance Planner)

AttendEase helps you **stay ≥ 75% attendance** by letting you upload your timetable + (optional) current attendance, then plan upcoming classes and see subject-wise warnings and a printable report.

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: FastAPI (Python) with `/api/*` endpoints
- Auth: Firebase Google Sign-In

> Note: `att_flutter/` is intentionally **not part of this repo** (ignored + untracked).

## What you can do in the app

- Upload a **Timetable JSON** (required)
- (Optional) Upload **Attendance CSV** to preload current attendance
- Review/edit timetable mappings
- Plan upcoming classes as **Planned Present / Planned Absent**
- See subject-wise summaries + warnings when you’re near/below 75%
- Generate a **printable report** (PDF via browser print)

## Quick start (Windows / PowerShell)

### 1) Backend (FastAPI)

```powershell
cd attb
python run.ps1
```

Backend runs at `http://localhost:8000`.
Swagger docs: `http://localhost:8000/docs`

### 2) Frontend (Vite)

Open a new terminal:

```powershell
cd att
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Configuration

### Frontend env vars (Firebase + API)

Create `att/.env` (local only) with:

```bash
VITE_API_BASE_URL=http://localhost:8000/api

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Firebase setup steps are documented in `FIREBASE_SETUP.md`.

### Backend env vars (optional)

The backend supports environment configuration. You can copy:

```powershell
cd attb
Copy-Item .env.example .env
```

Common settings:

- `ALLOWED_ORIGINS` (comma-separated) for CORS
- `MINIMUM_ATTENDANCE_THRESHOLD` (defaults to 75)

## How to use (end-user flow)

1. Open the site and **Sign in with Google**.
2. Go to **Upload**.
3. Upload your **Timetable JSON** (or paste JSON).
4. (Optional) Upload **Attendance CSV**.
5. Go to **Review** to confirm/edit.
6. Go to **Planner** and mark upcoming classes planned present/absent.
7. Go to **Summary** → **View Report** to print/save PDF.

For a shareable, step-by-step explanation you can send to classmates, see `USER_FLOW.md`.

## Templates

Starter templates live under `att/public/`:

- `attendance_template.csv`
- `calendar_template.json`
- `timetable_template.json`

## Deployment

- Frontend: Vercel (project lives in `att/`)
- Backend: Render (project lives in `attb/`)

See `DEPLOYMENT_GUIDE.md` for the full deploy walkthrough.

## Repo structure

- `att/` — frontend
- `attb/` — backend
- `QUICK_START.md` — short local run steps
- `DEPLOYMENT_GUIDE.md` — deployment steps
- `FIREBASE_SETUP.md` — Firebase auth setup
- `USER_FLOW.md` — how to use the app