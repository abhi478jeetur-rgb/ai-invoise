# ChaseFree AI - Comprehensive Bug Report

**Generated:** 2026-05-30
**Branch:** feature/light-mode-fixes
**Audited by:** 5 parallel security/correctness agents

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 8 |
| High | 16 |
| Medium | 24 |
| Low | 16 |
| **Total** | **64** |

---

## CRITICAL (Fix Immediately)

### C1: Open Redirect in OAuth Callback
- **File:** `src/app/api/auth/callback/route.ts`, lines 8, 17-22
- **Category:** Security
- **Description:** The `next` query parameter is used directly in the redirect URL without validation. An attacker can craft `/api/auth/callback?code=xxx&next=https://evil.com` to redirect authenticated users to a malicious site. Additionally, `x-forwarded-host` header is trusted blindly in production.
- **Fix:** Validate that `next` starts with `/` and does not contain `//` or a protocol. Validate `forwardedHost` against a whitelist.

### C2: No Rate Limiting on Any Auth Endpoint
- **File:** `src/lib/auth/actions.ts` (all server actions)
- **Category:** Security
- **Description:** None of the auth server actions (`login`, `signup`, `verifyOtpAction`, `sendPasswordReset`, `updatePassword`, `signInWithGoogle`) use `enforceRateLimit`. A 6-digit OTP has only 1M combinations and can be brute-forced in minutes.
- **Fix:** Add `enforceRateLimit` calls to every auth action, keyed by IP address.

### C3: Middleware Does Not Protect Any Routes
- **File:** `src/middleware.ts`, lines 1-47
- **Category:** Security
- **Description:** The middleware only refreshes the Supabase session but never checks whether the user is authenticated. It never calls `redirect()` to send unauthenticated users to sign-in. Route protection exists only at the layout level.
- **Fix:** Add authentication checks to middleware for protected routes.

### C4: No Status Validation in `updateInvoiceStatusAction`
- **File:** `src/lib/invoices/actions.ts`, lines 447-492
- **Category:** Security / Data
- **Description:** The `status` parameter is accepted as a raw string with zero validation. Any arbitrary string can be written to the database. Unlike `createInvoiceAction` and `updateInvoiceAction` which validate against `['draft', 'sent']`, this action trusts the client entirely.
- **Fix:** Validate `status` against an allowed list.

### C5: No Validation on `amountPaid` in `updateInvoiceStatusAction`
- **File:** `src/lib/invoices/actions.ts`, lines 447-468
- **Category:** Data
- **Description:** When `status === 'partial'`, `amountPaid` is written directly to the database with no validation. A client can pass negative numbers, numbers larger than the invoice amount, NaN, or Infinity.
- **Fix:** Fetch the invoice amount first, then validate `amountPaid > 0 && amountPaid < invoice.amount`.

### C6: Dashboard Stats Include Soft-Deleted Invoices
- **File:** `src/lib/dashboard/actions.ts`, line 16-19
- **Category:** Data
- **Description:** `getDashboardDataAction` fetches ALL invoices without filtering `.is('deleted_at', null)`. Soft-deleted invoices are included in ALL dashboard calculations: total outstanding, total overdue, total paid, chase list, aging report, recent invoices.
- **Fix:** Add `.is('deleted_at', null)` to the invoices query.

### C7: Search Returns Soft-Deleted Records
- **File:** `src/lib/search/actions.ts`, lines 38-43 and 50-63
- **Category:** Data
- **Description:** The `searchAllData` function searches both `clients` and `invoices` tables without filtering `.is('deleted_at', null)`. Trashed records appear in search results.
- **Fix:** Add `.is('deleted_at', null)` to both queries.

### C8: Currency CHECK Constraint Mismatch
- **File:** `supabase-migration-v8-security-audit.sql` vs `src/lib/settings/actions.ts`, line 151
- **Category:** Data
- **Description:** The DB CHECK constraint allows only 7 currencies (`USD, EUR, GBP, INR, AUD, CAD, JPY`), but the settings code allows 12 currencies including `SGD, CHF, AED, HKD, MYR`. Users selecting these currencies get a CHECK constraint violation on every invoice creation.
- **Fix:** Update the DB CHECK constraint to include all 12 currencies, or reduce the code whitelist.

---

## HIGH (Fix Soon)

### H1: No Invoice Status Transition Enforcement
- **File:** `src/lib/invoices/actions.ts`, `updateInvoiceStatusAction` and `markInvoicePaidAction`
- **Category:** Logic / Data
- **Description:** No guards preventing invalid status transitions. A `paid` invoice can be set back to `draft`. A `cancelled` invoice can become `paid`. An already-paid invoice can be marked paid again.
- **Fix:** Fetch current status and validate the transition is allowed before updating.

### H2: `hardDeleteClientAction` Does Not Require Soft-Delete First
- **File:** `src/lib/clients/actions.ts`, lines 264-287
- **Category:** Logic / Data
- **Description:** Permanently removes a client regardless of whether `deleted_at` is set, bypassing the trash/restore workflow.
- **Fix:** Add a check that `deleted_at IS NOT NULL` before allowing hard delete.

### H3: `hardDeleteInvoiceAction` Does Not Require Soft-Delete First
- **File:** `src/lib/invoices/actions.ts`, lines 381-400
- **Category:** Logic / Data
- **Description:** Same issue as H2 but for invoices. Active invoices can be permanently destroyed without going through trash.
- **Fix:** Verify `deleted_at IS NOT NULL` before hard-deleting.

### H4: Client Restore Over-Restores Invoices
- **File:** `src/lib/clients/actions.ts`, lines 227-262
- **Category:** Logic / Data
- **Description:** When restoring a soft-deleted client, ALL invoices for that client are restored, including ones that were individually soft-deleted before the client was deleted.
- **Fix:** Only restore invoices whose `deleted_at` matches the client's `deleted_at` timestamp.

### H5: Potential Null Pointer in Dashboard Date Parsing
- **File:** `src/lib/dashboard/actions.ts`, line 36 and line 85
- **Category:** Logic
- **Description:** `inv.due_date.includes('T')` is called without a null check. If `due_date` is null, this throws TypeError and crashes the entire dashboard.
- **Fix:** Add null guards before date parsing.

### H6: Race Condition in Invoice Number Generation
- **File:** `src/lib/invoices/actions.ts`, lines 113-160
- **Category:** Logic
- **Description:** `getNextInvoiceNumberAction` fetches the last invoice number and increments it, but this is not atomic. Two concurrent calls can get the same number.
- **Fix:** Use a database sequence or handle the unique constraint violation by retrying.

### H7: AI Settings Save Action Missing
- **File:** `src/lib/settings/actions.ts`, lines 60-63
- **Category:** Logic
- **Description:** `getSettingsAction` fetches from `user_ai_settings` table, but there is NO corresponding `saveAISettingsAction` anywhere. Users who configure AI settings see their changes appear to save but nothing is persisted.
- **Fix:** Create a `saveAISettingsAction` that validates and upserts into `user_ai_settings`.

### H8: Password Update Does Not Require Current Password
- **File:** `src/lib/auth/actions.ts`, lines 133-152
- **Category:** Security
- **Description:** `updatePassword` calls `supabase.auth.updateUser({ password })` without requiring the current password. If an attacker gains session access, they can lock out the user.
- **Fix:** Require current password verification before allowing password change.

### H9: OAuth Redirect URL Spoofable via Headers
- **File:** `src/lib/auth/actions.ts`, lines 154-179
- **Category:** Security
- **Description:** The OAuth redirect URL is constructed from `x-forwarded-proto` and `host` headers, which are user-controllable if not stripped by a reverse proxy.
- **Fix:** Use `process.env.NEXT_PUBLIC_SITE_URL` as primary source, validate host against whitelist.

### H10: Raw Supabase Error Messages Leaked to Client
- **File:** `src/lib/auth/actions.ts`, lines 27, 65, 88, 128
- **Category:** Security
- **Description:** Raw Supabase error messages are returned directly to the client, potentially exposing internal details.
- **Fix:** Map Supabase errors to generic user-friendly messages.

### H11: Invoice Update Drops PO Number
- **File:** `src/lib/invoices/actions.ts`, lines 214-298
- **Category:** Data
- **Description:** `updateInvoiceAction` does not read `poNumber` from formData and does not include `po_number` in the update payload. PO number changes are silently discarded.
- **Fix:** Read `poNumber` from formData and include in the update payload.

### H12: `generateReminderAction` Race Condition on `reminder_count`
- **File:** `src/lib/reminders/actions.ts`, lines 55-60 (read) and 258-269 (write)
- **Category:** Logic
- **Description:** Read-then-write race condition. Two concurrent requests can read the same count and set it to the same incremented value.
- **Fix:** Use atomic increment via SQL expression.

### H13: `generateMultipleDraftsAction` Does Not Update `reminder_count`
- **File:** `src/lib/reminders/actions.ts`, lines 325-578
- **Category:** Logic
- **Description:** Unlike `generateReminderAction`, this function inserts multiple drafts but never updates `reminder_count` or `last_reminder_at`.
- **Fix:** Update invoice's reminder tracking fields after inserting drafts.

### H14: UnbilledScratchpad - Optimistic Delete Never Rolls Back
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, lines 56-61
- **Category:** State / UX
- **Description:** `handleMarkDone` immediately removes the task from UI, then fires the server action. If the action fails, the task is already gone with no rollback.
- **Fix:** Check the action result. On failure, re-add the task and show error toast.

### H15: UnbilledScratchpad - Navigates to Non-Existent Route
- **File:** `src/components/dashboard/UnbilledScratchpad.tsx`, line 67
- **Category:** UX
- **Description:** `handleCreateInvoice` navigates to `/invoices/new?desc=...`, but there is no `/invoices/new` page. Invoice creation is via a dialog modal on `/invoices` triggered by `?new=true`.
- **Fix:** Change to `router.push('/invoices?new=true&desc=...')`.

### H16: Reset Password - Unmounted setTimeout
- **File:** `src/app/(auth)/reset-password/page.tsx`, lines 32-34
- **Category:** State / Memory Leak
- **Description:** After successful password update, `setTimeout(() => router.push('/sign-in'), 2000)` is never cleaned up. If user navigates away before timer fires, callback executes on unmounted component.
- **Fix:** Store timeout ID in ref and clear in cleanup function.

---

## MEDIUM (Fix When Possible)

### M1: Hardcoded Encryption Salt
- **File:** `src/lib/crypto.ts`, line 8
- **Category:** Security
- **Description:** `const SALT = 'chasefree-ai-v1-salt'` is hardcoded. A salt should be unique per deployment.
- **Fix:** Read from environment variable or generate random salt per encrypted value.

### M2: Legacy CBC Decryption Without Migration Path
- **File:** `src/lib/crypto.ts`, lines 59-68
- **Category:** Security
- **Description:** `decryptKey` supports legacy AES-256-CBC format but there's no migration to re-encrypt to GCM.
- **Fix:** After decrypting CBC-format key, re-encrypt with GCM and update DB.

### M3: `verifyOtpAction` Accepts Unvalidated `type` Parameter
- **File:** `src/lib/auth/actions.ts`, line 75
- **Category:** Security
- **Description:** The `type` field is cast via TypeScript but not validated at runtime. Supabase accepts other types like `magiclink`, `email_change`.
- **Fix:** Validate against explicit allowlist.

### M4: Error Message Leak in PDF Route
- **File:** `src/app/api/invoices/[id]/pdf/route.ts`, lines 82-90
- **Category:** Security
- **Description:** The catch block returns `error.message` directly in the JSON response.
- **Fix:** Use `sanitizeDatabaseError` or generic message.

### M5: Error Message Leak in Search Action
- **File:** `src/lib/search/actions.ts`, line 78
- **Category:** Security
- **Description:** Returns `error.message` directly, bypassing `sanitizeDatabaseError`.
- **Fix:** Use `sanitizeDatabaseError(error)`.

### M6: Error Message Leak in Notifications Actions
- **File:** `src/lib/notifications/actions.ts`, lines 23-26, 44-46, 64-66
- **Category:** Security
- **Description:** All three actions return raw error messages to the client.
- **Fix:** Use `sanitizeDatabaseError`.

### M7: `reminderSettingsSchema` Has No Enum Validation
- **File:** `src/lib/profile/actions.ts`, lines 113-117
- **Category:** Data
- **Description:** Validates `reminder_day` and `reminder_time` as `z.string()` with no enum constraint. Any string is accepted. Users who set invalid values will never receive reminders.
- **Fix:** Use `z.enum(['Monday', ...])` and `z.enum(['Morning', ...])`.

### M8: `Number(temperature) ?? 0.4` Always Returns the Number
- **File:** `src/lib/settings/actions.ts`, line 101
- **Category:** Logic
- **Description:** `Number(null)` returns `0`, not null, so `?? 0.4` never triggers. AI temperature defaults to 0 instead of 0.4.
- **Fix:** Use `aiSettings.temperature != null ? Number(aiSettings.temperature) : 0.4`

### M9: `markInvoicePaidAction` Allows Double-Pay
- **File:** `src/lib/invoices/actions.ts`, lines 402-445
- **Category:** Logic
- **Description:** No check on current status before marking as paid. An already-paid invoice can be marked paid again.
- **Fix:** Check `if (invoice.status === 'paid') return { error: 'Already paid.' }`

### M10: Dashboard Fetches All Invoices Without Pagination
- **File:** `src/lib/dashboard/actions.ts`, line 15-18
- **Category:** Performance
- **Description:** Fetches ALL invoices in a single query with no `.limit()`. Performance degrades with scale.
- **Fix:** Use database-level aggregation for stats.

### M11: No UUID Validation on ID Parameters
- **File:** Multiple files
- **Category:** Security
- **Description:** None of the server actions validate that `invoiceId` or `clientId` are valid UUIDs.
- **Fix:** Add `z.string().uuid()` validation.

### M12: `getInvoiceDetailAction` Returns Soft-Deleted Invoices
- **File:** `src/lib/invoices/actions.ts`, lines 193-212
- **Category:** Data
- **Description:** Does not filter `.is('deleted_at', null)`. Bookmarked trashed invoice URLs still work.
- **Fix:** Add `.is('deleted_at', null)` to the query.

### M13: Email Enumeration via Signup
- **File:** `src/lib/auth/actions.ts`, lines 47-51
- **Category:** Security
- **Description:** Explicitly checks if email exists before creating account, enabling enumeration.
- **Fix:** Return generic message regardless of whether email exists.

### M14: Hardcoded Dark Theme CSS in Dashboard Layout
- **File:** `src/app/(dashboard)/layout.tsx`, lines 43-52
- **Category:** Rendering
- **Description:** Hardcodes dark-mode CSS variables regardless of theme, causing flash of dark styling in light mode.
- **Fix:** Detect theme server-side via cookie or remove hardcoded dark defaults.

### M15: ChaseCard - markInvoicePaid Error Not Handled
- **File:** `src/app/(dashboard)/dashboard/dashboard-chase-card.tsx`, lines 69-73
- **Category:** State / UX
- **Description:** `handleMarkPaid` never checks for errors. If action fails, `markingPaid` stays true permanently.
- **Fix:** Wrap in try/catch, check result.error, reset loading state.

### M16: UserNav - Profile/Settings Menu Items Do Nothing
- **File:** `src/components/dashboard/UserNav.tsx`, lines 47-53
- **Category:** UX
- **Description:** "Profile" and "Settings" menu items have no onClick handler, no href, no asChild wrapping. They do nothing when clicked.
- **Fix:** Remove or wrap with Link components.

### M17: InvoiceDetailActions - Empty Client Object Passed to InvoiceForm
- **File:** `src/app/(dashboard)/invoices/[invoiceId]/invoice-detail-actions.tsx`, lines 168-174
- **Category:** Type / Rendering
- **Description:** When opening edit form, `InvoiceForm` receives clients with `client_name: ''` and null fields.
- **Fix:** Pass actual client data from invoice detail.

### M18: Sidebar - Hover-Only Expand, No Keyboard Support
- **File:** `src/app/(dashboard)/sidebar.tsx`, lines 44-45
- **Category:** Accessibility
- **Description:** Sidebar expands/collapses exclusively via mouse events. No keyboard toggle, no aria-expanded.
- **Fix:** Add keyboard-accessible toggle button and aria attributes.

### M19: SmartBuilder - Line Items Keyed by Array Index
- **File:** `src/app/(dashboard)/invoices/[invoiceId]/builder/smart-builder-client.tsx`, line 394
- **Category:** Rendering
- **Description:** Line items use `key={idx}`. Removing a middle item causes React to reuse DOM nodes incorrectly.
- **Fix:** Assign stable unique ID to each line item.

### M20: Settings Reminder Form - Validation Fails When Reminders Disabled
- **File:** `src/app/(dashboard)/settings/settings-page-client.tsx`, lines 418-427
- **Category:** Validation / Logic
- **Description:** When `reminderEnabled` is false, `reminder_day` and `reminder_time` selects are unmounted. The Zod schema requires these fields, causing validation failure.
- **Fix:** Make schema fields optional when reminders disabled, or always render selects but disable them.

### M21: Client Form - Email Uses type="text"
- **File:** `src/components/clients/client-form.tsx`, line 135
- **Category:** Validation / UX
- **Description:** Email input uses `type="text"` instead of `type="email"`, disabling browser validation and email keyboard on mobile.
- **Fix:** Change to `type="email"`.

### M22: Client Form - Stale Values on Second Creation
- **File:** `src/components/clients/client-form.tsx`, lines 39-43 and 79
- **Category:** State / UX
- **Description:** After creating a client, reopening the dialog shows stale values from previous submission.
- **Fix:** Reset form values on dialog close.

### M23: Reminder Modal - Clipboard Write Not Wrapped in try/catch
- **File:** `src/components/reminders/reminder-modal.tsx`, line 124
- **Category:** UX
- **Description:** `navigator.clipboard.writeText()` called without try/catch. Throws in non-HTTPS environments.
- **Fix:** Wrap in try/catch with fallback.

### M24: Dashboard Recent Activities Show Soft-Deleted Invoice Events
- **File:** `src/lib/dashboard/actions.ts`, lines 115-129
- **Category:** Data
- **Description:** Recent activities query doesn't check if related invoice is soft-deleted.
- **Fix:** Join with invoices and filter on `invoices.deleted_at IS NULL`.

---

## LOW (Fix in Cleanup Pass)

### L1: `currency` Not Validated Before `Intl.NumberFormat`
- **File:** `src/lib/dashboard/actions.ts`, lines 44-59
- **Description:** Invalid currency codes cause `RangeError` in `Intl.NumberFormat`.
- **Fix:** Wrap in try-catch or validate against whitelist.

### L2: Race Condition in `signup` Email Check
- **File:** `src/lib/auth/actions.ts`, lines 48-51
- **Description:** `check_email_exists` RPC and subsequent `signUp` are not atomic.
- **Fix:** Supabase handles this at auth layer, but error message will be less friendly.

### L3: `check_email_exists` RPC Error Not Checked
- **File:** `src/lib/auth/actions.ts`, line 48
- **Description:** `checkError` is destructured but never checked. If RPC fails, signup proceeds without duplicate check.
- **Fix:** Check `if (checkError)` and handle.

### L4: Client Delete Cascade Ignores Error
- **File:** `src/lib/clients/actions.ts`, lines 180-187
- **Description:** Cascade soft-delete of invoices result is not checked for errors.
- **Fix:** Check cascade result and include in response.

### L5: `getNextInvoiceNumberAction` Orders by `created_at` Instead of Sequence
- **File:** `src/lib/invoices/actions.ts`, lines 129-135
- **Description:** Orders by `created_at DESC` instead of finding highest invoice number.
- **Fix:** Order by `invoice_number DESC` or parse all to find max.

### L6: In-Memory Rate Limiter Not Shared Across Instances
- **File:** `src/lib/utils/rate-limit.ts`
- **Description:** Process-local `Map` means rate limits are per-instance in multi-instance deployments.
- **Fix:** Use Redis or Supabase for shared state.

### L7: Cron Uses Server Timezone, Not User Timezone
- **File:** `src/app/api/cron/reminders/route.ts`, lines 25-32
- **Description:** "Morning/Afternoon/Evening" determined by server timezone (UTC), not user's timezone.
- **Fix:** Store timezone per user or use UTC time mapping.

### L8: `refund_policy` Not Included in `generateMultipleDraftsAction`
- **File:** `src/lib/reminders/actions.ts`, lines 381-387
- **Description:** Single-draft includes `refund_policy` in AI prompt, multi-draft does not.
- **Fix:** Add `refund_policy` to multi-draft prompt.

### L9: `clearAllNotifications` Is Misnamed
- **File:** `src/lib/notifications/actions.ts`, lines 49-67
- **Description:** Marks notifications as read, does not delete them. Name implies deletion.
- **Fix:** Rename to `markAllNotificationsRead` or add deletion logic.

### L10: `file.name` Not Sanitized in Knowledge Base Upload
- **File:** `src/lib/settings/actions.ts`, line 372
- **Description:** User-supplied filename used directly in storage path.
- **Fix:** Sanitize filename: `fileName.replace(/[^a-zA-Z0-9._-]/g, '_')`.

### L11: Invoice Form - Missing `defaultProfile` in useEffect Deps
- **File:** `src/components/invoices/invoice-form.tsx`, line 116
- **Description:** `defaultProfile` referenced but not in dependency array.
- **Fix:** Add to dependency array or wrap effect logic.

### L12: OTP Inputs Missing `inputMode="numeric"` and `autocomplete="one-time-code"`
- **File:** `src/app/(auth)/verify-otp/page.tsx`, line 147
- **Description:** Mobile users get QWERTY keyboard instead of numeric. Password managers can't auto-fill OTP.
- **Fix:** Add `inputMode="numeric"` and `autocomplete="one-time-code"`.

### L13: PostHog Provider - Non-null Assertion on Potentially Undefined Env Var
- **File:** `src/providers/posthog-provider.tsx`, line 6
- **Description:** `process.env.NEXT_PUBLIC_POSTHOG_KEY!` will be undefined if env var missing.
- **Fix:** Add guard before `posthog.init()`.

### L14: Visual Customizer - localStorage Prefs Overwritten on Theme Switch
- **File:** `src/app/(dashboard)/dashboard/visual-customizer.tsx`, lines 66-97
- **Description:** Two useEffects both depend on `isLight`. The second always overwrites the first, defeating localStorage persistence.
- **Fix:** Consolidate into single useEffect.

### L15: GlobalSearch - Race Condition on Rapid Query Changes
- **File:** `src/components/dashboard/GlobalSearch.tsx`, lines 47-63
- **Description:** Async search has no cancellation. Stale results can overwrite newer ones.
- **Fix:** Use AbortController or request ID counter.

### L16: Landing Page - Misleading AES-256-CBC Claim
- **File:** `src/app/page.tsx`, line 142
- **Description:** Landing page says "AES-256-CBC Secure Vault" but code uses AES-256-GCM.
- **Fix:** Update copy to say "AES-256-GCM Secure Vault".

---

## Top 10 Priority Fixes

1. **C1** - Open Redirect in OAuth Callback (immediate security risk)
2. **C2** - No Rate Limiting on Auth Endpoints (brute-force OTP/login)
3. **C3** - Middleware Does Not Protect Routes (auth bypass)
4. **C4+C5** - No Validation in `updateInvoiceStatusAction` (data corruption)
5. **C6** - Dashboard Shows Deleted Invoices (breaks entire soft-delete feature)
6. **C7** - Search Returns Deleted Records (breaks soft-delete UX)
7. **C8** - Currency Constraint Mismatch (broken feature for 5 currencies)
8. **H7** - AI Settings Save Missing (silent data loss)
9. **H1** - No Status Transition Enforcement (invoice lifecycle uncontrolled)
10. **H2+H3** - Hard Delete Without Soft-Delete Check (trash bypassable)

---

## Files With Most Bugs

| File | Bug Count |
|------|-----------|
| `src/lib/invoices/actions.ts` | 10 |
| `src/lib/auth/actions.ts` | 8 |
| `src/lib/dashboard/actions.ts` | 6 |
| `src/lib/clients/actions.ts` | 5 |
| `src/lib/reminders/actions.ts` | 5 |
| `src/lib/settings/actions.ts` | 5 |
| `src/components/dashboard/UnbilledScratchpad.tsx` | 4 |
| `src/app/(dashboard)/settings/settings-page-client.tsx` | 4 |
| `src/lib/search/actions.ts` | 3 |
| `src/lib/notifications/actions.ts` | 3 |
| `src/app/api/auth/callback/route.ts` | 2 |
| `src/lib/crypto.ts` | 2 |
| `src/app/(auth)/verify-otp/page.tsx` | 2 |
| `src/components/reminders/reminder-modal.tsx` | 3 |
| `src/components/clients/client-form.tsx` | 2 |
| `src/components/invoices/invoice-form.tsx` | 2 |
