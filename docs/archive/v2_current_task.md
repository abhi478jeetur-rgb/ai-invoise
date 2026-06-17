# Current Task: Version 2 - Feature 10 (Advanced Invoice Statuses)

**Status:** Not Started

## Context
Currently, if a client promises to pay an invoice, it still looks 'Overdue' in the system. We want to give users more granular control over invoice statuses, specifically allowing them to mark an invoice as "Promised to Pay" (promised), "Paused" (paused), or "Partial Payment" (partial).

## Objective
Update the invoice status system to support the new advanced statuses: `promised`, `paused`, and `partial`. 
Additionally, add support for tracking `amount_paid` for partial payments.

## Database Changes Required (Supabase)
We need to update the `invoice_status` ENUM and add a new column to the `invoices` table.
Since updating an ENUM in Postgres directly can be tricky, please provide the exact SQL snippet to run in Supabase.
SQL should do:
- `ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'promised';`
- `ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'paused';`
- `ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'partial';`
- `ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid numeric default 0;`

## Strict Checklist for Open Claude

### 1. Database Schema & Types
- [ ] Write a SQL migration file (e.g. `supabase-migration-advanced-statuses.sql`) containing the `ALTER TYPE` and `ALTER TABLE` commands mentioned above.
- [ ] Update the application types (e.g., in `schema.ts`, database types, or Zod schemas) where `invoice_status` is defined to include `'promised'`, `'paused'`, and `'partial'`.
- [ ] Update `supabase-schema.sql` locally to reflect these additions for future setups.

### 2. UI Updates (Invoice Details / Status Change)
- [ ] In the Invoice page/details UI, allow the user to manually change the status to `promised`, `paused`, or `partial` via a Dropdown or action buttons.
- [ ] If `partial` is selected, provide a way for the user to enter/save the `amount_paid`.
- [ ] Ensure the Server Action responsible for updating invoices handles `amount_paid` and the new statuses correctly.

### 3. Styling and Badge Colors
- [ ] Update the Invoice Status badge component to support the new statuses with distinct, premium colors (e.g. 'promised' -> blue/indigo, 'paused' -> gray/slate, 'partial' -> orange/amber).

### 4. Final Reporting
- [ ] Update this file (`v2_current_task.md`) to mark checkboxes as `[x]` as you complete them.
- [ ] Provide the SQL snippet to the user to run in their Supabase SQL editor at the end.
- [ ] Wait for user validation.
