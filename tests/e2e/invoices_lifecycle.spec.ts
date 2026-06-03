import { test, expect } from '@playwright/test';

test.describe('Invoice Lifecycle Management', () => {
  test.setTimeout(120000); // 2 minutes to accommodate dev server cold starts and multiple page reloads

  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi1@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('***REMOVED***');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard|invoices/);
  });

  test('can create, view, edit, update status, and soft-delete an invoice', async ({ page }) => {
    // 1. Navigate to Invoices page
    await page.goto('/invoices');
    await expect(page).toHaveURL(/.*invoices/);

    const timestamp = Date.now();
    const uniqueInvoiceNumber = `INV-${timestamp}`;
    const invoiceTitle = `E2E Title ${timestamp}`;
    const updatedTitle = `Updated Title ${timestamp}`;

    // 2. Click "+ New Invoice"
    await page.getByRole('button', { name: /\+ New Invoice/i }).first().click();

    // 3. Select a client
    // Since Client selection uses Radix UI / Select component, let's open the trigger
    await page.locator('button:has-text("Select a client")').first().click();
    // Select the first visible option in the radix select dropdown
    await page.locator('[role="option"]:visible').first().click();

    // 4. Fill in invoice details
    await page.getByRole('textbox', { name: 'Invoice Number' }).fill(uniqueInvoiceNumber);
    await page.getByRole('textbox', { name: 'Title' }).fill(invoiceTitle);
    await page.locator('input#amount').fill('1750.50');
    
    // Fill in a valid date (e.g., 30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateString);

    // 5. Submit form
    await page.getByRole('button', { name: 'Create Invoice' }).click();

    // Verify toast or that invoice appears in the list
    const card = page.locator('div').filter({ hasText: invoiceTitle }).locator('..').first();
    await expect(page.getByText(invoiceTitle).first()).toBeVisible({ timeout: 10000 });

    // 6. Navigate to details page
    // Click on the newly created invoice link using the title
    await page.getByText(invoiceTitle).first().click();
    await expect(page).toHaveURL(/\/invoices\/[a-zA-Z0-9-]+/);
    await page.waitForLoadState('networkidle');

    // 7. Edit the invoice details
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByRole('textbox', { name: 'Title' }).fill(updatedTitle);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Wait for the modal to close and the success toast
    await expect(page.getByText('Invoice saved successfully!')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Verify it updated
    await expect(page.getByText(updatedTitle)).toBeVisible();

    // 8. Change Status via "Change Status" modal
    await page.getByRole('button', { name: 'Change Status' }).click();
    await page.locator('select#status').selectOption('sent');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForTimeout(1500);
    await page.reload();

    // 9. Test "Mark Paid" button (Direct Action)
    const markPaidBtn = page.getByRole('button', { name: 'Mark Paid' });
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click();
      await page.waitForTimeout(1500); // Wait for server action
      await page.reload();
      // Status badge should reflect paid
      await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible();
    }

    // 10. Delete the invoice (soft delete)
    // Handle the window confirm popup
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this invoice?');
      await dialog.accept();
    });

    await page.getByText('Delete', { exact: true }).click({ force: true });

    // Should redirect back to invoices
    await expect(page).toHaveURL(/.*invoices/);
    
    // Verify invoice is no longer in active list
    await expect(page.getByText(updatedTitle)).toBeHidden();
  });
});
