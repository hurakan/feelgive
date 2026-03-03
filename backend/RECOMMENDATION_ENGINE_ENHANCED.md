# Enhanced Geo-Relevant Recommendation Engine

## Overview

The Enhanced Recommendation Engine provides geo-relevant charity recommendations with strict geographic filtering, explainability, and comprehensive testing. This is FeelGive's "secret sauce" for matching news articles to the most relevant charitable organizations.

## Key Features

### 1. Geo-First Architecture
- **5-Level Geographic Matching**: EXACT_ADMIN1, EXACT_COUNTRY, REGIONAL, GLOBAL, MISMATCH
- **Strict Geographic Filtering**: Prioritizes local and national organizations
- **Controlled Fallback**: Progressive widening (admin1 → country → regional → global)
- **Smart Limits**: Maximum 2 global responders to prevent flooding

### 2. Enhanced Scoring System
- **Updated Weights**: Geo 45%, Cause 40%, Trust 15%
- **Quality Penalties**: Missing data (-30), Low quality (-20)
- **Suspicious Pattern Filtering**: Removes generic/duplicate organizations
- **Deterministic Heuristics**: Predictable, testable logic

### 3. Query Generation
- **Geo-First Priority**: Country/state disaster relief queries first
- **Multi-Query Strategy**: 6-12 queries with Priority A/B/C structure
- **Synonym Expansion**: Earthquake → seismic, tremor
- **Automatic Deduplication**: Case-insensitive query merging

### 4. Explainability
- **Clear "Why" Bullets**: 2-3 reasons per organization
- **Geographic Match**: "Based in California - direct local presence"
- **Cause Match**: "Strong specialization in wildfire relief"
- **Trust Signals**: "Verified profile, Charity Navigator rated"
- **UI Badges**: Local, National, Regional, Global Responder

### 5. Caching & Performance
- **Configurable TTLs**: Query results (7 days), Org details (30 days)
- **Breaking News Detection**: Shorter TTL for articles < 72 hours old
- **In-Memory Cache**: Fast lookups with automatic cleanup
- **Cache Statistics**: Hit rate monitoring

## Architecture

```
Article Signals (with normalized geo)
         ↓
Query Builder (geo-first, 6-12 queries)
         ↓
Candidate Generator (Every.org search)
         ↓
Geo Normalizer (standardize locations)
         ↓
Geo Matcher (compute match levels)
         ↓
Hard Geo Filter (with controlled fallback)
         ↓
Scorer (geo 45%, cause 40%, trust 15%)
         ↓
Explainability Generator (why bullets)
         ↓
Enricher (with caching)
         ↓
Final Recommendations (5-10 orgs)
```

## API Usage

### Basic Usage

```typescript
import { generateQueries } from './queryBuilder.js';
import { computeGeoMatch } from './geoMatcher.js';
import { enrichWithExplainability } from './explainability.js';

// 1. Generate queries from article
const queries = generateQueries({
  articleId: 'ca-wildfire-2024',
  headline: 'Wildfire Threatens Los Angeles',
  geo: {
    country: 'United States',
    admin1: 'California',
    city: 'Los Angeles'
  },
  causeTags: ['disaster-relief', 'wildfire'],
  eventType: 'wildfire',
  publishedAt: new Date().toISOString()
});

// 2. Compute geographic match
const match = computeGeoMatch(articleGeo, orgLocation);

// 3. Add explainability
const rankedOrg = enrichWithExplainability(
  org,
  match.level,
  scoreBreakdown,
  'United States',
  'California'
);
```

### Configuration

```typescript
import { QueryBuilder } from './queryBuilder.js';
import { RecommendationCache } from './cache.js';

// Configure query builder
const queryBuilder = new QueryBuilder({
  maxQueries: 10,
  useSynonyms: true,
  minQueryLength: 5
});

// Configure cache
const cache = new RecommendationCache({
  queryResults: 7 * 24 * 60 * 60,  // 7 days
  orgDetails: 30 * 24 * 60 * 60,   // 30 days
  breakingNews: 6 * 60 * 60         // 6 hours
});
```

## Testing

### Running Tests

```bash
# Run all recommendation engine tests
npm test -- --testPathPattern="recommendations/__tests__"

# Run specific test suites
npm test -- geoNormalizer.test.ts
npm test -- geoMatcher.test.ts
npm test -- queryBuilder.test.ts
npm test -- integration.test.ts
npm test -- golden.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern="recommendations/__tests__"
```

### Test Coverage

- **Unit Tests**: 910 lines, 135+ test cases
  - geoNormalizer: Country/state normalization, regional groupings
  - geoMatcher: 5-level matching, strictness filtering, fallback
  - queryBuilder: Query generation, deduplication, synonyms

- **Integration Tests**: 385 lines, 5 major scenarios
  - California wildfire
  - Turkey earthquake
  - Missing location data
  - Duplicate detection
  - Edge cases

- **Golden Tests**: 232 lines, 10 realistic scenarios
  - Diverse geographic regions
  - Multiple disaster types
  - Expected outcome validation

### Evaluation Metrics

```typescript
import { evaluator } from './eval/evaluator.js';

// Run evaluation
const results = await evaluator.evaluateTestSuite(
  testCases,
  getRecommendations
);

// Check metrics
console.log(results.aggregateMetrics);
// {
//   geoPrecision5: 0.85,      // 85% geo-relevant
//   relevance5: 0.72,          // 72% cause-relevant
//   coverage: 0.95,            // 95% return ≥5 results
//   explainCompleteness: 0.88, // 88% complete explanations
//   avgProcessingTime: 245     // 245ms average
// }
```

## Quality Thresholds

### Production Requirements
- **GeoPrecision@5**: ≥80% overall, ≥90% for US states
- **Relevance@5**: ≥60%
- **Coverage**: ≥5 results (with fallbacks)
- **ExplainCompleteness**: ≥85%
- **Processing Time**: <500ms average

### CI/CD Integration
- Automated testing on every PR
- Coverage thresholds enforced
- Metric validation in CI pipeline
- PR comments with test results

## Geographic Matching Details

### Match Levels

1. **EXACT_ADMIN1** (Score: 1.5)
   - Same country AND same state/province
   - Example: Article in California → Org in California
   - Highest priority

2. **EXACT_COUNTRY** (Score: 1.2-1.3)
   - Same country, different or missing state
   - Example: Article in California → Org in New York
   - High priority

3. **REGIONAL** (Score: 0.6-0.8)
   - Neighboring country or same region
   - Example: Article in Turkey → Org in Syria
   - Medium priority

4. **GLOBAL** (Score: 0.3-0.4)
   - Global responder or unknown location
   - Limited to 2 per result set
   - Low priority

5. **MISMATCH** (Score: 0.0)
   - No geographic connection
   - Filtered out in strict mode

### Regional Groupings

- **North America**: US, Canada, Mexico
- **Middle East**: Turkey, Syria, Iraq, Iran, Israel, etc.
- **South Asia**: India, Pakistan, Bangladesh, etc.
- **Southeast Asia**: Thailand, Vietnam, Malaysia, etc.
- **Western Europe**: UK, France, Germany, etc.
- **And 10+ more regions**

## Query Generation Strategy

### Priority A: Geo-First (40% of queries)
```
- "{country} disaster relief"
- "{country} humanitarian aid"
- "{admin1} disaster relief"
- "{city} mutual aid"
```

### Priority B: Cause + Geo (40% of queries)
```
- "{country} {eventType}"
- "{admin1} {topCauseKeyword}"
- "{eventType} {country}"
```

### Priority C: Fallback (20% of queries)
```
- "emergency response {country}"
- "relief fund {country}"
- "{eventType} relief fund"
```

## Explainability Examples

### California Wildfire
```
✓ Based in California - direct local presence (Los Angeles, CA)
✓ Strong specialization in wildfire relief, emergency response
✓ Trust signals: verified profile, Charity Navigator rated
Badge: Local
```

### Turkey Earthquake
```
✓ Operates in Turkey - national presence (Istanbul, Turkey)
✓ Mission includes earthquake relief, disaster response
✓ Trust signals: complete transparency profile
Badge: National
```

### Regional Responder
```
✓ Regional responder serving Turkey area (based in Syria)
✓ Works in related areas: humanitarian aid, crisis response
✓ Meets quality standards for profile completeness
Badge: Regional
```

## Performance Optimization

### Caching Strategy
- **Query Results**: 7-day TTL (configurable 7-30 days)
- **Org Details**: 30-day TTL (configurable 30-90 days)
- **Breaking News**: 6-hour TTL for recent articles
- **Automatic Cleanup**: Every 5 minutes

### Query Optimization
- Maximum 12 queries per article
- Deduplication before API calls
- Parallel query execution
- Result caching per query

## Troubleshooting

### Low GeoPrecision
- Check article geo data quality
- Verify country/state normalization
- Review fallback settings
- Increase `minResultsBeforeFallback`

### Missing Results
- Check if strictness is too high
- Verify cause tags are relevant
- Review quality filters
- Check cache TTLs

### Slow Performance
- Enable caching
- Reduce `maxQueries`
- Check API rate limits
- Monitor cache hit rate

## Future Enhancements

### Planned Features
- ML-based relevance scoring
- Real-time A/B testing
- Performance monitoring dashboard
- Advanced deduplication algorithms
- Multi-language support

### Research Areas
- Semantic similarity matching
- Historical performance tracking
- User feedback integration
- Dynamic weight adjustment

## Contributing

### Adding New Tests
1. Create test file in `__tests__/`
2. Follow existing test patterns
3. Include realistic scenarios
4. Document expected outcomes

### Modifying Weights
1. Update in `types.ts` config
2. Run full test suite
3. Validate metrics meet thresholds
4. Document rationale

### Adding Regional Groups
1. Update `geoNormalizer.ts`
2. Add corresponding tests
3. Verify neighbor detection
4. Update documentation

## Support

For questions or issues:
- Review test cases for examples
- Check integration tests for scenarios
- Consult evaluation metrics
- Review CI/CD logs

---

**Last Updated**: January 2024  
**Version**: 2.0  
**Status**: Production Ready