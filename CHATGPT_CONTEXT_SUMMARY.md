# FeelGive Render Deployment Context for ChatGPT

## Project Overview

I'm migrating my FeelGive application from a SnapDev-owned Render deployment to my own personal Render account. The app is currently live at https://feelgive.onrender.com/ but I need to replicate this setup under my control.

## Application Architecture

**FeelGive** is a full-stack charitable giving platform that connects emotional responses to news with donations.

### Tech Stack:
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB Atlas (already owned by me, independent of deployment)
- **Deployment**: Docker-based (Dockerfile exists)

### Repository:
- **GitHub**: https://github.com/hurakan/feelgive.git
- **Branch**: main

## Current Deployment Status

### What's Working:
- ✅ App is live at https://feelgive.onrender.com/ (SnapDev's Render account)
- ✅ MongoDB Atlas database is accessible and working
- ✅ All API keys and credentials are available
- ✅ Code is in my GitHub repository

### What I'm Doing:
- 🎯 Replicating the exact setup in MY OWN Render account
- 🎯 Deploying as TWO separate services (backend + frontend)
- 🎯 Maintaining all functionality

## Deployment Architecture

### Service 1: Backend (Web Service)
```
Type: Web Service
Name: feelgive-backend
Repository: hurakan/feelgive
Branch: main
Root Directory: backend
Runtime: Docker
Dockerfile Path: Dockerfile
Port: 3001
```

**Backend Structure:**
- Express API with TypeScript
- MongoDB Atlas connection
- RESTful API endpoints
- RAG-powered chat system (Google Gemini)
- News aggregation from multiple APIs
- Every.org integration for donations

### Service 2: Frontend (Static Site)
```
Type: Static Site
Name: feelgive-frontend
Repository: hurakan/feelgive
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: frontend/dist
```

**Frontend Structure:**
- React + Vite application
- Connects to backend API
- Environment variables for API URL

## Environment Variables

### Backend Environment Variables (43 total):
```env
# Core
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://feelgive-admin:yWaxLLxg5Bfr06Fj@cluster0.l5wtoif.mongodb.net/feelgive?appName=Cluster0

# Security
JWT_SECRET=feelgive-super-secret-jwt-key-change-in-production-min-32-chars

# CORS (update after frontend deploys)
FRONTEND_URL=https://feelgive-frontend.onrender.com

# Every.org API
EVERY_ORG_API_PUBLIC_KEY=pk_live_5f114aba289e827a13282e788ad886f0
DONATION_URL=staging.every.org
REDIRECT_URL=https://feelgive-frontend.onrender.com/donation-success

# Google Gemini (RAG Chat)
GEMINI_API_KEY=AIzaSyAc6A0QOhIR5B0-eRCbcpYmCNuAA40Y6xM

# Admin
ADMIN_KEY=dev-admin-key-12345
ADMIN_EMAILS=feel2give@gmail.com

# News APIs (6 different sources)
NEWS_API_KEY=94cdacee01464753970ba107fd4864a7
NEWSDATA_KEY=pub_453ad9f24d2f4b479294437fa5bfbc9e
CURRENTS_KEY=W9-TGivjxWPC4SyNeiPLRIQXBcf_QpabV0Q_16tOqj2ia6_F
GUARDIAN_KEY=780dc255-fb98-4941-956d-de59c3193255
MEDIASTACK_KEY=931cf135c5de718e81cf0162a22875d7
GNEWS_KEY=9ceab55316e2249553dea17ae19100c5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables (6 total):
```env
# Backend API (update with actual backend URL)
VITE_API_BASE_URL=https://feelgive-backend.onrender.com/api/v1

# Features
VITE_ENABLE_BACKEND=true
VITE_ENABLE_EVERY_ORG_PAYMENTS=true

# Every.org
VITE_DONATION_BASE_URL=staging.every.org
VITE_REDIRECT_URL=https://feelgive-frontend.onrender.com/donation-success

# Legacy (optional)
VITE_NEWS_API_KEY=94cdacee01464753970ba107fd4864a7
```

## Issues Encountered

### Issue 1: Dockerfile Path Error
**Error**: "failed to read dockerfile: open Dockerfile: no such file or directory"

**Solution**: 
- Set Root Directory to `backend`
- Set Dockerfile Path to `Dockerfile` (not `backend/Dockerfile`)

### Issue 2: npm ci Flag Error
**Error**: `npm ci --only=production` failed with exit code 1

**Root Cause**: The `--only=production` flag is deprecated and incompatible with `"type": "module"` in package.json

**Solution**: Updated Dockerfile line 28 from:
```dockerfile
RUN npm ci --only=production
```
To:
```dockerfile
RUN npm ci --omit=dev
```

**Status**: Fixed in local code, needs to be pushed to GitHub

## Deployment Sequence

1. **Deploy Backend First**
   - Create Web Service in Render
   - Configure Docker settings
   - Add all environment variables
   - Note the backend URL

2. **Deploy Frontend Second**
   - Create Static Site in Render
   - Configure build settings
   - Add environment variables with backend URL
   - Note the frontend URL

3. **Update Backend CORS**
   - Update `FRONTEND_URL` in backend with actual frontend URL
   - Update `REDIRECT_URL` with actual frontend URL
   - Backend will auto-redeploy

4. **Verify Everything Works**
   - Test backend health endpoint
   - Test frontend loads
   - Test API integration
   - Check for CORS errors

## Key Files in Repository

- `backend/Dockerfile` - Docker configuration for backend
- `backend/package.json` - Backend dependencies (type: module)
- `frontend/package.json` - Frontend dependencies
- `backend/src/server.ts` - Main Express server
- `RENDER_BACKEND_ENV.txt` - All backend env vars ready to copy
- `RENDER_FRONTEND_ENV.txt` - All frontend env vars ready to copy
- `RENDER_DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide

## MongoDB Atlas Configuration

- **Cluster**: cluster0.l5wtoif.mongodb.net
- **Database**: feelgive
- **User**: feelgive-admin
- **Network Access**: Must allow 0.0.0.0/0 (or Render's IPs)
- **Status**: Already configured and working

## Expected Costs

### Free Tier (Testing):
- Backend: $0/month (with cold starts after 15 min inactivity)
- Frontend: $0/month
- Total: $0/month

### Production (Recommended):
- Backend Starter: $7/month (always-on, no cold starts)
- Frontend: $0/month (static sites are free)
- Total: $7/month

## Success Criteria

The deployment is successful when:
- ✅ Backend health endpoint returns 200 OK
- ✅ Frontend loads without errors
- ✅ API calls work (check browser Network tab)
- ✅ No CORS errors in browser console
- ✅ MongoDB connection working
- ✅ News feed displays articles
- ✅ Organization search works
- ✅ Donation flow completes
- ✅ RAG chat responds

## Current Blockers

1. **Dockerfile fix needs to be pushed to GitHub**
   - File: `backend/Dockerfile` line 28
   - Change: `--only=production` → `--omit=dev`
   - Status: Fixed locally, needs git push

2. **Waiting for backend deployment to succeed**
   - Once Dockerfile is pushed and deployed
   - Will get backend URL to use in frontend config

## Questions for ChatGPT

I need help with:
1. Confirming the Render service configuration is correct
2. Troubleshooting any deployment errors
3. Verifying environment variables are set properly
4. Testing the deployed services
5. Optimizing the deployment for production

## Additional Context

- This is a production application with real users
- MongoDB Atlas is already set up and working
- All API keys are valid and working
- The app works perfectly on SnapDev's Render deployment
- I just need to replicate it to my own Render account
- Budget: Willing to pay $7/month for Starter tier (no cold starts)

## Reference Documentation

I have these guides available:
- `RENDER_DEPLOYMENT_CHECKLIST.md` - Complete deployment checklist
- `RENDER_MIGRATION_GUIDE.md` - Comprehensive migration guide
- `SNAPDEV_TO_YOUR_RENDER.md` - Specific guide for this migration
- `RENDER_BACKEND_ENV.txt` - All backend environment variables
- `RENDER_FRONTEND_ENV.txt` - All frontend environment variables
- `DEPLOYMENT_COMPARISON.md` - Why Render is best for this app

---

**Current Status**: Backend deployment failing due to npm ci error. Fix is ready, needs to be pushed to GitHub and redeployed.

**Next Step**: Push Dockerfile fix to GitHub, then retry backend deployment in Render.
