#!/bin/bash

echo "=========================================="
echo "LIVE TRACKING VERIFICATION TEST"
echo "=========================================="
echo ""
echo "This test verifies that NEW user activities are being tracked."
echo ""
echo "INSTRUCTIONS:"
echo "1. Open the main app in your browser (http://localhost:5173)"
echo "2. Click on a news article in the feed"
echo "3. Wait 10 seconds for events to flush"
echo "4. This script will check if new sessions were created"
echo ""
echo "Press Enter when you're ready to check..."
read

BASE_URL="http://localhost:3001/api/v1"
ADMIN_KEY="your-secret-admin-key-here"

echo "Fetching current session count..."
BEFORE=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=100&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY" | jq -r '.total // 0')

echo "Current sessions in database: $BEFORE"
echo ""
echo "Now:"
echo "1. Go to your browser"
echo "2. Click on a news article"
echo "3. Wait 10 seconds"
echo "4. Press Enter here to check again..."
read

echo ""
echo "Checking for new sessions..."
AFTER=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=100&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY" | jq -r '.total // 0')

echo "Sessions after your activity: $AFTER"
echo ""

if [ "$AFTER" -gt "$BEFORE" ]; then
  NEW_COUNT=$((AFTER - BEFORE))
  echo "✅ SUCCESS! $NEW_COUNT new session(s) detected!"
  echo ""
  echo "Showing the most recent session:"
  curl -s -X GET "$BASE_URL/analytics/sessions?limit=1&offset=0" \
    -H "X-Admin-Key: $ADMIN_KEY" | jq '.sessions[0]'
else
  echo "❌ NO NEW SESSIONS DETECTED"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check browser console for '[Analytics] Tracker initialized' message"
  echo "2. Check browser console for '[Analytics] Sent X events' messages"
  echo "3. Check backend terminal for 'POST /api/v1/analytics/ingest 202' logs"
  echo "4. Make sure you clicked an article and waited 10 seconds"
fi

echo ""
echo "=========================================="