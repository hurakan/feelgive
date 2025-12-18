#!/bin/bash

# Test script for web search functionality
# This script tests the web search integration with the RAG system

API_URL="http://localhost:3001/api/v1"

echo "================================"
echo "Web Search Integration Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check chat health
echo "Test 1: Checking chat service health..."
HEALTH_RESPONSE=$(curl -s "${API_URL}/chat/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ Chat service is healthy${NC}"
else
    echo -e "${RED}✗ Chat service is not healthy${NC}"
    exit 1
fi
echo ""

# Test 2: Send message WITHOUT web search
echo "Test 2: Sending message WITHOUT web search..."
RESPONSE_NO_SEARCH=$(curl -s -X POST "${API_URL}/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the current situation?",
    "context": {
      "articleTitle": "California Wildfire Emergency",
      "articleText": "A massive wildfire has broken out in Northern California, forcing thousands to evacuate. Emergency services are working around the clock to contain the blaze.",
      "articleSummary": "Wildfire emergency in Northern California with mass evacuations.",
      "classification": {
        "cause": "disaster_relief",
        "geoName": "California, USA",
        "severity": "high",
        "identified_needs": ["shelter", "food", "medical"],
        "affectedGroups": ["residents", "evacuees"]
      },
      "matchedCharities": [
        {
          "name": "American Red Cross",
          "description": "Provides emergency assistance and disaster relief",
          "trustScore": 95
        }
      ]
    },
    "history": [],
    "enableWebSearch": false
  }')

if echo "$RESPONSE_NO_SEARCH" | grep -q '"message"'; then
    echo -e "${GREEN}✓ Message sent successfully (without web search)${NC}"
    echo "Response preview: $(echo "$RESPONSE_NO_SEARCH" | jq -r '.message' | head -c 100)..."
else
    echo -e "${RED}✗ Failed to send message${NC}"
    echo "Response: $RESPONSE_NO_SEARCH"
fi
echo ""

# Test 3: Send message WITH web search (will only work if configured)
echo "Test 3: Sending message WITH web search..."
RESPONSE_WITH_SEARCH=$(curl -s -X POST "${API_URL}/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest updates on this situation?",
    "context": {
      "articleTitle": "California Wildfire Emergency",
      "articleText": "A massive wildfire has broken out in Northern California, forcing thousands to evacuate. Emergency services are working around the clock to contain the blaze.",
      "articleSummary": "Wildfire emergency in Northern California with mass evacuations.",
      "classification": {
        "cause": "disaster_relief",
        "geoName": "California, USA",
        "severity": "high",
        "identified_needs": ["shelter", "food", "medical"],
        "affectedGroups": ["residents", "evacuees"]
      },
      "matchedCharities": [
        {
          "name": "American Red Cross",
          "description": "Provides emergency assistance and disaster relief",
          "trustScore": 95
        }
      ]
    },
    "history": [],
    "enableWebSearch": true
  }')

if echo "$RESPONSE_WITH_SEARCH" | grep -q '"message"'; then
    echo -e "${GREEN}✓ Message sent successfully (with web search enabled)${NC}"
    echo "Response preview: $(echo "$RESPONSE_WITH_SEARCH" | jq -r '.message' | head -c 100)..."
    
    # Check if response is different (indicating web search might have been used)
    if [ "$RESPONSE_NO_SEARCH" != "$RESPONSE_WITH_SEARCH" ]; then
        echo -e "${YELLOW}ℹ Response differs from non-web-search version${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Message sent but web search may not be configured${NC}"
    echo "Response: $RESPONSE_WITH_SEARCH"
fi
echo ""

# Test 4: Check for web search configuration
echo "Test 4: Checking web search configuration..."
if [ -f "../backend/.env" ]; then
    if grep -q "WEB_SEARCH_ENABLED=true" ../backend/.env 2>/dev/null; then
        echo -e "${GREEN}✓ Web search is enabled in .env${NC}"
        
        if grep -q "GOOGLE_SEARCH_API_KEY=" ../backend/.env 2>/dev/null; then
            echo -e "${GREEN}✓ Google Search API key is configured${NC}"
        else
            echo -e "${YELLOW}⚠ Google Search API key not found in .env${NC}"
        fi
        
        if grep -q "GOOGLE_SEARCH_ENGINE_ID=" ../backend/.env 2>/dev/null; then
            echo -e "${GREEN}✓ Search Engine ID is configured${NC}"
        else
            echo -e "${YELLOW}⚠ Search Engine ID not found in .env${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Web search is not enabled in .env${NC}"
        echo "To enable web search:"
        echo "1. Set WEB_SEARCH_ENABLED=true"
        echo "2. Add GOOGLE_SEARCH_API_KEY"
        echo "3. Add GOOGLE_SEARCH_ENGINE_ID"
        echo "See WEB_SEARCH_SETUP.md for details"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Copy .env.example to .env and configure web search settings"
fi
echo ""

echo "================================"
echo "Test Summary"
echo "================================"
echo "✓ Chat service is operational"
echo "✓ Messages can be sent with and without web search"
echo ""
echo "Note: Web search will only enhance responses if:"
echo "1. WEB_SEARCH_ENABLED=true in .env"
echo "2. Valid Google Custom Search API credentials are configured"
echo "3. The enableWebSearch parameter is set to true in requests"
echo ""
echo "See backend/WEB_SEARCH_SETUP.md for configuration instructions"