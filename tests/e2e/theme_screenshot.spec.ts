import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Theme Visual Screenshot Verification', () => {
  test.setTimeout(90000);

  test('capture theme screenshots', async ({ page }) => {
    // 1. Log in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi5@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('U+o6;;EH');
    await page.waitForTimeout(3500); // Wait for Turnstile
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/.*dashboard|invoices/);

    const pages = [
      { name: 'dashboard', url: '/dashboard' },
      { name: 'invoices', url: '/invoices' },
      { name: 'clients', url: '/clients' },
      { name: 'settings', url: '/settings' },
      { name: 'reminders', url: '/reminders' },
      { name: 'trash', url: '/trash' }
    ];

    const screenshotDir = path.join(process.cwd(), 'public', 'theme-debug-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    for (const p of pages) {
      console.log(`Processing ${p.name}...`);

      // --- Capture Light Mode ---
      console.log(`Setting theme to light for ${p.name}`);
      await page.goto(p.url);
      await page.evaluate(() => {
        localStorage.setItem('theme', 'light');
      });
      // Navigate again to force full hydration with the new theme
      await page.goto(p.url);
      await page.waitForTimeout(3500); // Let layout settle

      const lightPath = path.join(screenshotDir, `${p.name}-light.png`);
      await page.screenshot({ path: lightPath, fullPage: true });
      console.log(`Saved screenshot: ${lightPath}`);

      // --- Capture Dark Mode ---
      console.log(`Setting theme to dark for ${p.name}`);
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
      });
      // Navigate again to force full hydration with the new theme
      await page.goto(p.url);
      await page.waitForTimeout(3500); // Let layout settle

      const darkPath = path.join(screenshotDir, `${p.name}-dark.png`);
      await page.screenshot({ path: darkPath, fullPage: true });
      console.log(`Saved screenshot: ${darkPath}`);
    }

    console.log('Screenshots generated successfully!');
  });
});
