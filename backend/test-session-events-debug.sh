#!/bin/bash

echo "=== Debugging Session Events ==="
echo ""

# Get the admin key from environment or use default
ADMIN_KEY="${ADMIN_KEY:-your-secret-admin-key-change-this}"

# Get the most recent session
echo "1. Fetching most recent session..."
SESSION_DATA=$(curl -s "http://localhost:3001/api/v1/analytics/sessions?limit=1&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY")

SESSION_ID=$(echo "$SESSION_DATA" | jq -r '.sessions[0].sessionId')
echo "   Most recent session ID: $SESSION_ID"
echo ""

# Get events for that session
echo "2. Fetching events for session $SESSION_ID..."
EVENTS=$(curl -s "http://localhost:3001/api/v1/analytics/sessions/$SESSION_ID/events" \
  -H "X-Admin-Key: $ADMIN_KEY")

echo "$EVENTS" | jq '{
  sessionId: .sessionId,
  totalEvents: .totalEvents,
  events: .events | map({
    eventType: .eventType,
    eventName: .eventName,
    timestamp: .timestamp,
    hasArticleUrl: (.metadata.articleUrl != null),
    articleUrl: .metadata.articleUrl
  })
}'

echo ""
echo "3. Article events with URLs:"
echo "$EVENTS" | jq '.events[] | select(.eventType == "article_opened") | {
  eventName: .eventName,
  articleUrl: .metadata.articleUrl,
  timestamp: .timestamp
}'
