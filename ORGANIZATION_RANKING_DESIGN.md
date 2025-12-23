# Organization Ranking Algorithm Design

## 1. Algorithm Overview

The ranking system moves from a "weighted sum" approach to a **hierarchical tiered approach**. This ensures that local relevance is strictly prioritized over general reputation, preventing global giants from overshadowing effective local organizations solely due to high trust scores.

### Logic Flow

```mermaid
graph TD
    A[Input: Classification & Charity List] --> B[Filter: Is Active?]
    B --> C[Step 1: Calculate Geographic Tier (1-4)]
    C --> D[Step 2: Calculate Cause Match Tier (1-3)]
    D --> E[Step 3: Sort Candidates]
    
    E --> F{Sort Priority 1: Geo Tier}
    F -- Tie --> G{Sort Priority 2: Cause Tier}
    G -- Tie --> H{Sort Priority 3: Trust Score}
    
    H --> I[Generate Explainability Metadata]
    I --> J[Return Top Matches]
```

## 2. Geographic Tier Definitions

We define relevance based on the proximity of the organization's operations to the crisis location (`classification.geo` or `classification.geoName`).

| Tier | Name | Definition | Score Value |
|------|------|------------|-------------|
| **1** | **Direct/Local** | • Organization's `countries` list explicitly includes the Crisis Country code (e.g., 'SD' for Sudan).<br>• OR Organization operates in the specific City/State mentioned. | 1 |
| **2** | **Regional** | • Organization operates in a country that shares a border or region with the crisis.<br>• *Requires*: Region mapping utility (e.g., mapping 'Sudan' and 'Chad' to 'North Africa'). | 2 |
| **3** | **Global (High Flex)** | • Organization has 'global' in `countries`.<br>• `geographicFlexibility` score is **High (4-5)**.<br>• *Interpretation*: These are large NGOs (Red Cross, MSF) capable of deploying anywhere rapidly. | 3 |
| **4** | **Global (Low Flex)** | • Organization has 'global' in `countries`.<br>• `geographicFlexibility` score is **Low/Mid (1-3)**.<br>• *Interpretation*: Global orgs that fund partners or have slower deployment pipelines. | 4 |
| **5** | **No Match** | • Organization operates in specific countries that do not match the crisis.<br>• *Action*: Filtered out or placed at bottom. | 5 |

## 3. Cause Matching Levels

We define alignment based on the `classification.cause`, `classification.tier1_crisis_type`, and `classification.identified_needs`.

| Level | Name | Definition | Score Value |
|-------|------|------------|-------------|
| **1** | **Perfect Match** | • Primary `cause` matches (e.g., `disaster_relief` == `disaster_relief`).<br>• **AND** At least one `identified_need` matches the organization's `addressedNeeds`. | 1 |
| **2** | **Category Match** | • Primary `cause` matches.<br>• No specific needs overlap (or needs weren't identified). | 2 |
| **3** | **Related Match** | • Primary `cause` doesn't match exactly, but is mapped as "Adjacent".<br>• Example: `humanitarian_crisis` crisis -> `disaster_relief` org. | 3 |
| **4** | **Mismatch** | • No cause or adjacent alignment. | 4 |

## 4. Ranking Logic (Pseudocode)

```typescript
function rankCharities(classification, charities) {
  return charities
    .filter(charity => charity.isActive)
    .map(charity => {
      // Step 1: Geo Scoring
      const geoTier = calculateGeoTier(charity, classification.geo);
      
      // Step 2: Cause Scoring
      const causeTier = calculateCauseTier(charity, classification);
      
      return {
        charity,
        geoTier, // Lower is better (1)
        causeTier, // Lower is better (1)
        trustScore: charity.trustScore
      };
    })
    // Filter out complete mismatches if desired
    .filter(item => item.geoTier <= 4 && item.causeTier <= 3)
    .sort((a, b) => {
      // Primary Sort: Geography
      if (a.geoTier !== b.geoTier) {
        return a.geoTier - b.geoTier;
      }
      
      // Secondary Sort: Cause Match
      if (a.causeTier !== b.causeTier) {
        return a.causeTier - b.causeTier;
      }
      
      // Tertiary Sort: Trust Score (Descending)
      return b.trustScore - a.trustScore;
    });
}
```

## 5. Data Structure Changes

### A. New Helper Data (Static or Config)
We need a **Region Map** to support Tier 2 (Regional) matching without requiring database schema changes immediately.

```typescript
// utils/region-mapping.ts
export const REGION_MAP: Record<string, string[]> = {
  'east_africa': ['KE', 'SD', 'ET', 'SO', ...],
  'middle_east': ['LB', 'SY', 'TR', 'JO', ...],
  // ...
};
```

### B. Output Interface Updates
The `Charity` interface remains the same, but the matching function should return an enriched object or attach metadata for the UI to explain *why* it was ranked.

```typescript
interface RankedCharity {
  charity: Charity;
  matchMetaData: {
    geoTier: 1 | 2 | 3 | 4;
    causeTier: 1 | 2 | 3;
    proximityLabel: string; // e.g., "Direct operations in Sudan"
    causeLabel: string;    // e.g., "Matches 'Medical Aid' needs"
  }
}
```

## 6. Example Scenarios

### Scenario A: Earthquake in Turkey (Geo: TR, Needs: Medical, Shelter)

| Organization | Geo Data | Cause/Needs | Geo Tier | Cause Tier | Rank | Reason |
|--------------|----------|-------------|----------|------------|------|--------|
| **Turkish Red Crescent** | `['TR']` | `Disaster` / `Medical` | **1** (Direct) | **1** (Perfect) | **#1** | Local + Perfect Fit |
| **Doctors Without Borders** | `['Global']` (Flex: 5) | `Health` / `Medical` | **3** (Global-Hi) | **1** (Perfect) | **#2** | Global High-Flex + Perfect Fit |
| **Syrian Relief** | `['SY']` | `Disaster` | **2** (Regional) | **2** (Cat) | **#3** | Regional Neighbor |
| **US Food Bank** | `['US']` | `Hunger` | **5** (Mismatch) | - | **Excluded** | Wrong Geo |

### Scenario B: Civil War in Sudan (Geo: SD, Needs: Food, Safety)

| Organization | Geo Data | Cause/Needs | Geo Tier | Cause Tier | Rank | Reason |
|--------------|----------|-------------|----------|------------|------|--------|
| **World Food Program** | `['Global']` (Flex: 5) | `Hunger` / `Food` | **3** (Global-Hi) | **1** (Perfect) | **#1** | *Note: If WFP listed 'SD' explicitly, they would be Tier 1* |
| **Local Sudan NGO** | `['SD']` | `Peace` / `Safety` | **1** (Direct) | **1** (Perfect) | **#1** | *Ties with above -> Trust score breaks tie* |
| **Kenya Aid** | `['KE']` | `Health` | **2** (Regional) | **3** (Related) | **#3** | Regional neighbor |

## 7. Implementation Notes

1.  **Strict vs. Fuzzy Matching:** The current system uses `includes()`. We need to normalize country codes (ISO-2) vs full names.
    *   *Recommendation:* Convert all input geo names to ISO-2 codes using a library or lookup table before matching against `charity.countries`.
2.  **Global Fallback:** "Global" organizations are powerful, but we must ensure they don't drown out smaller, specific organizations. The Tier 1 vs Tier 3 distinction guarantees local orgs appear first *if they exist in our database*.
3.  **Explainability:** The UI needs to display the `proximityLabel`.
    *   *Bad:* "Recommended for you."
    *   *Good:* "Recommended because they operate directly in Turkey."
    *   *Good:* "Recommended because they are a global responder with medical units."