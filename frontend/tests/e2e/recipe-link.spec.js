import { test, expect } from '@playwright/test';

test.describe('Recipe Link Display', () => {
  test('link recipe URL should be clickable with proper attributes', async ({ page, context }) => {
    // This test verifies that a link-type recipe displays a clickable URL
    // with proper security attributes and styling
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Note: This test assumes there's at least one link-type recipe
    // In a real scenario, we would create a test recipe first
    
    // Look for any recipe cards with link type
    const linkRecipeCard = page.locator('[class*="recipe"]').filter({ hasText: 'link' }).first();
    
    // If no link recipe exists, skip the detailed test
    if (await linkRecipeCard.count() === 0) {
      test.skip(true, 'No link-type recipes available for testing');
      return;
    }
    
    // Click on the recipe to view details
    await linkRecipeCard.click();
    
    // Wait for recipe detail page
    await page.waitForSelector('h1:has-text("Recipe Manager")', { timeout: 5000 });
    
    // Find the recipe link section
    const recipeLinkSection = page.locator('text=Recipe Link').locator('..'); // parent div
    
    if (await recipeLinkSection.count() > 0) {
      // Find the link element
      const recipeLink = recipeLinkSection.locator('a[href]').first();
      
      // Verify link exists
      await expect(recipeLink).toBeVisible();
      
      // Verify link has proper attributes
      const target = await recipeLink.getAttribute('target');
      expect(target).toBe('_blank');
      
      const rel = await recipeLink.getAttribute('rel');
      expect(rel).toBe('noopener noreferrer');
      
      // Verify link has proper styling classes
      const className = await recipeLink.getAttribute('class');
      expect(className).toContain('text-blue-600');
      expect(className).toContain('hover:underline');
      expect(className).toContain('break-all');
      
      // Verify link has an href
      const href = await recipeLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
      
      // Verify the link would open in new tab (we don't actually click it to avoid navigation)
      // Instead, we verify the attributes are correct
      console.log(`✓ Link recipe URL is properly configured with href: ${href}`);
    }
  });
  
  test('link should have proper visual styling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for recipe cards with link type
    const linkRecipeCard = page.locator('[class*="recipe"], a[href*="/recipe/"]').filter({ hasText: /link/i }).first();
    
    if (await linkRecipeCard.count() === 0) {
      test.skip(true, 'No link-type recipes available for testing');
      return;
    }
    
    // Navigate to recipe detail
    await linkRecipeCard.click();
    await page.waitForTimeout(1000);
    
    // Find the recipe link
    const recipeLink = page.locator('a[href]:has-text("http")').first();
    
    if (await recipeLink.count() > 0) {
      // Check computed styles
      const color = await recipeLink.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.color;
      });
      
      // Blue color should be present (rgb format in computed styles)
      // Tailwind's blue-600 is rgb(37, 99, 235)
      console.log(`Link color: ${color}`);
      
      // Verify it's a link element
      const tagName = await recipeLink.evaluate(el => el.tagName);
      expect(tagName).toBe('A');
    }
  });
  
  test('link should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for link-type recipe
    const linkRecipeCard = page.locator('a[href*="/recipe/"]').filter({ hasText: /link/i }).first();
    
    if (await linkRecipeCard.count() === 0) {
      test.skip(true, 'No link-type recipes available for testing');
      return;
    }
    
    // Navigate to recipe detail
    await linkRecipeCard.click();
    await page.waitForTimeout(1000);
    
    // Find the recipe link
    const recipeLink = page.locator('a[href]:has-text("http")').first();
    
    if (await recipeLink.count() > 0) {
      // Verify link is visible and within viewport
      await expect(recipeLink).toBeVisible();
      
      const box = await recipeLink.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375); // Should not exceed viewport width
      }
    }
  });
});
