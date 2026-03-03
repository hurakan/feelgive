# Every.org API Field Analysis

## Executive Summary

**Key Finding**: Every.org's Search API returns a `location` field with **100% coverage** in format `"CITY, STATE"` (for US orgs) that we're currently NOT using. We've been looking for `locationAddress` which doesn't exist in search results.

**Impact**: This explains why all 120 orgs are classified as "Unknown" - we're checking the wrong field name.

---

## Search API Response Structure

### Available Fields (100% Coverage)

| Field | Type | Coverage | Example Values |
|-------|------|----------|----------------|
| `description` | string | 100% | "Nigerian International Humanitarian Foundation..." |
| `ein` | string | 100% | "471618450" |
| `name` | string | 100% | "Nigerian International Humanitarian Foundation..." |
| `profileUrl` | string | 100% | "https://www.every.org/nigerian-international..." |
| `slug` | string | 100% | "nigerian-international-humanitarian-foundation..." |
| **`location`** | **string** | **100%** | **"LYNN, MA"**, **"AUSTIN, TX"**, **"ROCKWALL, TX"** |
| `hasAdmin` | boolean | 100% | false |
| `donationsEnabled` | boolean | 100% | true |

### Optional Fields

| Field | Type | Coverage | Example Values |
|-------|------|----------|----------------|
| `tags` | string[] | 70% | ["humans"], ["christianity","religion"] |
| `matchedTerms` | string[] | 100% | ["nigerian","humanitarian"], [] |

---

## Critical Discovery: Location Field

### What We're Currently Doing (WRONG)

```typescript
// In everyorg/client.ts line 184
locationAddress: org.locationAddress,  // ❌ This field doesn't exist in search API!
```

```typescript
// In orchestrator.ts line 434
const location = candidate.locationAddress?.toLowerCase() || '';  // ❌ Always empty!
```

### What We Should Be Doing (CORRECT)

```typescript
// Search API returns 'location' not 'locationAddress'
location: org.location,  // ✅ This field exists with 100% coverage!
```

---

## Sample Data from "Nigeria humanitarian" Query

### Organization 1: Nigerian International Humanitarian Foundation Of New England Inc
```json
{
  "description": "Nigerian International Humanitarian Foundation Of New England Inc is a nonprofit organization focused on providing human services. It is based in Lynn, MA. It received its nonprofit status in 2014.",
  "ein": "471618450",
  "name": "Nigerian International Humanitarian Foundation Of New England Inc",
  "profileUrl": "https://www.every.org/nigerian-international-humanitarian-foundation-of-new-england-inc",
  "matchedTerms": ["nigerian", "humanitarian"],
  "slug": "nigerian-international-humanitarian-foundation-of-new-england-inc",
  "location": "LYNN, MA",  // ✅ This is what we need!
  "hasAdmin": false,
  "tags": ["humans"],
  "donationsEnabled": true
}
```

### Organization 2: Nigeria Gives
```json
{
  "description": "An organization focused on international issues. It received its nonprofit status in 2023.",
  "ein": "833527949",
  "name": "Nigeria Gives",
  "profileUrl": "https://www.every.org/nigeria-gives",
  "matchedTerms": [],
  "slug": "nigeria-gives",
  "location": "AUSTIN, TX",  // ✅ This is what we need!
  "hasAdmin": false,
  "donationsEnabled": true
}
```

### Organization 3: We Go - Nigeria
```json
{
  "description": "We Go - Nigeria is a nonprofit religious or spiritual organization. It is based in Rockwall, TX. It received its nonprofit status in 2019.",
  "ein": "834352696",
  "name": "We Go - Nigeria",
  "profileUrl": "https://www.every.org/we-go-nigeria",
  "matchedTerms": [],
  "slug": "we-go-nigeria",
  "location": "ROCKWALL, TX",  // ✅ This is what we need!
  "hasAdmin": false,
  "tags": ["christianity", "religion"],
  "donationsEnabled": true
}
```

---

## Location Field Format Analysis

### All 10 Organizations from Test Query

| Organization | Location Field | City | State | Country |
|--------------|----------------|------|-------|---------|
| Nigerian International Humanitarian Foundation | `LYNN, MA` | Lynn | Massachusetts | USA |
| Nigeria Gives | `AUSTIN, TX` | Austin | Texas | USA |
| We Go - Nigeria | `ROCKWALL, TX` | Rockwall | Texas | USA |
| Nigeria Peoples Alliance Inc | `RIVERDALE, GA` | Riverdale | Georgia | USA |
| Bridges To Nigeria | `MURRAY, UT` | Murray | Utah | USA |
| Save Nigeria Group Usa Inc | `WORTHINGTON, MN` | Worthington | Minnesota | USA |
| Nigeria Soccer Federation Inc | `RICHARDSON, TX` | Richardson | Texas | USA |
| Across Nigeria | `NEW HARTFORD, CT` | New Hartford | Connecticut | USA |
| Help Nigeria | `WASHINGTON, MI` | Washington | Michigan | USA |
| Kidsake Nigeria | `KATY, TX` | Katy | Texas | USA |

### Format Pattern

**Consistent Format**: `"CITY, STATE_CODE"`
- All uppercase
- City name (may have spaces)
- Comma separator
- 2-letter US state code

**Coverage**: 100% of results have this field populated

---

## Why Our Current Code Fails

### Problem 1: Wrong Field Name

**Current Code** (`everyorg/client.ts` line 184):
```typescript
locationAddress: org.locationAddress,  // ❌ Field doesn't exist
```

**What Every.org Returns**:
```typescript
location: "LYNN, MA"  // ✅ This is the actual field name
```

### Problem 2: Field Mapping Mismatch

**Our Interface** (`everyorg/client.ts` lines 6-20):
```typescript
export interface NonprofitCandidate {
  slug: string;
  name: string;
  description: string;
  ein?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  locationAddress?: string;  // ❌ Wrong field name
  primaryCategory?: string;
  nteeCode?: string;
  nteeCodeMeaning?: string;
  tags?: string[];
  causes?: string[];
}
```

**What We Should Have**:
```typescript
export interface NonprofitCandidate {
  slug: string;
  name: string;
  description: string;
  ein?: string;
  location?: string;  // ✅ Correct field name from search API
  // ... other fields
}
```

### Problem 3: Extraction Logic Fails

**Current Code** (`orchestrator.ts` line 434):
```typescript
const location = candidate.locationAddress?.toLowerCase() || '';
// locationAddress is undefined → location = ''
// Empty string doesn't match any regex patterns
// Returns country: 'Unknown'
```

---

## The Fix

### Step 1: Update NonprofitCandidate Interface

```typescript
export interface NonprofitCandidate {
  slug: string;
  name: string;
  description: string;
  ein?: string;
  location?: string;  // ✅ Add this (from search API)
  locationAddress?: string;  // Keep for backward compatibility (from details API)
  // ... other fields
}
```

### Step 2: Update Client Transformation

```typescript
private transformNonprofits(nonprofits: any[]): NonprofitCandidate[] {
  return nonprofits.map(org => ({
    slug: org.slug || '',
    name: org.name || '',
    description: org.description || '',
    ein: org.ein,
    location: org.location,  // ✅ Map the correct field
    locationAddress: org.locationAddress,  // Keep for details API
    // ... other fields
  }));
}
```

### Step 3: Update Extraction Logic

```typescript
private extractOrgGeo(candidate: NonprofitCandidate): NormalizedGeo {
  // Try 'location' field first (from search API)
  const locationStr = candidate.location || candidate.locationAddress || '';
  
  // Parse "CITY, STATE" format
  if (locationStr.includes(',')) {
    const parts = locationStr.split(',').map(p => p.trim());
    
    // US format: "CITY, STATE_CODE"
    if (parts.length === 2 && parts[1].length === 2) {
      return normalizeOrgLocation({
        country: 'United States',
        admin1: parts[1],  // State code (e.g., "MA", "TX")
        city: parts[0],
      });
    }
  }
  
  // Fallback to regex patterns for other formats
  // ...
}
```

---

## Expected Impact of Fix

### Before Fix
```
120 candidates from Every.org
  ↓
120 orgs → location field ignored (checking wrong field name)
  ↓
120 orgs → country: 'Unknown'
  ↓
120 orgs → GeoMatchLevel.GLOBAL (score: 0.3)
  ↓
Geographic filtering fails
```

### After Fix
```
120 candidates from Every.org
  ↓
120 orgs → location field parsed ("LYNN, MA" → USA, MA)
  ↓
~10 orgs → country: 'United States', admin1: 'MA/TX/GA/etc'
  ↓
~10 orgs → GeoMatchLevel varies (MISMATCH for US orgs on Nigeria article)
  ↓
Geographic filtering works correctly
  ↓
US-based orgs filtered out for Nigeria article ✅
```

---

## Additional Observations

### 1. All Results Are US-Based Organizations

**Finding**: For "Nigeria humanitarian" query, all 10 results are US-based nonprofits that work on Nigeria-related causes.

**Implication**: 
- These orgs are registered in the US (hence US locations)
- They operate in Nigeria (hence matching "Nigeria" query)
- Geographic filtering SHOULD filter them out for Nigeria articles
- We want Nigeria-based orgs, not US orgs working in Nigeria

### 2. Organization Names Contain Geographic Hints

Many org names include "Nigeria":
- "Nigerian International Humanitarian Foundation"
- "Nigeria Gives"
- "We Go - Nigeria"
- "Bridges To Nigeria"

**Potential Enhancement**: Use org name as additional geographic signal when location data is ambiguous.

### 3. Description Field Contains Location Info

Example: "It is based in Lynn, MA"

**Potential Enhancement**: Parse descriptions for location mentions as fallback.

### 4. Tags Field Has Limited Coverage

Only 70% of orgs have tags, and they're mostly cause-related ("humans", "christianity"), not geographic.

---

## Recommended Solution

### Immediate Fix (5 minutes)

1. Change `locationAddress` to `location` in client transformation
2. Update extraction logic to parse "CITY, STATE" format
3. Test with Nigeria query

**Expected Result**: All 10 US-based orgs will be correctly identified as United States → MISMATCH for Nigeria article → filtered out ✅

### Why This Solves the Nigeria → Thailand Bug

**Current Behavior**:
- All orgs (including Thailand org) → Unknown → GLOBAL → pass filter
- Thailand org shows up for Nigeria article ❌

**After Fix**:
- Thailand org → location: "BANGKOK, TH" or similar
- Parse as Thailand → MISMATCH for Nigeria → filtered out ✅
- US orgs → United States → MISMATCH for Nigeria → filtered out ✅
- Only Nigeria-based orgs pass filter ✅

---

## Next Steps

1. **Implement the fix** (update 3 files)
2. **Test with Nigeria query** (verify US orgs filtered out)
3. **Test with other queries** (Gaza, Turkey, etc.)
4. **Monitor for non-US location formats** (may need additional parsing logic)

---

## Open Questions

1. **Do non-US orgs use different location format?**
   - Need to test with international queries
   - May need to handle formats like "LONDON, UK" or "NAIROBI, KE"

2. **What about truly global organizations?**
   - Red Cross, UNICEF, etc.
   - May not have specific location or may say "GLOBAL"
   - Need to handle these specially

3. **Should we use org name as geographic signal?**
   - "Nigeria Gives" → implies Nigeria operations
   - But registered in Austin, TX
   - Could boost relevance score even if US-based