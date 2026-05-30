import { test, expect } from '@playwright/test';

test.describe('Trash & Recovery Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi1@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('***REMOVED***');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard|invoices/);
  });

  test('can soft-delete an invoice, restore it, soft-delete again, and permanently delete it', async ({ page }) => {
    // 1. Create a dummy invoice to delete
    await page.goto('/invoices');
    await expect(page).toHaveURL(/.*invoices/);

    const timestamp = Date.now();
    const uniqueInvoiceNumber = `INV-TRASH-${timestamp}`;
    const invoiceTitle = `E2E Trash Invoice ${timestamp}`;

    // Click "+ New Invoice"
    await page.getByRole('button', { name: /\+ New Invoice/i }).first().click();

    // Select a client
    await page.locator('button:has-text("Select a client")').first().click();
    await page.locator('[role="option"]:visible').first().click();

    // Fill in invoice details
    await page.getByRole('textbox', { name: 'Invoice Number' }).fill(uniqueInvoiceNumber);
    await page.getByRole('textbox', { name: 'Title' }).fill(invoiceTitle);
    await page.locator('input#amount').fill('99.99');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateString);

    // Create the invoice
    await page.getByRole('button', { name: 'Create Invoice' }).click();
    await expect(page.getByText(invoiceTitle)).toBeVisible();

    // 2. Retrieve generated invoice number from list card
    const card = page.locator('.border-white\\/\\[0\\.06\\]', { hasText: invoiceTitle });
    const generatedInvoiceNumber = (await card.locator('span.font-mono').innerText()).trim();

    // 3. Soft-delete the invoice from Invoices list page
    await card.getByRole('button', { name: '...' }).click();
    
    // Register dialog confirm
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Click Move to Trash
    await page.getByRole('menuitem', { name: 'Move to Trash' }).click();
    
    // Verify invoice is gone from Invoices list
    await expect(page.getByText(invoiceTitle)).toBeHidden();

    // 4. Go to Recycle Bin (/trash)
    await page.goto('/trash');
    await expect(page).toHaveURL(/.*trash/);

    // Verify it is visible in the deleted invoices list
    await expect(page.getByText(generatedInvoiceNumber)).toBeVisible();

    // 5. Click "Restore"
    const row = page.locator('.divide-y.divide-zinc-800 > div', { hasText: generatedInvoiceNumber });
    await row.getByRole('button', { name: 'Restore' }).click();

    // Reload page to re-initialize client state from fresh server-side initialInvoices data
    await page.reload();

    // Wait for it to disappear from the trash list
    await expect(page.getByText(generatedInvoiceNumber)).toBeHidden();

    // 6. Navigate back to /invoices and verify it's back
    await page.goto('/invoices');
    await expect(page.getByText(invoiceTitle)).toBeVisible();

    // 7. Delete it again to test permanent deletion
    await card.getByRole('button', { name: '...' }).click();
    await page.getByRole('menuitem', { name: 'Move to Trash' }).click();
    await expect(page.getByText(invoiceTitle)).toBeHidden();

    // 8. Go to /trash
    await page.goto('/trash');
    await expect(page).toHaveURL(/.*trash/);

    // 9. Delete Forever
    await expect(page.getByText(generatedInvoiceNumber)).toBeVisible();
    await row.getByRole('button', { name: 'Delete Forever' }).click();

    // Reload page to re-initialize client state
    await page.reload();

    // Verify it is permanently gone from Recycle Bin
    await expect(page.getByText(generatedInvoiceNumber)).toBeHidden();
  });
});
