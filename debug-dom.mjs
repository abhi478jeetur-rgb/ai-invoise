import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); 
  const html = await page.evaluate(() => {
    const el = document.querySelector('.min-h-\\[65px\\]');
    return el ? el.outerHTML : 'NOT FOUND';
  });
  console.log(html);
  await browser.close();
})();
