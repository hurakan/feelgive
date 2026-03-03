#!/bin/bash

# Test script for analytics aggregation endpoints
# This script tests the improved MongoDB aggregation pipelines

BASE_URL="http://localhost:3001/api/v1/analytics"
ADMIN_KEY="dev-admin-key-12345"

echo "=== Testing Analytics Aggregation Endpoints ==="
echo ""

# Test 1: Summary endpoint with default range (7d)
echo "1. Testing GET /summary (default 7d range)..."
curl -s -X GET "$BASE_URL/summary" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" | jq '.'
echo ""

# Test 2: Summary endpoint with 30d range
echo "2. Testing GET /summary (30d range)..."
curl -s -X GET "$BASE_URL/summary?range=30d" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" | jq '.'
echo ""

# Test 3: Timeseries - page_views
echo "3. Testing GET /timeseries (page_views metric)..."
curl -s -X GET "$BASE_URL/timeseries?metric=page_views&range=7d" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" | jq '.'
echo ""

# Test 4: Timeseries - sessions
echo "4. Testing GET /timeseries (sessions metric)..."
curl -s -X GET "$BASE_URL/timeseries?metric=sessions&range=7d" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" | jq '.'
echo ""

# Test 5: Timeseries - active_users
echo "5. Testing GET /timeseries (active_users metric)..."
curl -s -X GET "$BASE_URL/timeseries?metric=active_users&range=7d" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" | jq '.'
echo ""

# Test 6: Funnels endpoint
echo "6. Testing GET /funnels (default 30d range)..."
curl -s -X GET "$BASE_URL/funnels" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" | jq '.'
echo ""

# Test 7: Funnels endpoint with 7d range
echo "7. Testing GET /funnels (7d range)..."
curl -s -X GET "$BASE_URL/funnels?range=7d" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" | jq '.'
echo ""

echo "=== All tests completed ==="