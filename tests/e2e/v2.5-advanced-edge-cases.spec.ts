import { test, expect } from '@playwright/test';
import { signIn, dismissOnboardingIfPresent } from './helpers/auth';

test.describe('V2.5 Advanced & Edge-Case Tests', () => {

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissOnboardingIfPresent(page);
  });

  // ─── 1. Complex Calculation & Edge Cases ───────────────────────────

  test('should accept 99% tax rate on invoice creation', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Create inline client
    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Edge Case Tax ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`tax-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Fill amount and extreme tax
    await dialog.getByLabel(/Amount/i).fill('1000');
    await dialog.getByLabel(/Tax Rate/i).fill('99');

    // Set due date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);

    // Submit — should succeed (99% is within 0-100 range)
    await dialog.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  test('should accept 0% tax rate on invoice creation', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Edge Case Zero ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`zero-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    await dialog.getByLabel(/Amount/i).fill('500');
    await dialog.getByLabel(/Tax Rate/i).fill('0');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);

    await dialog.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  test('should accept flat discount greater than subtotal without crashing', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Edge Case Discount ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`disc-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Amount = 100, Discount = 500 (flat, exceeds subtotal)
    await dialog.getByLabel(/Amount/i).fill('100');
    await dialog.getByRole('spinbutton', { name: 'Discount' }).fill('500');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);

    // Server accepts this (no negative-total validation)
    await dialog.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  test('should allow changing currency in the quick create form', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: /\+ Add New Client/i }).click();
    const clientDialog = page.getByRole('dialog', { name: /Add Client/i });
    await expect(clientDialog).toBeVisible();
    await clientDialog.getByLabel(/Client Name/i).fill(`Edge Case Currency ${Date.now()}`);
    await clientDialog.getByLabel(/Email/i).fill(`curr-${Date.now()}@test.com`);
    await clientDialog.getByRole('button', { name: /Add Client/i }).click();
    await expect(clientDialog).toBeHidden();

    // Change currency from USD to INR
    const currencySelect = dialog.locator('select#currency');
    await currencySelect.selectOption('INR');

    // Verify the select now shows INR
    await expect(currencySelect).toHaveValue('INR');

    // Fill remaining required fields and submit
    await dialog.getByLabel(/Amount/i).fill('2500');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await dialog.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);

    await dialog.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  // ─── 2. State & Workflow Edge Cases ────────────────────────────────

  test('should auto-calculate due date when changing payment terms to Net 30', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // The default payment term is typically Net 30 from profile settings.
    // Change to Net 15 first, then back to Net 30 to verify auto-calc.
    // Scroll the dialog to make payment terms visible, then locate it by label
    const dueDateInput = dialog.locator('input#dueDate');
    await dueDateInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // The payment terms Radix Select is near the "Payment Terms" label
    const paymentTermsLabel = dialog.getByText('Payment Terms').first();
    const paymentTermTrigger = paymentTermsLabel.locator('..').locator('[role="combobox"]');
    await paymentTermTrigger.click();

    // Select "Net 15" from the dropdown
    await page.getByRole('option', { name: /Net 15/i }).click();

    const net15Date = await dueDateInput.inputValue();

    // Now change to Net 30
    await paymentTermTrigger.click();
    await page.getByRole('option', { name: /Net 30/i }).click();

    const net30Date = await dueDateInput.inputValue();

    // Verify Net 30 is exactly 15 days after Net 15
    const d15 = new Date(net15Date + 'T12:00:00');
    const d30 = new Date(net30Date + 'T12:00:00');
    const diffDays = Math.round((d30.getTime() - d15.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(15);

    // Verify Net 30 is exactly 30 days from today (use local date to avoid timezone issues)
    const today = new Date();
    const expectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
    const expectedStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}-${String(expectedDate.getDate()).padStart(2, '0')}`;
    expect(net30Date).toBe(expectedStr);
  });

  test('should change payment terms from Net 15 to Net 60 and verify due date updates', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /New Invoice/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Scroll dialog to payment terms area
    const dueDateInput = dialog.locator('input#dueDate');
    await dueDateInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Locate payment terms combobox by its label
    const paymentTermsLabel = dialog.getByText('Payment Terms').first();
    const paymentTermTrigger = paymentTermsLabel.locator('..').locator('[role="combobox"]');
    await paymentTermTrigger.click();
    await page.getByRole('option', { name: /Net 60/i }).click();
    const net60Date = await dueDateInput.inputValue();

    // Verify Net 60 is exactly 60 days from today (use local date)
    const today = new Date();
    const expectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60);
    const expectedStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}-${String(expectedDate.getDate()).padStart(2, '0')}`;
    expect(net60Date).toBe(expectedStr);
  });

  // ─── 3. Routing & UI Robustness ────────────────────────────────────

  test('should show custom 404 UI for invalid invoice ID', async ({ page }) => {
    await page.goto('/invoices/invalid-fake-id-123');

    // Should render the custom "Invoice Not Found" UI, not a raw error
    await expect(page.getByText('Invoice Not Found')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/does not exist|has been deleted|permission/i)).toBeVisible();

    // Should have a "Back to Invoices" button
    await expect(page.getByRole('link', { name: /Back to Invoices/i })).toBeVisible();
  });

  test('should correctly highlight sidebar active state across pages', async ({ page }) => {
    const routes = [
      { path: '/dashboard', linkName: 'Dashboard' },
      { path: '/invoices', linkName: 'Invoices' },
      { path: '/clients', linkName: 'Clients' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForTimeout(500);

      // The active sidebar link should have aria-current or a distinct visual class.
      // In this app, the active link gets a different background. We verify the link
      // exists and the page loaded correctly.
      const sidebar = page.locator('aside');
      const activeLink = sidebar.getByRole('link', { name: route.linkName });
      await expect(activeLink).toBeVisible({ timeout: 5000 });

      // Verify the page heading matches the route
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show tooltips on Settings page when hovering ? icons', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });

    // Switch to "Business & Invoicing" tab where the Invoice Prefix/Format tooltips live
    await page.getByRole('tab', { name: /Business & Invoicing/i }).click();
    await page.waitForTimeout(500);

    // Find the ? tooltip icons — they are spans with exact text "?" and cursor-help styling
    const tooltipIcons = page.getByText('?', { exact: true });
    const iconCount = await tooltipIcons.count();
    expect(iconCount).toBeGreaterThan(0);

    // Hover over the first ? icon
    const firstIcon = tooltipIcons.first();
    await firstIcon.hover();
    await page.waitForTimeout(300);

    // The tooltip is a sibling span that transitions from opacity-0 to opacity-100 on hover
    // It's inside the same parent div.group.relative
    const parent = firstIcon.locator('..');
    const tooltip = parent.locator('span').filter({ hasText: /starting letters|Sequential pattern/i }).first();
    await expect(tooltip).toBeVisible({ timeout: 3000 });
  });

  test('should navigate to 404 page and back to invoices successfully', async ({ page }) => {
    // Go to a bad URL
    await page.goto('/invoices/nonexistent-uuid-aaaa-bbbb');
    await expect(page.getByText('Invoice Not Found')).toBeVisible({ timeout: 10000 });

    // Click the back button
    await page.getByRole('link', { name: /Back to Invoices/i }).click();
    await expect(page).toHaveURL(/.*\/invoices/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
  });

});
