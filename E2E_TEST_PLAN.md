# End-to-End Test Plan for Geo-Relevant Recommendations

## Lesson Learned

**Backend unit tests passed ✅, but the system was broken in production ❌**

The issue: I tested the backend recommendation engine in isolation, but never tested the complete user flow through the UI. This missed the critical gap where the frontend was calling a different endpoint.

## E2E Test Strategy

### 1. **UI-Driven Tests** (What I Should Have Done)

Test the complete user journey:
```
User clicks Nigeria article
  ↓
Frontend classifies article
  ↓
Frontend fetches organizations
  ↓
UI displays organizations
  ↓
VERIFY: No Thailand organizations shown
```

### 2. **Test Cases**

#### Test Case 1: Nigeria Article (Geographic Mismatch Prevention)
**Input**: https://apnews.com/article/nigeria-church-attack-abduction-3b475c2cb7399aed0bf07cbbd86fa9c1
**Expected**:
- ✅ Shows Nigeria-based organizations
- ✅ Shows West Africa regional organizations
- ✅ Shows max 2 global responders
- ❌ Does NOT show Thailand organizations
- ❌ Does NOT show organizations from other continents

**Actual (Before Fix)**: ❌ Shows Thailand Humanitarian Academic Initiative

#### Test Case 2: California Wildfire (US State Matching)
**Input**: Article about Los Angeles wildfire
**Expected**:
- ✅ Prioritizes California-based organizations
- ✅ Shows US national organizations
- ✅ Geographic badges: "Local", "National"
- ❌ Does NOT show international organizations (unless global responders)

#### Test Case 3: Gaza Crisis (Middle East Regional)
**Input**: Article about Gaza humanitarian situation
**Expected**:
- ✅ Shows Palestine/Israel organizations
- ✅ Shows Middle East regional organizations
- ✅ Shows max 2 global responders
- ❌ Does NOT show Asian or African organizations

#### Test Case 4: Turkey Earthquake (Cross-Border Impact)
**Input**: Article about Turkey-Syria earthquake
**Expected**:
- ✅ Shows Turkey organizations
- ✅ Shows Syria organizations (neighboring country)
- ✅ Shows Middle East regional organizations
- ✅ Geographic badges indicate regional match

#### Test Case 5: Global Pandemic (Worldwide Crisis)
**Input**: Article about global health crisis
**Expected**:
- ✅ Shows global health organizations
- ✅ All organizations marked as "Global Responder"
- ✅ No geographic filtering applied

### 3. **Test Implementation**

#### Option A: Playwright E2E Tests (Recommended)
```typescript
// e2e/geo-filtering.spec.ts
import { test, expect } from '@playwright/test';

test('Nigeria article should not show Thailand organizations', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Paste Nigeria article URL
  await page.fill('input[type="text"]', 'https://apnews.com/article/nigeria-church...');
  await page.click('button:has-text("Analyze")');
  
  // Wait for organizations to load
  await page.waitForSelector('[data-testid="charity-card"]');
  
  // Get all organization names
  const orgNames = await page.$$eval(
    '[data-testid="charity-name"]',
    els => els.map(el => el.textContent)
  );
  
  // Verify no Thailand organizations
  expect(orgNames).not.toContain('Thailand Humanitarian Academic Initiative');
  
  // Verify geographic relevance
  const locations = await page.$$eval(
    '[data-testid="charity-location"]',
    els => els.map(el => el.textContent)
  );
  
  // All locations should be Nigeria, West Africa, or Global
  for (const location of locations) {
    expect(
      location.includes('Nigeria') ||
      location.includes('West Africa') ||
      location.includes('Global')
    ).toBeTruthy();
  }
});
```

#### Option B: Cypress E2E Tests
```typescript
// cypress/e2e/geo-filtering.cy.ts
describe('Geographic Filtering', () => {
  it('filters out geographically irrelevant organizations', () => {
    cy.visit('/');
    
    // Input Nigeria article
    cy.get('input[type="text"]').type('https://apnews.com/article/nigeria-church...');
    cy.contains('button', 'Analyze').click();
    
    // Wait for results
    cy.get('[data-testid="charity-card"]').should('exist');
    
    // Verify no Thailand organizations
    cy.get('[data-testid="charity-name"]')
      .should('not.contain', 'Thailand Humanitarian Academic Initiative');
    
    // Verify geographic badges
    cy.get('[data-testid="geo-badge"]').each(($badge) => {
      const text = $badge.text();
      expect(['Local', 'National', 'Regional', 'Global Responder']).to.include(text);
    });
  });
});
```

#### Option C: Manual UI Test Checklist
```markdown
## Manual Test: Nigeria Article

1. ✅ Open http://localhost:5173
2. ✅ Paste Nigeria article URL
3. ✅ Click "Analyze"
4. ✅ Wait for organizations to load
5. ✅ Check organization list:
   - [ ] No Thailand organizations
   - [ ] All organizations are Nigeria/West Africa/Global
   - [ ] Geographic badges are displayed
   - [ ] "Why recommended" bullets mention location
6. ✅ Click on an organization
7. ✅ Verify location details match article geography
```

### 4. **Integration Test Points**

#### Backend API Tests
```bash
# Test recommendation endpoint directly
curl -X POST http://localhost:3001/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gunmen abduct worshippers from church in Nigeria",
    "entities": {
      "geography": { "country": "Nigeria" }
    },
    "causes": ["humanitarian-relief"],
    "keywords": ["gunmen", "church", "Nigeria"]
  }'

# Verify response contains no Thailand organizations
```

#### Frontend API Client Tests
```typescript
// Test that frontend calls correct endpoint
test('should call recommendations endpoint', async () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  
  await apiClient.getRecommendations({
    title: 'Nigeria crisis',
    entities: { geography: { country: 'Nigeria' } },
    causes: ['humanitarian-relief'],
    keywords: ['crisis']
  });
  
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/recommendations'),
    expect.objectContaining({ method: 'POST' })
  );
});
```

### 5. **Continuous Testing**

#### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running E2E tests..."
npm run test:e2e:critical

if [ $? -ne 0 ]; then
  echo "❌ E2E tests failed. Commit aborted."
  exit 1
fi
```

#### CI/CD Pipeline
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Start backend
        run: npm run dev:backend &
      - name: Start frontend
        run: npm run dev:frontend &
      - name: Wait for services
        run: npx wait-on http://localhost:3001 http://localhost:5173
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-screenshots
          path: e2e/screenshots/
```

### 6. **Test Coverage Goals**

- ✅ **Unit Tests**: 80%+ coverage (backend logic)
- ✅ **Integration Tests**: All API endpoints
- ❌ **E2E Tests**: Critical user flows (MISSING - caused the bug)
- ❌ **Visual Regression**: UI consistency (MISSING)

## Action Items

1. ✅ Fix frontend to call `/recommendations` endpoint
2. ✅ Add E2E test for Nigeria article
3. ✅ Add E2E test for California wildfire
4. ✅ Add E2E test for Gaza crisis
5. ✅ Set up Playwright/Cypress
6. ✅ Add E2E tests to CI/CD pipeline
7. ✅ Create pre-commit hook for critical tests

## Conclusion

**The bug happened because I only tested the backend in isolation.** E2E tests would have immediately caught that the frontend was calling the wrong endpoint, preventing this production issue.

Going forward, every feature must include:
1. Unit tests (backend logic)
2. Integration tests (API endpoints)
3. **E2E tests (complete user flow)** ← This was missing