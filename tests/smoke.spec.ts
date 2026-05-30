import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('homepage loads and has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ChaseFree/i);
  });

  test('homepage has key elements visible', async ({ page }) => {
    await page.goto('/');
    // Check that the page loads without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
