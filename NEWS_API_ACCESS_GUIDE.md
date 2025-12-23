# How to Access News API Admin Interface

## ✅ Setup Complete!

The NewsAPIAdmin component has been integrated into your existing Settings modal.

## 🎯 How to Access

### Step 1: Open Your App
Navigate to: **http://localhost:5173**

### Step 2: Click Settings Icon
Look for the **⚙️ Settings** icon in the top-right corner of the page (next to the FeelGive logo)

### Step 3: Switch to News API Tab
In the Settings modal, you'll see two tabs:
- **📍 Tracked Locations** (your existing location tracking)
- **📰 News API** (NEW - news source management)

Click on the **"News API"** tab

### Step 4: You're In!
You'll now see the full News API admin dashboard with:
- ✅ 5 pre-configured news sources (already enabled!)
- 📊 Usage statistics showing 0% usage
- 🔘 "Fetch News Now" button
- ➕ "Add Source" button

## 🚀 Quick Test

1. **Open Settings** (⚙️ icon in top-right)
2. **Click "News API" tab**
3. **Click "Fetch News Now" button**
4. **Wait 5-10 seconds**
5. **See success message** with number of articles fetched!

## 📊 What You'll See

### Usage Statistics Tab
Shows real-time monitoring for each source:
- **Progress bars** (green/yellow/red based on usage)
- **Daily usage** (e.g., "0/5000 requests today")
- **Hourly usage** (if configured)
- **Last fetch time**
- **Total articles fetched**
- **Error messages** (if any)

### Configurations Tab
Shows all your news sources:
- **Source name** and provider
- **Enable/disable toggle**
- **Rate limits** (daily/hourly)
- **Keywords** being tracked
- **Countries** being monitored

## 🎨 Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  ⚙️ Settings                                    ✕   │
├─────────────────────────────────────────────────────┤
│  Manage your news tracking and API sources          │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────┬──────────────────┐           │
│  │ 📍 Tracked       │ 📰 News API      │ ← TABS    │
│  │    Locations     │                  │           │
│  └──────────────────┴──────────────────┘           │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  News API Management                       │    │
│  │  ┌──────────┬──────────┬──────────┐       │    │
│  │  │ Refresh  │ Fetch    │ Add      │       │    │
│  │  │          │ News Now │ Source   │       │    │
│  │  └──────────┴──────────┴──────────┘       │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐  │    │
│  │  │ Usage Statistics │ Configurations  │  │    │
│  │  └─────────────────────────────────────┘  │    │
│  │                                             │    │
│  │  Guardian Open Platform        [Active]    │    │
│  │  ████████░░░░░░░░░░░░░░░░░░░░ 0/5000      │    │
│  │  0 requests remaining today                │    │
│  │                                             │    │
│  │  Currents API                  [Active]    │    │
│  │  ████████░░░░░░░░░░░░░░░░░░░░ 0/600       │    │
│  │  ...                                        │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────┐  ┌──────────────────┐               │
│  │ Cancel   │  │ Accept Changes   │               │
│  └──────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────┘
```

## 🎬 Demo Flow

### First Time Use:
1. Open app → Click ⚙️ Settings
2. Click "News API" tab
3. See 5 pre-configured sources (already enabled!)
4. Click "Fetch News Now"
5. Watch progress → See success message
6. Check "Usage Statistics" tab to see updated counters
7. Articles are now stored in database for classification

### Daily Use:
1. Open Settings → News API tab
2. Check usage statistics (stay under limits)
3. Click "Fetch News Now" when you want fresh articles
4. Monitor progress bars (green = good, yellow = caution, red = near limit)

## 📝 Current Configuration

You already have these sources configured and enabled:

| Source | Daily Limit | Status | Priority |
|--------|-------------|--------|----------|
| Guardian | 5,000 | ✅ Enabled | 7 |
| Currents | 600 | ✅ Enabled | 8 |
| NewsData | 200 | ✅ Enabled | 9 |
| MediaStack | 16 | ✅ Enabled | 6 |
| GNews | 100 | ✅ Enabled | 5 |
| NewsAPI | 100 | ❌ Disabled | 5 |

**Total Available**: 5,916 requests/day across all enabled sources!

## 🔄 Integration with Your App

The fetched articles will:
1. ✅ Be stored in MongoDB with `classificationStatus: 'pending'`
2. ✅ Be available for your LLM classification pipeline
3. ✅ Include metadata (title, description, URL, source, publish date)
4. ✅ Be deduplicated automatically
5. ✅ Respect rate limits automatically

## 🎯 Next Steps

### Immediate (Right Now):
1. **Test it!** Open Settings → News API → Click "Fetch News Now"
2. **Verify** articles are fetched (check success message)
3. **Monitor** usage statistics

### Short Term (Today):
1. **Integrate** with your classification pipeline
2. **Process** pending articles with your LLM
3. **Match** to charities

### Long Term (This Week):
1. **Set up automation** (cron job for periodic fetching)
2. **Monitor usage** patterns
3. **Optimize** keywords and schedule

## 📚 Documentation

- **Full Testing Guide**: [`NEWS_API_TESTING_GUIDE.md`](./NEWS_API_TESTING_GUIDE.md)
- **System Architecture**: [`NEWS_AGGREGATION_SYSTEM.md`](./NEWS_AGGREGATION_SYSTEM.md)
- **Setup Summary**: [`NEWS_API_SETUP_COMPLETE.md`](./NEWS_API_SETUP_COMPLETE.md)

## 🆘 Troubleshooting

### Can't see News API tab?
- Make sure frontend is running: `cd frontend && npm run dev`
- Refresh your browser
- Check browser console for errors

### "Fetch News Now" not working?
- Check backend is running: `cd backend && npm run dev`
- Verify MongoDB is connected
- Check backend logs for errors
- Run test script: `./backend/test-news-integration.sh`

### No articles fetched?
- Sources might need valid API keys
- Check error messages in Usage Statistics tab
- Review backend logs
- Test individual API endpoints

## ✨ You're All Set!

**The News API admin interface is now accessible through your Settings modal!**

Just click the ⚙️ icon → "News API" tab → "Fetch News Now" to get started! 🚀

---

*Integration completed: 2024-01-15*
*Location: Settings Modal → News API Tab*