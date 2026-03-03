#!/bin/bash

echo "=========================================="
echo "COMPREHENSIVE ANALYTICS PIPELINE TEST"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3001/api/v1"
ADMIN_KEY="your-secret-admin-key-here"

# Generate unique identifiers
TIMESTAMP=$(date +%s)
SESSION_ID="diagnostic-session-${TIMESTAMP}"
USER_ID="diagnostic-user-${TIMESTAMP}"

echo "Test Session ID: $SESSION_ID"
echo "Test User ID: $USER_ID"
echo ""

# Step 1: Send a complete user journey
echo "=== STEP 1: Sending Complete User Journey ==="
echo ""

echo "1.1 - App Open Event"
curl -s -X POST "$BASE_URL/analytics/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [{
      \"eventType\": \"app_open\",
      \"eventName\": \"App Launched\",
      \"category\": \"lifecycle\",
      \"metadata\": { \"test\": \"diagnostic\" },
      \"url\": \"http://localhost:5173/\",
      \"sessionId\": \"$SESSION_ID\",
      \"userId\": \"$USER_ID\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
    }],
    \"deviceInfo\": {
      \"deviceType\": \"desktop\",
      \"browser\": \"Chrome\",
      \"os\": \"macOS\",
      \"country\": \"United States\",
      \"city\": \"Diagnostic City\"
    }
  }" | jq -r '.message // .error // "ERROR"'

sleep 1

echo "1.2 - Page View Event"
curl -s -X POST "$BASE_URL/analytics/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [{
      \"eventType\": \"page_view\",
      \"eventName\": \"Home Page\",
      \"category\": \"navigation\",
      \"metadata\": { \"path\": \"/\", \"test\": \"diagnostic\" },
      \"url\": \"http://localhost:5173/\",
      \"sessionId\": \"$SESSION_ID\",
      \"userId\": \"$USER_ID\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
    }],
    \"deviceInfo\": {
      \"deviceType\": \"desktop\",
      \"browser\": \"Chrome\",
      \"os\": \"macOS\",
      \"country\": \"United States\",
      \"city\": \"Diagnostic City\"
    }
  }" | jq -r '.message // .error // "ERROR"'

sleep 1

echo "1.3 - Article Opened Event"
curl -s -X POST "$BASE_URL/analytics/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [{
      \"eventType\": \"article_opened\",
      \"eventName\": \"Diagnostic Test Article\",
      \"category\": \"news\",
      \"metadata\": {
        \"articleId\": \"diag-123\",
        \"articleUrl\": \"https://example.com/diagnostic-article\",
        \"source\": \"Diagnostic Source\",
        \"test\": \"diagnostic\"
      },
      \"url\": \"http://localhost:5173/\",
      \"sessionId\": \"$SESSION_ID\",
      \"userId\": \"$USER_ID\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
    }],
    \"deviceInfo\": {
      \"deviceType\": \"desktop\",
      \"browser\": \"Chrome\",
      \"os\": \"macOS\",
      \"country\": \"United States\",
      \"city\": \"Diagnostic City\"
    }
  }" | jq -r '.message // .error // "ERROR"'

echo ""
echo "✅ All events sent successfully"
echo ""

# Step 2: Wait for processing
echo "=== STEP 2: Waiting for Backend Processing ==="
sleep 3
echo "✅ Wait complete"
echo ""

# Step 3: Query MongoDB directly
echo "=== STEP 3: Checking MongoDB Directly ==="
echo ""

echo "3.1 - Checking AnalyticsEvents collection"
docker exec mongodb mongosh analytics_db --quiet --eval "
  db.analyticsevents.find({ sessionId: '$SESSION_ID' }).count()
" 2>/dev/null || echo "Could not query MongoDB (container may not be running)"

echo ""
echo "3.2 - Checking AnalyticsSessions collection"
docker exec mongodb mongosh analytics_db --quiet --eval "
  db.analyticssessions.find({ sessionId: '$SESSION_ID' }).pretty()
" 2>/dev/null || echo "Could not query MongoDB (container may not be running)"

echo ""

# Step 4: Query Sessions API
echo "=== STEP 4: Querying Sessions API ==="
echo ""

echo "4.1 - Fetching all sessions (no filters)"
SESSIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=100&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY")

echo "Total sessions returned: $(echo "$SESSIONS_RESPONSE" | jq -r '.total // 0')"
echo "Sessions in response: $(echo "$SESSIONS_RESPONSE" | jq -r '.sessions | length')"
echo ""

echo "4.2 - Looking for our diagnostic session"
FOUND=$(echo "$SESSIONS_RESPONSE" | jq -r ".sessions[] | select(.sessionId == \"$SESSION_ID\") | .sessionId")

if [ -n "$FOUND" ]; then
  echo "✅ FOUND: Diagnostic session is in the API response"
  echo "$SESSIONS_RESPONSE" | jq ".sessions[] | select(.sessionId == \"$SESSION_ID\")"
else
  echo "❌ NOT FOUND: Diagnostic session is NOT in the API response"
  echo ""
  echo "Showing first 3 sessions from API:"
  echo "$SESSIONS_RESPONSE" | jq '.sessions[0:3]'
fi

echo ""

# Step 5: Check backend route logic
echo "=== STEP 5: Checking Backend Sessions Route ==="
echo ""

echo "5.1 - Checking if there are any filters in the backend code"
echo "Looking at backend/src/routes/analytics.ts..."
grep -n "find(" backend/src/routes/analytics.ts | head -5

echo ""

# Step 6: Summary
echo "=========================================="
echo "DIAGNOSTIC SUMMARY"
echo "=========================================="
echo ""
echo "Session ID: $SESSION_ID"
echo "User ID: $USER_ID"
echo ""
echo "Next steps:"
echo "1. Check if events were saved to MongoDB (Step 3)"
echo "2. Check if session appears in API response (Step 4)"
echo "3. If events are in DB but not in API, there's a filter issue"
echo "4. If events are not in DB, there's an ingestion issue"
echo ""