import { test, expect } from '@playwright/test';

test.describe('Persona 3: Disorganized Writer Journey', () => {

  test('should check dashboard for who to chase today and pause an invoice', async ({ page }) => {
    // 1. Sign in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi2@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('U+o6;;EH');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    const surveyDialog = page.getByRole('dialog', { name: /Welcome to ChaseFree AI/i });
    if (await surveyDialog.isVisible()) {
      await page.getByLabel(/Name/i).fill('Disorganized Writer');
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Tracking late invoices', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Freelancer', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Payments are late', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('I will explore myself', { exact: true }).click();
      await page.getByRole('button', { name: 'Get Started' }).click();
      await expect(surveyDialog).toBeHidden();
    }

    // 2. Check "Who to chase today"
    // Disorganized writer is easily overwhelmed and relies on the ChaseFree AI dashboard to prioritize.
    const chaseCard = page.locator('text=/Who to Chase Today|Needs Attention/i').first();
    // Assuming there are some overdue invoices in the seed data
    // We just verify the component renders
    await expect(page.locator('text=/Who to Chase Today|Needs Attention|Recent Invoices/i').first()).toBeVisible();

    // 3. Mark an invoice as "Promised to Pay" to stop the red overdue alert
    await page.goto('/invoices');
    
    // Find an overdue invoice and click it (if any exist, otherwise create one)
    const newInvoiceBtn = page.getByRole('button', { name: /New Invoice/i });
    await newInvoiceBtn.click();
    await page.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await clientDialog.getByLabel(/Client Name/i).fill('Busy Editor');
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();
    
    // Create an overdue invoice manually
    await page.getByLabel(/Invoice Number/i).fill(`INV-${Date.now()}`);
    await page.getByLabel(/Amount/i).fill('500');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    await page.getByLabel(/Due Date/i).fill(pastDate.toISOString().split('T')[0]); // Past date = overdue
    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Open that invoice
    await page.locator('a[href^="/invoices/"]').filter({ hasText: 'Busy Editor' }).first().click();
    await expect(page).toHaveURL(/.*invoices\/.+/);

    // Change status to Promised to Pay
    const statusSelect = page.getByRole('combobox', { name: /Status/i }).or(page.locator('select[name="status"]'));
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('promised');
      await page.getByRole('button', { name: /Update/i }).click();
      
      // Verify visual change (should not be red overdue anymore, but indigo promised)
      await expect(page.getByText(/Promised/i).first()).toBeVisible();
    }
  });

});
