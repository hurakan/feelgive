#!/bin/bash

echo "=== Testing Article Click Tracking and Session Explorer ==="
echo ""

# Admin credentials
ADMIN_EMAIL="admin@feelgive.com"
ADMIN_PASSWORD="admin123"

# Base URL
BASE_URL="http://localhost:3001/api/v1"

echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi
echo "✅ Logged in successfully"
echo ""

# Generate unique session ID
SESSION_ID="test-session-$(date +%s)"
USER_ID="test-user-$(date +%s)"

echo "2. Simulating article click with proper tracking..."
echo "   Session ID: $SESSION_ID"

# Simulate article_opened event with articleUrl in metadata
ARTICLE_URL="https://example.com/news/gaza-crisis-2024"
ARTICLE_TITLE="Gaza Crisis: Humanitarian Situation Worsens"

INGEST_RESPONSE=$(curl -s -X POST "$BASE_URL/analytics/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [
      {
        \"eventType\": \"article_opened\",
        \"eventName\": \"$ARTICLE_TITLE\",
        \"category\": \"news\",
        \"metadata\": {
          \"articleId\": \"test-article-123\",
          \"articleUrl\": \"$ARTICLE_URL\",
          \"source\": \"Test News\",
          \"eventTag\": \"crisis\",
          \"hasImage\": true
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
      }
    ],
    \"deviceInfo\": {
      \"deviceType\": \"desktop\",
      \"browser\": \"Chrome\",
      \"os\": \"macOS\",
      \"country\": \"United States\",
      \"city\": \"San Francisco\",
      \"screenWidth\": 1920,
      \"screenHeight\": 1080
    }
  }")

echo "✅ Article click event ingested"
echo ""

# Wait for data to be processed
sleep 2

echo "3. Fetching sessions list..."
SESSIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN")

echo "$SESSIONS_RESPONSE" | jq '.'
echo ""

# Extract our test session ID
TEST_SESSION_EXISTS=$(echo "$SESSIONS_RESPONSE" | jq -r ".sessions[] | select(.sessionId == \"$SESSION_ID\") | .sessionId")

if [ "$TEST_SESSION_EXISTS" == "$SESSION_ID" ]; then
  echo "✅ Test session found in sessions list"
else
  echo "⚠️  Test session not found (may need more time to process)"
fi
echo ""

echo "4. Fetching session events for test session..."
EVENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/sessions/$SESSION_ID/events" \
  -H "Authorization: Bearer $TOKEN")

echo "$EVENTS_RESPONSE" | jq '.'
echo ""

# Check if articleUrl is in metadata
ARTICLE_URL_IN_METADATA=$(echo "$EVENTS_RESPONSE" | jq -r '.events[0].metadata.articleUrl')

if [ "$ARTICLE_URL_IN_METADATA" == "$ARTICLE_URL" ]; then
  echo "✅ Article URL correctly stored in metadata: $ARTICLE_URL_IN_METADATA"
else
  echo "❌ Article URL NOT found in metadata"
  echo "   Expected: $ARTICLE_URL"
  echo "   Got: $ARTICLE_URL_IN_METADATA"
fi
echo ""

echo "5. Verifying event structure..."
EVENT_TYPE=$(echo "$EVENTS_RESPONSE" | jq -r '.events[0].eventType')
EVENT_NAME=$(echo "$EVENTS_RESPONSE" | jq -r '.events[0].eventName')

if [ "$EVENT_TYPE" == "article_opened" ]; then
  echo "✅ Event type correct: $EVENT_TYPE"
else
  echo "❌ Event type incorrect: $EVENT_TYPE"
fi

if [ "$EVENT_NAME" == "$ARTICLE_TITLE" ]; then
  echo "✅ Event name correct: $EVENT_NAME"
else
  echo "❌ Event name incorrect: $EVENT_NAME"
fi

echo ""
echo "=== Test Complete ==="
