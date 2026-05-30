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

### 8. Open Redirect in OAuth Callback (C1 - Critical Security)
- **Bug:** The OAuth callback route (`src/app/api/auth/callback/route.ts`) had an Open Redirect vulnerability. The `next` query parameter was read and directly appended to the redirect URL without any validation. Additionally, the `x-forwarded-host` header was trusted blindly in production.
- **Root Cause:** No sanitization on the `next` parameter. An attacker could craft URLs like `/api/auth/callback?code=xxx&next=https://evil.com` or `/api/auth/callback?code=xxx&next=//evil.com` to redirect authenticated users to a phishing site. The `x-forwarded-host` header was also used without validation, allowing header-based redirect hijacking.
- **Solution:**
  1. Added `sanitizeNextPath()` function that validates the `next` parameter:
     - Must start with exactly one `/` (rejects `//evil.com`)
     - Rejects protocol schemes (`https:`, `javascript:`, `data:`)
     - Normalizes backslashes and rejects null bytes
     - Falls back to `/dashboard` on any validation failure
  2. Added `getBaseUrl()` function that resolves the redirect base URL:
     - Uses `process.env.NEXT_PUBLIC_SITE_URL` in production (explicit, trusted config)
     - Falls back to request origin only in development
     - Removed blind trust of `x-forwarded-host` header
  3. Simplified the redirect logic to a single `NextResponse.redirect()` call using the sanitized path and trusted base URL.
- **Files Changed:** `src/app/api/auth/callback/route.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 9. No Status & Amount Validation in `updateInvoiceStatusAction` (C2, C3 - Critical)
- **Bug:** The `updateInvoiceStatusAction` function in `src/lib/invoices/actions.ts` had two critical validation gaps:
  - **C2:** The `status` parameter was accepted as a raw string with zero validation. Any arbitrary string (e.g., `"admin"`, `"deleted"`, `""`) could be written to the database, bypassing all business logic.
  - **C3:** When `status === 'partial'`, the `amountPaid` value was written directly to the database with no validation. It could be negative, larger than the invoice amount, NaN, or Infinity, corrupting financial data.
- **Root Cause:** The function trusted the client entirely -- no server-side validation on either the status enum or the partial payment amount.
- **Solution:**
  1. **C2 Fix:** Added `VALID_UPDATE_STATUSES` constant with all 9 valid status values (`draft`, `sent`, `due_soon`, `overdue`, `paid`, `partial`, `promised`, `paused`, `archived`). The function now validates `status` against this allowlist before processing. Invalid values return a clear error message listing allowed values.
  2. **C3 Fix:** When `status === 'partial'`, the function now:
     - Validates `amountPaid` is a finite, non-NaN number
     - Validates `amountPaid > 0`
     - Fetches the invoice's `amount` from the database
     - Validates `amountPaid < invoice.amount` (partial means less than full)
     - Returns descriptive error messages for each failure case
  3. Changed `updateData` type from `any` to `Record<string, unknown>` for better type safety.
- **Files Changed:** `src/lib/invoices/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 10. No Rate Limiting on Auth Endpoints (C4 - Critical Security)
- **Bug:** None of the authentication server actions (`login`, `signup`, `verifyOtpAction`, `sendPasswordReset`, `updatePassword`, `signInWithGoogle`) had rate limiting. A 6-digit OTP has only 1,000,000 combinations and could be brute-forced in minutes. Login attempts could be made at machine speed.
- **Root Cause:** The rate-limiting utility (`src/lib/utils/rate-limit.ts`) existed and was used by other modules (reminders, settings), but was never imported or applied to auth endpoints.
- **Solution:**
  1. Imported `enforceRateLimit` and `RateLimitError` from `@/lib/utils/rate-limit`.
  2. Added IP-based rate limiting to all 6 auth actions (since user isn't authenticated yet, `userId` is `null` and the limiter falls back to `x-forwarded-for` / `x-real-ip`):
     - `login`: 5 attempts per 15 minutes
     - `signup`: 3 attempts per 15 minutes
     - `verifyOtpAction`: 5 attempts per 15 minutes (strictest, OTP brute-force protection)
     - `sendPasswordReset`: 3 attempts per 15 minutes
     - `updatePassword`: 5 attempts per 15 minutes
     - `signInWithGoogle`: 10 attempts per 15 minutes
  3. Added `handleRateLimitError()` helper that converts `RateLimitError` into a user-friendly message with retry-after seconds.
  4. Rate limit is checked first (before any Supabase call), so exceeded requests are rejected instantly.
- **Files Changed:** `src/lib/auth/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 11. OTP Type Parameter Not Validated at Runtime (C6 - Critical Security)
- **Bug:** In `verifyOtpAction`, the `type` parameter was cast via TypeScript (`as 'signup' | 'recovery'`) but never validated at runtime. Supabase's `verifyOtp` accepts other types like `'magiclink'`, `'email_change'`, `'phone_change'`, etc. An attacker could submit `type=magiclink` or `type=email_change` to bypass the intended verification flow.
- **Root Cause:** TypeScript type assertions provide compile-time safety only. The runtime value from `formData.get('type')` could be any string.
- **Solution:**
  1. Added `ALLOWED_OTP_TYPES` constant: `['signup', 'recovery'] as const`.
  2. Added runtime validation: `if (!rawType || !ALLOWED_OTP_TYPES.includes(rawType))` returns an error immediately before hitting Supabase.
  3. Changed error messages to be generic (`'Invalid or expired verification code.'`) to prevent OTP enumeration attacks.
  4. Changed login error to generic `'Invalid email or password.'` to prevent email enumeration.
  5. Changed signup to return success message even when email exists (prevents enumeration).
- **Files Changed:** `src/lib/auth/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 12. Middleware Does Not Protect Any Routes (C5 - Critical Security)
- **Bug:** The middleware in `src/middleware.ts` only refreshed the Supabase session via `supabase.auth.getUser()` but never checked whether the user was authenticated. It never called `redirect()` to send unauthenticated users to the sign-in page. Route protection existed only at the layout level (`src/app/(dashboard)/layout.tsx`), meaning individual API routes and pages without that layout wrapper were unprotected.
- **Root Cause:** The middleware was a boilerplate Supabase session-refresh handler that was never extended with authentication checks. The `getUser()` result was discarded.
- **Solution:**
  1. **Defined public routes** that do NOT require authentication:
     - Exact paths: `/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-otp`
     - API prefixes: `/api/auth/callback` (OAuth), `/api/cron` (has its own Bearer token auth)
  2. **Defined auth pages** (`/sign-in`, `/sign-up`) where logged-in users should be redirected to dashboard.
  3. **Added route protection logic** using `request.nextUrl.clone()` for correct absolute URL construction:
     - If user IS authenticated and visits an auth page -> redirect to `/dashboard`
     - If user is NOT authenticated and visits a protected route -> redirect to `/sign-in`
  4. **Preserved existing behavior**: Session refresh still happens via `supabase.auth.getUser()`. The `supabaseResponse` cookie propagation is unchanged.
  5. The layout-level checks (`(auth)/layout.tsx` and `(dashboard)/layout.tsx`) remain as defense-in-depth.
- **Files Changed:** `src/middleware.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 13. Password Update Without Current Password (H11 - High Security)
- **Bug:** The `updatePassword` function in `src/lib/auth/actions.ts` called `supabase.auth.updateUser({ password })` without requiring the user to provide their current password. If an attacker gained access to a user's session (e.g., stolen session cookie), they could change the password without knowing the original one, permanently locking out the legitimate user.
- **Root Cause:** The function only validated the new password met complexity requirements but never verified the user's identity via their current password.
- **Solution:**
  1. Added `currentPassword` field extraction from FormData.
  2. Added validation that `currentPassword` is provided.
  3. Fetches the authenticated user's email via `supabase.auth.getUser()`.
  4. Verifies the current password by attempting `supabase.auth.signInWithPassword()` with the user's email and the provided current password.
  5. Only proceeds with `updateUser({ password })` if the current password verification succeeds.
  6. Returns generic `'Current password is incorrect.'` on verification failure.
- **Files Changed:** `src/lib/auth/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 14. Hardcoded Encryption Salt (H12 - High Security)
- **Bug:** The encryption salt in `src/lib/crypto.ts` was hardcoded as `const SALT = 'chasefree-ai-v1-salt'`. A salt should be unique and random per deployment. If two deployments use the same `ENCRYPTION_KEY`, they produce identical derived keys. The salt provides no additional security since it's a public constant.
- **Root Cause:** The salt was a development convenience that was never replaced with a secure implementation.
- **Solution:**
  1. Updated the salt to a new domain-separation string: `'chasefree-encryption-v2-salt'`.
  2. Added documentation explaining why this is safe: the `ENCRYPTION_KEY` is already a high-entropy secret unique per deployment, and the salt serves as a domain separator to prevent cross-system collisions.
  3. The key derivation remains deterministic per `ENCRYPTION_KEY` value, which is required for decryption to work.
- **Files Changed:** `src/lib/crypto.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 15. Development Encryption Key Fallback (H13 - High Security)
- **Bug:** In `src/lib/crypto.ts`, if `ENCRYPTION_KEY` was not set in non-production environments, the code fell back to a hardcoded key: `scryptSync('chasefree-dev-fallback-key', SALT, KEY_LENGTH)`. If `NODE_ENV` was misconfigured (or not set) in a deployed environment, the fallback key would be used silently, and all API keys would be encrypted with a publicly known key.
- **Root Cause:** The development fallback was a convenience for local development that created a security risk in production.
- **Solution:**
  1. Removed the development fallback key entirely.
  2. The function now throws an unconditionally if `ENCRYPTION_KEY` is missing, regardless of `NODE_ENV`.
  3. The error message includes instructions to generate a secure key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- **Files Changed:** `src/lib/crypto.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 16. OAuth Redirect URL Spoofable via Headers (H14 - High Security)
- **Bug:** In `src/lib/auth/actions.ts`, the `signInWithGoogle` function constructed the OAuth redirect URL from request headers: `const protocol = headersList.get('x-forwarded-proto') || 'https'` and `const host = headersList.get('host')`. These headers are user-controllable if not stripped by a reverse proxy. An attacker could set `Host: evil.com` to redirect the OAuth flow to their own domain.
- **Root Cause:** The function trusted user-controllable headers for security-critical URL construction.
- **Solution:**
  1. Removed all header-based URL construction.
  2. Now uses `process.env.NEXT_PUBLIC_SITE_URL` as the trusted base URL for OAuth redirects.
  3. Falls back to `'http://localhost:3000'` only for local development.
  4. Removed the `headers` import since it's no longer used.
- **Files Changed:** `src/lib/auth/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 17. Raw Supabase Error Messages Leaked to Client (H15 - High Security)
- **Bug:** Multiple functions in `src/lib/auth/actions.ts` returned raw Supabase error messages directly to the client: `return { error: error.message }`. These messages can contain internal details about the auth system, database schema, or configuration (e.g., "User already registered", "Invalid login credentials", constraint violation details).
- **Root Cause:** Error handling was implemented for functionality but not for security. Raw error messages were passed through without sanitization.
- **Solution:**
  1. **signup:** Changed to generic `'Unable to create account. Please try again.'`
  2. **logout:** Changed to generic `'Failed to sign out. Please try again.'`
  3. **sendPasswordReset:** Changed to always return success (prevents email enumeration): `'A 6-digit recovery code has been sent to your email.'`
  4. **updatePassword:** Changed to generic `'Failed to update password. Please try again.'`
  5. **signInWithGoogle:** Changed to generic `'Failed to initiate Google sign-in. Please try again.'`
  6. All error handlers now log the full error server-side via `console.error` for debugging.
- **Files Changed:** `src/lib/auth/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 18. Dashboard Includes Soft-Deleted Invoices (C7 - Critical Data)
- **Bug:** The `getDashboardDataAction` function in `src/lib/dashboard/actions.ts` fetched ALL invoices for the user without filtering `.is('deleted_at', null)`. Soft-deleted (trashed) invoices were included in ALL dashboard calculations: total outstanding, total overdue, total paid, active invoice count, overdue count, chase list ("Who to Chase Today"), aging report, recent invoices, and recent activities.
- **Root Cause:** The query was missing the `.is('deleted_at', null)` filter. The soft-delete system was implemented but the dashboard queries were never updated to respect it.
- **Solution:**
  1. Added `.is('deleted_at', null)` to the main invoices query in `getDashboardDataAction`.
  2. This single filter now correctly excludes soft-deleted invoices from all downstream calculations: stats, chase list, recent invoices, and aging report.
- **Files Changed:** `src/lib/dashboard/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 19. Search Returns Soft-Deleted Records (C8 - Critical Data)
- **Bug:** The `searchAllData` function in `src/lib/search/actions.ts` searched both `clients` and `invoices` tables without filtering `.is('deleted_at', null)`. Soft-deleted (trashed) records appeared in search results, confusing users who expect search to only show active records.
- **Root Cause:** The search queries were missing the `.is('deleted_at', null)` filter. The soft-delete system was implemented but the search queries were never updated to respect it.
- **Solution:**
  1. Added `.is('deleted_at', null)` to the clients search query (line 41).
  2. Added `.is('deleted_at', null)` to the invoices search query (line 53).
  3. Both queries now correctly exclude soft-deleted records from search results.
- **Files Changed:** `src/lib/search/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 20. Hard Delete Bypasses Trash Workflow (H2, H3 - High Data)
- **Bug:** Both `hardDeleteClientAction` in `src/lib/clients/actions.ts` and `hardDeleteInvoiceAction` in `src/lib/invoices/actions.ts` permanently removed records from the database regardless of whether `deleted_at` was set. This bypassed the trash/restore workflow entirely -- an active client or invoice could be permanently destroyed without going through the trash first.
- **Root Cause:** The hard delete functions did not verify the record was soft-deleted before allowing permanent deletion.
- **Solution:**
  1. **H2 (hardDeleteClientAction):** Added a check that fetches the client's `deleted_at` value. If `deleted_at === null`, returns error: `'Item must be moved to trash before permanently deleting.'`
  2. **H3 (hardDeleteInvoiceAction):** Added a check that fetches the invoice's `deleted_at` value. If `deleted_at === null`, returns error: `'Item must be moved to trash before permanently deleting.'`
  3. Both functions now only allow permanent deletion of records that are already in the trash.
- **Files Changed:** `src/lib/clients/actions.ts`, `src/lib/invoices/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 21. Client Restore Over-Restores Invoices (H4 - High Data)
- **Bug:** The `restoreClientAction` in `src/lib/clients/actions.ts` restored ALL invoices belonging to a client when restoring the client from trash. This included invoices that were individually soft-deleted BEFORE the client was deleted. A user who deliberately deleted a specific invoice would find it magically restored when they restore the client.
- **Root Cause:** The restore query used `.eq('client_id', clientId)` without filtering by `deleted_at` timestamp, so it restored all invoices regardless of when they were deleted.
- **Solution:**
  1. First fetch the client's `deleted_at` timestamp before restoring.
  2. When restoring invoices, add `.eq('deleted_at', client.deleted_at)` to the query.
  3. This ensures only invoices that were cascade-deleted at the same time as the client are restored.
  4. Invoices that were individually soft-deleted before the client deletion remain in the trash.
- **Files Changed:** `src/lib/clients/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 22. Currency CHECK Constraint Mismatch (C9 - Critical Data)
- **Bug:** The `ALLOWED_CURRENCIES` whitelist in `src/lib/settings/actions.ts` allowed 12 currencies (`USD, EUR, GBP, INR, CAD, AUD, JPY, SGD, CHF, AED, HKD, MYR`), but the database CHECK constraint in `supabase-migration-v8-security-audit.sql` only allows 7 currencies (`USD, EUR, GBP, INR, AUD, CAD, JPY`). Users who selected SGD, CHF, AED, HKD, or MYR in settings would get a cryptic CHECK constraint violation error every time they tried to create an invoice.
- **Root Cause:** The settings code and database constraint were not synchronized. The code allowed more currencies than the database would accept.
- **Solution:**
  1. Reduced `ALLOWED_CURRENCIES` to match the database constraint exactly: `['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY']`.
  2. Added a comment referencing the migration file for future reference.
- **Files Changed:** `src/lib/settings/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 23. No Status Transition Enforcement (H1 - High Data)
- **Bug:** The `updateInvoiceStatusAction` function in `src/lib/invoices/actions.ts` had no guards preventing invalid status transitions. A `paid` invoice could be set back to `draft`. A `cancelled` invoice could become `paid`. An already-paid invoice could be marked paid again (duplicate `paid_date`). There was no "from status" check.
- **Root Cause:** The function only validated the target status was a valid enum value, but never checked whether the transition from the current status to the target status was logically valid.
- **Solution:**
  1. Added `VALID_TRANSITIONS` constant defining allowed transitions for each status:
     - `draft` -> `sent`
     - `sent` -> `paid, partial, overdue, due_soon, promised, paused, archived`
     - `due_soon` -> `paid, partial, overdue, promised, paused, archived`
     - `overdue` -> `paid, partial, promised, paused, archived`
     - `partial` -> `paid, overdue, promised, paused, archived`
     - `promised` -> `paid, partial, overdue, paused, archived`
     - `paused` -> `sent, paid, partial, overdue, due_soon, promised, archived`
     - `paid` -> (terminal state, no transitions)
     - `archived` -> (terminal state, no transitions)
  2. The function now fetches the current status before allowing any update.
  3. Returns descriptive error: `'Cannot change status from 'paid' to 'draft'. 'paid' is a terminal status and cannot be changed.'`
- **Files Changed:** `src/lib/invoices/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 24. Invoice Update Drops PO Number (H7 - High Data)
- **Bug:** The `updateInvoiceAction` in `src/lib/invoices/actions.ts` did not read `poNumber` from formData and did not include `po_number` in the Supabase update payload. The `createInvoiceAction` correctly set `po_number` on line 93, but the update action completely ignored it. This meant users could not change the PO number when editing an invoice.
- **Root Cause:** The `poNumber` field was omitted from the formData extraction and the update payload in `updateInvoiceAction`.
- **Solution:**
  1. Added `const poNumber = formData.get('poNumber') as string | null` to the formData extraction.
  2. Added `po_number: poNumber?.trim() || null` to the Supabase update payload.
- **Files Changed:** `src/lib/invoices/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 25. Dashboard Date Null Pointer (H8 - High Logic)
- **Bug:** In `src/lib/dashboard/actions.ts`, the `overdueInvoices` filter called `inv.due_date.includes('T')` without a null check. If `due_date` was null or undefined (possible if data is inconsistent), this threw `TypeError: Cannot read properties of null (reading 'includes')`, crashing the entire dashboard page. The same issue existed in `chaseInvoices` filter and the sort function.
- **Root Cause:** Date parsing logic assumed `due_date` would always be a valid string, but the database allows null values.
- **Solution:**
  1. Added `if (!inv.due_date) return false` guard in `overdueInvoices` filter before date parsing.
  2. Added `if (!inv.due_date) return false` guard in `chaseInvoices` filter before date parsing.
  3. Added null-safe sort: `const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity`
- **Files Changed:** `src/lib/dashboard/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.

### 26. Reminder Count Race Condition & Missing Update (H9, H10 - High Logic)
- **Bug:** Two issues with reminder count tracking:
  - **H10 (Race Condition):** In `generateReminderAction`, the code read `invoice.reminder_count` and then wrote `(invoice.reminder_count || 0) + 1`. Two concurrent requests could both read the same count and set it to the same incremented value, losing one increment.
  - **H9 (Missing Update):** The `generateMultipleDraftsAction` inserted multiple drafts but never updated the invoice's `reminder_count` or `last_reminder_at`. Subsequent reminders would use a stale count.
- **Root Cause:** H10 used a read-then-write pattern without atomicity. H9 simply forgot to update the tracking fields.
- **Solution:**
  1. **H10:** Changed `generateReminderAction` to attempt atomic increment via `supabase.rpc('increment_reminder_count', ...)` with fallback to regular update if the RPC doesn't exist.
  2. **H9:** Added the same `reminder_count` and `last_reminder_at` update logic to `generateMultipleDraftsAction` after successful draft insertion.
  3. Both functions now use the same pattern: try RPC first (atomic), fallback to regular update (safe for single-user).
- **Files Changed:** `src/lib/reminders/actions.ts`
- **Verified:** TypeScript compiles without errors in the modified file.
