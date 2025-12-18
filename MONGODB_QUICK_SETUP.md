# MongoDB Atlas Quick Setup Guide (5 Minutes)

Follow these exact steps to configure MongoDB Atlas for FeelGive.

## Step 1: Create Account (1 minute)

1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with:
   - Email + Password, OR
   - Google account (faster)
3. Click the verification link in your email

## Step 2: Create Free Cluster (2 minutes)

1. After login, click the big green **"Build a Database"** button
2. Choose **"M0 FREE"** (the free tier)
   - Look for the box that says "FREE" with $0/month
3. Select cloud provider: **AWS** (recommended)
4. Select region: Choose one close to you (e.g., `us-east-1` for US East Coast)
5. Cluster Name: Leave as `Cluster0` (or name it `feelgive`)
6. Click **"Create"** button at bottom
7. Wait 3-5 minutes while cluster is created ☕

## Step 3: Create Database User (1 minute)

1. You'll see a "Security Quickstart" screen
2. Under "How would you like to authenticate your connection?":
   - Choose **"Username and Password"**
3. Set username: `feelgive-admin`
4. Click **"Autogenerate Secure Password"**
5. **IMPORTANT**: Click the **"Copy"** button and save this password somewhere safe!
   - Example password: `xK9mP2nQ7vL4sR8t`
6. Click **"Create User"** button

## Step 4: Allow Network Access (30 seconds)

1. Still on Security Quickstart screen
2. Under "Where would you like to connect from?":
   - Click **"My Local Environment"**
3. Click **"Add My Current IP Address"**
4. For development, also click **"Add a Different IP Address"**
   - Enter: `0.0.0.0/0` (allows all IPs - for development only)
   - Description: `Allow all (development)`
5. Click **"Finish and Close"**

## Step 5: Get Connection String (1 minute)

1. Click **"Go to Databases"** button
2. You'll see your cluster (Cluster0)
3. Click the **"Connect"** button
4. Choose **"Connect your application"**
5. Make sure these are selected:
   - Driver: **Node.js**
   - Version: **5.5 or later**
6. Copy the connection string (looks like this):
   ```
   mongodb+srv://feelgive-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Your Backend (1 minute)

1. Open your terminal
2. Navigate to backend folder:
   ```bash
   cd backend
   ```

3. Open the `.env` file (already created for you)

4. Find this line:
   ```env
   MONGODB_URI=mongodb://localhost:27017/feelgive
   ```

5. Replace it with your connection string from Step 5, but:
   - Replace `<password>` with the password you saved in Step 3
   - Add `/feelgive` before the `?` to specify database name

   **Example:**
   ```env
   MONGODB_URI=mongodb+srv://feelgive-admin:xK9mP2nQ7vL4sR8t@cluster0.abc123.mongodb.net/feelgive?retryWrites=true&w=majority
   ```

6. Save the file

## Step 7: Test Connection (30 seconds)

1. In your terminal (in the `backend` folder):
   ```bash
   npm run dev
   ```

2. You should see:
   ```
   ✅ MongoDB Atlas connected successfully
   🚀 Server running on port 3001
   ```

3. If you see this, **SUCCESS!** 🎉

## Troubleshooting

### ❌ "bad auth" error
- Double-check your password in the connection string
- Make sure you replaced `<password>` with your actual password
- No spaces or extra characters

### ❌ "connect ETIMEDOUT" error
- Wait a few minutes after adding IP address
- Make sure you added `0.0.0.0/0` in Network Access
- Check your internet connection

### ❌ "MONGODB_URI is not defined"
- Make sure you're editing `backend/.env` (not `.env.example`)
- Make sure the file is saved
- Restart the server: Stop it (Ctrl+C) and run `npm run dev` again

## Visual Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster
- [ ] Created database user `feelgive-admin`
- [ ] Saved password securely
- [ ] Added IP address `0.0.0.0/0`
- [ ] Copied connection string
- [ ] Updated `backend/.env` with connection string
- [ ] Replaced `<password>` with actual password
- [ ] Added `/feelgive` before the `?`
- [ ] Tested with `npm run dev`
- [ ] Saw "MongoDB Atlas connected successfully"

## Your Connection String Format

It should look EXACTLY like this (with your values):

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/feelgive?retryWrites=true&w=majority
```

**Example with real values:**
```env
MONGODB_URI=mongodb+srv://feelgive-admin:xK9mP2nQ7vL4sR8t@cluster0.abc123.mongodb.net/feelgive?retryWrites=true&w=majority
```

## What Each Part Means

```
mongodb+srv://           ← Protocol (always the same)
feelgive-admin           ← Your username
:                        ← Separator
xK9mP2nQ7vL4sR8t        ← Your password (no < >)
@                        ← Separator
cluster0.abc123.mongodb.net  ← Your cluster address
/feelgive                ← Database name (IMPORTANT!)
?retryWrites=true&w=majority ← Options (always the same)
```

## Next Steps After Setup

Once you see "MongoDB Atlas connected successfully":

1. **Test the API:**
   ```bash
   cd backend
   ./test-api.sh
   ```

2. **View your data:**
   - Go to MongoDB Atlas dashboard
   - Click "Browse Collections"
   - You'll see `feelgive` database with collections

3. **Start using the backend:**
   - Backend is running on http://localhost:3001
   - API endpoints are at http://localhost:3001/api/v1
   - Health check: http://localhost:3001/health

## Need More Help?

- **Detailed guide**: See [`backend/MONGODB_ATLAS_SETUP.md`](backend/MONGODB_ATLAS_SETUP.md)
- **API documentation**: See [`backend/README.md`](backend/README.md)
- **Integration guide**: See [`BACKEND_INTEGRATION.md`](BACKEND_INTEGRATION.md)

## Common Mistakes to Avoid

1. ❌ Forgetting to replace `<password>` with actual password
2. ❌ Not adding `/feelgive` before the `?`
3. ❌ Editing `.env.example` instead of `.env`
4. ❌ Not saving the `.env` file
5. ❌ Not waiting for cluster to finish creating
6. ❌ Not adding `0.0.0.0/0` to IP whitelist

## Success Indicators

✅ No error messages when starting server
✅ See "MongoDB Atlas connected successfully"
✅ Can run `./test-api.sh` without errors
✅ Can see data in MongoDB Atlas dashboard

---

**That's it! You're ready to use MongoDB Atlas with FeelGive! 🚀**