# 🚀 Deployment Guide - AttendEase

Complete guide to deploy your attendance planner application to production.

## 📋 Prerequisites

- GitHub account (for code hosting)
- Vercel account (for frontend) - [Sign up here](https://vercel.com)
- Render/Railway account (for backend) - [Render](https://render.com) or [Railway](https://railway.app)

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) - **RECOMMENDED**
- ✅ Free tier available
- ✅ Auto-deployment from GitHub
- ✅ Built-in CI/CD
- ✅ Custom domain support

### Option 2: Netlify (Frontend) + Railway (Backend)
- ✅ Similar features to Option 1
- ✅ Slightly different UI/UX

---

## 🔷 Step 1: Prepare Your Code

### 1.1 Initialize Git Repository (if not already done)
```bash
cd "C:\Users\srika\OneDrive\Desktop\full"
git init
git add .
git commit -m "Initial commit - AttendEase"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `attendease`
3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/attendease.git
git branch -M main
git push -u origin main
```

---

## 🔷 Step 2: Deploy Backend (FastAPI)

### Option A: Deploy to Render.com

1. **Go to [Render Dashboard](https://dashboard.render.com)**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository** and select `attendease`

4. **Configure the service:**
   - **Name:** `attendease-api`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `attb`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Add Environment Variables:**
   - `PYTHON_VERSION`: `3.11.7`
   - `APP_NAME`: `AttendEase API`
   - `APP_VERSION`: `1.0.0`
   - `DEBUG`: `false`
   - `CORS_ORIGINS`: `https://your-frontend-url.vercel.app`

6. **Select Free Plan** (or paid if you prefer)

7. **Click "Create Web Service"**

8. **Wait for deployment** (5-10 minutes)

9. **Copy your backend URL:** `https://attendease-api.onrender.com`

### Option B: Deploy to Railway.app

1. **Go to [Railway](https://railway.app)**

2. **Click "New Project" → "Deploy from GitHub repo"**

3. **Select your repository**

4. **Configure:**
   - **Root Directory:** `attb`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Add Environment Variables** (same as Render)

6. **Deploy and copy your URL**

---

## 🔷 Step 3: Deploy Frontend (React + Vite)

### Deploy to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository**

4. **Configure the project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `att`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Add Environment Variables:**
   - Variable: `VITE_API_BASE_URL`
   - Value: `https://attendease-api.onrender.com/api` (your backend URL from Step 2)

6. **Click "Deploy"**

7. **Wait for deployment** (2-5 minutes)

8. **Your app is live!** Copy the URL: `https://attendease-xxx.vercel.app`

---

## 🔷 Step 4: Update CORS Settings

After deploying the frontend, update your backend CORS settings:

### On Render:
1. Go to your backend service
2. Environment → Add variable
3. **Key:** `CORS_ORIGINS`
4. **Value:** `https://your-actual-frontend-url.vercel.app`
5. Save and redeploy

### In code (attb/app/core/config.py):
Update the CORS_ORIGINS to include your frontend URL:
```python
CORS_ORIGINS: str = "http://localhost:5173,https://your-frontend-url.vercel.app"
```

---

## 🔷 Step 5: Test Your Deployed Application

1. Visit your frontend URL
2. Upload a timetable JSON
3. Verify the data loads correctly
4. Test all features: Review, Planner, Summary

---

## 🎨 Step 6: Custom Domain (Optional)

### For Frontend (Vercel):
1. Go to your project → Settings → Domains
2. Add your custom domain (e.g., `attendease.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### For Backend (Render):
1. Go to your service → Settings → Custom Domain
2. Add your API subdomain (e.g., `api.attendease.com`)
3. Configure DNS records
4. Wait for SSL

---

## 🔧 Continuous Deployment

Both Vercel and Render auto-deploy when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update: new feature"
git push origin main
```

Your app will automatically rebuild and deploy! 🎉

---

## 📊 Monitoring & Logs

### Vercel Logs:
- Dashboard → Your Project → Deployments → View Function Logs

### Render Logs:
- Dashboard → Your Service → Logs tab

---

## 🐛 Troubleshooting

### Issue: CORS errors
- **Fix:** Update `CORS_ORIGINS` in backend environment variables

### Issue: API connection failed
- **Fix:** Check `VITE_API_BASE_URL` in Vercel environment variables
- Ensure it ends with `/api`

### Issue: Build fails
- **Fix:** Check build logs in Vercel/Render
- Verify all dependencies are in `package.json` / `requirements.txt`

### Issue: 404 on refresh
- **Fix:** Already configured in `vercel.json` rewrites

---

## 💰 Cost Estimate

### Free Tier (Recommended for personal use):
- ✅ Vercel: Unlimited hobby projects
- ✅ Render: 750 hours/month (enough for 24/7)
- **Total: $0/month** 🎉

### Paid Tier (For production/business):
- Vercel Pro: $20/month
- Render: $7-25/month
- **Total: ~$27-45/month**

---

## 🎯 Next Steps After Deployment

1. ✅ Share your live URL with friends/classmates
2. ✅ Add Google OAuth (see Task 5)
3. ✅ Set up a custom domain
4. ✅ Monitor usage and performance
5. ✅ Collect feedback and iterate

---

## 📞 Support

If you encounter issues:
1. Check logs in Vercel/Render dashboards
2. Verify environment variables
3. Test locally first before deploying
4. Check this guide's troubleshooting section

---

**🎊 Congratulations! Your AttendEase app is now live and accessible to everyone!**
