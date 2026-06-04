import { test, expect } from '@playwright/test';

test.describe('Client Management', () => {
  // Use a single user session for all tests in this block
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi1@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('U+o6;;EH');
    await page.waitForTimeout(1500); // Wait for Turnstile
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard|invoices/);
  });

  test('can add, edit, and delete a client', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    await expect(page).toHaveURL(/.*clients/);

    const timestamp = Date.now();
    const uniqueClientName = `E2E Test Client ${timestamp}`;
    const updatedCompanyName = `Updated Company ${timestamp}`;

    // 1. Add a new client
    // Match either "+ Add Client" or "+ Add Your First Client"
    await page.getByRole('button', { name: /\+ Add.*Client/i }).first().click();

    await page.getByRole('textbox', { name: 'Client Name' }).fill(uniqueClientName);
    await page.getByRole('textbox', { name: 'Company' }).fill('Original Company');
    await page.getByRole('textbox', { name: 'Email' }).fill(`client_${timestamp}@test.com`);
    
    await page.getByRole('button', { name: 'Add Client' }).click();

    // Verify it appears in the list
    await expect(page.getByText(uniqueClientName)).toBeVisible();
    await expect(page.getByText('Original Company')).toBeVisible();

    // 2. Edit the client
    const clientRow = page.locator('.flex.items-center.justify-between', { hasText: uniqueClientName });
    await clientRow.getByRole('button', { name: '...' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    await page.getByRole('textbox', { name: 'Company' }).fill(updatedCompanyName);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify it was updated
    await expect(page.getByText(updatedCompanyName)).toBeVisible();

    // 3. Delete the client (Move to Trash)
    await clientRow.getByRole('button', { name: '...' }).click();
    await page.getByRole('menuitem', { name: 'Move to Trash' }).click();

    // Verify it's removed from the list
    await expect(page.getByText(uniqueClientName)).toBeHidden();
  });
});
