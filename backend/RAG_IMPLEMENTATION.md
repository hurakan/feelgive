# RAG System Implementation - Google Gemini Integration

## Overview

This document describes the implementation of the RAG (Retrieval-Augmented Generation) system for the FeelGive "Ask Me Anything" feature using Google Gemini API.

## Architecture

The implementation follows a stateless RAG pattern where context is dynamically injected from the article being viewed, rather than using a vector database.

### Components

1. **Gemini Service** (`src/services/gemini.ts`)
   - Handles all interactions with Google Gemini API
   - Constructs system prompts with article context
   - Manages conversation history
   - Provides graceful error handling and fallbacks

2. **Chat Routes** (`src/routes/chat.ts`)
   - `POST /api/v1/chat/message` - Main endpoint for chat interactions
   - `GET /api/v1/chat/health` - Health check for chat service
   - Includes request validation and rate limiting

3. **Rate Limiter** (`src/middleware/rateLimiter.ts`)
   - Chat-specific rate limiter: 10 requests per minute
   - Prevents API cost spikes and abuse

## API Endpoints

### POST /api/v1/chat/message

Send a message to the AI assistant about a crisis article.

**Request Body:**
```json
{
  "message": "What are the most urgent needs?",
  "context": {
    "articleTitle": "Hurricane devastates coastal region",
    "articleText": "Full article content...",
    "articleSummary": "Brief summary...",
    "classification": {
      "cause": "disaster_relief",
      "geoName": "Florida, USA",
      "severity": "critical",
      "identified_needs": ["shelter", "food", "medical"],
      "affectedGroups": ["families", "elderly"]
    },
    "matchedCharities": [
      {
        "name": "Red Cross",
        "description": "Emergency relief organization",
        "trustScore": 0.95
      }
    ]
  },
  "history": [
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "model",
      "content": "Previous answer"
    }
  ]
}
```

**Response:**
```json
{
  "message": "The most urgent needs in Florida include...",
  "suggestions": [
    "How can Red Cross help with this crisis?",
    "What are the most urgent needs in Florida, USA?",
    "How can I make the biggest impact with my donation?"
  ]
}
```

**Rate Limiting:** 10 requests per minute per IP

### GET /api/v1/chat/health

Check if the chat service is properly configured and available.

**Response:**
```json
{
  "status": "ok",
  "service": "gemini",
  "model": "gemini-1.5-flash"
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Google Gemini API Configuration
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here
GEMINI_MODEL_NAME=gemini-1.5-flash
```

**Model Options:**
- `gemini-1.5-flash` - Recommended for speed and cost-effectiveness
- `gemini-1.5-pro` - Better reasoning capabilities, higher cost

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## System Prompt Strategy

The system uses a carefully crafted prompt that:

1. **Establishes Role**: "Hope" - an empathetic crisis response assistant
2. **Provides Context**: Full article content, classification data, matched charities
3. **Sets Guidelines**:
   - Answer only based on provided content
   - Use compassionate, hopeful tone
   - Mention how charities can help
   - Keep responses concise (under 150 words unless detail requested)
   - Redirect off-topic questions

## Security & Performance

### Input Validation
- Message length: 1-1000 characters
- Required fields validated using express-validator
- Article text truncated at 50,000 characters to prevent abuse

### Rate Limiting
- 10 requests per minute per IP address
- Prevents API cost spikes
- Returns 429 status when limit exceeded

### Error Handling
- Graceful degradation on API failures
- Specific error messages for different failure types
- Fallback message encourages donation even when service unavailable

### Conversation History
- Limited to last 10 messages to prevent token overflow
- Maintains context while controlling costs

## Testing

### Manual Testing

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:3001/api/v1/chat/health
   ```

3. **Test message endpoint:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/chat/message \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What are the most urgent needs?",
       "context": {
         "articleTitle": "Test Crisis",
         "articleText": "A major crisis has occurred...",
         "articleSummary": "Crisis summary",
         "classification": {
           "cause": "disaster_relief",
           "geoName": "Test Location",
           "severity": "high",
           "identified_needs": ["shelter", "food"],
           "affectedGroups": ["families"]
         },
         "matchedCharities": [
           {
             "name": "Test Charity",
             "description": "Helps with disasters",
             "trustScore": 0.9
           }
         ]
       },
       "history": []
     }'
   ```

### Using the Test Script

```bash
cd backend
./test-chat-endpoint.sh
```

## Integration with Frontend

The frontend should:

1. **Capture Context**: When user views an article, collect:
   - Article title, text, and summary
   - Classification data from the classification system
   - Matched charities from the charity matching system

2. **Maintain History**: Store conversation messages in component state

3. **Handle Loading**: Show typing indicator while waiting for response

4. **Display Suggestions**: Show follow-up questions to encourage engagement

5. **Error Handling**: Display user-friendly error messages

Example frontend integration in `conversation-agent.ts`:
```typescript
async processMessage(message: string, context: ArticleContext) {
  const response = await fetch('/api/v1/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      context,
      history: this.history
    })
  });
  
  const data = await response.json();
  return data;
}
```

## Cost Optimization

1. **Model Selection**: Using `gemini-1.5-flash` for optimal cost/performance
2. **Rate Limiting**: Prevents abuse and cost spikes
3. **History Limiting**: Only last 10 messages sent to API
4. **Text Truncation**: Article text capped at 50k characters
5. **Concise Responses**: System prompt requests responses under 150 words

## Future Enhancements

1. **Web Search Grounding**: Enable Gemini's Google Search integration for real-time updates
2. **Response Caching**: Cache common questions to reduce API calls
3. **Analytics**: Track question types and response quality
4. **A/B Testing**: Test different prompt strategies
5. **Multi-language Support**: Detect user language and respond accordingly

## Troubleshooting

### "API key not configured" error
- Ensure `GOOGLE_GEMINI_API_KEY` is set in `.env`
- Restart the server after adding the key

### "Service temporarily unavailable" error
- Check Gemini API quota limits
- Verify API key is valid
- Check Google Cloud Console for service status

### Rate limit errors
- Wait 1 minute before retrying
- Consider implementing client-side rate limiting
- For development, temporarily increase limit in `rateLimiter.ts`

### Empty or invalid responses
- Check article context is properly formatted
- Verify all required fields are present
- Review server logs for detailed error messages

## Dependencies

- `@google/generative-ai`: ^0.21.0 (Official Google Gemini SDK)
- `express-validator`: ^7.0.1 (Request validation)
- `express-rate-limit`: ^7.1.5 (Rate limiting)

## Files Modified/Created

### Created:
- `src/services/gemini.ts` - Gemini API service
- `src/routes/chat.ts` - Chat API routes
- `test-chat-endpoint.sh` - Testing script
- `RAG_IMPLEMENTATION.md` - This documentation

### Modified:
- `src/server.ts` - Registered chat routes
- `src/middleware/rateLimiter.ts` - Added chat rate limiter
- `.env.example` - Added Gemini configuration
- `package.json` - Added @google/generative-ai dependency

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Consult the [RAG_SYSTEM_SPEC.md](../RAG_SYSTEM_SPEC.md) for architectural details
4. Check [Google Gemini API documentation](https://ai.google.dev/docs)