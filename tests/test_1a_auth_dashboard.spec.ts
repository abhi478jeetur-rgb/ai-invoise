import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Test 1a: Authentication & Core Dashboard Verification', () => {
  test.beforeAll(() => {
    const dir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('Should log in successfully with credentials and load currency-aware dashboard layout', async ({ page }) => {
    console.log('=== Starting Test 1a: Authentication & Core Dashboard ===');

    // 1. Visit the home page
    await page.goto('/');
    console.log('Navigated to homepage:', page.url());
    await page.screenshot({ path: 'test-results/test_1a_01_landing.png' });

    // 2. Redirect to sign-in page if not authenticated
    if (page.url().includes('/sign-in') || await page.locator('input[type="email"]').isVisible()) {
      console.log('Filling sign-in credentials...');
      
      // Target elements based on sign-in form labels
      await page.fill('input[name="email"]', 'abhi478jeetur@gmail.com');
      await page.fill('input[name="password"]', 'password123');
      await page.screenshot({ path: 'test-results/test_1a_02_signin_filled.png' });

      // Click sign in button
      console.log('Submitting sign-in form...');
      await page.click('button[type="submit"]');
      
      // Wait for navigation or successful state
      await page.waitForTimeout(3000); 
    }

    // 3. Confirm redirected to dashboard
    console.log('Current URL after login attempt:', page.url());
    await page.screenshot({ path: 'test-results/test_1a_03_after_login.png' });
    
    // Assert dashboard path
    expect(page.url()).toContain('/dashboard');
    console.log('✔ Successfully navigated to dashboard.');

    // 4. Verify Dashboard Visual Integrity (Renders main elements without crash)
    const dashboardTitle = page.locator('h1, h2, div:has-text("Who to Chase Today")').first();
    await expect(dashboardTitle).toBeVisible();
    console.log('✔ Verified core dashboard elements are visible.');

    // 5. Verify Outstanding and Overdue metrics cards are active
    const outstandingCard = page.locator('text=/Outstanding/i').first();
    await expect(outstandingCard).toBeVisible();
    console.log('✔ Verified Outstanding balance card is visible.');

    const overdueCard = page.locator('text=/Overdue/i').first();
    await expect(overdueCard).toBeVisible();
    console.log('✔ Verified Overdue balance card is visible.');

    // Final verification screenshot
    await page.screenshot({ path: 'test-results/test_1a_04_dashboard_success.png' });
    console.log('=== Test 1a successfully completed! ===');
  });
});
