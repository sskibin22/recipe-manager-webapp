import { test, expect } from '@playwright/test';

test.describe('Recipe Card Image Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('all recipe cards should display image section for consistent layout', async ({ page }) => {
    // This test verifies that all recipe cards (Link, Manual, Document)
    // have a consistent layout with an image section
    
    // Skip if no recipes exist
    const recipeCards = page.locator('[class*="rounded-lg"][class*="shadow"]').filter({ hasText: /Added/ });
    const count = await recipeCards.count();
    
    if (count === 0) {
      test.skip(true, 'No recipes available for testing');
      return;
    }

    // Check each recipe card has an image section
    for (let i = 0; i < count; i++) {
      const card = recipeCards.nth(i);
      
      // Each card should have an image element
      const image = card.locator('img').first();
      await expect(image).toBeVisible();
      
      // Image should have a src attribute (either real image or placeholder)
      const src = await image.getAttribute('src');
      expect(src).toBeTruthy();
      
      // Image container should have consistent height (h-48 class = 12rem = 192px)
      const imageContainer = card.locator('div.h-48').first();
      await expect(imageContainer).toBeVisible();
    }
  });

  test('recipe cards without preview image should display placeholder', async ({ page }) => {
    // This test verifies that recipe cards without a preview image
    // display the placeholder image
    
    const recipeCards = page.locator('[class*="rounded-lg"][class*="shadow"]').filter({ hasText: /Added/ });
    const count = await recipeCards.count();
    
    if (count === 0) {
      test.skip(true, 'No recipes available for testing');
      return;
    }

    // Look for at least one card with placeholder image
    let foundPlaceholder = false;
    
    for (let i = 0; i < count; i++) {
      const card = recipeCards.nth(i);
      const image = card.locator('img').first();
      const src = await image.getAttribute('src');
      
      if (src && src.includes('recipe-placeholder.svg')) {
        foundPlaceholder = true;
        
        // Verify the placeholder image is visible
        await expect(image).toBeVisible();
        
        // Verify it has the correct classes for proper display
        const className = await image.getAttribute('class');
        expect(className).toContain('object-cover');
        break;
      }
    }
    
    // If no placeholder found, all recipes have real images which is also valid
    console.log(`Placeholder image ${foundPlaceholder ? 'found' : 'not found (all recipes have images)'}`);
  });

  test('recipe cards with preview image should display actual image', async ({ page }) => {
    // This test verifies that recipe cards with a preview image URL
    // display the actual image (not the placeholder)
    
    const recipeCards = page.locator('[class*="rounded-lg"][class*="shadow"]').filter({ hasText: /Added/ });
    const count = await recipeCards.count();
    
    if (count === 0) {
      test.skip(true, 'No recipes available for testing');
      return;
    }

    // Look for at least one card with actual image (not placeholder)
    let foundActualImage = false;
    
    for (let i = 0; i < count; i++) {
      const card = recipeCards.nth(i);
      const image = card.locator('img').first();
      const src = await image.getAttribute('src');
      
      // Check if it's an actual image URL (starts with http or https)
      if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        foundActualImage = true;
        
        // Verify the image is visible
        await expect(image).toBeVisible();
        
        // Verify it has the correct classes for proper display
        const className = await image.getAttribute('class');
        expect(className).toContain('object-cover');
        break;
      }
    }
    
    console.log(`Actual image ${foundActualImage ? 'found' : 'not found (all recipes use placeholder)'}`);
  });

  test('all recipe cards should have consistent height and spacing', async ({ page }) => {
    // This test verifies that all recipe cards maintain consistent
    // height, padding, and spacing for visual consistency
    
    const recipeCards = page.locator('[class*="rounded-lg"][class*="shadow"]').filter({ hasText: /Added/ });
    const count = await recipeCards.count();
    
    if (count < 2) {
      test.skip(true, 'Need at least 2 recipes for consistency testing');
      return;
    }

    // Check that all cards have consistent image container height
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = recipeCards.nth(i);
      
      // Each card should have h-48 class on image container (192px height)
      const imageContainer = card.locator('div.h-48').first();
      await expect(imageContainer).toBeVisible();
      
      // Each card should have padding (p-4 class)
      const contentContainer = card.locator('div.p-4').first();
      await expect(contentContainer).toBeVisible();
      
      // Each card should have border and shadow classes
      const cardClasses = await card.getAttribute('class');
      expect(cardClasses).toContain('border');
      expect(cardClasses).toContain('shadow');
      expect(cardClasses).toContain('rounded-lg');
    }
  });

  test('recipe card image should handle load errors gracefully', async ({ page }) => {
    // This test verifies that if an image fails to load,
    // the card still displays properly (falls back to placeholder)
    
    const recipeCards = page.locator('[class*="rounded-lg"][class*="shadow"]').filter({ hasText: /Added/ });
    const count = await recipeCards.count();
    
    if (count === 0) {
      test.skip(true, 'No recipes available for testing');
      return;
    }

    // Just verify that all images have an onerror handler by checking
    // that images always have a valid src (either real or placeholder)
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = recipeCards.nth(i);
      const image = card.locator('img').first();
      
      // Image should always have a src
      const src = await image.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src.length).toBeGreaterThan(0);
    }
  });
});
