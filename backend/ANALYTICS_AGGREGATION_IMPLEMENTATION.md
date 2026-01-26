# Analytics Aggregation Implementation - Phase 4

## Overview
This document describes the MongoDB aggregation pipeline implementations for the analytics endpoints in `backend/src/routes/analytics.ts`.

## Implemented Endpoints

### 1. GET `/api/v1/analytics/summary`

**Purpose**: Provides high-level analytics metrics for a specified time range.

**Query Parameters**:
- `range` (optional): Time range (e.g., `7d`, `30d`, `90d`). Default: `7d`

**Aggregation Strategy**:
Uses a single `$facet` aggregation pipeline to calculate all metrics efficiently in one database query:

```javascript
{
  $facet: {
    uniqueUsers: [...],      // Count unique users (userId or sessionId)
    totalSessions: [...],    // Count total sessions
    pageViews: [...],        // Sum all page views
    bounceRate: [...],       // Calculate bounce rate (sessions with ≤1 page view)
    avgDuration: [...]       // Calculate average session duration
  }
}
```

**Metrics Returned**:
- `totalUsers`: Count of unique users (uses `userId` if available, falls back to `sessionId` for anonymous users)
- `totalSessions`: Total number of sessions in the time range
- `totalPageViews`: Sum of all page views across all sessions
- `bounceRate`: Percentage of sessions with only 1 page view
- `avgSessionDuration`: Average session duration in seconds

**Optimization**:
- Single aggregation pipeline reduces database round trips
- Uses indexed fields (`startTime`, `userId`)
- Efficient `$facet` operator for parallel processing

---

### 2. GET `/api/v1/analytics/timeseries`

**Purpose**: Provides time-series data for specific metrics, aggregated by day.

**Query Parameters**:
- `metric` (required): Metric to track. Supported values:
  - `page_views`: Count of page view events per day
  - `sessions`: Count of sessions started per day
  - `users` or `active_users`: Count of unique users per day
- `range` (optional): Time range (e.g., `7d`, `30d`, `90d`). Default: `30d`

**Aggregation Strategies**:

#### Page Views
```javascript
AnalyticsEvent.aggregate([
  { $match: { eventType: 'page_view', timestamp: { $gte: startDate } } },
  { $group: { _id: { year, month, day }, value: { $sum: 1 } } },
  { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  { $project: { date: { $dateFromParts: {...} }, value: 1 } }
])
```

#### Sessions
```javascript
AnalyticsSession.aggregate([
  { $match: { startTime: { $gte: startDate } } },
  { $group: { _id: { year, month, day }, value: { $sum: 1 } } },
  { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  { $project: { date: { $dateFromParts: {...} }, value: 1 } }
])
```

#### Active Users
```javascript
AnalyticsSession.aggregate([
  { $match: { startTime: { $gte: startDate } } },
  // First group: deduplicate users per day
  { $group: { _id: { year, month, day, user: { $ifNull: ['$userId', '$sessionId'] } } } },
  // Second group: count unique users per day
  { $group: { _id: { year, month, day }, value: { $sum: 1 } } },
  { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  { $project: { date: { $dateFromParts: {...} }, value: 1 } }
])
```

**Optimization**:
- Uses compound indexes on `eventType` + `timestamp` for page views
- Uses index on `startTime` for sessions
- Two-stage grouping for accurate unique user counts (handles both authenticated and anonymous users)

---

### 3. GET `/api/v1/analytics/funnels`

**Purpose**: Provides conversion funnel analysis with step-by-step metrics.

**Query Parameters**:
- `range` (optional): Time range (e.g., `7d`, `30d`, `90d`). Default: `30d`

**Funnel Steps** (as per requirements):
1. **App Open**: Events with type `app_open` or `session_start`
2. **Article Open**: Events with type `article_opened`
3. **Donate Click**: Events with type `donate_clicked`
4. **Donation Success**: Events with type `donation_success`

**Aggregation Strategy**:
```javascript
// For each step, count matching events
AnalyticsEvent.countDocuments({
  eventType: { $in: step.eventTypes },
  timestamp: { $gte: startDate }
})
```

**Metrics Returned** (for each step):
- `step`: Step name
- `count`: Number of events for this step
- `conversionRate`: Percentage relative to first step (App Open)
- `stepConversionRate`: Percentage relative to previous step

**Example Response**:
```json
{
  "range": "30d",
  "funnel": [
    {
      "step": "App Open",
      "count": 1000,
      "conversionRate": 100.00,
      "stepConversionRate": 100.00
    },
    {
      "step": "Article Open",
      "count": 600,
      "conversionRate": 60.00,
      "stepConversionRate": 60.00
    },
    {
      "step": "Donate Click",
      "count": 150,
      "conversionRate": 15.00,
      "stepConversionRate": 25.00
    },
    {
      "step": "Donation Success",
      "count": 120,
      "conversionRate": 12.00,
      "stepConversionRate": 80.00
    }
  ]
}
```

**Optimization**:
- Uses indexed `eventType` field for fast filtering
- Parallel execution with `Promise.all` for multiple steps
- Efficient `$in` operator for multi-event type matching

---

## Index Usage

All aggregation pipelines leverage the following indexes defined in the models:

### AnalyticsEvent Indexes
```javascript
{ sessionId: 1 }
{ userId: 1 }
{ eventType: 1 }
{ category: 1 }
{ timestamp: 1 }
{ eventType: 1, timestamp: -1 }  // Compound index
{ sessionId: 1, timestamp: 1 }   // Compound index
```

### AnalyticsSession Indexes
```javascript
{ sessionId: 1 }  // Unique
{ userId: 1 }
{ startTime: 1 }
```

---

## Performance Considerations

1. **Single Query Optimization**: The summary endpoint uses `$facet` to calculate all metrics in one database round trip.

2. **Index Coverage**: All queries use indexed fields for filtering and sorting.

3. **Efficient Grouping**: Time-series queries group by date components (year, month, day) for optimal performance.

4. **Parallel Processing**: Funnel calculations use `Promise.all` to execute multiple queries concurrently.

5. **Conditional Logic**: Uses MongoDB operators like `$ifNull` and `$cond` to handle missing data gracefully.

---

## Testing

Run the test script to validate all endpoints:

```bash
./backend/test-analytics-aggregation.sh
```

This will test:
- Summary endpoint with different time ranges
- Timeseries for all supported metrics
- Funnel conversion analysis

---

## Future Enhancements

1. **Hourly Aggregation**: For short time ranges (< 2 days), aggregate by hour instead of day.

2. **Caching**: Implement Redis caching for frequently accessed time ranges.

3. **Real-time Updates**: Add WebSocket support for live dashboard updates.

4. **Custom Funnels**: Allow admins to define custom funnel steps via API.

5. **Cohort Analysis**: Add user cohort tracking and retention metrics.

6. **Geographic Breakdown**: Add country/region-based analytics using the `country` field.

---

## API Documentation

Full Swagger/OpenAPI documentation is available at `/api-docs` when the server is running.

All analytics endpoints require admin authentication via the `isAdmin` middleware.