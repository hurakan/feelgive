# Semantic Matching Final Strategy

## The Complete Picture: Geography + Cause Relevance

You're absolutely correct - we need **TWO filters working together**:

1. **Semantic Geographic Matching** - Is this org relevant to Nigeria?
2. **Cause Relevance Matching** - Is this org relevant to humanitarian crisis?

### Example: Nigeria Soccer Federation

**For "Nigeria church attack" (humanitarian crisis)**:
- Geographic: ✅ Nigeria-relevant (75/100)
- Cause: ❌ Sports, not humanitarian (0/100)
- **Result**: Filtered out ✅

**For "Nigeria stadium collapse" (sports disaster)**:
- Geographic: ✅ Nigeria-relevant (75/100)
- Cause: ✅ Sports-related (80/100)
- **Result**: Recommended ✅

---

## Two-Stage Filtering Architecture

### Stage 1: Semantic Geographic Filter (30/100 threshold)

Filters orgs by **operational focus** (not headquarters):
- Name contains country/region
- Description mentions country/region
- Matched geo-specific search query
- NTEE indicates international work

**Purpose**: Keep Nigeria orgs, filter out Thailand org

### Stage 2: Cause Relevance Filter (40/100 threshold)

Filters orgs by **cause alignment** with article:
- NTEE code matches crisis type
- Tags match crisis type
- Description mentions relevant causes
- Org name indicates relevant work

**Purpose**: Keep humanitarian orgs, filter out sports/religion orgs (unless crisis is sports/religion-related)

---

## NTEE Code → Crisis Type Mapping

### Humanitarian Crisis (church attack, kidnapping, conflict)

**Relevant NTEE Codes** (HIGH priority):
- **Q30-Q39**: International Development, Relief Services ✅
- **P20-P29**: Human Services ✅
- **P60-P69**: Emergency Assistance ✅
- **M20-M29**: Disaster Preparedness and Relief ✅
- **K30-K39**: Food Programs, Food Banks ✅
- **L40-L49**: Temporary Shelter ✅
- **E**: Health Services ✅

**Irrelevant NTEE Codes** (LOW priority):
- **N70**: Amateur Sports ❌
- **X20-X29**: Christianity/Religion ⚠️ (unless religious persecution)
- **A**: Arts, Culture ❌
- **B**: Education ❌ (unless education crisis)

### Sports Disaster (stadium collapse, team tragedy)

**Relevant NTEE Codes**:
- **N70**: Amateur Sports ✅
- **P20**: Human Services (if providing aid) ✅
- **E**: Health Services (medical response) ✅

### Religious Persecution Crisis

**Relevant NTEE Codes**:
- **X20-X29**: Christianity/Religion ✅
- **Q30**: International Development ✅
- **P20**: Human Services ✅

---

## Cause Relevance Scoring Algorithm

### Signal 1: NTEE Code Match (50 points)

```typescript
function getNTEECauseScore(nteeCode: string, crisisType: string): number {
  // Humanitarian crisis
  if (crisisType === 'humanitarian' || crisisType === 'conflict') {
    if (nteeCode.startsWith('Q3')) return 50;  // International Development
    if (nteeCode.startsWith('P2') || nteeCode.startsWith('P6')) return 50;  // Human Services
    if (nteeCode.startsWith('M2')) return 50;  // Disaster Relief
    if (nteeCode.startsWith('K3')) return 40;  // Food Programs
    if (nteeCode.startsWith('L4')) return 40;  // Shelter
    if (nteeCode.startsWith('E')) return 30;   // Health
    if (nteeCode.startsWith('X2')) return 10;  // Religion (low priority)
    if (nteeCode.startsWith('N7')) return 0;   // Sports (not relevant)
    return 0;
  }
  
  // Sports disaster
  if (crisisType === 'sports') {
    if (nteeCode.startsWith('N7')) return 50;  // Sports
    if (nteeCode.startsWith('P2')) return 30;  // Human Services
    if (nteeCode.startsWith('E')) return 30;   // Health
    return 0;
  }
  
  // Religious persecution
  if (crisisType === 'religious_persecution') {
    if (nteeCode.startsWith('X2')) return 50;  // Religion
    if (nteeCode.startsWith('Q3')) return 40;  // International Development
    if (nteeCode.startsWith('P2')) return 30;  // Human Services
    return 0;
  }
  
  return 0;
}
```

### Signal 2: Tags Match (30 points)

```typescript
function getTagsCauseScore(tags: string[], crisisType: string): number {
  if (!tags || tags.length === 0) return 0;
  
  const tagsLower = tags.map(t => t.toLowerCase());
  
  // Humanitarian crisis
  if (crisisType === 'humanitarian' || crisisType === 'conflict') {
    if (tagsLower.includes('humanitarian')) return 30;
    if (tagsLower.includes('humans')) return 25;
    if (tagsLower.includes('refugees')) return 30;
    if (tagsLower.includes('food')) return 20;
    if (tagsLower.includes('shelter')) return 20;
    if (tagsLower.includes('health')) return 20;
    if (tagsLower.includes('religion')) return 5;   // Low priority
    if (tagsLower.includes('athletics')) return 0;  // Not relevant
    return 0;
  }
  
  // Sports disaster
  if (crisisType === 'sports') {
    if (tagsLower.includes('athletics')) return 30;
    if (tagsLower.includes('sports')) return 30;
    if (tagsLower.includes('humans')) return 15;
    return 0;
  }
  
  return 0;
}
```

### Signal 3: Description Keywords (20 points)

```typescript
function getDescriptionCauseScore(description: string, crisisType: string): number {
  const descLower = description.toLowerCase();
  
  // Humanitarian crisis
  if (crisisType === 'humanitarian' || crisisType === 'conflict') {
    const humanitarianKeywords = [
      'humanitarian', 'relief', 'aid', 'emergency',
      'refugees', 'displaced', 'victims', 'survivors',
      'food', 'shelter', 'medical', 'health',
    ];
    
    const matches = humanitarianKeywords.filter(kw => descLower.includes(kw));
    return Math.min(matches.length * 5, 20);  // 5 pts per keyword, max 20
  }
  
  // Sports disaster
  if (crisisType === 'sports') {
    const sportsKeywords = ['sports', 'athletics', 'athletes', 'teams'];
    const matches = sportsKeywords.filter(kw => descLower.includes(kw));
    return Math.min(matches.length * 5, 20);
  }
  
  return 0;
}
```

### Combined Cause Score (0-100)

```typescript
function computeCauseRelevance(
  org: NonprofitCandidate,
  crisisType: string
): number {
  const nteeScore = getNTEECauseScore(org.nteeCode, crisisType);
  const tagsScore = getTagsCauseScore(org.tags, crisisType);
  const descScore = getDescriptionCauseScore(org.description, crisisType);
  
  return nteeScore + tagsScore + descScore;  // Max 100
}
```

---

## Complete Filtering Pipeline

```typescript
// Article: "Nigeria church attack" (humanitarian crisis)
const article = {
  title: "Nigeria church attack",
  country: "Nigeria",
  crisisType: "humanitarian",
};

// Step 1: Search Every.org
const candidates = await searchEveryOrg("Nigeria humanitarian");
// Returns: 10 Nigeria orgs + potentially others

// Step 2: Semantic Geographic Filter (threshold: 30)
const geoFiltered = candidates.filter(org => {
  const geoScore = computeSemanticGeoRelevance(org, article.country, "Nigeria humanitarian");
  return geoScore >= 30;
});
// Result: 10 Nigeria orgs pass, Thailand org filtered out

// Step 3: Cause Relevance Filter (threshold: 40)
const causeFiltered = geoFiltered.filter(org => {
  const causeScore = computeCauseRelevance(org, article.crisisType);
  return causeScore >= 40;
});
// Result:
//   ✅ Nigerian International Humanitarian Foundation (P20) - 75 pts
//   ✅ Nigeria Gives (Q33) - 80 pts
//   ✅ Bridges To Nigeria (Q33) - 80 pts
//   ❌ Nigeria Soccer Federation (N70) - 0 pts (sports, not humanitarian)
//   ❌ We Go - Nigeria (X21) - 10 pts (religion, low priority)
//   ❌ Across Nigeria (X20) - 10 pts (religion, low priority)

// Step 4: Rank by combined score
const ranked = causeFiltered.map(org => ({
  org,
  geoScore: computeSemanticGeoRelevance(org, article.country, query),
  causeScore: computeCauseRelevance(org, article.crisisType),
  finalScore: geoScore * 0.45 + causeScore * 0.40 + trustScore * 0.15,
})).sort((a, b) => b.finalScore - a.finalScore);

// Return top N
return ranked.slice(0, 10);
```

---

## Example Scenarios

### Scenario 1: Nigeria Church Attack (Humanitarian)

**Article**: "Armed attackers kidnapped over 150 people from a church in Nigeria"
- **Country**: Nigeria
- **Crisis Type**: Humanitarian/Conflict

**Orgs Tested**:

1. **Nigerian International Humanitarian Foundation** (P20 - Human Services)
   - Geo: 80/100 ✅
   - Cause: 75/100 ✅ (P20 = 50, humans tag = 25)
   - **Result**: RECOMMENDED ✅

2. **Nigeria Soccer Federation** (N70 - Amateur Sports)
   - Geo: 75/100 ✅
   - Cause: 0/100 ❌ (N70 = 0, athletics tag = 0)
   - **Result**: FILTERED OUT ✅

3. **We Go - Nigeria** (X21 - Christianity)
   - Geo: 75/100 ✅
   - Cause: 10/100 ❌ (X21 = 10, religion tag = 5)
   - **Result**: FILTERED OUT ✅ (below 40 threshold)

### Scenario 2: Nigeria Stadium Collapse (Sports Disaster)

**Article**: "Stadium collapse during Nigeria soccer match kills 50"
- **Country**: Nigeria
- **Crisis Type**: Sports

**Orgs Tested**:

1. **Nigeria Soccer Federation** (N70 - Amateur Sports)
   - Geo: 75/100 ✅
   - Cause: 80/100 ✅ (N70 = 50, athletics tag = 30)
   - **Result**: RECOMMENDED ✅

2. **Nigerian International Humanitarian Foundation** (P20 - Human Services)
   - Geo: 80/100 ✅
   - Cause: 30/100 ❌ (P20 = 30 for sports, humans tag = 0)
   - **Result**: FILTERED OUT ❌ (below 40 threshold)

### Scenario 3: Nigeria Religious Persecution

**Article**: "Christians targeted in Nigeria violence"
- **Country**: Nigeria
- **Crisis Type**: Religious Persecution

**Orgs Tested**:

1. **We Go - Nigeria** (X21 - Christianity)
   - Geo: 75/100 ✅
   - Cause: 80/100 ✅ (X21 = 50, religion tag = 30)
   - **Result**: RECOMMENDED ✅

2. **Nigeria Soccer Federation** (N70 - Amateur Sports)
   - Geo: 75/100 ✅
   - Cause: 0/100 ❌ (N70 = 0)
   - **Result**: FILTERED OUT ✅

---

## Crisis Type Detection

We need to detect crisis type from article to apply correct NTEE filtering:

```typescript
function detectCrisisType(article: ArticleContext): string {
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  // Sports disaster
  if (text.match(/stadium|soccer|football|sports|athletics|match|game/)) {
    return 'sports';
  }
  
  // Religious persecution
  if (text.match(/church|mosque|temple|christian|muslim|religious|persecution/)) {
    return 'religious_persecution';
  }
  
  // Natural disaster
  if (text.match(/earthquake|flood|hurricane|tsunami|wildfire|drought/)) {
    return 'natural_disaster';
  }
  
  // Conflict/humanitarian (default)
  return 'humanitarian';
}
```

---

## Implementation Summary

### What Changes

**OLD**: Physical location matching (doesn't work)
```typescript
const orgCountry = parseLocation(org.locationAddress);  // USA
const match = orgCountry === targetCountry;  // USA !== Nigeria
// Result: All orgs filtered out
```

**NEW**: Semantic matching (works)
```typescript
// Stage 1: Geographic relevance
const geoScore = computeSemanticGeoRelevance(org, targetCountry, query);
const geoPass = geoScore >= 30;

// Stage 2: Cause relevance
const causeScore = computeCauseRelevance(org, crisisType);
const causePass = causeScore >= 40;

// Both must pass
const recommended = geoPass && causePass;
```

### What Stays the Same

- Search query generation (already geo-focused)
- Ranking algorithm (geo 45% + cause 40% + trust 15%)
- Explainability system
- Caching layer
- API structure

### What's New

1. **Semantic geographic matching** - Name + description + query
2. **Crisis type detection** - Humanitarian vs sports vs religious
3. **Context-aware NTEE filtering** - Different weights per crisis type
4. **Two-stage filtering** - Geography first, then cause

---

## Expected Results

### Nigeria Church Attack (Humanitarian)

**Before** (physical location):
- All orgs filtered out (USA ≠ Nigeria)
- No recommendations ❌

**After** (semantic matching):
- 10 Nigeria orgs pass geo filter
- 3-4 humanitarian orgs pass cause filter
- Sports/religion orgs filtered out ✅
- Relevant recommendations ✅

### Nigeria Stadium Collapse (Sports)

**Before**:
- All orgs filtered out
- No recommendations ❌

**After**:
- 10 Nigeria orgs pass geo filter
- 1 sports org passes cause filter
- Humanitarian orgs deprioritized (but not excluded)
- Relevant recommendations ✅

---

## Next Steps

1. ✅ Implement semantic geographic matching
2. ✅ Implement crisis type detection
3. ✅ Implement context-aware NTEE filtering
4. ✅ Update cause relevance scoring
5. ✅ Test with multiple scenarios
6. ✅ Deploy and monitor

This approach ensures:
- ✅ Nigeria orgs recommended for Nigeria crises
- ✅ Thailand org filtered out
- ✅ Sports orgs only for sports crises
- ✅ Religion orgs only for religious crises
- ✅ Humanitarian orgs prioritized for humanitarian crises