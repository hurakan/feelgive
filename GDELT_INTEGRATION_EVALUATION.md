# GDELT Integration Evaluation & Implementation Plan

## 1. Executive Summary

**Recommendation: INTEGRATE WITH CAUTION**

The GDELT (Global Database of Events, Language, and Tone) Project offers an unparalleled, free resource for global news monitoring that aligns perfectly with FeelGive's mission of tracking crisis events worldwide. Unlike our current paid or rate-limited APIs, GDELT provides massive global coverage without commercial subscription costs.

However, GDELT is not a standard REST API but a massive data stream. It requires a more robust ingestion strategy than simple "fetch and display." I recommend integrating GDELT as a **secondary, high-volume background source** to complement the existing curated APIs. It should be used to discover events in underrepresented regions that standard APIs miss, but filtered heavily to ensure quality.

## 2. Current System Analysis

### Architecture
The current news aggregation system (`backend/src/services/news-aggregator.ts`) is designed for standard REST APIs:
- **Trigger:** Periodic cron jobs or manual admin fetch.
- **Flow:** Fetch JSON → Normalize to `NewsArticle` → Deduplicate → Store in MongoDB → Classify via Gemini.
- **Storage:** Metadata stored in MongoDB (`NewsArticle` collection). Content is not stored to avoid copyright issues.
- **Caching:** `NewsFeedCacheService` caches frontend responses.

### Current Providers & Limitations
- **NewsAPI.org / NewsData.io / Currents:** Easy to use but have strict rate limits (100-600 req/day) on free tiers.
- **Cost:** Scaling to "real-time" global coverage would require expensive enterprise subscriptions ($500+/mo).
- **Coverage:** often biased towards Western media and major headlines.

## 3. GDELT Project Overview

### What is it?
GDELT monitors the world's broadcast, print, and web news from nearly every country in over 100 languages, updating every 15 minutes.

### Relevant API: GDELT DOC 2.0 API
For FeelGive, the **DOC 2.0 API** is the entry point. It allows searching the GDELT article metadata index.
- **Endpoint:** `https://api.gdeltproject.org/api/v2/doc/doc`
- **Output:** JSON (or CSV/HTML).
- **Update Frequency:** Every 15 minutes.
- **Key Capabilities:**
  - **Tone/Sentiment:** Can filter for negative news (e.g., crises).
  - **Image Detection:** Can filter for articles with images.
  - **Source Language:** Can filter by native language (though metadata is translated to English).
  - **Thematic matching:** Powerful "Theme" taxonomy (e.g., `TAX_FNCACT_DISASTER`).

## 4. Pros and Cons Analysis

### Pros
- **Cost:** **100% Free**. No commercial limits.
- **Coverage:** Unbeatable global reach, especially for non-English local news which is critical for charity work.
- **Crisis Detection:** Built-in "Tone" scores allow us to mathematically identify negative events (crises) without needing an LLM for the first pass.
- **Visuals:** The API allows filtering for articles that specifically contain social sharing images, essential for the UI.

### Cons
- **Data Volume:** Returns massive amounts of data. "Drinking from a firehose."
- **Noise:** Includes minor local stories that may not be relevant for international fundraising.
- **Complexity:** Query syntax is complex (boolean logic, specific field codes).
- **No Full Content:** Like other APIs, it provides metadata. We still need to rely on the URL.
- **Latency:** It is a monitoring tool, not always "breaking second-by-second" news, though 15-minute updates are sufficient.

## 5. Implementation Strategy

### Phase 1: Research & Prototyping (Day 1-2)
- Create a standalone script to test GDELT DOC 2.0 queries.
- Optimize query strings for "Humanitarian Crises" (e.g., `(theme:CRISIS OR theme:DISASTER) tone<-5`).

### Phase 2: Backend Service (Day 3-4)
- Implement `GdeltClient` class in backend.
- Create a specialized normalizer to map GDELT fields to `NewsArticle`.
- **Crucial:** Implement strict filtering (must have image, must be > X characters).

### Phase 3: Integration & Caching (Day 5)
- Add GDELT as a provider in `NewsAPIConfig`.
- Update `NewsAggregatorService` to include GDELT but *throttle* it (e.g., fetch only once per hour to avoid database flooding).

### Phase 4: Validation (Day 6)
- Verify data quality in Staging.
- Check if Gemini classification handles GDELT snippets effectively.

## 6. Technical Architecture

### New Service: `backend/src/services/gdelt-client.ts`
```typescript
class GdeltClient {
  private readonly BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
  
  // Example complex query for disaster news with images
  // mode=artlist, format=json, maxrecords=50
  // query=(theme:NATURAL_DISASTER OR theme:MANMADE_DISASTER) sourcelang:eng tone<-5
}
```

### Data Transformation
GDELT returns different field names. Mapping is required:
- `title` -> `title`
- `url` -> `url`
- `socialimage` -> `imageUrl` (Critical: GDELT provides this directly)
- `seondate` -> `publishedAt`
- `domain` -> `source`

### Caching Strategy
GDELT does not need to be cached aggressively by us because *it is an archive*. However, we must cache our *responses* to the frontend. The existing `NewsFeedCacheService` is sufficient.

## 7. Impact Assessment

### Files to Create
- `backend/src/services/gdelt-client.ts`
- `backend/src/services/__tests__/gdelt-client.test.ts`

### Files to Modify
- `backend/src/services/news-aggregator.ts`: Import and use the new client.
- `backend/src/models/NewsAPIConfig.ts`: Add `gdelt` to the provider enum.
- `frontend/src/components/news-api-admin.tsx`: Add GDELT logo/configuration options.

### Database Changes
- No schema changes required for `NewsArticle`.
- One new document in `NewsAPIConfig` collection for GDELT settings.

## 8. Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data Flooding** | Database fills up with low-quality articles | Set `maxrecords` to 10-20 per fetch. Enforce strict keyword filtering. |
| **Data Quality** | Articles are irrelevant or broken links | Filter for `sourcelang:eng` initially. Require `socialimage` presence. |
| **Rate Limiting** | Getting blocked by GDELT | GDELT is generous, but we should respect 1 request/5sec rule. Our aggregation runs much slower (hourly). |
| **Content Mismatch** | LLM fails to classify short GDELT snippets | Ensure we fetch the `seonexcerpt` (snippet) field which is richer than standard descriptions. |

## 9. Cost-Benefit Analysis

- **Current Costs:** $0 (Free tiers). Risk of needing $500/mo plans for scale.
- **GDELT Cost:** $0 (Open Source).
- **Implementation Cost:** ~2-3 days of developer time.
- **Maintenance:** Low. GDELT has been stable for a decade.
- **Net Benefit:** **Infinite scalability for free.**

## 10. Testing Strategy

1.  **Unit Tests:** Mock GDELT JSON responses and verify `normalizeArticle` logic.
2.  **Integration:** Fetch live data and verify it saves to MongoDB with correct `source` and `imageUrl`.
3.  **Quality Check:** Manual review of 50 GDELT-fetched articles to ensure they are relevant to "Charity/Crisis" use cases.

## 11. Rollback Plan

Since GDELT will be just another "Provider" in our system:
1.  **Immediate:** Toggle `isEnabled: false` for the GDELT provider in the Admin Dashboard.
2.  **Code:** Revert the `news-aggregator.ts` integration if it causes crashes.
3.  **Data:** Run a MongoDB script to delete articles where `apiSource: 'gdelt'`.

## 12. Conclusion & Next Steps

**I strongly recommend integrating GDELT.** It solves the scalability and coverage problems inherent in the current "Free Tier" API strategy.

**Next Steps:**
1.  Approve this plan.
2.  Switch to Code Mode.
3.  Implement `backend/src/services/gdelt-client.ts`.
4.  Enable GDELT in the admin panel.