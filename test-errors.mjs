import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  
  // Test landing page
  const page1 = await browser.newPage();
  let errors1 = 0;
  page1.on('console', msg => { if (msg.type() === 'error') { console.log('Landing Error:', msg.text()); errors1++; } });
  page1.on('pageerror', err => { console.log('Landing PageError:', err); errors1++; });
  await page1.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  console.log('Landing page errors:', errors1);

  await browser.close();
})();
