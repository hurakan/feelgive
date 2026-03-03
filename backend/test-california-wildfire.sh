#!/bin/bash

echo "=== Testing California Wildfire Geographic Filtering ==="
echo ""
echo "This test verifies geographic matching with a well-populated region"
echo ""

BASE_URL="http://localhost:3001/api/v1"

echo "📰 Testing with California wildfire article..."
echo ""

curl -s -X POST "$BASE_URL/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wildfire forces evacuations in Southern California",
    "description": "A fast-moving wildfire in Los Angeles County has forced thousands to evacuate as firefighters battle the blaze.",
    "entities": {
      "geography": {
        "country": "United States",
        "region": "California",
        "city": "Los Angeles"
      },
      "disasterType": "wildfire"
    },
    "causes": ["disaster-relief", "emergency-response"],
    "keywords": ["wildfire", "evacuation", "California", "Los Angeles", "firefighters"]
  }' | jq '.nonprofits[] | {name: .name, location: .locationAddress, score: .score}'

echo ""
echo "✅ Test complete!"
echo ""
echo "Expected behavior:"
echo "  ✓ Should prioritize California-based organizations"
echo "  ✓ Should show geographic match levels (Local/National/Regional/Global)"
echo "  ✓ Should include explainability bullets"
echo ""