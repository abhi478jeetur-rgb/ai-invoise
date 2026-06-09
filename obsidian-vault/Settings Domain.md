---
tags: [domain, settings, config]
created: 2026-05-31
---

# Settings Domain

## Overview
Business profile configuration, AI settings, and knowledge base management.

## Pages
| Page | Path | Purpose |
|------|------|---------|
| Settings | `/settings` | All settings in tabbed interface |

## Server Actions
**File:** `src/lib/settings/actions.ts`

| Function | Purpose |
|----------|---------|
| `getSettingsAction()` | Get all settings |
| `saveProfileAction()` | Save business profile |
| `saveAISettingsAction()` | Save AI configuration |
| `deleteAccountAction()` | Delete user account |
| `getKnowledgeBaseDocumentsAction()` | List KB documents |
| `deleteKnowledgeBaseDocumentAction()` | Delete KB document |

## Settings Categories

### Business Profile
- Business name, email, phone
- Address
- Logo upload
- Default currency (`ALLOWED_CURRENCIES`)
- Default payment terms (`ALLOWED_PAYMENT_TERMS`)

### AI Settings
- Provider selection (Google Gemini)
- Model selection
- Temperature control
- API key management (encrypted)

### Knowledge Base
- Document upload for AI context
- Company policies, terms, etc.
- Used in reminder generation

## Security
- API keys encrypted with `encryptKey()` / `decryptKey()`
- `maskApiKey()` for display
- `ALLOWED_CURRENCIES` validation
- `ALLOWED_PAYMENT_TERMS` validation

## Related Notes
- [[Architecture Overview]]
- [[Reminders Domain]]
- [[Security Layer]]
- [[Database & Supabase]]
