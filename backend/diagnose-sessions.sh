#!/bin/bash

echo "=========================================="
echo "Session Diagnostic Tool"
echo "=========================================="
echo ""

BASE_URL="${BASE_URL:-http://localhost:3001/api/v1}"
ADMIN_KEY="${ADMIN_KEY:-dev-admin-key-12345}"

echo "Fetching last 10 sessions from database..."
echo ""

SESSIONS=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=10&offset=0&_t=$(date +%s%3N)" \
  -H "X-Admin-Key: $ADMIN_KEY")

echo "=== SESSIONS IN DATABASE ==="
echo "$SESSIONS" | jq -r '.sessions[] | "Session: \(.sessionId)\n  Start: \(.startTime)\n  Location: \(.location)\n  Device: \(.deviceType)\n  Page Views: \(.pageViews)\n  Has Article: \(.hasArticleView)\n  Has Chat: \(.hasChat)\n  Has Donation: \(.hasDonation)\n"'

echo ""
echo "=== SESSION IDS ONLY ==="
echo "$SESSIONS" | jq -r '.sessions[].sessionId'

echo ""
echo "=== SESSIONS WITH ARTICLE VIEWS ==="
echo "$SESSIONS" | jq -r '.sessions[] | select(.hasArticleView == true) | "Session: \(.sessionId) - Started: \(.startTime)"'

echo ""
echo "=== TOTAL COUNT ==="
echo "Total sessions: $(echo "$SESSIONS" | jq -r '.total')"
echo "Sessions returned: $(echo "$SESSIONS" | jq -r '.sessions | length')"

echo ""
echo "=========================================="
echo "If you don't see your session above, it means:"
echo "1. Your browser is using a different sessionId"
echo "2. The events aren't being sent from your browser"
echo "3. Check browser console for errors"
echo "=========================================="