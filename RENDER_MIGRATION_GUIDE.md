# FeelGive Migration Guide: SnapDev to Render

This guide will walk you through migrating your FeelGive application from SnapDev deploy to Render.

## 📋 Overview

Your application consists of:
- **Backend**: Node.js/Express API with TypeScript (Port 3001)
- **Frontend**: React/Vite application (Port 5173)
- **Database**: MongoDB Atlas (already cloud-hosted)

## 🎯 Migration Strategy

We'll deploy:
1. **Backend** → Render Web Service (using Docker or Node.js)
2. **Frontend** → Render Static Site
3. **Database** → Keep MongoDB Atlas (no changes needed)

---

## Part 1: Backend Deployment to Render

### Step 1: Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

```bash
# If not already done
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up or log in
3. Connect your Git provider (GitHub/GitLab/Bitbucket)

### Step 3: Deploy Backend as Web Service

#### Option A: Using Docker (Recommended)

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select your repository from the list

2. **Configure Service**
   ```
   Name: feelgive-backend
   Region: Choose closest to your users (e.g., Oregon, Ohio, Frankfurt)
   Branch: main
   Root Directory: backend
   Runtime: Docker
   ```

3. **Build Settings**
   ```
   Docker Command: (leave empty, uses Dockerfile)
   ```

4. **Instance Type**
   - Start with "Free" tier for testing
   - Upgrade to "Starter" ($7/month) for production

#### Option B: Using Node.js Runtime

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository

2. **Configure Service**
   ```
   Name: feelgive-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Runtime: Node
   ```

3. **Build Settings**
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

### Step 4: Configure Backend Environment Variables

In the Render dashboard for your backend service, add these environment variables:

#### Required Variables

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/feelgive?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this
FRONTEND_URL=https://your-frontend-name.onrender.com
```

#### Every.org Integration

```env
EVERY_ORG_API_PUBLIC_KEY=your-every-org-api-key
DONATION_URL=staging.every.org
REDIRECT_URL=https://your-frontend-name.onrender.com/donation-success
```

#### Google Gemini (RAG Chat System)

```env
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL_NAME=gemini-1.5-flash
```

#### News APIs (Optional - for news aggregation)

```env
NEWSAPI_KEY=your-newsapi-key
NEWSDATA_KEY=your-newsdata-key
CURRENTS_KEY=your-currents-key
GUARDIAN_KEY=your-guardian-key
MEDIASTACK_KEY=your-mediastack-key
GNEWS_KEY=your-gnews-key
```

#### Web Search (Optional - enhances RAG)

```env
WEB_SEARCH_ENABLED=false
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
WEB_SEARCH_MAX_RESULTS=3
WEB_SEARCH_CACHE_ENABLED=true
```

#### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 5: Deploy Backend

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment to complete (5-10 minutes)
4. Note your backend URL: `https://feelgive-backend.onrender.com`

### Step 6: Verify Backend Deployment

Test your backend health endpoint:

```bash
curl https://feelgive-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T18:00:00.000Z",
  "uptime": 123,
  "environment": "production"
}
```

---

## Part 2: Frontend Deployment to Render

### Step 1: Create Static Site

1. In Render dashboard, click "New +" → "Static Site"
2. Connect your repository
3. Select your repository

### Step 2: Configure Static Site

```
Name: feelgive-frontend
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: frontend/dist
```

### Step 3: Configure Frontend Environment Variables

Add these environment variables in the Render dashboard:

```env
VITE_API_BASE_URL=https://feelgive-backend.onrender.com/api/v1
VITE_ENABLE_BACKEND=true
VITE_ENABLE_EVERY_ORG_PAYMENTS=true
VITE_DONATION_BASE_URL=staging.every.org
VITE_REDIRECT_URL=https://feelgive-frontend.onrender.com/donation-success
```

**Important Notes:**
- Replace `feelgive-backend` with your actual backend service name
- Replace `feelgive-frontend` with your actual frontend service name
- Use `staging.every.org` for testing, `www.every.org` for production donations

### Step 4: Deploy Frontend

1. Click "Create Static Site"
2. Render will build and deploy
3. Wait for deployment (3-5 minutes)
4. Your frontend URL: `https://feelgive-frontend.onrender.com`

---

## Part 3: Update Backend CORS Configuration

After deploying frontend, update your backend's `FRONTEND_URL` environment variable:

1. Go to backend service in Render dashboard
2. Navigate to "Environment" tab
3. Update `FRONTEND_URL` to your frontend URL:
   ```
   FRONTEND_URL=https://feelgive-frontend.onrender.com
   ```
4. Save changes (this will trigger a redeploy)

---

## Part 4: MongoDB Atlas Configuration

### Update Network Access

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to "Network Access"
3. Add Render's IP addresses or use `0.0.0.0/0` (allow from anywhere)
   - For production, you can get Render's static IPs with paid plans

### Verify Connection

Your MongoDB connection string should work without changes since it's already cloud-hosted.

---

## Part 5: Custom Domain Setup (Optional)

### Backend Custom Domain

1. In Render backend service, go to "Settings" → "Custom Domain"
2. Add your domain (e.g., `api.feelgive.com`)
3. Update DNS records as instructed by Render
4. Update `FRONTEND_URL` in backend to use custom domain

### Frontend Custom Domain

1. In Render static site, go to "Settings" → "Custom Domain"
2. Add your domain (e.g., `feelgive.com` or `www.feelgive.com`)
3. Update DNS records as instructed by Render
4. Update all environment variables that reference the frontend URL

---

## 🔧 Render-Specific Configuration Files

### Create render.yaml (Optional - Infrastructure as Code)

Create a `render.yaml` file in your project root for easier management:

```yaml
services:
  # Backend Web Service
  - type: web
    name: feelgive-backend
    runtime: docker
    rootDir: backend
    plan: free
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://feelgive-frontend.onrender.com
      - key: EVERY_ORG_API_PUBLIC_KEY
        sync: false
      - key: GOOGLE_GEMINI_API_KEY
        sync: false

  # Frontend Static Site
  - type: web
    name: feelgive-frontend
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://feelgive-backend.onrender.com/api/v1
      - key: VITE_ENABLE_BACKEND
        value: true
      - key: VITE_ENABLE_EVERY_ORG_PAYMENTS
        value: true
      - key: VITE_DONATION_BASE_URL
        value: staging.every.org
```

---

## 📊 Monitoring and Logs

### View Logs

1. **Backend Logs**: Go to backend service → "Logs" tab
2. **Frontend Logs**: Go to static site → "Logs" tab
3. Real-time log streaming available in dashboard

### Health Checks

Render automatically monitors your `/health` endpoint. Configure alerts:

1. Go to service settings
2. Navigate to "Health & Alerts"
3. Set up email/Slack notifications

### Metrics

View metrics in the Render dashboard:
- CPU usage
- Memory usage
- Request count
- Response times
- Bandwidth

---

## 🚀 Deployment Workflow

### Automatic Deployments

Render automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render automatically deploys both services
```

### Manual Deployments

1. Go to service in Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

### Rollback

1. Go to service → "Events" tab
2. Find previous successful deployment
3. Click "Rollback to this version"

---

## 💰 Pricing Comparison

### Free Tier
- **Backend**: Free (spins down after 15 min inactivity, cold starts ~30s)
- **Frontend**: Free (always on)
- **Total**: $0/month

### Starter Tier (Recommended for Production)
- **Backend**: $7/month (always on, no cold starts)
- **Frontend**: Free (always on)
- **Total**: $7/month

### Professional Tier
- **Backend**: $25/month (more resources, autoscaling)
- **Frontend**: Free
- **Total**: $25/month

---

## ⚠️ Important Considerations

### Free Tier Limitations

1. **Cold Starts**: Free tier spins down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading to Starter ($7/month) for production

2. **Build Minutes**: 500 build minutes/month on free tier
   - Each deployment counts toward this limit

3. **Bandwidth**: 100 GB/month on free tier

### Performance Optimization

1. **Enable Compression**: Already configured in your backend
2. **Use CDN**: Render provides CDN for static sites automatically
3. **Database Indexing**: Ensure MongoDB indexes are optimized
4. **Caching**: Consider adding Redis for caching (available on Render)

---

## 🔒 Security Checklist

- [ ] Update all environment variables with production values
- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Review CORS settings
- [ ] Enable rate limiting (already configured)
- [ ] Set up monitoring and alerts
- [ ] Regular security updates (`npm audit fix`)

---

## 🧪 Testing Your Deployment

### 1. Test Backend API

```bash
# Health check
curl https://feelgive-backend.onrender.com/health

# Test organizations endpoint
curl https://feelgive-backend.onrender.com/api/v1/organizations/search?query=red+cross

# Test donations endpoint
curl -X POST https://feelgive-backend.onrender.com/api/v1/donations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "organizationSlug": "american-red-cross",
    "amount": 10,
    "articleUrl": "https://example.com/article"
  }'
```

### 2. Test Frontend

1. Visit your frontend URL: `https://feelgive-frontend.onrender.com`
2. Test news feed loading
3. Test organization search
4. Test donation flow
5. Test RAG chat feature

### 3. Test Integration

1. Verify frontend can communicate with backend
2. Check browser console for errors
3. Test end-to-end donation flow
4. Verify MongoDB data is being saved

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check logs for errors:**
```bash
# In Render dashboard, go to Logs tab
```

**Common issues:**
- Missing environment variables
- MongoDB connection string incorrect
- Port configuration (should be 3001)
- Build errors (check TypeScript compilation)

### Frontend Build Fails

**Common issues:**
- Missing environment variables
- Node version mismatch
- Dependency installation errors
- Build command incorrect

**Solution:**
```bash
# Test build locally first
cd frontend
npm install
npm run build
```

### CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solution:**
1. Verify `FRONTEND_URL` in backend matches your frontend URL exactly
2. Check backend CORS configuration in `src/server.ts`
3. Ensure no trailing slashes in URLs

### MongoDB Connection Issues

**Symptoms:** Backend logs show MongoDB connection errors

**Solution:**
1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas network access (whitelist 0.0.0.0/0)
3. Verify database user credentials
4. Check MongoDB Atlas cluster is running

### Cold Start Issues (Free Tier)

**Symptoms:** First request takes 30+ seconds

**Solutions:**
1. Upgrade to Starter plan ($7/month) for always-on service
2. Use a service like UptimeRobot to ping your backend every 14 minutes
3. Implement a warming function in your frontend

---

## 📚 Additional Resources

### Render Documentation
- [Render Docs](https://render.com/docs)
- [Deploy Node.js](https://render.com/docs/deploy-node-express-app)
- [Deploy Static Sites](https://render.com/docs/deploy-create-react-app)
- [Environment Variables](https://render.com/docs/environment-variables)

### Your Project Documentation
- [`backend/README.md`](backend/README.md) - Backend API documentation
- [`backend/DEPLOYMENT.md`](backend/DEPLOYMENT.md) - General deployment guide
- [`BACKEND_INTEGRATION.md`](BACKEND_INTEGRATION.md) - Backend integration details
- [`README.md`](README.md) - Project overview

---

## 🎉 Post-Migration Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] All environment variables configured
- [ ] MongoDB Atlas connection working
- [ ] CORS configured correctly
- [ ] Health checks passing
- [ ] Test donation flow end-to-end
- [ ] Test RAG chat feature
- [ ] Set up monitoring and alerts
- [ ] Update documentation with new URLs
- [ ] Test on mobile devices
- [ ] Set up custom domains (optional)
- [ ] Configure automatic deployments
- [ ] Set up backup strategy

---

## 🆘 Need Help?

1. **Render Support**: [support@render.com](mailto:support@render.com)
2. **Render Community**: [community.render.com](https://community.render.com)
3. **MongoDB Atlas Support**: [MongoDB Support](https://www.mongodb.com/support)
4. **Check Logs**: Always check service logs in Render dashboard first

---

## 📞 Quick Reference

### Your Service URLs (Update after deployment)

```
Backend API: https://feelgive-backend.onrender.com
Frontend: https://feelgive-frontend.onrender.com
Health Check: https://feelgive-backend.onrender.com/health
API Docs: https://feelgive-backend.onrender.com/api-docs
```

### Important Commands

```bash
# View logs
# (Use Render dashboard)

# Trigger manual deploy
# (Use Render dashboard)

# Rollback deployment
# (Use Render dashboard → Events → Rollback)

# Update environment variables
# (Use Render dashboard → Environment)
```

---

**Built with ❤️ for seamless deployment on Render**
