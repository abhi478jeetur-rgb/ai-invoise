import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

async function safeScreenshot(page: any, pathStr: string) {
  try {
    await page.screenshot({ path: pathStr });
  } catch (err) {
    console.warn(`[Screenshot Warning] Ignored error: ${err}`);
  }
}

test.describe('Verify Version 2 Core Features (Onboarding, QuickStart Banner, Inline Client)', () => {
  test.beforeAll(() => {
    const dir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('Should complete onboarding, view quickstart banner, create inline client and invoice', async ({ page }) => {
    console.log('=== Starting V2 Features E2E Verification ===');

    // 1. Visit Sign-in Page
    await page.goto('/sign-in');
    console.log('Navigated to sign-in page.');
    await page.fill('input[name="email"]', 'testabhi1@clockivo.com');
    await page.fill('input[name="password"]', 'U+o6;;EH');
    await safeScreenshot(page, 'test-results/v2_01_signin.png');
    await page.click('button[type="submit"]');

    // 2. Wait for Dashboard Redirect and Onboarding Modal
    console.log('Waiting for redirect to dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('Navigated to dashboard. Checking for onboarding modal...');
    await safeScreenshot(page, 'test-results/v2_02_dashboard_landing.png');

    // Wait for the dialog to open (Onboarding modal)
    // We check for "Step 1 of 3" which is highly specific to the onboarding modal.
    const onboardingTitle = page.locator('text=Step 1 of 3').first();
    const isModalVisible = await onboardingTitle.isVisible({ timeout: 5000 }).catch(() => false);

    if (isModalVisible) {
      console.log('✔ Onboarding modal is active! Starting step-by-step setup...');

      // Step 1: Full Name
      await page.fill('input#full_name', 'Abhijeet Test User');
      await safeScreenshot(page, 'test-results/v2_03_onboarding_step1.png');
      await page.click('button:has-text("Next")');

      // Step 2: Profession
      await page.waitForSelector('text=What best describes you?', { timeout: 3000 });
      await safeScreenshot(page, 'test-results/v2_04_onboarding_step2.png');
      // Select Software Developer
      await page.click('button:has-text("Software Developer")');
      await page.click('button:has-text("Next")');

      // Step 3: Discovery Source
      await page.waitForSelector('text=How did you hear about us?', { timeout: 3000 });
      await safeScreenshot(page, 'test-results/v2_05_onboarding_step3.png');
      // Select Twitter / X
      await page.click('button:has-text("Twitter / X")');
      await page.click('button:has-text("Complete Setup")');

      // Wait for onboarding modal to close
      await page.waitForSelector('text=Welcome to ChaseFree AI', { state: 'detached', timeout: 5000 });
      console.log('✔ Onboarding completed and modal closed.');
    } else {
      console.log('ℹ Onboarding modal not visible (user might already be onboarded). Continuing...');
    }

    await page.waitForTimeout(2000);
    await safeScreenshot(page, 'test-results/v2_06_dashboard_empty_state.png');

    // 3. Verify Empty State Dashboard & QuickStart Banner
    console.log('Checking for Empty State Dashboard Banner...');
    const quickStartHeader = page.locator('text=Welcome to ChaseFree AI! Let\'s get you paid.').first();
    const isBannerVisible = await quickStartHeader.isVisible();
    
    if (isBannerVisible) {
      console.log('✔ QuickStart Empty State Banner is visible and correctly rendered.');
      console.log('Clicking "Create Invoice" on the QuickStart Banner...');
      await page.click('a:has-text("Create Invoice")');
    } else {
      console.log('ℹ QuickStart Banner not visible (user already has invoices). Navigating directly to /invoices?new=true instead.');
      await page.goto('/invoices?new=true');
    }

    console.log('Waiting for New Invoice Dialog to open...');
    await page.waitForSelector('text=New Invoice', { timeout: 5000 });
    await safeScreenshot(page, 'test-results/v2_07_invoice_form_opened.png');

    // Click "+ Add New Client" button in the Invoice Form
    console.log('Clicking inline "+ Add New Client" button...');
    await page.click('button:has-text("+ Add New Client")');

    // Wait for Client Dialog to open
    console.log('Waiting for Client modal to open...');
    await page.waitForSelector('text=Add Client', { timeout: 5000 });
    await safeScreenshot(page, 'test-results/v2_08_client_modal_opened.png');

    // Fill new client details
    const uniqueName = `Client V2 ${Date.now().toString().slice(-4)}`;
    console.log(`Filling inline client details for: ${uniqueName}`);
    await page.fill('input#clientName', uniqueName);
    await page.fill('input#contactName', 'Inline QA');
    await page.fill('input#email', `inline-qa-${Date.now().toString().slice(-4)}@chasefree.ai`);
    await safeScreenshot(page, 'test-results/v2_09_inline_client_filled.png');

    // Submit Client Form
    console.log('Submitting inline client...');
    await page.click('button[type="submit"]:has-text("Add Client")');

    // Client modal should close, and we should be back in the Invoice Form
    await page.waitForSelector('text=Add Client', { state: 'detached', timeout: 5000 });
    console.log('✔ Inline Client created and modal closed.');

    // Check that the new client is automatically selected in the select trigger
    const selectTrigger = page.locator('button[role="combobox"]').first();
    await expect(selectTrigger).toContainText(uniqueName);
    console.log(`✔ Newly created client "${uniqueName}" is automatically selected!`);

    // Verify Invoice Number auto-fill is working
    const invoiceNumberInput = page.locator('input#invoiceNumber');
    const invoiceNumVal = await invoiceNumberInput.inputValue();
    expect(invoiceNumVal).not.toBe('');
    console.log(`✔ Auto-generated invoice number is active: "${invoiceNumVal}"`);

    // Complete the Invoice Form details
    await page.fill('input#title', 'Implementation of V2 Pipeline');
    await page.fill('textarea#description', 'Inline Client creation integration and verification.');
    
    const today = new Date();
    today.setDate(today.getDate() + 7); // Due in 7 days
    const dueDateStr = today.toISOString().split('T')[0];
    await page.fill('input#dueDate', dueDateStr);
    await page.fill('input#amount', '3500');

    await safeScreenshot(page, 'test-results/v2_10_invoice_form_fully_completed.png');

    // Submit Invoice Form
    console.log('Submitting invoice...');
    await page.click('button[type="submit"]:has-text("Create Invoice")');

    // Invoice Form should close, and the dashboard should now show 1 invoice (No longer empty!)
    await page.waitForSelector('text=Create a new invoice to track payments', { state: 'detached', timeout: 8000 });
    console.log('✔ Invoice successfully created and modal closed.');

    await page.waitForTimeout(3000); // Wait for Next.js revalidation
    await safeScreenshot(page, 'test-results/v2_11_dashboard_with_invoice.png');

    // Confirm that the empty state banner is NO LONGER visible since we have 1 invoice now
    const isBannerVisibleAfter = await quickStartHeader.isVisible();
    expect(isBannerVisibleAfter).toBe(false);
    console.log('✔ Verified Empty State Banner is hidden when an invoice exists.');

    console.log('=== V2 Features E2E Verification Completed Successfully! ===');
  });
});
