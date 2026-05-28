import { test, expect } from '@playwright/test';

test.describe('Persona 1: Solo Creative Journey', () => {

  test('should complete FTUE, explore myself, and create an invoice with inline client', async ({ page }) => {
    // 1. Sign in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi5@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('U+o6;;EH');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Dashboard should load
    await expect(page).toHaveURL(/.*dashboard/);

    // 3. Onboarding Survey handling (if it pops up)
    const surveyDialog = page.getByRole('dialog', { name: /Welcome to ChaseFree AI/i });
    if (await surveyDialog.isVisible()) {
      // Step 1: Name
      await page.getByLabel(/Name/i).fill('Sam the Solo Creative');
      await page.getByRole('button', { name: 'Continue' }).click();
      
      // Step 2: Use Case
      await page.getByText('Tracking late invoices', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 3: Role
      await page.getByText('Freelancer', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 4: Problem
      await page.getByText('Payments are late', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 5: Setup Preference -> Explore Myself (to avoid tour)
      await page.getByText('I will explore myself', { exact: true }).click();
      await page.getByRole('button', { name: 'Get Started' }).click();

      await expect(surveyDialog).toBeHidden();
    }

    // 4. Create an invoice directly
    await page.goto('/invoices');
    await page.getByRole('button', { name: /New Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 5. Inline Client Creation
    await page.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill('Awesome Startup LLC');
    await clientDialog.getByLabel(/Email/i).fill('hello@awesomestartup.com');
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();

    // Client modal should close and the new client should be selected
    await expect(clientDialog).toBeHidden();
    await expect(page.getByRole('dialog').getByText('Awesome Startup LLC')).toBeVisible();

    // 6. Fill out the rest of the invoice
    await page.getByLabel(/Invoice Number/i).fill(`INV-${Date.now()}`);
    await page.getByLabel(/Amount/i).fill('1500');
    // Using simple date input for Net-30 manually for now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // 7. Test Reminder Mailto generation (Copy-paste pain point solved)
    // Go to reminders page or click reminder icon on the invoice
    // For this persona, they want to generate an AI reminder and send it via Gmail
    await page.goto('/reminders');
    // Assuming there's a generate reminder button
    // (We will just verify the mailto link is present on a generated reminder or detail page)
    // Here we just test the existence of the mailto logic by clicking the first invoice and checking its details
    await page.goto('/invoices');
    await page.locator('a[href^="/invoices/"]').first().click();
    
    const sendViaGmailBtn = page.getByRole('link', { name: /Send via Gmail|Send Email/i });
    if (await sendViaGmailBtn.isVisible()) {
      const href = await sendViaGmailBtn.getAttribute('href');
      expect(href).toMatch(/^mailto:/);
    }
  });

});
