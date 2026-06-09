---
tags: [domain, auth, security]
created: 2026-05-31
---

# Auth Domain

## Overview
Handles user authentication, registration, and password management.

## Pages
| Page | Path | Purpose |
|------|------|---------|
| Sign In | `/sign-in` | Email/password + Google OAuth login |
| Sign Up | `/sign-up` | New account registration |
| Forgot Password | `/forgot-password` | Request password reset |
| Reset Password | `/reset-password` | Set new password |
| Verify OTP | `/verify-otp` | Email verification |

## Server Actions
**File:** `src/lib/auth/actions.ts`

| Function | Purpose |
|----------|---------|
| `login()` | Email/password authentication |
| `signup()` | New user registration |
| `logout()` | Session termination |
| `handleOAuthLogin()` | Google OAuth flow |
| `verifyOtpAction()` | OTP verification |
| `resetPasswordAction()` | Password reset |
| `updatePasswordAction()` | Password update |

## Security Features
- Rate limiting per endpoint type (AUTH, OTP, RESET, OAUTH)
- `ALLOWED_OTP_TYPES` runtime validation
- Password update requires current password (H11 fix)
- OAuth redirect URL validation via headers (H14 fix)

## Rate Limit Constants
```
AUTH_RATE_LIMIT
OTP_RATE_LIMIT
RESET_RATE_LIMIT
OAUTH_RATE_LIMIT
```

## Middleware Protection
**File:** `src/middleware.ts`
- `PUBLIC_ROUTES` - Routes accessible without auth
- `PUBLIC_API_PREFIXES` - API routes that bypass auth
- `AUTH_PAGES` - Login/register pages (redirect if already authed)

## Related Notes
- [[Architecture Overview]]
- [[Security Layer]]
- [[Database & Supabase]]
