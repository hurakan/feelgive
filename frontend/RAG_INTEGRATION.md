# Frontend RAG Integration Documentation

## Overview

The frontend has been successfully integrated with the backend RAG (Retrieval-Augmented Generation) system to power the "Ask Me Anything" chat feature. This replaces the previous regex-based conversation agent with AI-powered responses using Google Gemini.

## Architecture

### Components

1. **Type Definitions** (`src/types/index.ts`)
   - `ChatMessage`: Message format for RAG history
   - `ChatContext`: Article and classification context sent to backend
   - `ChatRequest`: Complete request payload
   - `ChatResponse`: Response from backend with message and suggestions

2. **RAG API Client** (`src/utils/rag-api.ts`)
   - `sendChatMessage()`: Sends chat requests to backend
   - `sendChatMessageWithRetry()`: Includes retry logic with exponential backoff
   - `checkChatHealth()`: Health check for chat service
   - Comprehensive error handling for network issues, rate limits, and service unavailability

3. **Conversation Agent** (`src/utils/conversation-agent.ts`)
   - Refactored to use RAG API instead of regex patterns
   - Maintains conversation history for context continuity
   - Provides graceful fallback messages on errors
   - Keeps last 20 messages in history to prevent token overflow

4. **Chat Interface** (`src/components/chat-interface.tsx`)
   - No changes required - maintains existing UI/UX
   - Displays AI responses with markdown support
   - Shows follow-up suggestions as quick reply buttons
   - Handles loading states during API calls

## Configuration

### Environment Variables

Add to `frontend/.env`:

```bash
# Backend API URL (required for RAG chat)
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

For production, update to your deployed backend URL.

## Data Flow

1. **User asks a question** in the chat interface
2. **Frontend prepares context**:
   - Article title, text, and summary
   - Classification data (cause, location, severity, needs, affected groups)
   - Matched charities information
   - Previous conversation history
3. **API call** to `POST /api/v1/chat/message`
4. **Backend processes** with Google Gemini
5. **Response returned** with:
   - AI-generated answer
   - 2-3 follow-up question suggestions
   - Optional sources (if web search enabled)
6. **Frontend displays** response and suggestions

## Error Handling

The integration includes comprehensive error handling:

### Network Errors
- Detects connection failures
- Shows user-friendly message: "Unable to connect to the chat service"
- Provides fallback suggestions

### Rate Limiting (429)
- Detects when rate limit is exceeded
- Shows: "Too many requests. Please wait a moment and try again"
- Does not retry automatically

### Service Unavailable (503)
- Detects temporary service issues
- Shows: "The chat service is temporarily unavailable"
- Retries with exponential backoff (up to 2 retries)

### Generic Errors
- Catches unexpected errors
- Provides context-aware fallback messages
- Always offers path forward (view organizations, proceed to donation)

## Retry Logic

The `sendChatMessageWithRetry()` function implements:
- Maximum 2 retry attempts
- Exponential backoff: 1s, 2s
- No retry on rate limits or validation errors
- Preserves last error for user feedback

## Context Management

### Article Context
The conversation agent receives:
- **Full article text**: For detailed RAG context
- **Article summary**: For concise reference
- **Article title**: For context identification
- **Classification data**: Structured crisis information
- **Matched charities**: Organizations that can help

### Conversation History
- Maintains last 20 messages (10 exchanges)
- Sent to backend for context continuity
- Automatically trimmed to prevent token overflow
- Format: `{ role: 'user' | 'model', content: string }`

## Integration Points

### Index.tsx Updates
Added state management for:
- `articleText`: Full article content for RAG
- `articleTitle`: Article title for context
- Passed to ConversationAgent on instantiation

### ConversationAgent Updates
- Now async: `async processMessage()`
- Calls RAG API instead of regex matching
- Maintains both UI history and RAG history
- Provides `updateContext()` method for dynamic updates

## Testing the Integration

### Prerequisites
1. Backend server running on `http://localhost:3001`
2. Backend configured with `GOOGLE_GEMINI_API_KEY`
3. Frontend environment variable `VITE_API_BASE_URL` set

### Test Steps

1. **Start the application**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Analyze an article**:
   - Paste a crisis article URL
   - Wait for classification and charity matching

3. **Open chat interface**:
   - Click "Ask Questions About This Crisis"
   - Verify greeting message appears

4. **Test AI responses**:
   - Ask: "What happened?"
   - Verify AI-generated response appears
   - Check that follow-up suggestions are shown

5. **Test conversation continuity**:
   - Ask follow-up questions
   - Verify context is maintained across messages

6. **Test error handling**:
   - Stop backend server
   - Ask a question
   - Verify graceful error message appears

### Expected Behavior

✅ **Success indicators**:
- AI responses are contextual and relevant
- Follow-up suggestions appear as quick reply buttons
- Loading indicator shows during API calls
- Conversation maintains context across messages
- Error messages are user-friendly and actionable

❌ **Issues to watch for**:
- "Unable to connect" errors (check backend is running)
- "Too many requests" (check rate limits)
- Empty responses (check Gemini API key)
- Context loss (check history management)

## Performance Considerations

### Response Time
- Typical response: 1-3 seconds
- Depends on Gemini API latency
- Loading indicator provides feedback

### Token Usage
- Article text sent with each request
- History limited to 20 messages
- Backend truncates articles at 50k characters

### Rate Limiting
- Backend: 10 requests per minute per IP
- Frontend: No client-side rate limiting
- Retry logic respects rate limits

## Future Enhancements

1. **Web Search Integration**
   - Enable Gemini's Google Search grounding
   - Display sources in UI
   - Real-time crisis updates

2. **Response Caching**
   - Cache common questions
   - Reduce API calls
   - Faster responses

3. **Streaming Responses**
   - Show responses as they're generated
   - Better perceived performance
   - More engaging UX

4. **Multi-language Support**
   - Detect user language
   - Respond in appropriate language
   - Broader accessibility

## Troubleshooting

### "Unable to connect to the chat service"
- **Cause**: Backend not running or wrong URL
- **Fix**: Check `VITE_API_BASE_URL` and start backend

### "Too many requests"
- **Cause**: Rate limit exceeded
- **Fix**: Wait 1 minute before retrying

### Empty or generic responses
- **Cause**: Missing article context
- **Fix**: Verify article text is passed to ConversationAgent

### TypeScript errors
- **Cause**: Type mismatches
- **Fix**: Ensure all types are imported from `@/types`

## Files Modified/Created

### Created:
- `frontend/src/utils/rag-api.ts` - RAG API client
- `frontend/RAG_INTEGRATION.md` - This documentation

### Modified:
- `frontend/src/types/index.ts` - Added RAG types
- `frontend/src/utils/conversation-agent.ts` - Refactored to use RAG API
- `frontend/src/pages/Index.tsx` - Added article text/title state
- `frontend/.env.example` - Documented API URL
- `frontend/.env` - Added API URL configuration

### Unchanged:
- `frontend/src/components/chat-interface.tsx` - No changes needed
- All other components - Backward compatible

## Support

For issues or questions:
1. Check this documentation
2. Review backend `RAG_IMPLEMENTATION.md`
3. Check browser console for errors
4. Verify backend logs for API issues
5. Consult `RAG_SYSTEM_SPEC.md` for architecture details