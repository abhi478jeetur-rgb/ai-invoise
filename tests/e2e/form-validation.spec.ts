import { test, expect } from '@playwright/test';
import { signIn, dismissOnboardingIfPresent } from './helpers/auth';

test.describe('Form Validation', () => {

  test('should prevent sign-in with empty fields', async ({ page }) => {
    await page.goto('/sign-in');

    // Click Sign In without filling fields
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should still be on sign-in (browser native validation prevents submit)
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should prevent sign-in with invalid email format', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('not-an-email');
    await page.getByRole('textbox', { name: 'Password' }).fill('somepassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Browser's type="email" validation should prevent submission
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi5@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('definitely-wrong-password-12345');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should disable create invoice button without a client', async ({ page }) => {
    await signIn(page);
    await dismissOnboardingIfPresent(page);

    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Open new invoice dialog
    await page.getByRole('button', { name: /New Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // The Create button should be disabled because no client is selected
    const createBtn = page.getByRole('button', { name: /Create Invoice/i });
    await expect(createBtn).toBeDisabled();
  });

  test('should keep invoice dialog open when required fields are empty', async ({ page }) => {
    await signIn(page);
    await dismissOnboardingIfPresent(page);

    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    // Open new invoice dialog
    await page.getByRole('button', { name: /New Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Create a client inline to enable the submit button
    await page.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`E2E Validation Client ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`val-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Clear the auto-filled invoice number
    await page.getByLabel(/Invoice Number/i).clear();

    // Try to submit — HTML required should block it
    await page.getByRole('button', { name: /Create Invoice/i }).click();

    // Dialog should still be visible (form didn't submit)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

});
