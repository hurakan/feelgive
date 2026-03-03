#!/bin/bash

echo "=== Checking Recent Analytics Sessions ==="
echo ""

BASE_URL="${BASE_URL:-http://localhost:3001/api/v1}"
ADMIN_KEY="${ADMIN_KEY:-dev-admin-key-12345}"

echo "Fetching most recent sessions..."
echo ""

RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=5&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY")

echo "Recent Sessions:"
echo "$RESPONSE" | jq '.sessions[] | {sessionId, startTime, pageViews, hasArticleView, hasChat, hasDonation}'

echo ""
echo "Total sessions in database:"
echo "$RESPONSE" | jq '.total'

echo ""
echo "If you just opened an article, check if hasArticleView is true for the most recent session"