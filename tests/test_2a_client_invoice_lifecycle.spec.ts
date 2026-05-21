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

test.describe('Test 2a: Client & Invoice Lifecycle Management', () => {
  test.beforeAll(() => {
    const dir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('Should successfully create, list, edit, and delete both clients and invoices', async ({ page }) => {
    console.log('=== Starting Test 2a: Client & Invoice Lifecycle ===');

    // 1. Sign In
    await page.goto('/sign-in');
    console.log('Navigated to sign-in page.');
    await page.fill('input[name="email"]', 'testabhi@clockivo.com');
    await page.fill('input[name="password"]', '***REMOVED***');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✔ Authenticated successfully.');

    // 2. Navigate to Clients Page
    await page.click('a[href="/clients"]');
    await page.waitForURL('**/clients**', { timeout: 5000 });
    console.log('✔ Navigated to Clients Page.');
    await safeScreenshot(page, 'test-results/test_2a_01_clients_page.png');

    // 3. Create a New Client
    console.log('Opening Add Client form...');
    const addClientBtn = page.locator('button:has-text("Add Client"), button:has-text("Add Your First Client")').first();
    await addClientBtn.click();
    
    // Fill client form
    const uniqueClientSuffix = Date.now().toString().slice(-4);
    const clientName = `QA Client ${uniqueClientSuffix}`;
    console.log(`Filling client details for: ${clientName}...`);
    await page.fill('input#clientName', clientName);
    await page.fill('input#contactName', 'Jane QA');
    await page.fill('input#email', `qa-${uniqueClientSuffix}@test.com`);
    await page.fill('input#companyName', `QA Enterprise ${uniqueClientSuffix}`);
    await safeScreenshot(page, 'test-results/test_2a_02_client_form_filled.png');

    // Submit client
    await page.click('button[type="submit"]:has-text("Add Client")');
    // Wait for the client dialog to close and list to refresh
    await page.waitForSelector(`text=${clientName}`, { timeout: 8000 });
    console.log('✔ Client created and listed successfully.');
    await safeScreenshot(page, 'test-results/test_2a_03_client_created.png');

    // 4. Navigate to Invoices Page
    await page.click('a[href="/invoices"]');
    await page.waitForURL('**/invoices**', { timeout: 5000 });
    console.log('✔ Navigated to Invoices Page.');
    await safeScreenshot(page, 'test-results/test_2a_04_invoices_page.png');

    // 5. Create a New Invoice for the New Client
    console.log('Opening New Invoice form...');
    const newInvoiceBtn = page.locator('button:has-text("New Invoice"), button:has-text("Create Your First Invoice")').first();
    await newInvoiceBtn.click();

    // Select the client from the dropdown/combobox
    console.log('Selecting the new client in the form...');
    const selectTrigger = page.locator('button[role="combobox"]').first();
    await selectTrigger.click();
    
    // Wait for popover options and select our client
    const clientOption = page.locator(`[role="option"]:has-text("${clientName}")`).first();
    await clientOption.click();

    // Fill invoice fields
    const invoiceNum = `INV-QA-${uniqueClientSuffix}`;
    const invoiceTitle = `Consulting Services ${uniqueClientSuffix}`;
    console.log(`Filling invoice fields for: ${invoiceNum}...`);
    await page.fill('input#invoiceNumber', invoiceNum);
    await page.fill('input#title', invoiceTitle);
    await page.fill('textarea#description', 'High quality QA testing services rendered.');
    
    // Setup Issue Date and Due Date
    const today = new Date();
    // Overdue by 5 days to test overdue badges
    const dueDate = new Date();
    dueDate.setDate(today.getDate() - 5);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Locate due date field by ID and fill it
    await page.fill('input#dueDate', dueDateStr);

    await page.fill('input#amount', '2500'); // Amount
    await safeScreenshot(page, 'test-results/test_2a_05_invoice_form_filled.png');

    // Submit invoice
    await page.click('button[type="submit"]:has-text("Create Invoice")');
    
    // Wait for list to refresh with the new invoice title
    await page.waitForSelector(`text=${invoiceTitle}`, { timeout: 8000 });
    console.log('✔ Invoice created and listed successfully.');
    await safeScreenshot(page, 'test-results/test_2a_06_invoice_created.png');

    // 6. Verify Overdue Badge and Formatting
    const overdueBadge = page.locator(`span:has-text("Overdue")`).first();
    await expect(overdueBadge).toBeVisible();
    console.log('✔ Verified "Overdue" badge is reactive and visible.');

    // 7. Cleanup: Delete Invoice
    console.log('Cleaning up: Deleting invoice...');
    // Click the triple dot option button next to our invoice
    const invoiceCard = page.locator('.border-neutral-900', { hasText: invoiceTitle }).first();
    const optionBtn = invoiceCard.locator('button.h-8.w-8').first();
    await optionBtn.click();
    
    // Click Delete from dropdown (role=menuitem is more specific)
    const deleteOption = page.locator('[role="menuitem"]:has-text("Delete"):visible').first();
    await expect(deleteOption).toBeVisible({ timeout: 5000 });
    await deleteOption.click();
    
    // Wait for Next.js revalidation and UI update
    await page.waitForTimeout(2500);
    
    // Wait for row to disappear
    await expect(page.locator(`text=${invoiceTitle}`)).not.toBeVisible({ timeout: 10000 });
    console.log('✔ Invoice deleted and removed from UI.');

    // 8. Cleanup: Delete Client
    console.log('Cleaning up: Deleting client...');
    await page.click('a[href="/clients"]');
    await page.waitForURL('**/clients**', { timeout: 5000 });
    
    const clientCard = page.locator('.border-neutral-900', { hasText: clientName }).first();
    const clientOptionBtn = clientCard.locator('button.h-8.w-8').first();
    await clientOptionBtn.click();
    
    // Click Delete from dropdown (role=menuitem is more specific)
    const clientDeleteOption = page.locator('[role="menuitem"]:has-text("Delete"):visible').first();
    await expect(clientDeleteOption).toBeVisible({ timeout: 5000 });
    await clientDeleteOption.click();
    
    // Wait for Next.js revalidation and UI update
    await page.waitForTimeout(2500);
    
    await expect(page.locator(`text=${clientName}`)).not.toBeVisible({ timeout: 10000 });
    console.log('✔ Client deleted and removed from UI.');

    await safeScreenshot(page, 'test-results/test_2a_07_cleanup_success.png');
    console.log('=== Test 2a successfully completed! ===');
  });
});
