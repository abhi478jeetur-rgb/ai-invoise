# Frontend Architecture.md

## Document Purpose
This document defines the frontend architecture for ChaseFree AI V1.

The architecture must be:
- minimal
- modular
- easy to maintain
- easy to expand later
- low-confusion for agents
- bug-resistant
- strongly aligned with the V1 product scope

This is a V1-only architecture.

Do not introduce extra modules, pages, abstractions, or advanced systems unless they are required by V1.

---

## Core Frontend Goal
Build a clean, stable, scalable V1 frontend for ChaseFree AI using:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- OpenAI-compatible provider configuration

The frontend must primarily support:
- auth
- dashboard
- clients
- invoices
- reminder generation
- CSV import
- settings

Nothing else should be treated as core V1.

---

## V1 Architecture Philosophy

### 1. Keep the Surface Area Small
Only build the routes, components, and states that are necessary for V1.

A smaller system is easier to:
- reason about
- test
- style consistently
- keep bug-free
- improve later

### 2. Separate Shared UI from Feature Logic
Do not mix generic UI primitives with product-specific business components.

Use:
- shared UI primitives for buttons, inputs, cards, dialog, table wrappers
- feature-specific components for invoices, reminders, clients, dashboard blocks

### 3. Prefer Feature Folders for Product Logic
Shared UI can live centrally, but invoice logic should stay near invoice features, client logic near client features, and reminder logic near reminder flows.

### 4. Route Around Real User Workflows
Architecture should mirror the user’s actual usage:
- sign in
- see dashboard
- review invoices
- check who to chase
- open invoice
- generate reminder
- manage settings

### 5. Avoid Premature Complexity
Do NOT add:
- global state libraries unless truly needed
- event buses
- over-abstracted service layers in the frontend
- generic “entity engines”
- plugin systems
- enterprise layout systems
- multiple dashboard versions
- advanced design token engines beyond what is needed

---

## Recommended Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase database-backed data access through server/client helpers
- TanStack Table through shadcn data table approach
- React Hook Form for forms if needed
- Zod for validation if needed

---

## High-Level App Structure

Use route groups to separate:
- public/auth routes
- protected app routes

Recommended top-level structure:

```txt
src/
  app/
    (auth)/
    (app)/
    api/
    globals.css
    layout.tsx
  components/
  features/
  lib/
  hooks/
  types/
  config/
```

This keeps routing clear and avoids mixing auth/public/app concerns.

---

## Route Structure for V1

### Public/Auth Routes
```txt
src/app/(auth)/
  sign-in/page.tsx
  sign-up/page.tsx
  reset-password/page.tsx        # optional if implemented in V1
  layout.tsx
```

### Protected App Routes
```txt
src/app/(app)/
  layout.tsx
  dashboard/page.tsx
  clients/page.tsx
  clients/[clientId]/page.tsx
  invoices/page.tsx
  invoices/[invoiceId]/page.tsx
  import/page.tsx
  settings/page.tsx
```

### Optional Internal Route
If reminder generation needs a dedicated route:
```txt
src/app/(app)/invoices/[invoiceId]/generate/page.tsx
```

But for V1, prefer reminder generation as a dialog/drawer from invoice detail or dashboard to keep flows simpler.

---

## Routes That Should NOT Exist in V1
Do NOT create these routes:
- /crm
- /pipeline
- /analytics
- /reports
- /billing
- /payments
- /tax
- /projects
- /team
- /workspace
- /contracts
- /tasks
- /mailbox
- /reconciliation
- /integrations-center

These are outside the V1 scope.

---

## Layout Architecture

### Root Layout
`src/app/layout.tsx`

Responsibilities:
- import global styles
- mount app-wide providers
- set theme provider
- render children

Keep this minimal.

### Auth Layout
`src/app/(auth)/layout.tsx`

Responsibilities:
- simple centered auth shell
- no app sidebar
- no heavy navigation
- minimal branding

### App Layout
`src/app/(app)/layout.tsx`

Responsibilities:
- protect authenticated routes
- render sidebar
- render top bar
- render page content shell
- handle responsive navigation
- provide consistent page spacing

This is the main operational shell for the product.

---

## Recommended Directory Structure

```txt
src/
  app/
    (auth)/
      layout.tsx
      sign-in/page.tsx
      sign-up/page.tsx
      reset-password/page.tsx
    (app)/
      layout.tsx
      dashboard/page.tsx
      clients/page.tsx
      clients/[clientId]/page.tsx
      invoices/page.tsx
      invoices/[invoiceId]/page.tsx
      import/page.tsx
      settings/page.tsx
    api/
      ai/
        generate-reminder/route.ts
    globals.css

  components/
    layout/
      app-sidebar.tsx
      app-header.tsx
      app-shell.tsx
      page-container.tsx
      theme-toggle.tsx
      user-menu.tsx

    ui/
      # shadcn-based primitives and wrappers
      button.tsx
      card.tsx
      input.tsx
      textarea.tsx
      badge.tsx
      dialog.tsx
      sheet.tsx
      dropdown-menu.tsx
      table.tsx
      tabs.tsx
      select.tsx
      skeleton.tsx
      form.tsx

    shared/
      empty-state.tsx
      loading-state.tsx
      error-state.tsx
      search-input.tsx
      status-badge.tsx
      urgency-badge.tsx
      page-header.tsx
      stat-card.tsx
      confirm-dialog.tsx
      data-table/

  features/
    auth/
      components/
      lib/
      types.ts

    dashboard/
      components/
        dashboard-summary.tsx
        chase-today-list.tsx
        recent-invoices.tsx
        recent-reminder-activity.tsx
      lib/
      types.ts

    clients/
      components/
        clients-table.tsx
        client-form.tsx
        client-detail-header.tsx
        client-invoices-list.tsx
      lib/
      types.ts

    invoices/
      components/
        invoices-table.tsx
        invoice-form.tsx
        invoice-detail-header.tsx
        invoice-status-badge.tsx
        invoice-urgency-badge.tsx
        invoice-timeline.tsx
      lib/
      types.ts

    reminders/
      components/
        reminder-generator-dialog.tsx
        reminder-tone-selector.tsx
        reminder-draft-card.tsx
        reminder-history-list.tsx
      lib/
      types.ts

    import/
      components/
        csv-upload-dropzone.tsx
        csv-preview-table.tsx
        import-summary.tsx
      lib/
      types.ts

    settings/
      components/
        profile-settings-form.tsx
        ai-provider-settings-form.tsx
        preferences-settings-form.tsx
      lib/
      types.ts

  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    ai/
      provider-config.ts
      generate-reminder.ts
    utils/
      cn.ts
      dates.ts
      currency.ts
      invoice-status.ts
      reminder-priority.ts

  hooks/
    use-theme.ts
    use-mobile.ts
    use-debounce.ts

  types/
    database.ts
    invoice.ts
    client.ts
    reminder.ts

  config/
    nav.ts
    app.ts
```

---

## Folder Responsibilities

### `app/`
Contains route definitions and layouts.

Do not place heavy business logic here.

Pages should orchestrate feature components, not implement all details directly.

### `components/ui/`
Contains shadcn/ui primitives or lightly wrapped primitives.

These are generic building blocks.

They should not contain invoice-specific business logic.

### `components/shared/`
Contains reusable app-level components used across multiple features.

Examples:
- PageHeader
- EmptyState
- ErrorState
- StatusBadge
- UrgencyBadge
- StatCard

### `features/`
Contains feature-specific UI and logic.

This is where V1 product logic should mostly live.

Each feature can contain:
- components
- lib
- local helper functions
- feature-specific types

### `lib/`
Contains app-wide utility and infrastructure logic.

Examples:
- Supabase clients
- AI API helpers
- date formatting
- status derivation
- currency utilities

### `types/`
Contains shared domain types.

---

## Page Responsibilities

### `/sign-in`
Purpose:
- authenticate user
- redirect to dashboard after success

Keep it simple.

### `/sign-up`
Purpose:
- create account
- begin onboarding or redirect to dashboard

### `/dashboard`
Purpose:
Main command center.

Must show:
- summary cards
- who to chase today
- recent invoices
- recent reminder activity

This should be the most important page in V1.

### `/clients`
Purpose:
List, search, and add clients.

### `/clients/[clientId]`
Purpose:
Show one client and associated invoices.

Must include:
- client summary
- contact details
- related invoices
- quick invoice action

### `/invoices`
Purpose:
Main invoice management table.

Must support:
- search
- filter
- sort
- create invoice
- import invoices
- status visibility

### `/invoices/[invoiceId]`
Purpose:
Invoice detail and reminder workflow anchor.

Must include:
- invoice summary
- status and urgency
- client context
- reminder history
- generate reminder entry point

### `/import`
Purpose:
CSV upload and validation flow.

### `/settings`
Purpose:
Profile and AI provider configuration.

Must include:
- profile basics
- default currency
- AI base URL
- API key
- model
- provider label

---

## Feature Boundaries

### Auth Feature
Owns:
- sign-in form
- sign-up form
- auth helpers
- session-aware redirects

Auth feature should not own app layout logic.

### Dashboard Feature
Owns:
- summary card rendering
- chase-today list
- recent invoice activity
- recent reminder activity

Dashboard should not implement invoice CRUD itself.

### Clients Feature
Owns:
- clients list
- client forms
- client detail blocks

### Invoices Feature
Owns:
- invoices table
- invoice forms
- invoice detail
- status logic presentation
- urgency display

### Reminders Feature
Owns:
- tone selector
- reminder dialog/drawer
- generated draft cards
- reminder history display

This feature should not own invoice list pages.

### Import Feature
Owns:
- file upload UI
- preview and validation UI
- import summary feedback

### Settings Feature
Owns:
- user settings forms
- AI provider configuration UI
- preference forms

---

## Data Flow Guidance

### General Rule
Prefer server-first data loading where appropriate, then pass typed data to feature components.

Do not fetch the same data repeatedly across nested components unless necessary.

### Suggested Pattern
- page fetches initial data
- page passes typed props into feature components
- local UI state stays inside feature components
- mutations happen through actions or route handlers
- revalidation/update is scoped cleanly

### Avoid
- excessive client-side global data stores
- duplicate loading logic in many components
- mixed server/client responsibility without reason

---

## Supabase Integration Guidance

### Auth Protection
Protected routes must be gated at the app layout / middleware level.

Unauthenticated users should never access app routes.

### Data Ownership
Every client, invoice, and reminder record is user-scoped.

Frontend should always assume user isolation.

### Supabase Helpers
Keep Supabase setup centralized:
- browser client helper
- server client helper
- route or middleware auth utilities

Do not initialize Supabase separately inside random components.

---

## AI Integration Architecture

### Goal
Keep AI provider integration replaceable.

### Frontend Rule
The frontend should not directly hardcode provider-specific logic in UI components.

Instead:
- settings page stores provider config
- reminder generation UI submits structured input
- a server route/action handles AI generation
- returned drafts are shown in the reminder UI

### Minimal V1 Flow
1. User opens reminder generator
2. User selects tone
3. UI sends structured payload
4. API route returns 2 to 3 draft variants
5. UI displays drafts
6. User copies one
7. Draft generation history is saved

---

## Recommended Shared Domain Types

### Client
```ts
type Client = {
  id: string
  clientName: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  companyName?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}
```

### Invoice
```ts
type InvoiceStatus =
  | "draft"
  | "sent"
  | "due_soon"
  | "overdue"
  | "paid"
  | "archived"

type Invoice = {
  id: string
  clientId: string
  invoiceNumber: string
  title: string
  issueDate: string
  dueDate: string
  amount: number
  currency: string
  status: InvoiceStatus
  paymentLink?: string | null
  notes?: string | null
  reminderCount: number
  lastReminderAt?: string | null
  createdAt: string
  updatedAt: string
}
```

### Reminder Draft
```ts
type ReminderTone =
  | "friendly"
  | "professional"
  | "firm"
  | "final_notice"

type ReminderDraft = {
  id: string
  invoiceId: string
  tone: ReminderTone
  subject: string
  body: string
  shortVersion?: string | null
  provider: string
  model: string
  wasCopied: boolean
  wasMarkedSent: boolean
  createdAt: string
}
```

---

## Component Architecture

### Shared Layout Components
Must exist:
- `AppShell`
- `AppSidebar`
- `AppHeader`
- `PageContainer`
- `ThemeToggle`
- `UserMenu`

These provide structural consistency across all app pages.

### Shared Feedback Components
Must exist:
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `ConfirmDialog`

### Shared Data Display Components
Must exist:
- `StatusBadge`
- `UrgencyBadge`
- `StatCard`
- `PageHeader`

### Feature-Specific Components
Examples:
- `InvoicesTable`
- `ClientForm`
- `ChaseTodayList`
- `ReminderDraftCard`
- `ReminderToneSelector`
- `CsvPreviewTable`

---

## Data Table Architecture

Use shadcn + TanStack Table style patterns for:
- invoices table
- clients table
- CSV preview table

### Table Responsibilities
Each data table feature should define:
- columns
- row actions
- filters
- sorting behavior
- empty state
- loading state

### Suggested Structure
```txt
features/invoices/components/
  invoices-table.tsx
  invoice-columns.tsx
  invoice-row-actions.tsx
```

```txt
features/clients/components/
  clients-table.tsx
  client-columns.tsx
  client-row-actions.tsx
```

### Rules
Do not build one giant generic mega-table component for all entities.

Use a shared table foundation, but keep column and row logic feature-specific.

---

## Form Architecture

### Pattern
For each feature form:
- schema
- default values
- form component
- submit handler
- loading state
- error state

### V1 Forms
Must exist:
- Sign in form
- Sign up form
- Client form
- Invoice form
- AI provider settings form

Optional:
- Preferences form

### Rules
Do not create a giant central form engine.

Keep forms local to their features.

---

## Modal / Drawer Architecture

Use modals or sheets for:
- add client
- add invoice
- generate reminder
- confirm destructive actions

Prefer these over adding many extra routes.

### Rule
If the task is quick and contextual, use a dialog or sheet.
If the task is deep and multi-step, use a full page.

For V1:
- add client = dialog or sheet
- add invoice = dialog, sheet, or focused page
- generate reminder = dialog or sheet
- CSV import = page
- settings = page

---

## Loading, Empty, and Error States

### Every Major Feature Must Have
- loading skeleton
- empty state
- error state

### Required Skeletons
- dashboard summary skeleton
- chase-today skeleton
- invoices table skeleton
- clients table skeleton
- invoice detail skeleton
- reminder generation skeleton
- settings form skeleton
- CSV import preview skeleton

### Required Empty States
- no clients
- no invoices
- no overdue invoices
- no chase items
- no reminder history
- no import rows
- no search results

### Required Error States
- AI generation failed
- CSV parsing failed
- invoice save failed
- session expired
- page failed to load

---

## State Management Guidance

### Preferred V1 Approach
Use:
- server data loading for page data
- local component state for UI interactions
- URL search params for filters/search where useful

### Avoid in V1
- Redux
- Zustand unless absolutely needed
- global mutation orchestration
- complex caching layers
- optimistic updates everywhere

Keep state simple.

---

## Search and Filter Architecture

### Invoices Page
Support:
- search query
- status filter
- urgency filter
- sort by due date or amount if useful

### Clients Page
Support:
- search query
- simple filtering only if necessary

### Rule
Keep filters minimal in V1.

Do not create a complex multi-filter analytics experience.

---

## Theme Architecture

### Theme Requirement
Must support:
- dark mode
- light mode

### Theme Rules
- theme must apply consistently across sidebar, cards, tables, dialogs, inputs, and badges
- do not style each page independently
- use shared theme tokens and app-wide utility classes
- status colors must remain readable in both modes

### Suggested Location
- theme provider in root/app shell
- shared tokens in global CSS
- component variants use shared tokens

---

## Navigation Config

Keep navigation centralized.

Suggested config file:
```txt
src/config/nav.ts
```

This should define:
- label
- href
- icon
- auth-only visibility

This avoids hardcoding nav items in multiple places.

---

## API Boundary for Frontend

### Frontend Should Call Only What It Needs
For V1, the frontend mainly needs:
- auth/session helpers
- invoice CRUD endpoints/actions
- client CRUD endpoints/actions
- reminder generation endpoint/action
- CSV import endpoint/action
- settings save endpoint/action

Do not create unnecessary API layers for future fantasies.

---

## V1 Build Order
Build in this order:

### Phase 1
- app shell
- auth pages
- sidebar
- header
- theme system
- shared UI foundations

### Phase 2
- dashboard
- clients list
- invoices list
- data tables
- empty states
- loading states

### Phase 3
- client detail
- invoice detail
- invoice and client forms

### Phase 4
- reminder generator
- reminder history
- AI provider settings

### Phase 5
- CSV import
- final polish
- responsive QA
- bug fixes

---

## QA Rules for Architecture
The architecture is valid only if:
- V1 routes are few and clear
- no unnecessary modules exist
- shared UI is reusable
- business components stay feature-local
- auth and app routes are clearly separated
- every major page has loading, empty, and error states
- invoice and reminder flows feel connected
- agent can understand where to add future V2 features without rewriting V1

---

## Future Expansion Rules
V2 and later features should be addable without breaking the V1 structure.

Possible additions later:
- email integrations
- smart cadence automation
- reply-aware pause logic
- advanced analytics
- payment integrations
- richer client communication memory

These should be added as new feature folders or route extensions, not by bloating V1 components.

---

## Final Agent Instruction
Build the ChaseFree AI frontend architecture for V1 only.

Prioritize:
- small architecture
- clear route structure
- feature-based organization
- stable reusable UI
- app shell consistency
- strong invoice and reminder workflows
- minimal cognitive load
- future scalability without current overbuilding

Do not over-engineer.
Do not build future features now.
Do not add extra routes.
Do not create generic frameworks inside the app.

The V1 frontend should feel focused, maintainable, expandable, and hard to break.