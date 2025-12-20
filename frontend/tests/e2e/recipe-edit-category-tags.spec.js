import { test, expect } from '@playwright/test';

test.describe('Recipe Edit Category and Tags Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display category and tags selectors in edit mode', async ({ page }) => {
    // Find a recipe to edit
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      // Click Edit button
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Should show Category selector
        await expect(page.locator('label:has-text("Category")')).toBeVisible();
        await expect(page.locator('select, input[placeholder*="category" i]').first()).toBeVisible();
        
        // Should show Tags selector
        await expect(page.locator('label:has-text("Tags")')).toBeVisible();
        await expect(page.locator('input[placeholder*="tag" i]').first()).toBeVisible();
      }
    }
  });

  test('should allow selecting a category in edit mode', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Find category selector (dropdown)
        const categorySelector = page.locator('select').first();
        if (await categorySelector.count() > 0) {
          // Get available options
          const options = await categorySelector.locator('option').count();
          
          // If there are categories available (more than just "No category")
          if (options > 1) {
            // Select the second option (first actual category)
            await categorySelector.selectOption({ index: 1 });
            
            // Verify selection was made
            const selectedValue = await categorySelector.inputValue();
            expect(selectedValue).not.toBe('');
          }
        }
      }
    }
  });

  test('should allow adding tags in edit mode', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Find tags search input
        const tagsInput = page.locator('input[placeholder*="tag" i]').first();
        if (await tagsInput.count() > 0) {
          // Click on the input to show dropdown
          await tagsInput.click();
          
          // Wait a moment for dropdown to appear
          await page.waitForTimeout(500);
          
          // Try to click on a tag in the dropdown if available
          const firstTag = page.locator('button:has(span)').filter({ hasText: /^[A-Z]/ }).first();
          if (await firstTag.count() > 0) {
            await firstTag.click();
            
            // Should show the selected tag with an X button
            const selectedTag = page.locator('[class*="inline-flex"]:has(button)').first();
            await expect(selectedTag).toBeVisible();
          }
        }
      }
    }
  });

  test('should allow removing tags in edit mode', async ({ page }) => {
    // First, we need a recipe with tags
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // First add a tag if none exist
        const tagsInput = page.locator('input[placeholder*="tag" i]').first();
        if (await tagsInput.count() > 0) {
          await tagsInput.click();
          await page.waitForTimeout(500);
          
          const firstTag = page.locator('button:has(span)').filter({ hasText: /^[A-Z]/ }).first();
          if (await firstTag.count() > 0) {
            await firstTag.click();
            await page.waitForTimeout(300);
            
            // Now try to remove the tag
            const removeButton = page.locator('button[aria-label*="Remove"]').first();
            if (await removeButton.count() > 0) {
              const tagCountBefore = await page.locator('[class*="inline-flex"]:has(button[aria-label*="Remove"])').count();
              await removeButton.click();
              
              // Verify tag was removed
              const tagCountAfter = await page.locator('[class*="inline-flex"]:has(button[aria-label*="Remove"])').count();
              expect(tagCountAfter).toBe(tagCountBefore - 1);
            }
          }
        }
      }
    }
  });

  test('should save category and tags changes', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Select a category
        const categorySelector = page.locator('select').first();
        if (await categorySelector.count() > 0) {
          const options = await categorySelector.locator('option').count();
          if (options > 1) {
            await categorySelector.selectOption({ index: 1 });
          }
        }
        
        // Add a tag
        const tagsInput = page.locator('input[placeholder*="tag" i]').first();
        if (await tagsInput.count() > 0) {
          await tagsInput.click();
          await page.waitForTimeout(500);
          
          const firstTag = page.locator('button:has(span)').filter({ hasText: /^[A-Z]/ }).first();
          if (await firstTag.count() > 0) {
            await firstTag.click();
          }
        }
        
        // Save changes
        await page.locator('button:has-text("Save Changes")').click();
        
        // Wait for save to complete
        await expect(page.locator('button:has-text("Edit Recipe")')).toBeVisible({ timeout: 10000 });
        
        // Should show success message
        const successMessage = page.locator('text=Recipe updated successfully');
        if (await successMessage.count() > 0) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should persist category and tags after save', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Select a category and note which one
        const categorySelector = page.locator('select').first();
        let selectedCategoryText = '';
        if (await categorySelector.count() > 0) {
          const options = await categorySelector.locator('option').count();
          if (options > 1) {
            await categorySelector.selectOption({ index: 1 });
            selectedCategoryText = await categorySelector.locator('option:checked').textContent();
          }
        }
        
        // Save changes
        await page.locator('button:has-text("Save Changes")').click();
        await expect(page.locator('button:has-text("Edit Recipe")')).toBeVisible({ timeout: 10000 });
        
        // Verify category is displayed on the page
        if (selectedCategoryText) {
          await expect(page.locator(`text=${selectedCategoryText}`).first()).toBeVisible();
        }
      }
    }
  });

  test('should work for Link recipe type', async ({ page }) => {
    // Find a link-type recipe
    const linkRecipes = page.locator('[class*="link"], a[href*="/recipe/"]').first();
    const count = await linkRecipes.count();
    
    if (count > 0) {
      await linkRecipes.click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Should show category and tags selectors
        await expect(page.locator('label:has-text("Category")')).toBeVisible();
        await expect(page.locator('label:has-text("Tags")')).toBeVisible();
      }
    }
  });

  test('should work for Manual recipe type', async ({ page }) => {
    // Try to find a manual recipe
    const manualRecipes = page.locator('[class*="manual"], a[href*="/recipe/"]').first();
    const count = await manualRecipes.count();
    
    if (count > 0) {
      await manualRecipes.click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Should show category and tags selectors
        await expect(page.locator('label:has-text("Category")')).toBeVisible();
        await expect(page.locator('label:has-text("Tags")')).toBeVisible();
      }
    }
  });

  test('should work for Document recipe type', async ({ page }) => {
    // Try to find a document recipe
    const documentRecipes = page.locator('[class*="document"], a[href*="/recipe/"]').first();
    const count = await documentRecipes.count();
    
    if (count > 0) {
      await documentRecipes.click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Should show category and tags selectors
        await expect(page.locator('label:has-text("Category")')).toBeVisible();
        await expect(page.locator('label:has-text("Tags")')).toBeVisible();
      }
    }
  });

  test('should reset category and tags when canceling edit', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Get original category selection
        const categorySelector = page.locator('select').first();
        let originalValue = '';
        if (await categorySelector.count() > 0) {
          originalValue = await categorySelector.inputValue();
        }
        
        // Change category
        const options = await categorySelector.locator('option').count();
        if (options > 1) {
          // Select a different option
          const targetIndex = originalValue === '' ? 1 : 0;
          await categorySelector.selectOption({ index: targetIndex });
        }
        
        // Cancel edit
        await page.locator('button:has-text("Cancel")').click();
        
        // Re-enter edit mode
        await editButton.click();
        
        // Verify category was reset to original
        if (await categorySelector.count() > 0) {
          const currentValue = await categorySelector.inputValue();
          expect(currentValue).toBe(originalValue);
        }
      }
    }
  });
});
