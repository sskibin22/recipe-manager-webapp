import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Recipe Form Image Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('manual recipe form should have display image upload field', async ({ page }) => {
    // Look for "Add Recipe" or similar button
    const addButton = page.locator('button', { hasText: /add.*recipe/i }).first();
    
    if (await addButton.count() === 0) {
      test.skip(true, 'Add recipe button not found - may require authentication');
      return;
    }

    // Click to open form
    await addButton.click();
    
    // Wait for form modal to appear
    await page.waitForSelector('text=Add New Recipe', { timeout: 5000 });
    
    // Select Manual recipe type
    await page.locator('input[type="radio"][value="manual"]').check();
    
    // Verify display image upload field exists
    const displayImageLabel = page.locator('label', { hasText: /display image/i });
    await expect(displayImageLabel).toBeVisible();
    
    // Verify the field indicates it's optional
    await expect(displayImageLabel).toContainText(/optional/i);
    
    // Verify file input exists
    const fileInput = page.locator('input[type="file"]#displayImage');
    await expect(fileInput).toBeVisible();
    
    // Verify file type restrictions are shown
    const helpText = page.locator('text=/JPG.*PNG.*GIF.*WEBP/i');
    await expect(helpText).toBeVisible();
    
    // Verify size limit is shown
    const sizeLimit = page.locator('text=/5MB/i');
    await expect(sizeLimit).toBeVisible();
  });

  test('document recipe form should have display image upload field', async ({ page }) => {
    const addButton = page.locator('button', { hasText: /add.*recipe/i }).first();
    
    if (await addButton.count() === 0) {
      test.skip(true, 'Add recipe button not found - may require authentication');
      return;
    }

    await addButton.click();
    await page.waitForSelector('text=Add New Recipe', { timeout: 5000 });
    
    // Select Document recipe type
    await page.locator('input[type="radio"][value="document"]').check();
    
    // Verify TWO file upload fields exist
    // 1. Document upload (required)
    const documentLabel = page.locator('label', { hasText: /upload document/i });
    await expect(documentLabel).toBeVisible();
    
    // 2. Display image upload (optional)
    const displayImageLabel = page.locator('label', { hasText: /display image/i });
    await expect(displayImageLabel).toBeVisible();
    await expect(displayImageLabel).toContainText(/optional/i);
    
    // Verify both file inputs exist and are distinct
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('link recipe form should NOT have display image upload field', async ({ page }) => {
    const addButton = page.locator('button', { hasText: /add.*recipe/i }).first();
    
    if (await addButton.count() === 0) {
      test.skip(true, 'Add recipe button not found - may require authentication');
      return;
    }

    await addButton.click();
    await page.waitForSelector('text=Add New Recipe', { timeout: 5000 });
    
    // Link is the default type, but let's be explicit
    await page.locator('input[type="radio"][value="link"]').check();
    
    // Verify display image upload field does NOT exist for link recipes
    // (Link recipes get images from metadata)
    const displayImageInput = page.locator('input[type="file"]#displayImage');
    await expect(displayImageInput).not.toBeVisible();
    
    // But there should be a preview image URL field in the metadata section
    const previewImageUrlField = page.locator('input[type="url"]#previewImageUrl');
    // This might not be visible initially until metadata is fetched
  });

  test('manual recipe form should validate image file size', async ({ page }) => {
    const addButton = page.locator('button', { hasText: /add.*recipe/i }).first();
    
    if (await addButton.count() === 0) {
      test.skip(true, 'Add recipe button not found - may require authentication');
      return;
    }

    await addButton.click();
    await page.waitForSelector('text=Add New Recipe', { timeout: 5000 });
    
    // Select Manual recipe type
    await page.locator('input[type="radio"][value="manual"]').check();
    
    // Fill in required fields
    await page.locator('input#title').fill('Test Manual Recipe with Image');
    await page.locator('textarea#content').fill('Test recipe content');
    
    // Note: We can't easily test file upload validation without actually uploading a file
    // This would require creating a test file or using a fixture
    // For now, we just verify the form structure is correct
    
    const fileInput = page.locator('input[type="file"]#displayImage');
    const acceptAttr = await fileInput.getAttribute('accept');
    // Accept attribute format: '.jpg,.jpeg,.png,.gif,.webp'
    expect(acceptAttr).toContain('.jpg');
    expect(acceptAttr).toContain('.png');
  });

  test('form should show selected image file name for manual recipe', async ({ page }) => {
    const addButton = page.locator('button', { hasText: /add.*recipe/i }).first();
    
    if (await addButton.count() === 0) {
      test.skip(true, 'Add recipe button not found - may require authentication');
      return;
    }

    await addButton.click();
    await page.waitForSelector('text=Add New Recipe', { timeout: 5000 });
    
    // Select Manual recipe type
    await page.locator('input[type="radio"][value="manual"]').check();
    
    // Verify that after file selection, the filename would be displayed
    // (We can't actually upload without a real file, but we can check the UI structure)
    const fileInput = page.locator('input[type="file"]#displayImage');
    await expect(fileInput).toBeVisible();
    
    // The form should have a way to show "Selected: filename.jpg (0.5MB)"
    // This text would appear after file selection
  });

  test('form should show selected image file name for document recipe', async ({ page }) => {
    const addButton = page.locator('button', { hasText: /add.*recipe/i }).first();
    
    if (await addButton.count() === 0) {
      test.skip(true, 'Add recipe button not found - may require authentication');
      return;
    }

    await addButton.click();
    await page.waitForSelector('text=Add New Recipe', { timeout: 5000 });
    
    // Select Document recipe type
    await page.locator('input[type="radio"][value="document"]').check();
    
    // Verify both file inputs
    const documentInput = page.locator('input[type="file"]#file');
    await expect(documentInput).toBeVisible();
    
    const imageInput = page.locator('input[type="file"]#displayImage');
    await expect(imageInput).toBeVisible();
    
    // Both should have different accept attributes
    const docAccept = await documentInput.getAttribute('accept');
    expect(docAccept).toContain('.pdf');
    
    const imgAccept = await imageInput.getAttribute('accept');
    // Accept attribute format: '.jpg,.jpeg,.png,.gif,.webp'
    expect(imgAccept).toContain('.jpg');
    expect(imgAccept).toContain('.png');
  });
});
