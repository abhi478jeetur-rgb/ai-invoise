# Current Task: Version 2 - Inline Client Creation

**Status:** Not Started

## Context
Right now, if a user is creating an invoice and realizes they haven't added the client yet, they have to abandon the invoice, go to the Clients page, add the client, and come back. This is terrible UX.
We need to add a small "+ Add New Client" button directly inside the `InvoiceForm` that opens the `ClientForm` modal. When the client is created, it should automatically be selected in the invoice form.

## Strict Checklist for Open Claude

### 1. Update `ClientForm` (`src/components/clients/client-form.tsx`)
- [x] In `ClientFormProps`, update the `onSaved` type to accept the returned client: `onSaved?: (client?: any) => void`.
- [x] In the `handleSubmit` function of `ClientForm`, when `createClientAction` or `updateClientAction` succeeds, pass the `result.data` to `onSaved`. Example: `onSaved?.(result.data)`.

### 2. Update `InvoiceForm` (`src/components/invoices/invoice-form.tsx`)
- [x] Import `ClientForm` from `@/components/clients/client-form`.
- [x] Add a new state for the modal: `const [showClientModal, setShowClientModal] = useState(false)`.
- [x] Since `clients` is passed as a prop, we need local state to append newly created clients without refreshing the page. Add: `const [localClients, setLocalClients] = useState(clients)`. Update the `Select` dropdown to map over `localClients` instead of `clients`.
- [x] In the "Client" section, add a small, subtle button `+ Add New Client` aligned to the right of the Label. Clicking it sets `showClientModal` to true.
- [x] Render `<ClientForm>` at the bottom of the component (outside the `form` tags to avoid nested form submissions, but it can be inside the top-level Dialog wrapper or adjacent).
- [x] In `<ClientForm>`'s `onSaved` callback:
  1. Receive the `newClient`.
  2. If `newClient` exists, append it to `localClients`.
  3. Set `selectedClientId` to `newClient.id`.

### 3. Version Control
- [x] Run `git add .`
- [x] Run `git commit -m "feat(v2): add inline client creation to invoice form"`

**Note for Open Claude:** Make sure the "+ Add New Client" button looks clean and premium (e.g., `variant="link"` or `variant="ghost"`, small text, `text-neutral-400 hover:text-white`). Check [x] as you complete each step.
