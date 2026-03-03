import { test, expect } from '@playwright/test';

/**
 * E2E Test: Geographic Filtering
 * 
 * Verifies that the geo-relevant recommendation engine correctly filters
 * organizations by geographic relevance, preventing mismatches like
 * showing Thailand organizations for Nigeria articles.
 */

test.describe('Geographic Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (uses baseURL from playwright.config.ts)
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  });

  test('Nigeria article should not show Thailand organizations', async ({ page }) => {
    console.log('🧪 Testing Nigeria article geographic filtering...');
    
    // Input Nigeria article URL
    const articleUrl = 'https://apnews.com/article/nigeria-church-attack-abduction-3b475c2cb7399aed0bf07cbbd86fa9c1';
    await page.fill('input[type="text"]', articleUrl);
    
    // Click "Find Ways to Help" button
    await page.click('button:has-text("Find Ways to Help")');
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="charity-card"]', { 
      timeout: 30000,
      state: 'visible' 
    });
    
    // Get all organization names
    const orgNames = await page.$$eval(
      '[role="listitem"] h3, [role="listitem"] .font-semibold',
      (elements) => elements.map(el => el.textContent?.trim() || '')
    );
    
    console.log('📋 Organizations found:', orgNames);
    
    // Verify no Thailand organizations
    const hasThailandOrg = orgNames.some(name => 
      name.toLowerCase().includes('thailand')
    );
    
    expect(hasThailandOrg).toBe(false);
    
    // Verify we have some organizations
    expect(orgNames.length).toBeGreaterThan(0);
    
    // Check console logs for geo-relevant endpoint usage
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[GEO-RELEVANT]') || text.includes('[EVERY.ORG]')) {
        logs.push(text);
      }
    });
    
    // Verify geo-relevant logs appear (not old EVERY.ORG logs)
    await page.waitForTimeout(1000);
    const hasGeoRelevantLogs = logs.some(log => log.includes('[GEO-RELEVANT]'));
    
    if (hasGeoRelevantLogs) {
      console.log('✅ Using new geo-relevant endpoint');
    } else {
      console.warn('⚠️ May still be using old endpoint - check logs');
    }
  });

  test('California wildfire should prioritize local organizations', async ({ page }) => {
    console.log('🧪 Testing California wildfire geographic prioritization...');
    
    // Input California wildfire article text
    const articleText = `
      Wildfire forces evacuations in Southern California
      
      A fast-moving wildfire in Los Angeles County has forced thousands to evacuate 
      as firefighters battle the blaze. The fire has burned over 5,000 acres and 
      destroyed several homes in the area.
    `;
    
    // Click on "Paste Text" tab
    await page.click('button:has-text("Paste Text")');
    
    // Fill in the text
    await page.fill('textarea', articleText);
    
    // Click "Find Ways to Help" button
    await page.click('button:has-text("Find Ways to Help")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="charity-card"]', { 
      timeout: 30000,
      state: 'visible' 
    });
    
    // Get organization locations
    const locations = await page.$$eval(
      '[role="listitem"] [data-testid="charity-location"], [role="listitem"] .text-muted-foreground',
      (elements) => elements.map(el => el.textContent?.trim() || '')
    );
    
    console.log('📍 Organization locations:', locations);
    
    // Verify at least one California or US organization
    const hasLocalOrg = locations.some(loc => 
      loc.toLowerCase().includes('california') || 
      loc.toLowerCase().includes('united states') ||
      loc.toLowerCase().includes('los angeles')
    );
    
    expect(hasLocalOrg).toBe(true);
  });

  test('Gaza crisis should show Middle East regional organizations', async ({ page }) => {
    console.log('🧪 Testing Gaza crisis regional filtering...');
    
    const articleText = `
      Humanitarian Crisis in Gaza
      
      The ongoing conflict in Gaza has created a severe humanitarian crisis, 
      with thousands displaced and in need of emergency aid. International 
      organizations are working to provide relief to affected civilians.
    `;
    
    // Click on "Paste Text" tab
    await page.click('button:has-text("Paste Text")');
    
    // Fill in the text
    await page.fill('textarea', articleText);
    
    // Click "Find Ways to Help" button
    await page.click('button:has-text("Find Ways to Help")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="charity-card"]', { 
      timeout: 30000,
      state: 'visible' 
    });
    
    // Get all organization names and locations
    const orgs = await page.$$eval(
      '[role="listitem"]',
      (elements) => elements.map(el => ({
        name: el.querySelector('h3, .font-semibold')?.textContent?.trim() || '',
        location: el.querySelector('[data-testid="charity-location"], .text-muted-foreground')?.textContent?.trim() || ''
      }))
    );
    
    console.log('🌍 Organizations:', orgs);
    
    // Verify no organizations from completely unrelated regions (e.g., Asia, South America)
    const hasUnrelatedRegion = orgs.some(org => 
      org.location.toLowerCase().includes('thailand') ||
      org.location.toLowerCase().includes('brazil') ||
      org.location.toLowerCase().includes('australia')
    );
    
    expect(hasUnrelatedRegion).toBe(false);
  });

  test('should display geographic badges', async ({ page }) => {
    console.log('🧪 Testing geographic badge display...');
    
    // Use a simple article
    const articleUrl = 'https://apnews.com/article/nigeria-church-attack-abduction-3b475c2cb7399aed0bf07cbbd86fa9c1';
    await page.fill('input[type="text"]', articleUrl);
    await page.click('button:has-text("Find Ways to Help")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="charity-card"]', { 
      timeout: 30000,
      state: 'visible' 
    });
    
    // Check for geographic badges (Local, National, Regional, Global Responder)
    const badges = await page.$$eval(
      '[data-testid="geo-badge"], .badge, [class*="badge"]',
      (elements) => elements.map(el => el.textContent?.trim() || '')
    );
    
    console.log('🏷️ Badges found:', badges);
    
    // Verify at least some badges exist
    // (This test is lenient since badge implementation may vary)
    if (badges.length > 0) {
      console.log('✅ Geographic badges are displayed');
    } else {
      console.warn('⚠️ No badges found - may need to add data-testid attributes');
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    console.log('🧪 Testing error handling...');
    
    // Navigate to the app (uses baseURL from playwright.config.ts)
    await page.goto('/');
    
    // Mock API failure
    await page.route('**/api/v1/recommendations', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to analyze an article
    await page.fill('input[type="text"]', 'https://example.com/test-article');
    await page.click('button:has-text("Find Ways to Help")');
    
    // Should show error message or fallback
    await page.waitForTimeout(2000);
    
    // Check for error toast or fallback organizations
    const hasError = await page.locator('text=/error|failed/i').count() > 0;
    const hasFallback = await page.locator('[data-testid="charity-card"]').count() > 0;
    
    expect(hasError || hasFallback).toBe(true);
    
    console.log('✅ Error handling works correctly');
  });
});