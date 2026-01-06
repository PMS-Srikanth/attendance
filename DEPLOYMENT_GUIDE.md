# 🚀 Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (frontend)
- Render account (backend)

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/attendease.git
git push -u origin main
```

## Step 2: Deploy Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. New → Web Service → Connect GitHub repo
3. Configure:
   - Root Directory: `attb`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `PYTHON_VERSION`: `3.11.7`
   - `CORS_ORIGINS`: `https://your-app.vercel.app` (update after frontend deploy)
5. Deploy and copy URL

## Step 3: Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Add New → Project → Import GitHub repo
3. Configure:
   - Framework: Vite
   - Root Directory: `att`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`
5. Deploy

## Step 4: Update CORS

Update backend `CORS_ORIGINS` on Render with your Vercel URL.

## Step 5: Configure Firebase

Add your Vercel domain to Firebase authorized domains (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md)).
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
