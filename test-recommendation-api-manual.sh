#!/bin/bash

echo "=== Testing Recommendation API Manually ==="
echo ""

# Test 1: Nigeria article
echo "1. Testing Nigeria article..."
curl -s -X POST "http://localhost:3001/api/v1/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nigeria church attack",
    "description": "Armed attackers kidnapped over 150 people from a church in Nigeria",
    "entities": {
      "geography": {
        "country": "Nigeria",
        "region": "West Africa"
      },
      "disasterType": "conflict"
    },
    "causes": ["humanitarian"],
    "keywords": ["nigeria", "attack", "humanitarian"]
  }' | jq '.nonprofits | length'

echo ""
echo "2. Testing Gaza article..."
curl -s -X POST "http://localhost:3001/api/v1/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gaza humanitarian crisis",
    "description": "Humanitarian crisis in Gaza requires immediate aid",
    "entities": {
      "geography": {
        "country": "Palestine",
        "region": "Gaza"
      },
      "disasterType": "conflict"
    },
    "causes": ["humanitarian"],
    "keywords": ["gaza", "humanitarian", "crisis"]
  }' | jq '.nonprofits | length'

echo ""
echo "3. Testing California wildfire..."
curl -s -X POST "http://localhost:3001/api/v1/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "California wildfire",
    "description": "Wildfire in Los Angeles forces evacuations",
    "entities": {
      "geography": {
        "country": "United States",
        "region": "California",
        "city": "Los Angeles"
      },
      "disasterType": "wildfire"
    },
    "causes": ["disaster-relief"],
    "keywords": ["california", "wildfire", "disaster"]
  }' | jq '.nonprofits | length'

echo ""
echo "Done!"