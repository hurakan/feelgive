# Cross-Tab Navigation Implementation

## Overview
Implemented a comprehensive cross-tab navigation system for the Admin Analytics Dashboard that allows users to drill down from any analytics tab (Trends, User Journey, Locations) to the Session Explorer tab with filtered sessions.

## Implementation Date
January 26, 2026

## Features Implemented

### 1. Backend API Enhancements
**File**: `backend/src/routes/analytics.ts`

Added support for filtering sessions by:
- **Session IDs**: Filter by specific session IDs (comma-separated)
- **Location**: Filter by city or country (case-insensitive regex search)
- **Event Type**: Filter sessions that contain specific event types

**API Endpoint**: `GET /api/v1/analytics/sessions`

**New Query Parameters**:
```typescript
?sessionIds=id1,id2,id3  // Filter by specific session IDs
?location=Arkansas       // Filter by location (city or country)
?eventType=chat_opened   // Filter by event type
```

### 2. Frontend Analytics Client
**File**: `frontend/src/utils/analytics-client.ts`

Updated [`getSessions()`](frontend/src/utils/analytics-client.ts:274) function to accept optional filters:
```typescript
getSessions(
  limit: number,
  offset: number,
  bustCache: boolean,
  filters?: {
    sessionIds?: string[];
    location?: string;
    eventType?: string;
  }
)
```

### 3. Admin Analytics Dashboard
**File**: `frontend/src/pages/admin-analytics.tsx`

#### State Management
Added new state variables:
- `sessionFilters`: Stores active filter criteria
- `activeTab`: Controls which tab is currently displayed
- `searchParams`: URL parameters for deep linking

#### Navigation Functions
- [`navigateToSessionsWithFilter()`](frontend/src/pages/admin-analytics.tsx:130): Navigates to Session Explorer with filters
- [`clearSessionFilters()`](frontend/src/pages/admin-analytics.tsx:152): Resets all filters

#### Visual Indicators
- **Filter Badge**: Shows on Session Explorer tab when filters are active
- **Filter Summary**: Displays active filter criteria with clear button
- **Hover States**: Visual feedback on clickable elements

### 4. Interactive Elements

#### Locations Tab
**Countries & Cities are now clickable**:
- Click any country → Filter sessions from that country
- Click any city → Filter sessions from that city
- Visual indicators: Hover effects, chevron icons
- Toast notifications confirm the action

**Example**:
```
Click "Arkansas" → Shows all sessions from Arkansas
Click "Cabot, Arkansas" → Shows all sessions from Cabot
```

#### User Journey Tab
**Funnel bars are now clickable**:
- Click any bar in the funnel chart → Filter sessions with that activity
- Supported activities:
  - App Open → `app_open`
  - Article Open → `article_opened`
  - Used Chat → `chat_opened`
  - Donate Click → `donate_clicked`
  - Donation Success → `donation_success`
- Enhanced tooltip shows "Click to filter sessions"

**Example**:
```
Click "Used Chat" bar → Shows only sessions where users opened chat
Click "Article Open" bar → Shows only sessions where users read articles
```

## User Flow Examples

### Example 1: Location-Based Drill-Down
1. User views **Locations** tab
2. Sees "10 sessions from Arkansas"
3. Clicks on "Arkansas"
4. System automatically:
   - Switches to **Session Explorer** tab
   - Filters to show only Arkansas sessions
   - Displays filter badge and summary
   - Updates URL parameters
5. User can:
   - View detailed session information
   - Expand sessions to see events
   - Clear filter to see all sessions

### Example 2: Activity-Based Drill-Down
1. User views **User Journey** tab
2. Sees "25 users used chat"
3. Clicks on the "Used Chat" bar
4. System automatically:
   - Switches to **Session Explorer** tab
   - Filters to show only sessions with chat activity
   - Shows filter indicator
5. User can study chat usage patterns

### Example 3: Multiple Filters
The system supports combining filters (though UI currently applies one at a time):
```
?sessionIds=id1,id2&location=Arkansas&eventType=chat_opened
```

## Technical Details

### Filter Persistence
- Filters are stored in component state
- URL parameters maintain filter state across page refreshes
- Filters persist until manually cleared

### Backend Query Optimization
The backend uses MongoDB aggregation pipelines to efficiently filter sessions:
1. Match stage applies filters
2. Lookup stage joins with events
3. AddFields stage calculates activity flags
4. Project stage formats output

### Performance Considerations
- Pagination maintained (20 sessions per page)
- Filters applied at database level (not client-side)
- Cache busting when applying new filters
- Efficient regex searches for location filtering

## UI/UX Enhancements

### Visual Feedback
- ✅ Hover effects on clickable elements
- ✅ Chevron icons indicate clickability
- ✅ Toast notifications confirm actions
- ✅ Filter badge on tab
- ✅ Filter summary with clear button
- ✅ Cursor changes to pointer on interactive elements

### Accessibility
- Semantic HTML buttons for clickable elements
- Clear visual hierarchy
- Descriptive tooltips
- Keyboard navigation support

## Testing the Feature

### Manual Testing Steps

1. **Test Location Filtering**:
   ```bash
   # Navigate to admin analytics
   # Go to Locations tab
   # Click on any country or city
   # Verify Session Explorer shows filtered results
   ```

2. **Test Event Type Filtering**:
   ```bash
   # Go to User Journey tab
   # Click on any funnel bar
   # Verify Session Explorer shows filtered results
   ```

3. **Test Filter Clearing**:
   ```bash
   # Apply any filter
   # Click "Clear Filters" button
   # Verify all sessions are shown again
   ```

4. **Test URL Parameters**:
   ```bash
   # Apply a filter
   # Copy URL
   # Open in new tab
   # Verify filter is maintained
   ```

## Future Enhancements

### Potential Improvements
1. **Multi-Filter Support**: Allow combining multiple filters simultaneously
2. **Date Range Filtering**: Filter sessions by date range
3. **Save Filter Presets**: Save commonly used filter combinations
4. **Export Filtered Data**: Download filtered session data as CSV
5. **Advanced Filters**: Device type, browser, OS filtering
6. **Filter History**: Navigate back through previous filters

### Additional Drill-Down Options
- Click on specific sessions in trends chart
- Filter by time of day
- Filter by session duration
- Filter by page view count

## Files Modified

### Backend
- [`backend/src/routes/analytics.ts`](backend/src/routes/analytics.ts:819) - Added filtering support to sessions endpoint

### Frontend
- [`frontend/src/utils/analytics-client.ts`](frontend/src/utils/analytics-client.ts:274) - Updated getSessions function
- [`frontend/src/pages/admin-analytics.tsx`](frontend/src/pages/admin-analytics.tsx:1) - Implemented cross-tab navigation

## API Documentation

### GET /api/v1/analytics/sessions

**Query Parameters**:
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| limit | integer | Number of sessions (1-100) | 20 |
| offset | integer | Pagination offset | 0 |
| sessionIds | string | Comma-separated session IDs | id1,id2,id3 |
| location | string | City or country name | Arkansas |
| eventType | string | Event type to filter by | chat_opened |

**Response**:
```json
{
  "sessions": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

## Conclusion

The cross-tab navigation feature significantly enhances the analytics dashboard by enabling intuitive drill-down workflows. Users can now seamlessly navigate from high-level metrics to detailed session data, making it easier to understand user behavior patterns and investigate specific scenarios.

The implementation is performant, user-friendly, and extensible for future enhancements.