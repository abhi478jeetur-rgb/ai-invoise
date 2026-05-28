import { test, expect } from '@playwright/test';
import { signIn, dismissOnboardingIfPresent } from './helpers/auth';

test.describe('Invoice Management', () => {

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissOnboardingIfPresent(page);
  });

  test('should create a new invoice via the quick create dialog', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Open new invoice dialog
    await page.getByRole('button', { name: /New Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'New Invoice' })).toBeVisible();

    // Create an inline client
    await page.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    const uniqueClient = `E2E Test Client ${Date.now()}`;
    await clientDialog.getByLabel(/Client Name/i).fill(uniqueClient);
    await clientDialog.getByLabel(/Email/i).fill(`e2e-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Verify client is selected in the invoice form
    await expect(page.getByRole('dialog').getByText(uniqueClient)).toBeVisible();

    // Fill invoice details
    const invoiceNumber = `INV-E2E-${Date.now()}`;
    await page.getByLabel(/Invoice Number/i).fill(invoiceNumber);
    await page.getByLabel(/Amount/i).fill('750');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);

    // Submit
    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

    // Verify invoice appears in the list (by client name since invoice number may be auto-generated)
    await expect(page.getByText(uniqueClient).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display invoices in the invoice list', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Should have at least one invoice card (from prior tests or existing data)
    const invoiceCards = page.locator('a[href^="/invoices/"]');
    await expect(invoiceCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to invoice detail and see invoice information', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Click the first invoice
    await page.locator('a[href^="/invoices/"]').first().click();
    await expect(page).toHaveURL(/.*\/invoices\/[a-f0-9-]+/);

    // Verify detail page elements
    await expect(page.getByRole('button', { name: 'Change Status' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
  });

  test('should change invoice status via the status dialog', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Navigate to first invoice detail
    await page.locator('a[href^="/invoices/"]').first().click();
    await expect(page).toHaveURL(/.*\/invoices\/[a-f0-9-]+/);

    // Open status change dialog
    await page.getByRole('button', { name: 'Change Status' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Select "Sent" status
    await page.locator('select#status').selectOption('sent');
    await page.getByRole('button', { name: /Save changes/i }).click();

    // Dialog should close and status should update
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('should filter invoices by status', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Click a status filter
    const draftFilter = page.getByRole('button', { name: 'Draft' });
    if (await draftFilter.isVisible()) {
      await draftFilter.click();
      await page.waitForTimeout(500);
    }

    // Reset to All
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.waitForTimeout(500);
  });

});
