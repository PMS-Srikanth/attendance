# 🔥 Firebase Setup Guide for Google OAuth

This guide will walk you through setting up Firebase Authentication for your AttendEase app.

## 📋 Prerequisites

- Google account
- 5-10 minutes

---

## 🚀 Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com)**

2. **Click "Add project" or "Create a project"**

3. **Enter project name:** `AttendEase` (or any name you prefer)

4. **Google Analytics:** You can disable it for now (optional)

5. **Click "Create project"** and wait for it to be ready

6. **Click "Continue"** once your project is ready

---

## 🌐 Step 2: Register Your Web App

1. **In the Firebase Console, click the web icon (`</>`)** to add a web app

2. **App nickname:** `AttendEase Web`

3. **Firebase Hosting:** Leave unchecked (we're using Vercel)

4. **Click "Register app"**

5. **Copy the configuration object** - you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "attendease-xxxxx.firebaseapp.com",
  projectId: "attendease-xxxxx",
  storageBucket: "attendease-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd..."
};
```

---

## 🔐 Step 3: Enable Google Authentication

1. **In Firebase Console, go to:** Build → Authentication

2. **Click "Get started"**

3. **Click on "Sign-in method" tab**

4. **Click on "Google"** from the providers list

5. **Toggle "Enable"** switch

6. **Project public-facing name:** `AttendEase`

7. **Project support email:** Select your email

8. **Click "Save"**

✅ Google Authentication is now enabled!

---

## 📝 Step 4: Configure Your App

1. **Create a `.env` file** in the `att/` directory (frontend)

2. **Copy contents from `.env.example`**

3. **Fill in your Firebase config values:**

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=attendease-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=attendease-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=attendease-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcd...
VITE_API_BASE_URL=http://localhost:8000/api
```

4. **Save the file**

---

## 🧪 Step 5: Test Locally

1. **Start your backend:**
```bash
cd attb
python run.ps1  # or ./run.sh on Mac/Linux
```

2. **Start your frontend:**
```bash
cd att
npm run dev
```

3. **Open:** http://localhost:5173

4. **You should see the login page**

5. **Click "Continue with Google"**

6. **Sign in with your Google account**

7. **You should be redirected to the Upload page** ✅

---

## 🌍 Step 6: Configure for Production (After Deployment)

Once you deploy to Vercel, you need to add your production domain to Firebase:

1. **Go to Firebase Console → Authentication → Settings**

2. **Scroll to "Authorized domains"**

3. **Click "Add domain"**

4. **Add your Vercel domain:** `your-app.vercel.app`

5. **Click "Add"**

---

## 🔒 Security Best Practices

### Don't commit `.env` file
Your `.env` file contains sensitive keys. Make sure it's in `.gitignore`:

```gitignore
.env
.env.local
.env.production
```

### Add environment variables to Vercel

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
