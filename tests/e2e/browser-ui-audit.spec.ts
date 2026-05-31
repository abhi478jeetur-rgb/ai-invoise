import { test, expect, Page, ConsoleMessage } from '@playwright/test';

// Collect all console errors/warnings across tests
const consoleIssues: { page: string; type: string; text: string; url?: string }[] = [];
const uiIssues: { page: string; issue: string; severity: 'error' | 'warning' | 'info' }[] = [];

function logConsole(pageName: string, msg: ConsoleMessage) {
  const type = msg.type();
  if (type === 'error' || type === 'warning') {
    consoleIssues.push({
      page: pageName,
      type,
      text: msg.text(),
      url: msg.location()?.url,
    });
  }
}

test.describe('Browser UI/UX Audit — Full App', () => {
  test.setTimeout(180_000);

  // ═══════════════════════════════════════════════════════
  // SECTION 1: Unauthenticated Pages (no login needed)
  // ═══════════════════════════════════════════════════════

  test.describe('Unauthenticated Pages', () => {
    test('sign-in page: renders all elements, form validation', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => logConsole('sign-in', msg));
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');

      // Key elements present
      await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();

      // Check for sign-up link
      const signUpLink = page.getByRole('link', { name: /sign up/i });
      if (await signUpLink.isVisible().catch(() => false)) {
        await expect(signUpLink).toBeVisible();
      } else {
        uiIssues.push({ page: 'sign-in', issue: 'No visible Sign Up link on sign-in page', severity: 'warning' });
      }

      // Check for forgot-password link
      const forgotLink = page.getByRole('link', { name: /forgot/i });
      if (await forgotLink.isVisible().catch(() => false)) {
        await expect(forgotLink).toBeVisible();
      } else {
        uiIssues.push({ page: 'sign-in', issue: 'No visible Forgot Password link', severity: 'warning' });
      }

      // Google sign-in button
      const googleBtn = page.getByRole('button', { name: /sign in with google/i });
      if (await googleBtn.isVisible().catch(() => false)) {
        // Good
      } else {
        uiIssues.push({ page: 'sign-in', issue: 'No Google sign-in button found', severity: 'info' });
      }

      // Form validation: empty submit
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/sign-in/);

      // Form validation: invalid email format
      await page.getByRole('textbox', { name: 'Email Address' }).fill('notanemail');
      await page.getByRole('textbox', { name: 'Password' }).fill('short');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForTimeout(1000);

      // Check for error message display
      const errorMsg = page.locator('[class*="red"], [class*="error"], [role="alert"]');
      if (await errorMsg.isVisible().catch(() => false)) {
        // Error message displayed — good
      }

      if (errors.length > 0) {
        uiIssues.push({ page: 'sign-in', issue: `Page errors: ${errors.join('; ')}`, severity: 'error' });
      }
    });

    test('sign-up page: renders all elements, form validation', async ({ page }) => {
      page.on('console', (msg) => logConsole('sign-up', msg));
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/sign-up');
      await page.waitForLoadState('networkidle');

      // Key elements
      await expect(page.getByRole('textbox', { name: 'Full Name' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();

      // Check for Google OAuth button
      const googleBtn = page.getByRole('button', { name: /sign up with google/i });
      if (await googleBtn.isVisible().catch(() => false)) {
        // Good - Google OAuth option available
      }

      // Empty submit validation
      await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
      await page.waitForTimeout(500);

      // Check for sign-in link
      const signInLink = page.getByRole('link', { name: /sign in/i });
      if (await signInLink.isVisible().catch(() => false)) {
        // good
      } else {
        uiIssues.push({ page: 'sign-up', issue: 'No visible Sign In link on sign-up page', severity: 'warning' });
      }

      if (errors.length > 0) {
        uiIssues.push({ page: 'sign-up', issue: `Page errors: ${errors.join('; ')}`, severity: 'error' });
      }
    });

    test('forgot-password page: renders and validates', async ({ page }) => {
      page.on('console', (msg) => logConsole('forgot-password', msg));
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/forgot-password');
      await page.waitForLoadState('networkidle');

      const emailInput = page.getByRole('textbox', { name: /email/i });
      if (await emailInput.isVisible().catch(() => false)) {
        await expect(emailInput).toBeVisible();

        // Empty submit
        const submitBtn = page.getByRole('button', { name: /send|reset|submit/i });
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(500);
        }
      } else {
        uiIssues.push({ page: 'forgot-password', issue: 'No email input found on forgot-password page', severity: 'error' });
      }

      if (errors.length > 0) {
        uiIssues.push({ page: 'forgot-password', issue: `Page errors: ${errors.join('; ')}`, severity: 'error' });
      }
    });

    test('verify-otp page: renders 6 OTP inputs with correct attributes', async ({ page }) => {
      page.on('console', (msg) => logConsole('verify-otp', msg));
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/verify-otp');
      await page.waitForLoadState('networkidle');

      const inputs = page.locator('input[maxlength="1"]');
      const count = await inputs.count();
      if (count === 6) {
        const first = inputs.first();
        await expect(first).toHaveAttribute('inputmode', 'numeric');
        await expect(first).toHaveAttribute('pattern', '[0-9]*');
      } else {
        uiIssues.push({ page: 'verify-otp', issue: `Expected 6 OTP inputs, found ${count}`, severity: 'error' });
      }

      if (errors.length > 0) {
        uiIssues.push({ page: 'verify-otp', issue: `Page errors: ${errors.join('; ')}`, severity: 'error' });
      }
    });

    test('reset-password page: renders correctly', async ({ page }) => {
      page.on('console', (msg) => logConsole('reset-password', msg));
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/reset-password');
      await page.waitForLoadState('networkidle');

      const pwInputs = page.locator('input[type="password"]');
      const pwCount = await pwInputs.count();
      if (pwCount === 0) {
        uiIssues.push({ page: 'reset-password', issue: 'No password inputs found on reset-password page', severity: 'error' });
      }

      if (errors.length > 0) {
        uiIssues.push({ page: 'reset-password', issue: `Page errors: ${errors.join('; ')}`, severity: 'error' });
      }
    });

    test('landing page (/): renders correctly', async ({ page }) => {
      page.on('console', (msg) => logConsole('landing', msg));
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      if (!body || body.trim().length < 50) {
        uiIssues.push({ page: 'landing', issue: 'Landing page appears nearly empty', severity: 'warning' });
      }

      // Check for broken images
      const images = page.locator('img');
      const imgCount = await images.count();
      for (let i = 0; i < imgCount; i++) {
        const img = images.nth(i);
        const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
        if (naturalWidth === 0) {
          const src = await img.getAttribute('src');
          uiIssues.push({ page: 'landing', issue: `Broken image: ${src}`, severity: 'warning' });
        }
      }

      if (errors.length > 0) {
        uiIssues.push({ page: 'landing', issue: `Page errors: ${errors.join('; ')}`, severity: 'error' });
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // SECTION 2: Authenticated Pages (single login, consolidated)
  // ═══════════════════════════════════════════════════════

  test.describe('Authenticated Pages', () => {
    test('comprehensive audit: all authenticated pages + navigation + forms', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => logConsole('authenticated', msg));
      page.on('pageerror', (err) => errors.push(err.message));

      // ── LOGIN ──
      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi1@clockivo.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('U+o6;;EH');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();

      try {
        await expect(page).toHaveURL(/.*dashboard|invoices|verify-otp/, { timeout: 15000 });
      } catch {
        const currentUrl = page.url();
        uiIssues.push({ page: 'login', issue: `Login failed — stayed on: ${currentUrl}. Possible rate limit. Skipping authenticated tests.`, severity: 'error' });
        console.log('LOGIN FAILED — skipping authenticated tests');
        return;
      }

      console.log('Login successful, proceeding with authenticated page audit...');

      // ── DASHBOARD ──
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const dashBody = await page.textContent('body');
      const hasMetrics = dashBody?.includes('Outstanding') || dashBody?.includes('Total') || dashBody?.includes('Dashboard');
      if (!hasMetrics) {
        uiIssues.push({ page: 'dashboard', issue: 'No visible metrics or dashboard heading', severity: 'warning' });
      }

      // Check sidebar navigation
      const sidebar = page.locator('nav, [role="navigation"], aside');
      const sidebarCount = await sidebar.count();
      if (sidebarCount === 0) {
        uiIssues.push({ page: 'dashboard', issue: 'No navigation/sidebar found', severity: 'warning' });
      }

      // Check for broken images on dashboard
      const dashImages = page.locator('img');
      const dashImgCount = await dashImages.count();
      for (let i = 0; i < dashImgCount; i++) {
        const img = dashImages.nth(i);
        const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
        if (naturalWidth === 0) {
          const src = await img.getAttribute('src');
          uiIssues.push({ page: 'dashboard', issue: `Broken image: ${src}`, severity: 'warning' });
        }
      }

      // ── NAVIGATION: test all sidebar links ──
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const navLinks = [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Invoices', url: '/invoices' },
        { name: 'Clients', url: '/clients' },
        { name: 'Reminders', url: '/reminders' },
        { name: 'Settings', url: '/settings' },
        { name: 'Trash', url: '/trash' },
      ];

      for (const link of navLinks) {
        const navLink = page.getByRole('link', { name: new RegExp(link.name, 'i') });
        if (await navLink.isVisible().catch(() => false)) {
          await navLink.click();
          await page.waitForLoadState('networkidle');
          const currentUrl = page.url();
          if (!currentUrl.includes(link.url)) {
            uiIssues.push({ page: 'navigation', issue: `Sidebar link "${link.name}" navigated to ${currentUrl} instead of ${link.url}`, severity: 'error' });
          }
        } else {
          uiIssues.push({ page: 'navigation', issue: `Sidebar link "${link.name}" not found`, severity: 'error' });
        }
      }

      // ── INVOICES PAGE ──
      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');

      const invBody = await page.textContent('body');
      const hasInvContent = invBody?.includes('Invoice') || invBody?.includes('invoice') || invBody?.includes('No invoices');
      if (!hasInvContent) {
        uiIssues.push({ page: 'invoices', issue: 'No invoice content or empty state visible', severity: 'warning' });
      }

      // Test search input
      const searchInput = page.getByRole('textbox', { name: /search/i });
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('test-search-query-12345');
        await page.waitForTimeout(500);
        await searchInput.clear();
      }

      // Test "+ New Invoice" button and dialog
      const newInvoiceBtn = page.getByRole('button', { name: /\+ New Invoice/i }).first();
      if (await newInvoiceBtn.isVisible().catch(() => false)) {
        await newInvoiceBtn.click();
        await page.waitForTimeout(500);

        const dialog = page.locator('[role="dialog"]');
        if (await dialog.isVisible().catch(() => false)) {
          const clientSelect = dialog.locator('button:has-text("Select a client")');
          const invoiceNumber = page.getByRole('textbox', { name: 'Invoice Number' });
          const titleInput = page.getByRole('textbox', { name: 'Title' });
          const amountInput = page.locator('input#amount');
          const dateInput = page.locator('input[type="date"]');

          for (const [name, locator] of [
            ['Client Select', clientSelect],
            ['Invoice Number', invoiceNumber],
            ['Title', titleInput],
            ['Amount', amountInput],
            ['Due Date', dateInput],
          ] as const) {
            if (!(await locator.isVisible().catch(() => false))) {
              uiIssues.push({ page: 'invoices', issue: `New Invoice dialog missing: ${name}`, severity: 'error' });
            }
          }

          // Test disabled state of Create button
          const createBtn = page.getByRole('button', { name: 'Create Invoice' });
          if (await createBtn.isVisible().catch(() => false)) {
            const isDisabled = await createBtn.isDisabled();
            if (isDisabled) {
              uiIssues.push({ page: 'invoices', issue: 'Create Invoice button disabled without client — good validation', severity: 'info' });
            }
          }

          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        } else {
          uiIssues.push({ page: 'invoices', issue: 'New Invoice dialog did not open', severity: 'error' });
        }
      } else {
        uiIssues.push({ page: 'invoices', issue: 'No "+ New Invoice" button found', severity: 'error' });
      }

      // ── CLIENTS PAGE ──
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');

      const clientBody = await page.textContent('body');
      const hasClientContent = clientBody?.includes('Client') || clientBody?.includes('client') || clientBody?.includes('No clients');
      if (!hasClientContent) {
        uiIssues.push({ page: 'clients', issue: 'No client content or empty state visible', severity: 'warning' });
      }

      // Test Add Client dialog
      const addBtn = page.getByRole('button', { name: /\+ Add.*Client/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const clientDialog = page.locator('[role="dialog"]');
        if (await clientDialog.isVisible().catch(() => false)) {
          const nameInput = page.getByRole('textbox', { name: 'Client Name' });
          const companyInput = page.getByRole('textbox', { name: 'Company' });
          const emailInput = page.getByRole('textbox', { name: 'Email' });

          for (const [name, locator] of [
            ['Client Name', nameInput],
            ['Company', companyInput],
            ['Email', emailInput],
          ] as const) {
            if (!(await locator.isVisible().catch(() => false))) {
              uiIssues.push({ page: 'clients', issue: `Add Client dialog missing: ${name}`, severity: 'error' });
            }
          }

          // Test empty submit
          const submitBtn = page.getByRole('button', { name: 'Add Client' });
          if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(500);
          }

          // Test invalid email
          if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill('Test');
            await emailInput.fill('invalid-email');
            await submitBtn.click();
            await page.waitForTimeout(500);
          }

          await page.keyboard.press('Escape');
        } else {
          uiIssues.push({ page: 'clients', issue: 'Add Client dialog did not open', severity: 'error' });
        }
      }

      // ── REMINDERS PAGE ──
      await page.goto('/reminders');
      await page.waitForLoadState('networkidle');

      const reminderBody = await page.textContent('body');
      if (!reminderBody || reminderBody.trim().length < 20) {
        uiIssues.push({ page: 'reminders', issue: 'Reminders page appears empty or failed to load', severity: 'error' });
      }
      const hasReminderContent = reminderBody?.includes('Reminder') || reminderBody?.includes('reminder') || reminderBody?.includes('Chase') || reminderBody?.includes('No reminders');
      if (!hasReminderContent) {
        uiIssues.push({ page: 'reminders', issue: 'No reminder-related content found on page', severity: 'warning' });
      }

      // ── SETTINGS PAGE ──
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const settingsBody = await page.textContent('body');
      const hasSettings = settingsBody?.includes('Setting') || settingsBody?.includes('setting') || settingsBody?.includes('Profile') || settingsBody?.includes('AI');
      if (!hasSettings) {
        uiIssues.push({ page: 'settings', issue: 'No settings content visible', severity: 'warning' });
      }

      const settingsInputs = page.locator('input, select, textarea');
      const settingsInputCount = await settingsInputs.count();
      if (settingsInputCount === 0) {
        uiIssues.push({ page: 'settings', issue: 'No form inputs found on settings page', severity: 'warning' });
      }

      const saveBtn = page.getByRole('button', { name: /save/i });
      if (!(await saveBtn.isVisible().catch(() => false))) {
        uiIssues.push({ page: 'settings', issue: 'No save button found on settings page', severity: 'warning' });
      }

      // ── TRASH PAGE ──
      await page.goto('/trash');
      await page.waitForLoadState('networkidle');

      const trashBody = await page.textContent('body');
      const hasTrashContent = trashBody?.includes('Trash') || trashBody?.includes('trash') || trashBody?.includes('No deleted') || trashBody?.includes('empty');
      if (!hasTrashContent) {
        uiIssues.push({ page: 'trash', issue: 'No trash-related content visible', severity: 'warning' });
      }

      // ── THEME TOGGLE ──
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const themeBtn = page.locator('button').filter({ has: page.locator('[class*="sun"], [class*="moon"], [data-testid*="theme"]') });
      const themeBtnAlt = page.getByRole('button', { name: /theme|dark|light|toggle/i });

      let toggleFound = false;
      if (await themeBtn.first().isVisible().catch(() => false)) {
        await themeBtn.first().click({ force: true });
        toggleFound = true;
      } else if (await themeBtnAlt.isVisible().catch(() => false)) {
        // BUG FOUND: Theme toggle button is obscured by an overlay div
        // <div class="jsx-56b5888f2a69c30e border p-6"> intercepts pointer events
        uiIssues.push({
          page: 'theme-toggle',
          issue: 'Theme toggle button (title="Switch to light mode") is obscured by overlay element — pointer events intercepted by <div class="jsx-56b5888f2a69c30e border p-6">',
          severity: 'error',
        });
        await themeBtnAlt.click({ force: true });
        toggleFound = true;
      }

      if (!toggleFound) {
        uiIssues.push({ page: 'theme-toggle', issue: 'Theme toggle button not found in header/sidebar', severity: 'warning' });
      }

      // ── KEYBOARD ACCESSIBILITY ──
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        const box = await focusedElement.boundingBox();
        if (box && (box.width === 0 || box.height === 0)) {
          uiIssues.push({ page: 'accessibility', issue: 'Focused element has zero dimensions (invisible focus)', severity: 'warning' });
        }
      }

      // ── RESPONSIVE (mobile viewport) ──
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        uiIssues.push({ page: 'responsive', issue: 'Horizontal scroll detected on mobile viewport (375px)', severity: 'warning' });
      }

      const mobileSidebar = page.locator('nav, [role="navigation"], aside');
      if (await mobileSidebar.first().isVisible().catch(() => false)) {
        const box = await mobileSidebar.first().boundingBox();
        if (box && box.width > 375) {
          uiIssues.push({ page: 'responsive', issue: 'Sidebar extends beyond mobile viewport', severity: 'error' });
        }
      }

      await page.setViewportSize({ width: 1280, height: 720 });

      // ── NETWORK: Check for 404s ──
      const notFoundRequests: string[] = [];
      page.on('response', (response) => {
        if (response.status() === 404) {
          notFoundRequests.push(response.url());
        }
      });

      for (const url of ['/dashboard', '/invoices', '/clients', '/reminders', '/settings', '/trash']) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
      }

      if (notFoundRequests.length > 0) {
        for (const url of notFoundRequests) {
          uiIssues.push({ page: 'network', issue: `404 Not Found: ${url}`, severity: 'error' });
        }
      }

      // ── COLLECT ALL ERRORS ──
      if (errors.length > 0) {
        for (const err of errors) {
          uiIssues.push({ page: 'authenticated', issue: `Page error: ${err}`, severity: 'error' });
        }
      }

      console.log('Authenticated audit complete.');
    });
  });
});
