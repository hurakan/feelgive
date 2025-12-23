# Multi-Source News Aggregation System

## Overview

FeelGive now includes a comprehensive multi-source news aggregation system that fetches crisis-related news from multiple APIs, stores metadata in MongoDB, and provides an admin interface for managing API sources and monitoring usage.

## Architecture

### Backend Components

1. **Models**
   - `NewsArticle`: Stores news article metadata (URL, title, description, source, etc.)
   - `NewsAPIConfig`: Manages API configurations, rate limits, and usage tracking

2. **Services**
   - `NewsAggregatorService`: Orchestrates fetching from multiple sources with rate limiting

3. **API Endpoints** (`/api/v1/news`)
   - `GET /configs`: List all news API configurations
   - `POST /configs`: Add new news API source
   - `PUT /configs/:provider`: Update configuration
   - `PATCH /configs/:provider/toggle`: Enable/disable source
   - `DELETE /configs/:provider`: Remove source
   - `GET /usage`: Get usage statistics for all sources
   - `POST /fetch`: Manually trigger news fetch
   - `GET /articles`: List stored articles with filtering
   - `GET /articles/:id`: Get specific article details

### Frontend Components

1. **NewsAPIAdmin Component** (`frontend/src/components/news-api-admin.tsx`)
   - Admin dashboard for managing news sources
   - Real-time usage monitoring with progress bars
   - Add/edit/toggle news API configurations
   - Manual news fetch trigger

## Supported News APIs

### 1. NewsAPI.org
- **Free Tier**: 100 requests/day
- **Features**: Top headlines, keyword search, country filter, category filter
- **Best For**: General news coverage
- **Get API Key**: https://newsapi.org/register

### 2. NewsData.io
- **Free Tier**: 200 requests/day
- **Features**: Multi-country coverage, keyword search
- **Best For**: Global crisis monitoring
- **Get API Key**: https://newsdata.io/register

### 3. Currents API
- **Free Tier**: 600 requests/day
- **Features**: Full-text search, broad coverage
- **Best For**: High-volume monitoring
- **Get API Key**: https://currentsapi.services/en/register

### 4. Guardian Open Platform
- **Free Tier**: 5,000 requests/day
- **Features**: Rich long-form content, quality journalism
- **Best For**: In-depth crisis reporting
- **Get API Key**: https://open-platform.theguardian.com/access/

### 5. MediaStack
- **Free Tier**: 500 requests/month (~16/day)
- **Features**: Multi-country, keyword search
- **Best For**: Supplementary coverage
- **Get API Key**: https://mediastack.com/product

### 6. GNews.io
- **Free Tier**: 100 requests/day
- **Features**: Simple keyword search
- **Best For**: Additional coverage
- **Get API Key**: https://gnews.io/register

## Setup Instructions

### 1. Get API Keys

Sign up for free accounts at the providers listed above and obtain API keys.

### 2. Configure Environment Variables

Add your API keys to `backend/.env`:

```bash
# News API Keys
NEWSAPI_KEY=your_newsapi_key
NEWSDATA_KEY=your_newsdata_key
CURRENTS_KEY=your_currents_key
GUARDIAN_KEY=your_guardian_key
MEDIASTACK_KEY=your_mediastack_key
GNEWS_KEY=your_gnews_key
```

### 3. Initialize News API Configurations

Run the initialization script to set up all configured news sources:

```bash
cd backend
npm run init-news-apis
```

Or manually with tsx:

```bash
cd backend
npx tsx scripts/init-news-apis.ts
```

This will:
- Connect to MongoDB
- Create configurations for each API with a valid key
- Set up rate limits and default keywords
- Skip APIs without keys

### 4. Access Admin Interface

The admin interface will be accessible through your application's settings or admin panel. Import and use the `NewsAPIAdmin` component:

```tsx
import { NewsAPIAdmin } from '@/components/news-api-admin';

function AdminPage() {
  return <NewsAPIAdmin />;
}
```

## Usage

### Managing News Sources

1. **View Usage Statistics**
   - Monitor daily and hourly API usage
   - Track remaining requests
   - View last fetch times and errors

2. **Enable/Disable Sources**
   - Toggle sources on/off to manage rate limits
   - Disable sources approaching limits
   - Re-enable when limits reset

3. **Add New Sources**
   - Click "Add Source" button
   - Select provider and enter API key
   - Configure rate limits and keywords
   - Set priority (higher = fetched first)

4. **Fetch News Manually**
   - Click "Fetch News Now" to trigger immediate fetch
   - System respects rate limits automatically
   - View results in usage statistics

### Automatic News Fetching

To set up automatic news fetching, create a cron job or scheduled task:

```typescript
import { newsAggregator } from './services/news-aggregator';

// Fetch news every hour
setInterval(async () => {
  try {
    const articles = await newsAggregator.fetchFromAllSources({
      limit: 20
    });
    console.log(`Fetched ${articles.length} articles`);
  } catch (error) {
    console.error('Error fetching news:', error);
  }
}, 60 * 60 * 1000); // 1 hour
```

## Rate Limiting Strategy

The system implements intelligent rate limiting:

1. **Daily Limits**: Tracks requests per day, resets at midnight
2. **Hourly Limits**: Optional hourly tracking for stricter limits
3. **Priority-Based**: Higher priority sources are queried first
4. **Automatic Skip**: Sources at limit are automatically skipped
5. **Usage Tracking**: Real-time monitoring of consumption

### Rate Limit Recommendations

For free tier usage:
- **Development**: Enable 2-3 sources with highest limits (Guardian, Currents)
- **Production**: Enable all sources, monitor usage closely
- **High Volume**: Upgrade to paid tiers or rotate API keys

## Data Storage

### What We Store

- **Article Metadata**: URL, title, description, source, publish date
- **Classification Data**: Disaster type, affected country, keywords
- **Fetch Metadata**: API source, fetch time, classification status

### What We DON'T Store

- Full article content (fetched on-demand by scraper/LLM)
- User tracking data
- Commercial usage data

This keeps the system within free tier Terms of Service.

## Classification Pipeline

1. **Fetch**: Get articles from enabled sources
2. **Store**: Save URL + metadata to MongoDB
3. **Classify**: LLM analyzes content for:
   - Disaster type (earthquake, flood, etc.)
   - Affected country/region
   - Severity level
   - Identified needs
4. **Match**: Link to relevant charities
5. **Present**: Show to users with donation options

## Monitoring & Maintenance

### Daily Tasks

- Check usage statistics in admin panel
- Disable sources approaching limits
- Review error messages

### Weekly Tasks

- Analyze article quality from each source
- Adjust keywords for better targeting
- Review classification accuracy

### Monthly Tasks

- Evaluate API performance
- Consider upgrading high-value sources
- Clean up old articles from database

## Troubleshooting

### "Rate limit reached" errors

- Check usage statistics in admin panel
- Disable source temporarily
- Wait for daily/hourly reset
- Consider upgrading to paid tier

### No articles fetched

- Verify API keys are correct
- Check if sources are enabled
- Review error messages in admin panel
- Test API keys directly with curl

### Classification not working

- Ensure articles are being stored
- Check classification service logs
- Verify LLM/Gemini API is configured
- Review article content quality

## API Response Examples

### Fetch News Response

```json
{
  "count": 15,
  "articles": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Major Earthquake Strikes Region",
      "description": "A 7.2 magnitude earthquake...",
      "url": "https://example.com/article",
      "source": "Reuters",
      "apiSource": "newsapi",
      "publishedAt": "2024-01-15T10:30:00Z",
      "classificationStatus": "pending"
    }
  ]
}
```

### Usage Statistics Response

```json
[
  {
    "provider": "newsapi",
    "name": "NewsAPI.org Primary",
    "isEnabled": true,
    "dailyLimit": 100,
    "dailyUsage": 45,
    "dailyRemaining": 55,
    "hourlyLimit": 10,
    "hourlyUsage": 3,
    "hourlyRemaining": 7,
    "totalArticlesFetched": 1250,
    "lastFetchedAt": "2024-01-15T14:30:00Z",
    "lastSuccessfulFetch": "2024-01-15T14:30:00Z"
  }
]
```

## Best Practices

1. **Start Small**: Begin with 2-3 sources, expand as needed
2. **Monitor Usage**: Check admin panel daily during initial setup
3. **Rotate Sources**: Disable high-usage sources, enable others
4. **Quality Over Quantity**: Prefer quality sources (Guardian) over volume
5. **Stay Non-Commercial**: Keep within free tier ToS
6. **Regular Cleanup**: Archive or delete old articles periodically
7. **Test Thoroughly**: Verify each source before production use

## Future Enhancements

- Automatic source rotation based on usage
- Machine learning for source quality scoring
- Webhook notifications for critical news
- Advanced filtering and deduplication
- Multi-language support
- RSS feed integration
- Social media monitoring

## Support

For issues or questions:
1. Check this documentation
2. Review API provider documentation
3. Check backend logs for errors
4. Test API keys with curl/Postman
5. Verify MongoDB connection

## License & Compliance

- Respect each API's Terms of Service
- Stay within free tier limits
- Don't resell or redistribute content
- Attribute sources properly
- Use for non-commercial purposes only (PoC)