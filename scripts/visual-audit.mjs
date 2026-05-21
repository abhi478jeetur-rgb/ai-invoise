import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'visual-audit');

async function visualAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Step 1: Navigate to login page
  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-page.png'), fullPage: true });
  console.log('   Screenshot saved: 01-login-page.png');

  // Step 2: Fill credentials and sign in
  console.log('2. Filling credentials and signing in...');
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'testabhi@clockivo.com');
  await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', '***REMOVED***');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-filled.png'), fullPage: true });
  console.log('   Screenshot saved: 02-login-filled.png');

  // Click sign in button
  await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log in")');
  console.log('   Clicked sign in button...');

  // Step 3: Wait for dashboard
  console.log('3. Waiting for dashboard...');
  try {
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log('   Dashboard loaded successfully!');
  } catch (e) {
    console.log('   Waiting for URL failed, checking current state...');
    console.log('   Current URL:', page.url());
    // Try waiting a bit more
    await page.waitForTimeout(3000);
    console.log('   URL after wait:', page.url());
  }

  // Step 4: Take dashboard screenshot
  console.log('4. Taking dashboard screenshot...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-dashboard.png'), fullPage: true });
  console.log('   Screenshot saved: 03-dashboard.png');

  // Also take a viewport-only screenshot
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-dashboard-viewport.png'), fullPage: false });
  console.log('   Screenshot saved: 04-dashboard-viewport.png');

  // Step 5: Check for stat cards
  console.log('5. Inspecting dashboard elements...');

  // Look for stat cards
  const statCards = await page.$$('[class*="stat"], [class*="card"], [class*="glass"]');
  console.log(`   Found ${statCards.length} card-like elements`);

  // Check for "Who to Chase Today" section
  const chaseSection = await page.$('text=/[Cc]hase/');
  if (chaseSection) {
    console.log('   Found "Who to Chase Today" section');
    const box = await chaseSection.boundingBox();
    if (box) {
      console.log(`   Chase section bounds: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    }
  } else {
    console.log('   "Who to Chase Today" section not found by text');
  }

  // Check for overlapping text
  const allText = await page.$$eval('*', elements => {
    return elements
      .filter(el => el.textContent && el.textContent.trim().length > 0 && el.children.length === 0)
      .slice(0, 50)
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          text: el.textContent.trim().substring(0, 50),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        };
      });
  });
  console.log('   Text elements (first 50):');
  allText.forEach(t => {
    if (t.w > 0 && t.h > 0) {
      console.log(`     "${t.text}" at (${t.x},${t.y}) size ${t.w}x${t.h}`);
    }
  });

  // Take a focused screenshot of stat area
  const statArea = await page.$('[class*="stat"], [class*="grid"]');
  if (statArea) {
    await statArea.screenshot({ path: path.join(SCREENSHOT_DIR, '05-stat-cards.png') });
    console.log('   Screenshot saved: 05-stat-cards.png');
  }

  await browser.close();
  console.log('\nAudit complete! Screenshots saved to:', SCREENSHOT_DIR);
}

visualAudit().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
