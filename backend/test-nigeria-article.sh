#!/bin/bash

echo "=== Testing Nigeria Article Geographic Filtering ==="
echo ""
echo "This test verifies that a Nigeria article does NOT recommend Thailand organizations"
echo ""

BASE_URL="http://localhost:3001/api/v1"

echo "📰 Testing with Nigeria church attack article..."
echo ""

# Simulate the Nigeria article from AP News
curl -s -X POST "$BASE_URL/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gunmen abduct worshippers from church in Nigeria",
    "description": "Gunmen have abducted worshippers from a church in Nigeria'\''s north-central Kogi state, police said Monday. The attack happened Sunday morning in Okedayo Quarters in Adavi local government area.",
    "entities": {
      "geography": {
        "country": "Nigeria",
        "region": "Kogi"
      },
      "disasterType": "conflict"
    },
    "causes": ["humanitarian-relief", "conflict-resolution"],
    "keywords": ["gunmen", "church", "abduction", "Nigeria", "Kogi"]
  }' | jq '.'

echo ""
echo "✅ Test complete!"
echo ""
echo "Expected behavior:"
echo "  ✓ Should recommend Nigeria-based organizations"
echo "  ✓ Should recommend West Africa regional organizations"
echo "  ✓ Should NOT recommend Thailand organizations"
echo "  ✓ Should limit global responders to max 2"
echo ""
echo "Check the results above to verify geographic filtering is working correctly."