# Security Audit — Live Status

**Agent:** Agent 1 (Security Hacker)  
**Date:** 2026-05-31  
**Target:** http://localhost:3000  
**Status:** COMPLETE

---

## Audit Scope

| Area | Status | Result |
|------|--------|--------|
| Auth Bypass (API Routes) | Tested | PASS — 9/9 tests |
| Auth Bypass (Server Actions) | Code Review | PASS — all 35 actions check getUser() |
| SQL Injection | Tested + Code Review | PASS — Supabase parameterized queries |
| Rate Limiting | Code Review + HTTP | 1 BUG FOUND (medium) |
| IDOR / RLS | Code Review | PASS — user_id filter on all queries |
| SSRF Prevention | Code Review | PASS — DNS + IP range validation |
| Cron Endpoint Security | HTTP Tested | PASS — 7/7 bypass attempts rejected |
| Input Validation | Code Review | PASS — Zod + length limits + sanitization |
| File Upload Security | Code Review | PASS — type/size/path validation |
| Cryptography | Code Review | PASS — AES-256-GCM, no hardcoded keys |

---

## Findings

### F1: Rate Limiter Identifier Bug (Medium)
- **File:** `src/lib/settings/actions.ts:259`
- **Issue:** `enforceRateLimit('save_ai_settings', ...)` uses string literal, not `user.id`
- **Impact:** All users share one rate limit bucket

### F2: XFF Spoofable for IP-Based Rate Limits (Low)
- Auth endpoints use IP-based rate limiting
- `x-forwarded-for` header can be spoofed without trusted proxy

### F3: In-Memory Rate Limiter (Low)
- Process-local Map, resets on restart
- Ineffective in multi-instance deployments

### F4: Legacy CBC Encryption (Info)
- AES-256-CBC still supported for backward compatibility
- Should migrate to GCM-only

### F5: No Explicit CSRF Tokens (Info)
- Next.js provides built-in origin-based CSRF protection
- Acceptable with framework protections

---

## Paths Tested

```
/api/invoices/{uuid}/pdf     → Auth required (307 redirect)
/api/cron/reminders          → Bearer token required (401)
/api/auth/callback           → OAuth code exchange
/sign-in (POST)              → Login server action
/sign-up (POST)              → Signup server action
```

---

## Key Security Strengths

1. Every server action checks `getUser()` before DB operations
2. All queries include `.eq('user_id', user.id)` — no IDOR
3. UUID regex validation on all ID parameters
4. Zod schemas on auth inputs
5. SSRF prevention with DNS resolution + IP range checks
6. Database errors sanitized before returning to client
7. AES-256-GCM authenticated encryption for API keys
8. File uploads: type whitelist, size limits, path sanitization
9. Invoice status state machine enforced
10. Soft-delete → hard-delete gate pattern

---

Full report: `testing_observations/security_audit.md`
