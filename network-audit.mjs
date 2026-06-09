import { chromium } from 'playwright';

(async () => {
  console.log('Starting browser test...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let failedRequests = [];
  let errorResponses = [];
  let consoleErrors = [];

  page.on('requestfailed', request => {
    failedRequests.push(`- URL: ${request.url()}\n  Reason: ${request.failure()?.errorText}`);
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      errorResponses.push(`- URL: ${response.url()}\n  Status: ${response.status()}`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`- ${msg.text()}`);
    }
  });
  
  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  
  console.log('\n=== FAILED REQUESTS (e.g. Blocked by CSP/Browser) ===');
  console.log(failedRequests.length ? failedRequests.join('\n') : 'None');
  
  console.log('\n=== ERROR RESPONSES (4xx/5xx) ===');
  console.log(errorResponses.length ? errorResponses.join('\n') : 'None');
  
  console.log('\n=== CONSOLE ERRORS ===');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : 'None');

  await browser.close();
})();
