import { test, expect } from '@playwright/test';

test.describe('AuthForm Autocomplete Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have autocomplete attribute on email input', async ({ page }) => {
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible();
    
    const autocompleteAttr = await emailInput.getAttribute('autocomplete');
    expect(autocompleteAttr).toBe('email');
  });

  test('should have autocomplete="current-password" on password input in sign-in mode', async ({ page }) => {
    // Default mode is sign-in
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible();
    
    const autocompleteAttr = await passwordInput.getAttribute('autocomplete');
    expect(autocompleteAttr).toBe('current-password');
  });

  test('should have autocomplete="new-password" on password input in sign-up mode', async ({ page }) => {
    // Click the toggle to switch to sign-up mode
    const toggleButton = page.locator('button:has-text("Don\'t have an account? Sign up")');
    await toggleButton.click();
    
    // Wait for the form to update
    await page.waitForTimeout(300);
    
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible();
    
    const autocompleteAttr = await passwordInput.getAttribute('autocomplete');
    expect(autocompleteAttr).toBe('new-password');
  });

  test('should have autocomplete="given-name" on first name input in sign-up mode', async ({ page }) => {
    // Click the toggle to switch to sign-up mode
    const toggleButton = page.locator('button:has-text("Don\'t have an account? Sign up")');
    await toggleButton.click();
    
    // Wait for the form to update
    await page.waitForTimeout(300);
    
    const firstNameInput = page.locator('input#firstName');
    await expect(firstNameInput).toBeVisible();
    
    const autocompleteAttr = await firstNameInput.getAttribute('autocomplete');
    expect(autocompleteAttr).toBe('given-name');
  });

  test('should have autocomplete="family-name" on last name input in sign-up mode', async ({ page }) => {
    // Click the toggle to switch to sign-up mode
    const toggleButton = page.locator('button:has-text("Don\'t have an account? Sign up")');
    await toggleButton.click();
    
    // Wait for the form to update
    await page.waitForTimeout(300);
    
    const lastNameInput = page.locator('input#lastName');
    await expect(lastNameInput).toBeVisible();
    
    const autocompleteAttr = await lastNameInput.getAttribute('autocomplete');
    expect(autocompleteAttr).toBe('family-name');
  });

  test('should have autocomplete="new-password" on confirm password input in sign-up mode', async ({ page }) => {
    // Click the toggle to switch to sign-up mode
    const toggleButton = page.locator('button:has-text("Don\'t have an account? Sign up")');
    await toggleButton.click();
    
    // Wait for the form to update
    await page.waitForTimeout(300);
    
    const confirmPasswordInput = page.locator('input#confirmPassword');
    await expect(confirmPasswordInput).toBeVisible();
    
    const autocompleteAttr = await confirmPasswordInput.getAttribute('autocomplete');
    expect(autocompleteAttr).toBe('new-password');
  });

  test('all form inputs should have proper autocomplete attributes', async ({ page }) => {
    // Switch to sign-up mode to see all fields
    const toggleButton = page.locator('button:has-text("Don\'t have an account? Sign up")');
    await toggleButton.click();
    
    // Wait for the form to update
    await page.waitForTimeout(300);
    
    // Verify all autocomplete attributes at once
    const firstNameInput = page.locator('input#firstName');
    const lastNameInput = page.locator('input#lastName');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const confirmPasswordInput = page.locator('input#confirmPassword');
    
    await expect(firstNameInput).toHaveAttribute('autocomplete', 'given-name');
    await expect(lastNameInput).toHaveAttribute('autocomplete', 'family-name');
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    await expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
  });
});
