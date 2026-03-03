# Architectural Review: Nonprofit Data Enrichment System

**Review Date:** February 15, 2026
**Reviewer:** Senior Software Architect
**Target:** `NONPROFIT_DATA_ENRICHMENT_MARKUP_PLAN.md`

## 1. Executive Summary

The proposed plan to enrich Every.org data using EIN-based lookups from authoritative sources (IRS BMF, ProPublica) is **sound and highly recommended**. The strategy leverages free, high-quality public data to bridge the gap between Every.org's broad coverage and the specific filtering needs (NTEE codes, precise locations) required by the platform.

However, the architecture requires specific refinements to handle data synchronization, partial failure states, and the "cold start" problem where users search for organizations that haven't been enriched yet.

**Recommendation:** **Approve with Moderate Modifications**

---

## 2. Robustness Assessment

### ✅ Strengths
- **EIN as Primary Key:** Using the EIN is the correct approach. It is the standard identifier across all US-based nonprofit datasets.
- **Multi-Source Strategy:** Fallback from IRS BMF (local/fast) to ProPublica (API/rich) provides a good balance of speed and depth.
- **Admin Tools:** The inclusion of bulk scripts and admin dashboards is crucial for long-term maintenance.

### ⚠️ Concerns & Mitigations

#### Error Handling & Resilience
- **Issue:** The plan assumes strict "happy paths" for API responses. ProPublica and other free APIs can experience downtime or rate limiting unexpectedly.
- **Mitigation:** Implement a `CircuitBreaker` pattern for external APIs. If ProPublica fails X times, stop calling it for Y minutes to prevent cascading failures in the batch process.

#### Data Quality & Validation
- **Issue:** IRS data can be messy (e.g., all caps names, old addresses). Every.org data might differ from IRS data (e.g., doing business as names).
- **Mitigation:**
  - Trust Every.org for **Display Name** and **Description** (better UX).
  - Trust IRS/ProPublica for **NTEE Codes** and **Financials** (legal accuracy).
  - Trust IRS for **Headquarters**, but be aware that a HQ in NY might run programs in CA. *Future consideration: Program service locations.*

#### Rate Limiting
- **Issue:** The `1 req/sec` for ProPublica is conservative but necessary. A bulk update of 10,000 orgs would take ~3 hours.
- **Mitigation:** The bulk enrichment script must be **interruptible and resumable**. It should store a "cursor" or flag (e.g., `lastEnrichedAt`) to resume exactly where it left off.

---

## 3. Completeness Analysis

### ❌ Missing Components

1.  **"On-Demand" Enrichment Logic:**
    - The plan mentions enriching on lookup, but this introduces latency.
    - **Recommendation:** Implement a "Stale-While-Revalidate" strategy. Return existing (potentially thin) data immediately to the user, and trigger a background enrichment job in a separate queue/thread. The *next* user gets the rich data.

2.  **Search Synchronization:**
    - If you enrich an org with NTEE code "R20" (Civil Rights), but the search index (if using Atlas Search or simple regex) doesn't know about this new field, the enrichment provides no discovery value.
    - **Recommendation:** Ensure the `EnrichedOrganization` model is properly indexed in MongoDB to allow queries like `db.enrichedorganizations.find({ 'classification.nteeCode': 'R20' })`.

3.  **EIN Normalization Utility:**
    - Every.org might return EINs as `12-3456789` or `123456789`. IRS data uses `123456789`.
    - **Requirement:** Add a strictly typed `EIN` value object or utility function to strip hyphens/spaces before database lookups.

---

## 4. Architecture Recommendations

### 4.1 Data Model Refinements

The `EnrichedOrganization` model should explicitly separate the *source* of the data to allow for debugging conflicts.

```typescript
// backend/src/models/EnrichedOrganization.ts

interface IEnrichedOrganization {
  // Core Identity
  ein: string; // Unique Index, normalized (no hyphens)
  everyOrgSlug: string; // Unique Index
  
  // Enrichment Data
  classification: {
    nteeCode: string;
    majorGroup: string; // e.g., "R"
    description: string;
    source: 'IRS_BMF' | 'PROPUBLICA' | 'MANUAL';
  };
  
  financials: {
    revenue: number;
    assets: number;
    expenses: number;
    fiscalYear: number;
    source: 'IRS_BMF' | 'PROPUBLICA';
  };
  
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Metadata
  metadata: {
    isEnriched: boolean;
    lastEnrichedAt: Date;
    enrichmentVersion: number;
    errorLog?: string[];
  };
}
```

### 4.2 Local IRS BMF Ingestion (Performance)

Instead of parsing the CSV in real-time or loading it all into memory (which might exceed Node.js heap limits on free tiers), use a **streaming parser** to insert/update records in a dedicated MongoDB collection (`irs_bmf_records`).

1.  **Download** IRS CSV.
2.  **Stream** read line-by-line.
3.  **Upsert** into MongoDB `irs_bmf_records` collection.
4.  **Index** that collection by EIN.
5.  **Enrichment Service** queries MongoDB `irs_bmf_records` (sub-millisecond) instead of parsing CSVs on the fly.

### 4.3 Integration Pattern: The "Sidecar" Model

Don't modify the existing `EveryOrgService` heavily. Instead, create an `EnrichmentService` that "decorates" the result.

```typescript
// Conceptual Flow
async function getOrganization(slug: string) {
  // 1. Fetch live/cached data from Every.org
  const baseOrg = await everyOrgService.getOrganizationBySlug(slug);
  
  if (!baseOrg) return null;
  
  // 2. Fetch enrichment data from our DB (fast)
  const enrichment = await EnrichmentModel.findOne({ ein: baseOrg.ein });
  
  // 3. Merge
  return { ...baseOrg, ...enrichment?.toObject() };
}
```

---

## 5. Risk Analysis

| Risk | Probability | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| **API Rate Limiting** | High | Medium | Queue-based processing for ProPublica; Use IRS BMF (local DB) as primary fallback. |
| **Mismatched EINs** | Low | High | Data attached to wrong charity. Validate name similarity (Levenshtein distance) before merging if possible. |
| **Storage Growth** | Medium | Low | 10k orgs is small text data. MongoDB Atlas M0 limit (512MB) will handle ~100k enriched records easily. |
| **Stale Data** | Medium | Medium | Financial data is inherently 12-18 months old (IRS filing lag). Add "Fiscal Year" label to UI so users know context. |

---

## 6. Implementation Roadmap Adjustments

### Adjusted Phase 1: Database & IRS Ingestion
- **Task:** Create `IrsBmfRecord` model.
- **Task:** Write script to stream-process IRS CSV into this collection.
- **Benefit:** Instant lookups, no memory issues, no external API dependency for basic data.

### Adjusted Phase 2: Enrichment Logic
- **Task:** Create `EnrichedOrganization` model.
- **Task:** Service to look up EIN in `IrsBmfRecord` -> Upsert `EnrichedOrganization`.

### Adjusted Phase 3: ProPublica & Polishing
- **Task:** Add ProPublica for fields the IRS BMF lacks (e.g., specific program descriptions).
- **Task:** API Routes.

---

## 7. Final Recommendation

**Proceed with the plan, but adopt the "Local IRS Database" approach** (Section 4.2) rather than parsing CSVs in memory or on-demand. This ensures the system is robust, fast, and fits within the memory constraints of a standard containerized environment.