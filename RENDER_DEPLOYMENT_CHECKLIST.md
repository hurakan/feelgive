# Render Deployment Checklist

Use this checklist to deploy your FeelGive application to Render.

## 📋 Pre-Deployment

- [ ] Render account created at [render.com](https://render.com)
- [ ] GitHub repository connected to Render
- [ ] MongoDB Atlas accessible (network access configured)
- [ ] Environment variable files ready:
  - [ ] [`RENDER_BACKEND_ENV.txt`](RENDER_BACKEND_ENV.txt)
  - [ ] [`RENDER_FRONTEND_ENV.txt`](RENDER_FRONTEND_ENV.txt)

---

## 🔧 Step 1: Deploy Backend (10 minutes)

### 1.1 Create Backend Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Select your repository: `hurakan/feelgive`
4. Click **"Connect"**

### 1.2 Configure Backend Service

Fill in these settings:

```
Name: feelgive-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: backend
Runtime: Docker
Dockerfile Path: Dockerfile
Instance Type: Free (or Starter $7/month for production)
```

### 1.3 Add Backend Environment Variables

1. Scroll to **"Environment Variables"** section
2. Click **"Add Environment Variable"**
3. Open [`RENDER_BACKEND_ENV.txt`](RENDER_BACKEND_ENV.txt)
4. Copy each line and add as separate variables:

**Quick Add Format:**
```
Key: NODE_ENV
Value: production

Key: PORT
Value: 3001

Key: MONGODB_URI
Value: mongodb+srv://feelgive-admin:yWaxLLxg5Bfr06Fj@cluster0.l5wtoif.mongodb.net/feelgive?appName=Cluster0

... (continue for all variables)
```

**Important Variables to Update Later:**
- `FRONTEND_URL` - Update after frontend deploys
- `REDIRECT_URL` - Update after frontend deploys

### 1.4 Deploy Backend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build to complete
3. Note your backend URL: `https://feelgive-backend.onrender.com`
4. Test health endpoint:
   ```bash
   curl https://feelgive-backend.onrender.com/health
   ```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T18:00:00.000Z",
  "uptime": 123,
  "environment": "production"
}
```

---

## 🎨 Step 2: Deploy Frontend (5 minutes)

### 2.1 Create Frontend Service

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Select your repository: `hurakan/feelgive`
3. Click **"Connect"**

### 2.2 Configure Frontend Service

Fill in these settings:

```
Name: feelgive-frontend
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: frontend/dist
```

### 2.3 Add Frontend Environment Variables

1. Scroll to **"Environment Variables"** section
2. Open [`RENDER_FRONTEND_ENV.txt`](RENDER_FRONTEND_ENV.txt)
3. **IMPORTANT**: Update `VITE_API_BASE_URL` with your actual backend URL
4. Add each variable:

```
Key: VITE_API_BASE_URL
Value: https://feelgive-backend.onrender.com/api/v1

Key: VITE_ENABLE_BACKEND
Value: true

Key: VITE_ENABLE_EVERY_ORG_PAYMENTS
Value: true

Key: VITE_DONATION_BASE_URL
Value: staging.every.org

Key: VITE_REDIRECT_URL
Value: https://feelgive-frontend.onrender.com/donation-success
```

### 2.4 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait 3-5 minutes for build to complete
3. Note your frontend URL: `https://feelgive-frontend.onrender.com`
4. Open in browser to test

---

## 🔄 Step 3: Update Backend CORS (2 minutes)

Now that frontend is deployed, update backend's CORS configuration:

1. Go to backend service in Render dashboard
2. Click **"Environment"** tab
3. Find `FRONTEND_URL` variable
4. Update value to: `https://feelgive-frontend.onrender.com`
5. Find `REDIRECT_URL` variable
6. Update value to: `https://feelgive-frontend.onrender.com/donation-success`
7. Click **"Save Changes"**
8. Backend will automatically redeploy (2-3 minutes)

---

## ✅ Step 4: Verify Deployment (5 minutes)

### 4.1 Test Backend

```bash
# Health check
curl https://feelgive-backend.onrender.com/health

# API endpoint
curl https://feelgive-backend.onrender.com/api/v1/organizations/search?query=red
```

### 4.2 Test Frontend

1. Open: `https://feelgive-frontend.onrender.com`
2. Check browser console for errors (F12)
3. Test these features:
   - [ ] News feed loads
   - [ ] Organization search works
   - [ ] Donation flow opens
   - [ ] RAG chat responds
   - [ ] No CORS errors

### 4.3 Test Integration

1. Open frontend in browser
2. Open browser DevTools (F12) → Network tab
3. Interact with the app
4. Verify API calls go to your backend URL
5. Check for 200 status codes

---

## 🎯 Step 5: MongoDB Atlas Configuration

Ensure MongoDB Atlas allows connections from Render:

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Navigate to **"Network Access"**
3. Verify `0.0.0.0/0` is in the IP whitelist
4. If not, click **"Add IP Address"** → **"Allow Access from Anywhere"**

---

## 💰 Cost Summary

### Free Tier (Testing)
```
Backend (Free): $0/month (cold starts after 15 min)
Frontend (Static): $0/month
MongoDB Atlas (M0): $0/month
Total: $0/month
```

### Production (Recommended)
```
Backend (Starter): $7/month (always-on, no cold starts)
Frontend (Static): $0/month
MongoDB Atlas (M0): $0/month
Total: $7/month
```

---

## 🚀 Step 6: Upgrade to Production (Optional)

If you want to eliminate cold starts:

1. Go to backend service in Render dashboard
2. Click **"Settings"** tab
3. Scroll to **"Instance Type"**
4. Change from **"Free"** to **"Starter"** ($7/month)
5. Click **"Save Changes"**

**Benefits:**
- ✅ No cold starts (instant response)
- ✅ Always-on service
- ✅ Better performance
- ✅ Production-ready

---

## 📝 Your Deployment URLs

After deployment, document your URLs:

```
Frontend: https://feelgive-frontend.onrender.com
Backend: https://feelgive-backend.onrender.com
Health Check: https://feelgive-backend.onrender.com/health
API Docs: https://feelgive-backend.onrender.com/api-docs
```

---

## 🐛 Troubleshooting

### Backend Build Fails

**Error**: "failed to read dockerfile"
**Solution**: 
- Set Root Directory to `backend`
- Set Dockerfile Path to `Dockerfile`

**Error**: "npm install failed"
**Solution**: Check package.json is valid

### Frontend Build Fails

**Error**: "Command failed"
**Solution**: 
- Verify Build Command: `npm install && npm run build`
- Verify Publish Directory: `frontend/dist`

### CORS Errors

**Error**: "blocked by CORS policy"
**Solution**:
- Verify `FRONTEND_URL` in backend matches frontend URL exactly
- No trailing slashes
- Wait for backend to redeploy after changing env vars

### MongoDB Connection Fails

**Error**: "MongoServerError: bad auth"
**Solution**:
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access allows 0.0.0.0/0
- Verify database user exists

### Cold Starts (Free Tier)

**Issue**: First request takes 30+ seconds
**Solution**:
- Upgrade to Starter plan ($7/month)
- Or use UptimeRobot to ping every 14 minutes

---

## ✅ Success Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] API calls work (check Network tab)
- [ ] No CORS errors in console
- [ ] MongoDB connection working
- [ ] News feed displays articles
- [ ] Organization search works
- [ ] Donation flow completes
- [ ] RAG chat responds

---

## 🎉 Post-Deployment

### Recommended Next Steps

1. **Set up monitoring**
   - Render Dashboard → Service → "Health & Alerts"
   - Configure email/Slack notifications

2. **Configure custom domain** (optional)
   - Render Dashboard → Service → "Settings" → "Custom Domain"
   - Add your domain and update DNS

3. **Enable auto-deploy**
   - Render Dashboard → Service → "Settings" → "Build & Deploy"
   - Enable "Auto-Deploy" for main branch

4. **Set up staging environment** (optional)
   - Create duplicate services
   - Point to different branch (e.g., `staging`)

5. **Document your deployment**
   - Save your URLs
   - Document any custom configurations
   - Share with team

---

## 📞 Need Help?

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Support**: support@render.com
- **Community**: [community.render.com](https://community.render.com)
- **Your Guides**: 
  - [`RENDER_MIGRATION_GUIDE.md`](RENDER_MIGRATION_GUIDE.md)
  - [`SNAPDEV_TO_YOUR_RENDER.md`](SNAPDEV_TO_YOUR_RENDER.md)

---

**Total Time: 15-20 minutes**  
**Difficulty: ⭐⭐ Easy**  
**Cost: $0-7/month**

Good luck with your deployment! 🚀
