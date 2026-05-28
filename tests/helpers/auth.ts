import { Page, expect } from '@playwright/test';

const DEFAULT_EMAIL = 'testabhi5@clockivo.com';
const DEFAULT_PASSWORD = 'U+o6;;EH';

export async function signIn(
  page: Page,
  credentials: { email?: string; password?: string } = {}
) {
  const email = credentials.email ?? DEFAULT_EMAIL;
  const password = credentials.password ?? DEFAULT_PASSWORD;

  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email Address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for either a successful redirect or an error message
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 15000 }),
    page.getByText(/Invalid login credentials|Invalid/i).waitFor({ timeout: 15000 }),
  ]);

  // If we're still on sign-in, the credentials are invalid
  if (page.url().includes('/sign-in')) {
    throw new Error(
      `Sign-in failed for ${email}. The test credentials may be stale. ` +
      `Update DEFAULT_EMAIL and DEFAULT_PASSWORD in tests/helpers/auth.ts.`
    );
  }
}

export async function dismissOnboardingIfPresent(page: Page) {
  const surveyDialog = page.getByRole('dialog', { name: /Welcome to ChaseFree AI/i });
  try {
    await surveyDialog.waitFor({ state: 'visible', timeout: 3000 });
  } catch {
    return; // No onboarding dialog — skip
  }

  // Step 1: Name
  await page.getByLabel(/Name/i).fill('E2E Test User');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2: Use Case
  await page.getByText('Tracking late invoices', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 3: Role
  await page.getByText('Freelancer', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 4: Problem
  await page.getByText('Payments are late', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 5: Setup Preference
  await page.getByText('I will explore myself', { exact: true }).click();
  await page.getByRole('button', { name: 'Get Started' }).click();

  await expect(surveyDialog).toBeHidden();
}
