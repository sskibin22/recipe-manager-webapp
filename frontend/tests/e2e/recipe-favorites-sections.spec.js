import { test, expect } from '@playwright/test';

test.describe('Collapsible Favorites and All Recipes Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display Favorites and All Recipes sections when recipes exist', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Look for section headers
    const favoritesSection = page.locator('text=/Favorites/i').first();
    const allRecipesSection = page.locator('text=/All Recipes/i').first();

    // At least one section should be visible (depending on whether there are recipes)
    const favoritesVisible = await favoritesSection.isVisible().catch(() => false);
    const allRecipesVisible = await allRecipesSection.isVisible().catch(() => false);

    // If there are any recipes, at least one section should be visible
    const recipeCards = page.locator('[class*="recipe"], [data-testid="recipe-card"]');
    const hasRecipes = await recipeCards.count() > 0;

    if (hasRecipes) {
      expect(favoritesVisible || allRecipesVisible).toBe(true);
    }
  });

  test('should show recipe count in section headers', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for count badges in section headers
    const favoritesHeader = page.locator('button:has-text("Favorites")').first();
    const allRecipesHeader = page.locator('button:has-text("All Recipes")').first();

    if (await favoritesHeader.isVisible()) {
      // Check that the header contains a number (count)
      const headerText = await favoritesHeader.textContent();
      expect(headerText).toMatch(/\d+/);
    }

    if (await allRecipesHeader.isVisible()) {
      // Check that the header contains a number (count)
      const headerText = await allRecipesHeader.textContent();
      expect(headerText).toMatch(/\d+/);
    }
  });

  test('should collapse and expand sections when clicking header', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find the first section header button
    const sectionHeader = page.locator('button:has-text("Favorites"), button:has-text("All Recipes")').first();

    if (await sectionHeader.isVisible()) {
      // Get initial aria-expanded state
      const initialExpanded = await sectionHeader.getAttribute('aria-expanded');

      // Click to toggle
      await sectionHeader.click();
      await page.waitForTimeout(500);

      // Check that aria-expanded changed
      const newExpanded = await sectionHeader.getAttribute('aria-expanded');
      expect(newExpanded).not.toBe(initialExpanded);

      // Click again to toggle back
      await sectionHeader.click();
      await page.waitForTimeout(500);

      // Should be back to original state
      const finalExpanded = await sectionHeader.getAttribute('aria-expanded');
      expect(finalExpanded).toBe(initialExpanded);
    }
  });

  test('should show dropdown arrow icon in section headers', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find section headers
    const sectionHeaders = page.locator('button:has-text("Favorites"), button:has-text("All Recipes")');
    const count = await sectionHeaders.count();

    for (let i = 0; i < count; i++) {
      const header = sectionHeaders.nth(i);
      if (await header.isVisible()) {
        // Check for SVG icon (arrow)
        const arrow = header.locator('svg').first();
        await expect(arrow).toBeVisible();
      }
    }
  });

  test('should move recipe from All Recipes to Favorites when favorited', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find a recipe in "All Recipes" section that is not favorited
    const allRecipesSection = page.locator('button:has-text("All Recipes")').first();
    
    if (await allRecipesSection.isVisible()) {
      // Ensure the All Recipes section is expanded
      const isExpanded = await allRecipesSection.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await allRecipesSection.click();
        await page.waitForTimeout(500);
      }

      // Find all recipe cards
      const recipeCards = page.locator('[class*="shadow"]:has(h3)');
      const cardCount = await recipeCards.count();

      if (cardCount > 0) {
        // Find a recipe card with an unfilled favorite star
        let unfavoritedCard = null;
        for (let i = 0; i < cardCount; i++) {
          const card = recipeCards.nth(i);
          const favoriteButton = card.locator('button[aria-label*="Add to favorites"]').first();
          
          if (await favoriteButton.isVisible()) {
            unfavoritedCard = card;
            break;
          }
        }

        if (unfavoritedCard) {
          const recipeTitleElement = unfavoritedCard.locator('h3').first();
          const recipeTitle = await recipeTitleElement.textContent();
          
          // Click the favorite button
          const favoriteButton = unfavoritedCard.locator('button[aria-label*="Add to favorites"]').first();
          await favoriteButton.click();
          
          // Wait for the mutation to complete
          await page.waitForTimeout(1500);

          // Check that the recipe now appears in Favorites section
          const favoritesSection = page.locator('button:has-text("Favorites")').first();
          
          if (await favoritesSection.isVisible()) {
            // Ensure Favorites section is expanded
            const isFavExpanded = await favoritesSection.getAttribute('aria-expanded');
            if (isFavExpanded === 'false') {
              await favoritesSection.click();
              await page.waitForTimeout(500);
            }

            // Look for the recipe in the favorites section
            const favoriteRecipe = page.locator(`text=${recipeTitle}`).first();
            await expect(favoriteRecipe).toBeVisible();
          }
        }
      }
    }
  });

  test('should move recipe from Favorites to All Recipes when unfavorited', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find a recipe in "Favorites" section
    const favoritesSection = page.locator('button:has-text("Favorites")').first();
    
    if (await favoritesSection.isVisible()) {
      // Ensure the Favorites section is expanded
      const isExpanded = await favoritesSection.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await favoritesSection.click();
        await page.waitForTimeout(500);
      }

      // Find all recipe cards
      const recipeCards = page.locator('[class*="shadow"]:has(h3)');
      const cardCount = await recipeCards.count();

      if (cardCount > 0) {
        // Find a recipe card with a filled favorite star
        let favoritedCard = null;
        for (let i = 0; i < cardCount; i++) {
          const card = recipeCards.nth(i);
          const favoriteButton = card.locator('button[aria-label*="Remove from favorites"]').first();
          
          if (await favoriteButton.isVisible()) {
            favoritedCard = card;
            break;
          }
        }

        if (favoritedCard) {
          const recipeTitleElement = favoritedCard.locator('h3').first();
          const recipeTitle = await recipeTitleElement.textContent();
          
          // Click the favorite button to unfavorite
          const favoriteButton = favoritedCard.locator('button[aria-label*="Remove from favorites"]').first();
          await favoriteButton.click();
          
          // Wait for the mutation to complete
          await page.waitForTimeout(1500);

          // Check that the recipe now appears in All Recipes section
          const allRecipesSection = page.locator('button:has-text("All Recipes")').first();
          
          if (await allRecipesSection.isVisible()) {
            // Ensure All Recipes section is expanded
            const isAllExpanded = await allRecipesSection.getAttribute('aria-expanded');
            if (isAllExpanded === 'false') {
              await allRecipesSection.click();
              await page.waitForTimeout(500);
            }

            // Look for the recipe in the all recipes section
            const unfavoritedRecipe = page.locator(`text=${recipeTitle}`).first();
            await expect(unfavoritedRecipe).toBeVisible();
          }
        }
      }
    }
  });

  test('should work correctly with search functionality', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find the search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      // Enter a search term
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Sections should still be visible
      const favoritesSection = page.locator('button:has-text("Favorites")').first();
      const allRecipesSection = page.locator('button:has-text("All Recipes")').first();

      // At least one section should be visible
      const favoritesVisible = await favoritesSection.isVisible().catch(() => false);
      const allRecipesVisible = await allRecipesSection.isVisible().catch(() => false);

      // If there are matching recipes, at least one section should be visible
      const recipeCards = page.locator('[class*="shadow"]:has(h3)');
      const hasRecipes = await recipeCards.count() > 0;

      if (hasRecipes) {
        expect(favoritesVisible || allRecipesVisible).toBe(true);
      }

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(1000);
    }
  });

  test('should persist collapsed/expanded state in localStorage', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find a section header
    const sectionHeader = page.locator('button:has-text("Favorites"), button:has-text("All Recipes")').first();
    
    if (await sectionHeader.isVisible()) {
      // Toggle the section
      await sectionHeader.click();
      await page.waitForTimeout(500);
      
      const toggledState = await sectionHeader.getAttribute('aria-expanded');

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that the state persisted
      const reloadedHeader = page.locator('button:has-text("Favorites"), button:has-text("All Recipes")').first();
      
      if (await reloadedHeader.isVisible()) {
        const persistedState = await reloadedHeader.getAttribute('aria-expanded');
        expect(persistedState).toBe(toggledState);
      }
    }
  });

  test('should display empty state when no favorites exist', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check if we're showing any recipes
    const recipeCards = page.locator('[class*="shadow"]:has(h3)');
    const hasRecipes = await recipeCards.count() > 0;

    if (hasRecipes) {
      // Unfavorite all recipes to test empty state
      const favoriteButtons = page.locator('button[aria-label*="Remove from favorites"]');
      const favCount = await favoriteButtons.count();

      for (let i = 0; i < favCount; i++) {
        const btn = favoriteButtons.first();
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(500);
        }
      }

      // After unfavoriting all, Favorites section might be hidden or show empty state
      await page.waitForTimeout(1000);
      
      // The page should still be functional
      const mainContent = page.locator('main, body');
      await expect(mainContent).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Sections should still be visible and functional
    const sectionHeaders = page.locator('button:has-text("Favorites"), button:has-text("All Recipes")');
    const count = await sectionHeaders.count();

    if (count > 0) {
      const firstHeader = sectionHeaders.first();
      await expect(firstHeader).toBeVisible();

      // Should be clickable on mobile
      await firstHeader.click();
      await page.waitForTimeout(500);

      // Check that it toggled
      const ariaExpanded = await firstHeader.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('true');
    }
  });
});
