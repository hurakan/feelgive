# Web Search Setup Guide

This guide explains how to set up and configure the web search capability for the RAG system.

## Overview

The web search feature enhances RAG responses by fetching recent information from the web when users ask questions. This is particularly useful for:
- Getting the latest updates on ongoing crises
- Finding additional context beyond the article
- Providing more comprehensive answers to user questions

## Features

- **Optional & Configurable**: Web search can be enabled/disabled via environment variables
- **Graceful Degradation**: System works normally even if web search fails or is disabled
- **Smart Query Generation**: Automatically generates relevant search queries based on user questions and article context
- **Caching**: Results are cached for 1 hour to reduce API calls and improve performance
- **Rate Limiting**: Built-in safeguards to prevent excessive API usage
- **User Control**: Frontend toggle allows users to enable/disable web search per conversation

## Setup Instructions

### 1. Get Google Custom Search API Credentials

#### Step 1: Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Custom Search API"
4. Go to "Credentials" and create an API key
5. Copy your API key

#### Step 2: Create Custom Search Engine
1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. Configure:
   - **Sites to search**: Select "Search the entire web"
   - **Name**: Give it a descriptive name (e.g., "FeelGive Crisis Search")
4. Click "Create"
5. Copy your Search Engine ID (found in the control panel)

### 2. Configure Environment Variables

Add these variables to your `backend/.env` file:

```bash
# Web Search Configuration
WEB_SEARCH_ENABLED=true
GOOGLE_SEARCH_API_KEY=your-api-key-here
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here
WEB_SEARCH_MAX_RESULTS=3
WEB_SEARCH_CACHE_ENABLED=true
```

### 3. Restart Backend Server

```bash
cd backend
npm run dev
```

## Configuration Options

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WEB_SEARCH_ENABLED` | Enable/disable web search | `false` | No |
| `GOOGLE_SEARCH_API_KEY` | Your Google Custom Search API key | - | Yes (if enabled) |
| `GOOGLE_SEARCH_ENGINE_ID` | Your search engine ID | - | Yes (if enabled) |
| `WEB_SEARCH_MAX_RESULTS` | Number of results to fetch | `3` | No |
| `WEB_SEARCH_CACHE_ENABLED` | Enable result caching | `true` | No |

## Usage

### Backend API

The web search is automatically integrated into the chat endpoint. To enable it for a request:

```typescript
POST /api/v1/chat/message
{
  "message": "What's the latest update?",
  "context": { /* article context */ },
  "history": [],
  "enableWebSearch": true  // Enable web search for this request
}
```

### Frontend

Users can toggle web search on/off in the chat interface:
1. Look for the "Enhance with Web Search" toggle above the message input
2. Enable it to include web search results in responses
3. A badge will appear showing "Web search active"

## API Limits & Costs

### Free Tier
- **100 queries per day** (free)
- No credit card required
- Sufficient for testing and small-scale usage

### Paid Tier
- $5 per 1,000 queries after free tier
- Up to 10,000 queries per day

### Recommendations
- Keep `WEB_SEARCH_MAX_RESULTS` at 3 or lower to conserve quota
- Enable caching (`WEB_SEARCH_CACHE_ENABLED=true`) to reduce API calls
- Monitor usage in Google Cloud Console
- Consider implementing additional rate limiting for production

## How It Works

1. **User asks a question** with web search enabled
2. **Query generation**: System analyzes the question and article context to generate a relevant search query
3. **Search execution**: Performs Google Custom Search API call
4. **Result caching**: Stores results for 1 hour to avoid duplicate searches
5. **Integration**: Formats results and includes them in the Gemini prompt
6. **Response generation**: Gemini uses both article context and web search results to generate a comprehensive answer

## Troubleshooting

### Web search not working

1. **Check environment variables**:
   ```bash
   # In backend directory
   echo $WEB_SEARCH_ENABLED
   echo $GOOGLE_SEARCH_API_KEY
   echo $GOOGLE_SEARCH_ENGINE_ID
   ```

2. **Check backend logs**:
   - Look for "Web search service initialized successfully"
   - Or "Web search is enabled but API credentials are missing"

3. **Verify API key**:
   - Test your API key at [Google Custom Search API Try It](https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list)

4. **Check quota**:
   - Go to Google Cloud Console → APIs & Services → Dashboard
   - Check Custom Search API usage

### Rate limit errors

If you see "Search API rate limit exceeded":
- You've hit the daily quota (100 free queries)
- Wait until the next day or upgrade to paid tier
- Enable caching to reduce API calls

### Search results not relevant

The system automatically generates search queries based on:
- User's question
- Article location (geoName)
- Crisis cause/type

If results aren't relevant, the system will still provide a good answer using the article context.

## Testing

### Test Web Search Service

```bash
# In backend directory
curl -X POST http://localhost:3001/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the latest update?",
    "context": {
      "articleTitle": "Test Crisis",
      "articleText": "Test content",
      "articleSummary": "Test summary",
      "classification": {
        "cause": "disaster_relief",
        "geoName": "California",
        "severity": "high",
        "identified_needs": ["shelter"],
        "affectedGroups": ["residents"]
      },
      "matchedCharities": []
    },
    "history": [],
    "enableWebSearch": true
  }'
```

### Check Cache Statistics

The web search service maintains internal cache statistics. Check backend logs for cache hits/misses.

## Security Considerations

1. **API Key Protection**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys periodically

2. **Rate Limiting**:
   - The chat endpoint already has rate limiting
   - Consider additional limits for web search specifically

3. **Input Validation**:
   - Search queries are generated server-side
   - User input is sanitized before query generation

## Monitoring

Monitor these metrics in production:
- Web search API calls per day
- Cache hit rate
- Search failures
- Response times with/without web search

## Disabling Web Search

To disable web search:

1. Set `WEB_SEARCH_ENABLED=false` in `.env`
2. Restart backend server
3. The system will work normally without web search

Or remove the environment variables entirely - the system will automatically disable web search if credentials are missing.

## Support

For issues with:
- **Google Custom Search API**: [Google Support](https://support.google.com/programmable-search/)
- **FeelGive Integration**: Check backend logs and this documentation