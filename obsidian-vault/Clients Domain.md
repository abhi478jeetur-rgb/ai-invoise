---
tags: [domain, clients, core]
created: 2026-05-31
---

# Clients Domain

## Overview
Client management with relationship to invoices. Each client can have multiple invoices.

## Pages
| Page | Path | Purpose |
|------|------|---------|
| Client List | `/clients` | All clients with search |
| Client Detail | `/clients/[clientId]` | Single client with invoice history |

## Server Actions
**File:** `src/lib/clients/actions.ts`

| Function | Purpose |
|----------|---------|
| `createClient()` | Create new client |
| `updateClientAction()` | Update client details |
| `deleteClientAction()` | Soft delete client |
| `getClientsAction()` | List all clients |
| `getClientDetailAction()` | Get single client with invoices |

## Components
**File:** `src/components/clients/client-form.tsx`
- `ClientForm()` - Create/edit form
- Client name, email, phone, address
- Currency preference

## Data Model
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  currency?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

## Cascade Behavior
- Soft delete preserves invoice relationships
- Hard delete cascades to invoices
- Restore from trash restores timestamps

## Related Notes
- [[Architecture Overview]]
- [[Invoices Domain]]
- [[Clients Components]]
