# AttendEase (Attendance Planner)

AttendEase is an attendance planning tool with a **React + TypeScript** frontend and a **FastAPI** backend.

- Frontend: timetable upload, calendar/holidays, attendance planning, summary dashboard
- Backend: parsing/processing, attendance calculation (75% threshold), API endpoints
- Auth: Firebase Google OAuth (frontend)

> Note: The `att_flutter/` directory exists locally but is **ignored by git** and will not be pushed.

## Repository structure

- `att/` — Frontend (Vite + React + Tailwind)
- `attb/` — Backend (Python + FastAPI)
- `DEPLOYMENT_GUIDE.md` — Deploy (Vercel + Render)
- `FIREBASE_SETUP.md` — Firebase / Google OAuth setup
- `QUICK_START.md` — Quick local run steps

## Prerequisites

- Node.js 18+ (recommended)
- Python 3.10+ (see `attb/runtime.txt` if present)

## Run locally

### 1) Backend

PowerShell:

```powershell
cd attb
python run.ps1
```

Or directly:

```powershell
cd attb
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

### 2) Frontend

In a new terminal:

```powershell
cd att
npm install
npm run dev
```

Open: http://localhost:5173

## Firebase (Google Login)

Firebase config is read from env vars.

- Follow `FIREBASE_SETUP.md`
- Create `att/.env` locally (do not commit secrets)

## Deployment

- Frontend: Vercel
- Backend: Render

See `DEPLOYMENT_GUIDE.md`.

## Troubleshooting

- If login fails, re-check Firebase OAuth settings and `att/.env` values.
- If the backend won’t start, confirm your Python version and installed dependencies.

## License

Add a license if/when you’re ready.