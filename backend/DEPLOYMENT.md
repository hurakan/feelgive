# FeelGive Backend Deployment Guide

This guide covers deploying the FeelGive backend to various platforms with MongoDB Atlas.

## Prerequisites

1. MongoDB Atlas account with a cluster set up
2. Database user created with read/write permissions
3. Network access configured (whitelist IPs or allow from anywhere for development)
4. Connection string ready

## MongoDB Atlas Setup

### 1. Create a Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project or use existing
3. Click "Build a Database"
4. Choose your tier (M0 Free tier is sufficient for development)
5. Select your cloud provider and region
6. Click "Create Cluster"

### 2. Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these securely)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### 3. Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your server's IP address
5. Click "Confirm"

### 4. Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `feelgive` (or your preferred database name)

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/feelgive?retryWrites=true&w=majority
```

## Deployment Options

### Option 1: Vercel (Recommended for Serverless)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL`

5. Redeploy after setting environment variables

**Note:** Vercel has a 10-second timeout for serverless functions. For long-running operations, consider other options.

### Option 2: Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Add environment variables:
```bash
railway variables set MONGODB_URI="your-connection-string"
railway variables set JWT_SECRET="your-secret"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="your-frontend-url"
```

5. Deploy:
```bash
railway up
```

### Option 3: Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add environment variables in Render dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL`
   - `PORT=3001`
5. Deploy

### Option 4: Docker + Any Cloud Provider

1. Build Docker image:
```bash
docker build -t feelgive-backend .
```

2. Test locally:
```bash
docker run -p 3001:3001 \
  -e MONGODB_URI="your-connection-string" \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  feelgive-backend
```

3. Push to container registry (Docker Hub, AWS ECR, etc.)
4. Deploy to your cloud provider (AWS ECS, Google Cloud Run, Azure Container Instances, etc.)

### Option 5: Traditional VPS (DigitalOcean, Linode, etc.)

1. SSH into your server
2. Install Node.js 18+:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Clone your repository:
```bash
git clone your-repo-url
cd backend
```

4. Install dependencies:
```bash
npm install
```

5. Create `.env` file with production values

6. Build:
```bash
npm run build
```

7. Install PM2 for process management:
```bash
sudo npm install -g pm2
```

8. Start with PM2:
```bash
pm2 start dist/server.js --name feelgive-backend
pm2 save
pm2 startup
```

9. Configure Nginx as reverse proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

10. Set up SSL with Let's Encrypt:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables

Required for all deployments:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/feelgive
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=https://your-frontend-domain.com
```

Optional:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Post-Deployment Checklist

- [ ] Verify MongoDB Atlas connection is working
- [ ] Test all API endpoints with production URL
- [ ] Verify CORS is configured correctly for your frontend
- [ ] Check rate limiting is working
- [ ] Monitor error logs
- [ ] Set up health check monitoring
- [ ] Configure backup strategy for MongoDB
- [ ] Set up alerts for downtime
- [ ] Document your production API URL
- [ ] Update frontend to use production backend URL

## Monitoring

### Health Check Endpoint

Monitor: `https://your-api-domain.com/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "production"
}
```

### MongoDB Atlas Monitoring

1. Go to your cluster in MongoDB Atlas
2. Click "Metrics" tab
3. Monitor:
   - Connection count
   - Operations per second
   - Network traffic
   - Storage usage

### Application Monitoring

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **DataDog** or **New Relic** for APM
- **Uptime Robot** for uptime monitoring

## Scaling Considerations

### Database
- Start with M0 (Free tier) for development
- Upgrade to M10+ for production with auto-scaling
- Enable backups in MongoDB Atlas
- Consider read replicas for high traffic

### Application
- Use horizontal scaling (multiple instances)
- Implement caching with Redis if needed
- Use CDN for static assets
- Consider serverless for variable traffic

## Troubleshooting

### Connection Issues
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Ensure database user has correct permissions
- Verify network connectivity

### Performance Issues
- Check MongoDB Atlas metrics
- Review slow query logs
- Optimize database indexes
- Implement caching strategy

### CORS Errors
- Verify `FRONTEND_URL` environment variable
- Check CORS configuration in server.ts
- Ensure credentials are properly set

## Security Best Practices

1. **Never commit `.env` files**
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable MongoDB Atlas encryption at rest**
4. **Use HTTPS only** in production
5. **Implement rate limiting** (already configured)
6. **Regular security updates** (`npm audit fix`)
7. **Monitor for suspicious activity**
8. **Use environment-specific credentials**

## Backup Strategy

### MongoDB Atlas Backups
1. Go to your cluster settings
2. Enable "Continuous Backup" (M10+ clusters)
3. Configure backup schedule
4. Test restore process regularly

### Application Backups
- Keep your code in version control (Git)
- Document environment variables securely
- Maintain deployment scripts
- Keep infrastructure as code (if applicable)

## Support

For deployment issues:
1. Check logs in your deployment platform
2. Verify MongoDB Atlas connection
3. Test endpoints with Postman/curl
4. Review this documentation
5. Check backend README.md for API details