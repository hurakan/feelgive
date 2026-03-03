#!/bin/bash

echo "🧪 Testing Analytics Location Tracking"
echo "======================================"
echo ""

# Test 1: Send analytics event with location data
echo "📍 Test 1: Sending analytics event with location data..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/analytics/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "sessionId": "test-session-location-001",
        "userId": "test-user-123",
        "eventType": "page_view",
        "url": "http://localhost:5173/test-location",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
        "metadata": {
          "page": "/test-location"
        },
        "deviceType": "desktop",
        "browser": "Chrome",
        "os": "macOS",
        "country": "United States",
        "city": "San Francisco",
        "region": "California",
        "timezone": "America/Los_Angeles",
        "latitude": 37.7749,
        "longitude": -122.4194
      }
    ],
    "session": {
      "sessionId": "test-session-location-001",
      "userId": "test-user-123",
      "startTime": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
      "deviceType": "desktop",
      "browser": "Chrome",
      "os": "macOS",
      "country": "United States",
      "city": "San Francisco",
      "region": "California",
      "timezone": "America/Los_Angeles",
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }')

echo "Response: $RESPONSE"
echo ""

# Wait a moment for data to be processed
sleep 2

# Test 2: Query MongoDB to verify location data was stored
echo "📊 Test 2: Querying MongoDB for location data..."
echo ""

# Check AnalyticsEvent collection
echo "Checking AnalyticsEvent collection:"
mongosh "$MONGODB_URI" --quiet --eval '
  db.analyticsevents.findOne(
    { sessionId: "test-session-location-001" },
    { sessionId: 1, country: 1, city: 1, region: 1, timezone: 1, latitude: 1, longitude: 1, _id: 0 }
  )
' 2>/dev/null || echo "⚠️  MongoDB CLI not available. Please check manually."

echo ""

# Check AnalyticsSession collection
echo "Checking AnalyticsSession collection:"
mongosh "$MONGODB_URI" --quiet --eval '
  db.analyticssessions.findOne(
    { sessionId: "test-session-location-001" },
    { sessionId: 1, country: 1, city: 1, region: 1, timezone: 1, latitude: 1, longitude: 1, _id: 0 }
  )
' 2>/dev/null || echo "⚠️  MongoDB CLI not available. Please check manually."

echo ""
echo "✅ Location tracking test complete!"
echo ""
echo "📝 Summary:"
echo "  - Location data should include: country, city, region, timezone, latitude, longitude"
echo "  - Frontend analytics-tracker.ts now fetches location via ipapi.co on initialization"
echo "  - Backend models updated to store location fields with indexes on country"
echo ""