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
