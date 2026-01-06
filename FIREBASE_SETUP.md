# 🔥 Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" → Enter name → Create
3. Click web icon (`</>`) → Register app
4. Copy the config values

## Step 2: Enable Google Authentication

1. Go to Authentication → Get started
2. Sign-in method → Google → Enable
3. Enter support email → Save

## Step 3: Configure App

Create `att/.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:8000/api
```

## Step 4: Test

```bash
cd attb && python run.ps1  # Start backend
cd att && npm run dev      # Start frontend
```

Visit http://localhost:5173 and test Google sign-in.

## Production Setup

After deploying to Vercel:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain: `your-app.vercel.app`

When deploying to Vercel:

1. Go to your project → Settings → Environment Variables
2. Add each `VITE_FIREBASE_*` variable
3. Redeploy

---

## 🐛 Troubleshooting

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Fix:** Add your domain to Firebase Authorized domains (Step 6)

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Fix:** Double-check all environment variables are correct

### Issue: Login button does nothing
**Fix:** Check browser console for errors, ensure Firebase config is correct

### Issue: Redirect after login goes to login page
**Fix:** Check that ProtectedRoute is wrapping your routes correctly

---

## 📊 Monitoring

You can monitor authentication in Firebase Console:

- **Authentication → Users:** See all signed-in users
- **Authentication → Usage:** View authentication activity
- **Authentication → Settings:** Configure email templates, etc.

---

## 🎉 You're Done!

Your app now has:
- ✅ Google OAuth authentication
- ✅ Protected routes
- ✅ User session management
- ✅ Logout functionality

Users must sign in with Google to access the app!

---

## 📞 Need Help?

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com)
- Check the error messages in browser console
