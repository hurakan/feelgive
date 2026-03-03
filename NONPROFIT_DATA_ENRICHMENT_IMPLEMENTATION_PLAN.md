# Nonprofit Data Enrichment System - Implementation Plan

**Created:** February 17, 2026  
**Status:** 🟡 AWAITING APPROVAL  
**Based on:** [`backend/NONPROFIT_DATA_ENRICHMENT_APIS.md`](backend/NONPROFIT_DATA_ENRICHMENT_APIS.md)

---

## 📋 Executive Summary

This plan implements a multi-source nonprofit data enrichment system that uses EIN (Tax ID) to enrich Every.org organization data with:
- ✅ NTEE codes (National Taxonomy of Exempt Entities)
- ✅ Detailed location data
- ✅ Financial information
- ✅ Mission statements and programs
- ✅ Classification and ratings

**Key Objective:** Transform basic Every.org data into comprehensive organization profiles to improve crisis-to-charity matching accuracy by 40-60%.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Enrichment Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Every.org (EIN) ──┐                                         │
│                     │                                         │
│                     ├──► Enrichment Service ──► Cache ──►    │
│                     │           │                             │
│  IRS BMF (Local) ──┤           │                             │
│  ProPublica API ───┤           │                             │
│  Open990 API ──────┤           │                             │
│  Charity Nav ──────┘           │                             │
│                                 ▼                             │
│                    Enriched Organization Profile             │
│                    (with NTEE codes & metadata)              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Phase 1: Database Schema & Models (Week 1)

### New MongoDB Collections

#### 1. IRS BMF Records (1.8M records, imported monthly)
```typescript
interface IRSBMFRecord {
  EIN: string;              // Primary key, indexed
  NAME: string;
  STREET: string;
  CITY: string;
  STATE: string;
  ZIP: string;
  NTEE_CD: string;          // e.g., "R20" (Civil Rights)
  SUBSECTION: string;       // e.g., "03" for 501(c)(3)
  CLASSIFICATION: string;
  ASSET_AMT: number;
  INCOME_AMT: number;
  REVENUE_AMT: number;
  TAX_PERIOD: string;
  lastUpdated: Date;
}
```

#### 2. Enriched Organizations (cached enrichment results)
```typescript
interface EnrichedOrganization {
  ein: string;              // Primary key
  everyOrgSlug: string;
  
  // Basic Info
  name: string;
  description: string;
  logoUrl?: string;
  websiteUrl?: string;
  
  // NTEE Classification
  nteeCode: string;         // e.g., "R20"
  nteeCategory: string;     // e.g., "Civil Rights"
  nteeDescription: string;
  
  // Location
  location: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Financial Data
  financialData: {
    revenue: number;
    assets: number;
    expenses?: number;
    taxPeriod: string;
  };
  
  // Classification
  classification: {
    subsection: string;     // 501(c) type
    foundationCode: string;
    organizationCode: string;
  };
  
  // Mission & Programs
  mission?: string;
  programs?: string[];
  
  // Quality Metrics
  dataQuality: {
    completeness: number;   // 0-100
    lastEnriched: Date;
    sources: string[];      // ['IRS_BMF', 'ProPublica']
    confidence: number;     // 0-100
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. Enrichment Job Queue
```typescript
interface EnrichmentJob {
  ein: string;
  everyOrgSlug: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;         // 1-10 (10 = highest)
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
}
```

#### 4. API Response Cache
```typescript
interface EnrichmentCache {
  cacheKey: string;         // e.g., "propublica:630598743"
  data: any;
  source: string;
  expiresAt: Date;
  createdAt: Date;
}
```

### Database Indexes
```typescript
// Performance-critical indexes
db.irsBMF.createIndex({ EIN: 1 }, { unique: true });
db.irsBMF.createIndex({ NTEE_CD: 1 });
db.enrichedOrganizations.createIndex({ ein: 1 }, { unique: true });
db.enrichedOrganizations.createIndex({ everyOrgSlug: 1 });
db.enrichedOrganizations.createIndex({ nteeCode: 1 });
db.enrichmentJobs.createIndex({ status: 1, priority: -1 });
db.enrichmentCache.createIndex({ cacheKey: 1 }, { unique: true });
db.enrichmentCache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 🔌 Phase 2: Data Source Integration (Week 2)

### Service Architecture
```
backend/src/services/enrichment/
├── index.ts                      # Main orchestrator
├── irs-bmf-service.ts            # Local IRS data access
├── propublica-service.ts         # ProPublica API client
├── open990-service.ts            # Open990 API client
├── charity-navigator-service.ts  # Charity Navigator API
├── enrichment-pipeline.ts        # Data merging logic
├── ntee-mapper.ts                # NTEE code mapping
└── data-quality-scorer.ts        # Quality assessment
```

### 1. IRS BMF Service (Local Database)
- **Data Source:** IRS Business Master File (FREE)
- **Update:** Monthly CSV import via cron job
- **Provides:** NTEE codes, location, classification, financial data
- **Access:** Local MongoDB queries (fast, no rate limits)

### 2. ProPublica API Service
- **Data Source:** ProPublica Nonprofit Explorer (FREE)
- **Endpoint:** `https://projects.propublica.org/nonprofits/api/v2/organizations/{EIN}.json`
- **Provides:** Detailed financial data, mission statements, Form 990 data
- **Rate Limit:** 1 request/second (recommended)
- **Caching:** 30 days

### 3. Open990 API Service
- **Data Source:** Open990.org (FREE)
- **Endpoint:** `https://www.open990.org/api/v1/organizations/{EIN}/`
- **Provides:** Program descriptions, service accomplishments
- **Rate Limit:** Moderate
- **Caching:** 30 days

### 4. Charity Navigator API (Optional)
- **Data Source:** Charity Navigator (FREE with registration)
- **Provides:** Ratings (0-4 stars), accountability scores
- **Requires:** APP_ID and APP_KEY
- **Caching:** 90 days

---

## 🔄 Phase 3: Enrichment Pipeline (Week 3)

### Data Merging Strategy

**Priority Order:** IRS BMF > ProPublica > Open990 > Every.org

```typescript
// Enrichment flow
1. Check if organization already enriched (< 30 days old)
2. If not, gather data from all sources in parallel:
   - IRS BMF (local, instant)
   - ProPublica API (1 sec delay)
   - Open990 API (1 sec delay)
3. Merge data with priority rules
4. Calculate data quality score
5. Save to EnrichedOrganization collection
6. Return enriched profile
```

### NTEE Code Mapping

```typescript
// NTEE Categories (26 major categories)
'A' = Arts, Culture & Humanities
'B' = Education
'C' = Environment
'D' = Animal-Related
'E' = Health Care
'F' = Mental Health & Crisis Intervention
'G' = Diseases, Disorders & Medical Disciplines
'H' = Medical Research
'I' = Crime & Legal-Related
'J' = Employment
'K' = Food, Agriculture & Nutrition
'L' = Housing & Shelter
'M' = Public Safety, Disaster Preparedness & Relief
'N' = Recreation & Sports
'O' = Youth Development
'P' = Human Services
'Q' = International, Foreign Affairs
'R' = Civil Rights, Social Action & Advocacy
'S' = Community Improvement
'T' = Philanthropy, Voluntarism & Grantmaking
'U' = Science & Technology
'V' = Social Science
'W' = Public & Societal Benefit
'X' = Religion-Related
'Y' = Mutual & Membership Benefit
'Z' = Unknown

// Example: "R20" = Civil Rights, Social Action, Advocacy - General
```

### Data Quality Scoring

```typescript
// Quality assessment criteria
- Completeness: % of critical fields filled (0-100)
- Confidence: Based on source count and data freshness (0-100)
- Sources: Number of data sources used (1-4)
- Last Enriched: Timestamp of last enrichment

// Critical fields for completeness:
1. NTEE Code (20 points)
2. Location (city, state) (20 points)
3. Financial data (revenue) (20 points)
4. Mission statement (20 points)
5. Classification (subsection) (20 points)
```

---

## 🌐 Phase 4: API Endpoints (Week 4)

### REST API Routes

```typescript
// GET /api/enrichment/:ein
// Get enriched organization by EIN
// Returns: EnrichedOrganization or 202 (queued for enrichment)

// POST /api/enrichment/enrich
// Trigger immediate enrichment for specific EIN
// Body: { ein, everyOrgSlug, everyOrgData }
// Returns: EnrichedOrganization

// POST /api/enrichment/batch
// Queue multiple organizations for enrichment
// Body: { organizations: [{ ein, everyOrgSlug }] }
// Returns: { queued: number }

// GET /api/enrichment/queue/status
// Get enrichment queue status
// Returns: { pending, processing, completed, failed }

// GET /api/enrichment/stats
// Get enrichment statistics
// Returns: { totalEnriched, coverage, avgQuality, sources }

// GET /api/enrichment/ntee/:code
// Get organizations by NTEE code
// Returns: EnrichedOrganization[]

// POST /api/enrichment/search
// Search enriched organizations
// Body: { query, filters: { nteeCode, state, minRevenue } }
// Returns: EnrichedOrganization[]
```

---

## ⚙️ Phase 5: Background Processing (Week 5)

### Cron Jobs

```typescript
// 1. Monthly IRS BMF Import
// Schedule: 1st of each month at 2 AM
// Duration: ~2 hours
// Downloads 4 CSV files, imports ~1.8M records

// 2. Enrichment Queue Processor
// Schedule: Every 5 minutes
// Processes: 50 jobs per run
// Rate-limited to respect API limits

// 3. Cache Cleanup
// Schedule: Daily at 3 AM
// Removes: Expired cache entries

// 4. Data Quality Reports
// Schedule: Weekly on Sunday at 1 AM
// Generates: Quality metrics, coverage reports
```

### Queue Processing Strategy

```typescript
// Priority levels:
10 = User-requested (immediate)
8  = News article match (high priority)
5  = Bulk enrichment (normal)
3  = Re-enrichment (low priority)
1  = Background refresh (lowest)

// Processing rules:
- Process highest priority first
- Respect API rate limits (1 req/sec)
- Retry failed jobs up to 3 times
- Exponential backoff for failures
```

---

## 🔧 Phase 6: Utilities & Error Handling (Week 6)

### EIN Normalizer
```typescript
// Validates and normalizes EIN format
// Input: "63-0598743" or "630598743"
// Output: "630598743" (9 digits, no hyphen)
// Validates: Checksum, format, length
```

### Circuit Breaker
```typescript
// Prevents cascading failures
// Monitors: API success/failure rates
// Actions: Opens circuit after 5 consecutive failures
// Recovery: Attempts reconnection after 60 seconds
```

### Rate Limiter
```typescript
// Enforces API rate limits
// ProPublica: 1 request/second
// Open990: 2 requests/second
// Charity Navigator: 10 requests/minute
```

---

## 📈 Phase 7: Integration with Recommendation Engine (Week 7)

### Enhanced Matching Algorithm

```typescript
// Current: Semantic matching only
// Enhanced: Semantic + NTEE + Geographic + Financial

function calculateRelevanceScore(crisis, organization) {
  let score = 0;
  
  // 1. Semantic match (40%)
  score += semanticSimilarity(crisis.description, organization.mission) * 0.4;
  
  // 2. NTEE code match (30%)
  if (matchesNTEECode(crisis.category, organization.nteeCode)) {
    score += 0.3;
  }
  
  // 3. Geographic relevance (20%)
  if (isGeographicallyRelevant(crisis.location, organization.location)) {
    score += 0.2;
  }
  
  // 4. Financial capacity (10%)
  score += normalizeFinancialCapacity(organization.financialData.revenue) * 0.1;
  
  return score;
}
```

### NTEE-to-Crisis Mapping

```typescript
// Map crisis types to relevant NTEE codes
const crisisNTEEMapping = {
  'natural_disaster': ['M20', 'M24', 'M40'],  // Disaster relief
  'humanitarian_crisis': ['Q30', 'Q33'],       // International relief
  'food_insecurity': ['K30', 'K31', 'K36'],   // Food banks
  'housing_crisis': ['L20', 'L30', 'L40'],    // Housing & shelter
  'health_emergency': ['E20', 'E70', 'E90'],  // Health care
  'civil_rights': ['R20', 'R22', 'R23'],      // Civil rights
  'refugee_crisis': ['Q30', 'Q32', 'Q33'],    // International aid
  'environmental': ['C20', 'C27', 'C30']      // Environment
};
```

---

## 🧪 Phase 8: Testing Strategy (Week 8)

### Unit Tests
```typescript
// Test coverage targets: 80%+
- EIN normalizer (validation, formatting)
- Circuit breaker (failure detection, recovery)
- NTEE mapper (code lookup, category mapping)
- Data quality scorer (completeness, confidence)
- Enrichment pipeline (data merging, priority)
```

### Integration Tests
```typescript
// Test API integrations
- IRS BMF data import
- ProPublica API calls (with mocks)
- Open990 API calls (with mocks)
- Cache operations
- Queue processing
```

### E2E Tests
```typescript
// Test complete enrichment flow
1. Queue organization for enrichment
2. Process queue
3. Verify data merged correctly
4. Check quality scores
5. Test API endpoints
6. Verify caching behavior
```

---

## 📊 Success Metrics

### Performance Targets
- **Enrichment Speed:** < 3 seconds per organization
- **Cache Hit Rate:** > 80%
- **Data Completeness:** > 85% for critical fields
- **API Uptime:** > 99.5%
- **Queue Processing:** < 5 minute lag

### Quality Targets
- **NTEE Coverage:** > 95% (for orgs with EINs)
- **Location Accuracy:** > 98%
- **Financial Data:** > 80% coverage
- **Mission Statements:** > 70% coverage

### Business Impact
- **Matching Accuracy:** +40-60% improvement
- **User Satisfaction:** Measured via feedback
- **Donation Conversion:** Track before/after rates

---

## 💰 Cost Analysis

### Infrastructure Costs
- **MongoDB Storage:** ~5 GB for IRS BMF data ($0.25/GB/month = $1.25)
- **API Calls:** FREE (ProPublica, Open990, IRS)
- **Compute:** Minimal (background jobs)
- **Total:** < $5/month

### Optional Paid Services
- **Charity Navigator API:** FREE (with registration)
- **GuideStar/Candid API:** $499/month (future enhancement)
- **Google Places API:** $0.017 per request (future enhancement)

---

## 🚀 Deployment Plan

### Week 1-2: Development Environment
1. Set up MongoDB collections and indexes
2. Implement IRS BMF import script
3. Test data import with sample data

### Week 3-4: Service Implementation
1. Build enrichment services
2. Implement API clients with circuit breakers
3. Create enrichment pipeline
4. Add caching layer

### Week 5-6: API & Background Jobs
1. Create REST API endpoints
2. Implement queue processing
3. Set up cron jobs
4. Add monitoring and logging

### Week 7-8: Integration & Testing
1. Integrate with recommendation engine
2. Run comprehensive tests
3. Performance optimization
4. Documentation

### Week 9: Production Deployment
1. Deploy to staging environment
2. Run load tests
3. Monitor for 48 hours
4. Deploy to production
5. Monitor and iterate

---

## 🔒 Security & Privacy

### Data Protection
- **EIN Data:** Public information (IRS)
- **Financial Data:** Public (Form 990 filings)
- **No PII:** System does not store donor information
- **API Keys:** Stored in environment variables
- **Rate Limiting:** Prevents abuse

### Compliance
- **IRS Data:** Public domain, no restrictions
- **API Terms:** Comply with ProPublica, Open990 terms
- **Caching:** Respect cache expiration policies

---

## 📚 Documentation Requirements

### Technical Documentation
1. **API Documentation:** OpenAPI/Swagger specs
2. **Database Schema:** ER diagrams, field descriptions
3. **Service Architecture:** Component diagrams
4. **Deployment Guide:** Step-by-step instructions

### Operational Documentation
1. **Runbook:** Common issues and solutions
2. **Monitoring Guide:** Metrics and alerts
3. **Backup & Recovery:** Data backup procedures
4. **Cron Job Schedule:** Job descriptions and timing

---

## 🎯 Future Enhancements (Post-Launch)

### Phase 9: Advanced Features
1. **GuideStar Integration:** Premium data ($499/month)
2. **Google Places API:** Verified locations
3. **Real-time Updates:** Webhook notifications
4. **ML-based Matching:** Train models on enriched data
5. **Impact Metrics:** Track donation outcomes

### Phase 10: Analytics Dashboard
1. **Enrichment Metrics:** Coverage, quality trends
2. **API Performance:** Response times, error rates
3. **Data Quality Reports:** Automated quality checks
4. **Usage Analytics:** Most-enriched organizations

---

## ✅ Approval Checklist

Before proceeding with implementation, please review and approve:

- [ ] **Database Schema:** Collections, indexes, data models
- [ ] **Service Architecture:** Component structure, dependencies
- [ ] **API Design:** Endpoints, request/response formats
- [ ] **Data Sources:** IRS BMF, ProPublica, Open990
- [ ] **Caching Strategy:** TTL, invalidation rules
- [ ] **Queue Processing:** Priority levels, rate limits
- [ ] **Error Handling:** Circuit breakers, retries
- [ ] **Testing Strategy:** Unit, integration, E2E tests
- [ ] **Deployment Plan:** Timeline, milestones
- [ ] **Cost Estimate:** Infrastructure, API costs
- [ ] **Security Review:** Data protection, API keys
- [ ] **Documentation Plan:** Technical and operational docs

---

## 📝 Next Steps

**Once approved, I will:**

1. ✅ Create MongoDB models and schemas
2. ✅ Implement IRS BMF import script
3. ✅ Build enrichment services (IRS, ProPublica, Open990)
4. ✅ Create enrichment pipeline with data merging
5. ✅ Implement API endpoints
6. ✅ Set up background job processing
7. ✅ Add comprehensive testing
8. ✅ Integrate with recommendation engine
9. ✅ Deploy to staging and production

**Estimated Timeline:** 8-9 weeks for full implementation

---

**Document Version:** 1.0  
**Created:** February 17, 2026  
**Status:** 🟡 Awaiting Approval  
**Next Review:** After approval feedback
