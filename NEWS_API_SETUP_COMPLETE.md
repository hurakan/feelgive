# News API Integration - Setup Complete ✅

## What's Been Set Up

Your FeelGive application now has a complete multi-source news aggregation system with:

✅ **Backend Infrastructure**
- Multi-provider news aggregation service
- Rate limiting and usage tracking
- MongoDB models for articles and configurations
- RESTful API endpoints for management
- Automatic deduplication

✅ **Frontend Admin UI**
- Real-time usage monitoring dashboard
- Source configuration management
- Manual fetch trigger
- Visual progress indicators
- Error tracking and display

✅ **Documentation**
- Comprehensive testing guide
- API integration examples
- Automation setup instructions
- Troubleshooting tips

## Quick Start (5 Minutes)

### 1. Get a Free API Key

Choose one (Guardian recommended for testing):

| Provider | Free Limit | Sign Up Link |
|----------|-----------|--------------|
| **Guardian** | 5,000/day | https://open-platform.theguardian.com/access/ |
| **Currents** | 600/day | https://currentsapi.services/en/register |
| **NewsData** | 200/day | https://newsdata.io/register |

### 2. Access the Admin UI

**Option A: Use the dedicated page**
```tsx
// Navigate to: http://localhost:5173/admin-news
// (Add route in your router if needed)
```

**Option B: Add to existing page**
```tsx
import { NewsAPIAdmin } from '@/components/news-api-admin';

function SettingsPage() {
  return <NewsAPIAdmin />;
}
```

### 3. Add Your First Source

1. Click **"Add Source"** button
2. Fill in the form:
   - **Name**: `Guardian Primary`
   - **Provider**: `Guardian Open Platform`
   - **API Key**: `[paste your key]`
   - **Daily Limit**: `5000`
   - **Keywords**: Use defaults or customize
3. Click **"Add Source"**

### 4. Fetch News

Click **"Fetch News Now"** button → Wait 5-10 seconds → See results!

### 5. Verify

```bash
# Run the test script
./backend/test-news-integration.sh
```

## File Locations

### Backend
```
backend/
├── src/
│   ├── models/
│   │   ├── NewsArticle.ts          # Article storage model
│   │   └── NewsAPIConfig.ts        # API configuration model
│   ├── routes/
│   │   └── news.ts                 # API endpoints
│   └── services/
│       └── news-aggregator.ts      # Multi-source fetching logic
└── test-news-integration.sh        # Integration test script
```

### Frontend
```
frontend/
└── src/
    ├── components/
    │   └── news-api-admin.tsx      # Admin dashboard component
    └── pages/
        └── admin-news.tsx          # Example admin page
```

### Documentation
```
├── NEWS_AGGREGATION_SYSTEM.md      # System architecture & details
├── NEWS_API_TESTING_GUIDE.md       # Step-by-step testing guide
└── NEWS_API_SETUP_COMPLETE.md      # This file
```

## API Endpoints

All endpoints are available at `http://localhost:3001/api/v1/news`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/configs` | List all configurations |
| POST | `/configs` | Add new source |
| PUT | `/configs/:provider` | Update configuration |
| PATCH | `/configs/:provider/toggle` | Enable/disable source |
| DELETE | `/configs/:provider` | Remove source |
| GET | `/usage` | Get usage statistics |
| POST | `/fetch` | Fetch news from all sources |
| GET | `/articles` | List stored articles |
| GET | `/articles/:id` | Get specific article |

## Testing the Integration

### Method 1: Use the Test Script

```bash
cd backend
./test-news-integration.sh
```

This will:
- ✅ Check backend health
- ✅ List configurations
- ✅ Show usage statistics
- ✅ Display stored articles
- ✅ Test manual fetch (optional)

### Method 2: Manual API Testing

```bash
# List configurations
curl http://localhost:3001/api/v1/news/configs

# Get usage stats
curl http://localhost:3001/api/v1/news/usage

# Fetch news (uses API quota!)
curl -X POST http://localhost:3001/api/v1/news/fetch \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

# List articles
curl http://localhost:3001/api/v1/news/articles?limit=10
```

### Method 3: Use the Admin UI

1. Navigate to admin page
2. Check "Usage Statistics" tab
3. Click "Fetch News Now"
4. Monitor progress and results

## Integration with Your LLM Pipeline

### Step 1: Fetch Articles

```typescript
import { newsAggregator } from './services/news-aggregator';

const articles = await newsAggregator.fetchFromAllSources({
  limit: 50
});
```

### Step 2: Classify with LLM

```typescript
import { geminiService } from './services/gemini';
import NewsArticle from './models/NewsArticle';

async function classifyArticle(articleId: string) {
  const article = await NewsArticle.findById(articleId);
  
  const classification = await geminiService.classifyText(
    `${article.title}\n\n${article.description}`
  );
  
  article.classificationStatus = 'classified';
  article.disasterType = classification.disasterType;
  article.affectedCountry = classification.location;
  await article.save();
  
  return classification;
}
```

### Step 3: Process Pending Articles

```typescript
// Get all unclassified articles
const pendingArticles = await NewsArticle.find({
  classificationStatus: 'pending'
}).limit(50);

// Classify each one
for (const article of pendingArticles) {
  try {
    await classifyArticle(article._id);
  } catch (error) {
    console.error(`Error classifying ${article._id}:`, error);
  }
}
```

## Setting Up Automation

### Option 1: Node.js Cron Job

Install dependency:
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

Create `backend/src/jobs/news-fetcher.ts`:
```typescript
import cron from 'node-cron';
import { newsAggregator } from '../services/news-aggregator.js';

// Fetch every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Fetching news...');
  const articles = await newsAggregator.fetchFromAllSources({ limit: 20 });
  console.log(`Fetched ${articles.length} articles`);
});
```

Add to `backend/src/server.ts`:
```typescript
import './jobs/news-fetcher.js';
```

### Option 2: System Cron (Linux/Mac)

```bash
crontab -e

# Add this line (every 6 hours)
0 */6 * * * curl -X POST http://localhost:3001/api/v1/news/fetch -H "Content-Type: application/json" -d '{"limit":20}'
```

### Option 3: Manual Scheduling

Just click "Fetch News Now" in the admin UI whenever you want fresh articles!

## Monitoring Usage

### Dashboard View

The admin UI shows:
- 📊 **Progress bars** for daily/hourly usage
- 🟢 **Green** = < 70% used
- 🟡 **Yellow** = 70-90% used
- 🔴 **Red** = > 90% used
- ⚠️ **Error badges** for failed fetches
- 🕐 **Last fetch times**

### Stay Within Free Tier

**Best Practices:**
1. Monitor usage daily
2. Disable sources approaching 90%
3. Enable different sources when one hits limit
4. Schedule fetches to spread throughout day
5. Use higher-limit sources (Guardian, Currents) first

**Example Schedule for 100 req/day:**
- 8 AM: Fetch 20 articles
- 12 PM: Fetch 20 articles
- 4 PM: Fetch 20 articles
- 8 PM: Fetch 20 articles
- **Total**: 80 requests (20 buffer)

## Supported News Providers

| Provider | Free Limit | Best For |
|----------|-----------|----------|
| Guardian | 5,000/day | Quality journalism |
| Currents | 600/day | High volume |
| NewsData | 200/day | Global coverage |
| NewsAPI | 100/day | General news |
| MediaStack | 500/month | Supplementary |
| GNews | 100/day | Additional coverage |

## Next Steps

### Immediate (Today)
- [ ] Get at least one API key
- [ ] Add source via admin UI
- [ ] Test "Fetch News Now"
- [ ] Verify articles in database

### Short Term (This Week)
- [ ] Add 2-3 different providers
- [ ] Set up basic automation
- [ ] Integrate with classification pipeline
- [ ] Monitor usage patterns

### Long Term (This Month)
- [ ] Optimize keywords for better targeting
- [ ] Fine-tune fetch schedule
- [ ] Connect to charity matching
- [ ] Set up alerts for critical news

## Troubleshooting

### No articles fetched?

**Check:**
1. API key is valid (test directly with curl)
2. Source is enabled (toggle in admin UI)
3. Rate limit not exceeded (check usage stats)
4. Keywords match current news (adjust if needed)
5. Backend logs for errors

**Debug:**
```bash
# Check configurations
curl http://localhost:3001/api/v1/news/configs | jq

# Check usage
curl http://localhost:3001/api/v1/news/usage | jq

# Test with verbose logging
curl -v -X POST http://localhost:3001/api/v1/news/fetch \
  -H "Content-Type: application/json" \
  -d '{"limit":5}'
```

### Rate limit errors?

**Solutions:**
1. Wait for daily reset (midnight UTC)
2. Disable source temporarily
3. Enable a different source
4. Upgrade to paid tier (if needed)

### Admin UI not loading?

**Check:**
1. Frontend server running (`npm run dev`)
2. Backend server running (`npm run dev`)
3. MongoDB connected
4. No console errors in browser
5. API_BASE_URL configured correctly

## Documentation

- 📖 **Full System Docs**: [`NEWS_AGGREGATION_SYSTEM.md`](./NEWS_AGGREGATION_SYSTEM.md)
- 🧪 **Testing Guide**: [`NEWS_API_TESTING_GUIDE.md`](./NEWS_API_TESTING_GUIDE.md)
- 🔧 **Backend API**: [`backend/src/routes/news.ts`](./backend/src/routes/news.ts)
- 🎨 **Frontend Component**: [`frontend/src/components/news-api-admin.tsx`](./frontend/src/components/news-api-admin.tsx)
- 🔄 **Service Logic**: [`backend/src/services/news-aggregator.ts`](./backend/src/services/news-aggregator.ts)

## Support & Resources

### API Provider Documentation
- Guardian: https://open-platform.theguardian.com/documentation/
- Currents: https://currentsapi.services/en/docs/
- NewsData: https://newsdata.io/documentation
- NewsAPI: https://newsapi.org/docs

### Testing Tools
- Test script: `./backend/test-news-integration.sh`
- Swagger UI: http://localhost:3001/api-docs
- MongoDB Compass: Connect to view stored articles

## Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] At least one API key obtained
- [ ] News source configured
- [ ] Test fetch successful
- [ ] Articles stored in database
- [ ] Admin UI accessible
- [ ] Usage monitoring working
- [ ] Integration test passed

## You're All Set! 🎉

Your news aggregation system is ready to:
- ✅ Fetch crisis-related news from multiple sources
- ✅ Track API usage and stay within free tiers
- ✅ Store articles for classification
- ✅ Integrate with your LLM pipeline
- ✅ Scale with additional providers

**Start by getting an API key and adding your first source!**

For detailed instructions, see [`NEWS_API_TESTING_GUIDE.md`](./NEWS_API_TESTING_GUIDE.md)

---

*Last Updated: 2024-01-15*
*System Version: 1.0*