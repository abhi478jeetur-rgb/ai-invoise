# api-contractor.md

## Purpose
This document defines the minimum API contracts for ChaseFree AI V1.

Goals:
- keep frontend and backend aligned
- keep payloads predictable
- support Supabase auth
- support OpenAI-compatible AI generation
- avoid overbuilding

Use JSON for all request and response bodies.

---

## General Rules

### Auth
All protected routes require an authenticated user.

Use server-side verified user identity for authorization. Do not trust client-passed user IDs.

### Response Shape
Use a consistent shape where practical:

Successful response:
```json
{
  "success": true,
  "data": {}
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Common Status Codes
- `200` success
- `201` created
- `400` invalid input
- `401` unauthenticated
- `403` forbidden
- `404` not found
- `409` conflict
- `422` validation failure
- `500` internal error

---

## Auth Contracts

### GET `/api/auth/me`
Returns the current authenticated user profile.

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "profile": {
      "full_name": "Abhijeet",
      "default_currency": "USD"
    }
  }
}
```

---

## Dashboard Contracts

### GET `/api/dashboard/summary`
Returns top-level dashboard metrics.

#### Response
```json
{
  "success": true,
  "data": {
    "total_unpaid_amount": 5400,
    "overdue_amount": 3200,
    "due_this_week_count": 4,
    "clients_to_chase_today_count": 3,
    "recent_reminder_count": 5,
    "currency": "USD"
  }
}
```

### GET `/api/dashboard/chase-today`
Returns prioritized invoices that need follow-up.

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "invoice_id": "uuid",
        "client_id": "uuid",
        "client_name": "Acme Studio",
        "invoice_number": "INV-1024",
        "title": "Website redesign milestone 2",
        "amount": 1200,
        "currency": "USD",
        "due_date": "2026-05-10",
        "status": "overdue",
        "urgency_bucket": "overdue_8_14",
        "days_overdue": 8,
        "reminder_count": 2,
        "last_reminder_at": "2026-05-14T09:00:00Z"
      }
    ]
  }
}
```

---

## Client Contracts

### GET `/api/clients`
List clients.

#### Query Params
- `search` optional
- `page` optional
- `limit` optional

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "client_name": "Acme Studio",
        "contact_name": "Riya",
        "email": "riya@acme.com",
        "company_name": "Acme Studio",
        "created_at": "2026-05-01T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### POST `/api/clients`
Create client.

#### Request
```json
{
  "client_name": "Acme Studio",
  "contact_name": "Riya",
  "email": "riya@acme.com",
  "phone": "+91xxxxxxxxxx",
  "company_name": "Acme Studio",
  "notes": "Long-term client"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

### GET `/api/clients/:clientId`
Get one client with linked invoice summary.

### PATCH `/api/clients/:clientId`
Update client.

### DELETE `/api/clients/:clientId`
Delete client if allowed.

---

## Invoice Contracts

### GET `/api/invoices`
List invoices.

#### Query Params
- `search`
- `status`
- `client_id`
- `sort_by` (`due_date`, `created_at`, `amount`)
- `sort_order` (`asc`, `desc`)
- `page`
- `limit`

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "client_id": "uuid",
        "client_name": "Acme Studio",
        "invoice_number": "INV-1024",
        "title": "Website redesign milestone 2",
        "amount": 1200,
        "currency": "USD",
        "issue_date": "2026-05-01",
        "due_date": "2026-05-10",
        "status": "overdue",
        "days_overdue": 8,
        "reminder_count": 2,
        "last_reminder_at": "2026-05-14T09:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### POST `/api/invoices`
Create invoice.

#### Request
```json
{
  "client_id": "uuid",
  "invoice_number": "INV-1024",
  "title": "Website redesign milestone 2",
  "description": "Second milestone payment",
  "issue_date": "2026-05-01",
  "due_date": "2026-05-10",
  "amount": 1200,
  "currency": "USD",
  "status": "sent",
  "payment_link": "https://example.com/pay/inv-1024",
  "notes": "Net 10"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

### GET `/api/invoices/:invoiceId`
Get invoice detail.

#### Response
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "uuid",
      "invoice_number": "INV-1024",
      "title": "Website redesign milestone 2",
      "amount": 1200,
      "currency": "USD",
      "issue_date": "2026-05-01",
      "due_date": "2026-05-10",
      "status": "overdue",
      "days_overdue": 8,
      "payment_link": "https://example.com/pay/inv-1024",
      "notes": "Net 10",
      "reminder_count": 2,
      "last_reminder_at": "2026-05-14T09:00:00Z"
    },
    "client": {
      "id": "uuid",
      "client_name": "Acme Studio",
      "contact_name": "Riya",
      "email": "riya@acme.com"
    }
  }
}
```

### PATCH `/api/invoices/:invoiceId`
Update invoice.

### DELETE `/api/invoices/:invoiceId`
Delete invoice.

### POST `/api/invoices/:invoiceId/mark-paid`
Marks invoice as paid.

#### Request
```json
{
  "paid_at": "2026-05-18T10:00:00Z"
}
```

---

## Invoice Import Contracts

### POST `/api/invoices/import`
Imports CSV-parsed records.

#### Request
```json
{
  "rows": [
    {
      "client_name": "Acme Studio",
      "email": "riya@acme.com",
      "invoice_number": "INV-1024",
      "title": "Website redesign milestone 2",
      "amount": 1200,
      "currency": "USD",
      "issue_date": "2026-05-01",
      "due_date": "2026-05-10",
      "status": "sent"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "imported_count": 1,
    "failed_count": 0,
    "errors": []
  }
}
```

---

## Reminder Draft Contracts

### GET `/api/invoices/:invoiceId/reminders`
Returns reminder history for one invoice.

#### Response
```json
{
  "success": true,
  "data": {
    "drafts": [
      {
        "id": "uuid",
        "tone": "professional",
        "subject": "Follow-up on Invoice INV-1024",
        "body": "Hi Riya, ...",
        "short_follow_up": "Hi Riya, following up on INV-1024.",
        "was_copied": true,
        "was_marked_sent": false,
        "created_at": "2026-05-14T09:00:00Z"
      }
    ]
  }
}
```

### POST `/api/ai/reminders/generate`
Generate AI reminder drafts.

#### Request
```json
{
  "invoice_id": "uuid",
  "selected_tone": "professional",
  "user_instruction": "Keep it short and polite"
}
```

#### Server Responsibilities
The server must:
- verify user auth
- verify invoice ownership
- fetch invoice
- fetch client
- fetch recent reminder history
- fetch AI settings
- build prompt context
- call OpenAI-compatible provider
- validate structured output
- save drafts
- save reminder event

#### Response
```json
{
  "success": true,
  "data": {
    "tone_used": "professional",
    "reasoning_summary": "Invoice is overdue and has prior follow-up history, so the tone is direct but still professional.",
    "drafts": [
      {
        "id": "uuid",
        "label": "Option 1",
        "subject": "Follow-up on Invoice INV-1024",
        "body": "Hi Riya,\n\nI wanted to follow up on Invoice INV-1024, which was due on May 10. Please let me know the expected payment timeline.\n\nBest,\n[Your Name]",
        "short_follow_up": "Hi Riya, following up on Invoice INV-1024. Please share the payment timeline."
      },
      {
        "id": "uuid",
        "label": "Option 2",
        "subject": "Payment update for Invoice INV-1024",
        "body": "Hi Riya,\n\nJust checking in regarding Invoice INV-1024. Please let me know when payment is expected.\n\nThanks,\n[Your Name]",
        "short_follow_up": "Hi Riya, could you share an update on Invoice INV-1024?"
      }
    ]
  }
}
```

### POST `/api/reminders/:draftId/copied`
Mark draft copied.

#### Response
```json
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

### POST `/api/reminders/:draftId/mark-sent`
Mark draft as manually sent.

#### Response
```json
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

---

## AI Settings Contracts

### GET `/api/settings/ai`
Returns current AI provider settings excluding unsafe exposure where needed.

#### Response
```json
{
  "success": true,
  "data": {
    "provider_label": "openai-compatible",
    "base_url": "https://example-provider.com/v1",
    "model_name": "model-name",
    "temperature": 0.4,
    "is_active": true,
    "has_api_key": true
  }
}
```

### PUT `/api/settings/ai`
Create or update AI settings.

#### Request
```json
{
  "provider_label": "openai-compatible",
  "base_url": "https://example-provider.com/v1",
  "model_name": "model-name",
  "api_key": "secret-key",
  "temperature": 0.4,
  "is_active": true
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "saved": true
  }
}
```

### POST `/api/settings/ai/test`
Tests whether provider config works.

#### Request
```json
{
  "provider_label": "openai-compatible",
  "base_url": "https://example-provider.com/v1",
  "model_name": "model-name",
  "api_key": "secret-key"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "connected": true,
    "model_name": "model-name"
  }
}
```

---

## Validation Rules

### Clients
- `client_name` required

### Invoices
- `client_id` required
- `invoice_number` required
- `title` required
- `issue_date` required
- `due_date` required
- `amount` required and `>= 0`

### AI Reminder Generation
- `invoice_id` required
- `selected_tone` required
- allowed tones: `friendly`, `professional`, `firm`, `final_notice`

### AI Settings
- `provider_label` required
- `base_url` required
- `model_name` required
- `api_key` required on create or replace

---

## Error Codes

### Generic
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

### Invoice
- `INVOICE_NOT_FOUND`
- `CLIENT_NOT_FOUND`
- `INVALID_INVOICE_STATUS`
- `DUPLICATE_INVOICE_NUMBER`

### AI
- `AI_SETTINGS_MISSING`
- `AI_PROVIDER_UNAVAILABLE`
- `AI_TIMEOUT`
- `AI_INVALID_RESPONSE`
- `AI_OUTPUT_VALIDATION_FAILED`

---

## Security Rules
- Never trust client-passed `user_id`
- Always derive auth user on server
- Always verify invoice belongs to current user
- Always verify client belongs to current user
- Never expose stored API key raw in normal GET settings response
- Run AI generation only on trusted server-side path

---

## Internal Type Hints

```ts
type ApiSuccess<T> = {
  success: true
  data: T
}

type ApiError = {
  success: false
  error: {
    code: string
    message: string
  }
}
```

```ts
type SelectedTone = "friendly" | "professional" | "firm" | "final_notice"
```

---

## Minimal Build Rule
For V1, implement only these route groups:
- auth
- dashboard
- clients
- invoices
- reminders
- settings/ai

Do not add:
- teams
- orgs
- billing
- subscriptions
- email sync inbox
- automation workflows
- webhooks unless clearly needed

---

## Final Agent Instruction
Implement these API contracts as the minimum stable backend interface for ChaseFree AI V1.

Requirements:
- JSON in/out
- server-side auth checks
- strict ownership validation
- predictable error shape
- OpenAI-compatible AI generation endpoint
- no unnecessary endpoints
- no V2 complexity