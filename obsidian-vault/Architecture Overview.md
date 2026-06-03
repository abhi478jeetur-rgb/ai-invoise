---
tags: [architecture, overview, chasefree-ai]
created: 2026-05-31
---

# ChaseFree AI - Architecture Overview

## Project Summary
**ChaseFree AI** is a freelancer invoicing SaaS built with Next.js 16, React 19, Tailwind CSS 4, and Supabase. It helps freelancers track invoices, manage clients, and send AI-powered payment reminders.

**Graph Stats:** 3653 nodes, 4282 edges, 450 communities

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19.2.4, Tailwind CSS 4.3.0, shadcn/ui |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini (configurable) |
| Analytics | PostHog |
| Testing | Playwright (E2E), Vitest (unit) |

---

## Core Domains

### [[Auth Domain]]
- Sign-in, Sign-up, Forgot Password, Reset Password, Verify OTP
- Google OAuth integration
- Rate limiting on all auth endpoints
- `src/app/(auth)/` + `src/lib/auth/actions.ts`

### [[Dashboard Domain]]
- "Who to Chase Today" - urgency-aware invoice display
- Visual Customizer (theme presets)
- Global Search across clients/invoices
- Notification Bell
- Unbilled Scratchpad
- `src/app/(dashboard)/dashboard/` + `src/lib/dashboard/actions.ts`

### [[Invoices Domain]]
- Invoice CRUD with status lifecycle (draft → sent → overdue → paid)
- PDF generation
- Smart Builder with live preview
- `src/app/(dashboard)/invoices/` + `src/lib/invoices/actions.ts`

### [[Clients Domain]]
- Client management with relationship to invoices
- Client detail page with invoice history
- `src/app/(dashboard)/clients/` + `src/lib/clients/actions.ts`

### [[Reminders Domain]]
- AI-powered reminder generation with tone presets
- Activity timeline for reminder history
- Cron job for automated reminders
- `src/app/(dashboard)/reminders/` + `src/lib/reminders/actions.ts`

### [[Settings Domain]]
- Business profile configuration
- AI settings (provider, model, temperature)
- Knowledge base document management
- `src/app/(dashboard)/settings/` + `src/lib/settings/actions.ts`

---

## Component Architecture

### [[UI Components]]
- shadcn/ui primitives (Button, Card, Dialog, etc.)
- 103 nodes - most connected component library
- `src/components/ui/`

### [[Dashboard Components]]
- GlobalSearch, NotificationBell, PageTitle, UserNav
- `src/components/dashboard/`

### [[Invoice Components]]
- InvoiceForm with client selection and line items
- `src/components/invoices/`

### [[Layout Components]]
- DashboardLayout with sidebar navigation
- `src/components/layout/`

### [[Onboarding Components]]
- 5-step onboarding survey
- `src/components/onboarding/`

---

## Data Layer

### [[Lib Actions]]
Server actions for each domain:
- `src/lib/auth/actions.ts` - Authentication
- `src/lib/clients/actions.ts` - Client CRUD
- `src/lib/invoices/actions.ts` - Invoice CRUD
- `src/lib/reminders/actions.ts` - Reminder generation
- `src/lib/dashboard/actions.ts` - Dashboard aggregation
- `src/lib/settings/actions.ts` - Settings management
- `src/lib/search/actions.ts` - Global search
- `src/lib/unbilled/actions.ts` - Scratchpad items

### [[Database & Supabase]]
- Row Level Security (RLS) on all tables
- Custom Postgres enums for status types
- `src/lib/db/server.ts` - Server client
- `src/lib/db/client.ts` - Browser client

### [[Security Layer]]
- `src/lib/utils/rate-limit.ts` - Rate limiting
- `src/lib/utils/security.ts` - XSS/SSRF prevention
- `src/lib/crypto.ts` - API key encryption
- `src/middleware.ts` - Route protection

---

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/callback` | OAuth callback handler |
| `/api/cron/reminders` | Automated reminder cron job |
| `/api/invoices/[id]/pdf` | PDF generation endpoint |

---

## God Nodes (Most Connected)

1. `cn()` - 86 edges (utility function)
2. `Solved Bugs Log` - 71 edges (documentation)
3. `sanitizeDatabaseError()` - 53 edges (error handling)
4. `Second Bug Hunt Fixes (43 Bugs)` - 48 edges (documentation)

---

## Key Patterns

### Status Lifecycle
```
draft → sent → viewed → partial → paid
                  ↘ overdue → paid
```

### Reminder Tone Escalation
```
gentle → firm → urgent → final
```

### Data Flow
```
User Action → Server Action → Supabase (RLS) → Response → UI Update
```

---

## Related Notes
- [[Auth Domain]]
- [[Dashboard Domain]]
- [[Invoices Domain]]
- [[Clients Domain]]
- [[Reminders Domain]]
- [[Settings Domain]]
- [[UI Components]]
- [[Database & Supabase]]
- [[Security Layer]]
