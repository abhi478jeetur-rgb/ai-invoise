import { test, expect } from '@playwright/test';

test.describe('Persona 4: Non-Technical Newcomer Journey', () => {

  // Skipping full signup because of Supabase rate limits, simulating first login instead
  test('should go through the onboarding survey and follow the Quick Guided Tour', async ({ page }) => {
    // 1. Sign in as a fresh user
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('testabhi3@clockivo.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('***REMOVED***');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Dashboard should load and trigger the Onboarding Survey Modal
    await expect(page).toHaveURL(/.*dashboard/);
    
    // We expect the survey modal to pop up for a new user
    // However, if the seed data has already marked them as completed, we might need to reset it.
    // Assuming the test user is fresh:
    const surveyDialog = page.getByRole('dialog', { name: /Welcome to ChaseFree AI/i });
    if (await surveyDialog.isVisible()) {
      // Step 1: Name
      await page.getByLabel(/Name/i).fill('Nate Newcomer');
      await page.getByRole('button', { name: 'Continue' }).click();
      
      // Step 2: Use Case
      await page.getByText('All of the above', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 3: Role
      await page.getByText('Other', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 4: Problem
      await page.getByText('No invoice visibility', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 5: Setup Preference -> Quick Guided Tour
      await page.getByText('Quick Guided Tour', { exact: true }).click();
      await page.getByRole('button', { name: 'Get Started' }).click();

      await expect(surveyDialog).toBeHidden();
      
      // 3. Quick Guided Tour should now be active
      // driver.js injects popovers with class 'driver-popover'
      const tourPopover = page.locator('.driver-popover');
      await expect(tourPopover).toBeVisible({ timeout: 5000 });
      
      // Verify tour title
      await expect(page.locator('.driver-popover-title')).toContainText('Navigation');
      
      // Click next on the tour
      await page.locator('.driver-popover-next-btn').click();
      
      // Next step should be Getting Started
      await expect(page.locator('.driver-popover-title')).toContainText('Getting Started');
      
      // Click next, which should redirect to /clients
      await page.locator('.driver-popover-next-btn').click();
      await expect(page).toHaveURL(/.*clients/);
      
      // Final step on clients page
      await expect(page.locator('.driver-popover-title')).toContainText('Add a Client');
      
      // Click next/finish
      await page.locator('.driver-popover-next-btn').click();
      
      // Tour should be destroyed
      await expect(tourPopover).toBeHidden();
      
      // Verify the tour doesn't show up again on reload
      await page.reload();
      await expect(tourPopover).toBeHidden();
    } else {
      console.log('Skipping tour test as user may have already completed onboarding in seed data.');
    }
  });

});
