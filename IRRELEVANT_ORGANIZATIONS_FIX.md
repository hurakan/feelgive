# Irrelevant Organizations Filtering Fix

## Issue
For the UN article about "Winter aid delivery continues in Gaza" (https://news.un.org/en/story/2025/12/1166653), the system was recommending "Mercy Healthcare Corp" which is not relevant to humanitarian crises.

## Root Cause Analysis

### The Problem
When searching Every.org for "Mercy Corps" (a legitimate humanitarian organization), the Every.org API returns multiple results including:
- **Mercy Corps** (correct - humanitarian crisis response organization)
- **Mercy Healthcare Corp** (incorrect - domestic healthcare provider)

The search results include organizations with similar names, and our filtering logic wasn't sophisticated enough to exclude domestic healthcare providers.

### Why It Happened
1. **Every.org Search Behavior**: The Every.org search API uses fuzzy matching and returns organizations with similar names
2. **Insufficient Filtering**: The `isIrrelevantOrganization()` function in [`every-org-mapper.ts`](frontend/src/utils/every-org-mapper.ts:340) was filtering out:
   - Animal organizations (NTEE code D)
   - Arts/culture/sports organizations (NTEE codes A, N)
   - But NOT domestic healthcare providers

3. **Healthcare vs Humanitarian Healthcare**: There's a critical distinction between:
   - **Domestic healthcare providers**: Hospitals, clinics, medical centers serving local communities
   - **Humanitarian healthcare organizations**: Crisis response, disaster relief, international medical aid (e.g., Doctors Without Borders, Partners In Health)

## The Fix

### Updated Filtering Logic
Added new filtering rules to [`isIrrelevantOrganization()`](frontend/src/utils/every-org-mapper.ts:340):

```typescript
// Exclude domestic healthcare providers that aren't crisis-focused
const domesticHealthcareKeywords = [
  'hospital', 'clinic', 'medical center', 'health system', 'healthcare system',
  'health center', 'medical group', 'physician', 'surgery center',
  'urgent care', 'primary care', 'family medicine', 'pediatric clinic'
];

// Allow if it's clearly humanitarian/crisis-focused
const crisisHealthcareKeywords = [
  'disaster', 'emergency response', 'humanitarian', 'crisis', 'refugee',
  'international', 'global health', 'epidemic', 'pandemic', 'outbreak',
  'conflict', 'war', 'displaced', 'relief', 'aid'
];
```

### How It Works
1. **First Check**: Identifies organizations with domestic healthcare keywords in their name/description
2. **Second Check**: If healthcare keywords are found, checks for crisis/humanitarian keywords
3. **Decision**: 
   - If healthcare keywords found BUT no crisis keywords → **FILTER OUT**
   - If healthcare keywords found AND crisis keywords present → **KEEP** (e.g., Doctors Without Borders)

### Examples

#### Will Be Filtered Out ❌
- "Mercy Healthcare Corp" - domestic hospital system
- "St. Mary's Medical Center" - local hospital
- "Community Health Clinic" - local clinic
- "Family Medicine Associates" - primary care practice

#### Will Be Kept ✅
- "Mercy Corps" - humanitarian crisis response
- "Doctors Without Borders" - international medical aid
- "Partners In Health" - global health crisis response
- "International Medical Corps" - disaster relief healthcare

## Testing

### Manual Test
1. Navigate to the app with the Gaza article
2. The system should now recommend:
   - ✅ Mercy Corps (humanitarian organization)
   - ✅ UNHCR, IRC, CARE, etc.
   - ❌ NOT Mercy Healthcare Corp

### Console Logs
The filtering now logs when it excludes organizations:
```
🚫 Filtering out domestic healthcare provider: Mercy Healthcare Corp
```

## Impact

### Positive Effects
- ✅ More relevant organization recommendations
- ✅ Better user experience - users see only crisis-relevant organizations
- ✅ Maintains legitimate healthcare crisis organizations (MSF, PIH, etc.)

### No Negative Effects
- ✅ Doesn't affect legitimate humanitarian healthcare organizations
- ✅ Doesn't impact other organization types
- ✅ Maintains existing animal/arts/sports filtering

## Related Files
- [`frontend/src/utils/every-org-mapper.ts`](frontend/src/utils/every-org-mapper.ts:340) - Main filtering logic
- [`frontend/src/hooks/use-organizations.tsx`](frontend/src/hooks/use-organizations.tsx:96) - Applies filtering to API results
- [`backend/src/services/every-org.ts`](backend/src/services/every-org.ts:60) - Every.org API integration

## Future Improvements

### Potential Enhancements
1. **NTEE Code Filtering**: Add specific NTEE codes for domestic healthcare (E20-E24) vs international health (Q30)
2. **Machine Learning**: Train a model to classify organizations as crisis-relevant vs not
3. **Whitelist/Blacklist**: Maintain lists of known good/bad organizations
4. **User Feedback**: Allow users to report irrelevant organizations

### Monitoring
- Monitor console logs for filtered organizations
- Track user feedback on organization relevance
- Periodically review filtered organizations to ensure accuracy

## Conclusion
This fix ensures that when searching for humanitarian organizations like "Mercy Corps", the system only returns crisis-relevant organizations and filters out domestic healthcare providers with similar names. The filtering is intelligent enough to distinguish between domestic healthcare and humanitarian healthcare organizations.