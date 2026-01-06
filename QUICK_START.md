# 🎯 Quick Start Guide

## Local Development

```bash
# Start backend
cd attb
python run.ps1

# Start frontend (new terminal)
cd att
npm run dev
```

Open http://localhost:5173

## Setup Firebase (Required)

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Authentication
3. Copy config to `att/.env` file
4. Restart frontend

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for details.

## Deploy

1. Push code to GitHub
2. Deploy frontend to Vercel
3. Deploy backend to Render

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.
