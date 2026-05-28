import { test, expect } from '@playwright/test';
import { signIn, dismissOnboardingIfPresent } from './helpers/auth';

test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissOnboardingIfPresent(page);
  });

  test('should display all four stat cards', async ({ page }) => {
    await expect(page.getByText('Unpaid').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Overdue').first()).toBeVisible();
    await expect(page.getByText('Due This Week').first()).toBeVisible();
    await expect(page.getByText('Clients to Chase').first()).toBeVisible();
  });

  test('should display the Who to Chase Today section', async ({ page }) => {
    await expect(page.getByText('Who to Chase Today')).toBeVisible({ timeout: 10000 });
  });

  test('should display Recent Invoices and Recent Reminder Activity sections', async ({ page }) => {
    await expect(page.getByText('Recent Invoices').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Recent Reminder Activity')).toBeVisible();
  });

  test('should navigate to invoices via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.hover();
    await page.waitForTimeout(300);
    await sidebar.getByRole('link', { name: 'Invoices' }).click();

    await expect(page).toHaveURL(/.*\/invoices/);
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to all sidebar destinations', async ({ page }) => {
    const destinations = [
      { name: 'Invoices', path: '/invoices', heading: 'Invoices' },
      { name: 'AI Reminders', path: '/reminders', heading: 'Reminders' },
      { name: 'Clients', path: '/clients', heading: 'Clients' },
      { name: 'Settings', path: '/settings', heading: 'Settings' },
    ];

    for (const dest of destinations) {
      const sidebar = page.locator('aside');
      await sidebar.hover();
      await page.waitForTimeout(300);
      await sidebar.getByRole('link', { name: dest.name }).click();
      await expect(page).toHaveURL(new RegExp(`.*${dest.path}`));
      await expect(page.getByRole('heading', { name: new RegExp(dest.heading, 'i') })).toBeVisible({ timeout: 10000 });
    }

    // Navigate back to dashboard
    const sidebar2 = page.locator('aside');
    await sidebar2.hover();
    await page.waitForTimeout(300);
    await sidebar2.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

});
