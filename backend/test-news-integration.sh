#!/bin/bash

# News API Integration Test Script
# Tests all endpoints and verifies the system is working

API_BASE="http://localhost:3001/api/v1"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}🧪 News API Integration Test${NC}\n"

# Test 1: Check if backend is running
echo -e "${BOLD}Test 1: Backend Health Check${NC}"
if curl -s -f "${API_BASE}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}\n"
else
    echo -e "${RED}✗ Backend is not running. Start with: cd backend && npm run dev${NC}\n"
    exit 1
fi

# Test 2: List configurations
echo -e "${BOLD}Test 2: List News API Configurations${NC}"
CONFIGS=$(curl -s "${API_BASE}/news/configs")
CONFIG_COUNT=$(echo "$CONFIGS" | jq '. | length' 2>/dev/null || echo "0")
echo "Found $CONFIG_COUNT configured news sources"
if [ "$CONFIG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Configurations exist${NC}"
    echo "$CONFIGS" | jq -r '.[] | "  - \(.name) (\(.provider)) - Enabled: \(.isEnabled)"' 2>/dev/null
else
    echo -e "${YELLOW}⚠ No configurations found. Add one via the admin UI or API${NC}"
fi
echo ""

# Test 3: Get usage statistics
echo -e "${BOLD}Test 3: Get Usage Statistics${NC}"
USAGE=$(curl -s "${API_BASE}/news/usage")
echo "$USAGE" | jq -r '.[] | "  \(.name): \(.dailyUsage)/\(.dailyLimit) requests today (\(.dailyRemaining) remaining)"' 2>/dev/null
echo -e "${GREEN}✓ Usage stats retrieved${NC}\n"

# Test 4: List stored articles
echo -e "${BOLD}Test 4: List Stored Articles${NC}"
ARTICLES=$(curl -s "${API_BASE}/news/articles?limit=5")
ARTICLE_COUNT=$(echo "$ARTICLES" | jq '.pagination.total' 2>/dev/null || echo "0")
echo "Total articles in database: $ARTICLE_COUNT"
if [ "$ARTICLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Articles found in database${NC}"
    echo "Recent articles:"
    echo "$ARTICLES" | jq -r '.articles[] | "  - \(.title) (\(.source))"' 2>/dev/null | head -5
else
    echo -e "${YELLOW}⚠ No articles in database yet. Fetch some using the 'Fetch News Now' button${NC}"
fi
echo ""

# Test 5: Test fetch endpoint (only if configs exist)
if [ "$CONFIG_COUNT" -gt 0 ]; then
    echo -e "${BOLD}Test 5: Test News Fetch (Manual)${NC}"
    echo -e "${YELLOW}⚠ This will use API quota. Press Enter to continue or Ctrl+C to skip...${NC}"
    read -r
    
    FETCH_RESULT=$(curl -s -X POST "${API_BASE}/news/fetch" \
        -H "Content-Type: application/json" \
        -d '{"limit": 5}')
    
    FETCH_COUNT=$(echo "$FETCH_RESULT" | jq '.count' 2>/dev/null || echo "0")
    
    if [ "$FETCH_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Successfully fetched $FETCH_COUNT articles${NC}"
        echo "Sample articles:"
        echo "$FETCH_RESULT" | jq -r '.articles[] | "  - \(.title)"' 2>/dev/null | head -3
    else
        echo -e "${RED}✗ No articles fetched. Check:${NC}"
        echo "  - API keys are valid"
        echo "  - Sources are enabled"
        echo "  - Rate limits not exceeded"
        echo "  - Keywords match current news"
    fi
    echo ""
fi

# Test 6: Check admin UI component exists
echo -e "${BOLD}Test 6: Check Admin UI Component${NC}"
if [ -f "frontend/src/components/news-api-admin.tsx" ]; then
    echo -e "${GREEN}✓ NewsAPIAdmin component exists${NC}"
    echo "  Location: frontend/src/components/news-api-admin.tsx"
else
    echo -e "${RED}✗ NewsAPIAdmin component not found${NC}"
fi
echo ""

# Summary
echo -e "${BOLD}📊 Test Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Configured Sources: $CONFIG_COUNT"
echo "Stored Articles: $ARTICLE_COUNT"
echo ""
echo -e "${BOLD}Next Steps:${NC}"
if [ "$CONFIG_COUNT" -eq 0 ]; then
    echo "1. Get a free API key from:"
    echo "   - Guardian: https://open-platform.theguardian.com/access/"
    echo "   - Currents: https://currentsapi.services/en/register"
    echo "   - NewsData: https://newsdata.io/register"
    echo "2. Add via admin UI or API:"
    echo "   curl -X POST ${API_BASE}/news/configs \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"name\":\"Guardian Primary\",\"apiKey\":\"YOUR_KEY\",\"provider\":\"guardian\",\"requestsPerDay\":5000}'"
else
    echo "1. Access admin UI in your frontend"
    echo "2. Click 'Fetch News Now' to get articles"
    echo "3. Monitor usage in the dashboard"
    echo "4. Set up automation (see NEWS_API_TESTING_GUIDE.md)"
fi
echo ""
echo -e "${BOLD}📖 Full Documentation:${NC} NEWS_API_TESTING_GUIDE.md"