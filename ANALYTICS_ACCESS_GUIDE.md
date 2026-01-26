# Analytics Dashboard Access Guide

## Server URLs

### Backend API
- **Base URL:** http://localhost:3001
- **API Root:** http://localhost:3001/api/v1
- **Health Check:** http://localhost:3001/health
- **API Documentation:** http://localhost:3001/api-docs

### Frontend
- Check Terminal 6 for the frontend URL (typically http://localhost:5173 or similar)

---

## Analytics Endpoints

All analytics endpoints require admin authentication. Use one of these methods:

### Method 1: Admin Key Header (Recommended for Testing)
Add this header to your requests:
```
x-admin-key: dev-admin-key-12345
```

### Method 2: Admin Email Header
Add this header to your requests:
```
x-user-email: admin@feelgive.com
```

---

## Available Endpoints

### 1. Summary Statistics
**GET** `/api/v1/analytics/summary`

**Query Parameters:**
- `range` (optional): Time range (e.g., `7d`, `30d`, `90d`). Default: `7d`

**Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/analytics/summary?range=7d" \
  -H "x-admin-key: dev-admin-key-12345"
```

**Response:**
```json
{
  "range": "7d",
  "totalUsers": 0,
  "totalSessions": 0,
  "totalPageViews": 0,
  "avgSessionDuration": 0,
  "bounceRate": 0
}
```

---

### 2. Time Series Data
**GET** `/api/v1/analytics/timeseries`

**Query Parameters:**
- `metric` (required): Metric to track
  - `page_views`: Count of page view events per day
  - `sessions`: Count of sessions started per day
  - `users` or `active_users`: Count of unique users per day
- `range` (optional): Time range (e.g., `7d`, `30d`, `90d`). Default: `30d`

**Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/analytics/timeseries?metric=page_views&range=7d" \
  -H "x-admin-key: dev-admin-key-12345"
```

**Response:**
```json
{
  "metric": "page_views",
  "range": "7d",
  "data": [
    {
      "date": "2026-01-20T00:00:00.000Z",
      "value": 150
    },
    {
      "date": "2026-01-21T00:00:00.000Z",
      "value": 200
    }
  ]
}
```

---

### 3. Conversion Funnels
**GET** `/api/v1/analytics/funnels`

**Query Parameters:**
- `range` (optional): Time range (e.g., `7d`, `30d`, `90d`). Default: `30d`

**Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/analytics/funnels?range=7d" \
  -H "x-admin-key: dev-admin-key-12345"
```

**Response:**
```json
{
  "range": "7d",
  "funnel": [
    {
      "step": "App Open",
      "count": 1000,
      "conversionRate": 100,
      "stepConversionRate": 100
    },
    {
      "step": "Article Open",
      "count": 600,
      "conversionRate": 60,
      "stepConversionRate": 60
    },
    {
      "step": "Donate Click",
      "count": 150,
      "conversionRate": 15,
      "stepConversionRate": 25
    },
    {
      "step": "Donation Success",
      "count": 120,
      "conversionRate": 12,
      "stepConversionRate": 80
    }
  ]
}
```

---

## Testing Script

Run the automated test script:
```bash
./backend/test-analytics-aggregation.sh
```

This will test all analytics endpoints with the admin key.

---

## Accessing via Browser

1. **Swagger UI:** Visit http://localhost:3001/api-docs
2. Click "Authorize" button
3. Add custom header: `x-admin-key: dev-admin-key-12345`
4. Try out the analytics endpoints

---

## Frontend Integration

The frontend analytics dashboard is available at:
- **Admin Analytics Page:** http://localhost:5173/admin/analytics (or your frontend URL)

The frontend will automatically include the admin authentication when making requests.

---

## Notes

- All endpoints return empty data (`0` or `[]`) when there are no analytics events in the database
- The aggregation pipelines are optimized and use MongoDB indexes for performance
- Data is aggregated by day for time series queries
- The funnel tracks: App Open → Article Open → Donate Click → Donation Success