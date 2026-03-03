#!/bin/bash

# Test Analytics API - Ingest Endpoint
# This script tests the analytics ingest endpoint to verify it's working correctly

API_URL="${API_URL:-http://localhost:3001}"
API_VERSION="${API_VERSION:-v1}"
ENDPOINT="${API_URL}/api/${API_VERSION}/analytics/ingest"

echo "=========================================="
echo "Testing Analytics Ingest Endpoint"
echo "=========================================="
echo "Endpoint: ${ENDPOINT}"
echo ""

# Test 1: Valid batch of events
echo "Test 1: Sending valid batch of analytics events..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventType": "page_view",
        "eventName": "Home Page",
        "category": "navigation",
        "url": "/",
        "sessionId": "test-session-123",
        "timestamp": "2024-01-25T12:00:00Z",
        "metadata": {
          "source": "test"
        }
      },
      {
        "eventType": "donation_click",
        "eventName": "Charity A",
        "category": "conversion",
        "url": "/donate",
        "referrer": "/",
        "sessionId": "test-session-123",
        "timestamp": "2024-01-25T12:01:00Z"
      }
    ],
    "deviceInfo": {
      "deviceType": "desktop",
      "browser": "Chrome",
      "os": "macOS",
      "country": "US"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response: ${BODY}"

if [ "$HTTP_CODE" = "202" ]; then
  echo "✅ Test 1 PASSED: Events accepted successfully"
else
  echo "❌ Test 1 FAILED: Expected 202, got ${HTTP_CODE}"
fi

echo ""
echo "=========================================="

# Test 2: Invalid request (missing required fields)
echo "Test 2: Sending invalid request (missing sessionId)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventType": "page_view",
        "url": "/"
      }
    ]
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response: ${BODY}"

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Test 2 PASSED: Invalid request rejected correctly"
else
  echo "❌ Test 2 FAILED: Expected 400, got ${HTTP_CODE}"
fi

echo ""
echo "=========================================="

# Test 3: Empty events array
echo "Test 3: Sending empty events array..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "events": []
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response: ${BODY}"

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Test 3 PASSED: Empty array rejected correctly"
else
  echo "❌ Test 3 FAILED: Expected 400, got ${HTTP_CODE}"
fi

echo ""
echo "=========================================="
echo "Analytics API Tests Complete"
echo "=========================================="