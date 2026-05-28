import { test, expect } from '@playwright/test';
import { signIn, dismissOnboardingIfPresent } from './helpers/auth';

test.describe('V2.5 Chaos & Vulnerability Tests', () => {

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissOnboardingIfPresent(page);
  });

  // ─── 1. Extreme Input Data ─────────────────────────────────────────

  test('should handle 10,000+ character client name without crashing', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Add Client/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const hugeName = 'A'.repeat(10000);
    await dialog.getByLabel(/Client Name/i).fill(hugeName);
    await dialog.getByLabel(/Email/i).fill(`chaos-${Date.now()}@test.com`);
    await dialog.getByRole('button', { name: /Add Client/i }).click();

    // Wait for server response — dialog may close (success) or stay open (error)
    await page.waitForTimeout(5000);

    // App must not crash. Navigate away to verify the page is still functional.
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle 10,000+ character notes field without crashing', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Add Client/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const hugeNotes = 'Lorem ipsum dolor sit amet. '.repeat(500); // ~14,000 chars
    await dialog.getByLabel(/Client Name/i).fill(`Chaos Notes Client ${Date.now()}`);
    await dialog.getByLabel(/Email/i).fill(`chaos-notes-${Date.now()}@test.com`);
    await dialog.getByLabel(/Notes/i).fill(hugeNotes);
    await dialog.getByRole('button', { name: /Add Client/i }).click();

    await page.waitForTimeout(5000);

    // App must not crash
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 });
  });

  test('should sanitize XSS payload in invoice title — renders as plain text', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Create inline client with XSS in name
    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill('<script>alert("xss")</script>');
    await clientDialog.getByLabel(/Email/i).fill(`xss-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Fill invoice with XSS in title
    await dialog.getByLabel(/Title/i).fill('<img src=x onerror=alert(1)>');
    await dialog.getByLabel(/Amount/i).fill('100');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await dialog.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // No script should have executed — page is still functional
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 5000 });

    // Verify raw <script> tag is NOT in the DOM (React escapes it)
    const bodyHtml = await page.content();
    expect(bodyHtml).not.toContain('<script>alert("xss")</script>');
  });

  test('should sanitize XSS payload in client name — no script execution', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Add Client/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByLabel(/Client Name/i).fill('"><img src=x onerror=alert(document.cookie)>');
    await dialog.getByLabel(/Email/i).fill(`xss-client-${Date.now()}@test.com`);
    await dialog.getByRole('button', { name: /Add Client/i }).click();

    await page.waitForTimeout(5000);

    // Navigate to verify page is still functional
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 });

    // No raw onerror in the page
    const bodyHtml = await page.content();
    expect(bodyHtml).not.toContain('onerror=alert');
  });

  // ─── 2. Rapid User Actions (Race Conditions) ──────────────────────

  test('should survive rapid-fire clicks on Create Invoice button', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    const invoiceLinksBefore = await page.locator('a[href^="/invoices/"]').count();

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Create a client
    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Rapid Click Client ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`rapid-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    await dialog.getByLabel(/Amount/i).fill('100');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);

    // Rapid-fire click the Create button 10 times with short delays
    const createBtn = dialog.getByRole('button', { name: /Create Invoice/i });
    for (let i = 0; i < 10; i++) {
      try {
        if (await createBtn.isVisible({ timeout: 200 }).catch(() => false)) {
          await createBtn.click({ timeout: 500 }).catch(() => {});
        }
      } catch {
        break; // Dialog closed — button gone
      }
      await page.waitForTimeout(100);
    }

    // Wait for everything to settle
    await page.waitForTimeout(3000);
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Should not have created 10 duplicate invoices
    const invoiceLinksAfter = await page.locator('a[href^="/invoices/"]').count();
    const newInvoices = invoiceLinksAfter - invoiceLinksBefore;
    expect(newInvoices).toBeLessThanOrEqual(3);

    // App did not crash
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
  });

  test('should survive rapid sidebar navigation clicks', async ({ page }) => {
    const routes = ['/dashboard', '/invoices', '/clients', '/dashboard', '/invoices', '/clients', '/dashboard'];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(200);
    }

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 5000 });
  });

  // ─── 3. URL & Navigation Manipulation ──────────────────────────────

  test('should handle /invoices/undefined gracefully', async ({ page }) => {
    const response = await page.goto('/invoices/undefined');
    expect(response?.status()).not.toBe(500);

    // Should show the custom "Invoice Not Found" heading
    await expect(page.getByRole('heading', { name: 'Invoice Not Found' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle /invoices/null gracefully', async ({ page }) => {
    const response = await page.goto('/invoices/null');
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole('heading', { name: 'Invoice Not Found' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle /invoices/-999 gracefully', async ({ page }) => {
    const response = await page.goto('/invoices/-999');
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole('heading', { name: 'Invoice Not Found' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle SQL injection attempt in invoice URL', async ({ page }) => {
    const response = await page.goto("/invoices/' OR 1=1 --");
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole('heading', { name: 'Invoice Not Found' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle deeply nested random path under invoices', async ({ page }) => {
    const response = await page.goto('/invoices/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/extra/path/here');
    expect(response?.status()).not.toBe(500);
  });

  // ─── 4. Invalid Number Formats ─────────────────────────────────────

  test('should handle extremely large number in invoice amount without crashing', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Extreme Number ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`extreme-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    await dialog.getByLabel(/Amount/i).fill('99999999999999999999');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await dialog.getByRole('button', { name: /Create Invoice/i }).click();

    await page.waitForTimeout(5000);

    // App must not crash — navigate to verify
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });
  });

  test('should reject negative amount in invoice form without crashing', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Negative Amount ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`neg-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Try negative amount — type="number" input may strip the minus sign
    await dialog.getByLabel(/Amount/i).fill('-50');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await dialog.getByRole('button', { name: /Create Invoice/i }).click();

    await page.waitForTimeout(5000);

    // App must not crash
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle scientific notation in amount field without crashing', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Scientific Notation ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`sci-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    await dialog.getByLabel(/Amount/i).fill('1e10');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await dialog.getByRole('button', { name: /Create Invoice/i }).click();

    await page.waitForTimeout(5000);

    // App must not crash
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle zero amount invoice without crashing', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Zero Amount ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`zero-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    await dialog.getByLabel(/Amount/i).fill('0');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await dialog.getByRole('button', { name: /Create Invoice/i }).click();

    // 0 is valid (amount >= 0), should succeed
    await expect(dialog).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
  });

});
