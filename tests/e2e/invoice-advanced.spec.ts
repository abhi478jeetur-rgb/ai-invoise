import { test, expect } from '@playwright/test';
import { signIn, dismissOnboardingIfPresent } from './helpers/auth';

test.describe('Invoice Advanced Workflows', () => {

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissOnboardingIfPresent(page);
  });

  test('should edit an existing invoice and verify updated details', async ({ page }) => {
    // Navigate to invoices and pick the first one
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    const firstInvoice = page.locator('a[href^="/invoices/"]').first();
    await firstInvoice.click();
    await expect(page).toHaveURL(/.*\/invoices\/[a-f0-9-]+/, { timeout: 10000 });

    // Open the edit dialog
    await page.getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Edit Invoice')).toBeVisible();

    // Read the current amount before editing
    const amountInput = dialog.getByLabel(/Amount/i);
    await amountInput.waitFor({ state: 'visible' });
    const currentAmount = await amountInput.inputValue();

    // Change the amount to a new value
    const newAmount = (parseFloat(currentAmount) + 250).toFixed(2);
    await amountInput.clear();
    await amountInput.fill(newAmount);

    // Update the title
    const titleInput = dialog.getByLabel(/Title/i);
    await titleInput.clear();
    await titleInput.fill('Updated by E2E Test');

    // Update notes
    const notesInput = dialog.getByLabel(/Notes/i);
    await notesInput.clear();
    await notesInput.fill('This invoice was modified by an automated E2E test.');

    // Save changes
    await dialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // Wait for the page to refresh with updated data
    await page.waitForTimeout(2000);

    // Verify the updated values are reflected on the detail page
    await expect(page.getByText('Updated by E2E Test')).toBeVisible({ timeout: 10000 });
  });

  test('should display PDF preview with invoice data', async ({ page }) => {
    // Navigate to the first invoice detail page
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.locator('a[href^="/invoices/"]').first().click();
    await expect(page).toHaveURL(/.*\/invoices\/[a-f0-9-]+/, { timeout: 10000 });

    // Click the "Live PDF Preview" tab
    await page.getByRole('tab', { name: /Live PDF Preview/i }).click();

    // The PDF preview container should appear (h-[700px] div wrapping the PDFViewer)
    // Wait for the loading spinner to appear and then the PDF viewer to render
    const pdfContainer = page.locator('.h-\\[700px\\]').first();
    await expect(pdfContainer).toBeVisible({ timeout: 15000 });

    // Verify the PDF viewer iframe is rendered inside the container
    // @react-pdf/renderer's PDFViewer renders an <iframe> or <canvas>
    const pdfViewer = pdfContainer.locator('iframe, canvas').first();
    await expect(pdfViewer).toBeVisible({ timeout: 15000 });
  });

  test('should download PDF and verify file integrity', async ({ page }) => {
    // Navigate to the first invoice detail page
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.locator('a[href^="/invoices/"]').first().click();
    await expect(page).toHaveURL(/.*\/invoices\/[a-f0-9-]+/, { timeout: 10000 });

    // Set up download listener before clicking the button
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click "Download PDF"
    await page.getByRole('button', { name: 'Download PDF' }).click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Verify the suggested filename ends with .pdf
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.pdf$/);

    // Save to a temp path and verify file size > 0
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const fs = require('fs');
    const stats = fs.statSync(filePath!);
    expect(stats.size).toBeGreaterThan(0);
  });

});
