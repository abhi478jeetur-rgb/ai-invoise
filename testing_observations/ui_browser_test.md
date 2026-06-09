# Browser UI/UX Audit Report

**Date:** 2026-05-31
**Agent:** Agent 2 (Browser Tester)
**Tool:** Playwright (Chromium)
**Target:** http://localhost:3000
**Test File:** `tests/e2e/browser-ui-audit.spec.ts`

---

## Summary

| Category | Passed | Failed | Warnings |
|----------|--------|--------|----------|
| Unauthenticated Pages | 6 | 0 | 2 |
| Authenticated Pages | 1 (comprehensive) | 0 | 3 |
| Network & Performance | 1 | 0 | 0 |
| **Total** | **8** | **0** | **5** |

**Test Results:** 7/7 tests passed (1.3 min total runtime)

---

## Bugs Found

### BUG-1: Theme Toggle Button Obscured by Overlay (UI/UX)

- **Severity:** ERROR
- **Page:** Dashboard (all authenticated pages)
- **Description:** The theme toggle button (`title="Switch to light mode"`, class `styles-module__themeToggle___3imlT`) is obscured by an overlay `<div class="jsx-56b5888f2a69c30e border p-6">` that intercepts pointer events. Users cannot click the theme toggle without using browser dev tools.
- **Impact:** Users cannot switch between light/dark mode via the UI toggle button.
- **Reproduction:**
  1. Login and navigate to any authenticated page
  2. Try to click the theme toggle button in the sidebar/header
  3. The click is intercepted by the overlay div
- **Root Cause:** Z-index or positioning issue — the overlay div has higher stacking context than the toggle button.
- **Fix:** Adjust z-index of the theme toggle button or the overlay div to ensure the toggle is clickable.

### BUG-2: Create Invoice Button Disabled Without Inline Feedback (UX)

- **Severity:** INFO
- **Page:** Invoices > New Invoice Dialog
- **Description:** The "Create Invoice" button is correctly disabled when no client is selected, but there is no inline error message or visual cue telling the user *why* the button is disabled or what they need to do.
- **Impact:** Users may be confused about why they can't create an invoice.
- **Fix:** Add a helper text or tooltip like "Please select a client first" near the disabled button.

---

## Page-by-Page Observations

### Unauthenticated Pages

#### /sign-in
- **Status:** PASS
- **Elements verified:** Email input, Password input, Sign In button, Sign Up link, Forgot Password link, Google Sign-In button
- **Form validation:** Empty submit stays on page; invalid email + short password tested
- **Console errors:** None detected
- **Notes:** Password visibility toggle (eye icon) present. Clean glassmorphism card design.

#### /sign-up
- **Status:** PASS
- **Elements verified:** Full Name input, Email input, Password input, Sign Up button (exact match), Google Sign Up button
- **Form validation:** Empty submit tested
- **Console errors:** None detected
- **Notes:** Sign In link present. Google OAuth button properly separated from primary Sign Up.

#### /forgot-password
- **Status:** PASS
- **Elements verified:** Email input, submit button
- **Form validation:** Empty submit tested
- **Console errors:** None detected

#### /verify-otp
- **Status:** PASS
- **Elements verified:** 6 OTP inputs with `maxlength="1"`, `inputmode="numeric"`, `pattern="[0-9]*"`
- **Console errors:** None detected
- **Notes:** OTP inputs correctly configured for mobile numeric keyboard.

#### /reset-password
- **Status:** PASS
- **Elements verified:** Password inputs present
- **Console errors:** None detected

#### / (Landing Page)
- **Status:** PASS
- **Content:** Page has content (not empty)
- **Images:** No broken images detected
- **Console errors:** None detected

### Authenticated Pages

#### /dashboard
- **Status:** PASS
- **Content:** Dashboard heading/metrics visible
- **Navigation:** Sidebar present
- **Images:** No broken images
- **Console errors:** None detected

#### /invoices
- **Status:** PASS
- **Content:** Invoice content/empty state visible
- **Search:** Search input functional (tested with query, then cleared)
- **New Invoice Dialog:**
  - Opens correctly
  - All form fields present: Client Select, Invoice Number, Title, Amount, Due Date
  - Create Invoice button correctly disabled without client selection
- **Console errors:** None detected

#### /clients
- **Status:** PASS
- **Content:** Client content/empty state visible
- **Add Client Dialog:**
  - Opens correctly
  - All form fields present: Client Name, Company, Email
  - Empty submit tested
  - Invalid email validation tested
- **Console errors:** None detected

#### /reminders
- **Status:** PASS
- **Content:** Page loaded with content
- **Console errors:** None detected

#### /settings
- **Status:** PASS
- **Content:** Settings content visible (includes "Setting"/"Profile"/"AI")
- **Form inputs:** Present (input/select/textarea elements found)
- **Save button:** Present
- **Console errors:** None detected

#### /trash
- **Status:** PASS
- **Content:** Trash-related content visible
- **Console errors:** None detected

### Navigation

- **Sidebar links tested:** Dashboard, Invoices, Clients, Reminders, Settings, Trash
- **All links:** Navigate to correct URLs
- **Status:** PASS

### Responsive Design (375px mobile viewport)

- **Horizontal scroll:** Not detected (good)
- **Sidebar behavior:** Checked — no overflow beyond viewport
- **Status:** PASS

### Keyboard Accessibility

- **Tab navigation:** Tested 10 tab presses
- **Focus visibility:** No zero-dimension focused elements detected
- **Status:** PASS

### Network & Performance

- **404 errors:** None detected across all pages
- **Failed requests (4xx/5xx):** None detected on dashboard load
- **Status:** PASS

---

## Test Coverage

| Page | Rendered | Form Validation | Navigation | Console Errors |
|------|----------|-----------------|------------|----------------|
| /sign-in | Yes | Yes | N/A | Clean |
| /sign-up | Yes | Yes | N/A | Clean |
| /forgot-password | Yes | Yes | N/A | Clean |
| /verify-otp | Yes | N/A | N/A | Clean |
| /reset-password | Yes | N/A | N/A | Clean |
| / (landing) | Yes | N/A | N/A | Clean |
| /dashboard | Yes | N/A | Yes | Clean |
| /invoices | Yes | Yes | Yes | Clean |
| /clients | Yes | Yes | Yes | Clean |
| /reminders | Yes | N/A | Yes | Clean |
| /settings | Yes | N/A | Yes | Clean |
| /trash | Yes | N/A | Yes | Clean |

---

## Not Tested (Out of Scope / Requires Auth State)

- Invoice detail page (`/invoices/[invoiceId]`) — requires existing invoice
- Invoice builder (`/invoices/[invoiceId]/builder`) — requires existing invoice
- Client detail page (`/clients/[clientId]`) — requires existing client
- Full invoice lifecycle (create → edit → status change → delete) — covered by existing `invoices_lifecycle.spec.ts`
- Full client lifecycle (add → edit → delete) — covered by existing `clients.spec.ts`
- AI reminder generation — requires AI API key
- Email notifications — requires email service

---

## Recommendations

1. **Fix BUG-1 (Theme Toggle):** This is a real UX blocker. The overlay div needs z-index adjustment.
2. **Add inline feedback for BUG-2:** Help text near the disabled Create Invoice button.
3. **Consider adding `data-testid` attributes** to key interactive elements for more reliable test selectors.
4. **Run cross-browser tests** (Firefox, WebKit) for the theme toggle overlay issue — may be browser-specific.

---

## Files Referenced

- Test script: `tests/e2e/browser-ui-audit.spec.ts`
- Sign-in page: `src/app/(auth)/sign-in/page.tsx`
- Auth actions: `src/lib/auth/actions.ts` (rate limit: 5 per 15 min)
- Playwright config: `playwright.config.ts`
