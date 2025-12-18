#!/bin/bash

# FeelGive Backend API Test Script
# This script tests all major API endpoints

API_BASE="http://localhost:3001/api/v1"
HEALTH_URL="http://localhost:3001/health"

echo "🧪 Testing FeelGive Backend API"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# Test 2: Create a Donation
echo "2️⃣  Testing Create Donation..."
DONATION_DATA='{
  "charityId": "test_charity_001",
  "charityName": "Test Charity Organization",
  "charitySlug": "test-charity-org",
  "amount": 25,
  "cause": "disaster_relief",
  "geo": "US-CA",
  "geoName": "California, USA",
  "articleUrl": "https://example.com/test-article",
  "articleTitle": "Test Emergency Situation",
  "userEmail": "test@example.com"
}'

DONATION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/donations" \
  -H "Content-Type: application/json" \
  -d "$DONATION_DATA")

HTTP_CODE=$(echo "$DONATION_RESPONSE" | tail -n1)
BODY=$(echo "$DONATION_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ Donation created successfully${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Donation creation failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Get Donations
echo "3️⃣  Testing Get Donations..."
DONATIONS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/donations?limit=5")
HTTP_CODE=$(echo "$DONATIONS_RESPONSE" | tail -n1)
BODY=$(echo "$DONATIONS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Retrieved donations successfully${NC}"
    echo "   Response: $BODY" | head -c 200
    echo "..."
else
    echo -e "${RED}❌ Get donations failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 4: Get Donation Stats
echo "4️⃣  Testing Get Donation Stats..."
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/donations/stats")
HTTP_CODE=$(echo "$STATS_RESPONSE" | tail -n1)
BODY=$(echo "$STATS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Retrieved donation stats successfully${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Get donation stats failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 5: Get/Create User
echo "5️⃣  Testing Get/Create User..."
USER_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/users?email=test@example.com")
HTTP_CODE=$(echo "$USER_RESPONSE" | tail -n1)
BODY=$(echo "$USER_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ User retrieved/created successfully${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Get user failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 6: Update User Preferences
echo "6️⃣  Testing Update User Preferences..."
PREFS_DATA='{
  "email": "test@example.com",
  "monthlyCapEnabled": true,
  "monthlyCap": 100
}'

PREFS_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_BASE/users/preferences" \
  -H "Content-Type: application/json" \
  -d "$PREFS_DATA")

HTTP_CODE=$(echo "$PREFS_RESPONSE" | tail -n1)
BODY=$(echo "$PREFS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ User preferences updated successfully${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Update preferences failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 7: Create Classification
echo "7️⃣  Testing Create Classification..."
CLASSIFICATION_DATA='{
  "cause": "disaster_relief",
  "tier1_crisis_type": "natural_disaster",
  "tier2_root_cause": "climate_driven",
  "identified_needs": ["shelter", "food", "medical"],
  "geo": "US-CA",
  "geoName": "California, USA",
  "affectedGroups": ["residents", "evacuees"],
  "confidence": 0.85,
  "articleUrl": "https://example.com/test-classification",
  "articleTitle": "Test Emergency Classification",
  "matchedKeywords": ["emergency", "evacuation"],
  "relevantExcerpts": ["Emergency situation developing..."],
  "hasMatchingCharities": true,
  "severityAssessment": {
    "level": "high",
    "peopleAffected": 5000,
    "systemStatus": "overwhelmed",
    "imminentRisk": true,
    "reasoning": "Rapidly developing emergency situation"
  }
}'

CLASSIFICATION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/classifications" \
  -H "Content-Type: application/json" \
  -d "$CLASSIFICATION_DATA")

HTTP_CODE=$(echo "$CLASSIFICATION_RESPONSE" | tail -n1)
BODY=$(echo "$CLASSIFICATION_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ Classification created successfully${NC}"
    echo "   Response: $BODY" | head -c 200
    echo "..."
else
    echo -e "${RED}❌ Classification creation failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 8: Get Classifications
echo "8️⃣  Testing Get Classifications..."
CLASSIFICATIONS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/classifications?limit=5")
HTTP_CODE=$(echo "$CLASSIFICATIONS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Retrieved classifications successfully${NC}"
else
    echo -e "${RED}❌ Get classifications failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Summary
echo "================================"
echo "🎉 API Testing Complete!"
echo ""
echo -e "${YELLOW}Note: Make sure MongoDB Atlas is properly configured in backend/.env${NC}"
echo -e "${YELLOW}See backend/MONGODB_ATLAS_SETUP.md for setup instructions${NC}"