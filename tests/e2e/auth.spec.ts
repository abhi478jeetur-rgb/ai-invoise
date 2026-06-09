import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  // Test route protection
  test('unauthenticated user is redirected to sign-in from protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('unauthenticated user cannot access invoices page', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('unauthenticated user cannot access clients page', async ({ page }) => {
    await page.goto('/clients');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('unauthenticated user cannot access settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('sign-in page renders correctly', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('OTP page has correct input attributes (M7 fix)', async ({ page }) => {
    await page.goto('/verify-otp');
    // Check that OTP inputs have numeric inputMode
    const inputs = page.locator('input[maxlength="1"]');
    const count = await inputs.count();
    expect(count).toBe(6);

    // Verify first input has correct attributes
    const firstInput = inputs.first();
    await expect(firstInput).toHaveAttribute('inputmode', 'numeric');
    await expect(firstInput).toHaveAttribute('pattern', '[0-9]*');
    await expect(firstInput).toHaveAttribute('autocomplete', 'one-time-code');
  });

  // Test Sign Up (Skipped locally to prevent Supabase 'email rate limit exceeded' error)
  test.skip('user can sign up and is redirected to dashboard', async ({ page }) => {
    // Generate a unique email for every test run
    const timestamp = Date.now();
    const uniqueEmail = `testuser_${timestamp}@clockivo.com`;

    await page.goto('/sign-up');
    
    await page.getByRole('textbox', { name: 'Full Name' }).fill(`Test User ${timestamp}`);
    await page.getByRole('textbox', { name: 'Email Address' }).fill(uniqueEmail);
    await page.getByRole('textbox', { name: 'Password' }).fill('StrongPass123!');
    
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // After successful signup, it should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Total Outstanding')).toBeVisible();
    
    // Clean up / Logout for the next test
    await page.getByRole('button', { name: 'Logout' }).dispatchEvent('click');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  // Test Sign In (requires live credentials)
  test('existing user can sign in and log out', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Using the known test user
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi5@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('U+o6;;EH');
    await page.waitForTimeout(3500); // Wait for Turnstile
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Should reach dashboard
    await expect(page).toHaveURL(/.*dashboard|invoices/);
    
    // Open user menu
    await page.locator('button[aria-haspopup="menu"]').first().click();
    // Now Log out
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    // Should be back at sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
