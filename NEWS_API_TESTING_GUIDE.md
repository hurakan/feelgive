# News API Testing & Setup Guide

## Overview

This guide walks you through testing the News API integration, from accessing the admin UI to setting up automated news fetching and integrating with your LLM classification pipeline.

## Prerequisites

✅ Backend server running on `http://localhost:3001`
✅ Frontend server running on `http://localhost:5173`
✅ MongoDB connected and running
✅ At least one News API key obtained (see [Supported APIs](#supported-news-apis))

## Step 1: Access the NewsAPIAdmin Component

### Option A: Add to Existing Page

Add the NewsAPIAdmin component to your settings or admin page:

```tsx
import { NewsAPIAdmin } from '@/components/news-api-admin';

function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <NewsAPIAdmin />
    </div>
  );
}
```

### Option B: Create Dedicated Admin Route

Create a new admin page at `frontend/src/pages/admin.tsx`:

```tsx
import { NewsAPIAdmin } from '@/components/news-api-admin';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <NewsAPIAdmin />
    </div>
  );
}
```

Then add the route to your router configuration.

### Option C: Test Directly (Quick Start)

For immediate testing, temporarily add to your main page:

```tsx
// In frontend/src/pages/Index.tsx or App.tsx
import { NewsAPIAdmin } from '@/components/news-api-admin';

// Add somewhere in your component:
<NewsAPIAdmin />
```

## Step 2: Get News API Keys

### Recommended Free Tier APIs

#### 1. **Guardian Open Platform** (Best for Quality)
- **Limit**: 5,000 requests/day
- **Sign up**: https://open-platform.theguardian.com/access/
- **Best for**: High-quality journalism, in-depth crisis reporting
- **Setup time**: ~2 minutes

#### 2. **Currents API** (Best for Volume)
- **Limit**: 600 requests/day
- **Sign up**: https://currentsapi.services/en/register
- **Best for**: High-volume monitoring
- **Setup time**: ~2 minutes

#### 3. **NewsData.io** (Best for Global Coverage)
- **Limit**: 200 requests/day
- **Sign up**: https://newsdata.io/register
- **Best for**: Multi-country crisis monitoring
- **Setup time**: ~3 minutes

#### 4. **NewsAPI.org** (Most Popular)
- **Limit**: 100 requests/day
- **Sign up**: https://newsapi.org/register
- **Best for**: General news coverage
- **Setup time**: ~2 minutes

### Quick Start: Get One API Key

For testing, start with **Guardian** or **Currents** (highest free limits):

1. Visit the sign-up link
2. Create free account
3. Copy your API key
4. Keep it handy for Step 3

## Step 3: Add Your First News Source

### Using the Admin UI

1. **Navigate to NewsAPIAdmin component** (from Step 1)

2. **Click "Add Source" button** (top right)

3. **Fill in the form**:
   - **Name**: `Guardian Primary` (or your chosen provider)
   - **Provider**: Select from dropdown (e.g., `Guardian Open Platform`)
   - **API Key**: Paste your API key
   - **Daily Request Limit**: `5000` (for Guardian) or appropriate limit
   - **Hourly Limit**: Leave as `0` (optional)
   - **Keywords**: Use defaults or customize:
     ```
     earthquake, flood, hurricane, wildfire, tsunami, drought, refugee, conflict, war, disaster, emergency, crisis, humanitarian
     ```
   - **Countries**: Leave empty for global coverage, or specify:
     ```
     us, gb, ca, au
     ```

4. **Click "Add Source"**

5. **Verify**: You should see a success toast and the new source in the "Configurations" tab

### Using the API Directly

Alternatively, add via API:

```bash
curl -X POST http://localhost:3001/api/v1/news/configs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Guardian Primary",
    "apiKey": "YOUR_API_KEY_HERE",
    "provider": "guardian",
    "requestsPerDay": 5000,
    "keywords": ["earthquake", "flood", "refugee", "disaster", "crisis"],
    "countries": []
  }'
```

## Step 4: Fetch News

### Method A: Use "Fetch News Now" Button

1. **In the NewsAPIAdmin UI**, click the **"Fetch News Now"** button (top right)

2. **Wait for response** (5-10 seconds)

3. **Check results**:
   - Success toast shows number of articles fetched
   - Usage statistics update automatically
   - Daily/hourly usage counters increment

### Method B: Use API Endpoint

```bash
curl -X POST http://localhost:3001/api/v1/news/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 20
  }'
```

Expected response:
```json
{
  "count": 15,
  "articles": [
    {
      "id": "...",
      "title": "Major Earthquake Strikes Region",
      "description": "...",
      "url": "https://...",
      "source": "The Guardian",
      "apiSource": "guardian",
      "publishedAt": "2024-01-15T10:30:00Z",
      "classificationStatus": "pending"
    }
  ]
}
```

### Method C: Test Individual Provider

```bash
# Test Guardian API directly
curl "https://content.guardianapis.com/search?q=earthquake&page-size=10&show-fields=all&api-key=YOUR_KEY"
```

## Step 5: Monitor Usage

### Dashboard Overview

The **Usage Statistics** tab shows:

- ✅ **Active/Disabled status** (green badge = active)
- 📊 **Daily usage progress bar** (green < 70%, yellow 70-90%, red > 90%)
- ⏰ **Hourly usage** (if configured)
- 📈 **Total articles fetched**
- 🕐 **Last fetch time**
- ⚠️ **Error messages** (if any)

### Stay Within Free Tier Limits

**Best Practices**:

1. **Monitor daily**: Check usage each morning
2. **Set alerts**: Disable sources approaching 90% usage
3. **Rotate sources**: When one hits limit, enable another
4. **Schedule wisely**: Spread fetches throughout the day

**Example Daily Schedule** (for 100 req/day limit):
- 8 AM: Fetch 20 articles
- 12 PM: Fetch 20 articles
- 4 PM: Fetch 20 articles
- 8 PM: Fetch 20 articles
- **Total**: 80 requests (20 buffer for manual fetches)

### Usage Monitoring API

```bash
# Get current usage stats
curl http://localhost:3001/api/v1/news/usage
```

Response:
```json
[
  {
    "provider": "guardian",
    "name": "Guardian Primary",
    "isEnabled": true,
    "dailyLimit": 5000,
    "dailyUsage": 45,
    "dailyRemaining": 4955,
    "totalArticlesFetched": 1250,
    "lastFetchedAt": "2024-01-15T14:30:00Z"
  }
]
```

## Step 6: Integrate with Classification Pipeline

### View Fetched Articles

```bash
# Get all pending articles
curl "http://localhost:3001/api/v1/news/articles?status=pending&limit=50"
```

### Classification Workflow

1. **Fetch articles** → Stored with `classificationStatus: 'pending'`
2. **LLM analyzes** → Extracts disaster type, location, needs
3. **Update status** → Mark as `'classified'` or `'irrelevant'`
4. **Match charities** → Link to relevant organizations
5. **Present to users** → Show in news feed with donation options

### Example: Classify an Article

```typescript
import { geminiService } from './services/gemini';
import NewsArticle from './models/NewsArticle';

async function classifyArticle(articleId: string) {
  // 1. Get article
  const article = await NewsArticle.findById(articleId);
  
  // 2. Fetch full content (if needed)
  const content = await fetchArticleContent(article.url);
  
  // 3. Classify with LLM
  const classification = await geminiService.classifyText(
    `${article.title}\n\n${article.description}\n\n${content}`
  );
  
  // 4. Update article
  article.classificationStatus = 'classified';
  article.disasterType = classification.disasterType;
  article.affectedCountry = classification.location;
  article.keywords = classification.keywords;
  await article.save();
  
  return classification;
}
```

### Integrate with Existing RAG System

```typescript
// In your RAG pipeline
import { newsAggregator } from './services/news-aggregator';

async function updateNewsContext() {
  // Fetch latest crisis news
  const articles = await newsAggregator.fetchFromAllSources({
    limit: 50
  });
  
  // Add to RAG context
  for (const article of articles) {
    await addToRAGContext({
      type: 'news',
      content: article.description,
      metadata: {
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt
      }
    });
  }
}
```

## Step 7: Set Up Automation

### Option A: Node.js Cron Job

Create `backend/src/jobs/news-fetcher.ts`:

```typescript
import cron from 'node-cron';
import { newsAggregator } from '../services/news-aggregator.js';

// Fetch news every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Starting scheduled news fetch...');
  
  try {
    const articles = await newsAggregator.fetchFromAllSources({
      limit: 20
    });
    
    console.log(`✅ Fetched ${articles.length} articles`);
  } catch (error) {
    console.error('❌ Error fetching news:', error);
  }
});

console.log('📰 News fetcher cron job started');
```

Add to `backend/src/server.ts`:

```typescript
import './jobs/news-fetcher.js';
```

Install dependency:
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

### Option B: System Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line (fetch every 6 hours)
0 */6 * * * curl -X POST http://localhost:3001/api/v1/news/fetch -H "Content-Type: application/json" -d '{"limit":20}'
```

### Option C: GitHub Actions (for deployed apps)

Create `.github/workflows/fetch-news.yml`:

```yaml
name: Fetch News

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch News
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/v1/news/fetch \
            -H "Content-Type: application/json" \
            -d '{"limit":20}'
```

### Recommended Schedule

For free tier limits:

| API | Daily Limit | Recommended Frequency | Articles per Fetch |
|-----|-------------|----------------------|-------------------|
| Guardian | 5,000 | Every 2 hours | 50 |
| Currents | 600 | Every 4 hours | 30 |
| NewsData | 200 | Every 6 hours | 20 |
| NewsAPI | 100 | Every 12 hours | 20 |

## Troubleshooting

### Issue: "No enabled news API sources found"

**Solution**: Add at least one news source via the admin UI or API

### Issue: "Rate limit reached"

**Solution**: 
1. Check usage in admin dashboard
2. Wait for daily reset (midnight UTC)
3. Disable source temporarily
4. Enable a different source

### Issue: No articles returned

**Possible causes**:
- Invalid API key → Check key in admin UI
- Source disabled → Enable in Configurations tab
- No matching articles → Adjust keywords
- API endpoint down → Check provider status page

**Debug**:
```bash
# Check configurations
curl http://localhost:3001/api/v1/news/configs

# Check usage
curl http://localhost:3001/api/v1/news/usage

# Test fetch with verbose logging
curl -v -X POST http://localhost:3001/api/v1/news/fetch \
  -H "Content-Type: application/json" \
  -d '{"limit":5}'
```

### Issue: Articles not classifying

**Solution**:
1. Verify articles are stored: `GET /api/v1/news/articles?status=pending`
2. Check LLM/Gemini API configuration
3. Test classification manually with one article
4. Review backend logs for errors

## Testing Checklist

- [ ] Admin UI accessible
- [ ] At least one API key obtained
- [ ] News source added successfully
- [ ] "Fetch News Now" button works
- [ ] Articles appear in database
- [ ] Usage statistics update correctly
- [ ] Rate limiting works (test by hitting limit)
- [ ] Error handling works (test with invalid key)
- [ ] Classification pipeline receives articles
- [ ] Automation scheduled (if applicable)

## Next Steps

1. **Add more sources**: Diversify with 2-3 different providers
2. **Tune keywords**: Adjust based on article quality
3. **Monitor quality**: Review fetched articles daily
4. **Optimize schedule**: Balance freshness vs. rate limits
5. **Integrate fully**: Connect to your charity matching system

## Quick Reference

### API Endpoints

```bash
# List configurations
GET /api/v1/news/configs

# Add configuration
POST /api/v1/news/configs

# Toggle source
PATCH /api/v1/news/configs/:provider/toggle

# Get usage stats
GET /api/v1/news/usage

# Fetch news
POST /api/v1/news/fetch

# List articles
GET /api/v1/news/articles?status=pending&limit=50

# Get specific article
GET /api/v1/news/articles/:id
```

### Component Import

```tsx
import { NewsAPIAdmin } from '@/components/news-api-admin';
```

### Service Import

```typescript
import { newsAggregator } from './services/news-aggregator';
```

## Support

- 📖 Full documentation: `NEWS_AGGREGATION_SYSTEM.md`
- 🔧 Backend API: `backend/src/routes/news.ts`
- 🎨 Frontend component: `frontend/src/components/news-api-admin.tsx`
- 🔄 Service logic: `backend/src/services/news-aggregator.ts`

---

**Ready to start?** Begin with Step 1 and work through each section. The entire setup takes about 15-20 minutes! 🚀