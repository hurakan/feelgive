#!/bin/bash

# Test script for news API endpoints
BASE_URL="http://localhost:3001/api/v1"

echo "=== Testing News API Endpoints ==="
echo ""

echo "1. Getting API configurations..."
curl -s "$BASE_URL/news/configs" | jq '.'
echo ""

echo "2. Getting usage statistics..."
curl -s "$BASE_URL/news/usage" | jq '.'
echo ""

echo "3. Fetching news from all sources..."
curl -s -X POST "$BASE_URL/news/fetch" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["earthquake", "flood", "disaster"],
    "limit": 5
  }' | jq '.'
echo ""

echo "=== Test Complete ==="