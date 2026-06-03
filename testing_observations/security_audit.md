# Security Audit Report — ChaseFree AI

**Date:** 2026-05-31  
**Target:** http://localhost:3000  
**Auditor:** Agent 1 (Security Hacker)  
**Scope:** API vulnerabilities — Auth, SQLi, Rate Limits, RLS, IDOR, SSRF, Input Validation  
**Method:** Non-destructive testing via HTTP probing + static code analysis of all server actions, API routes, middleware, and security utilities.

---

## Executive Summary

The application has a **strong security posture** overall. Auth, RLS/IDOR, SSRF, and input validation are well-implemented across the codebase. **3 issues found** — 1 medium severity (rate limiter bug), 2 low severity (design limitations). No critical or high severity vulnerabilities.

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 1 | Needs fix |
| Low | 2 | Accepted risk / Design limitation |
| Info | 3 | Noted |

---

## 1. Authentication & Authorization

### 1.1 API Route Auth — PASS

| Route | Test | Result |
|-------|------|--------|
| `/api/invoices/[id]/pdf` | Unauthenticated GET | 307 redirect to /sign-in (middleware) |
| `/api/cron/reminders` | No Authorization header | 401 Unauthorized |
| `/api/cron/reminders` | Wrong Bearer token | 401 Unauthorized |
| `/api/cron/reminders` | Empty Bearer | 401 Unauthorized |
| `/api/cron/reminders` | Basic auth instead of Bearer | 401 Unauthorized |
| `/api/cron/reminders` | Query param `?token=` | 401 Unauthorized |
| `/api/cron/reminders` | `?force=true` without auth | 401 Unauthorized |
| `/api/cron/reminders` | POST/PUT/DELETE/PATCH | 405 Method Not Allowed |
| `/api/auth/callback` | No code param | 307 redirect |

**Verdict:** All API routes correctly enforce authentication. Cron endpoint rejects all bypass attempts. Non-GET methods properly rejected.

### 1.2 Server Action Auth — PASS

All ~35 server actions call `supabase.auth.getUser()` as the first operation and return `{ error: 'You must be authenticated.' }` if no user is found. No action can be invoked without a valid Supabase session cookie.

### 1.3 Middleware Route Protection — PASS

- Public routes correctly defined: `/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-otp`
- Public API prefixes correctly defined: `/api/auth/callback`, `/api/cron`
- Unauthenticated users hitting protected routes → 307 to `/sign-in`
- Authenticated users hitting auth pages → 307 to `/dashboard`

### 1.4 Email Enumeration Prevention — PASS

- Login returns generic "Invalid email or password." for all failures
- Password reset always returns success message regardless of email existence
- Signup uses `check_email_exists` RPC but returns same success message whether email exists or not

### 1.5 OTP Type Validation — PASS

`verifyOtpAction` strictly validates the `type` parameter against an allowlist `['signup', 'recovery']`. Any other value is rejected.

---

## 2. SQL Injection

### 2.1 Supabase Client Usage — PASS

All database operations use the Supabase JavaScript client (`supabase.from().select/insert/update/delete`), which uses parameterized queries internally. No raw SQL strings are constructed with user input.

### 2.2 Search Action Analysis — PASS (with note)

`src/lib/search/actions.ts:44`:
```typescript
.or(`client_name.ilike."${searchTerm}",email.ilike."${searchTerm}"`)
```

The `searchTerm` is interpolated into the `.or()` filter string. However:
- Input is validated via Zod (max 100 chars)
- HTML tags are stripped via regex transform
- Wildcard characters (`%`, `_`, `"`) are stripped before interpolation
- Supabase's PostgREST client handles the `.or()` filter syntax safely (it's a structured filter, not raw SQL)

**Verdict:** Not exploitable. The Supabase client escapes the values within the `.or()` syntax.

### 2.3 Input Sanitization — PASS

- Zod validation on all auth inputs
- HTML tag stripping on search queries
- Wildcard character removal on search queries
- Length limits on all text fields

---

## 3. Rate Limiting

### 3.1 Auth Rate Limits — PASS (Code Review)

Rate limits are correctly configured and enforced in `src/lib/auth/actions.ts`:
- Login: 5 attempts / 15 min per IP
- Signup: 3 attempts / 15 min per IP
- OTP: 5 attempts / 15 min per IP
- Password reset: 3 attempts / 15 min per IP
- OAuth: 10 attempts / 15 min per IP

**Note:** Rate limits cannot be verified via HTTP testing because Next.js server actions are invoked via internal RPC (not direct POST to the URL). The `POST /sign-in` returns 200 (renders the page) regardless of rate limit status. The actual rate limit enforcement happens inside the server action function, which is called by the form submission handler.

### 3.2 AI Settings Rate Limit — BUG FOUND (Medium)

**File:** `src/lib/settings/actions.ts:259`

```typescript
await enforceRateLimit('save_ai_settings', SETTINGS_RATE_LIMIT)
```

**Problem:** The first argument to `enforceRateLimit` is `'save_ai_settings'` (a string literal), not the user ID. Looking at `enforceRateLimit`:

```typescript
export async function enforceRateLimit(
  userId: string | null | undefined,
  options: RateLimitOptions,
  action?: string,
): Promise<RateLimitResult> {
  const identifier = userId ?? (await getClientIp())
  const namespacedIdentifier = action ? `${action}:${identifier}` : identifier
```

When `userId = 'save_ai_settings'` (truthy string), it becomes the identifier. Since it's the same for every user, **all users share a single rate limit bucket** of 10 requests/minute. This means:
- 1 user can make 10 requests, then ALL users are locked out for the remainder of the minute
- Conversely, 10 users making 1 request each would lock out the 11th user

**Expected:** Should be `await enforceRateLimit(user.id, SETTINGS_RATE_LIMIT, 'save_ai_settings')`

**Severity:** Medium — functional bug affecting rate limit accuracy, but not a security bypass (it's overly restrictive, not overly permissive).

### 3.3 Rate Limiter Design Limitations — INFO

1. **In-memory store:** Rate limit state is stored in a process-local `Map`. Resets on server restart. Not shared across multiple instances (Vercel serverless, Docker replicas).
2. **X-Forwarded-For spoofability:** `getClientIp()` reads `x-forwarded-for` header directly. Without a trusted proxy stripping/overwriting this header, clients can spoof their IP to bypass IP-based rate limits. All auth endpoints use `null` for userId (IP-based).
3. **Fixed window:** Uses fixed-window algorithm, not sliding window. A burst at the end of one window + start of the next can exceed the intended rate.

---

## 4. IDOR / RLS (Row-Level Security)

### 4.1 Invoice Actions — PASS

Every invoice action includes `.eq('user_id', user.id)` in the query, ensuring users can only access their own data:

| Action | IDOR Check |
|--------|-----------|
| `getInvoiceDetailAction` | `.eq('user_id', user.id)` |
| `updateInvoiceAction` | `.eq('user_id', user.id)` on both client verification and invoice update |
| `deleteInvoiceAction` | `.eq('user_id', user.id)` |
| `restoreInvoiceAction` | `.eq('user_id', user.id)` |
| `hardDeleteInvoiceAction` | `.eq('user_id', user.id)` |
| `markInvoicePaidAction` | `.eq('user_id', user.id)` |
| `updateInvoiceStatusAction` | `.eq('user_id', user.id)` |
| `createInvoiceAction` | Verifies `client_id` belongs to `user.id` before insert |

### 4.2 Client Actions — PASS

All client actions include `.eq('user_id', user.id)`:
- `updateClientAction` — checks ownership before update
- `deleteClientAction` — checks ownership, cascades to invoices
- `restoreClientAction` — checks ownership, smart cascade restore
- `hardDeleteClientAction` — checks ownership, requires prior soft-delete

### 4.3 UUID Validation — PASS

All ID parameters are validated against `UUID_REGEX` (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) before database queries. This prevents injection of non-UUID values.

### 4.4 PDF Endpoint — PASS

`/api/invoices/[id]/pdf` validates authentication via `supabase.auth.getUser()` and includes `.eq('user_id', user.id)` in the invoice query.

### 4.5 Settings/Profile — PASS

Profile and AI settings actions always filter by `user.id`. The `getSettingsAction` auto-creates a missing profile row, which is a self-healing pattern (not a vulnerability).

### 4.6 Knowledge Base — PASS

Document operations filter by `user_id`. Storage paths are namespaced under `{user.id}/`. Filename sanitization prevents path traversal.

---

## 5. SSRF Prevention

### 5.1 AI Base URL Validation — PASS

Both `saveAISettingsAction` and `generateReminderAction` call `isSafeUrl()` which:
- Blocks `http:` and `https:` protocols only
- Blocks `localhost`, loopback IPs (`127.0.0.0/8`)
- Blocks private IPs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
- Blocks link-local (`169.254.0.0/16`)
- Blocks multicast/broadcast
- Performs DNS resolution to catch hostname → private IP redirects
- Blocks IPv6 loopback, link-local, and unique-local addresses

### 5.2 Cron Endpoint — PASS

Uses service-role key (bypasses RLS) but is protected by Bearer token authentication. The `CRON_SECRET` is required — if missing, returns 401.

### 5.3 Environment Variable Usage — PASS

OAuth redirect URL uses `NEXT_PUBLIC_SITE_URL` env var, not user-controllable headers. This was previously identified as an issue (H14) and has been fixed.

---

## 6. Input Validation & XSS

### 6.1 Zod Validation — PASS

Auth schemas validate email format, password strength (8+ chars, upper, lower, digit, special), and name length.

### 6.2 File Upload Security — PASS

| Upload | Type Restriction | Size Limit | Path Sanitization |
|--------|-----------------|------------|-------------------|
| Business logo | JPG, PNG, WebP only | 2MB | `{user.id}/logo.{ext}` |
| Knowledge base doc | PDF, TXT only | 5MB | `{user.id}/{timestamp}-{sanitized_name}` |

Filename sanitization: `rawName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)`

### 6.3 URL Sanitization — PASS

`sanitizeHref()` only allows `http:`, `https:`, `mailto:`, `tel:` protocols. Returns `#` for anything else (prevents `javascript:` XSS).

### 6.4 Search Input — PASS

- HTML tags stripped via regex
- Wildcard characters (`%`, `_`, `"`) removed
- Max 100 characters
- Results limited to 10 items each

### 6.5 Reminder Input Sanitization — PASS

`sanitizeInput()` in reminders:
- Collapses repeated characters (5+)
- Strips non-word/non-punctuation characters
- Detects gibberish (words > 30 chars that aren't URLs)
- Returns empty string for gibberish input

### 6.6 Database Error Sanitization — PASS

`sanitizeDatabaseError()` maps known PostgreSQL error codes to generic user-facing messages. Internal error details are logged server-side only.

---

## 7. Cryptography

### 7.1 API Key Encryption — PASS

- AES-256-GCM (authenticated encryption) for new encryptions
- Key derived via `scryptSync` from `ENCRYPTION_KEY` env var
- No hardcoded fallback key (throws if env var missing)
- IV is random per encryption
- Auth tag prevents tampering

### 7.2 Legacy CBC Support — INFO

Legacy AES-256-CBC decryption is still supported for backward compatibility. CBC lacks authentication (no auth tag), making it theoretically vulnerable to padding oracle attacks. However, this only affects already-stored encrypted data, and new encryptions always use GCM. The `decryptAndMigrate()` function automatically migrates CBC → GCM on first access.

**Recommendation:** Run a one-time migration script to convert all CBC-encrypted values to GCM, then remove CBC support.

---

## 8. Soft-Delete & Data Integrity

### 8.1 Hard Delete Requires Soft-Delete — PASS

Both `hardDeleteInvoiceAction` and `hardDeleteClientAction` verify `deleted_at IS NOT NULL` before allowing permanent deletion. This prevents accidental direct hard-deletes.

### 8.2 Status Transition Enforcement — PASS

`updateInvoiceStatusAction` enforces a strict state machine (`VALID_TRANSITIONS`). Paid and archived are terminal states with no outgoing transitions.

### 8.3 Double-Pay Prevention — PASS

`markInvoicePaidAction` checks `currentInvoice.status === 'paid'` before allowing the update.

---

## 9. HTTP-Level Tests Summary

| Test Category | Tests Run | Passed | Failed | Notes |
|--------------|-----------|--------|--------|-------|
| Auth Bypass (API routes) | 9 | 9 | 0 | All routes properly protected |
| SQLi | 4 | 4 | 0 | Supabase parameterized queries |
| Rate Limit (HTTP) | 13 | N/A | N/A | Server actions not testable via HTTP |
| IDOR/Path Traversal | 8 | 8 | 0 | All redirect to sign-in (middleware) |
| Cron Bypass | 7 | 7 | 0 | All unauthorized attempts rejected |
| SSRF/Header Injection | 11 | 11 | 0 | Open redirects properly sanitized |
| HTTP Methods | 4 | 4 | 0 | Non-GET properly rejected (405) |

---

## 10. Findings Summary

### FINDING-1: Rate Limiter Identifier Bug (Medium)

- **Location:** `src/lib/settings/actions.ts:259`
- **Issue:** `enforceRateLimit('save_ai_settings', ...)` uses string literal as identifier instead of `user.id`
- **Impact:** All users share a single rate limit bucket for AI settings saves
- **Fix:** Change to `enforceRateLimit(user.id, SETTINGS_RATE_LIMIT, 'save_ai_settings')`

### FINDING-2: IP-Based Rate Limit Spoofability (Low)

- **Location:** `src/lib/utils/rate-limit.ts:71-80`
- **Issue:** `getClientIp()` trusts `x-forwarded-for` header without proxy validation
- **Impact:** Auth rate limits (login, signup, OTP) can be bypassed by spoofing XFF header
- **Mitigation:** Requires trusted reverse proxy that strips/overwrites XFF. In local dev or direct access, this is exploitable.
- **Recommendation:** For production, ensure a trusted proxy (e.g., Vercel, Cloudflare, nginx) overwrites XFF.

### FINDING-3: In-Memory Rate Limiter (Low / Design)

- **Location:** `src/lib/utils/rate-limit.ts:46`
- **Issue:** Rate limit state stored in process-local `Map`. Resets on restart. Not shared across serverless instances.
- **Impact:** Rate limits are ineffective in multi-instance deployments
- **Recommendation:** For production scale, migrate to Redis-backed rate limiting.

### FINDING-4: Legacy CBC Encryption (Info)

- **Location:** `src/lib/crypto.ts:67-75`
- **Issue:** AES-256-CBC decryption still supported for backward compatibility
- **Impact:** Theoretical padding oracle risk on legacy encrypted data
- **Recommendation:** Migrate all CBC-encrypted values to GCM, then remove CBC code.

### FINDING-5: Missing CSRF Tokens on Server Actions (Info)

- **Issue:** Next.js server actions rely on SameSite cookies and origin checking for CSRF protection. No explicit CSRF tokens are used.
- **Impact:** Low — Next.js provides built-in CSRF protection for server actions via origin header validation. SameSite=Lax cookies provide additional protection.
- **Status:** Acceptable with Next.js framework protections.

---

## 11. Security Strengths

1. **Consistent auth pattern** — Every server action checks `getUser()` before any database operation
2. **IDOR prevention** — All queries include `user_id` filter; client ownership verified before cross-table references
3. **UUID validation** — Regex validation on all ID parameters prevents injection
4. **Input validation** — Zod schemas on auth, length limits on all fields, type checking
5. **SSRF prevention** — DNS resolution + IP range checking on all user-controllable URLs
6. **Error sanitization** — Database errors mapped to generic messages; internal details logged server-side only
7. **Authenticated encryption** — AES-256-GCM with random IVs and auth tags
8. **File upload security** — Type whitelist, size limits, path sanitization, user-namespaced storage
9. **State machine enforcement** — Invoice status transitions strictly validated
10. **Soft-delete with hard-delete gate** — Requires prior trash → permanent delete workflow

---

## 12. Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| P1 | Fix rate limiter identifier in `saveAISettingsAction` | 1 line change |
| P2 | Add proxy trust validation for XFF header | Small |
| P3 | Migrate CBC-encrypted data to GCM, remove CBC | Medium |
| P4 | Evaluate Redis-backed rate limiting for production | Medium |
| P5 | Run RLS policy audit on Supabase (check for overly permissive policies) | Manual |

---

*Report generated by Agent 1 (Security Hacker) on 2026-05-31*
