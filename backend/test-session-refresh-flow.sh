#!/bin/bash

# End-to-End Session Refresh Flow Test
# Tests the complete flow: article open -> session creation -> session refresh

# Note: We don't use 'set -e' because we want to see all test results

echo "=========================================="
echo "Session Refresh Flow E2E Test"
echo "=========================================="
echo ""

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001/api/v1}"
ADMIN_KEY="${ADMIN_KEY:-dev-admin-key-12345}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Generate unique session ID
SESSION_ID="e2e-test-$(date +%s)"
USER_ID="e2e-user-$(date +%s)"
ARTICLE_TITLE="E2E Test Article: Climate Crisis $(date +%s)"
ARTICLE_URL="https://example.com/e2e-test-article-$(date +%s)"

echo "Test Configuration:"
echo "  Session ID: $SESSION_ID"
echo "  User ID: $USER_ID"
echo "  Article: $ARTICLE_TITLE"
echo ""

# Step 1: Get baseline session count
echo "Step 1: Getting baseline session count..."
BASELINE_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=1&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY")

BASELINE_TOTAL=$(echo "$BASELINE_RESPONSE" | jq -r '.total // 0')
echo "  Baseline total sessions: $BASELINE_TOTAL"
echo ""

# Step 2: Simulate user opening an article
echo "Step 2: Simulating user opening article..."

INGEST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/analytics/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [
      {
        \"eventType\": \"app_open\",
        \"eventName\": \"E2E Test App Launch\",
        \"category\": \"lifecycle\",
        \"metadata\": {
          \"source\": \"e2e_test\",
          \"testId\": \"$SESSION_ID\"
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
      },
      {
        \"eventType\": \"page_view\",
        \"eventName\": \"Home Page\",
        \"category\": \"navigation\",
        \"metadata\": {
          \"path\": \"/\",
          \"testId\": \"$SESSION_ID\"
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.100Z)\"
      },
      {
        \"eventType\": \"article_opened\",
        \"eventName\": \"$ARTICLE_TITLE\",
        \"category\": \"news\",
        \"metadata\": {
          \"articleId\": \"e2e-article-$(date +%s)\",
          \"articleUrl\": \"$ARTICLE_URL\",
          \"source\": \"E2E Test News\",
          \"eventTag\": \"crisis\",
          \"testId\": \"$SESSION_ID\"
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.500Z)\"
      }
    ],
    \"deviceInfo\": {
      \"deviceType\": \"desktop\",
      \"browser\": \"Chrome\",
      \"os\": \"macOS\",
      \"country\": \"United States\",
      \"city\": \"Test City\",
      \"timezone\": \"America/New_York\"
    }
  }")

HTTP_CODE=$(echo "$INGEST_RESPONSE" | tail -n1)
INGEST_BODY=$(echo "$INGEST_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 202 ]; then
    print_result 0 "Events ingested successfully (HTTP $HTTP_CODE)"
else
    print_result 1 "Event ingestion failed (HTTP $HTTP_CODE)"
    echo "Response: $INGEST_BODY"
    exit 1
fi

echo ""
echo "Step 3: Waiting for data processing (2 seconds)..."
sleep 2
echo ""

# Step 4: Fetch sessions WITHOUT cache busting (simulating initial load)
echo "Step 4: Fetching sessions without cache busting (initial load)..."

INITIAL_FETCH=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=20&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY")

INITIAL_TOTAL=$(echo "$INITIAL_FETCH" | jq -r '.total // 0')
INITIAL_SESSION_EXISTS=$(echo "$INITIAL_FETCH" | jq -r ".sessions[] | select(.sessionId == \"$SESSION_ID\") | .sessionId")

echo "  Total sessions: $INITIAL_TOTAL (baseline: $BASELINE_TOTAL)"

if [ "$INITIAL_TOTAL" -gt "$BASELINE_TOTAL" ]; then
    print_result 0 "Session count increased"
else
    print_result 1 "Session count did not increase"
fi

if [ "$INITIAL_SESSION_EXISTS" == "$SESSION_ID" ]; then
    print_result 0 "New session found in initial fetch"
else
    print_result 1 "New session NOT found in initial fetch"
fi

echo ""

# Step 5: Fetch sessions WITH cache busting (simulating refresh button click)
echo "Step 5: Fetching sessions with cache busting (refresh button)..."

REFRESH_FETCH=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=20&offset=0&_t=$(date +%s%3N)" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -H "Cache-Control: no-cache")

REFRESH_TOTAL=$(echo "$REFRESH_FETCH" | jq -r '.total // 0')
REFRESH_SESSION_EXISTS=$(echo "$REFRESH_FETCH" | jq -r ".sessions[] | select(.sessionId == \"$SESSION_ID\") | .sessionId")

echo "  Total sessions after refresh: $REFRESH_TOTAL"

if [ "$REFRESH_SESSION_EXISTS" == "$SESSION_ID" ]; then
    print_result 0 "New session found after refresh"
else
    print_result 1 "New session NOT found after refresh"
fi

echo ""

# Step 6: Verify session details
echo "Step 6: Verifying session details..."

SESSION_DETAILS=$(curl -s -X GET "$BASE_URL/analytics/sessions/$SESSION_ID/events" \
  -H "X-Admin-Key: $ADMIN_KEY")

if [ $? -ne 0 ]; then
    print_result 1 "Failed to fetch session details"
else
    EVENT_COUNT=$(echo "$SESSION_DETAILS" | jq -r '.totalEvents // 0')
    HAS_ARTICLE=$(echo "$SESSION_DETAILS" | jq -r '.events[] | select(.eventType == "article_opened") | .eventType' | head -n1)
    ARTICLE_URL_IN_METADATA=$(echo "$SESSION_DETAILS" | jq -r '.events[] | select(.eventType == "article_opened") | .metadata.articleUrl' | head -n1)
    ARTICLE_TITLE_IN_EVENT=$(echo "$SESSION_DETAILS" | jq -r '.events[] | select(.eventType == "article_opened") | .eventName' | head -n1)
    
    if [ "$EVENT_COUNT" -eq 3 ]; then
        print_result 0 "All 3 events recorded (app_open, page_view, article_opened)"
    else
        print_result 1 "Expected 3 events, found $EVENT_COUNT"
    fi
    
    if [ "$HAS_ARTICLE" == "article_opened" ]; then
        print_result 0 "article_opened event found"
    else
        print_result 1 "article_opened event missing"
    fi
    
    if [ "$ARTICLE_URL_IN_METADATA" == "$ARTICLE_URL" ]; then
        print_result 0 "Article URL correctly stored in metadata"
    else
        print_result 1 "Article URL missing or incorrect (expected: $ARTICLE_URL, got: $ARTICLE_URL_IN_METADATA)"
    fi
    
    if [ "$ARTICLE_TITLE_IN_EVENT" == "$ARTICLE_TITLE" ]; then
        print_result 0 "Article title correctly stored"
    else
        print_result 1 "Article title missing or incorrect"
    fi
fi

echo ""

# Step 7: Verify session has article view flag
echo "Step 7: Verifying session activity flags..."

SESSION_IN_LIST=$(echo "$REFRESH_FETCH" | jq -r ".sessions[] | select(.sessionId == \"$SESSION_ID\")")
HAS_ARTICLE_VIEW=$(echo "$SESSION_IN_LIST" | jq -r '.hasArticleView // false')

if [ "$HAS_ARTICLE_VIEW" == "true" ]; then
    print_result 0 "Session correctly flagged with hasArticleView"
else
    print_result 1 "Session missing hasArticleView flag"
fi

echo ""

# Final Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All E2E tests passed!${NC}"
    echo ""
    echo "Session Refresh Flow Verified:"
    echo "  ✓ Article opened and events tracked"
    echo "  ✓ Session created in database"
    echo "  ✓ Session appears in list (with and without cache)"
    echo "  ✓ Article URL preserved in metadata"
    echo "  ✓ Session activity flags set correctly"
    echo "  ✓ Refresh button will fetch fresh data"
    echo ""
    echo "Test Session ID: $SESSION_ID"
    echo "You can view this session in the admin dashboard!"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some E2E tests failed${NC}"
    echo ""
    echo "Please check:"
    echo "  - Backend server is running"
    echo "  - MongoDB is connected"
    echo "  - Analytics tracking is enabled"
    echo "  - Session creation is working"
    echo ""
    exit 1
fi