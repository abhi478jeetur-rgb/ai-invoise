import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  // Test route protection
  test('unauthenticated user is redirected to sign-in from protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected
    await expect(page).toHaveURL(/.*sign-in/);
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

  // Test Sign In
  test('existing user can sign in and log out', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Using the known test user
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi5@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('***REMOVED***');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should reach dashboard
    await expect(page).toHaveURL(/.*dashboard|invoices/);
    
    // Now Logout (use dispatchEvent to avoid Next.js dev overlay interception)
    await page.getByRole('button', { name: 'Logout' }).dispatchEvent('click');
    
    // Should be back at sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
