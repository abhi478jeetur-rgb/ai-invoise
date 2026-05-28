import { test, expect } from '@playwright/test';
import { signIn, dismissOnboardingIfPresent } from './helpers/auth';

test.describe('Authentication Flow', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display the sign-in page with all required elements', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Sign in to manage your late invoices with AI')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign up for free/i })).toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('invalid@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for the error message to appear
    await expect(page.getByText(/Invalid login credentials|Invalid/i)).toBeVisible({ timeout: 10000 });

    // Should still be on the sign-in page
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should successfully sign in and redirect to dashboard', async ({ page }) => {
    await signIn(page);

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });

    // Dismiss onboarding if it appears
    await dismissOnboardingIfPresent(page);

    // Verify dashboard elements are present
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 5000 });
  });

  test('should navigate from sign-in to sign-up page', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByRole('link', { name: /Sign up for free/i }).click();

    await expect(page).toHaveURL(/.*sign-up/);
    await expect(page.getByText('Create an account')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Full Name/i })).toBeVisible();
  });

});
