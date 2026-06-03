---
tags: [security, infrastructure]
created: 2026-05-31
---

# Security Layer

## Overview
Multi-layered security: rate limiting, input validation, encryption, and RLS.

## Components

### Rate Limiting
**File:** `src/lib/utils/rate-limit.ts`
- In-memory rate limiter
- Per-endpoint type limits (AUTH, OTP, RESET, OAUTH)
- `handleRateLimitError()` - Standardized error response

### Security Utilities
**File:** `src/lib/utils/security.ts`
- XSS prevention
- SSRF prevention
- Input sanitization

### Encryption
**File:** `src/lib/crypto.ts`
- `encryptKey()` - AES-256-CBC encryption
- `decryptKey()` - Decryption
- `decryptAndMigrate()` - Legacy migration
- `getEncryptionKey()` - Key management

### Database Security
- `sanitizeDatabaseError()` - 53 edges (3rd most connected!)
- Prevents Supabase error leakage
- RLS policies on all tables

### Middleware
**File:** `src/middleware.ts`
- Route protection
- Auth state management
- Public route bypass

## Security Audit Status
- 46/46 backend API tests passing
- RLS, auth, tampering, mass assignment validated
- 3 low-severity findings

## Related Notes
- [[Architecture Overview]]
- [[Auth Domain]]
- [[Database & Supabase]]
