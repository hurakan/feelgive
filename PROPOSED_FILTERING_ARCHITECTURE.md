# FeelGive's Secret Sauce: Multi-Stage Filtering Architecture

## Problem Statement
Every.org's API doesn't support cause filtering in search, but cause relevance is critical for FeelGive's value proposition. We need to build our own intelligent filtering layer that sits between Every.org's raw data and our recommendations.

## Proposed Architecture

### Stage 1: Broad Candidate Generation (Every.org)
**Goal**: Cast a wide net to get relevant organizations
**Method**: Use geo-first queries WITHOUT cause filtering
**Output**: 100-200 candidates per article

```
Query Strategy:
- "Nigeria humanitarian" → 19 results
- "Nigeria relief" → 20 results  
- "Gaza humanitarian" → 16 results
- "California wildfire" → 20 results

Total: ~150 candidates (deduplicated)
```

### Stage 2: FeelGive's Intelligent Filtering Pipeline
**Goal**: Apply our proprietary scoring and filtering logic
**Components**:

#### 2.1 Geographic Matching (EXISTING - WORKING)
- 5-level matching: EXACT_ADMIN1 → EXACT_COUNTRY → REGIONAL → GLOBAL → MISMATCH
- Controlled fallback to ensure minimum results
- **Status**: ✅ Already implemented in `geoMatcher.ts`

#### 2.2 Cause Relevance Scoring (NEW - NEEDS ENHANCEMENT)
**Current State**: Basic keyword matching in `computeCauseScore()`
**Proposed Enhancement**:

```typescript
interface CauseRelevanceScore {
  score: number;           // 0-100
  matchType: 'exact' | 'semantic' | 'keyword' | 'none';
  matchedCauses: string[]; // Which causes matched
  confidence: number;      // 0-1
}

function computeAdvancedCauseScore(
  org: OrgProfile,
  articleCauses: string[],
  articleContext: string
): CauseRelevanceScore {
  // 1. Exact cause matching (highest weight)
  // 2. Semantic similarity (NLP-based)
  // 3. Keyword matching in description
  // 4. NTEE code alignment
  // 5. Historical effectiveness data
}
```

**Scoring Breakdown**:
- **Exact Cause Match**: +40 points (org.causes includes article cause)
- **Semantic Match**: +30 points (similar causes via NLP)
- **Keyword Match**: +20 points (description contains cause keywords)
- **NTEE Code**: +10 points (tax classification aligns)

#### 2.3 Quality & Trust Filtering (EXISTING - NEEDS ENHANCEMENT)
**Current**: Basic penalties for missing data
**Proposed**:
- Verify Every.org verification status
- Check for complete profiles (description, website, location)
- Historical donation data (if available)
- User ratings/feedback (future)

#### 2.4 Relevance Threshold Filtering (NEW)
**Goal**: Only show organizations that meet minimum relevance
**Thresholds**:
- Geographic: Must be REGIONAL or better (no MISMATCH)
- Cause: Must score ≥40/100 (at least keyword match)
- Trust: Must score ≥50/100 (basic verification)

### Stage 3: Ranking & Explainability (EXISTING - WORKING)
**Goal**: Sort by composite score and explain why
**Formula**: 
```
Final Score = (Geo × 0.45) + (Cause × 0.40) + (Trust × 0.15) - Penalties
```

**Explainability**: Generate 2-3 bullets explaining the match
- ✅ Already implemented in `explainability.ts`

## Implementation Plan

### Phase 1: Enhanced Cause Scoring (Immediate)
**File**: `backend/src/services/recommendations/causeScorer.ts` (NEW)

```typescript
export class CauseScorer {
  // Exact cause matching
  private matchExactCauses(orgCauses: string[], articleCauses: string[]): number
  
  // Semantic similarity using embeddings or keyword expansion
  private matchSemanticCauses(orgDesc: string, articleCauses: string[]): number
  
  // Keyword matching in description
  private matchKeywords(orgDesc: string, causeKeywords: string[]): number
  
  // NTEE code alignment
  private matchNTEECode(nteeCode: string, articleCauses: string[]): number
  
  // Main scoring function
  public computeCauseRelevance(
    org: OrgProfile,
    articleCauses: string[],
    articleContext: string
  ): CauseRelevanceScore
}
```

### Phase 2: Relevance Threshold Filtering (Immediate)
**File**: `backend/src/services/recommendations/relevanceFilter.ts` (NEW)

```typescript
export interface RelevanceThresholds {
  minGeoScore: number;      // Default: 50 (REGIONAL or better)
  minCauseScore: number;    // Default: 40 (keyword match minimum)
  minTrustScore: number;    // Default: 50 (basic verification)
  minCompositeScore: number; // Default: 60 (overall quality)
}

export function filterByRelevance(
  candidates: ScoredCandidate[],
  thresholds: RelevanceThresholds
): ScoredCandidate[] {
  return candidates.filter(c => 
    c.geoScore >= thresholds.minGeoScore &&
    c.causeScore >= thresholds.minCauseScore &&
    c.trustScore >= thresholds.minTrustScore &&
    c.compositeScore >= thresholds.minCompositeScore
  );
}
```

### Phase 3: Integration into Orchestrator (Immediate)
**File**: `backend/src/services/recommendations/orchestrator.ts` (UPDATE)

```typescript
// Current pipeline:
1. Generate queries ✅
2. Search Every.org (NO cause filter) ✅
3. Compute geo match ✅
4. Filter by geo ✅
5. Score candidates (BASIC cause scoring) ⚠️
6. Sort by score ✅
7. Generate explainability ✅

// Enhanced pipeline:
1. Generate queries ✅
2. Search Every.org (NO cause filter) ✅
3. Compute geo match ✅
4. Filter by geo ✅
5. **Compute ADVANCED cause relevance** 🆕
6. **Filter by relevance thresholds** 🆕
7. Score candidates (weighted composite) ✅
8. Sort by score ✅
9. Generate explainability ✅
```

## Why This Approach is Superior

### 1. **Scalability**
- Every.org provides raw data (their strength)
- FeelGive adds intelligence (our strength)
- Can easily swap data providers without changing logic

### 2. **Flexibility**
- Adjust thresholds per use case (strict vs. lenient)
- A/B test different scoring algorithms
- Add new signals (user feedback, historical data) without API changes

### 3. **Competitive Advantage**
- Our cause matching algorithm is proprietary
- Can incorporate ML/NLP for semantic matching
- Historical learning from user behavior

### 4. **Quality Control**
- Explicit thresholds prevent low-quality matches
- Explainability shows WHY each org was recommended
- Easy to debug and improve

### 5. **Performance**
- Fetch once from Every.org (fast)
- Filter/score in-memory (very fast)
- Cache results (even faster)

## Example Flow

### Input Article
```
Title: "Nigeria church attack leaves 150 hostages"
Causes: ["humanitarian", "conflict"]
Location: Nigeria, West Africa
```

### Stage 1: Candidate Generation
```
Query "Nigeria humanitarian" → 19 orgs
Query "Nigeria relief" → 20 orgs
Query "West Africa humanitarian" → 15 orgs
Total: 54 unique candidates
```

### Stage 2: FeelGive Filtering

#### Geographic Filtering
```
54 candidates → 
  - 12 EXACT_COUNTRY (Nigeria)
  - 8 REGIONAL (West Africa)
  - 34 GLOBAL
→ Keep top 20 (12 exact + 8 regional)
```

#### Cause Relevance Scoring
```
20 candidates →
  - "Nigerian Humanitarian Foundation": 85/100 (exact cause + location)
  - "West Africa Relief Fund": 75/100 (semantic match)
  - "Global Disaster Response": 45/100 (keyword match)
  - "Thailand Humanitarian Initiative": 20/100 (no match) ❌
→ Filter out < 40 score
→ Keep 15 candidates
```

#### Quality Filtering
```
15 candidates →
  - Check verification status
  - Check profile completeness
  - Apply penalties for missing data
→ Keep 10 high-quality candidates
```

### Stage 3: Final Ranking
```
10 candidates →
  - Sort by composite score
  - Generate explainability
  - Return top 5-10
```

### Output
```json
{
  "nonprofits": [
    {
      "name": "Nigerian Humanitarian Foundation",
      "score": 92,
      "geoMatch": "EXACT_COUNTRY",
      "causeRelevance": 85,
      "whyRecommended": [
        "Operates directly in Nigeria",
        "Specializes in humanitarian crisis response",
        "Verified by Every.org"
      ]
    }
  ]
}
```

## Implementation Timeline

### Immediate (Today)
1. ✅ Remove causes parameter from Every.org API calls
2. 🔨 Create `causeScorer.ts` with advanced scoring
3. 🔨 Create `relevanceFilter.ts` with threshold filtering
4. 🔨 Update orchestrator to use new components
5. ✅ Test with Nigeria/Gaza/California articles

### Short-term (This Week)
1. Add semantic cause matching (keyword expansion)
2. Implement NTEE code alignment
3. Add configurable thresholds per use case
4. Comprehensive testing

### Medium-term (Next Sprint)
1. ML-based semantic similarity
2. Historical effectiveness data
3. User feedback integration
4. A/B testing framework

## Success Metrics

### Quality Metrics
- **Relevance**: 90%+ of recommendations match article cause
- **Geographic Accuracy**: 80%+ match article location
- **User Satisfaction**: Track click-through and donation rates

### Performance Metrics
- **Latency**: < 2s end-to-end (including Every.org)
- **Cache Hit Rate**: > 70% for repeat queries
- **API Efficiency**: < 10 Every.org calls per recommendation

## Conclusion

This architecture gives FeelGive:
1. **Control**: We own the filtering logic
2. **Quality**: Explicit thresholds ensure relevance
3. **Flexibility**: Easy to enhance and experiment
4. **Competitive Advantage**: Proprietary scoring algorithm
5. **Scalability**: Can handle multiple data sources

The key insight: **Every.org provides breadth, FeelGive provides precision.**