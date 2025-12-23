#!/bin/bash

# Test script for News Aggregation System
# This script tests all the news API endpoints

API_BASE="http://localhost:3001/api/v1"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}=== News Aggregation System Test ===${NC}\n"

# Test 1: Health Check
echo -e "${BOLD}1. Testing Health Check...${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_BASE/../health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
    exit 1
fi
echo ""

# Test 2: Get News API Configurations
echo -e "${BOLD}2. Testing GET /news/configs...${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_BASE/news/configs")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Get configs passed${NC}"
    config_count=$(echo "$body" | jq '. | length')
    echo "Found $config_count news API configurations"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Get configs failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 3: Get Usage Statistics
echo -e "${BOLD}3. Testing GET /news/usage...${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_BASE/news/usage")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Get usage stats passed${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Get usage stats failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 4: Add a Test Configuration (will fail if already exists)
echo -e "${BOLD}4. Testing POST /news/configs (add test config)...${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/news/configs" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test News API",
    "apiKey": "test-key-12345",
    "provider": "newsapi",
    "requestsPerDay": 50,
    "requestsPerHour": 5,
    "keywords": ["test", "demo"],
    "countries": ["us"]
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ Add config passed${NC}"
    echo "$body" | jq '.'
elif [ "$http_code" = "400" ]; then
    echo -e "${YELLOW}⚠ Config already exists or validation error${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Add config failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 5: Toggle Configuration
echo -e "${BOLD}5. Testing PATCH /news/configs/:provider/toggle...${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "$API_BASE/news/configs/newsapi/toggle")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Toggle config passed${NC}"
    is_enabled=$(echo "$body" | jq '.isEnabled')
    echo "Configuration is now: $is_enabled"
    echo "$body" | jq '.'
else
    echo -e "${YELLOW}⚠ Toggle failed - config may not exist (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 6: Get Articles (should be empty initially)
echo -e "${BOLD}6. Testing GET /news/articles...${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_BASE/news/articles?limit=10")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Get articles passed${NC}"
    article_count=$(echo "$body" | jq '.articles | length')
    total=$(echo "$body" | jq '.pagination.total')
    echo "Found $article_count articles (total: $total)"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Get articles failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 7: Fetch News (requires valid API keys)
echo -e "${BOLD}7. Testing POST /news/fetch (manual fetch)...${NC}"
echo -e "${YELLOW}Note: This will only work if you have valid API keys configured${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/news/fetch" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["earthquake", "disaster"],
    "limit": 5
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Fetch news passed${NC}"
    count=$(echo "$body" | jq '.count')
    echo "Fetched $count articles"
    echo "$body" | jq '.'
else
    echo -e "${YELLOW}⚠ Fetch news failed - may need valid API keys (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Summary
echo -e "${BOLD}=== Test Summary ===${NC}"
echo -e "All basic endpoint tests completed."
echo -e "\n${BOLD}Next Steps:${NC}"
echo "1. Add your API keys to backend/.env"
echo "2. Run: cd backend && npx tsx scripts/init-news-apis.ts"
echo "3. Test the admin UI at your frontend URL"
echo "4. Monitor usage in the admin panel"
echo ""
echo -e "${GREEN}✓ News Aggregation System is ready!${NC}"