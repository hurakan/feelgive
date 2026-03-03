# E2E Testing Setup Guide

## Installation

### 1. Install Playwright

```bash
# Install Playwright and browsers
npm install -D @playwright/test
npx playwright install
```

### 2. Install Type Definitions (if needed)

```bash
npm install -D @types/node
```

## Running Tests

### Run All E2E Tests

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test e2e/geo-filtering.spec.ts

# Run specific test
npx playwright test -g "Nigeria article"
```

### Run Tests in UI Mode (Recommended for Development)

```bash
npx playwright test --ui
```

This opens an interactive UI where you can:
- See all tests
- Run tests individually
- Watch tests run in real-time
- Inspect DOM, network requests, console logs
- Time-travel through test execution

### View Test Report

```bash
npx playwright show-report
```

## Test Structure

### Current Tests

1. **Nigeria Article Test** (`e2e/geo-filtering.spec.ts`)
   - Verifies no Thailand organizations for Nigeria articles
   - Confirms geo-relevant endpoint is being used
   - **This is the critical test that would have caught the bug**

2. **California Wildfire Test**
   - Verifies local/national organizations are prioritized
   - Tests US state-level matching

3. **Gaza Crisis Test**
   - Verifies Middle East regional filtering
   - Ensures no unrelated regions (Asia, South America)

4. **Geographic Badges Test**
   - Checks for badge display (Local, National, Regional, Global)

5. **Error Handling Test**
   - Verifies graceful fallback on API errors

## Adding Data Test IDs

To make tests more reliable, add `data-testid` attributes to key elements:

### Frontend Components to Update

```tsx
// CharityCard component
<div data-testid="charity-card">
  <h3 data-testid="charity-name">{charity.name}</h3>
  <p data-testid="charity-location">{charity.location}</p>
  <span data-testid="geo-badge">{badge}</span>
</div>
```

### Example Updates

```tsx
// In charity-card.tsx
<Card data-testid="charity-card" className="...">
  <CardHeader>
    <CardTitle data-testid="charity-name">{charity.name}</CardTitle>
  </CardHeader>
  <CardContent>
    <p data-testid="charity-location">{location}</p>
    {badge && <Badge data-testid="geo-badge">{badge}</Badge>}
  </CardContent>
</Card>
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running critical E2E tests..."

# Run only the Nigeria test (fast, critical)
npx playwright test -g "Nigeria article" --reporter=list

if [ $? -ne 0 ]; then
  echo "❌ Critical E2E test failed. Commit aborted."
  echo "Run 'npx playwright test --ui' to debug"
  exit 1
fi

echo "✅ Critical E2E tests passed"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Debugging Failed Tests

### 1. Run in Debug Mode

```bash
npx playwright test --debug
```

### 2. View Trace

```bash
npx playwright show-trace trace.zip
```

### 3. Check Screenshots

Failed tests automatically save screenshots to `test-results/`

### 4. Check Videos

Videos are saved for failed tests in `test-results/`

### 5. Console Logs

Tests capture console logs - check test output for `[GEO-RELEVANT]` vs `[EVERY.ORG]` logs

## Common Issues

### Issue: Tests timeout waiting for elements

**Solution**: Increase timeout or check if backend is running

```typescript
await page.waitForSelector('[data-testid="charity-card"]', { 
  timeout: 60000  // Increase to 60 seconds
});
```

### Issue: Backend not responding

**Solution**: Ensure backend is running on port 3001

```bash
cd backend && npm run dev
```

### Issue: Frontend not loading

**Solution**: Ensure frontend is running on port 5173

```bash
cd frontend && npm run dev
```

### Issue: Tests pass locally but fail in CI

**Solution**: Check environment variables and ensure all services start correctly

## Best Practices

1. **Always run E2E tests before pushing**
   ```bash
   npx playwright test
   ```

2. **Use data-testid for stable selectors**
   - Avoid CSS classes (they change)
   - Avoid text content (it changes)
   - Use `data-testid` attributes

3. **Keep tests independent**
   - Each test should work in isolation
   - Don't rely on test execution order

4. **Use meaningful test names**
   ```typescript
   test('Nigeria article should not show Thailand organizations', ...)
   // NOT: test('test1', ...)
   ```

5. **Add assertions for both positive and negative cases**
   ```typescript
   expect(hasThailandOrg).toBe(false);  // Negative
   expect(orgNames.length).toBeGreaterThan(0);  // Positive
   ```

## Next Steps

1. ✅ Install Playwright: `npm install -D @playwright/test`
2. ✅ Install browsers: `npx playwright install`
3. ✅ Run tests: `npx playwright test`
4. ✅ Add data-testid attributes to components
5. ✅ Set up CI/CD workflow
6. ✅ Add pre-commit hook

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)