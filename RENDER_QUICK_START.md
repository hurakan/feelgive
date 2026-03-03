# Render Deployment Quick Start

This is a condensed checklist for deploying FeelGive to Render. For detailed instructions, see [`RENDER_MIGRATION_GUIDE.md`](RENDER_MIGRATION_GUIDE.md).

## Prerequisites Checklist

- [ ] Code pushed to Git repository (GitHub/GitLab/Bitbucket)
- [ ] MongoDB Atlas cluster running and accessible
- [ ] MongoDB connection string ready
- [ ] Render account created at [render.com](https://render.com)
- [ ] Git repository connected to Render

## Step 1: Deploy Backend (5-10 minutes)

1. **Create Web Service**
   - Render Dashboard → "New +" → "Web Service"
   - Select your repository
   - Configure:
     ```
     Name: feelgive-backend
     Root Directory: backend
     Runtime: Docker (or Node)
     Branch: main
     Plan: Free (or Starter for production)
     ```

2. **Add Environment Variables**
   
   Required:
   ```env
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/feelgive
   JWT_SECRET=your-32-char-secret-key-here
   FRONTEND_URL=https://feelgive-frontend.onrender.com
   ```
   
   Every.org (if using):
   ```env
   EVERY_ORG_API_PUBLIC_KEY=your-key
   DONATION_URL=staging.every.org
   REDIRECT_URL=https://feelgive-frontend.onrender.com/donation-success
   ```
   
   Google Gemini (for RAG chat):
   ```env
   GOOGLE_GEMINI_API_KEY=your-key
   GEMINI_MODEL_NAME=gemini-1.5-flash
   ```

3. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Note your backend URL: `https://feelgive-backend.onrender.com`

4. **Verify**
   ```bash
   curl https://feelgive-backend.onrender.com/health
   ```

## Step 2: Deploy Frontend (3-5 minutes)

1. **Create Static Site**
   - Render Dashboard → "New +" → "Static Site"
   - Select your repository
   - Configure:
     ```
     Name: feelgive-frontend
     Root Directory: frontend
     Build Command: npm install && npm run build
     Publish Directory: frontend/dist
     Branch: main
     ```

2. **Add Environment Variables**
   ```env
   VITE_API_BASE_URL=https://feelgive-backend.onrender.com/api/v1
   VITE_ENABLE_BACKEND=true
   VITE_ENABLE_EVERY_ORG_PAYMENTS=true
   VITE_DONATION_BASE_URL=staging.every.org
   VITE_REDIRECT_URL=https://feelgive-frontend.onrender.com/donation-success
   ```

3. **Deploy**
   - Click "Create Static Site"
   - Wait for build to complete
   - Note your frontend URL: `https://feelgive-frontend.onrender.com`

## Step 3: Update Backend CORS

1. Go to backend service in Render
2. Update `FRONTEND_URL` environment variable with actual frontend URL
3. Save (triggers automatic redeploy)

## Step 4: Configure MongoDB Atlas

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to "Network Access"
3. Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or add Render's specific IPs if on paid plan

## Step 5: Test Everything

- [ ] Backend health check: `https://feelgive-backend.onrender.com/health`
- [ ] Frontend loads: `https://feelgive-frontend.onrender.com`
- [ ] News feed displays articles
- [ ] Organization search works
- [ ] Donation flow completes
- [ ] RAG chat responds (if configured)

## Common Issues

### Backend won't start
- Check logs in Render dashboard
- Verify all required environment variables are set
- Verify MongoDB connection string is correct

### Frontend shows API errors
- Verify `VITE_API_BASE_URL` matches backend URL exactly
- Check backend CORS configuration
- Verify backend is running (check health endpoint)

### Cold starts (Free tier)
- First request after 15 min takes ~30 seconds
- Upgrade to Starter plan ($7/month) for always-on service

## URLs to Update

After deployment, update these in your documentation:

```
Backend API: https://feelgive-backend.onrender.com
Frontend: https://feelgive-frontend.onrender.com
Health Check: https://feelgive-backend.onrender.com/health
API Docs: https://feelgive-backend.onrender.com/api-docs
```

## Production Recommendations

- [ ] Upgrade backend to Starter plan ($7/month) - eliminates cold starts
- [ ] Set up custom domains
- [ ] Configure monitoring and alerts
- [ ] Enable automatic deployments on push
- [ ] Set up staging environment
- [ ] Configure backup strategy
- [ ] Review security settings

## Need Help?

See detailed guide: [`RENDER_MIGRATION_GUIDE.md`](RENDER_MIGRATION_GUIDE.md)

---

**Total Time: ~15-20 minutes**  
**Cost: Free tier available, $7/month recommended for production**
