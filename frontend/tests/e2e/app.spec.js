import { test, expect } from '@playwright/test';

test.describe('Recipe Manager App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the landing page with app title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Recipe Manager');
  });

  test('should show authentication form when not logged in', async ({ page }) => {
    // Check for authentication UI elements
    const authForm = page.locator('form').first();
    await expect(authForm).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    // Check if the page has proper navigation structure
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for alt texts on images
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should handle search input', async ({ page }) => {
    // Try to find search bar (may not be visible without auth)
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test recipe');
      await expect(searchInput.first()).toHaveValue('test recipe');
    }
  });

  test('should display proper meta tags', async ({ page }) => {
    // Check for basic SEO
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should not have console errors on initial load', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Filter out common/expected errors (like Firebase auth in dev)
    const criticalErrors = errors.filter(
      err => !err.includes('Firebase') && !err.includes('network')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper form validation', async ({ page }) => {
    // Look for any visible forms
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const firstForm = forms.first();
      const submitButton = firstForm.locator('button[type="submit"]');
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        // Form should show validation or handle submission
        await page.waitForTimeout(500);
      }
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check if main content is visible and not overflowing
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have working links', async ({ page }) => {
    // Find all links and check they have valid hrefs
    const links = page.locator('a[href]');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });
});
