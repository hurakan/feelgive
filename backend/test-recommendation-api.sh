#!/bin/bash

# Test the recommendation API endpoint

echo "🧪 Testing Recommendation API Endpoint"
echo "========================================"
echo ""

# Test 1: Turkey Earthquake
echo "📍 Test 1: Turkey Earthquake"
echo "----------------------------"
curl -X POST http://localhost:3001/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Massive 7.8 Earthquake Strikes Turkey and Syria",
    "description": "A devastating earthquake has struck southern Turkey and northern Syria, causing widespread destruction.",
    "entities": {
      "geography": {
        "country": "Turkey",
        "region": "Southern Turkey"
      },
      "disasterType": "earthquake",
      "affectedGroup": "families"
    },
    "causes": ["disaster-relief", "humanitarian-aid"],
    "keywords": ["earthquake", "Turkey", "Syria", "disaster", "emergency"],
    "debug": true,
    "topN": 5
  }' | jq '.'

echo ""
echo ""

# Test 2: California Wildfire
echo "📍 Test 2: California Wildfire"
echo "-------------------------------"
curl -X POST http://localhost:3001/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wildfire Forces Evacuations in Northern California",
    "description": "A rapidly spreading wildfire has forced thousands to evacuate.",
    "entities": {
      "geography": {
        "country": "United States",
        "region": "California"
      },
      "disasterType": "wildfire"
    },
    "causes": ["disaster-relief"],
    "keywords": ["wildfire", "California", "evacuation"],
    "debug": true,
    "topN": 5
  }' | jq '.'

echo ""
echo ""

# Test 3: Cache Stats
echo "📊 Test 3: Cache Statistics"
echo "---------------------------"
curl -X GET http://localhost:3001/api/v1/recommendations/cache/stats | jq '.'

echo ""
echo ""
echo "✅ Tests complete!"