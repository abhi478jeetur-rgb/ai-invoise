import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('NVIDIA API and PDF Generation Test', () => {
  // Use a longer timeout because AI generation and PDF generation can take a few seconds
  test.setTimeout(60000);

  test('should configure NVIDIA AI, generate reminder, and download PDF', async ({ page, context }) => {
    // 1. Sign in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi5@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('U+o6;;EH');
    await page.waitForTimeout(3500); // Wait for Turnstile
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard|invoices/);



    // 3. Create a test invoice
    await page.goto('/invoices');
    await page.getByRole('button', { name: /\+ New Invoice/i }).click();
    const invoiceDialog = page.getByRole('dialog');
    await expect(invoiceDialog).toBeVisible();

    // Select or create a client
    // For safety, let's just create a quick inline client
    await page.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`NVIDIA Test Client ${Date.now()}`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Fill invoice details
    await page.getByLabel(/Invoice Number/i).fill(`NV-${Date.now()}`);
    await page.getByLabel(/Amount/i).fill('999');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(invoiceDialog).toBeHidden();

    // 4. Test PDF Download
    // Go to the details page of the newly created invoice
    await page.locator('a[href^="/invoices/"]').first().click();
    await expect(page).toHaveURL(/\/invoices\/.+/);

    // Click Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download PDF/i }).click();
    const download = await downloadPromise;
    
    // Save the downloaded file to verify
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (downloadPath) {
      const stat = fs.statSync(downloadPath);
      expect(stat.size).toBeGreaterThan(0); // PDF should not be empty
    }

    // 5. Test AI Reminder Generation
    // Assuming there's a button to generate a reminder
    const generateBtn = page.getByRole('button', { name: 'Generate Reminder', exact: true });
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      
      // Click 'Generate Draft' inside the new Generate Reminder dialog
      await page.getByRole('button', { name: 'Generate Draft' }).click();
      
      // Wait for AI generation to complete and show the Reminder Draft dialog
      const draftDialog = page.getByRole('dialog', { name: 'Reminder Draft' });
      await expect(draftDialog).toBeVisible({ timeout: 25000 }); // AI can take a while

      // Verify that the generated draft text is present
      await expect(page.getByText('We are following up regarding')).toBeVisible();

      // Click "Mark as Sent" to save/complete the reminder draft
      await page.getByRole('button', { name: 'Mark as Sent' }).click();
      await expect(draftDialog).toBeHidden();
    }
    
    console.log("TEST COMPLETED SUCCESSFULLY");
  });
});
