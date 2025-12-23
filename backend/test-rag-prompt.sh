#!/bin/bash

# Test the RAG system with a question that requires general knowledge

API_URL="http://localhost:3001/api/v1"

echo "Testing RAG system with general knowledge question..."
echo ""

# Test 1: Question requiring general knowledge (without web search)
echo "Test 1: Asking about general humanitarian aid (web search OFF)"
curl -X POST "$API_URL/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are some general best practices for humanitarian aid in disaster situations?",
    "context": {
      "articleTitle": "Earthquake Strikes Region",
      "articleText": "A major earthquake has struck the region, causing widespread damage and displacement.",
      "articleSummary": "Earthquake causes damage and displacement",
      "classification": {
        "cause": "disaster_relief",
        "geoName": "Test Region",
        "severity": "high",
        "identified_needs": ["shelter", "medical aid"],
        "affectedGroups": ["displaced families"]
      },
      "matchedCharities": [
        {
          "name": "Test Relief Org",
          "description": "Provides emergency relief",
          "trustScore": 95
        }
      ]
    },
    "history": [],
    "enableWebSearch": false
  }' | jq -r '.message'

echo ""
echo "---"
echo ""

# Test 2: Question about information not in article (without web search)
echo "Test 2: Asking for latest updates (web search OFF - should suggest enabling it)"
curl -X POST "$API_URL/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest updates on this crisis?",
    "context": {
      "articleTitle": "Earthquake Strikes Region",
      "articleText": "A major earthquake has struck the region, causing widespread damage and displacement.",
      "articleSummary": "Earthquake causes damage and displacement",
      "classification": {
        "cause": "disaster_relief",
        "geoName": "Test Region",
        "severity": "high",
        "identified_needs": ["shelter", "medical aid"],
        "affectedGroups": ["displaced families"]
      },
      "matchedCharities": [
        {
          "name": "Test Relief Org",
          "description": "Provides emergency relief",
          "trustScore": 95
        }
      ]
    },
    "history": [],
    "enableWebSearch": false
  }' | jq -r '.message'

echo ""
echo "---"
echo ""
echo "Tests complete!"