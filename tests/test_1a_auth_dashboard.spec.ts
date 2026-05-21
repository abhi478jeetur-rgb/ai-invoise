import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

async function safeScreenshot(page: any, pathStr: string) {
  try {
    await page.screenshot({ path: pathStr });
  } catch (err) {
    console.warn(`[Screenshot Warning] Ignored error: ${err}`);
  }
}

test.describe('Test 1a: Authentication & Core Dashboard Verification', () => {
  test.beforeAll(() => {
    const dir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('Should log in successfully with credentials and load currency-aware dashboard layout', async ({ page }) => {
    console.log('=== Starting Test 1a: Authentication & Core Dashboard ===');

    // 1. Visit the sign-in page directly
    await page.goto('/sign-in');
    console.log('Navigated to sign-in page:', page.url());
    await safeScreenshot(page, 'test-results/test_1a_01_signin_page.png');

    // 2. Fill in credentials and submit
    console.log('Filling sign-in credentials...');
    await page.fill('input[name="email"]', 'testabhi@clockivo.com');
    await page.fill('input[name="password"]', '***REMOVED***');
    await safeScreenshot(page, 'test-results/test_1a_02_signin_filled.png');

    // Click sign in button
    console.log('Submitting sign-in form...');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {
      console.log('URL after login attempt:', page.url());
    });

    // 3. Confirm redirected to dashboard
    console.log('Current URL after login attempt:', page.url());
    await safeScreenshot(page, 'test-results/test_1a_03_after_login.png');
    
    // Assert dashboard path
    expect(page.url()).toContain('/dashboard');
    console.log('✔ Successfully navigated to dashboard.');

    // 4. Verify Dashboard Visual Integrity (Renders main elements without crash)
    const dashboardTitle = page.locator('h1, h2, div:has-text("Who to Chase Today")').first();
    await expect(dashboardTitle).toBeVisible();
    console.log('✔ Verified core dashboard elements are visible.');

    // 5. Verify Outstanding and Overdue metrics cards are active
    const outstandingCard = page.locator('text=/Unpaid/i').first();
    await expect(outstandingCard).toBeVisible();
    console.log('✔ Verified Unpaid balance card is visible.');

    const overdueCard = page.locator('text=/Overdue/i').first();
    await expect(overdueCard).toBeVisible();
    console.log('✔ Verified Overdue balance card is visible.');

    // Final verification screenshot
    await safeScreenshot(page, 'test-results/test_1a_04_dashboard_success.png');
    console.log('=== Test 1a successfully completed! ===');
  });
});
