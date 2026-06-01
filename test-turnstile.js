const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://ai-invoise.vercel.app/sign-in', { waitUntil: 'networkidle' });
  const html = await page.$eval('form', el => el.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('form.html', html);
  await browser.close();
  console.log('Done');
})();
