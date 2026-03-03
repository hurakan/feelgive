#!/bin/bash

echo "=========================================="
echo "SESSION EXPLORER DIAGNOSTIC REPORT"
echo "=========================================="
echo ""

# Use the admin key from localStorage (you'll need to provide this)
ADMIN_KEY="your-secret-admin-key-change-this"

echo "Step 1: Get the most recent session"
echo "-----------------------------------"
SESSIONS=$(curl -s "http://localhost:3001/api/v1/analytics/sessions?limit=1&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY")

SESSION_ID=$(echo "$SESSIONS" | jq -r '.sessions[0].sessionId // empty')

if [ -z "$SESSION_ID" ]; then
  echo "❌ ERROR: Could not fetch sessions. Check admin key."
  echo "Response: $SESSIONS"
  exit 1
fi

echo "✅ Found session: $SESSION_ID"
LAST_ACTIVITY=$(echo "$SESSIONS" | jq -r '.sessions[0].lastActivity // .sessions[0].startTime')
echo "   Last Activity: $LAST_ACTIVITY"
echo ""

echo "Step 2: Get events for this session"
echo "-----------------------------------"
EVENTS=$(curl -s "http://localhost:3001/api/v1/analytics/sessions/$SESSION_ID/events" \
  -H "X-Admin-Key: $ADMIN_KEY")

TOTAL_EVENTS=$(echo "$EVENTS" | jq -r '.totalEvents // 0')
echo "✅ Total events in session: $TOTAL_EVENTS"
echo ""

echo "Step 3: Analyze article_opened events"
echo "-------------------------------------"
ARTICLE_EVENTS=$(echo "$EVENTS" | jq '[.events[] | select(.eventType == "article_opened")]')
ARTICLE_COUNT=$(echo "$ARTICLE_EVENTS" | jq 'length')

echo "Found $ARTICLE_COUNT article_opened events:"
echo ""

if [ "$ARTICLE_COUNT" -gt 0 ]; then
  echo "$ARTICLE_EVENTS" | jq -r '.[] | "  📰 \(.eventName // "No title")\n     URL: \(.metadata.articleUrl // "NO URL")\n     Time: \(.timestamp)\n"'
else
  echo "  ⚠️  No article_opened events found"
fi

echo ""
echo "Step 4: Check for metadata.articleUrl"
echo "-------------------------------------"
EVENTS_WITH_URL=$(echo "$ARTICLE_EVENTS" | jq '[.[] | select(.metadata.articleUrl != null)]')
URL_COUNT=$(echo "$EVENTS_WITH_URL" | jq 'length')

echo "Events with articleUrl: $URL_COUNT / $ARTICLE_COUNT"

if [ "$URL_COUNT" -lt "$ARTICLE_COUNT" ]; then
  echo "❌ ISSUE: Some article events are missing articleUrl in metadata"
  echo ""
  echo "Events WITHOUT articleUrl:"
  echo "$ARTICLE_EVENTS" | jq -r '.[] | select(.metadata.articleUrl == null) | "  - \(.eventName)"'
fi

echo ""
echo "Step 5: Verify event timestamps are recent"
echo "------------------------------------------"
NOW=$(date -u +%s)
echo "$ARTICLE_EVENTS" | jq -r '.[] | .timestamp' | while read -r timestamp; do
  EVENT_TIME=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${timestamp:0:19}" +%s 2>/dev/null || echo "0")
  AGE=$((NOW - EVENT_TIME))
  MINUTES=$((AGE / 60))
  
  if [ "$MINUTES" -lt 60 ]; then
    echo "  ✅ Event is $MINUTES minutes old (recent)"
  else
    HOURS=$((MINUTES / 60))
    echo "  ⚠️  Event is $HOURS hours old"
  fi
done

echo ""
echo "=========================================="
echo "DIAGNOSTIC SUMMARY"
echo "=========================================="
echo "Session ID: $SESSION_ID"
echo "Total Events: $TOTAL_EVENTS"
echo "Article Events: $ARTICLE_COUNT"
echo "Events with URLs: $URL_COUNT"
echo ""

if [ "$ARTICLE_COUNT" -eq 0 ]; then
  echo "❌ CRITICAL: No article events found in session"
elif [ "$URL_COUNT" -lt "$ARTICLE_COUNT" ]; then
  echo "❌ ISSUE: Missing articleUrl in some events"
elif [ "$URL_COUNT" -eq "$ARTICLE_COUNT" ] && [ "$ARTICLE_COUNT" -gt 0 ]; then
  echo "✅ All article events have URLs - backend data is correct"
  echo ""
  echo "If UI still shows issues, the problem is in the frontend rendering"
fi

echo ""
echo "=========================================="
