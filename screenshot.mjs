import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // Wait 3 seconds for Turnstile to render
  await page.screenshot({ path: 'public/theme-debug-screenshots/turnstile-debug.png' });
  await browser.close();
})();
