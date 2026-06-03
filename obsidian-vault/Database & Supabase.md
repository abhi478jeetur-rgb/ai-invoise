---
tags: [database, supabase, infrastructure]
created: 2026-05-31
---

# Database & Supabase

## Overview
Supabase provides PostgreSQL database, authentication, and Row Level Security.

## Location
- `src/lib/db/server.ts` - Server-side client
- `src/lib/db/client.ts` - Browser-side client

## Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `clients` | Client records |
| `invoices` | Invoice records |
| `reminder_drafts` | Generated reminder drafts |
| `reminder_events` | Reminder send history |
| `user_ai_settings` | AI configuration |
| `knowledge_base_documents` | KB documents for AI |

## Custom Enums
- Invoice status types
- Reminder tone types
- OTP types

## Row Level Security (RLS)
All tables have RLS policies:
- Users can only access their own data
- `profiles_select_own`
- `clients_select_own`
- `invoices_select_own`
- `reminder_drafts_select_own`
- `reminder_events_select_own`
- `user_ai_settings_select_select_own`

## Related Notes
- [[Architecture Overview]]
- [[Security Layer]]
- [[Auth Domain]]
