---
applyTo: "frontend/tests/**/*.spec.js,frontend/tests/**/*.spec.ts,frontend/e2e/**/*.spec.js,frontend/src/**/*.test.js,frontend/src/**/*.test.jsx"
---

# Frontend Test Instructions

## Testing Frameworks
- **Vitest** for unit tests (utilities, hooks)
- **Playwright** for E2E tests (user flows)
- **Playwright MCP Server** for browser automation

## E2E Testing with Playwright

### Critical Setup Requirements
**BEFORE running E2E tests, ALWAYS:**
1. Set `VITE_BYPASS_AUTH=true` in `/frontend/.env.local`
2. Restart frontend dev server for env changes to take effect
3. Start backend: `dotnet run --project /home/runner/work/recipe-manager-webapp/recipe-manager-webapp/backend/RecipeManager.Api.csproj`
4. Start frontend: `npm run dev` (in separate terminal)
5. Run tests: `npx playwright test --workers=1`

### Why Auth Bypass is Required
Playwright tests CANNOT handle Firebase authentication flows. Development mode auth bypass creates a mock "Dev User" that tests can use. Without this, ALL tests will fail with authentication errors.

### Test Location
- E2E tests located in: `/frontend/tests/e2e/` (NOT `/frontend/e2e/`)
- Test configuration: `/frontend/playwright.config.js`

### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with 1 worker to avoid SQLite conflicts
npx playwright test --workers=1
```

### E2E Test Patterns

#### Critical User Flows to Test
- Authentication (sign in, sign out)
- Recipe CRUD (create via link/upload/manual, read, update, delete)
- Search functionality
- Favorites toggle
- Category and tag filtering

#### Test Structure
```javascript
import { test, expect } from '@playwright/test';

test.describe('Recipe Management', () => {
  test('user can add recipe via external link', async ({ page }) => {
    // Navigate to app (should show "Dev User" logged in)
    await page.goto('http://localhost:5173');
    
    // Wait for recipes to load
    await page.waitForSelector('[data-testid="recipe-list"]');
    
    // Add recipe
    await page.click('button:has-text("Add Recipe")');
    await page.fill('input[name="title"]', 'Test Recipe');
    await page.fill('input[name="url"]', 'https://example.com/recipe');
    await page.click('button:has-text("Save")');
    
    // Verify recipe appears
    await expect(page.locator('text=Test Recipe')).toBeVisible();
  });
});
```

### Common E2E Test Issues

#### Authentication Errors
- **Symptom**: Tests fail with "authentication form not found"
- **Solution**: Set `VITE_BYPASS_AUTH=true` and restart dev server

#### Timeout Errors
- **Symptom**: Tests timeout waiting for elements
- **Solution**: Verify backend and frontend are running; increase timeout

#### Connection Refused
- **Symptom**: "Connection refused" errors
- **Solution**: Check backend is on correct port; verify `VITE_API_BASE_URL`

#### Strict Mode Violations
- **Symptom**: "strict mode violation" errors
- **Solution**: Use more specific locators (e.g., `first()` or filter by role)

### Taking Screenshots
```javascript
// Playwright automatically captures screenshots on failure
// Screenshots saved to: /frontend/test-results/

// Manual screenshot
await page.screenshot({ path: 'screenshot.png' });
```

## Unit Testing with Vitest

### Running Unit Tests
```bash
# Run all unit tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Unit Test Patterns
```javascript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

describe('useRecipeForm', () => {
  it('should handle form submission', async () => {
    const mockSubmit = vi.fn();
    const { result } = renderHook(() => useRecipeForm(mockSubmit));
    
    // Act
    await result.current.handleSubmit({ title: 'Test' });
    
    // Assert
    expect(mockSubmit).toHaveBeenCalledWith({ title: 'Test' });
  });
});
```

### What to Test
- **Unit tests**: Utilities, validation functions, custom hooks
- **E2E tests**: Complete user flows, critical paths
- Mock API calls in unit tests
- Use real API in E2E tests (with test database)

## Test Coverage
- Run `npm run test` before every commit
- E2E tests should pass for affected user flows
- Test both happy path AND error scenarios
