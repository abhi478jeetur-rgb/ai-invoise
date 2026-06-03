---
tags: [domain, invoices, core]
created: 2026-05-31
---

# Invoices Domain

## Overview
Core domain for invoice management with full lifecycle support.

## Status Lifecycle
```
draft → sent → viewed → partial → paid
                  ↘ overdue → paid
```

| Status | Label | Style |
|--------|-------|-------|
| `draft` | Draft | Gray |
| `sent` | Sent | Blue |
| `viewed` | Viewed | Purple |
| `partial` | Partial | Yellow |
| `overdue` | Overdue | Red |
| `paid` | Paid | Green |

## Pages
| Page | Path | Purpose |
|------|------|---------|
| Invoice List | `/invoices` | All invoices with filters |
| Invoice Detail | `/invoices/[invoiceId]` | Single invoice view |
| Smart Builder | `/invoices/new` | Create/edit invoice |

## Server Actions
**File:** `src/lib/invoices/actions.ts`

| Function | Purpose |
|----------|---------|
| `createInvoiceAction()` | Create new invoice |
| `updateInvoiceAction()` | Update existing invoice |
| `deleteInvoiceAction()` | Soft delete invoice |
| `hardDeleteInvoiceAction()` | Permanent delete |
| `getInvoiceDetailAction()` | Get single invoice |
| `getInvoicesAction()` | List all invoices |
| `getNextInvoiceNumberAction()` | Auto-increment invoice # |
| `markInvoicePaidAction()` | Mark invoice as paid |

## Components
**File:** `src/components/invoices/invoice-form.tsx`
- `InvoiceForm()` - Main form component
- Client selection dropdown
- Line items with quantity/price
- Payment terms selector
- Currency selector (`ALLOWED_CURRENCIES`)

## PDF Generation
**File:** `src/app/api/invoices/[id]/pdf/route.ts`
- Server-side PDF rendering
- `invoice-pdf-document.tsx` - PDF template

## Validation
- `PAYMENT_TERMS` - Allowed payment term values
- `CURRENCIES` - Allowed currency codes
- PO number length validation
- Status transition enforcement

## Related Notes
- [[Architecture Overview]]
- [[Clients Domain]]
- [[Reminders Domain]]
- [[Invoice Components]]
