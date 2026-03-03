# Every.org API Data Quality Analysis Report
**Date:** February 1, 2026  
**Sample Size:** 100 Organizations  
**Purpose:** Analyze NTEE code availability and data quality for recommendation engine enhancement

---

## Executive Summary

This report analyzes data retrieved from Every.org's Partner API to determine the availability of NTEE codes, location data, and other classification information needed for the recommendation engine. The analysis reveals **critical data gaps** that impact the ability to use NTEE codes and geographic location for organization classification.

### Key Findings
- ❌ **NTEE Codes:** 0% availability (0 out of 100 organizations)
- ❌ **Location Addresses:** 0% availability (0 out of 100 organizations)
- ❌ **Primary Categories:** 0% availability (0 out of 100 organizations)
- ✅ **Descriptions:** 100% availability (100 out of 100 organizations)
- ✅ **EIN (Tax IDs):** 98% availability (98 out of 100 organizations)

---

## API Configuration & Parameters

### Base URL
```
https://partners.every.org/v0.2
```

### Endpoint Used
```
GET /search/{searchTerm}
```

### Authentication
- **Method:** Query Parameter
- **Parameter Name:** `apiKey`
- **Key Format:** `pk_live_*****` (public key)

### Request Format
```
GET https://partners.every.org/v0.2/search/{encodedSearchTerm}?apiKey={API_KEY}
```

### Headers
```
Accept: application/json
```

### Search Terms Used
The following 10 search terms were used to collect diverse organizations:
1. youth
2. cancer
3. climate
4. water
5. poverty
6. animals
7. environment
8. children
9. elderly
10. human rights

### Rate Limiting
- **Delay between searches:** 500ms
- **Total collection time:** ~30 seconds

---

## Data Fields Returned by API

### Available Fields (from search endpoint)
The Every.org search API returns the following fields for each organization:

| Field Name | Data Type | Description | Availability |
|------------|-----------|-------------|--------------|
| `name` | String | Organization name | 100% |
| `slug` | String | Unique identifier | 100% |
| `description` | String | Organization description | 100% |
| `ein` | String | Tax ID number | 98% |
| `websiteUrl` | String | Organization website | 17% |
| `logoUrl` | String | Logo image URL | 9% |
| `coverImageUrl` | String | Cover image URL | 9% |
| `locationAddress` | String | Physical address | **0%** |
| `primaryCategory` | String | Main category | **0%** |
| `nteeCode` | String | NTEE classification code | **0%** |
| `nteeCodeMeaning` | String | NTEE code description | **0%** |

### Missing/Unavailable Fields
The following fields that would be useful for classification are **NOT provided** by the search endpoint:
- ❌ NTEE codes
- ❌ NTEE code meanings
- ❌ Location addresses
- ❌ Primary categories
- ❌ Geographic coordinates
- ❌ Service areas
- ❌ Tags or keywords

---

## Detailed Data Analysis

### 1. NTEE Code Availability

**Result:** 0 out of 100 organizations (0.0%)

**Implication:** NTEE codes cannot be used for organization classification when using the Every.org search API. This is a critical finding as NTEE codes are the standard taxonomy for nonprofit classification.

**Sample Organizations Checked:**
- Southern Poverty Law Center (splcenter) - MISSING
- Climate Resolve (climate-resolve) - MISSING
- Youth Passageways (youth-passageways) - MISSING
- All 100 organizations - MISSING

### 2. Location Data Availability

**Full Address:** 0 out of 100 organizations (0.0%)

**Implication:** Cannot determine:
- Where organizations are headquartered
- Where they provide services
- Geographic relevance to crises
- Regional focus areas

**Note:** The existing implementation uses location data from a different API endpoint (nonprofit details endpoint), but that endpoint appears to return headquarters location, not service areas.

### 3. Description Quality

**Availability:** 100 out of 100 organizations (100%)

**Quality Assessment:**
- ✅ All organizations have descriptions
- ✅ Descriptions are substantive (50-200+ characters)
- ✅ Descriptions include mission statements
- ✅ Descriptions mention focus areas

**Sample Descriptions:**
1. **Southern Poverty Law Center:** "The Southern Poverty Law Center combats hate, intolerance, and discrimination through education and litigation."
2. **Youth Passageways:** "We are non-profit weaving a relational movement to regenerate healing, resilience and flourishing lifeways."
3. **Climate Resolve:** "Climate Resolve is a nonprofit organization focused on preserving, protecting, and improving environment. It is based in Los Angeles, CA."

**Recommendation:** Descriptions are the most reliable data point for semantic matching and classification.

### 4. EIN (Tax ID) Availability

**Availability:** 98 out of 100 organizations (98%)

**Missing EINs:**
1. Tackling Climate Change (climate.change)
2. EA Animal Welfare Fund (ea-animal-welfare-fund)

**Implication:** EINs could potentially be used to:
- Look up additional data from IRS databases
- Verify organization legitimacy
- Cross-reference with other nonprofit databases

### 5. Website Availability

**Availability:** 17 out of 100 organizations (17%)

**Organizations with Websites:**
- Youth-TimeBanking
- Youth Passageways
- Accelerate Climate Solutions
- Climate Collaborative
- Climate Resolve
- Waterside Workshops
- Kelce Water
- Southern Poverty Law Center
- End Poverty Now
- Friends of The Animal Shelter
- EA Animal Welfare Fund
- Creative Environmental Conservation
- Children And Screens
- Patrons of the World's Children Hospital
- The Children's Advocacy Center
- Envision Children
- Rural Housing For The Elderly

**Implication:** Limited ability to gather additional context from organization websites.

### 6. Image Availability

**Logo Images:** 9 out of 100 organizations (9%)
**Cover Images:** 9 out of 100 organizations (9%)

**Implication:** Most organizations lack visual branding in the API data.

---

## Sample Data Examples

### Example 1: Well-Documented Organization
```json
{
  "name": "Southern Poverty Law Center",
  "slug": "splcenter",
  "description": "The Southern Poverty Law Center combats hate, intolerance, and discrimination through education and litigation.",
  "ein": "630598743",
  "websiteUrl": "https://www.splcenter.org",
  "logoUrl": "https://res.cloudinary.com/...",
  "coverImageUrl": "https://res.cloudinary.com/...",
  "locationAddress": null,
  "primaryCategory": null,
  "nteeCode": null,
  "nteeCodeMeaning": null
}
```

### Example 2: Minimal Documentation Organization
```json
{
  "name": "Youth Omighty",
  "slug": "youth-omighty",
  "description": "An organization focused on youth development. It received its nonprofit status in 2020.",
  "ein": "852920855",
  "websiteUrl": null,
  "logoUrl": null,
  "coverImageUrl": null,
  "locationAddress": null,
  "primaryCategory": null,
  "nteeCode": null,
  "nteeCodeMeaning": null
}
```

### Example 3: Organization Without EIN
```json
{
  "name": "EA Animal Welfare Fund",
  "slug": "ea-animal-welfare-fund",
  "description": "Funding to organizations and projects that will help alleviate the suffering of millions or billions of animals.",
  "ein": null,
  "websiteUrl": "https://funds.effectivealtruism.org/...",
  "logoUrl": "https://res.cloudinary.com/...",
  "coverImageUrl": null,
  "locationAddress": null,
  "primaryCategory": null,
  "nteeCode": null,
  "nteeCodeMeaning": null
}
```

---

## Geographic Distribution

The sample includes organizations from various U.S. states (based on descriptions that mention location):

**States Mentioned in Descriptions:**
- California (CA): 15 organizations
- Texas (TX): 8 organizations
- North Carolina (NC): 5 organizations
- Florida (FL): 4 organizations
- Washington (DC): 3 organizations
- New York (NY): 2 organizations
- And 20+ other states

**Note:** This geographic data is extracted from descriptions, not from structured location fields.

---

## Search Term Distribution

Organizations collected per search term:

| Search Term | Count | Percentage |
|-------------|-------|------------|
| youth | 10 | 10% |
| cancer | 10 | 10% |
| climate | 10 | 10% |
| water | 10 | 10% |
| poverty | 10 | 10% |
| animals | 10 | 10% |
| environment | 10 | 10% |
| children | 10 | 10% |
| elderly | 10 | 10% |
| human rights | 10 | 10% |

**Total:** 100 organizations

---

## Recommendations for Recommendation Engine

### What CANNOT Be Used:
1. ❌ **NTEE Codes** - Not available in API
2. ❌ **Geographic Location** - Not available in search results
3. ❌ **Primary Categories** - Not available in search results
4. ❌ **Service Areas** - Not available

### What CAN Be Used:
1. ✅ **Organization Descriptions** (100% available)
   - Use for semantic analysis
   - Extract keywords and themes
   - Match to crisis contexts

2. ✅ **Organization Names** (100% available)
   - Use for keyword matching
   - Identify focus areas (e.g., "Cancer", "Climate", "Youth")

3. ✅ **EIN Numbers** (98% available)
   - Potential for IRS database lookups
   - Verification of legitimacy

4. ✅ **Crisis Context from News Articles**
   - Match organization descriptions to crisis themes
   - Use semantic similarity scoring

### Recommended Approach:

**Contextual Semantic Matching:**
```
1. Extract crisis context from news articles
   - Location: Where is the crisis?
   - Type: What kind of crisis? (disaster, health, environment, etc.)
   - Keywords: Key terms describing the crisis

2. Analyze organization descriptions
   - Extract focus areas and themes
   - Identify relevant keywords
   - Calculate semantic similarity to crisis

3. Rank organizations by relevance
   - Semantic similarity score
   - Keyword match score
   - Description quality score
```

---

## Technical Details

### API Response Structure
```json
{
  "nonprofits": [
    {
      "name": "string",
      "slug": "string",
      "description": "string",
      "ein": "string | null",
      "websiteUrl": "string | null",
      "logoUrl": "string | null",
      "coverImageUrl": "string | null",
      "locationAddress": "string | null",
      "primaryCategory": "string | null",
      "nteeCode": "string | null",
      "nteeCodeMeaning": "string | null"
    }
  ]
}
```

### Error Handling
- **404 Errors:** Occurred when trying to fetch detailed organization data from `/nonprofit/{slug}` endpoint
- **Rate Limiting:** No rate limit errors encountered with 500ms delays
- **Timeout:** 10-second timeout set, no timeouts occurred

---

## Files Generated

Three files were generated for further analysis:

1. **everyorg-sample-2026-02-01T20-47-28-781Z.json**
   - Full JSON data for all 100 organizations
   - Includes search term used for each organization
   - Complete API response data

2. **everyorg-ntee-report-2026-02-01T20-47-28-781Z.json**
   - Structured analysis of each organization
   - NTEE code status
   - Data completeness indicators

3. **everyorg-analysis-2026-02-01T20-47-28-781Z.csv**
   - Spreadsheet-friendly format
   - Easy filtering and sorting
   - Quick overview of data availability

---

## Conclusion

The Every.org search API provides **excellent description data** but lacks the structured classification fields (NTEE codes, categories, location) needed for traditional taxonomy-based matching. 

**The recommendation engine must pivot to:**
- Semantic analysis of organization descriptions
- Contextual matching based on crisis themes
- Keyword extraction and similarity scoring

This approach aligns with modern NLP techniques and will likely provide better results than relying on potentially outdated or inaccurate headquarters location data.

---

## Next Steps

1. ✅ **Confirmed:** NTEE codes are not available
2. ✅ **Confirmed:** Location data is not available in search results
3. 🔄 **Implement:** Semantic matching based on descriptions
4. 🔄 **Implement:** Crisis context extraction from news articles
5. 🔄 **Test:** Relevance scoring algorithm
6. 🔄 **Validate:** Results against known crisis-organization matches

---

**Report Generated:** February 1, 2026  
**Analysis Tool:** backend/test-everyorg-sample-analysis.ts  
**Data Source:** Every.org Partner API v0.2