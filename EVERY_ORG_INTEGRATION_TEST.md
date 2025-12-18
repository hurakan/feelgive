# Every.org Integration Testing Guide

This document provides comprehensive testing instructions for the Every.org integration, which dynamically fetches and matches organizations based on article classification.

## Table of Contents

1. [Overview](#overview)
2. [Automated Tests](#automated-tests)
3. [Manual Testing](#manual-testing)
4. [Expected Behavior](#expected-behavior)
5. [Troubleshooting](#troubleshooting)
6. [Test Scenarios](#test-scenarios)

---

## Overview

The Every.org integration consists of three main components:

1. **Search Term Extraction** ([`frontend/src/utils/search-term-extractor.ts`](frontend/src/utils/search-term-extractor.ts))
   - Extracts meaningful search terms from classification results
   - Combines crisis type, root cause, needs, and location

2. **Data Mapping** ([`frontend/src/utils/every-org-mapper.ts`](frontend/src/utils/every-org-mapper.ts))
   - Maps Every.org API responses to internal Charity type
   - Infers causes from NTEE codes and descriptions
   - Calculates trust scores based on data completeness
   - Extracts geographic information

3. **Integration Flow** ([`frontend/src/pages/Index.tsx`](frontend/src/pages/Index.tsx))
   - Orchestrates the complete flow from classification to matched charities
   - Uses [`useOrganizations`](frontend/src/hooks/use-organizations.tsx) hook to fetch data

---

## Automated Tests

### Running the Test Suite

```bash
node frontend/test-every-org-integration.js
```

### What the Tests Cover

#### 1. Search Term Extraction Tests
- ✅ Wildfire scenarios with location
- ✅ Hurricane scenarios with rescue needs
- ✅ Refugee crisis with conflict context
- ✅ Minimal data (only cause category)
- ✅ Earthquake with multiple needs

**Expected Output:**
```
Search Term Extraction: X passed, 0 failed
```

#### 2. Data Mapping Tests
- ✅ Complete disaster relief organization with all fields
- ✅ Health organization with minimal data
- ✅ International humanitarian organization (global operations)
- ✅ Climate/environmental organization

**Validates:**
- Cause inference from NTEE codes
- Cause inference from descriptions
- Trust score calculation (70-100 range)
- Country extraction from addresses
- Addressed needs inference

**Expected Output:**
```
Data Mapping: X passed, 0 failed
```

#### 3. Integration Flow Tests
- ✅ Complete flow: Classification → Search → Map → Match
- ✅ Verifies data compatibility with matching algorithm

**Expected Output:**
```
Integration Flow: X passed, 0 failed
```

### Success Criteria

All tests should pass with a 100% success rate:
```
🎉 All tests passed!
```

---

## Manual Testing

### Prerequisites

1. Backend server running (for API calls)
2. Browser console open (F12 → Console tab)
3. Test articles ready (see [Test Scenarios](#test-scenarios))

### Step-by-Step Manual Testing

#### 1. Open the Application

Navigate to: `http://localhost:5173` (or your dev server URL)

#### 2. Monitor Console Logs

All Every.org integration logs are prefixed with `[EVERY.ORG]` for easy filtering.

**Console Filter:** Type `EVERY.ORG` in the console filter box to see only integration logs.

#### 3. Test an Article

1. Paste an article URL or text
2. Click "Get Ways to Help"
3. Watch the console for the following sequence:

```
[EVERY.ORG] 🔍 Extracting search terms from classification...
[EVERY.ORG] Classification data: { ... }
[EVERY.ORG] 🔍 Extracted search query: "wildfire California shelter"
[EVERY.ORG] 📡 Fetching organizations from API with search query...
[EVERY.ORG] ✅ API returned 5 organizations
[EVERY.ORG] Sample organizations from API:
[EVERY.ORG]   1. California Fire Foundation (california-fire-foundation)
[EVERY.ORG]      - Causes: disaster_relief
[EVERY.ORG]      - Trust Score: 95
[EVERY.ORG]      - Countries: USA
[EVERY.ORG]      - Addressed Needs: shelter, food, medical
[EVERY.ORG] 🔍 Matching charities with classification...
[EVERY.ORG] 📊 Available organizations from API: 5
[EVERY.ORG] ✅ Using 5 API organizations
[EVERY.ORG] ✅ Matched 3 charities:
[EVERY.ORG]   1. California Fire Foundation (california-fire-foundation)
[EVERY.ORG]      - Trust Score: 95
[EVERY.ORG]      - Causes: disaster_relief
[EVERY.ORG]      - Countries: USA
[EVERY.ORG]      - Addressed Needs: shelter, food, medical
[EVERY.ORG]      - Every.org Verified: Yes
```

#### 4. Verify UI Display

After the console logs, verify:

- ✅ Organizations are displayed in the UI
- ✅ Organization cards show correct information
- ✅ Trust scores are displayed (should be 70-100)
- ✅ "Every.org Verified" badge appears (if applicable)
- ✅ Causes match the article content
- ✅ Geographic information is relevant

---

## Expected Behavior

### Search Term Extraction

**Input:** Classification result with crisis type, root cause, needs, and location

**Expected Output:** A search query combining the most relevant terms (max 3)

**Examples:**

| Scenario | Expected Search Query |
|----------|----------------------|
| California wildfire | `"wildfire California shelter"` |
| Florida hurricane | `"hurricane rescue Florida"` |
| Syria refugee crisis | `"refugee crisis armed conflict food"` |
| Generic health crisis | `"health crisis"` |

### Data Mapping

**Input:** Every.org API response with nonprofit data

**Expected Output:** Charity object with:

| Field | Expected Behavior |
|-------|------------------|
| `causes` | Inferred from NTEE code + description keywords (min 2 matches) |
| `trustScore` | 70-100 based on data completeness |
| `countries` | Extracted from address, defaults to USA |
| `addressedNeeds` | Inferred from description, defaults to [food, shelter, medical] |
| `everyOrgVerified` | Always `true` for API results |

### Trust Score Calculation

Base score: **70**

Bonuses:
- Has EIN: **+10**
- Description > 100 chars: **+5**
- Has logo: **+5**
- Has website: **+5**
- Has location: **+3**
- Has NTEE code: **+2**

**Maximum:** 100

### Matching Algorithm

Organizations are matched based on:
1. **Cause compatibility** (primary filter)
2. **Geographic relevance** (if location specified)
3. **Addressed needs overlap** (scoring factor)
4. **Trust score** (ranking factor)

---

## Troubleshooting

### Issue: No organizations returned from API

**Symptoms:**
```
[EVERY.ORG] ✅ API returned 0 organizations
[EVERY.ORG] ⚠️ Using default VERIFIED_CHARITIES fallback
```

**Possible Causes:**
1. Backend server not running
2. Every.org API key not configured
3. Search query too specific (no matches)
4. Network connectivity issues

**Solutions:**
1. Check backend server status
2. Verify `EVERY_ORG_API_KEY` in backend `.env`
3. Try a broader search term
4. Check network tab for API errors

### Issue: All trust scores are 95

**Symptoms:**
All organizations show the same trust score (95)

**Diagnosis:**
This indicates the old static data is being used instead of dynamic API data.

**Solution:**
1. Verify API is returning data (check console logs)
2. Ensure [`mapEveryOrgToCharity()`](frontend/src/utils/every-org-mapper.ts) is being called
3. Check that trust score calculation is working

### Issue: Causes don't match article

**Symptoms:**
Organizations shown don't relate to the article content

**Diagnosis:**
- Search term extraction may be incorrect
- NTEE code mapping may need adjustment
- Description keyword matching may need tuning

**Solution:**
1. Check console logs for extracted search query
2. Verify classification data is correct
3. Review NTEE code mappings in [`every-org-mapper.ts`](frontend/src/utils/every-org-mapper.ts)
4. Adjust keyword patterns if needed

### Issue: Missing addressed needs

**Symptoms:**
Organizations show default needs [food, shelter, medical] instead of specific needs

**Diagnosis:**
Description doesn't contain enough keywords to infer needs

**Solution:**
1. Review keyword patterns in [`inferAddressedNeeds()`](frontend/src/utils/every-org-mapper.ts)
2. Add more relevant keywords for specific needs
3. Consider using NTEE code to infer needs

### Issue: Wrong country detected

**Symptoms:**
Organizations show incorrect country (e.g., USA when should be Global)

**Diagnosis:**
Address parsing logic needs adjustment

**Solution:**
1. Check [`extractCountryFromAddress()`](frontend/src/utils/every-org-mapper.ts)
2. Add more country patterns
3. Improve "Global" detection logic

---

## Test Scenarios

### Scenario 1: California Wildfire

**Article Type:** Natural disaster, domestic

**Test Article URL:** Search for recent California wildfire news

**Expected Results:**
- Search query: `"wildfire California shelter"` (or similar)
- Organizations: Fire relief, disaster response, local California orgs
- Causes: `disaster_relief`, possibly `climate_events`
- Countries: `USA`
- Needs: `shelter`, `food`, `medical`, `rescue`

**Console Check:**
```
[EVERY.ORG] 🔍 Extracted search query: "wildfire California shelter"
[EVERY.ORG] ✅ API returned X organizations
[EVERY.ORG] ✅ Matched Y charities
```

### Scenario 2: International Humanitarian Crisis

**Article Type:** Refugee crisis, international

**Test Article URL:** Search for Syria or Ukraine refugee crisis news

**Expected Results:**
- Search query: `"refugee crisis [location] food"` (or similar)
- Organizations: International relief, refugee support, humanitarian aid
- Causes: `humanitarian_crisis`
- Countries: May include `Global` or specific country codes
- Needs: `food`, `shelter`, `medical`, `water`

**Console Check:**
```
[EVERY.ORG] 🔍 Extracted search query: "refugee crisis Syria food"
[EVERY.ORG] Sample organizations from API:
[EVERY.ORG]   1. [International Org] (slug)
[EVERY.ORG]      - Countries: Global
```

### Scenario 3: Health Emergency

**Article Type:** Disease outbreak, health crisis

**Test Article URL:** Search for health emergency or epidemic news

**Expected Results:**
- Search query: `"health crisis [location]"` (or similar)
- Organizations: Medical relief, health services, disease prevention
- Causes: `health_crisis`
- Needs: `medical`, `health`, possibly `water`, `sanitation`

**Console Check:**
```
[EVERY.ORG] 🔍 Extracted search query: "health crisis medical"
[EVERY.ORG]      - Causes: health_crisis
[EVERY.ORG]      - Addressed Needs: medical, water, sanitation
```

### Scenario 4: Hurricane/Storm

**Article Type:** Natural disaster, coastal

**Test Article URL:** Search for recent hurricane news

**Expected Results:**
- Search query: `"hurricane [location] rescue"` (or similar)
- Organizations: Disaster relief, emergency response, local orgs
- Causes: `disaster_relief`
- Countries: `USA` or affected country
- Needs: `rescue`, `shelter`, `water`, `food`

**Console Check:**
```
[EVERY.ORG] 🔍 Extracted search query: "hurricane Florida rescue"
[EVERY.ORG]      - Addressed Needs: rescue, shelter, water, food
```

### Scenario 5: Climate/Environmental Crisis

**Article Type:** Environmental disaster, climate event

**Test Article URL:** Search for environmental disaster news

**Expected Results:**
- Search query: `"climate [event] [location]"` (or similar)
- Organizations: Environmental groups, conservation, climate action
- Causes: `climate_events`, possibly `disaster_relief`
- Needs: Varies by specific event

**Console Check:**
```
[EVERY.ORG] 🔍 Extracted search query: "climate flood Bangladesh"
[EVERY.ORG]      - Causes: climate_events, disaster_relief
```

---

## Verification Checklist

Use this checklist when testing the integration:

### Automated Tests
- [ ] All search term extraction tests pass
- [ ] All data mapping tests pass
- [ ] All integration flow tests pass
- [ ] No errors in test output

### Manual Testing - Console Logs
- [ ] `[EVERY.ORG]` logs appear in console
- [ ] Search query is extracted correctly
- [ ] API returns organizations (count > 0)
- [ ] Organizations are mapped with correct data
- [ ] Trust scores are in range 70-100
- [ ] Causes are relevant to article
- [ ] Countries are correctly identified
- [ ] Addressed needs are inferred

### Manual Testing - UI
- [ ] Organizations display in the UI
- [ ] Organization cards show complete information
- [ ] Trust scores are visible and reasonable
- [ ] Causes match article content
- [ ] Geographic information is relevant
- [ ] "Every.org Verified" badge appears
- [ ] Can select and donate to organizations

### Edge Cases
- [ ] Handles articles with minimal information
- [ ] Falls back gracefully when API fails
- [ ] Works with international locations
- [ ] Handles multiple crisis types
- [ ] Works with low-confidence classifications

---

## Success Metrics

The integration is working correctly when:

1. **Search Terms:** Relevant search queries are extracted from 90%+ of classifications
2. **API Response:** Organizations are returned for 80%+ of search queries
3. **Data Quality:** Trust scores vary (not all 95) and reflect data completeness
4. **Cause Matching:** Organizations' causes align with article content in 90%+ of cases
5. **Geographic Accuracy:** Countries are correctly identified in 95%+ of cases
6. **User Experience:** Users see relevant organizations within 3-5 seconds

---

## Additional Resources

- [Every.org API Documentation](https://www.every.org/api-docs)
- [NTEE Code Reference](https://nccs.urban.org/project/national-taxonomy-exempt-entities-ntee-codes)
- [Search Term Extractor Source](frontend/src/utils/search-term-extractor.ts)
- [Data Mapper Source](frontend/src/utils/every-org-mapper.ts)
- [Integration Hook Source](frontend/src/hooks/use-organizations.tsx)

---

## Reporting Issues

If you find issues with the integration:

1. **Check Console Logs:** Look for `[EVERY.ORG]` prefixed messages
2. **Run Automated Tests:** Verify basic functionality works
3. **Document the Issue:**
   - Article URL or text used
   - Expected behavior
   - Actual behavior
   - Console logs
   - Screenshots (if UI issue)
4. **Report:** Create an issue with all documentation

---

## Future Improvements

Potential enhancements to consider:

1. **Caching:** Cache API responses to reduce API calls
2. **Fallback Search:** Try alternative search terms if first query returns no results
3. **Relevance Scoring:** Improve matching algorithm with relevance scores
4. **User Feedback:** Allow users to report irrelevant organizations
5. **A/B Testing:** Test different search term extraction strategies
6. **Analytics:** Track which search terms perform best

---

*Last Updated: 2025-12-18*