# Manual Test: Nigeria Article Geographic Filtering

## Purpose
Verify that the Nigeria article bug is fixed - Nigeria articles should NOT show Thailand organizations.

## Prerequisites
- Backend running on http://localhost:3001
- Frontend running on http://localhost:5173

## Test Steps

### 1. Open the Application
```
Open browser to: http://localhost:5173
```

### 2. Paste Nigeria Article
Copy and paste this article into the input field:

```
Nigeria floods displace thousands in Lagos

Heavy rainfall has caused severe flooding in Lagos, Nigeria's largest city, displacing thousands of residents. The floods have destroyed homes and infrastructure, leaving many families without shelter. Local authorities are coordinating relief efforts, but resources are stretched thin. International aid organizations are being called upon to assist with emergency response and long-term recovery efforts.
```

### 3. Submit and Wait for Results
- Click "Analyze" or submit the article
- Wait for the classification and organization recommendations to load

### 4. Verify Results

#### ✅ Expected Behavior (FIXED):
- **Organizations shown should be:**
  - Nigerian organizations (e.g., "Nigerian Red Cross Society")
  - West African regional organizations
  - International organizations working in Nigeria/West Africa
  
- **Organizations should NOT include:**
  - ❌ Thailand Humanitarian Academic Initiative
  - ❌ Any Thailand-based organizations
  - ❌ Any Southeast Asian organizations

#### Check Console Logs:
Open browser DevTools (F12) and check console for:

**GOOD (Fixed):**
```
[GEO-RELEVANT] Processing article: Nigeria floods...
[GEO-RELEVANT] Extracted locations: Nigeria, Lagos
[GEO-RELEVANT] Match level: EXACT_COUNTRY
[GEO-RELEVANT] Recommended: Nigerian Red Cross Society
```

**BAD (Not Fixed):**
```
[EVERY.ORG] Fetching organizations: Thailand Humanitarian Academic Initiative
```

### 5. Verify Geographic Badges
Each organization card should show a badge indicating geographic relevance:
- 🟢 **Local** - Based in Lagos
- 🔵 **National** - Based in Nigeria
- 🟡 **Regional** - Based in West Africa
- 🟠 **Global** - International org working in Nigeria

### 6. Check "Why Recommended" Section
Each organization should have bullets explaining why it was recommended:
- ✅ "Based in Nigeria" or "Works in Nigeria"
- ✅ "Focuses on disaster relief" or similar cause alignment
- ✅ "Highly rated organization" (if trust score is high)

## Success Criteria

### ✅ Test PASSES if:
1. NO Thailand organizations appear in recommendations
2. Console shows `[GEO-RELEVANT]` logs (not `[EVERY.ORG]`)
3. Organizations are Nigeria/West Africa focused
4. Geographic badges are displayed correctly
5. "Why recommended" bullets mention Nigeria/West Africa

### ❌ Test FAILS if:
1. Thailand organizations appear
2. Console shows `[EVERY.ORG]` logs
3. Organizations are from unrelated regions (Asia, South America, etc.)
4. No geographic context in recommendations

## Troubleshooting

### If frontend isn't loading:
```bash
cd frontend
npm run dev
```

### If backend isn't responding:
```bash
cd backend
npm run dev
```

### If you see old cached results:
1. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Or open in incognito/private window

### If recommendations endpoint returns error:
Check backend logs for errors in the recommendations pipeline

## Alternative: Direct API Test

If the UI isn't working, test the API directly:

```bash
curl -X POST http://localhost:3001/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nigeria floods displace thousands in Lagos",
    "description": "Heavy rainfall has caused severe flooding...",
    "entities": ["Nigeria", "Lagos"],
    "causes": ["disaster-relief", "humanitarian-aid"],
    "keywords": ["flood", "displacement", "emergency"]
  }' | jq '.'
```

**Expected Response:**
```json
{
  "recommendations": [
    {
      "slug": "nigerian-red-cross",
      "name": "Nigerian Red Cross Society",
      "location": "Nigeria",
      "matchLevel": "EXACT_COUNTRY",
      "whyRecommended": [
        "Based in Nigeria",
        "Focuses on disaster relief"
      ]
    }
  ]
}
```

**Should NOT contain:**
- Any organization with "Thailand" in the name
- Any organization with `matchLevel: "MISMATCH"`

## Report Results

After testing, report:
1. ✅ or ❌ for each success criterion
2. Screenshot of recommendations
3. Copy of console logs
4. Any unexpected behavior

---

**Test Date:** _____________
**Tester:** _____________
**Result:** ✅ PASS / ❌ FAIL
**Notes:** _____________