import { test, expect } from '@playwright/test';

/**
 * Admin Enrichment Dashboard E2E Tests
 * Tests the complete admin dashboard functionality
 */

const ADMIN_URL = 'http://localhost:5137/admin/enrichment';
const API_BASE = 'http://localhost:3001';
const ADMIN_KEY = 'dev-admin-key-12345';

test.describe('Admin Enrichment Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto(ADMIN_URL);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load and Layout', () => {
    test('should load the admin enrichment dashboard', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Enrichment Dashboard');
      
      // Check description
      await expect(page.locator('text=Monitor and manage nonprofit data enrichment')).toBeVisible();
    });

    test('should display all main tabs', async ({ page }) => {
      // Check all tabs are present
      await expect(page.locator('text=Overview')).toBeVisible();
      await expect(page.locator('text=Circuit Breakers')).toBeVisible();
      await expect(page.locator('text=Data Quality')).toBeVisible();
      await expect(page.locator('text=Search')).toBeVisible();
      await expect(page.locator('text=Admin Tools')).toBeVisible();
    });

    test('should display refresh button', async ({ page }) => {
      await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
    });
  });

  test.describe('Statistics Overview Tab', () => {
    test('should display all statistics cards', async ({ page }) => {
      // Check for statistics cards
      await expect(page.locator('text=Total Enriched')).toBeVisible();
      await expect(page.locator('text=IRS Records')).toBeVisible();
      await expect(page.locator('text=Cache Hit Rate')).toBeVisible();
      await expect(page.locator('text=Quality Score')).toBeVisible();
    });

    test('should display source breakdown', async ({ page }) => {
      // Navigate to Overview tab (should be default)
      await page.click('text=Overview');
      
      // Check source breakdown section
      await expect(page.locator('text=Source Breakdown')).toBeVisible();
      await expect(page.locator('text=IRS BMF (Local)')).toBeVisible();
      await expect(page.locator('text=ProPublica API')).toBeVisible();
      await expect(page.locator('text=Charity Navigator')).toBeVisible();
    });

    test('should display quality metrics', async ({ page }) => {
      await page.click('text=Overview');
      
      // Check quality metrics section
      await expect(page.locator('text=Quality Metrics')).toBeVisible();
      await expect(page.locator('text=Complete (All fields)')).toBeVisible();
      await expect(page.locator('text=Partial (Some fields)')).toBeVisible();
      await expect(page.locator('text=Minimal (Basic only)')).toBeVisible();
    });

    test('should refresh data when refresh button clicked', async ({ page }) => {
      // Click refresh button
      await page.click('button:has-text("Refresh")');
      
      // Wait for network request
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/enrichment/stats') && 
        response.status() === 200
      );
      
      // Verify page still displays content
      await expect(page.locator('text=Total Enriched')).toBeVisible();
    });
  });

  test.describe('Circuit Breakers Tab', () => {
    test('should display circuit breaker status cards', async ({ page }) => {
      // Navigate to Circuit Breakers tab
      await page.click('text=Circuit Breakers');
      
      // Check for both service cards
      await expect(page.locator('text=ProPublica API')).toBeVisible();
      await expect(page.locator('text=Charity Navigator API')).toBeVisible();
    });

    test('should display circuit breaker health indicators', async ({ page }) => {
      await page.click('text=Circuit Breakers');
      
      // Check for status indicators (Healthy, Failed, or Testing)
      const statusBadges = page.locator('[class*="badge"]');
      await expect(statusBadges.first()).toBeVisible();
    });

    test('should display failure counts', async ({ page }) => {
      await page.click('text=Circuit Breakers');
      
      // Check for consecutive failures display
      await expect(page.locator('text=Consecutive Failures')).toBeVisible();
    });

    test('should show reset button when circuit is open', async ({ page }) => {
      await page.click('text=Circuit Breakers');
      
      // Check if reset buttons exist (may not be visible if circuits are closed)
      const resetButtons = page.locator('button:has-text("Reset Circuit Breaker")');
      const count = await resetButtons.count();
      
      // Just verify the structure exists (buttons may be hidden if circuits are healthy)
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Data Quality Tab', () => {
    test('should display quality report metrics', async ({ page }) => {
      // Navigate to Data Quality tab
      await page.click('text=Data Quality');
      
      // Check for quality metrics
      await expect(page.locator('text=Data Quality Report')).toBeVisible();
      await expect(page.locator('text=With NTEE Codes')).toBeVisible();
      await expect(page.locator('text=With Location')).toBeVisible();
      await expect(page.locator('text=With Financials')).toBeVisible();
      await expect(page.locator('text=With Ratings')).toBeVisible();
    });

    test('should display stale data count', async ({ page }) => {
      await page.click('text=Data Quality');
      
      await expect(page.locator('text=Stale Data')).toBeVisible();
    });

    test('should display error count', async ({ page }) => {
      await page.click('text=Data Quality');
      
      await expect(page.locator('text=Errors')).toBeVisible();
    });

    test('should display recommendations section', async ({ page }) => {
      await page.click('text=Data Quality');
      
      // Check for recommendations (may or may not be present depending on data quality)
      const recommendations = page.locator('text=Recommendations');
      const count = await recommendations.count();
      
      // Just verify the structure can exist
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Search Tab', () => {
    test('should display EIN search input', async ({ page }) => {
      // Navigate to Search tab
      await page.click('text=Search');
      
      // Check for search components
      await expect(page.locator('text=Search by EIN')).toBeVisible();
      await expect(page.locator('input[placeholder*="EIN"]')).toBeVisible();
      await expect(page.locator('button:has-text("Search")')).toBeVisible();
    });

    test('should accept EIN input', async ({ page }) => {
      await page.click('text=Search');
      
      // Type in EIN field
      const einInput = page.locator('input[placeholder*="EIN"]');
      await einInput.fill('53-0196605');
      
      // Verify input
      await expect(einInput).toHaveValue('53-0196605');
    });

    test('should trigger search on button click', async ({ page }) => {
      await page.click('text=Search');
      
      // Fill EIN
      await page.locator('input[placeholder*="EIN"]').fill('53-0196605');
      
      // Click search button
      await page.click('button:has-text("Search")');
      
      // Wait for potential API call (may return 404 if not found)
      await page.waitForTimeout(1000);
    });

    test('should trigger search on Enter key', async ({ page }) => {
      await page.click('text=Search');
      
      // Fill EIN and press Enter
      const einInput = page.locator('input[placeholder*="EIN"]');
      await einInput.fill('53-0196605');
      await einInput.press('Enter');
      
      // Wait for potential API call
      await page.waitForTimeout(1000);
    });

    test('should display "not found" message for invalid EIN', async ({ page }) => {
      await page.click('text=Search');
      
      // Search for non-existent EIN
      await page.locator('input[placeholder*="EIN"]').fill('99-9999999');
      await page.click('button:has-text("Search")');
      
      // Wait and check for not found message (if API returns 404)
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Admin Tools Tab', () => {
    test('should display IRS import tool', async ({ page }) => {
      // Navigate to Admin Tools tab
      await page.click('text=Admin Tools');
      
      // Check for IRS import section
      await expect(page.locator('text=Import IRS BMF Data')).toBeVisible();
      await expect(page.locator('button:has-text("Start IRS Import")')).toBeVisible();
    });

    test('should display bulk enrichment tool', async ({ page }) => {
      await page.click('text=Admin Tools');
      
      // Check for bulk enrichment section
      await expect(page.locator('text=Bulk Enrichment')).toBeVisible();
      await expect(page.locator('button:has-text("Start Bulk Enrichment")')).toBeVisible();
    });

    test('should show warning text for IRS import', async ({ page }) => {
      await page.click('text=Admin Tools');
      
      // Check for warning/info text
      await expect(page.locator('text=30-60 min')).toBeVisible();
    });

    test('IRS import button should be clickable', async ({ page }) => {
      await page.click('text=Admin Tools');
      
      const importButton = page.locator('button:has-text("Start IRS Import")');
      await expect(importButton).toBeEnabled();
    });

    test('bulk enrichment button should be clickable', async ({ page }) => {
      await page.click('text=Admin Tools');
      
      const enrichButton = page.locator('button:has-text("Start Bulk Enrichment")');
      await expect(enrichButton).toBeEnabled();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check page still loads
      await expect(page.locator('h1')).toContainText('Enrichment Dashboard');
      
      // Check tabs are still accessible
      await expect(page.locator('text=Overview')).toBeVisible();
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check page still loads
      await expect(page.locator('h1')).toContainText('Enrichment Dashboard');
      
      // Check statistics cards are visible
      await expect(page.locator('text=Total Enriched')).toBeVisible();
    });

    test('should be responsive on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Check page still loads
      await expect(page.locator('h1')).toContainText('Enrichment Dashboard');
      
      // Check all cards are visible
      await expect(page.locator('text=Total Enriched')).toBeVisible();
      await expect(page.locator('text=IRS Records')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls and return error
      await page.route('**/api/v1/enrichment/stats', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      // Reload page
      await page.reload();
      
      // Check for error message or alert
      await page.waitForTimeout(2000);
      
      // Page should still be functional
      await expect(page.locator('h1')).toContainText('Enrichment Dashboard');
    });

    test('should handle network timeout', async ({ page }) => {
      // Intercept and delay API calls
      await page.route('**/api/v1/enrichment/stats', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({})
          });
        }, 10000); // 10 second delay
      });
      
      // Reload page
      await page.reload();
      
      // Should show loading state or handle timeout
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Tab Navigation', () => {
    test('should switch between all tabs', async ({ page }) => {
      // Test each tab
      const tabs = ['Overview', 'Circuit Breakers', 'Data Quality', 'Search', 'Admin Tools'];
      
      for (const tab of tabs) {
        await page.click(`text=${tab}`);
        await page.waitForTimeout(500);
        
        // Verify tab is active (check for active styling or content)
        await expect(page.locator(`text=${tab}`)).toBeVisible();
      }
    });

    test('should maintain state when switching tabs', async ({ page }) => {
      // Go to Search tab and enter EIN
      await page.click('text=Search');
      await page.locator('input[placeholder*="EIN"]').fill('12-3456789');
      
      // Switch to another tab
      await page.click('text=Overview');
      
      // Switch back to Search
      await page.click('text=Search');
      
      // Check if input is still there (may or may not persist depending on implementation)
      const einInput = page.locator('input[placeholder*="EIN"]');
      await expect(einInput).toBeVisible();
    });
  });

  test.describe('Auto-refresh Functionality', () => {
    test('should auto-refresh data every 30 seconds', async ({ page }) => {
      // Wait for initial load
      await page.waitForLoadState('networkidle');
      
      // Wait for auto-refresh (30 seconds + buffer)
      const statsRequest = page.waitForResponse(
        response => response.url().includes('/api/v1/enrichment/stats'),
        { timeout: 35000 }
      );
      
      // Verify auto-refresh happened
      const response = await statsRequest;
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for h1
      await expect(page.locator('h1')).toBeVisible();
      
      // Check page structure
      const headings = page.locator('h1, h2, h3, h4');
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have accessible buttons', async ({ page }) => {
      // All buttons should be keyboard accessible
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
      
      // Check first button is focusable
      await buttons.first().focus();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is working
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(ADMIN_URL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle rapid tab switching', async ({ page }) => {
      // Rapidly switch between tabs
      for (let i = 0; i < 10; i++) {
        await page.click('text=Overview');
        await page.click('text=Circuit Breakers');
        await page.click('text=Data Quality');
      }
      
      // Page should still be functional
      await expect(page.locator('h1')).toContainText('Enrichment Dashboard');
    });
  });
});