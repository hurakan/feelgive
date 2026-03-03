# Nonprofit Data Enrichment - Implementation Markup Plan
**Created:** February 14, 2026  
**Status:** ⚠️ AWAITING APPROVAL - DO NOT IMPLEMENT  
**Based on:** Research in `backend/NONPROFIT_DATA_ENRICHMENT_APIS.md`

---

## 📋 Executive Summary

This plan outlines implementation of a nonprofit data enrichment system to enhance Every.org organization data with:
- ✅ **NTEE Codes** (National Taxonomy of Exempt Entities) for classification
- ✅ **Location Data** (headquarters address, city, state, coordinates)
- ✅ **Financial Information** (revenue, assets, expenses from IRS filings)
- ✅ **Mission Statements** and program descriptions
- ✅ **Quality Ratings** (Charity Navigator scores)

**Key Strategy:** Use EIN (Tax ID) as primary key to unlock data from multiple free, authoritative sources.

**Coverage:** 98% of Every.org organizations have EINs, enabling comprehensive enrichment.

---

## 🎯 Implementation Phases

### **Phase 1: Database Schema** (Week 1)
**Goal:** Create data models to store enriched organization data

#### 1.1 EnrichedOrganization Model
**File:** `backend/src/models/EnrichedOrganization.ts`

**Key Fields:**
- Every.org base data (slug, id, ein, name, description)
- NTEE classification (code, major category, description)
- Location (street, city, state, zip, coordinates)
- Financial data (revenue, assets, expenses, tax year)
- Enrichment metadata (sources, status, last updated)

**Indexes:**
- `everyOrgSlug` (unique)
- `ein` (for lookups)
- `nteeCode` + `location.state` (for filtering)
- `enrichmentStatus` + `lastEnriched` (for maintenance)

#### 1.2 NTEECode Reference Model
**File:** `backend/src/models/NTEECode.ts`

**Purpose:** Store NTEE code definitions for semantic matching
- Code (e.g., "R20")
- Major category (e.g., "R")
- Category name (e.g., "Civil Rights")
- Description and keywords

---

### **Phase 2: Data Source Services** (Week 1-2)
**Goal:** Create services to fetch data from external APIs

#### 2.1 IRS Business Master File (BMF) Service
**File:** `backend/src/services/irs-bmf.ts`

**Features:**
- Download monthly IRS BMF CSV files (1.8M records)
- Parse and store in memory for fast lookups
- Provide EIN → NTEE code mapping
- Extract location and financial data

**Data Source:** https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf
**Cost:** FREE
**Update Frequency:** Monthly

#### 2.2 ProPublica Nonprofit Explorer Service
**File:** `backend/src/services/propublica.ts`

**Features:**
- REST API integration
- EIN-based organization lookup
- Extract Form 990 financial data
- Rate limiting (1 req/sec recommended)

**API:** https://projects.propublica.org/nonprofits/api
**Cost:** FREE
**Rate Limit:** No official limit, use 1 req/sec

#### 2.3 Charity Navigator Service (Optional)
**File:** `backend/src/services/charity-navigator.ts`

**Features:**
- Get charity ratings (0-4 stars)
- Financial health scores
- Mission statements
- Website URLs

**API:** https://api.charitynavigator.org/v2
**Cost:** FREE (requires registration)
**Requires:** APP_ID and APP_KEY environment variables

---

### **Phase 3: Enrichment Orchestrator** (Week 2)
**Goal:** Coordinate data fetching from multiple sources

#### 3.1 Organization Enrichment Service
**File:** `backend/src/services/organization-enrichment.ts`

**Enrichment Flow:**
1. Check if organization already enriched (cache for 30 days)
2. Fetch from IRS BMF (fastest, most reliable)
3. Fetch from ProPublica (additional financial data)
4. Fetch from Charity Navigator (ratings, optional)
5. Combine data and determine enrichment status
6. Save to database

**Enrichment Status:**
- `pending` - Not yet enriched
- `partial` - Some data available
- `complete` - NTEE code + location available
- `failed` - No EIN or all sources failed

**Features:**
- Single organization enrichment
- Batch enrichment with rate limiting
- Error tracking per source
- Automatic cache refresh after 30 days

---

### **Phase 4: API Endpoints** (Week 2-3)
**Goal:** Expose enrichment functionality via REST API

#### 4.1 Enrichment Routes
**File:** `backend/src/routes/enrichment.ts`

**Endpoints:**

```
POST /api/v1/enrichment/enrich
- Enrich single organization
- Admin only
- Body: { slug, id, ein, name, description }

POST /api/v1/enrichment/batch
- Enrich multiple organizations
- Admin only
- Body: { organizations: [...] }

GET /api/v1/enrichment/:slug
- Get enriched data for organization
- Public access
- Returns: enriched organization data

GET /api/v1/enrichment/stats
- Get enrichment statistics
- Admin only
- Returns: total, withNTEE, withLocation, byStatus
```

---

### **Phase 5: Integration** (Week 3)
**Goal:** Integrate enriched data into recommendation engine

#### 5.1 Update Recommendation Service
**File:** `backend/src/services/recommendations.ts`

**Enhancements:**
- Use NTEE codes for crisis-to-cause matching
- Filter by geographic location (state, city)
- Prioritize organizations with complete enrichment
- Use financial data for credibility scoring

#### 5.2 Update Organization Search
**File:** `backend/src/services/every-org.ts`

**Enhancements:**
- Automatically enrich new organizations on first lookup
- Return enriched data alongside Every.org data
- Cache enriched results

---

### **Phase 6: Admin Tools** (Week 3-4)
**Goal:** Provide admin interface for managing enrichment

#### 6.1 Bulk Enrichment Script
**File:** `backend/scripts/bulk-enrich.ts`

**Features:**
- Enrich all organizations in database
- Progress tracking
- Error reporting
- Resume capability

#### 6.2 IRS BMF Update Script
**File:** `backend/scripts/update-irs-bmf.ts`

**Features:**
- Download latest IRS BMF files
- Parse and import to database
- Schedule monthly updates

#### 6.3 Admin Dashboard Enhancements
**File:** `frontend/src/pages/admin-enrichment.tsx`

**Features:**
- View enrichment statistics
- Trigger manual enrichment
- View enrichment errors
- Monitor API usage

---

## 📊 Storage Requirements

### MongoDB Atlas M0 (Free Tier) Analysis

**Current Usage:**
- Collections: ~10
- Estimated size: ~50 MB

**New Collections:**
- `enrichedorganizations`: ~2 MB per 1,000 orgs
- `nteecodes`: ~50 KB (reference data)

**Projected Usage:**
- 10,000 enriched orgs: ~20 MB
- 50,000 enriched orgs: ~100 MB
- 100,000 enriched orgs: ~200 MB

**Conclusion:** ✅ M0 tier (512 MB limit) is sufficient for initial deployment

---

## 🔐 Environment Variables Required

```bash
# Backend (.env)
CHARITY_NAVIGATOR_APP_ID=your_app_id_here  # Optional
CHARITY_NAVIGATOR_APP_KEY=your_app_key_here  # Optional
```

**Note:** IRS BMF and ProPublica are free and require no API keys.

---

## 📈 Success Metrics

### Phase 1-2 (Data Infrastructure)
- ✅ Models created and indexed
- ✅ IRS BMF service downloads and parses data
- ✅ ProPublica service successfully fetches test organizations
- ✅ 100% test coverage for services

### Phase 3-4 (Enrichment Pipeline)
- ✅ Single organization enrichment works end-to-end
- ✅ Batch enrichment processes 100 orgs without errors
- ✅ Enrichment status correctly reflects data quality
- ✅ API endpoints return expected data

### Phase 5-6 (Integration & Tools)
- ✅ Recommendation engine uses NTEE codes for matching
- ✅ Geographic filtering works correctly
- ✅ Admin dashboard shows enrichment stats
- ✅ Bulk enrichment script processes 1,000+ orgs

### Overall Success Criteria
- 📊 **Coverage:** 90%+ of organizations with EINs are enriched
- 🎯 **Accuracy:** 95%+ of NTEE codes match IRS data
- ⚡ **Performance:** Enrichment completes in <5 seconds per org
- 💾 **Storage:** Stays within M0 tier limits (512 MB)

---

## ⚠️ Risks & Mitigations

### Risk 1: API Rate Limits
**Impact:** Slow enrichment, potential blocking
**Mitigation:**
- Implement rate limiting (1 req/sec for ProPublica)
- Cache results for 30 days
- Use IRS BMF as primary source (no rate limits)

### Risk 2: Data Quality Issues
**Impact:** Incorrect NTEE codes, outdated information
**Mitigation:**
- Use multiple sources for validation
- Track enrichment sources per organization
- Implement data quality checks
- Allow manual corrections

### Risk 3: Storage Limits
**Impact:** Exceeding M0 tier limits
**Mitigation:**
- Monitor storage usage
- Implement data retention policies
- Archive old enrichment data
- Upgrade to M2 tier if needed ($9/month)

### Risk 4: Missing EINs
**Impact:** 2% of organizations cannot be enriched
**Mitigation:**
- Implement name-based fallback search
- Use semantic matching for classification
- Flag organizations needing manual review

---

## 🚀 Deployment Plan

### Week 1: Foundation
- [ ] Create database models
- [ ] Implement IRS BMF service
- [ ] Download and parse IRS BMF data
- [ ] Write unit tests

### Week 2: Services & API
- [ ] Implement ProPublica service
- [ ] Implement Charity Navigator service (optional)
- [ ] Create enrichment orchestrator
- [ ] Create API endpoints
- [ ] Write integration tests

### Week 3: Integration
- [ ] Update recommendation engine
- [ ] Update organization search
- [ ] Test end-to-end flow
- [ ] Performance optimization

### Week 4: Admin Tools & Launch
- [ ] Create bulk enrichment script
- [ ] Create IRS BMF update script
- [ ] Build admin dashboard
- [ ] Run bulk enrichment on existing data
- [ ] Monitor and fix issues

---

## 💰 Cost Analysis

### Free Tier (Recommended for MVP)
- **IRS BMF:** FREE
- **ProPublica API:** FREE
- **MongoDB Atlas M0:** FREE (512 MB)
- **Total:** $0/month

### Enhanced Tier (Optional)
- **Charity Navigator API:** FREE (requires registration)
- **MongoDB Atlas M2:** $9/month (2 GB)
- **Total:** $9/month

### Premium Tier (Future)
- **GuideStar/Candid API:** $499/month
- **MongoDB Atlas M5:** $25/month (5 GB)
- **Total:** $524/month

**Recommendation:** Start with Free Tier, upgrade to Enhanced if needed.

---

## 📝 Next Steps

### Before Implementation:
1. ✅ Review this plan
2. ✅ Approve or request changes
3. ✅ Confirm MongoDB storage is sufficient
4. ✅ Decide on Charity Navigator integration (optional)

### After Approval:
1. Create feature branch: `feature/nonprofit-enrichment`
2. Implement Phase 1 (Database Schema)
3. Implement Phase 2 (Data Services)
4. Test with sample organizations
5. Continue with remaining phases

---

## 📚 References

- [IRS Business Master File](https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf)
- [ProPublica Nonprofit Explorer API](https://projects.propublica.org/nonprofits/api)
- [Charity Navigator API](https://www.charitynavigator.org/index.cfm?bay=content.view&cpid=1397)
- [NTEE Code Classification System](https://nccs.urban.org/project/national-taxonomy-exempt-entities-ntee-codes)
- [Research Document](backend/NONPROFIT_DATA_ENRICHMENT_APIS.md)

---

**Status:** ⚠️ AWAITING APPROVAL  
**Created By:** AI Assistant  
**Date:** February 14, 2026  
**Version:** 1.0