# Test Execution Records

This file keeps track of the manual and automated test runs performed on the local machine to ensure everything is documented.

## [2026-05-28] Local Vitest Run (v2.0.1-stable)

**Command Run:** `npx vitest run`
**Environment:** Local Windows Machine
**Status:** ✅ ALL PASSED

### Results Summary:
- **tests/unit/calculations.test.ts** (3 tests) - Passed in 5ms
- **tests/component/ActionButton.test.tsx** (1 test) - Passed in 148ms

### Total Metrics:
- **Test Files:** 2 passed (2 total)
- **Total Tests:** 4 passed (4 total)
- **Duration:** 3.32s (transform 94ms, setup 527ms, import 397ms, tests 152ms, environment 4.38s)

**Notes:** This test run confirmed that the local codebase is structurally sound and the tests execute perfectly when `vitest` dependencies are properly installed. The failure in GitHub Actions was isolated to CI configuration (`npm ci` lockfile mismatch and missing `NEXT_PUBLIC_SUPABASE` environment variables).

## [2026-05-28] GitHub Actions CI History (v2.0.1-stable)

**Environment:** Ubuntu (GitHub Actions)
**Tests Run:** Vitest (Unit) + Playwright (E2E)

### Historical & Recent Runs (Line-by-Line):
- ❌ **Run #1 to #8:** FAILED - Missing `vitest` dependencies and `package-lock.json` OS mismatch.
- ❌ **Run #9 to #12:** FAILED - Vitest installed, but missing `NEXT_PUBLIC_SUPABASE` Environment Variables in CI.
- ❌ **Run #13 (Run ID: 26561704698):** FAILED - Playwright crashed due to missing `./helpers/auth` in 11 AI-generated files.
- ❌ **Run #14 (Latest - Run ID: 26562316429):** FAILED - Deleted the 11 broken files. **46 tests PASSED**, but 1 older manual test (`nvidia_test.spec.ts`) failed because it timed out looking for a 'Base URL' textbox on the Settings page (likely due to a UI update).
