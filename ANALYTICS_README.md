# Analytics System Documentation

## Overview

This application features a **self-hosted, privacy-first analytics system** that tracks user behavior without relying on third-party services. All data is stored in your own MongoDB database, giving you complete control over user privacy and data retention.

## Architecture

### Components

1. **Frontend Tracker** (`frontend/src/utils/analytics-tracker.ts`)
   - Lightweight client-side tracker
   - Batches events for efficient network usage
   - Automatically captures device info, location, and session data
   - Respects user privacy settings

2. **Backend API** (`backend/src/routes/analytics.ts`)
   - RESTful endpoints for event ingestion and querying
   - Admin-only access with API key authentication
   - Aggregation pipelines for real-time insights

3. **Database Models**
   - `AnalyticsEvent`: Individual user actions
   - `AnalyticsSession`: Grouped user sessions with metadata

4. **Admin Dashboard** (`frontend/src/pages/admin-analytics.tsx`)
   - Real-time visualization of user behavior
   - Session explorer with detailed event timelines
   - Geographic and funnel analysis

## Accessing the Analytics Dashboard

### Method 1: Keyboard Shortcut (Recommended)

Press **`Ctrl+Shift+N`** (or **`Ctrl+Shift+A`** on some systems) from anywhere in the application to open the admin analytics dashboard.

### Method 2: Direct URL

Navigate to `/admin/analytics` in your browser.

### Authentication

You'll be prompted to enter an **Admin Key**. This key is set via the `ADMIN_KEY` environment variable in your backend configuration.

**Default Admin Key**: Check your `.env` file in the `backend/` directory for the `ADMIN_KEY` value.

## Event Dictionary

### Core Events

| Event Type | Description | Key Properties |
|------------|-------------|----------------|
| `app_open` | User opens/launches the application | `source` (web/pwa/mobile) |
| `page_view` | User navigates to a new page | `eventName` (page title), `path`, `search` |
| `article_opened` | User opens a news article | `eventName` (article title), `articleUrl`, `articleId`, `source`, `eventTag` |
| `chat_opened` | User opens the AI chat interface | `context` (optional) |
| `chat_message_sent` | User sends a message to the AI | `messageLength`, `hasContext` |
| `donate_clicked` | User clicks a donation button | `organizationId`, `organizationName`, `amount` (optional) |
| `donation_success` | Donation completed successfully | `organizationId`, `organizationName`, `amount`, `transactionId` |
| `button_click` | Generic button interaction | `eventName` (button label), custom metadata |
| `form_submit` | Form submission | `eventName` (form name), custom metadata |
| `error` | Application error occurred | `eventName` (error message), `stack`, `severity` |

### Event Categories

- **`lifecycle`**: App lifecycle events (open, close, background)
- **`navigation`**: Page views and route changes
- **`engagement`**: User interactions (chat, article reads)
- **`conversion`**: Donation-related actions
- **`interaction`**: Button clicks, form submissions
- **`error`**: Error tracking

### Event Metadata

Each event can include custom metadata as a JSON object. Common metadata fields:

- **Article Events**: `articleId`, `articleUrl`, `source`, `eventTag`, `category`
- **Donation Events**: `organizationId`, `organizationName`, `amount`, `currency`, `transactionId`
- **Navigation Events**: `path`, `search`, `referrer`, `previousPage`
- **Error Events**: `stack`, `severity`, `userAgent`, `url`

## Dashboard Features

### 1. Summary Statistics (KPI Tiles)

- **Total Users**: Unique users, split by new vs. returning
- **Total Sessions**: Session count with average duration
- **Page Views**: Total views with unique visitor count
- **Bounce Rate**: Percentage of single-page sessions

### 2. Trends Tab

- **Activity Over Time**: Line chart showing page views by date
- **Sessions Over Time**: Line chart showing session activity patterns

### 3. User Journey Tab

- **Funnel Analysis**: Bar chart showing user actions at each stage
  - App Open → Page View → Article Read → Chat → Donate Click → Donation Success

### 4. Locations Tab

- **Top Countries**: User distribution by country
- **Top Cities**: User distribution by city and region
- **Timezones**: User timezone distribution

### 5. Session Explorer Tab

- **Session List**: Expandable list of individual user sessions
- **Session Details**: Click any session to view:
  - Device type, location, page views, duration
  - Complete event timeline with timestamps
  - Activity indicators (news, chat, donations)
  - Clickable article links (opens in new tab)

### 6. Generate Test Data (Development Only)

In development mode, a **"Generate Test Data"** button appears in the dashboard header. Click it to simulate a complete user journey:

1. App Open
2. Page View
3. Article Opened (with clickable link)
4. Chat Opened
5. Donate Clicked
6. Donation Success

This helps verify the analytics pipeline is working correctly.

## API Endpoints

All endpoints require the `X-Admin-Key` header for authentication.

### Ingest Events

```bash
POST /api/v1/analytics/ingest
Content-Type: application/json

{
  "events": [
    {
      "eventType": "page_view",
      "eventName": "Home Page",
      "category": "navigation",
      "metadata": { "path": "/" },
      "url": "https://example.com",
      "sessionId": "session-123",
      "userId": "user-456",
      "timestamp": "2024-01-26T12:00:00.000Z"
    }
  ],
  "deviceInfo": {
    "deviceType": "desktop",
    "browser": "Chrome",
    "os": "macOS",
    "country": "United States",
    "city": "San Francisco"
  }
}
```

### Get Summary Statistics

```bash
GET /api/v1/analytics/summary?range=7d
X-Admin-Key: your-admin-key
```

**Range Options**: `7d`, `30d`, `90d`, `all`

**Response**:
```json
{
  "totalUsers": 150,
  "newUsers": 45,
  "returningUsers": 105,
  "totalSessions": 320,
  "avgSessionDuration": 245,
  "pageViews": 1250,
  "uniqueVisitors": 150,
  "bounceRate": 32.5
}
```

### Get Time Series Data

```bash
GET /api/v1/analytics/timeseries?metric=page_views&range=7d
X-Admin-Key: your-admin-key
```

**Metrics**: `page_views`, `sessions`, `users`

### Get Funnel Data

```bash
GET /api/v1/analytics/funnels?range=7d
X-Admin-Key: your-admin-key
```

### Get Location Data

```bash
GET /api/v1/analytics/locations?range=7d
X-Admin-Key: your-admin-key
```

### Get Sessions

```bash
GET /api/v1/analytics/sessions?limit=20&offset=0
X-Admin-Key: your-admin-key
```

### Get Session Events

```bash
GET /api/v1/analytics/sessions/:sessionId/events
X-Admin-Key: your-admin-key
```

## Integration Guide

### Frontend Integration

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

function MyComponent() {
  const analytics = useAnalytics();
  
  const handleButtonClick = () => {
    analytics.track('button_click', {
      eventName: 'Subscribe Button',
      category: 'interaction',
      metadata: { location: 'header' }
    });
  };
  
  const handleArticleOpen = (article) => {
    analytics.track('article_opened', {
      eventName: article.title,
      category: 'news',
      metadata: {
        articleId: article.id,
        articleUrl: article.url,
        source: article.source,
        eventTag: article.tag
      }
    });
  };
  
  return (
    <button onClick={handleButtonClick}>Subscribe</button>
  );
}
```

### Backend Integration

The analytics system automatically handles:
- Session creation and management
- Event batching and storage
- Device fingerprinting
- Geographic data enrichment

No additional backend code is required for basic tracking.

## Privacy & Data Retention

### Privacy Features

- **Self-hosted**: All data stays in your MongoDB database
- **No third-party tracking**: No data sent to external services
- **User control**: Easy to implement opt-out mechanisms
- **Anonymization**: User IDs are generated client-side and can be randomized

### Data Retention

Configure data retention in your backend:

```typescript
// Example: Delete events older than 90 days
await AnalyticsEvent.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
});
```

## Testing

### Manual Testing

1. Open the application in development mode
2. Access the admin dashboard (`Ctrl+Shift+N`)
3. Click **"Generate Test Data"** button
4. Navigate to the **Session Explorer** tab
5. Verify the test session appears with all events
6. Click on article links to verify they open correctly

### Automated Testing

Run the integration test script:

```bash
cd backend
./test-analytics-full-flow.sh
```

This script:
1. Sends a batch of test events to `/ingest`
2. Waits for processing
3. Queries `/summary` endpoint
4. Verifies event counts match expectations

## Troubleshooting

### Dashboard Not Loading

- Verify backend is running (`npm run dev` in `backend/`)
- Check MongoDB connection in backend logs
- Ensure `ADMIN_KEY` is set in backend `.env`

### Events Not Appearing

- Check browser console for tracker errors
- Verify backend `/ingest` endpoint is accessible
- Check MongoDB for `analyticsevents` collection
- Ensure events are being batched (check after 10 events or 30 seconds)

### Authentication Failing

- Verify `ADMIN_KEY` matches between frontend request and backend `.env`
- Check browser network tab for `X-Admin-Key` header
- Ensure key is stored in localStorage after first login

### Article Links Not Working

- Verify `articleUrl` is included in event metadata
- Check that `eventType` is `article_opened`
- Ensure `eventName` is set (article title)

## Performance Considerations

- Events are batched client-side (max 10 events or 30 seconds)
- Backend uses MongoDB aggregation pipelines for efficient queries
- Session data is indexed for fast lookups
- Consider implementing data archival for large datasets

## Future Enhancements

- Real-time dashboard updates via WebSockets
- Custom event filtering and segmentation
- A/B test tracking and analysis
- Cohort analysis
- Export functionality (CSV, JSON)
- Automated reports via email

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for errors
3. Inspect MongoDB collections directly
4. Verify environment variables are set correctly

---

**Last Updated**: January 2024  
**Version**: 1.0.0