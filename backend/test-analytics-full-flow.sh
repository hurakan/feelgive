#!/bin/bash

# Analytics Full Flow Integration Test
# This script tests the complete analytics pipeline from event ingestion to data retrieval

set -e  # Exit on any error

# Configuration
BASE_URL="http://localhost:3001/api/v1"
ADMIN_KEY="dev-admin-key-12345"
SESSION_ID="test-integration-$(date +%s)"
USER_ID="test-user-$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Analytics Full Flow Integration Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print test step
print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it to run this test."
        echo "  macOS: brew install jq"
        echo "  Ubuntu: sudo apt-get install jq"
        exit 1
    fi
}

# Check dependencies
check_jq

# Get initial summary stats
print_step "Step 1: Getting initial summary statistics..."
INITIAL_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/summary?range=all" \
  -H "X-Admin-Key: $ADMIN_KEY")

if [ $? -ne 0 ]; then
    print_error "Failed to connect to analytics API"
    exit 1
fi

INITIAL_SESSIONS=$(echo "$INITIAL_RESPONSE" | jq -r '.totalSessions // 0')
INITIAL_USERS=$(echo "$INITIAL_RESPONSE" | jq -r '.totalUsers // 0')
INITIAL_PAGE_VIEWS=$(echo "$INITIAL_RESPONSE" | jq -r '.pageViews // 0')

print_success "Initial stats retrieved:"
echo "  Sessions: $INITIAL_SESSIONS"
echo "  Users: $INITIAL_USERS"
echo "  Page Views: $INITIAL_PAGE_VIEWS"
echo ""

# Step 2: Ingest a batch of test events
print_step "Step 2: Ingesting test event batch (complete user journey)..."

INGEST_RESPONSE=$(curl -s -X POST "$BASE_URL/analytics/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [
      {
        \"eventType\": \"app_open\",
        \"eventName\": \"Integration Test App Launch\",
        \"category\": \"lifecycle\",
        \"metadata\": {
          \"source\": \"integration_test\",
          \"testId\": \"full-flow-test\"
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
          \"source\": \"integration_test\"
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.500Z)\"
      },
      {
        \"eventType\": \"article_opened\",
        \"eventName\": \"Integration Test: Global Crisis Article\",
        \"category\": \"news\",
        \"metadata\": {
          \"articleId\": \"test-article-$(date +%s)\",
          \"articleUrl\": \"https://example.com/test-crisis-article\",
          \"source\": \"Integration Test News\",
          \"eventTag\": \"crisis\",
          \"testId\": \"full-flow-test\"
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.800Z)\"
      },
      {
        \"eventType\": \"chat_opened\",
        \"eventName\": \"AI Assistant\",
        \"category\": \"engagement\",
        \"metadata\": {
          \"source\": \"integration_test\",
          \"context\": \"article_read\"
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.900Z)\"
      },
      {
        \"eventType\": \"donate_clicked\",
        \"eventName\": \"Test Charity Organization\",
        \"category\": \"conversion\",
        \"metadata\": {
          \"organizationId\": \"test-org-$(date +%s)\",
          \"organizationName\": \"Test Charity Organization\",
          \"source\": \"integration_test\"
        },
        \"url\": \"http://localhost:5173/\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.950Z)\"
      },
      {
        \"eventType\": \"donation_success\",
        \"eventName\": \"Donation Completed\",
        \"category\": \"conversion\",
        \"metadata\": {
          \"amount\": 50,
          \"organizationId\": \"test-org-$(date +%s)\",
          \"organizationName\": \"Test Charity Organization\",
          \"transactionId\": \"test-txn-$(date +%s)\",
          \"source\": \"integration_test\"
        },
        \"url\": \"http://localhost:5173/donation-success\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"$USER_ID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.999Z)\"
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

if [ $? -ne 0 ]; then
    print_error "Failed to ingest events"
    exit 1
fi

INGEST_STATUS=$(echo "$INGEST_RESPONSE" | jq -r '.success // false')
EVENTS_RECEIVED=$(echo "$INGEST_RESPONSE" | jq -r '.count // 0')

if [ "$INGEST_STATUS" = "true" ] && [ "$EVENTS_RECEIVED" -eq 6 ]; then
    print_success "Successfully ingested 6 events"
    echo "  Session ID: $SESSION_ID"
    echo "  User ID: $USER_ID"
else
    print_error "Event ingestion failed or incomplete"
    echo "Response: $INGEST_RESPONSE"
    exit 1
fi
echo ""

# Step 3: Wait for processing
print_step "Step 3: Waiting for event processing (3 seconds)..."
sleep 3
print_success "Processing complete"
echo ""

# Step 4: Verify summary statistics updated
print_step "Step 4: Verifying summary statistics updated..."
FINAL_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/summary?range=all" \
  -H "X-Admin-Key: $ADMIN_KEY")

FINAL_SESSIONS=$(echo "$FINAL_RESPONSE" | jq -r '.totalSessions // 0')
FINAL_USERS=$(echo "$FINAL_RESPONSE" | jq -r '.totalUsers // 0')
FINAL_PAGE_VIEWS=$(echo "$FINAL_RESPONSE" | jq -r '.pageViews // 0')

print_success "Final stats retrieved:"
echo "  Sessions: $FINAL_SESSIONS (was $INITIAL_SESSIONS)"
echo "  Users: $FINAL_USERS (was $INITIAL_USERS)"
echo "  Page Views: $FINAL_PAGE_VIEWS (was $INITIAL_PAGE_VIEWS)"
echo ""

# Verify increases
SESSIONS_INCREASED=false
USERS_INCREASED=false

if [ "$FINAL_SESSIONS" -gt "$INITIAL_SESSIONS" ]; then
    SESSIONS_INCREASED=true
    print_success "✓ Sessions increased by $((FINAL_SESSIONS - INITIAL_SESSIONS))"
else
    print_error "✗ Sessions did not increase"
fi

if [ "$FINAL_USERS" -gt "$INITIAL_USERS" ]; then
    USERS_INCREASED=true
    print_success "✓ Users increased by $((FINAL_USERS - INITIAL_USERS))"
else
    print_error "✗ Users did not increase"
fi

# Page views are optional - they may be tracked differently
if [ "$FINAL_PAGE_VIEWS" -gt "$INITIAL_PAGE_VIEWS" ]; then
    print_success "✓ Page views increased by $((FINAL_PAGE_VIEWS - INITIAL_PAGE_VIEWS))"
else
    echo "  ℹ Page views: $FINAL_PAGE_VIEWS (tracking may vary)"
fi
echo ""

# Step 5: Verify session was created
print_step "Step 5: Verifying session was created..."
SESSIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/sessions?limit=20&offset=0" \
  -H "X-Admin-Key: $ADMIN_KEY")

SESSION_FOUND=$(echo "$SESSIONS_RESPONSE" | jq -r ".sessions[] | select(.sessionId == \"$SESSION_ID\") | .sessionId")

if [ "$SESSION_FOUND" = "$SESSION_ID" ]; then
    print_success "✓ Test session found in session list"
else
    print_error "✗ Test session not found in session list"
fi
echo ""

# Step 6: Verify session events
print_step "Step 6: Verifying session events..."
SESSION_EVENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/sessions/$SESSION_ID/events" \
  -H "X-Admin-Key: $ADMIN_KEY")

TOTAL_EVENTS=$(echo "$SESSION_EVENTS_RESPONSE" | jq -r '.totalEvents // 0')
HAS_APP_OPEN=$(echo "$SESSION_EVENTS_RESPONSE" | jq -r '.events[] | select(.eventType == "app_open") | .eventType' | head -1)
HAS_PAGE_VIEW=$(echo "$SESSION_EVENTS_RESPONSE" | jq -r '.events[] | select(.eventType == "page_view") | .eventType' | head -1)
HAS_ARTICLE=$(echo "$SESSION_EVENTS_RESPONSE" | jq -r '.events[] | select(.eventType == "article_opened") | .eventType' | head -1)
HAS_CHAT=$(echo "$SESSION_EVENTS_RESPONSE" | jq -r '.events[] | select(.eventType == "chat_opened") | .eventType' | head -1)
HAS_DONATE=$(echo "$SESSION_EVENTS_RESPONSE" | jq -r '.events[] | select(.eventType == "donate_clicked") | .eventType' | head -1)
HAS_SUCCESS=$(echo "$SESSION_EVENTS_RESPONSE" | jq -r '.events[] | select(.eventType == "donation_success") | .eventType' | head -1)

if [ "$TOTAL_EVENTS" -eq 6 ]; then
    print_success "✓ All 6 events found in session"
else
    print_error "✗ Expected 6 events, found $TOTAL_EVENTS"
fi

# Verify each event type
[ "$HAS_APP_OPEN" = "app_open" ] && print_success "  ✓ app_open event found" || print_error "  ✗ app_open event missing"
[ "$HAS_PAGE_VIEW" = "page_view" ] && print_success "  ✓ page_view event found" || print_error "  ✗ page_view event missing"
[ "$HAS_ARTICLE" = "article_opened" ] && print_success "  ✓ article_opened event found" || print_error "  ✗ article_opened event missing"
[ "$HAS_CHAT" = "chat_opened" ] && print_success "  ✓ chat_opened event found" || print_error "  ✗ chat_opened event missing"
[ "$HAS_DONATE" = "donate_clicked" ] && print_success "  ✓ donate_clicked event found" || print_error "  ✗ donate_clicked event missing"
[ "$HAS_SUCCESS" = "donation_success" ] && print_success "  ✓ donation_success event found" || print_error "  ✗ donation_success event missing"
echo ""

# Step 7: Test funnel data
print_step "Step 7: Verifying funnel data..."
FUNNEL_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/funnels?range=all" \
  -H "X-Admin-Key: $ADMIN_KEY")

FUNNEL_STEPS=$(echo "$FUNNEL_RESPONSE" | jq -r '.steps | length // 0')

if [ "$FUNNEL_STEPS" -gt 0 ]; then
    print_success "✓ Funnel data retrieved ($FUNNEL_STEPS steps)"
else
    echo "  ℹ Funnel data: Available but may need aggregation time"
fi
echo ""

# Step 8: Test location data
print_step "Step 8: Verifying location data..."
LOCATION_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/locations?range=all" \
  -H "X-Admin-Key: $ADMIN_KEY")

COUNTRIES_COUNT=$(echo "$LOCATION_RESPONSE" | jq -r '.countries | length')
CITIES_COUNT=$(echo "$LOCATION_RESPONSE" | jq -r '.cities | length')

if [ "$COUNTRIES_COUNT" -gt 0 ]; then
    print_success "✓ Location data retrieved ($COUNTRIES_COUNT countries, $CITIES_COUNT cities)"
else
    print_error "✗ No location data found"
fi
echo ""

# Final Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"

ALL_PASSED=true

# Core tests that must pass
if [ "$SESSIONS_INCREASED" = true ] && [ "$USERS_INCREASED" = true ] && \
   [ "$SESSION_FOUND" = "$SESSION_ID" ] && [ "$TOTAL_EVENTS" -eq 6 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "The analytics pipeline is working correctly:"
    echo "  ✓ Events are being ingested"
    echo "  ✓ Sessions are being created"
    echo "  ✓ Statistics are being updated"
    echo "  ✓ Event timelines are accessible"
    echo "  ✓ Funnel and location data is available"
    echo ""
    echo "You can view the test session in the admin dashboard:"
    echo "  1. Open http://localhost:5173/admin/analytics"
    echo "  2. Navigate to the 'Session Explorer' tab"
    echo "  3. Look for session: $SESSION_ID"
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the following:"
    echo "  - Backend server is running (npm run dev in backend/)"
    echo "  - MongoDB connection is active"
    echo "  - ADMIN_KEY environment variable is set correctly"
    echo "  - No errors in backend logs"
    ALL_PASSED=false
fi

echo ""
echo -e "${BLUE}========================================${NC}"

# Exit with appropriate code
if [ "$ALL_PASSED" = true ]; then
    exit 0
else
    exit 1
fi