# MongoDB Setup - Alternative Methods & Troubleshooting

If you're having issues with MongoDB Atlas website, here are alternative approaches.

## Option 1: Troubleshoot MongoDB Atlas Website

### Common Website Issues & Fixes

**Issue: Left panel not loading / "Build a Database" button missing**

**Try these solutions:**

1. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cache and cookies
   - Restart browser

2. **Try Different Browser**
   - Chrome (recommended)
   - Firefox
   - Safari
   - Edge

3. **Disable Browser Extensions**
   - Ad blockers can interfere
   - Privacy extensions might block scripts
   - Try incognito/private mode

4. **Check Internet Connection**
   - Ensure stable connection
   - Try different network if possible

5. **Wait and Retry**
   - MongoDB Atlas might be experiencing issues
   - Check status: https://status.mongodb.com/
   - Try again in 10-15 minutes

6. **Direct URL to Create Cluster**
   - After logging in, go directly to:
   - https://cloud.mongodb.com/v2#/clusters/new

### Alternative MongoDB Atlas Setup Steps

If the website loads but looks different:

1. **After Login, Look For:**
   - "Create" button (top right)
   - "New Project" button
   - "Clusters" in left menu
   - "Database Deployments" section

2. **Navigate to Database Creation:**
   - Click "Projects" (top left)
   - Click your project name or "New Project"
   - Look for "Create Database" or "Deploy a Database"
   - Or click "Database" in left sidebar → "Create"

3. **Alternative Navigation:**
   - URL: https://cloud.mongodb.com/
   - Click "Database" in left menu
   - Click "+ Create" button
   - Choose "Build a Database"

## Option 2: Use Local MongoDB (Fastest for Development)

If MongoDB Atlas isn't working, use local MongoDB for now:

### Install MongoDB Locally

**macOS (using Homebrew):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB
brew services start mongodb-community@7.0
```

**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Complete" installation
4. Install as Windows Service

**Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Configure Backend for Local MongoDB

Your `backend/.env` is already configured for local MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017/feelgive
```

This is the default setting, so if you haven't changed it, you're good to go!

### Test Local MongoDB

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Atlas connected successfully
🚀 Server running on port 3001
```

## Option 3: Use MongoDB Docker Container

If you have Docker installed:

```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb-feelgive \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=feelgive \
  mongo:7.0

# Verify it's running
docker ps
```

Then use this in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/feelgive
```

## Option 4: Try MongoDB Atlas CLI

If the website isn't working, use the CLI:

```bash
# Install Atlas CLI
npm install -g mongodb-atlas-cli

# Login
atlas auth login

# Create cluster
atlas clusters create Cluster0 --provider AWS --region US_EAST_1 --tier M0
```

## Comparison: Local vs Atlas

### Local MongoDB
**Pros:**
- ✅ Works immediately
- ✅ No internet required
- ✅ Free forever
- ✅ Fast for development

**Cons:**
- ❌ Not accessible from deployed apps
- ❌ No automatic backups
- ❌ Need to manage yourself

### MongoDB Atlas
**Pros:**
- ✅ Cloud-hosted (accessible anywhere)
- ✅ Automatic backups
- ✅ Free tier available
- ✅ Production-ready

**Cons:**
- ❌ Requires internet
- ❌ Setup can be complex
- ❌ Website issues (sometimes)

## Recommended Approach

**For Development (Right Now):**
1. Use **Local MongoDB** to get started immediately
2. Everything will work the same way
3. You can switch to Atlas later

**For Production (Later):**
1. Set up MongoDB Atlas when website is working
2. Update `MONGODB_URI` in production environment
3. No code changes needed!

## Quick Start with Local MongoDB

```bash
# 1. Install MongoDB locally (see instructions above)

# 2. Verify backend/.env has local connection
cd backend
cat .env | grep MONGODB_URI
# Should show: MONGODB_URI=mongodb://localhost:27017/feelgive

# 3. Start backend
npm run dev

# 4. Test API
./test-api.sh

# 5. Start frontend (in another terminal)
cd ../frontend
npm run dev
```

## Switching from Local to Atlas Later

When MongoDB Atlas is working:

1. Get your Atlas connection string
2. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/feelgive
   ```
3. Restart backend: `npm run dev`
4. Done! No code changes needed.

## Verify MongoDB is Working

### Check Local MongoDB:
```bash
# macOS/Linux
mongosh

# Windows
mongo

# You should see MongoDB shell
# Type: show dbs
# Type: exit
```

### Check Backend Connection:
```bash
cd backend
npm run dev
```

Look for: `✅ MongoDB Atlas connected successfully`

### Test API:
```bash
cd backend
./test-api.sh
```

All tests should pass with ✅

## Troubleshooting Local MongoDB

### Port Already in Use
```bash
# Check what's using port 27017
lsof -i :27017  # macOS/Linux
netstat -ano | findstr :27017  # Windows

# Stop MongoDB
brew services stop mongodb-community  # macOS
sudo systemctl stop mongod  # Linux
net stop MongoDB  # Windows
```

### MongoDB Not Starting
```bash
# Check MongoDB status
brew services list  # macOS
sudo systemctl status mongod  # Linux
sc query MongoDB  # Windows

# Check logs
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
sudo tail -f /var/log/mongodb/mongod.log  # Linux
```

### Connection Refused
- Ensure MongoDB is running
- Check firewall settings
- Verify port 27017 is open

## MongoDB Atlas Status Check

Before trying Atlas again:
1. Visit: https://status.mongodb.com/
2. Check for any ongoing incidents
3. If all green, try again with different browser

## Support Resources

- **MongoDB Community Forums**: https://www.mongodb.com/community/forums/
- **MongoDB Documentation**: https://docs.mongodb.com/
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/mongodb

## Summary

**Right Now:**
- Use local MongoDB to get started immediately
- Backend is already configured for it
- Everything will work the same

**Later:**
- Set up MongoDB Atlas when website is working
- Simple connection string change
- No code modifications needed

The backend code works with both local and Atlas MongoDB - just change the connection string!