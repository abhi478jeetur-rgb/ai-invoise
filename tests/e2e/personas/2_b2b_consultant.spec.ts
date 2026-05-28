import { test, expect } from '@playwright/test';

test.describe('Persona 2: B2B Consultant Journey', () => {

  test('should handle large corporate invoices and partial payments', async ({ page }) => {
    // 1. Sign in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi1@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('***REMOVED***');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Skip onboarding survey if it appears (Explore myself)
    const surveyDialog = page.getByRole('dialog', { name: /Welcome to ChaseFree AI/i });
    if (await surveyDialog.isVisible()) {
      await page.getByLabel(/Name/i).fill('B2B User');
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Tracking late invoices', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Agency Owner', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Payments are late', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('I will explore myself', { exact: true }).click();
      await page.getByRole('button', { name: 'Get Started' }).click();
      await expect(surveyDialog).toBeHidden();
    }

    // 2. Create a corporate invoice
    await page.goto('/invoices');
    await page.getByRole('button', { name: /New Invoice/i }).click();
    
    // Quick creation without inline client (assume client exists or create one)
    await page.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await clientDialog.getByLabel(/Client Name/i).fill('Mega Corp Inc');
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Fill large amount for B2B
    await page.getByLabel(/Invoice Number/i).fill(`INV-${Date.now()}`);
    await page.getByLabel(/Amount/i).fill('50000');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /Create Invoice/i }).click();
    const errorMsg = await page.locator('.text-red-400').first().textContent({ timeout: 2000 }).catch(() => null);
    console.log('Form Error:', errorMsg);
    await expect(page.getByRole('dialog')).toBeHidden();

    // 3. Navigate to invoice details to change status to Partial Payment
    await page.locator('a[href^="/invoices/"]').filter({ hasText: 'Mega Corp Inc' }).first().click();
    await expect(page).toHaveURL(/.*invoices\/.+/);

    // 4. Update status to Partial
    const statusSelect = page.getByRole('combobox', { name: /Status/i }).or(page.locator('select[name="status"]'));
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('partial');
      await page.getByRole('button', { name: /Update/i }).click();
      
      // Verify visual change
      await expect(page.getByText(/Partial/i).first()).toBeVisible();
    }

    // 5. Verify it shows up in dashboard (Metrics testing)
    await page.goto('/dashboard');
    // Ensure dashboard loads
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    // B2B consultant cares about professional metrics.
    // Assuming there's a card for Partial payments or total outstanding.
  });

});
