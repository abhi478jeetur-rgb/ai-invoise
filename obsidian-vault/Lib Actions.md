---
tags: [lib, actions, server]
created: 2026-05-31
---

# Lib Actions

## Overview
Server actions for each domain. These are the data layer between UI and Supabase.

## Location
`src/lib/`

## Domain Actions

### Auth Actions
**File:** `auth/actions.ts`
- `login()`, `signup()`, `logout()`
- `handleOAuthLogin()`, `verifyOtpAction()`
- `resetPasswordAction()`, `updatePasswordAction()`

### Client Actions
**File:** `clients/actions.ts`
- `createClient()`, `updateClientAction()`, `deleteClientAction()`
- `getClientsAction()`, `getClientDetailAction()`

### Invoice Actions
**File:** `invoices/actions.ts`
- `createInvoiceAction()`, `updateInvoiceAction()`, `deleteInvoiceAction()`
- `getInvoiceDetailAction()`, `getInvoicesAction()`
- `getNextInvoiceNumberAction()`, `markInvoicePaidAction()`

### Reminder Actions
**File:** `reminders/actions.ts`
- `generateReminderAction()`, `generateMultipleDraftsAction()`
- `getReminderHistoryAction()`, `logReminderEventAction()`

### Dashboard Actions
**File:** `dashboard/actions.ts`
- `getDashboardData()`, `getNotifications()`
- `markNotificationRead()`, `clearAllNotifications()`

### Settings Actions
**File:** `settings/actions.ts`
- `getSettingsAction()`, `saveProfileAction()`, `saveAISettingsAction()`
- `deleteAccountAction()`, `getKnowledgeBaseDocumentsAction()`

### Search Actions
**File:** `search/actions.ts`
- `searchAllData()` - Cross-domain search

### Unbilled Actions
**File:** `unbilled/actions.ts`
- Scratchpad item management

## Validation Schemas
**File:** `src/lib/validations/auth.ts`
- Zod schemas for auth forms

**File:** `src/lib/onboarding/schema.ts`
- Onboarding survey validation

## Related Notes
- [[Architecture Overview]]
- [[Database & Supabase]]
- [[Security Layer]]
