const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));
  await page.goto('https://ai-invoise.vercel.app/sign-in', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  const html = await page.$eval('form', el => el.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('form.html', html);
  await browser.close();
  console.log('Done');
})();
