# Migrate from SnapDev's Render to Your Own Render Account

## 🎯 Situation

- **Current**: Your app is deployed on Render, but owned by SnapDev
- **Goal**: Replicate the exact setup in your own Render account
- **URL**: Currently at https://feelgive.onrender.com/

## ✅ Good News

You already have everything you need:
- ✅ Code in your GitHub repo: https://github.com/hurakan/feelgive.git
- ✅ [`Dockerfile`](backend/Dockerfile) ready
- ✅ MongoDB Atlas database (independent of deployment)
- ✅ All configuration files prepared

## 🚀 Quick Migration Steps (15-20 minutes)

### Step 1: Create Your Render Account (2 minutes)

1. Go to [render.com](https://render.com)
2. Sign up with your email or GitHub account
3. Connect your GitHub account
4. Authorize Render to access your repositories

### Step 2: Inspect Current SnapDev Deployment

Before replicating, let's understand what's deployed:

**Check the current site:**
```bash
# Visit the site
open https://feelgive.onrender.com/

# Check if backend API is on same URL or separate
curl https://feelgive.onrender.com/api/v1/health
curl https://feelgive.onrender.com/health
```

**Likely Setup (based on your code):**
- Option A: Single service serving both frontend and backend
- Option B: Separate services (frontend + backend)

### Step 3: Deploy to Your Render Account

#### Option A: Single Service (Frontend + Backend Combined)

**If SnapDev deployed everything as one service:**

1. **Create Web Service**
   - Render Dashboard → "New +" → "Web Service"
   - Select repository: `hurakan/feelgive`
   - Configure:
     ```
     Name: feelgive
     Branch: main
     Root Directory: (leave empty or specify if needed)
     Runtime: Docker
     Dockerfile Path: backend/Dockerfile
     ```

2. **Add Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://feelgive-admin:yWaxLLxg5Bfr06Fj@cluster0.l5wtoif.mongodb.net/feelgive?appName=Cluster0
   JWT_SECRET=feelgive-super-secret-jwt-key-change-in-production-min-32-chars
   FRONTEND_URL=https://your-service-name.onrender.com
   
   # Every.org
   EVERY_ORG_API_PUBLIC_KEY=pk_live_5f114aba289e827a13282e788ad886f0
   DONATION_URL=staging.every.org
   REDIRECT_URL=https://your-service-name.onrender.com/donation-success
   
   # Google Gemini
   GEMINI_API_KEY=AIzaSyAc6A0QOhIR5B0-eRCbcpYmCNuAA40Y6xM
   
   # Admin
   ADMIN_KEY=dev-admin-key-12345
   ADMIN_EMAILS=feel2give@gmail.com
   
   # News APIs
   NEWS_API_KEY=94cdacee01464753970ba107fd4864a7
   NEWSDATA_KEY=pub_453ad9f24d2f4b479294437fa5bfbc9e
   CURRENTS_KEY=W9-TGivjxWPC4SyNeiPLRIQXBcf_QpabV0Q_16tOqj2ia6_F
   GUARDIAN_KEY=780dc255-fb98-4941-956d-de59c3193255
   MEDIASTACK_KEY=931cf135c5de718e81cf0162a22875d7
   GNEWS_KEY=9ceab55316e2249553dea17ae19100c5
   ```

3. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for build
   - Note your new URL: `https://feelgive.onrender.com` (or similar)

#### Option B: Separate Services (Recommended)

**If you want frontend and backend separate:**

**1. Deploy Backend First**

```
Service Type: Web Service
Name: feelgive-backend
Repository: hurakan/feelgive
Branch: main
Root Directory: backend
Runtime: Docker
Dockerfile Path: Dockerfile (relative to root directory)
```

**Backend Environment Variables:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://feelgive-admin:yWaxLLxg5Bfr06Fj@cluster0.l5wtoif.mongodb.net/feelgive?appName=Cluster0
JWT_SECRET=feelgive-super-secret-jwt-key-change-in-production-min-32-chars
FRONTEND_URL=https://feelgive-frontend.onrender.com

EVERY_ORG_API_PUBLIC_KEY=pk_live_5f114aba289e827a13282e788ad886f0
DONATION_URL=staging.every.org
REDIRECT_URL=https://feelgive-frontend.onrender.com/donation-success

GEMINI_API_KEY=AIzaSyAc6A0QOhIR5B0-eRCbcpYmCNuAA40Y6xM
ADMIN_KEY=dev-admin-key-12345
ADMIN_EMAILS=feel2give@gmail.com

NEWS_API_KEY=94cdacee01464753970ba107fd4864a7
NEWSDATA_KEY=pub_453ad9f24d2f4b479294437fa5bfbc9e
CURRENTS_KEY=W9-TGivjxWPC4SyNeiPLRIQXBcf_QpabV0Q_16tOqj2ia6_F
GUARDIAN_KEY=780dc255-fb98-4941-956d-de59c3193255
MEDIASTACK_KEY=931cf135c5de718e81cf0162a22875d7
GNEWS_KEY=9ceab55316e2249553dea17ae19100c5
```

**2. Deploy Frontend Second**

```
Service Type: Static Site
Name: feelgive-frontend
Repository: hurakan/feelgive
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: frontend/dist
```

**Frontend Environment Variables:**
```env
VITE_API_BASE_URL=https://feelgive-backend.onrender.com/api/v1
VITE_ENABLE_BACKEND=true
VITE_ENABLE_EVERY_ORG_PAYMENTS=true
VITE_DONATION_BASE_URL=staging.every.org
VITE_REDIRECT_URL=https://feelgive-frontend.onrender.com/donation-success
```

**3. Update Backend CORS**

After frontend deploys, update backend's `FRONTEND_URL`:
```env
FRONTEND_URL=https://feelgive-frontend.onrender.com
```

### Step 4: Verify Your Deployment

```bash
# Test backend health
curl https://your-backend.onrender.com/health

# Test frontend
open https://your-frontend.onrender.com/

# Test API integration
curl https://your-backend.onrender.com/api/v1/organizations/search?query=red
```

### Step 5: Update MongoDB Atlas (if needed)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to "Network Access"
3. Ensure `0.0.0.0/0` is whitelisted (or add Render's IPs)

### Step 6: Test Everything

- [ ] Frontend loads correctly
- [ ] News feed displays articles
- [ ] Organization search works
- [ ] Donation flow completes
- [ ] RAG chat responds
- [ ] No CORS errors in browser console

## 🔑 Important Notes

### Security Considerations

**⚠️ Your `.env` files contain sensitive data!**

I noticed your local `.env` files have:
- MongoDB credentials
- API keys
- Admin keys

**Recommendations:**
1. **Change MongoDB password** after migration
2. **Generate new JWT_SECRET** for production
3. **Rotate API keys** if concerned about exposure
4. **Never commit `.env` files** to Git (already in `.gitignore`)

### Cost Comparison

**SnapDev's Render (current):**
- Unknown cost structure
- You don't control it

**Your Render Account:**
- **Free Tier**: $0/month (with cold starts)
- **Starter Tier**: $7/month (recommended, no cold starts)
- **You control everything**

## 📋 Pre-Migration Checklist

- [ ] Render account created
- [ ] GitHub repository accessible
- [ ] MongoDB Atlas credentials ready
- [ ] All API keys collected
- [ ] Decided on single vs separate services
- [ ] 15-20 minutes available

## 🎯 Recommended Approach

**I recommend Option B (Separate Services):**

**Why?**
- ✅ Frontend is free (static site)
- ✅ Only pay for backend ($7/month)
- ✅ Better separation of concerns
- ✅ Easier to scale independently
- ✅ Frontend always fast (no cold starts)
- ✅ Can update frontend without backend rebuild

**Cost:**
```
Backend (Starter): $7/month
Frontend (Static): $0/month
Total: $7/month
```

## 🚀 Quick Start Command

Use the [`render.yaml`](render.yaml) file I created:

```bash
# 1. Commit the render.yaml
git add render.yaml
git commit -m "Add Render infrastructure config"
git push origin main

# 2. In Render Dashboard
# - Click "New +" → "Blueprint"
# - Select your repository
# - Render creates both services automatically
# - Add sensitive environment variables manually
```

## 📚 Detailed Guides

For more details, see:
- [`RENDER_QUICK_START.md`](RENDER_QUICK_START.md) - Quick checklist
- [`RENDER_MIGRATION_GUIDE.md`](RENDER_MIGRATION_GUIDE.md) - Comprehensive guide
- [`DEPLOYMENT_COMPARISON.md`](DEPLOYMENT_COMPARISON.md) - Platform comparison

## 🐛 Troubleshooting

### Build Fails

**Check:**
- Dockerfile path is correct
- Root directory is set properly
- All dependencies in package.json

**Solution:**
```bash
# Test build locally first
cd backend
docker build -t test-build .
```

### Frontend Can't Connect to Backend

**Check:**
- `VITE_API_BASE_URL` matches backend URL exactly
- Backend `FRONTEND_URL` matches frontend URL
- No trailing slashes in URLs

### MongoDB Connection Fails

**Check:**
- Connection string is correct
- Network access allows 0.0.0.0/0
- Database user exists and has permissions

## ✅ Success Criteria

Your migration is complete when:

- [ ] Services deployed in YOUR Render account
- [ ] Frontend loads at your new URL
- [ ] Backend API responds to requests
- [ ] MongoDB connection works
- [ ] All features function correctly
- [ ] No errors in browser console
- [ ] You can access Render dashboard and logs

## 🎉 After Migration

Once deployed to your account:

1. **Update DNS** (if using custom domain)
2. **Set up monitoring** in Render dashboard
3. **Configure alerts** for downtime
4. **Consider upgrading** to Starter plan ($7/month)
5. **Document your new URLs**
6. **Inform SnapDev** you've migrated (if needed)

## 📞 Your New URLs

After deployment, update these:

```
Frontend: https://feelgive-frontend.onrender.com
Backend: https://feelgive-backend.onrender.com
Health: https://feelgive-backend.onrender.com/health
API Docs: https://feelgive-backend.onrender.com/api-docs
```

---

**Ready to start? Follow [`RENDER_QUICK_START.md`](RENDER_QUICK_START.md) with your own Render account!**

**Estimated Time: 15-20 minutes**  
**Difficulty: ⭐⭐ Easy**  
**Cost: $0-7/month**
