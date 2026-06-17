# ChaseFree AI -- Comprehensive Bug Hunt Report

**Date:** 2026-05-30
**Branch:** feature/light-mode-fixes
**Auditor:** OpenClaude (5 parallel audit agents)
**Scope:** Full codebase -- API routes, client components, auth flows, forms, data layer

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 11 |
| High | 20 |
| Medium | 34 |
| Low | 27 |
| **Total** | **92** |

**Most impacted areas:**
1. Invoice status management (no validation, no transition guards)
2. Soft-delete system (dashboard/search ignore deleted_at)
3. Auth security (no rate limiting, open redirect, OTP brute-force)
4. UnbilledScratchpad (optimistic updates with zero rollback)
5. Settings/AI (missing save action, currency constraint mismatch)

---

## CRITICAL (11 bugs) -- Fix Immediately

### C1: Open Redirect in OAuth Callback
- **File:** `src/app/api/auth/callback/route.ts`, lines 8, 17-22
- **Category:** Security
- **Description:** The `next` query parameter is used directly in redirect URL without validation. Attacker can craft `/api/auth/callback?code=xxx&next=https://evil.com` to redirect authenticated users to a phishing site. Also trusts `x-forwarded-host` header blindly.
- **Fix:** Validate `next` starts with `/` and does not contain `//`. Validate `forwardedHost` against a whitelist.

### C2: No Status Validation in `updateInvoiceStatusAction`
- **File:** `src/lib/invoices/actions.ts`, lines 447-492
- **Category:** Security / Data
- **Description:** The `status` parameter is accepted as a raw string with zero validation. Any arbitrary string can be written to the database. Unlike `createInvoiceAction` and `updateInvoiceAction` which validate against `['draft', 'sent']`, this action trusts the client entirely.
- **Fix:** Validate `status` against an allowed list of valid enum values.

### C3: No Validation on `amountPaid` in `updateInvoiceStatusAction`
- **File:** `src/lib/invoices/actions.ts`, lines 447-468
- **Category:** Data
- **Description:** When `status === 'partial'`, `amountPaid` is written directly to the database with no validation. Can be negative, larger than invoice amount, NaN, or Infinity.
- **Fix:** Fetch invoice amount first, validate `amountPaid > 0 && amountPaid < invoice.amount`.

### C4: No Rate Limiting on Any Auth Endpoint
- **File:** `src/lib/auth/actions.ts`, all server actions
- **Category:** Security
- **Description:** None of the auth actions (`login`, `signup`, `verifyOtpAction`, `sendPasswordReset`, `updatePassword`, `signInWithGoogle`) use `enforceRateLimit`. OTP has only 1M combinations and can be brute-forced in minutes.
- **Fix:** Add `enforceRateLimit` calls to every auth action, keyed by IP address.

### C5: Middleware Does Not Protect Any Routes
- **File:** `src/middleware.ts`, lines 1-47
- **Category:** Security
- **Description:** The middleware only refreshes the Supabase session but never checks whether the user is authenticated. It never redirects unauthenticated users. Route protection exists only at the layout level.
- **Fix:** Add authentication checks to middleware for protected routes.

### C6: OTP Brute-Force + Type Parameter Not Validated
- **File:** `src/lib/auth/actions.ts`, lines 71-99
- **Category:** Security
- **Description:** No rate limiting on OTP verification. The `type` parameter is taken from form data and passed to Supabase without server-side validation. Attacker could submit `type=recovery` for a signup OTP.
- **Fix:** Add rate limiting (5 attempts per 15 min per email). Validate `type` against allowlist.

### C7: Dashboard Stats Include Soft-Deleted Invoices
- **File:** `src/lib/dashboard/actions.ts`, line 16-19
- **Category:** Data
- **Description:** `getDashboardDataAction` fetches ALL invoices without filtering `.is('deleted_at', null)`. Soft-deleted invoices are included in ALL dashboard calculations: total outstanding, overdue, paid, chase list, aging report, recent invoices.
- **Fix:** Add `.is('deleted_at', null)` to the invoices query.

### C8: Search Returns Soft-Deleted Records
- **File:** `src/lib/search/actions.ts`, lines 38-43 and 50-63
- **Category:** Data
- **Description:** `searchAllData` searches both `clients` and `invoices` without filtering `.is('deleted_at', null)`. Trashed records appear in search results.
- **Fix:** Add `.is('deleted_at', null)` to both queries.

### C9: Currency CHECK Constraint Mismatch
- **File:** `supabase-migration-v8-security-audit.sql` vs `src/lib/settings/actions.ts`
- **Category:** Data
- **Description:** The DB CHECK constraint only allows 7 currencies (USD, EUR, GBP, INR, AUD, CAD, JPY). The settings `ALLOWED_CURRENCIES` allows 12, including 5 the DB will reject (SGD, CHF, AED, HKD, MYR). Users selecting these currencies get cryptic CHECK constraint errors on invoice creation.
- **Fix:** Update the DB CHECK constraint to include all 12 currencies, or reduce the allowed list.

### C10: Settings Reminder Form Validation Fails When Reminders Disabled
- **File:** `src/app/(dashboard)/settings/settings-page-client.tsx`, lines 418-427
- **Category:** Validation / Logic
- **Description:** When `reminderEnabled` is false, the `reminder_day` and `reminder_time` selects are unmounted. Their names are absent from FormData. The server action Zod schema requires these as `z.string()` -- not optional. Either validation fails or null values are saved.
- **Fix:** Make schema fields optional when reminders disabled, or always render selects but disable them.

### C11: `check_email_exists` RPC Callable by Anonymous Users
- **File:** `supabase-migration-v10-check-email.sql`, line 22
- **Category:** Security
- **Description:** The migration grants EXECUTE to `anon` role, enabling user enumeration attacks. An attacker can check whether any email has an account.
- **Fix:** Remove `anon` from the GRANT statement, or add rate limiting/CAPTCHA before calling.

---

## HIGH (20 bugs) -- Fix Soon

### H1: No Invoice Status Transition Enforcement
- **File:** `src/lib/invoices/actions.ts`, `updateInvoiceStatusAction` and `markInvoicePaidAction`
- **Category:** Logic / Data
- **Description:** No guards preventing invalid transitions. A `paid` invoice can be set back to `draft`. A `cancelled` invoice can become `paid`. No "from status" check.
- **Fix:** Fetch current status first, validate transition is allowed.

### H2: `hardDeleteClientAction` Does Not Require Soft-Delete First
- **File:** `src/lib/clients/actions.ts`, lines 264-287
- **Category:** Logic / Data
- **Description:** Permanently removes a client regardless of whether `deleted_at` is set. Bypasses trash/restore workflow entirely.
- **Fix:** Check `deleted_at IS NOT NULL` before allowing hard delete.

### H3: `hardDeleteInvoiceAction` Does Not Require Soft-Delete First
- **File:** `src/lib/invoices/actions.ts`, lines 381-400
- **Category:** Logic / Data
- **Description:** Same issue as H2 but for invoices. Active invoice can be permanently destroyed without going through trash.
- **Fix:** Verify `deleted_at IS NOT NULL` before hard-deleting.

### H4: Client Restore Over-Restores Invoices
- **File:** `src/lib/clients/actions.ts`, lines 227-262
- **Category:** Logic / Data
- **Description:** Restoring a soft-deleted client also restores ALL invoices for that client, including ones that were individually soft-deleted before the client was deleted.
- **Fix:** Only restore invoices whose `deleted_at` matches the client's `deleted_at` timestamp.

### H5: Race Condition in Invoice Number Generation
- **File:** `src/lib/invoices/actions.ts`, lines 32-33 and 113-160
- **Category:** Logic
- **Description:** `getNextInvoiceNumberAction` fetches the last invoice number and increments it, but this is not atomic with the insert. Two concurrent calls can get the same number.
- **Fix:** Use a database sequence or handle unique constraint violation by retrying.

### H6: AI Settings Fetch Only -- No Save Action Exists
- **File:** `src/lib/settings/actions.ts`, lines 60-63
- **Category:** Logic
- **Description:** `getSettingsAction` fetches from `user_ai_settings` table, but there is NO corresponding `saveAISettingsAction` anywhere in the codebase. Users cannot persist AI settings changes.
- **Fix:** Create a `saveAISettingsAction` that validates and upserts into `user_ai_settings`.

### H7: Invoice Update Drops PO Number
- **File:** `src/lib/invoices/actions.ts`, lines 214-298
- **Category:** Data
- **Description:** `updateInvoiceAction` does not read `poNumber` from formData and does not include `po_number` in the update payload. Silent data loss on edit.
- **Fix:** Read `poNumber` from formData and include in update payload.

### H8: Potential Null Pointer in Dashboard Date Parsing
- **File:** `src/lib/dashboard/actions.ts`, line 36 and 85
- **Category:** Logic
- **Description:** `inv.due_date.includes('T')` is called without null check. If `due_date` is null, throws TypeError and crashes the entire dashboard.
- **Fix:** Add null guards before date parsing.

### H9: `generateMultipleDraftsAction` Does Not Update `reminder_count`
- **File:** `src/lib/reminders/actions.ts`, lines 325-578
- **Category:** Logic
- **Description:** Unlike `generateReminderAction`, the multi-draft action inserts drafts but never updates the invoice's `reminder_count` or `last_reminder_at`. Subsequent reminders use stale count.
- **Fix:** Update `reminder_count` and `last_reminder_at` after inserting drafts.

### H10: `generateReminderAction` Race Condition on `reminder_count`
- **File:** `src/lib/reminders/actions.ts`, lines 55-60 and 258-269
- **Category:** Logic
- **Description:** Read-then-write race condition. Two concurrent requests can read the same count and set it to the same incremented value.
- **Fix:** Use atomic increment (SQL expression or RPC).

### H11: Password Update Does Not Require Current Password
- **File:** `src/lib/auth/actions.ts`, lines 133-152
- **Category:** Security
- **Description:** `updatePassword` calls `supabase.auth.updateUser({ password })` without requiring the current password. Stolen session cookie = permanent account takeover.
- **Fix:** Require current password verification before allowing password change.

### H12: Hardcoded Encryption Salt
- **File:** `src/lib/crypto.ts`, line 8
- **Category:** Security
- **Description:** `const SALT = 'chasefree-ai-v1-salt'` is hardcoded. All deployments use the same salt, providing no additional security.
- **Fix:** Read salt from environment variable or generate per-encryption.

### H13: Dev Encryption Key Fallback in Non-Prod
- **File:** `src/lib/crypto.ts`, lines 21-24
- **Category:** Security
- **Description:** If `ENCRYPTION_KEY` is not set in non-production, falls back to a hardcoded key. If `NODE_ENV` is misconfigured in production, all API keys encrypted with a publicly known key.
- **Fix:** Throw unconditionally if `ENCRYPTION_KEY` is not set.

### H14: OAuth Redirect URL Spoofable via Headers
- **File:** `src/lib/auth/actions.ts`, lines 154-179
- **Category:** Security
- **Description:** OAuth redirect URL constructed from `x-forwarded-proto` and `host` headers, which are user-controllable if not stripped by reverse proxy.
- **Fix:** Use `process.env.NEXT_PUBLIC_SITE_URL` as primary source.

### H15: Supabase Error Messages Leaked to Client (Auth)
- **File:** `src/lib/auth/actions.ts`, lines 27, 65, 88, 128
- **Category:** Security
- **Description:** Raw Supabase error messages returned directly to client. Can contain internal details about auth system, database schema, or configuration.
- **Fix:** Map to generic user-friendly messages. Log full error server-side.

### H16: UnbilledScratchpad -- Optimistic Delete Never Rolls Back
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, lines 56-61
- **Category:** State / UX
- **Description:** `handleMarkDone` immediately removes task from UI, then fires server action. Result is never checked. If action fails, task is gone from UI but still `pending` in DB.
- **Fix:** Check action result. On failure, re-add task to state and show error toast.

### H17: UnbilledScratchpad -- Navigates to Non-Existent Route
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, line 67
- **Category:** UX
- **Description:** `handleCreateInvoice` navigates to `/invoices/new?desc=...` but there is no `/invoices/new` page. Invoice creation is via dialog modal on `/invoices` triggered by `?new=true`.
- **Fix:** Change to `router.push('/invoices?new=true&desc=...')`.

### H18: UnbilledScratchpad -- Optimistic Add Has No Rollback
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, lines 33-53
- **Category:** State / Logic
- **Description:** `handleAddTask` immediately adds temp task, clears input, then calls server action. If action fails, ghost task with fake ID persists and user loses their text.
- **Fix:** Wrap in try/catch. On failure, remove temp task and restore input value.

### H19: Stale Closure in InvoiceForm useEffect
- **File:** `src/components/invoices/invoice-form.tsx`, line 116
- **Category:** State
- **Description:** `useEffect` references `defaultProfile` but it's missing from the dependency array `[open, invoice, isEditing]`. New invoices may not get correct default payment terms.
- **Fix:** Add `defaultProfile` to dependency array.

### H20: Unmounted setTimeout in ResetPasswordPage
- **File:** `src/app/(auth)/reset-password/page.tsx`, lines 32-34
- **Category:** State / Memory Leak
- **Description:** After successful password update, `setTimeout(() => router.push('/sign-in'), 2000)` is never cleaned up. If user navigates away before timer fires, callback executes on unmounted component.
- **Fix:** Store timeout ID in ref and clear in cleanup function.

---

## MEDIUM (34 bugs) -- Plan to Fix

### M1: Hardcoded Dark Theme CSS Variables Cause Light Mode FOUC
- **File:** `src/app/(dashboard)/layout.tsx`, lines 43-52
- **Category:** Rendering
- **Description:** Layout hardcodes dark-mode values regardless of theme. Flash of dark styling on initial load in light mode.
- **Fix:** Detect theme server-side via cookie or remove hardcoded dark defaults.

### M2: ChaseCard -- markInvoicePaid Error Not Handled
- **File:** `src/app/(dashboard)/dashboard/dashboard-chase-card.tsx`, lines 69-73
- **Category:** State / UX
- **Description:** `handleMarkPaid` never checks for errors. If action fails, `markingPaid` stays `true` permanently, button stuck in loading state.
- **Fix:** Wrap in try/catch, check result.error, reset loading in all paths.

### M3: DropdownMenu Items in UserNav Are Non-Functional
- **File:** `src/components/dashboard/UserNav.tsx`, lines 47-53
- **Category:** UX
- **Description:** "Profile" and "Settings" menu items have no onClick, no href, no asChild wrapping. They do nothing when clicked.
- **Fix:** Remove or wrap with Link components using asChild.

### M4: InvoiceDetailActions Passes Incomplete Client Object
- **File:** `src/app/(dashboard)/invoices/[invoiceId]/invoice-detail-actions.tsx`, lines 168-174
- **Category:** Type / Rendering
- **Description:** When opening edit form, `InvoiceForm` receives clients with `client_name: ''` and null fields. Client selector shows blank entry.
- **Fix:** Pass actual client data from invoice detail.

### M5: Sidebar Accessibility -- Hover-Only, No Keyboard Support
- **File:** `src/app/(dashboard)/sidebar.tsx`, lines 44-45
- **Category:** Accessibility
- **Description:** Sidebar expands/collapses exclusively via mouse events. No `aria-expanded`, no keyboard toggle, no focus management.
- **Fix:** Add aria-expanded, keyboard-accessible toggle button.

### M6: SmartBuilder Line Items Keyed by Array Index
- **File:** `src/app/(dashboard)/invoices/[invoiceId]/builder/smart-builder-client.tsx`, line 394
- **Category:** Rendering
- **Description:** Line items use `key={idx}`. Removing a middle item causes React to reuse DOM nodes incorrectly.
- **Fix:** Assign stable unique ID to each line item.

### M7: VerifyOtpPage -- No inputMode="numeric" on OTP Inputs
- **File:** `src/app/(auth)/verify-otp/page.tsx`, lines 25-32
- **Category:** UX
- **Description:** Mobile users get full QWERTY keyboard instead of numeric keypad for OTP entry.
- **Fix:** Add `inputMode="numeric"` and `pattern="[0-9]*"`.

### M8: Hardcoded Encryption Salt (Medium because dev-only impact)
- **File:** `src/lib/crypto.ts`, line 8
- **Category:** Security
- **Description:** Salt is a hardcoded public constant. If source leaks, salt provides no protection.
- **Fix:** Read from env var or generate per-encryption.

### M9: Legacy CBC Decryption Without Migration Path
- **File:** `src/lib/crypto.ts`, lines 59-68
- **Category:** Security
- **Description:** `decryptKey` supports legacy AES-256-CBC format but no migration to re-encrypt to GCM. CBC is weaker.
- **Fix:** After decrypting CBC, re-encrypt with GCM and update DB.

### M10: `verifyOtpAction` Accepts Unvalidated `type` Parameter
- **File:** `src/lib/auth/actions.ts`, line 75
- **Category:** Security
- **Description:** `type` is cast via TypeScript but not validated at runtime. Supabase accepts other types like `magiclink`, `email_change`.
- **Fix:** Explicitly validate against `['signup', 'recovery']`.

### M11: Error Message Leak in PDF Route
- **File:** `src/app/api/invoices/[id]/pdf/route.ts`, lines 82-90
- **Category:** Security
- **Description:** Catch block returns `error.message` directly in JSON response. Leaks internal implementation details.
- **Fix:** Use `sanitizeDatabaseError` or generic message.

### M12: Error Message Leak in Search Action
- **File:** `src/lib/search/actions.ts`, line 78
- **Category:** Security
- **Description:** Catch block returns `error.message` directly, bypassing `sanitizeDatabaseError`.
- **Fix:** Use `sanitizeDatabaseError(error)`.

### M13: Error Message Leak in Notifications Actions
- **File:** `src/lib/notifications/actions.ts`, lines 23-26, 44-46, 64-66
- **Category:** Security
- **Description:** All three actions throw errors and catch with `error.message` returned directly. Also `if (error) throw error` bypasses sanitize layer.
- **Fix:** Use `sanitizeDatabaseError` and return instead of throw.

### M14: `reminderSettingsSchema` Has No Enum Validation
- **File:** `src/lib/profile/actions.ts`, lines 113-117
- **Category:** Data
- **Description:** Schema validates `reminder_day` and `reminder_time` as `z.string()` with no enum constraint. Any string accepted. Cron job will never match invalid values.
- **Fix:** Use `z.enum(['Monday', ...])` and `z.enum(['Morning', ...])`.

### M15: `Number(temperature) ?? 0.4` Always Returns the Number
- **File:** `src/lib/settings/actions.ts`, line 101
- **Category:** Logic
- **Description:** `Number(null)` returns `0`, not null/undefined, so `?? 0.4` fallback never triggers. AI temperature defaults to 0 instead of 0.4.
- **Fix:** Use `aiSettings.temperature != null ? Number(aiSettings.temperature) : 0.4`.

### M16: `markInvoicePaidAction` Allows Double-Pay
- **File:** `src/lib/invoices/actions.ts`, lines 402-445
- **Category:** Logic
- **Description:** No check on current status before marking as paid. Already-paid invoice can be marked paid again, overwriting `paid_date`.
- **Fix:** Check `if (invoice.status === 'paid') return error`.

### M17: Dashboard Fetches All Invoices Without Pagination
- **File:** `src/lib/dashboard/actions.ts`, line 15-18
- **Category:** Performance
- **Description:** Fetches ALL invoices in a single query with no `.limit()`. Performance degrades with scale.
- **Fix:** Use database-level aggregation for stats.

### M18: No UUID Validation on ID Parameters
- **File:** Multiple files
- **Category:** Security
- **Description:** None of the server actions validate that `invoiceId` or `clientId` are valid UUIDs.
- **Fix:** Add `z.string().uuid()` validation.

### M19: `getInvoiceDetailAction` Returns Soft-Deleted Invoices
- **File:** `src/lib/invoices/actions.ts`, lines 193-212
- **Category:** Data
- **Description:** Query does not filter `.is('deleted_at', null)`. Bookmarked trashed invoice URLs still work.
- **Fix:** Add `.is('deleted_at', null)`.

### M20: Invoice Percentage Discount Not Capped at 100
- **File:** `src/components/invoices/invoice-form.tsx`, lines 325-344
- **Category:** Validation / Logic
- **Description:** When `discountType` is "percentage", any number accepted. 200% discount produces negative total.
- **Fix:** Cap at 100 on client and server.

### M21: Client Form -- Email Field Uses type="text"
- **File:** `src/components/clients/client-form.tsx`, line 135
- **Category:** Validation / UX
- **Description:** Email input uses `type="text"` instead of `type="email"`. Disables browser validation and email keyboard on mobile.
- **Fix:** Change to `type="email"`.

### M22: Client Form -- Stale Values on Second Creation
- **File:** `src/components/clients/client-form.tsx`, lines 39-43
- **Category:** State / UX
- **Description:** After creating a client, reopening the dialog shows stale values from previous submission. `defaultValue` only applies on initial mount.
- **Fix:** Add form reset on close or use a reset key.

### M23: Reminder Modal -- `handleMarkSent` Ignores Server Errors
- **File:** `src/components/reminders/reminder-modal.tsx`, lines 135-148
- **Category:** Logic / UX
- **Description:** `handleMarkSent` calls `logReminderEventAction` but never checks result. Modal closes regardless of success/failure.
- **Fix:** Check result and show error toast on failure.

### M24: Reminder Modal -- Clipboard Write Not Wrapped in try/catch
- **File:** `src/components/reminders/reminder-modal.tsx`, line 124
- **Category:** UX
- **Description:** `navigator.clipboard.writeText()` called without try/catch. Throws in non-HTTPS environments.
- **Fix:** Wrap in try/catch with fallback.

### M25: UnbilledScratchpad -- startTransition Used Incorrectly for Async
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, lines 47, 58
- **Category:** Logic
- **Description:** `startTransition` from `useTransition` is for synchronous state transitions, not async operations. Errors are silently swallowed.
- **Fix:** Use proper async handling or `useActionState`.

### M26: UnbilledScratchpad -- Input Cleared Before Server Confirms
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, line 45
- **Category:** UX
- **Description:** `setInputValue('')` called before server action completes. If action fails, user's text is gone.
- **Fix:** Clear input only after successful server response.

### M27: Settings -- Document Delete Has No Rollback
- **File:** `src/app/(dashboard)/settings/settings-page-client.tsx`, lines 188-204
- **Category:** State / Logic
- **Description:** `handleDeleteDocument` immediately removes from state before awaiting result. Brief flash where doc disappears then reappears after refresh.
- **Fix:** Remove only after confirmation from server.

### M28: Settings -- Document Upload Uses window.location.reload()
- **File:** `src/app/(dashboard)/settings/settings-page-client.tsx`, line 175
- **Category:** UX
- **Description:** After successful upload, calls `window.location.reload()` instead of `router.refresh()`. Causes full page reload, inconsistent with rest of page.
- **Fix:** Use `router.refresh()`.

### M29: Settings -- No Client-Side Password Confirmation Match
- **File:** `src/app/(dashboard)/settings/settings-page-client.tsx`, lines 378-399
- **Category:** Validation / UX
- **Description:** Password update form has no client-side check that password === confirmPassword. User must wait for server round-trip.
- **Fix:** Add onChange validation for instant feedback.

### M30: Notifications Table Has No INSERT Policy
- **File:** `supabase-migration-v9-notifications.sql`
- **Category:** Security
- **Description:** Notifications table has SELECT, UPDATE, DELETE policies but no INSERT for authenticated users. Latent issue for future features.
- **Fix:** Add INSERT policy or document service-role-only creation.

### M31: `deleteClientAction` Cascade Doesn't Filter Already-Deleted
- **File:** `src/lib/clients/actions.ts`, lines 181-187
- **Category:** Data
- **Description:** Cascade soft-delete overwrites `deleted_at` of invoices that were already individually soft-deleted. Corrupts deletion timeline.
- **Fix:** Add `.is('deleted_at', null)` to cascade update query.

### M32: Dashboard Recent Activities Show Events for Soft-Deleted Invoices
- **File:** `src/lib/dashboard/actions.ts`, lines 115-129
- **Category:** Data
- **Description:** Recent activities query fetches `reminder_events` without checking if related invoice is soft-deleted.
- **Fix:** Join with invoices and filter on `invoices.deleted_at IS NULL`.

### M33: Settings -- No Min/Max Constraints on Numeric Inputs
- **File:** `src/components/invoices/invoice-form.tsx`, lines 261-270, 304-313, 325-330
- **Category:** Validation / UX
- **Description:** Amount, Tax Rate, Discount inputs have no min/max attributes. Users can type negative numbers or tax rate of 500%.
- **Fix:** Add `min="0"`, `max="100"` as appropriate.

### M34: No Rate Limiting on PDF Generation Endpoint
- **File:** `src/app/api/invoices/[id]/pdf/route.ts`
- **Category:** Security
- **Description:** PDF generation is CPU-intensive but has no rate limiting. Attacker could cause DoS with concurrent requests.
- **Fix:** Add rate limiting.

---

## LOW (27 bugs) -- Fix When Convenient

### L1: PostHog Provider Uses Non-Null Assertion on Env Var
- **File:** `src/providers/posthog-provider.tsx`, line 6
- **Description:** `process.env.NEXT_PUBLIC_POSTHOG_KEY!` -- if env var missing, PostHog initialized with undefined.
- **Fix:** Add guard before `posthog.init()`.

### L2: SignInPage -- Loading State Not Reset on Success
- **File:** `src/app/(auth)/sign-in/page.tsx`, lines 18-30
- **Description:** If login succeeds but redirect fails/delays, "Signing in..." state persists forever.
- **Fix:** Add finally block to reset loading.

### L3: DashboardVisualCustomizer -- localStorage Prefs Overwritten on Theme Switch
- **File:** `src/app/(dashboard)/dashboard/visual-customizer.tsx`, lines 66-97
- **Description:** Two useEffects both depend on `isLight`. The second always overwrites localStorage persistence during theme switches.
- **Fix:** Consolidate into single useEffect.

### L4: GlobalSearch -- Stale Results on Rapid Query Changes
- **File:** `src/components/dashboard/GlobalSearch.tsx`, lines 47-63
- **Description:** Debounced search has no cancellation mechanism. Earlier search may resolve after later one.
- **Fix:** Use AbortController or request ID counter.

### L5: ClientDetailActions -- Delete Error Not Shown
- **File:** `src/app/(dashboard)/clients/[clientId]/client-detail-actions.tsx`, lines 26-37
- **Description:** When delete fails, no error message shown to user.
- **Fix:** Add toast.error.

### L6: ClientsPageClient -- Delete Error Logged But Not Shown
- **File:** `src/app/(dashboard)/clients/clients-page-client.tsx`, lines 55-62
- **Description:** Same pattern as L5. Error logged to console but no user feedback.
- **Fix:** Add toast.error.

### L7: `currency` Not Validated Before `Intl.NumberFormat`
- **File:** `src/lib/dashboard/actions.ts`, lines 44-59
- **Description:** If `inv.currency` is non-standard string, `Intl.NumberFormat` throws RangeError, crashing dashboard.
- **Fix:** Wrap in try-catch or validate against whitelist.

### L8: Race Condition in `signup` Email Check
- **File:** `src/lib/auth/actions.ts`, lines 48-51
- **Description:** `check_email_exists` RPC and subsequent `signUp` are not atomic. Low impact because Supabase handles duplicates.
- **Fix:** Already handled by Supabase error on line 64.

### L9: `check_email_exists` RPC Error Not Checked
- **File:** `src/lib/auth/actions.ts`, line 48
- **Description:** `checkError` destructured but never checked. If RPC fails, signup proceeds without duplicate check.
- **Fix:** Check `if (checkError)` and handle.

### L10: Client Delete Cascade Ignores Error
- **File:** `src/lib/clients/actions.ts`, lines 180-187
- **Description:** Cascade soft-delete result not checked. Function returns success even if invoice update failed.
- **Fix:** Check cascade result.

### L11: `getNextInvoiceNumberAction` Orders by `created_at` Not Sequence
- **File:** `src/lib/invoices/actions.ts`, lines 129-135
- **Description:** Orders by `created_at DESC` instead of parsing highest invoice number. Could generate duplicate in edge cases.
- **Fix:** Order by `invoice_number DESC` or scan all for max sequence.

### L12: In-Memory Rate Limiter Not Shared Across Instances
- **File:** `src/lib/utils/rate-limit.ts`
- **Description:** Process-local Map. In multi-instance deployment, rate limits are per-instance, not per-user.
- **Fix:** Use Redis for shared state in production.

### L13: `next` Parameter Not Sanitized (Path Traversal)
- **File:** `src/app/api/auth/callback/route.ts`, line 8
- **Description:** Beyond open redirect, `next` could contain path traversal like `/../../../admin`.
- **Fix:** Normalize path, reject anything not starting with single `/`.

### L14: `file.name` Not Sanitized in Knowledge Base Upload
- **File:** `src/lib/settings/actions.ts`, line 372
- **Description:** User-supplied filename used directly in storage path. Potential path traversal.
- **Fix:** Sanitize filename.

### L15: Cron Uses Server Timezone, Not User Timezone
- **File:** `src/app/api/cron/reminders/route.ts`, lines 25-32
- **Description:** Morning/Afternoon/Evening determined by server timezone (UTC). Users receive reminders at unexpected times.
- **Fix:** Store timezone per user and compute relative to user's timezone.

### L16: `refund_policy` Not Included in `generateMultipleDraftsAction`
- **File:** `src/lib/reminders/actions.ts`, lines 381-387
- **Description:** Single-draft generation includes `refund_policy` but multi-draft does not. Inconsistent AI behavior.
- **Fix:** Add refund_policy to multi-draft rules.

### L17: `clearAllNotifications` Is Misnamed
- **File:** `src/lib/notifications/actions.ts`, lines 49-67
- **Description:** Marks all as read (`.update({ is_read: true })`), does not delete. Name implies deletion.
- **Fix:** Rename to `markAllNotificationsRead` or add deletion logic.

### L18: Onboarding Survey -- Redundant Routing Logic
- **File:** `src/components/onboarding/OnboardingSurvey.tsx`, lines 116-120
- **Description:** Both `quick_guided_tour` and `checklist_setup` push to `/dashboard`. Dead code branching.
- **Fix:** Remove redundant conditional.

### L19: Auth Validation -- `resetPasswordSchema` Has No Min Length on confirmPassword
- **File:** `src/lib/validations/auth.ts`, line 28
- **Description:** Empty confirm password shows "Passwords do not match" instead of "Please confirm your password."
- **Fix:** Add `.min(1)` to confirmPassword.

### L20: Reminder Modal -- `tone` State Persists Across Opens
- **File:** `src/components/reminders/reminder-modal.tsx`, line 83
- **Description:** `handleClose` resets most state but not `tone`. Next invoice's modal starts on last-used tone.
- **Fix:** Reset tone in handleClose.

### L21: UnbilledScratchpad -- No maxLength on Input
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, lines 90-96
- **Description:** Input has no maxLength. Server validates max 500 but client allows unlimited.
- **Fix:** Add `maxLength={500}`.

### L22: Settings -- Delete Account Confirmation Not Cleared on Error
- **File:** `src/app/(dashboard)/settings/settings-page-client.tsx`, lines 285-305
- **Description:** After failed deletion, `deleteConfirmation` not cleared. Button stays enabled.
- **Fix:** Clear confirmation on error.

### L23: UnbilledScratchpad -- Optimistic ID Could Collide
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, line 38
- **Description:** `id: \`temp-${Date.now()}\`` uses millisecond timestamp. Rapid adds could collide.
- **Fix:** Use `crypto.randomUUID()`.

### L24: CSP Allows `unsafe-eval` and `unsafe-inline`
- **File:** `next.config.ts`, line 6
- **Description:** CSP includes `unsafe-eval` and `unsafe-inline` for `script-src`, weakening XSS protection.
- **Fix:** Use nonce-based or hash-based CSP.

### L25: Landing Page Misleading Security Claim
- **File:** `src/app/page.tsx`, line 142
- **Description:** Advertises "AES-256-CBC Secure Vault" but code uses AES-256-GCM.
- **Fix:** Update copy to "AES-256-GCM".

### L26: OTP Input Missing autocomplete="one-time-code"
- **File:** `src/app/(auth)/verify-otp/page.tsx`, line 147
- **Description:** Password managers won't auto-fill OTP codes from SMS/email.
- **Fix:** Add `autocomplete="one-time-code"`.

### L27: PDF Route -- Unsanitized Filename in Content-Disposition
- **File:** `src/app/api/invoices/[id]/pdf/route.ts`, line 74
- **Description:** `invoice.invoice_number` used directly in header without sanitization.
- **Fix:** Strip non-alphanumeric characters.

---

## Priority Fix Order

### Phase 1 -- Security Blockers (C1-C6, H11-H15)
These are actively exploitable. Fix before any other work.

### Phase 2 -- Data Integrity (C7-C9, H1-H4, H7-H10)
Soft-delete system is fundamentally broken. Invoice lifecycle is uncontrolled.

### Phase 3 -- Feature Completeness (C10-C11, H5-H6, H16-H20)
Missing save action, broken forms, broken navigation.

### Phase 4 -- UX & Polish (All Medium and Low)
Error handling, validation, accessibility, performance.

---

## Files Most Affected

| File | Bug Count |
|------|-----------|
| `src/lib/invoices/actions.ts` | 12 |
| `src/lib/auth/actions.ts` | 10 |
| `src/lib/dashboard/actions.ts` | 7 |
| `src/components/dashboard/UnbilledScratchpad.tsx` | 7 |
| `src/lib/clients/actions.ts` | 6 |
| `src/lib/settings/actions.ts` | 5 |
| `src/lib/reminders/actions.ts` | 5 |
| `src/app/(dashboard)/settings/settings-page-client.tsx` | 5 |
| `src/app/api/auth/callback/route.ts` | 3 |
| `src/lib/crypto.ts` | 3 |
