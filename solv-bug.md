# Solved Bugs Log

This file tracks all the major bugs encountered and successfully resolved in the project.

### 1. Vitest Configuration Error in GitHub Actions
- **Bug:** GitHub Actions failed during the "Run Small & Medium Tests" step with `Error: Cannot find module 'vitest/config'`.
- **Root Cause:** `vitest` and `@testing-library/react` dependencies were completely missing from the `devDependencies` in `package.json`.
- **Solution:** Ran `npm install -D vitest @vitejs/plugin-react @testing-library/react jsdom` locally to add them and pushed the updated `package.json` and `package-lock.json`.

### 2. Lockfile Mismatch Error in Ubuntu (CI)
- **Bug:** `npm ci` command crashed in GitHub Actions with error `Missing: @emnapi/runtime@1.10.0 from lock file`.
- **Root Cause:** Cross-OS dependency resolution mismatch. The local Windows `package-lock.json` didn't exactly match what Ubuntu expected for `@emnapi` (which is used by `canvas` or `pdf-parse`). `npm ci` is strictly enforcing lockfile parity and crashed.
- **Solution:** Changed `npm ci` to `npm install` in `.github/workflows/test-ecosystem.yml` so that CI handles OS-specific optional dependencies gracefully.

### 3. Playwright Server Crash (Missing Environment Variables)
- **Bug:** Playwright E2E tests timed out and failed in CI with error `Error: Your project's URL and Key are required to create a Supabase client!`.
- **Root Cause:** Playwright's `webServer` started `npm run dev` in the CI environment, but the GitHub Actions environment did not have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` available.
- **Solution:** Advised the developer to add these keys (along with `CRON_SECRET`) into GitHub Repository Secrets under `Settings > Secrets and variables > Actions`.

### 4. Semantic Versioning Discrepancy
- **Bug:** Git Branch name was `v2.5-stable` and research folders were named `version2_5` and `version3`, causing confusion while the actual project version was `2.0.1`.
- **Root Cause:** Forward-looking naming convention mismatch with actual `package.json` version.
- **Solution:** Renamed branch to `v2.0.1-stable` and synchronized research doc folder names (`version2_1` and `version2_2`).

### 5. Playwright E2E Settings & Reminder wizard Test Failures
- **Bug:** `nvidia_test.spec.ts` manual E2E test timed out while executing settings and reminder tests.
- **Root Causes:**
  1. **Tab Hidden Inputs:** "AI Provider" configuration inputs are inside a tab panel and not rendered/active until the tab is clicked.
  2. **Save Settings Button name mismatch:** The save button name changed from `"Save AI Settings"` to `"Save Settings"`.
  3. **Download PDF Element Role mismatch:** The PDF download link became a premium `button` element instead of an anchor `link`.
  4. **Strict Mode Violation:** The page introduced multiple elements matching `/Generate Reminder/i`, violating strict element resolution.
  5. **New Wizard Flow modal dialog:** Reminder generation transitioned into a gorgeous multi-step modal dialog, needing a `"Generate Draft"` button click and expecting a `"Reminder Draft"` modal dialog preview rather than standard input field.
- **Solution:** 
  1. Updated test to click the `"AI Provider"` tab first.
  2. Changed settings save selector to target `"Save Settings"` button exactly.
  3. Replaced `/Download PDF/i` link selector with a button locator.
  4. Resolved strict mode violation by using `{ exact: true }` matching for `'Generate Reminder'`.
  5. Fully aligned the reminder assertions to match the new beautiful preview wizard: clicks `"Generate Draft"`, verifies the generated preview paragraph contents, and completes the flow by clicking `"Mark as Sent"`.

### 6. Dashboard Visual Customizer Theme Mismatch Override
- **Bug:** The main dashboard content, including cards, background, text, and tables, remained completely black when the user switched the application theme to light mode, causing severe visual mismatch.
- **Root Cause:** The `DashboardVisualCustomizer` component statically initialized its preset configuration defaults to `THEME_PRESETS[0]` (Midnight Dark) on mount and overrode key CSS styling variables for the body and cards, completely ignoring next-themes.
- **Solution:** Integrated `useTheme` from `next-themes` within `visual-customizer.tsx` to dynamically select the Nordic Light preset (which was updated to pure white `#ffffff` cards and backgrounds) when `resolvedTheme` is `'light'`, and Midnight Dark when `'dark'`. This cleanly syncs the visual customizer presets with the system-wide active theme.

### 7. Status Badge Low Contrast Mismatch in Light Mode
- **Bug:** The "Sent" status badge (and other status badges) had very poor contrast in Light Mode, displaying white-ish light text on a light blue-gray background, making them extremely difficult to read.
- **Root Cause:** The status styles used dark-mode-specific color variants (`bg-blue-950/40 text-blue-400 border-blue-900/50` etc.) directly as default classes, without prefixing them with `dark:` or providing standard light mode equivalents.
- **Solution:** Restructured the `STATUS_STYLES` tables across all 6 core components and pages to utilize theme-aware styles: high-contrast colors (e.g. `bg-blue-50 text-blue-700 border-blue-200`) for light mode by default, and prefixed the dark-mode styles with `dark:` (e.g. `dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50`). This provides perfect visual contrast and legibility in both themes.



