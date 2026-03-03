#!/bin/bash

# Test script for Session Explorer endpoints
# This script tests the new /sessions and /sessions/:sessionId/events endpoints

BASE_URL="http://localhost:3001/api/v1"
ADMIN_KEY="dev-admin-key-12345"

echo "=========================================="
echo "Testing Session Explorer Endpoints"
echo "=========================================="
echo ""

# Test 1: List sessions (default pagination)
echo "Test 1: GET /analytics/sessions (default pagination)"
echo "----------------------------------------------"
curl -s -X GET \
  "${BASE_URL}/analytics/sessions" \
  -H "x-admin-key: ${ADMIN_KEY}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 2: List sessions with custom pagination
echo "Test 2: GET /analytics/sessions?limit=5&offset=0"
echo "----------------------------------------------"
curl -s -X GET \
  "${BASE_URL}/analytics/sessions?limit=5&offset=0" \
  -H "x-admin-key: ${ADMIN_KEY}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 3: Get a specific session's events (we'll try to extract a sessionId from the list)
echo "Test 3: GET /analytics/sessions/:sessionId/events"
echo "----------------------------------------------"

# First, get a session ID from the list
SESSION_ID=$(curl -s -X GET \
  "${BASE_URL}/analytics/sessions?limit=1" \
  -H "x-admin-key: ${ADMIN_KEY}" \
  -H "Content-Type: application/json" | jq -r '.sessions[0].sessionId // empty')

if [ -z "$SESSION_ID" ]; then
  echo "No sessions found in database. Skipping session events test."
  echo "Note: This is expected if no analytics data has been collected yet."
else
  echo "Testing with sessionId: $SESSION_ID"
  curl -s -X GET \
    "${BASE_URL}/analytics/sessions/${SESSION_ID}/events" \
    -H "x-admin-key: ${ADMIN_KEY}" \
    -H "Content-Type: application/json" | jq '.'
fi
echo ""
echo ""

# Test 4: Test with invalid session ID (should return 404)
echo "Test 4: GET /analytics/sessions/invalid-session-id/events (should return 404)"
echo "----------------------------------------------"
curl -s -X GET \
  "${BASE_URL}/analytics/sessions/invalid-session-id-12345/events" \
  -H "x-admin-key: ${ADMIN_KEY}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 5: Test without admin authentication (should return 403)
echo "Test 5: GET /analytics/sessions (without admin auth - should return 403)"
echo "----------------------------------------------"
curl -s -X GET \
  "${BASE_URL}/analytics/sessions" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 6: Test pagination validation (invalid limit)
echo "Test 6: GET /analytics/sessions?limit=200 (should return 400 - limit too high)"
echo "----------------------------------------------"
curl -s -X GET \
  "${BASE_URL}/analytics/sessions?limit=200" \
  -H "x-admin-key: ${ADMIN_KEY}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Session Explorer Tests Complete"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Test 1: List sessions with default pagination"
echo "- Test 2: List sessions with custom pagination"
echo "- Test 3: Get events for a specific session"
echo "- Test 4: Test 404 for invalid session ID"
echo "- Test 5: Test 403 for missing admin auth"
echo "- Test 6: Test 400 for invalid pagination parameters"
echo ""
echo "Note: If no sessions are found, this is expected if no analytics"
echo "data has been collected yet. The endpoints will return empty arrays."