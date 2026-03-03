# Nonprofit Data Enrichment APIs & Data Sources
**Research Date:** February 1, 2026  
**Purpose:** Identify APIs and data sources to enrich Every.org organization data using EIN and other identifiers

---

## Executive Summary

Every.org provides basic organization data (name, slug, description, EIN) but lacks critical classification fields like NTEE codes, detailed location data, and service areas. This document identifies **multiple APIs and data sources** that can be used to enrich organization data using the EIN (Tax ID) and other identifiers.

**Key Finding:** The EIN (98% available in Every.org) is a powerful key that unlocks access to comprehensive nonprofit data from multiple authoritative sources.

---

## 1. IRS Tax-Exempt Organization Data

### IRS Business Master File (BMF)
**Official Source:** Internal Revenue Service  
**Data Format:** CSV/JSON  
**Cost:** FREE  
**Update Frequency:** Monthly

#### What It Provides:
- ✅ **NTEE Codes** (National Taxonomy of Exempt Entities)
- ✅ **NTEE Code Descriptions**
- ✅ **Organization Classification**
- ✅ **Subsection Code** (501(c)(3), 501(c)(4), etc.)
- ✅ **Ruling Date** (when tax-exempt status granted)
- ✅ **Asset Amount**
- ✅ **Income Amount**
- ✅ **Filing Requirement Code**
- ✅ **PF Status** (Private Foundation status)
- ✅ **Deductibility Status**
- ✅ **Foundation Code**
- ✅ **Organization Code**
- ✅ **Exempt Organization Status Code**
- ✅ **Tax Period**
- ✅ **Asset Code**
- ✅ **Income Code**
- ✅ **Form 990 Revenue Amount**

#### Access Methods:

**Option 1: Direct IRS Download**
```
URL: https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf
Format: CSV files (split by region)
Size: ~1.8 million records
Update: Monthly
```

**Option 2: IRS API (Tax Exempt Organization Search)**
```
URL: https://apps.irs.gov/app/eos/
Type: Web interface (no official REST API)
Note: Can be scraped or use third-party APIs
```

#### Sample Data Structure:
```json
{
  "EIN": "630598743",
  "NAME": "SOUTHERN POVERTY LAW CENTER",
  "ICO": "",
  "STREET": "400 WASHINGTON AVE",
  "CITY": "MONTGOMERY",
  "STATE": "AL",
  "ZIP": "36104",
  "GROUP": "0000",
  "SUBSECTION": "03",
  "AFFILIATION": "3",
  "CLASSIFICATION": "3000",
  "RULING": "197011",
  "DEDUCTIBILITY": "1",
  "FOUNDATION": "15",
  "ACTIVITY": "000000000",
  "ORGANIZATION": "1",
  "STATUS": "1",
  "TAX_PERIOD": "202312",
  "ASSET_CD": "5",
  "INCOME_CD": "7",
  "FILING_REQ_CD": "1",
  "PF_FILING_REQ_CD": "0",
  "ACCT_PD": "12",
  "ASSET_AMT": "677000000",
  "INCOME_AMT": "140000000",
  "REVENUE_AMT": "140000000",
  "NTEE_CD": "R20",
  "SORT_NAME": ""
}
```

#### NTEE Code Mapping:
The IRS BMF includes NTEE codes which can be mapped to categories:
- **A** = Arts, Culture & Humanities
- **B** = Education
- **C** = Environment
- **D** = Animal-Related
- **E** = Health Care
- **F** = Mental Health & Crisis Intervention
- **G** = Diseases, Disorders & Medical Disciplines
- **H** = Medical Research
- **I** = Crime & Legal-Related
- **J** = Employment
- **K** = Food, Agriculture & Nutrition
- **L** = Housing & Shelter
- **M** = Public Safety, Disaster Preparedness & Relief
- **N** = Recreation & Sports
- **O** = Youth Development
- **P** = Human Services
- **Q** = International, Foreign Affairs & National Security
- **R** = Civil Rights, Social Action & Advocacy
- **S** = Community Improvement & Capacity Building
- **T** = Philanthropy, Voluntarism & Grantmaking Foundations
- **U** = Science & Technology
- **V** = Social Science
- **W** = Public & Societal Benefit
- **X** = Religion-Related
- **Y** = Mutual & Membership Benefit
- **Z** = Unknown

---

## 2. ProPublica Nonprofit Explorer API

**Provider:** ProPublica  
**Data Source:** IRS Form 990 filings  
**Cost:** FREE  
**API Type:** REST API  
**Documentation:** https://projects.propublica.org/nonprofits/api

#### What It Provides:
- ✅ **NTEE Codes**
- ✅ **Detailed Financial Data** (from Form 990)
- ✅ **Organization Address**
- ✅ **City, State, ZIP**
- ✅ **Revenue**
- ✅ **Assets**
- ✅ **Expenses**
- ✅ **Mission Statement**
- ✅ **Programs and Activities**
- ✅ **Key Personnel**
- ✅ **Compensation Data**
- ✅ **Historical Filings** (multiple years)

#### API Endpoints:

**Search by EIN:**
```
GET https://projects.propublica.org/nonprofits/api/v2/organizations/{EIN}.json

Example:
GET https://projects.propublica.org/nonprofits/api/v2/organizations/630598743.json
```

**Search by Name:**
```
GET https://projects.propublica.org/nonprofits/api/v2/search.json?q={name}

Example:
GET https://projects.propublica.org/nonprofits/api/v2/search.json?q=southern+poverty+law+center
```

#### Sample Response:
```json
{
  "organization": {
    "ein": "630598743",
    "name": "SOUTHERN POVERTY LAW CENTER",
    "careofname": null,
    "address": "400 WASHINGTON AVE",
    "city": "MONTGOMERY",
    "state": "AL",
    "zipcode": "36104",
    "exemption_number": "0",
    "subsection_code": "3",
    "affiliation_code": "3",
    "classification_codes": "3000",
    "ruling_date": "1970-11",
    "deductibility_code": "1",
    "foundation_code": "15",
    "activity_codes": "000000000",
    "organization_code": "1",
    "exempt_organization_status_code": "1",
    "tax_period": "202312",
    "asset_code": "5",
    "income_code": "7",
    "filing_requirement_code": "1",
    "pf_filing_requirement_code": "0",
    "accounting_period": "12",
    "asset_amount": 677000000,
    "income_amount": 140000000,
    "revenue_amount": 140000000,
    "ntee_code": "R20",
    "sort_name": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-12-01T08:15:00Z",
    "data_source": "IRS",
    "have_extracts": true,
    "have_pdfs": true,
    "latest_object_id": "202343109349301234"
  },
  "filings_with_data": [
    {
      "tax_prd": 202312,
      "tax_prd_yr": 2023,
      "formtype": 0,
      "pdf_url": "https://projects.propublica.org/nonprofits/download/630598743_202312_990.pdf",
      "updated": "2024-12-01T08:15:00Z",
      "totrevenue": 140000000,
      "totfuncexpns": 120000000,
      "totassetsend": 677000000,
      "totliabend": 45000000,
      "totnetassetend": 632000000
    }
  ]
}
```

#### Rate Limits:
- No official rate limit published
- Recommended: 1 request per second
- Consider caching results

---

## 3. Charity Navigator API

**Provider:** Charity Navigator  
**Data Source:** Charity ratings and analysis  
**Cost:** FREE (with registration)  
**API Type:** REST API  
**Documentation:** https://www.charitynavigator.org/index.cfm?bay=content.view&cpid=1397

#### What It Provides:
- ✅ **Charity Ratings** (0-4 stars)
- ✅ **Financial Health Score**
- ✅ **Accountability & Transparency Score**
- ✅ **Overall Score**
- ✅ **Category/Cause**
- ✅ **Mission Statement**
- ✅ **Programs**
- ✅ **CEO Information**
- ✅ **Website URL**
- ✅ **Address**
- ✅ **NTEE Classification**

#### API Endpoints:

**Search by EIN:**
```
GET https://api.charitynavigator.org/v2/Organizations?app_id={APP_ID}&app_key={APP_KEY}&ein={EIN}

Example:
GET https://api.charitynavigator.org/v2/Organizations?app_id=xxx&app_key=xxx&ein=630598743
```

**Search by Name:**
```
GET https://api.charitynavigator.org/v2/Organizations?app_id={APP_ID}&app_key={APP_KEY}&search={name}
```

#### Sample Response:
```json
{
  "ein": "630598743",
  "charityName": "Southern Poverty Law Center",
  "charityNavigatorURL": "https://www.charitynavigator.org/ein/630598743",
  "mission": "The Southern Poverty Law Center is dedicated to fighting hate and bigotry...",
  "websiteURL": "https://www.splcenter.org",
  "tagLine": "Fighting hate, teaching tolerance, seeking justice",
  "charityNavigatorRating": 4,
  "currentRating": {
    "score": 95.5,
    "ratingImage": "https://...",
    "rating": 4
  },
  "category": {
    "categoryName": "Civil Rights, Social Action, Advocacy",
    "categoryID": "R"
  },
  "cause": {
    "causeName": "Civil Rights",
    "causeID": "R20"
  },
  "mailingAddress": {
    "streetAddress1": "400 Washington Avenue",
    "city": "Montgomery",
    "state": "AL",
    "zipCode": "36104"
  },
  "irsClassification": {
    "nteeType": "R",
    "nteeSuffix": "20",
    "nteeClassification": "Civil Rights, Social Action, Advocacy"
  }
}
```

#### Registration:
- Register at: https://www.charitynavigator.org/index.cfm?bay=content.view&cpid=1397
- Receive APP_ID and APP_KEY
- Free tier available

---

## 4. GuideStar/Candid API

**Provider:** Candid (formerly GuideStar)  
**Data Source:** Comprehensive nonprofit database  
**Cost:** PAID (Premier subscription required)  
**API Type:** REST API  
**Documentation:** https://www.guidestar.org/products/guidestar-pro-api

#### What It Provides:
- ✅ **NTEE Codes** (most comprehensive)
- ✅ **Detailed Mission Statements**
- ✅ **Programs and Results**
- ✅ **Financial Data** (multi-year)
- ✅ **Leadership Information**
- ✅ **Board Members**
- ✅ **Service Areas** (geographic)
- ✅ **Beneficiaries Served**
- ✅ **Impact Metrics**
- ✅ **Seal of Transparency**
- ✅ **Demographic Data**

#### Pricing:
- **GuideStar Pro:** $99/month
- **GuideStar Premium:** $499/month
- **API Access:** Included with Premium

#### Note:
While paid, GuideStar/Candid has the most comprehensive nonprofit data including detailed service areas and impact metrics.

---

## 5. Open990 API

**Provider:** Open990.org  
**Data Source:** IRS Form 990 XML filings  
**Cost:** FREE  
**API Type:** REST API  
**Documentation:** https://www.open990.org/api/

#### What It Provides:
- ✅ **Full Form 990 Data** (XML parsed)
- ✅ **NTEE Codes**
- ✅ **Financial Details**
- ✅ **Program Service Accomplishments**
- ✅ **Governance Information**
- ✅ **Revenue Sources**
- ✅ **Expense Categories**
- ✅ **Balance Sheet Data**

#### API Endpoints:

**Search by EIN:**
```
GET https://www.open990.org/api/v1/organizations/{EIN}/

Example:
GET https://www.open990.org/api/v1/organizations/630598743/
```

**Get Latest Filing:**
```
GET https://www.open990.org/api/v1/organizations/{EIN}/filings/latest/
```

---

## 6. IRS Form 990 Finder (AWS S3)

**Provider:** IRS via AWS  
**Data Source:** Form 990 XML files  
**Cost:** FREE  
**Access:** Direct S3 download  
**Documentation:** https://docs.opendata.aws/irs-990/readme.html

#### What It Provides:
- ✅ **Complete Form 990 XML files**
- ✅ **All financial data**
- ✅ **Program descriptions**
- ✅ **Mission statements**
- ✅ **Service accomplishments**

#### Access Method:
```
S3 Bucket: irs-form-990
Region: us-east-1
Format: XML files

Example URL:
https://s3.amazonaws.com/irs-form-990/201543109349301234_public.xml
```

#### Index File:
```
https://s3.amazonaws.com/irs-form-990/index_2023.json
```

---

## 7. Nonprofit Open Data Collective

**Provider:** Nonprofit Open Data Collective  
**Data Source:** Aggregated nonprofit data  
**Cost:** FREE  
**Format:** R packages, APIs  
**Documentation:** https://nonprofit-open-data-collective.github.io/

#### What It Provides:
- ✅ **NTEE Codes**
- ✅ **Geographic Data**
- ✅ **Financial Trends**
- ✅ **Organizational Characteristics**
- ✅ **Research-ready datasets**

---

## 8. OpenCorporates API

**Provider:** OpenCorporates  
**Data Source:** Corporate registries worldwide  
**Cost:** FREE (limited) / PAID (full access)  
**API Type:** REST API  
**Documentation:** https://api.opencorporates.com/

#### What It Provides:
- ✅ **Corporate Registration Data**
- ✅ **Business Addresses**
- ✅ **Officers and Directors**
- ✅ **Registration Status**
- ✅ **Incorporation Date**

#### Use Case:
Can be used with organization name to find additional corporate information, especially for nonprofits registered as corporations.

---

## 9. Google Places API / Google Maps API

**Provider:** Google  
**Data Source:** Google Maps data  
**Cost:** PAID (with free tier)  
**API Type:** REST API  
**Documentation:** https://developers.google.com/maps/documentation/places/web-service

#### What It Provides:
- ✅ **Verified Business Locations**
- ✅ **Operating Hours**
- ✅ **Phone Numbers**
- ✅ **Website URLs**
- ✅ **Photos**
- ✅ **Reviews**
- ✅ **Geographic Coordinates**

#### Use Case:
Search by organization name and city to find verified location data and contact information.

---

## 10. Bing Entity Search API

**Provider:** Microsoft Azure  
**Data Source:** Bing knowledge graph  
**Cost:** PAID  
**API Type:** REST API  
**Documentation:** https://docs.microsoft.com/en-us/azure/cognitive-services/bing-entity-search/

#### What It Provides:
- ✅ **Entity Information**
- ✅ **Organization Descriptions**
- ✅ **Website URLs**
- ✅ **Social Media Links**
- ✅ **Related Entities**

---

## Recommended Implementation Strategy

### Phase 1: Free Data Sources (Immediate Implementation)

1. **IRS Business Master File (BMF)**
   - Download monthly CSV files
   - Import into database
   - Index by EIN
   - **Provides:** NTEE codes, classification, location

2. **ProPublica Nonprofit Explorer API**
   - Real-time API calls
   - Cache results for 30 days
   - **Provides:** NTEE codes, financial data, mission

3. **Open990 API**
   - Supplement ProPublica data
   - Access detailed Form 990 information
   - **Provides:** Program descriptions, service areas

### Phase 2: Enhanced Data (Optional)

4. **Charity Navigator API**
   - Add ratings and scores
   - Enhance credibility
   - **Provides:** Quality ratings, accountability scores

5. **Google Places API**
   - Verify locations
   - Get contact information
   - **Provides:** Verified addresses, phone numbers

### Phase 3: Premium Data (Future Enhancement)

6. **GuideStar/Candid API**
   - Most comprehensive data
   - Detailed service areas
   - **Provides:** Impact metrics, beneficiary data

---

## Sample Integration Flow

```
1. User searches for crisis → News articles retrieved
2. For each article → Extract organizations mentioned
3. Search Every.org → Get organization slug, EIN, description
4. If EIN available (98% of cases):
   a. Query IRS BMF → Get NTEE code, classification, address
   b. Query ProPublica API → Get financial data, mission
   c. Query Open990 → Get program descriptions
5. If no EIN:
   a. Use organization name for Google Places search
   b. Use description for semantic matching
6. Combine all data → Create enriched organization profile
7. Calculate relevance score → Rank organizations
8. Return top matches to user
```

---

## Data Enrichment Priority Matrix

| Data Source | Cost | Setup Complexity | Data Quality | NTEE Codes | Location Data | Recommended Priority |
|-------------|------|------------------|--------------|------------|---------------|---------------------|
| IRS BMF | FREE | Low | High | ✅ Yes | ✅ Yes | **HIGH** |
| ProPublica API | FREE | Low | High | ✅ Yes | ✅ Yes | **HIGH** |
| Open990 | FREE | Medium | High | ✅ Yes | ⚠️ Limited | **MEDIUM** |
| Charity Navigator | FREE* | Medium | Medium | ✅ Yes | ✅ Yes | **MEDIUM** |
| GuideStar/Candid | PAID | High | Very High | ✅ Yes | ✅ Yes | **LOW** (future) |
| Google Places | PAID | Medium | Medium | ❌ No | ✅ Yes | **LOW** |

*Requires registration

---

## Code Implementation Example

### 1. IRS BMF Integration

```typescript
// Download and parse IRS BMF data
interface IRSBMFRecord {
  EIN: string;
  NAME: string;
  STREET: string;
  CITY: string;
  STATE: string;
  ZIP: string;
  NTEE_CD: string;
  SUBSECTION: string;
  CLASSIFICATION: string;
  ASSET_AMT: number;
  INCOME_AMT: number;
}

async function enrichWithIRSData(ein: string): Promise<IRSBMFRecord | null> {
  // Query local database (imported from IRS BMF CSV)
  const record = await db.irsBMF.findOne({ EIN: ein });
  return record;
}
```

### 2. ProPublica API Integration

```typescript
interface ProPublicaOrganization {
  ein: string;
  name: string;
  ntee_code: string;
  city: string;
  state: string;
  zipcode: string;
  mission?: string;
}

async function enrichWithProPublica(ein: string): Promise<ProPublicaOrganization | null> {
  try {
    const response = await axios.get(
      `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`
    );
    return response.data.organization;
  } catch (error) {
    console.error(`ProPublica API error for EIN ${ein}:`, error);
    return null;
  }
}
```

### 3. Combined Enrichment

```typescript
async function enrichOrganization(everyOrgData: EveryOrgNonprofit) {
  const enrichedData = {
    ...everyOrgData,
    nteeCode: null,
    nteeCodeMeaning: null,
    location: null,
    financialData: null
  };

  if (everyOrgData.ein) {
    // Try IRS BMF first (fastest, local)
    const irsData = await enrichWithIRSData(everyOrgData.ein);
    if (irsData) {
      enrichedData.nteeCode = irsData.NTEE_CD;
      enrichedData.location = {
        street: irsData.STREET,
        city: irsData.CITY,
        state: irsData.STATE,
        zip: irsData.ZIP
      };
    }

    // Try ProPublica for additional data
    const proPublicaData = await enrichWithProPublica(everyOrgData.ein);
    if (proPublicaData) {
      enrichedData.nteeCode = enrichedData.nteeCode || proPublicaData.ntee_code;
      enrichedData.financialData = {
        revenue: proPublicaData.revenue_amount,
        assets: proPublicaData.asset_amount
      };
    }
  }

  return enrichedData;
}
```

---

## Conclusion

**The EIN is a powerful key** that unlocks comprehensive nonprofit data from multiple authoritative sources. By implementing a multi-source enrichment strategy, we can:

1. ✅ Obtain NTEE codes (100% coverage for orgs with EINs)
2. ✅ Get accurate location data (headquarters)
3. ✅ Access financial information
4. ✅ Retrieve mission statements and program descriptions
5. ✅ Enhance organization classification

**Recommended Immediate Action:**
1. Download IRS Business Master File (BMF)
2. Integrate ProPublica Nonprofit Explorer API
3. Implement EIN-based enrichment pipeline
4. Cache enriched data to minimize API calls

This approach will significantly improve the recommendation engine's ability to match organizations to relevant crises.

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Next Review:** March 1, 2026