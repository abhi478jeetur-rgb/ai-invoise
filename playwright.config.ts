import { defineConfig, devices } from '@playwright/test';

// Turnstile bypass secret — lets E2E requests skip the CAPTCHA widget.
// Read from env so the live secret never lives in the config. CI sets this
// as an Actions secret; locally it comes from .env.local.
const E2E_BYPASS_SECRET = process.env.E2E_BYPASS_SECRET ?? '';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'off',
    video: 'on-first-retry',
    extraHTTPHeaders: {
      'x-e2e-secret': E2E_BYPASS_SECRET,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      // AI provider config is forwarded to the dev server so E2E can exercise
      // real reminder generation. Values must come from the environment — never
      // hardcoded. CI injects these as Actions secrets.
      AI_API_KEY: process.env.AI_API_KEY ?? '',
      AI_BASE_URL: process.env.AI_BASE_URL ?? 'https://integrate.api.nvidia.com/v1',
      AI_MODEL_NAME: process.env.AI_MODEL_NAME ?? 'meta/llama-3.1-8b-instruct',
      NEXT_PUBLIC_IS_E2E: 'true',
    }
  },
});
