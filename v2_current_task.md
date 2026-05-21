# Current Task: Version 2 - Auto-Generate Invoice Numbers

**Status:** Complete

## Context
When creating a new invoice, users shouldn't have to guess or manually type the next invoice number (e.g., INV-001). We need a Server Action that fetches the user's latest invoice number, increments it, and auto-fills the `InvoiceForm`.

## Strict Checklist for Open Claude

### 1. Create Server Action (`src/lib/invoices/actions.ts`)
- [x] Export an async function `getNextInvoiceNumberAction()`.
- [x] Query the `invoices` table for the authenticated user, ordered by `created_at` DESC (limit 1).
- [x] If no invoices exist, return `"INV-001"`.
- [x] If an invoice exists (e.g., `"INV-005"`), parse the number, increment by 1, and return `"INV-006"`.
- [x] If the parsing fails (user manually typed "XYZ-PROJ"), default fallback to `"INV-001"`.

### 2. Implement in Frontend (`src/components/invoices/invoice-form.tsx`)
- [x] In the `InvoiceForm` component, use a `useEffect` (or fetch server-side and pass as a prop) to load `getNextInvoiceNumberAction()`.
- [x] Only auto-fill if the form is in "create" mode (meaning no `invoice.id` exists yet). If editing an existing invoice, keep the existing number.
- [x] When the next number is fetched, set it to the `invoice_number` input field automatically.
- [x] Ensure the field remains editable so the user can override it if they want.

### 3. Version Control
- [x] Run `git add .`
- [x] Run `git commit -m "feat(v2): auto-generate sequential invoice numbers for new invoices"`

**Note for Open Claude:** Do not rebuild the whole invoice form. Only inject the logic to auto-fill the `invoice_number` field. Check [x] as you complete each step.
