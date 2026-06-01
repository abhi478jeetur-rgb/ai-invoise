const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('https://ai-invoise.vercel.app/sign-in', { waitUntil: 'networkidle' });
  
  // Wait a bit to let Turnstile load
  await page.waitForTimeout(5000);
  
  // Check if Turnstile iframe exists
  const iframeCount = await page.locator('iframe').count();
  console.log('Number of iframes:', iframeCount);
  
  const html = await page.$eval('form', el => el.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('form-live.html', html);
  
  await browser.close();
  console.log('Done');
})();
