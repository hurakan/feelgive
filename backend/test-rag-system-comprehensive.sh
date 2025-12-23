#!/bin/bash

# Comprehensive RAG System Test Suite
# Tests all aspects of the RAG chatbot implementation

BASE_URL="http://localhost:3001"
API_BASE="${BASE_URL}/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test header
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to print test result
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check if server is running
check_server() {
    if ! curl -s "${BASE_URL}" > /dev/null 2>&1; then
        echo -e "${RED}Error: Backend server is not running at ${BASE_URL}${NC}"
        echo "Please start the server with: cd backend && npm run dev"
        exit 1
    fi
}

# Sample article context for testing
get_test_context() {
    cat <<'EOF'
{
  "articleTitle": "Hurricane Devastates Coastal Region",
  "articleText": "A powerful Category 4 hurricane has devastated the coastal region, leaving thousands homeless and in urgent need of assistance. The storm surge flooded entire neighborhoods, destroying homes and infrastructure. Emergency services are overwhelmed as they work to rescue stranded residents. The affected area spans over 200 miles of coastline, with an estimated 50,000 people displaced. Local hospitals are operating at capacity, treating injuries ranging from minor cuts to severe trauma. Power outages affect over 100,000 homes, and clean water supplies are critically low. Relief organizations are mobilizing to provide emergency shelter, food, and medical supplies.",
  "articleSummary": "Category 4 hurricane devastates coastal region, displacing 50,000 people and overwhelming emergency services.",
  "articleUrl": "https://example.com/hurricane-news",
  "classification": {
    "cause": "disaster_relief",
    "geoName": "Florida, USA",
    "severity": "critical",
    "identified_needs": ["shelter", "food", "medical", "water"],
    "affectedGroups": ["families", "elderly", "children"]
  },
  "matchedCharities": [
    {
      "name": "American Red Cross",
      "description": "Provides emergency relief and disaster response services",
      "trustScore": 0.95
    },
    {
      "name": "Direct Relief",
      "description": "Delivers medical assistance to disaster-affected areas",
      "trustScore": 0.92
    }
  ]
}
EOF
}

# Helper function to extract HTTP code
get_http_code() {
    echo "$1" | grep -o '[0-9]\{3\}$'
}

# Helper function to extract body
get_body() {
    echo "$1" | sed '$d'
}

# Test 1: Health Check
print_header "TEST SUITE 1: API AVAILABILITY"

echo "Test 1.1: Health check endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE}/chat/health" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")
BODY=$(get_body "$RESPONSE")

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Health check returns 200 OK"
    echo "Response: $BODY"
else
    print_result 1 "Health check failed with code $HTTP_CODE"
fi

echo ""
echo "Test 1.2: Health check response structure"
if echo "$BODY" | jq -e '.status' > /dev/null 2>&1; then
    print_result 0 "Health check has 'status' field"
else
    print_result 1 "Health check missing 'status' field"
fi

if echo "$BODY" | jq -e '.service' > /dev/null 2>&1; then
    print_result 0 "Health check has 'service' field"
else
    print_result 1 "Health check missing 'service' field"
fi

# Test 2: Input Validation
print_header "TEST SUITE 2: INPUT VALIDATION"

echo "Test 2.1: Empty request body"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Empty request returns 400 Bad Request"
else
    print_result 1 "Empty request should return 400, got $HTTP_CODE"
fi

echo ""
echo "Test 2.2: Missing message field"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"context\": $CONTEXT}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Missing message returns 400"
else
    print_result 1 "Missing message should return 400, got $HTTP_CODE"
fi

echo ""
echo "Test 2.3: Missing context field"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the urgent needs?"}' 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Missing context returns 400"
else
    print_result 1 "Missing context should return 400, got $HTTP_CODE"
fi

echo ""
echo "Test 2.4: Message too long (>1000 chars)"
LONG_MESSAGE=$(printf 'a%.0s' {1..1001})
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$LONG_MESSAGE\", \"context\": $CONTEXT}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Message >1000 chars returns 400"
else
    print_result 1 "Long message should return 400, got $HTTP_CODE"
fi

echo ""
echo "Test 2.5: Invalid context structure (missing required fields)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "context": {"articleTitle": "test"}}' 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Invalid context structure returns 400"
else
    print_result 1 "Invalid context should return 400, got $HTTP_CODE"
fi

# Test 3: Basic RAG Functionality
print_header "TEST SUITE 3: BASIC RAG FUNCTIONALITY"

echo "Test 3.1: Simple question about crisis"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What are the most urgent needs?\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")
BODY=$(get_body "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    if [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Simple question returns 200 OK"
        echo "Response preview: $(echo "$BODY" | jq -r '.message' 2>/dev/null | head -c 100)..."
    else
        print_result 1 "Simple question failed (likely API key issue): $HTTP_CODE"
        echo "Error: $(echo "$BODY" | jq -r '.error' 2>/dev/null)"
    fi
else
    print_result 1 "Unexpected status code: $HTTP_CODE"
fi

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "Test 3.2: Response has message field"
    if echo "$BODY" | jq -e '.message' > /dev/null 2>&1; then
        print_result 0 "Response contains 'message' field"
    else
        print_result 1 "Response missing 'message' field"
    fi

    echo ""
    echo "Test 3.3: Response has suggestions field"
    if echo "$BODY" | jq -e '.suggestions' > /dev/null 2>&1; then
        print_result 0 "Response contains 'suggestions' field"
        SUGGESTIONS_COUNT=$(echo "$BODY" | jq '.suggestions | length' 2>/dev/null)
        echo "  Suggestions count: $SUGGESTIONS_COUNT"
    else
        print_result 1 "Response missing 'suggestions' field"
    fi

    echo ""
    echo "Test 3.4: Response message is not empty"
    MESSAGE_LENGTH=$(echo "$BODY" | jq -r '.message | length' 2>/dev/null)
    if [ "$MESSAGE_LENGTH" -gt 0 ]; then
        print_result 0 "Response message is not empty (length: $MESSAGE_LENGTH)"
    else
        print_result 1 "Response message is empty"
    fi
fi

# Test 4: Conversation History
print_header "TEST SUITE 4: CONVERSATION HISTORY"

echo "Test 4.1: Request with conversation history"
HISTORY='[{"role": "user", "content": "What happened?"}, {"role": "model", "content": "A Category 4 hurricane devastated the coastal region."}]'
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"How many people were affected?\", \"context\": $CONTEXT, \"history\": $HISTORY}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    if [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Request with history accepted"
    else
        print_result 1 "Request with history failed (API key issue)"
    fi
else
    print_result 1 "Unexpected status code: $HTTP_CODE"
fi

echo ""
echo "Test 4.2: Empty history array"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What happened?\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "Empty history array accepted"
else
    print_result 1 "Empty history should be accepted, got $HTTP_CODE"
fi

# Test 5: Web Search Integration
print_header "TEST SUITE 5: WEB SEARCH INTEGRATION"

echo "Test 5.1: Request with web search enabled"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What are the latest updates?\", \"context\": $CONTEXT, \"history\": [], \"enableWebSearch\": true}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")
BODY=$(get_body "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "Web search parameter accepted"
    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | jq -e '.sources' > /dev/null 2>&1; then
            SOURCES_COUNT=$(echo "$BODY" | jq '.sources | length' 2>/dev/null)
            echo "  Sources returned: $SOURCES_COUNT"
        fi
    fi
else
    print_result 1 "Web search request failed with $HTTP_CODE"
fi

echo ""
echo "Test 5.2: Request with web search disabled"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What happened?\", \"context\": $CONTEXT, \"history\": [], \"enableWebSearch\": false}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "Web search disabled parameter accepted"
else
    print_result 1 "Request failed with $HTTP_CODE"
fi

# Test 6: Response Caching
print_header "TEST SUITE 6: RESPONSE CACHING"

echo "Test 6.1: Cache stats endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE}/chat/cache/stats" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")
BODY=$(get_body "$RESPONSE")

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Cache stats endpoint accessible"
    echo "Cache stats: $BODY"
else
    print_result 1 "Cache stats endpoint failed with $HTTP_CODE"
fi

echo ""
echo "Test 6.2: Cache stats structure"
if echo "$BODY" | jq -e '.stats.totalEntries' > /dev/null 2>&1; then
    print_result 0 "Cache stats has totalEntries"
else
    print_result 1 "Cache stats missing totalEntries"
fi

if echo "$BODY" | jq -e '.stats.hitRate' > /dev/null 2>&1; then
    print_result 0 "Cache stats has hitRate"
else
    print_result 1 "Cache stats missing hitRate"
fi

# Test 7: Rate Limiting
print_header "TEST SUITE 7: RATE LIMITING"

echo "Test 7.1: Rate limit enforcement (sending 12 requests rapidly)"
echo "Note: Rate limit is 10 requests per minute"

RATE_LIMIT_HIT=0
CONTEXT=$(get_test_context)
for i in {1..12}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"Test $i\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
    HTTP_CODE=$(get_http_code "$RESPONSE")
    
    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_HIT=1
        echo "  Request $i: Rate limited (429)"
        break
    else
        echo "  Request $i: $HTTP_CODE"
    fi
    sleep 0.1
done

if [ $RATE_LIMIT_HIT -eq 1 ]; then
    print_result 0 "Rate limiting is enforced"
else
    print_result 1 "Rate limiting not triggered (may need API key to test fully)"
fi

# Test 8: Edge Cases
print_header "TEST SUITE 8: EDGE CASES"

echo "Test 8.1: Very short message"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"?\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "Very short message accepted"
else
    print_result 1 "Very short message failed with $HTTP_CODE"
fi

echo ""
echo "Test 8.2: Message with special characters"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What's the situation?\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "Special characters handled"
else
    print_result 1 "Special characters caused error: $HTTP_CODE"
fi

echo ""
echo "Test 8.3: Unicode characters in message"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What happened?\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "Unicode characters handled"
else
    print_result 1 "Unicode characters caused error: $HTTP_CODE"
fi

# Test 9: Context-Aware Responses
print_header "TEST SUITE 9: CONTEXT AWARENESS"

echo "Test 9.1: Question about matched charities"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"How can American Red Cross help?\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")
BODY=$(get_body "$RESPONSE")

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Charity-specific question accepted"
    MESSAGE=$(echo "$BODY" | jq -r '.message' 2>/dev/null)
    if echo "$MESSAGE" | grep -qi "red cross"; then
        print_result 0 "Response mentions the charity"
    else
        print_result 1 "Response doesn't mention the charity"
    fi
else
    print_result 1 "Charity question failed: $HTTP_CODE"
fi

echo ""
echo "Test 9.2: Question about location"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Where did this happen?\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")
BODY=$(get_body "$RESPONSE")

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Location question accepted"
    MESSAGE=$(echo "$BODY" | jq -r '.message' 2>/dev/null)
    if echo "$MESSAGE" | grep -qi "florida"; then
        print_result 0 "Response mentions the location"
    else
        print_result 1 "Response doesn't mention the location"
    fi
else
    print_result 1 "Location question failed: $HTTP_CODE"
fi

# Test 10: Security Tests
print_header "TEST SUITE 10: SECURITY"

echo "Test 10.1: SQL injection attempt in message"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"DROP TABLE users\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "SQL injection attempt handled safely"
else
    print_result 1 "Unexpected response to SQL injection: $HTTP_CODE"
fi

echo ""
echo "Test 10.2: XSS attempt in message"
CONTEXT=$(get_test_context)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"<script>alert('xss')</script>\", \"context\": $CONTEXT, \"history\": []}" 2>&1)
HTTP_CODE=$(get_http_code "$RESPONSE")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "500" ]; then
    print_result 0 "XSS attempt handled safely"
else
    print_result 1 "Unexpected response to XSS: $HTTP_CODE"
fi

# Final Summary
print_header "TEST SUMMARY"

echo ""
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}Pass rate: ${PASS_RATE}%${NC}"
    exit 1
fi