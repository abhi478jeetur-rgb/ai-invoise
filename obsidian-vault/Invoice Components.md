---
tags: [components, invoices]
created: 2026-05-31
---

# Invoice Components

## Overview
Invoice-specific form and display components.

## Location
`src/components/invoices/`

## Components

### InvoiceForm
**File:** `invoice-form.tsx`
- Create/edit invoice form
- Client selection dropdown
- Line items (description, quantity, unit price)
- Payment terms selector
- Currency selector
- Due date picker
- PO number field

## Form Fields
| Field | Type | Validation |
|-------|------|-----------|
| Client | Select | Required |
| Invoice Number | Text | Auto-generated |
| Due Date | Date | Required |
| Payment Terms | Select | `PAYMENT_TERMS` |
| Currency | Select | `ALLOWED_CURRENCIES` |
| PO Number | Text | Length validation |
| Line Items | Array | Min 1 item |

## Related Notes
- [[Invoices Domain]]
- [[Clients Domain]]
- [[UI Components]]
