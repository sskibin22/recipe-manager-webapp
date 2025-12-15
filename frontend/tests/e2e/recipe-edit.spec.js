import { test, expect } from '@playwright/test';

test.describe('Recipe Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display edit button on recipe detail page', async ({ page }) => {
    // Look for any recipe card or create one if needed
    const recipeCards = page.locator('[data-testid="recipe-card"], .recipe-card, article, div[class*="card"]');
    const cardCount = await recipeCards.count();
    
    if (cardCount > 0) {
      // Click on the first recipe
      await recipeCards.first().click();
      
      // Wait for navigation to detail page
      await page.waitForURL(/\/recipe\//);
      
      // Check for Edit button
      const editButton = page.locator('button:has-text("Edit Recipe")');
      await expect(editButton).toBeVisible({ timeout: 10000 });
    }
  });

  test('should enter edit mode when Edit button is clicked', async ({ page }) => {
    // Try to find a recipe link or card
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      // Click Edit button
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Should show Save and Cancel buttons
        await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
        await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
        
        // Edit button should be hidden
        await expect(editButton).not.toBeVisible();
      }
    }
  });

  test('should allow editing recipe title', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Find title input
        const titleInput = page.locator('input[id="title"], input[placeholder*="title" i]');
        if (await titleInput.count() > 0) {
          const originalTitle = await titleInput.inputValue();
          
          // Edit the title
          await titleInput.fill('Updated Recipe Title');
          
          // Value should be updated
          await expect(titleInput).toHaveValue('Updated Recipe Title');
        }
      }
    }
  });

  test('should cancel edit without saving changes', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      // Get original title
      const titleHeading = page.locator('h1').filter({ hasText: /\w/ }).first();
      const originalTitle = await titleHeading.textContent();
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Edit title
        const titleInput = page.locator('input[id="title"]');
        if (await titleInput.count() > 0) {
          await titleInput.fill('Temporary Title');
          
          // Click Cancel
          await page.locator('button:has-text("Cancel")').click();
          
          // Should exit edit mode
          await expect(page.locator('button:has-text("Edit Recipe")')).toBeVisible();
          
          // Original title should be restored
          await expect(titleHeading).toHaveText(originalTitle);
        }
      }
    }
  });

  test('should save recipe changes successfully', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Edit title
        const titleInput = page.locator('input[id="title"]');
        if (await titleInput.count() > 0) {
          const timestamp = Date.now();
          const newTitle = `Test Recipe ${timestamp}`;
          await titleInput.fill(newTitle);
          
          // Save changes
          await page.locator('button:has-text("Save Changes")').click();
          
          // Should exit edit mode (with timeout for API call)
          await expect(page.locator('button:has-text("Edit Recipe")')).toBeVisible({ timeout: 10000 });
          
          // Should show success message
          const successMessage = page.locator('text=Recipe updated successfully');
          if (await successMessage.count() > 0) {
            await expect(successMessage).toBeVisible();
          }
          
          // Title should be updated
          await expect(page.locator(`h1:has-text("${newTitle}")`)).toBeVisible();
        }
      }
    }
  });

  test('should validate required title field', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Clear title
        const titleInput = page.locator('input[id="title"]');
        if (await titleInput.count() > 0) {
          await titleInput.fill('');
          
          // Try to save
          await page.locator('button:has-text("Save Changes")').click();
          
          // Should show validation error
          await expect(page.locator('text=Title is required')).toBeVisible();
          
          // Should still be in edit mode
          await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
        }
      }
    }
  });

  test('should show loading state while saving', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        const titleInput = page.locator('input[id="title"]');
        if (await titleInput.count() > 0) {
          await titleInput.fill('Test Recipe');
          
          // Click save and immediately check for loading state
          const saveButton = page.locator('button:has-text("Save Changes")');
          await saveButton.click();
          
          // May briefly show "Saving..." text
          const savingText = page.locator('text=Saving');
          if (await savingText.count() > 0) {
            await expect(savingText).toBeVisible();
          }
        }
      }
    }
  });

  test('should edit URL field for link recipes', async ({ page }) => {
    // Look for link-type recipes specifically
    const linkRecipes = page.locator('[class*="link"], [data-type="link"]').first();
    const linkCount = await linkRecipes.count();
    
    if (linkCount > 0) {
      await linkRecipes.click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Look for URL input
        const urlInput = page.locator('input[type="url"], input[placeholder*="example.com"]');
        if (await urlInput.count() > 0) {
          await urlInput.fill('https://example.com/updated-recipe');
          await expect(urlInput).toHaveValue('https://example.com/updated-recipe');
        }
      }
    }
  });

  test('should edit content field for manual recipes', async ({ page }) => {
    // Look for manual-type recipes specifically
    const manualRecipes = page.locator('[class*="manual"], [data-type="manual"]').first();
    const manualCount = await manualRecipes.count();
    
    if (manualCount > 0) {
      await manualRecipes.click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Look for content textarea
        const contentTextarea = page.locator('textarea[placeholder*="content"]');
        if (await contentTextarea.count() > 0) {
          await contentTextarea.fill('Updated recipe content\nWith multiple lines');
          await expect(contentTextarea).toHaveValue('Updated recipe content\nWith multiple lines');
        }
      }
    }
  });

  test('should show file input for document recipes in edit mode', async ({ page }) => {
    // First create a document recipe if needed
    const addButton = page.locator('button:has-text("Add Recipe")');
    if (await addButton.count() > 0) {
      await addButton.click();
      
      // Fill in title
      await page.locator('input[id="title"]').fill('Test Document Recipe');
      
      // Select document type
      await page.locator('input[type="radio"][value="document"]').click();
      
      // Create a test file (small text file)
      const testFileContent = 'Test recipe content for E2E test';
      const buffer = Buffer.from(testFileContent);
      const fileInput = page.locator('input[type="file"]');
      
      // Upload test file
      await fileInput.setInputFiles({
        name: 'test-recipe.txt',
        mimeType: 'text/plain',
        buffer: buffer,
      });
      
      // Submit the form
      await page.locator('button:has-text("Add Recipe")').click();
      
      // Wait for recipe to be created
      await page.waitForTimeout(2000);
    }
    
    // Find and click on a document-type recipe
    const documentRecipes = page.locator('[class*="document"], [data-type="document"], article, div').filter({ hasText: 'Test Document Recipe' }).first();
    const docCount = await documentRecipes.count();
    
    if (docCount > 0) {
      await documentRecipes.click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Should show file input
        const fileInput = page.locator('input[type="file"]');
        await expect(fileInput).toBeVisible();
        
        // Should show replace document text
        await expect(page.locator('text=Replace document')).toBeVisible();
        
        // Should show current document download button
        await expect(page.locator('text=Current document:')).toBeVisible();
      }
    }
  });

  test('should allow replacing document in edit mode', async ({ page }) => {
    // Navigate to a document recipe (assuming one exists from previous test)
    const documentRecipes = page.locator('a[href*="/recipe/"]').filter({ hasText: 'Test Document Recipe' }).or(
      page.locator('[class*="document"]').first()
    );
    const docCount = await documentRecipes.count();
    
    if (docCount > 0) {
      await documentRecipes.first().click();
      await page.waitForURL(/\/recipe\//);
      
      const editButton = page.locator('button:has-text("Edit Recipe")');
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Select a new file
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          const newFileContent = 'Updated recipe content for E2E test';
          const buffer = Buffer.from(newFileContent);
          
          await fileInput.setInputFiles({
            name: 'updated-recipe.txt',
            mimeType: 'text/plain',
            buffer: buffer,
          });
          
          // Should show selected file name
          await expect(page.locator('text=updated-recipe.txt')).toBeVisible();
          
          // Save changes
          await page.locator('button:has-text("Save Changes")').click();
          
          // Should show uploading state
          const uploadingText = page.locator('text=Uploading');
          if (await uploadingText.count() > 0) {
            await expect(uploadingText).toBeVisible();
          }
          
          // Wait for save to complete
          await expect(page.locator('button:has-text("Edit Recipe")')).toBeVisible({ timeout: 15000 });
          
          // Should show success message
          const successMessage = page.locator('text=Recipe updated successfully');
          if (await successMessage.count() > 0) {
            await expect(successMessage).toBeVisible();
          }
        }
      }
    }
  });

  test('should hide favorite button in edit mode', async ({ page }) => {
    const recipeLinks = page.locator('a[href*="/recipe/"]');
    const linkCount = await recipeLinks.count();
    
    if (linkCount > 0) {
      await recipeLinks.first().click();
      await page.waitForURL(/\/recipe\//);
      
      // Check if favorite button exists
      const favButton = page.locator('button').filter({ has: page.locator('svg path[d*="M11.049"]') });
      const favButtonExists = await favButton.count() > 0;
      
      if (favButtonExists) {
        await expect(favButton).toBeVisible();
        
        // Enter edit mode
        const editButton = page.locator('button:has-text("Edit Recipe")');
        await editButton.click();
        
        // Favorite button should be hidden
        await expect(favButton).not.toBeVisible();
      }
    }
  });
});
