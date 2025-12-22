/**
 * E2E tests for back button navigation from RecipeDetail page
 * Tests that the back button returns to the correct page based on navigation context
 */

import { test, expect } from '@playwright/test';

test.describe('RecipeDetail Back Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('text=Recipe Manager', { timeout: 10000 });
  });

  test('should navigate back to landing page when accessed from landing page', async ({ page }) => {
    // Wait for recipes to load on landing page
    await page.waitForSelector('[data-testid="recipe-card"], .text-gray-500', { timeout: 10000 });
    
    // Check if there are any recipes
    const recipeCards = await page.locator('[class*="rounded-lg shadow"]').filter({ hasText: /(LINK|DOCUMENT|MANUAL)/i }).count();
    
    if (recipeCards === 0) {
      console.log('No recipes found, skipping test');
      test.skip();
      return;
    }

    // Click on the first recipe card from landing page
    await page.locator('[class*="rounded-lg shadow"]').filter({ hasText: /(LINK|DOCUMENT|MANUAL)/i }).first().click();
    
    // Wait for recipe detail page to load
    await page.waitForSelector('text=Back', { timeout: 10000 });
    
    // Verify we're on the recipe detail page
    await expect(page).toHaveURL(/\/recipe\/.+/);
    
    // Click the back button
    await page.click('text=Back');
    
    // Verify we're back on the landing page (root path)
    await expect(page).toHaveURL('/');
  });

  test('should navigate back to collection when accessed from collection page', async ({ page }) => {
    // Navigate to collections page
    await page.goto('/collections');
    
    // Wait for collections to load
    await page.waitForSelector('text=Recipe Manager', { timeout: 10000 });
    
    // Check if there are any collections
    const hasCollections = await page.locator('text=/My Collection|Collection/i').count() > 0;
    
    if (!hasCollections) {
      console.log('No collections found, creating one for test');
      
      // Create a collection for testing
      await page.click('button:has-text("New Collection")');
      await page.fill('input[placeholder="e.g., Weeknight Dinners"]', 'Test Collection');
      await page.click('button:has-text("Create Collection")');
      await page.waitForSelector('text=Test Collection', { timeout: 5000 });
    }
    
    // Click on the first collection
    await page.locator('[class*="rounded-lg shadow"]').filter({ hasText: /collection/i }).first().click();
    
    // Wait for collection detail page to load
    await page.waitForSelector('text=Back to Collections', { timeout: 10000 });
    
    // Get the collection URL to verify we return to it
    const collectionUrl = page.url();
    expect(collectionUrl).toMatch(/\/collections\/.+/);
    
    // Check if there are recipes in this collection
    const recipeCards = await page.locator('[class*="rounded-lg shadow"]').filter({ hasText: /(LINK|DOCUMENT|MANUAL)/i }).count();
    
    if (recipeCards === 0) {
      console.log('No recipes in collection, skipping test');
      test.skip();
      return;
    }
    
    // Click on a recipe card from the collection page
    await page.locator('[class*="rounded-lg shadow"]').filter({ hasText: /(LINK|DOCUMENT|MANUAL)/i }).first().click();
    
    // Wait for recipe detail page to load
    await page.waitForSelector('text=Back', { timeout: 10000 });
    
    // Verify we're on the recipe detail page
    await expect(page).toHaveURL(/\/recipe\/.+/);
    
    // Click the back button
    await page.click('text=Back');
    
    // Verify we're back on the collection page (same URL as before)
    await expect(page).toHaveURL(collectionUrl);
  });

  test('should navigate back to landing page when accessed directly via URL', async ({ page }) => {
    // First, get a recipe ID by visiting the landing page
    await page.goto('/');
    await page.waitForSelector('[class*="rounded-lg shadow"]', { timeout: 10000 });
    
    // Check if there are any recipes
    const recipeCards = await page.locator('[class*="rounded-lg shadow"]').filter({ hasText: /(LINK|DOCUMENT|MANUAL)/i }).count();
    
    if (recipeCards === 0) {
      console.log('No recipes found, skipping test');
      test.skip();
      return;
    }
    
    // Get the href of the first recipe card
    const firstRecipeCard = page.locator('[class*="rounded-lg shadow"]').filter({ hasText: /(LINK|DOCUMENT|MANUAL)/i }).first();
    const recipeUrl = await firstRecipeCard.getAttribute('href');
    
    // Navigate directly to the recipe detail page (simulating direct URL access or bookmark)
    await page.goto(recipeUrl);
    
    // Wait for recipe detail page to load
    await page.waitForSelector('text=Back', { timeout: 10000 });
    
    // Verify we're on the recipe detail page
    await expect(page).toHaveURL(/\/recipe\/.+/);
    
    // Click the back button
    await page.click('text=Back');
    
    // Verify we're back on the landing page (default behavior for direct access)
    await expect(page).toHaveURL('/');
  });
});
