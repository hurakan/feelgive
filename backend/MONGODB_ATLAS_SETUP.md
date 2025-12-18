# MongoDB Atlas Setup Guide for FeelGive

Follow these steps to set up MongoDB Atlas for your FeelGive backend.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or Google account
3. Verify your email address

## Step 2: Create a New Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (perfect for development and small production)
3. Select your preferred cloud provider:
   - **AWS** (recommended)
   - Google Cloud
   - Azure
4. Choose a region close to your users (e.g., `us-east-1` for US East Coast)
5. Name your cluster (default: `Cluster0`)
6. Click **"Create"** (takes 3-5 minutes to provision)

## Step 3: Create Database User

1. Click **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Set username: `feelgive-admin` (or your preference)
5. Click **"Autogenerate Secure Password"** and **SAVE IT SECURELY**
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Configure Network Access

1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development:
   - Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (allows all IPs)
4. For production:
   - Add your server's specific IP address
   - Or use your cloud provider's IP ranges
5. Click **"Confirm"**

## Step 5: Get Connection String

1. Click **"Database"** in the left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://feelgive-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Your Backend

1. Open `backend/.env` file
2. Replace the `MONGODB_URI` with your connection string
3. Replace `<password>` with your database user password
4. Add the database name `feelgive` before the `?`:

```env
MONGODB_URI=mongodb+srv://feelgive-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/feelgive?retryWrites=true&w=majority
```

**Example:**
```env
MONGODB_URI=mongodb+srv://feelgive-admin:MySecurePass123@cluster0.abc123.mongodb.net/feelgive?retryWrites=true&w=majority
```

## Step 7: Test the Connection

1. Open a terminal in the `backend` directory
2. Run the development server:
   ```bash
   npm run dev
   ```
3. You should see:
   ```
   ✅ MongoDB Atlas connected successfully
   🚀 Server running on port 3001
   ```

## Step 8: Verify Database Creation

1. Go back to MongoDB Atlas dashboard
2. Click **"Browse Collections"** on your cluster
3. You should see the `feelgive` database created
4. Collections will be created automatically when you first save data:
   - `donations`
   - `users`
   - `classifications`

## Common Issues & Solutions

### Issue: "MongoServerError: bad auth"
**Solution:** 
- Double-check your password in the connection string
- Ensure there are no special characters that need URL encoding
- If password has special chars, encode them (e.g., `@` becomes `%40`)

### Issue: "MongooseServerSelectionError: connect ETIMEDOUT"
**Solution:**
- Check Network Access settings in MongoDB Atlas
- Ensure `0.0.0.0/0` is added for development
- Wait a few minutes after adding IP address

### Issue: "MONGODB_URI is not defined"
**Solution:**
- Ensure `.env` file exists in `backend` directory
- Check that `MONGODB_URI` is properly set
- Restart your development server

### Issue: Connection string format error
**Solution:**
- Ensure format is: `mongodb+srv://username:password@cluster.mongodb.net/dbname?options`
- Don't forget to add `/feelgive` before the `?`
- Remove any `<` or `>` brackets

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** - Let MongoDB generate them
3. **Restrict IP access in production** - Don't use `0.0.0.0/0`
4. **Rotate credentials regularly** - Change passwords periodically
5. **Enable encryption at rest** - Available in M10+ clusters
6. **Monitor access logs** - Check MongoDB Atlas metrics regularly

## Production Checklist

Before deploying to production:

- [ ] Create a production cluster (consider M10+ for better performance)
- [ ] Use a strong, unique password
- [ ] Restrict network access to your server's IP only
- [ ] Enable backup (available in M10+ clusters)
- [ ] Set up monitoring and alerts
- [ ] Use environment variables for credentials (never hardcode)
- [ ] Enable encryption at rest
- [ ] Review and optimize indexes
- [ ] Set up a separate database for production

## Monitoring Your Database

1. Go to **"Metrics"** tab in your cluster
2. Monitor:
   - **Connections** - Should stay under limits
   - **Operations** - Read/write operations per second
   - **Network** - Data transfer
   - **Storage** - Database size

## Upgrading Your Cluster

Free M0 tier limits:
- 512 MB storage
- Shared RAM
- Shared vCPU

To upgrade:
1. Click **"Modify"** on your cluster
2. Choose a higher tier (M10, M20, etc.)
3. Adjust based on your needs

## Backup Strategy

For M10+ clusters:
1. Go to **"Backup"** tab
2. Enable **"Continuous Backup"**
3. Configure retention policy
4. Test restore process

For M0 (free tier):
- No automatic backups
- Export data manually using `mongodump`
- Consider upgrading for production

## Next Steps

After successful setup:
1. ✅ Backend connects to MongoDB Atlas
2. ✅ Test creating a donation via API
3. ✅ Verify data appears in MongoDB Atlas
4. 🔄 Deploy backend to production
5. 🔄 Update frontend to use production backend URL

## Support Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [MongoDB Community Forums](https://www.mongodb.com/community/forums/)
- [Stack Overflow - MongoDB](https://stackoverflow.com/questions/tagged/mongodb)

## Quick Reference

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Environment Variable:**
```env
MONGODB_URI=mongodb+srv://feelgive-admin:password@cluster0.xxxxx.mongodb.net/feelgive?retryWrites=true&w=majority
```

**Test Connection:**
```bash
cd backend
npm run dev
```

**View Logs:**
- Check terminal output for connection status
- MongoDB Atlas: Cluster → Metrics → View logs