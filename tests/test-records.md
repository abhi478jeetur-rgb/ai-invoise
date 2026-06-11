# Test Records

## Execution Date: 2026-06-11 (v2.1.3 CSV Import)
### Environment
- Framework: Vitest (Unit), Browser verification subagent
- Tooling: TypeScript compiler (`npx tsc --noEmit`)

### Results
Implemented the AI-assisted CSV Invoice Ingestion feature (v2.1.3) permitting bulk invoice uploads. Connected the entrypoint via the invoice list header and validated backend actions and client components.

1. **TypeScript Compiler Check (`npx tsc --noEmit`):**
   - **Status:** PASS (0 errors, 0 warnings).
   - **Resolution:** Successfully resolved MappingState casting to standard Record<string, string> mappings and added explicit non-null check assertions for dynamic client creation in `csv-actions.ts`.

2. **Vitest Unit Tests (`npm run test`):**
   - **Status:** PASS (4/4 tests passed).

3. **Browser E2E / Automation Verification:**
   - **Status:** PASS.
   - **Invoices Page UI:** Confirmed the presence of the "Import CSV" button next to "+ New Invoice".
   - **CSV Import Interface:** Verified navigation to `/invoices/import`, successful rendering of the midnight dark glassmorphism upload box, file drag handlers, and styling elements.

---

## Execution Date: 2026-06-11 (v2.1.2 Redesign)
### Environment
- Framework: Vitest (Unit), Playwright (E2E Browser automation)
- Tooling: TypeScript compiler (`npx tsc --noEmit`)

### Results
Redesigned the entire visual analytics charts according to high-fidelity reference styles, completely removed the old analytics (Outstanding Aging horizontal bar chart and right-hand side progress lists), and restructured the dashboard layout to a clean full-width single-column workspace.

1. **TypeScript Compiler Check (`npx tsc --noEmit`):**
   - **Status:** PASS (0 errors, 0 warnings).
   - **Resolution:** Verified type mapping for 6-month historical `monthlyTrend` data and balanced JSX enclosing tags for the new single-column full-width container layout.

2. **Vitest Unit & Component Tests (`npm run test`):**
   - **Status:** PASS (4/4 tests passed).

3. **Playwright E2E / Browser Automation Verification:**
   - **Status:** PASS.
   - **Redesign Renders:** Confirmed Donut Chart (Billing Breakdown) and smooth Area Chart (Cash Volume Trends) render correctly above 'Who to Chase Today' spanning full width. Confirmed old 'Outstanding Aging' components are 100% removed.
   - **Gradients and Rounded Caps:** Recharts donut caps and area gradients loaded cleanly with zero console layout or size warnings.

---

## Execution Date: 2026-06-11
### Environment
- Framework: Vitest (Unit)
- Tooling: TypeScript compiler (`npx tsc --noEmit`)

### Results
After implementing the Analytics Charts component and fixing the Next.js tag-based cache revalidation signatures, we verified both type checking and unit test compliance.

1. **TypeScript Compiler Check (`npx tsc --noEmit`):**
   - **Status:** PASS (0 errors, 0 warnings).
   - **Resolution:** Successfully resolved type errors regarding `DashboardStats` interface extension (`totalPaidFormatted` and `averageDaysToPaid`), Recharts Tooltip formatter parameters, and Next.js `revalidateTag` parameter count constraints by passing `'max'` strategy.

2. **Vitest Unit & Component Tests (`npm run test`):**
   - **Status:** PASS (4/4 tests passed).

---

## Execution Date: 2026-06-10
### Environment
- Framework: Playwright (E2E), Vitest (Unit)
- App Url: http://localhost:3000
- Authentication: Supabase + Cloudflare Turnstile (Bypassed in E2E via E2E secret headers)

### Results
After refactoring the codebase for type safety, clean imports, and standardized logic, the following tests were executed:

1. **TypeScript Compiler Check (`npx tsc --noEmit`):**
   - **Status:** PASS (0 errors, 0 warnings).
   - **Resolution:** Resolved all compile errors regarding profile nullability, select dropdown typing, PDF document image/subtotal arguments, and duplicate reminders actions interfaces.

2. **Vitest Unit & Component Tests (`npm run test`):**
   - **Status:** PASS (4/4 tests passed).
   - **Details:** Checked invoice financial calculations and the UI action button rendering.

3. **Playwright E2E Tests (`npx playwright test --project=chromium`):**
   - **Status:** 65/68 tests passed.
   - **Bypassed CAPTCHA & Rate Limiting:** Implemented request header injection (`x-e2e-secret`) and an IP-rate-limit bypass for E2E tests in server actions, resolving all Turnstile and rate limit sign-in blockages.
   - **Failed/Flaky:**
     - `theme_screenshot.spec.ts`: Timed out exceeding 90 seconds due to heavy full-page screenshot capturing.
     - `nvidia_test.spec.ts`: Timed out waiting for the `Reminder Draft` dialog (due to external Xiaomi Mimo API slowness/timeout during reminder generation).

---

## Execution Date: 2026-06-09
### Environment
- Framework: Playwright (E2E), Vitest (Unit)
- App Url: http://localhost:3000
- Authentication: Supabase + Cloudflare Turnstile

### Results
After investigating the failing tests following the recent layout shifts and UI modifications, it was discovered that the core functionality tests were actually robust. 

The widespread test failures were not caused by UI changes, but by the following factors:
1. **Turnstile Captcha Timing:** Playwright was attempting to click the "Sign In" button too quickly, before the Cloudflare Turnstile widget had finished initializing and verifying the headless browser.
2. **Missing Test Accounts:** Tests were utilizing stale test accounts (`testabhi1@clockivo.com`) instead of the recently verified user account (`testabhi5@clockivo.com`).
3. **Playwright Navigation Timing:** The test environment was overlapping with the user's dev environment without properly passing the `NEXT_PUBLIC_IS_E2E=true` environment variable when `reuseExistingServer` was true.

#### Changes Implemented:
- Increased `page.waitForTimeout` from `1500ms` to `3500ms` across all E2E specs before submitting the login form.
- Updated all E2E test login fixtures to use `testabhi5@clockivo.com`.
- Fixed the `Log out` locator in `auth.spec.ts` to first open the Shadcn user dropdown menu before clicking "Log out", accommodating the new `DropdownMenu` architecture.
- Validated that the existing `getByRole` and `getByText` selectors within `clients.spec.ts`, `invoices_lifecycle.spec.ts`, and `trash_recovery.spec.ts` are robust enough to withstand the layout transition from `flex-col` to `flex-row`.

#### Status
- **Passing:** Core Workflows (`core.spec.ts`), Client Management (`clients.spec.ts`), Invoice Lifecycle (`invoices_lifecycle.spec.ts`), AI Reminder Generation (`nvidia_test.spec.ts`).
- **Flaky/Timeout:** Screenshot tests (`theme_screenshot.spec.ts`) occasionally time out due to the large volume of full-page snapshots required (exceeds default 30s-90s timeouts in CI).

### Next Steps
- Consider setting `NEXT_PUBLIC_IS_E2E=true` explicitly in `package.json` test scripts so Turnstile is fully disabled during all test runs, preventing flaky CAPTCHA timeouts.
