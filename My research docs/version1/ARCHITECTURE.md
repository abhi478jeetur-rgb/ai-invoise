# ARCHITECTURE.md

## Purpose
This document defines the implementation architecture for ChaseFree AI.

The goal is to create a clean, stable, modular architecture for a focused AI-first invoicing and payment follow-up product.

This architecture must support:
- stable invoice workflows
- clear product boundaries
- secure user data ownership
- modular AI provider integration
- controlled feature growth
- safe phased development

This architecture must avoid:
- template sprawl
- monolithic business logic
- tangled UI/data coupling
- fake AI abstractions
- product drift into full accounting software

---

## Product Architecture Philosophy

### Primary principle
Build ChaseFree AI as a focused product, not as a patched starter template.

### Architectural priorities
1. correctness
2. simplicity
3. modularity
4. maintainability
5. product alignment
6. safe AI integration
7. real-world validation support

### What this architecture should feel like
- small enough to understand
- structured enough to scale
- strict enough to avoid chaos
- flexible enough to support future features

---

## Technical Foundation
Recommended stack:
- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- server-side AI integration through OpenAI-compatible provider abstraction

Use Next.js App Router with root and nested layouts, which supports modular page structure and separate data-fetching concerns.[web:116][web:119]

---

## Core Architectural Rules

### 1. Separate concerns clearly
The codebase must separate:
- UI rendering
- page composition
- domain/business logic
- data access
- AI provider access
- validation logic
- type definitions

Do not mix everything inside page files.

---

### 2. Product-first module structure
The architecture must follow product domains, not generic template leftovers.

Primary domains:
- auth
- clients
- invoices
- reminders
- dashboard
- settings
- ai providers

The code structure should reflect these domains clearly.

---

### 3. AI is a service layer, not the center of the app
AI is important, but invoice correctness and workflow logic come first.

The app must still have architectural integrity even if AI is temporarily unavailable.

Reminder generation should depend on:
- clean invoice data
- proper user ownership
- valid business context
- provider abstraction

AI should never be hardwired directly into UI components.

---

### 4. Secure by default
Every user-owned table must be protected with Row Level Security. Supabase recommends enabling RLS on exposed tables so users can access only rows allowed by policy.[web:64]  
Security must be part of the architecture, not a later patch.

---

## Recommended Folder Structure

```txt
src/
  app/
    (marketing)/
    (auth)/
      sign-in/
        page.tsx
      sign-up/
        page.tsx
      layout.tsx
    (dashboard)/
      layout.tsx
      dashboard/
        page.tsx
      invoices/
        page.tsx
        [invoiceId]/
          page.tsx
      clients/
        page.tsx
        [clientId]/
          page.tsx
      reminders/
        page.tsx
      settings/
        page.tsx

  components/
    ui/
      ...
    layout/
      app-shell.tsx
      topbar.tsx
      sidebar.tsx
      page-header.tsx
    dashboard/
      summary-card.tsx
      chase-today-list.tsx
      reminder-activity-list.tsx
      recent-invoices-table.tsx
    invoices/
      invoice-table.tsx
      invoice-status-badge.tsx
      invoice-form.tsx
      invoice-detail-header.tsx
      invoice-reminder-panel.tsx
    clients/
      client-table.tsx
      client-form.tsx
      client-summary.tsx
    reminders/
      tone-selector.tsx
      reminder-draft-card.tsx
      reminder-history-list.tsx
    shared/
      empty-state.tsx
      loading-state.tsx
      error-state.tsx
      amount-display.tsx
      date-display.tsx
      confirm-dialog.tsx

  lib/
    auth/
      get-session-user.ts
      require-user.ts
    db/
      server.ts
      client.ts
      queries/
        dashboard.ts
        invoices.ts
        clients.ts
        reminders.ts
      mutations/
        invoices.ts
        clients.ts
        reminders.ts
    ai/
      provider-registry.ts
      create-ai-client.ts
      generate-reminder-drafts.ts
      prompt-builders/
        reminder-prompt.ts
      types.ts
    domain/
      invoices/
        invoice-status.ts
        invoice-urgency.ts
        invoice-validation.ts
      reminders/
        reminder-tones.ts
        reminder-rules.ts
      dashboard/
        chase-priority.ts
      clients/
        client-validation.ts
    validations/
      invoice.ts
      client.ts
      settings.ts
    utils/
      dates.ts
      currency.ts
      strings.ts
      guards.ts

  types/
    db.ts
    invoice.ts
    client.ts
    reminder.ts
    dashboard.ts
    settings.ts
```

This structure keeps route composition, reusable components, DB access, domain logic, and AI integrations separate and easier to validate.[web:116][web:119]

---

## Route Architecture

### App Router strategy
Use route groups for high-level separation:
- `(auth)` for authentication flows
- `(dashboard)` for the logged-in product app
- `(marketing)` only if needed later

The main product should live inside the authenticated dashboard shell.

### Dashboard shell responsibilities
The dashboard layout should own:
- navigation
- sidebar/topbar
- theme consumption
- auth guard boundary
- stable app frame

It should not contain domain-specific business logic.

### Page responsibilities
Each page should primarily:
- load the required view data
- compose the screen
- delegate UI to components
- call server actions or service functions

Page files should not become giant business-logic containers.

---

## Domain Modules

### 1. Auth Domain
Responsibilities:
- sign in
- sign up
- session checks
- protected route enforcement
- current user resolution

Rules:
- auth logic should stay in `lib/auth`
- dashboard routes must require authenticated user access
- user identity must flow into all user-owned queries and mutations

---

### 2. Clients Domain
Responsibilities:
- client creation
- client updates
- client listing
- client detail retrieval
- client ownership validation

Clients are simple relationship objects.

This domain must not drift into CRM complexity.

Allowed fields:
- client name
- contact info
- notes
- optional relationship context

Not allowed:
- sales stages
- lead scoring
- pipeline flows
- account management bloat

---

### 3. Invoices Domain
Responsibilities:
- create invoice
- update invoice
- list invoices
- filter and sort invoices
- derive status and urgency
- invoice detail display
- payment follow-up readiness

This is one of the core product domains.

Invoice domain logic must be centralized and consistent.

Important logic includes:
- due date handling
- overdue calculation
- status derivation
- payment state correctness
- last reminder metadata
- reminder count integrity

Do not duplicate invoice status logic across multiple UI components.

Create a central invoice status and urgency logic layer inside `lib/domain/invoices`.

---

### 4. Reminders Domain
Responsibilities:
- reminder draft generation
- reminder event history
- reminder display
- reminder tone selection
- reminder handling state

This domain should connect invoice context and AI service output.

It should not contain raw provider implementation details inside UI components.

Separate:
- reminder domain logic
- AI provider communication
- prompt construction
- reminder history persistence

---

### 5. Dashboard Domain
Responsibilities:
- summary metrics
- “Who to Chase Today”
- recent invoice activity
- recent reminder activity

This is a read-heavy composition domain.

It should aggregate from invoices and reminders, but not redefine invoice logic.

The dashboard should consume already-correct domain logic such as:
- overdue calculations
- chase priority
- reminder recency
- unpaid totals

---

### 6. Settings Domain
Responsibilities:
- profile settings
- default currency
- provider configuration
- AI model configuration
- optional product preferences

Settings must stay narrow.

Do not build a giant configuration center in V1.

---

## Data Layer Architecture

### Principle
The data layer must be explicit and modular.

Separate:
- read queries
- write mutations
- domain derivation logic
- validation logic

Recommended structure:
- `lib/db/queries/*` for read operations
- `lib/db/mutations/*` for write operations
- `lib/domain/*` for non-trivial business rules
- `lib/validations/*` for input validation

This reduces hidden coupling and makes phased testing easier.

---

## Database Design Principles

### General database rules
- every row must belong clearly to a user where relevant
- invoices must reference clients safely
- reminder drafts must reference invoices
- timestamps should be explicit
- status-related fields should be consistent
- avoid premature table complexity

### Core tables
Recommended core tables:
- profiles
- clients
- invoices
- reminder_drafts
- reminder_events
- provider_settings or user_ai_settings

### Ownership pattern
Every user-owned row should include `user_id`.

This is essential for:
- query isolation
- RLS policy design
- debugging ownership issues
- future analytics per user

---

## Supabase and Security Architecture

### Row Level Security
Enable RLS on all user-owned tables. Supabase documents RLS as the security mechanism that controls which rows browser-accessible roles can read or modify.[web:64]  

### RLS policy principle
Policies should ensure:
- a user can read only their own rows
- a user can insert only rows owned by themselves
- a user can update only their own rows
- a user can delete only their own rows where allowed

Typical ownership pattern should follow `auth.uid() = user_id` style access control.[web:64]

### RLS performance note
Supabase recommends indexing columns used in RLS conditions when they are not already indexed, especially ownership columns used in filters or policies.[web:113]

### Security rules
- never trust only client-side filtering
- never expose service-role credentials in the client
- never bypass ownership checks casually
- treat user isolation as mandatory infrastructure

---

## Validation Layer

### Principle
Validation must exist before database writes and before AI calls.

Use schema-based validation for:
- clients
- invoices
- settings
- reminder generation inputs

Validation should check:
- required fields
- field lengths
- valid dates
- valid amount formats
- sane reminder input conditions
- safe provider settings format

Do not allow invalid invoice data to leak deep into the app.

---

## Business Logic Layer

### Purpose
Business logic must live outside raw UI files.

Examples of logic that must be centralized:
- invoice urgency derivation
- overdue day calculation
- “Who to Chase Today” prioritization
- reminder cooldown rules
- allowed status transitions
- reminder tone mapping
- dashboard summary aggregation formulas

These should live in `lib/domain/*`.

### Why this matters
If business logic lives inside components:
- validation becomes hard
- reuse becomes messy
- bugs become duplicated
- dashboards and tables diverge
- AI context becomes inconsistent

---

## AI Architecture

### Principle
AI must be provider-agnostic.

Use an OpenAI-compatible abstraction so the app can support different providers through configurable `baseURL`, `apiKey`, and `model` handling.[web:117]

### AI architecture layers
Separate these clearly:

#### 1. Provider configuration layer
Responsible for:
- provider name
- base URL
- model
- API key
- optional headers and parameters

#### 2. Client creation layer
Responsible for:
- instantiating the provider client
- reading secure config
- ensuring required fields exist
- avoiding provider-specific leakage into the app

#### 3. Prompt builder layer
Responsible for:
- preparing invoice-aware reminder prompts
- mapping product tone to prompt instructions
- injecting due date and overdue context
- constraining message style

#### 4. Reminder generation service
Responsible for:
- calling the provider
- requesting multiple draft variants
- normalizing output
- returning safe UI-ready result
- surfacing errors cleanly

#### 5. Persistence layer
Responsible for:
- saving generated drafts
- storing generation metadata
- storing selected/copy markers where needed

Do not combine all of this into one UI action handler.

---

## AI Integration Rules

### Important rule
The UI must not directly embed provider-specific logic.

Bad pattern:
- component contains provider config, prompt text, fetch logic, and output parsing

Good pattern:
- component submits a request
- server-side service handles provider call
- normalized result returns to the UI

### AI fallback requirement
If AI is unavailable:
- the invoice page should still work
- the reminder panel should fail gracefully
- the user should receive a clear error state
- the app should remain usable

AI failure must not break the entire product flow.

---

## Server vs Client Responsibility

### Prefer server-side for:
- authenticated data loading
- protected mutations
- AI provider calls
- secret handling
- ownership-sensitive operations
- heavy aggregation if needed

### Use client-side only for:
- interactive UI state
- table sorting and filtering state where appropriate
- form interaction
- dialog state
- selection state
- optimistic experience only when safe

### Rule
Sensitive operations and provider calls must stay server-side.

---

## Query and Mutation Design

### Query design
Queries should be:
- domain-specific
- typed
- minimal
- ownership-aware
- reusable

Examples:
- `getDashboardSummary(userId)`
- `getInvoicesForUser(userId, filters)`
- `getInvoiceById(userId, invoiceId)`
- `getClientById(userId, clientId)`
- `getReminderHistoryForInvoice(userId, invoiceId)`

### Mutation design
Mutations should be:
- explicit
- validated
- ownership-aware
- side-effect conscious

Examples:
- `createInvoice(userId, input)`
- `updateInvoice(userId, invoiceId, input)`
- `markInvoicePaid(userId, invoiceId)`
- `saveReminderDraft(userId, invoiceId, draft)`
- `markReminderCopied(userId, reminderDraftId)`

Do not hide major side effects inside generic helper functions.

---

## Dashboard Aggregation Architecture

### Principle
The dashboard must be a consumer of domain logic, not the source of truth.

The dashboard should compute from:
- invoice data
- reminder data
- status logic
- urgency logic

Recommended derived outputs:
- unpaid total
- overdue total
- due this week
- clients to chase today
- recent reminders
- recent invoices

The dashboard should never maintain a separate private interpretation of invoice states.

---

## “Who to Chase Today” Logic Placement

### Rule
This logic must be centralized and reusable.

Create a dedicated domain utility such as:
- `lib/domain/dashboard/chase-priority.ts`

This should determine:
- which invoices qualify
- ranking order
- cooldown treatment after reminders
- urgency labels
- display-ready priority result

Do not scatter this logic across:
- dashboard component
- invoice table
- reminder panel
- page loaders

---

## Error State Architecture

### Principle
Error handling must be explicit.

Expected error classes:
- auth errors
- validation errors
- DB read/write failures
- missing record errors
- AI provider config errors
- AI request failures
- empty data states

Create reusable UI states for:
- empty
- loading
- recoverable error
- retryable error

Do not use one generic vague error box everywhere.

---

## State Management Philosophy

### Rule
Do not add a heavy global state system unless truly required.

Prefer:
- server data loading
- local component state
- URL-based filters where useful
- form state scoped to the relevant view

Avoid:
- premature global stores
- app-wide complex client caches
- hidden cross-page state magic

This product can remain simpler if data ownership stays clear.

---

## Component Architecture Rules

### Component categories
Use these layers:

#### `components/ui`
Raw shadcn primitives and low-level building blocks.

#### `components/shared`
Cross-domain reusable product components:
- empty state
- loading state
- date display
- amount display
- confirm dialog

#### `components/{domain}`
Domain-specific, product-aware components:
- invoice table
- chase today list
- tone selector
- reminder draft card

### Rule
Do not pollute `components/ui` with product-specific logic.

Do not put all components into one folder.

---

## Form Architecture

### Principle
Forms should be domain-scoped and validated consistently.

Recommended forms:
- client form
- invoice form
- provider settings form

Rules:
- validate before submit
- show field-level feedback
- keep field shape aligned with domain types
- separate form UI from mutation implementation where possible

---

## Migration and Schema Discipline

### Rule
Schema changes must be intentional and traceable.

Guidelines:
- use explicit migrations
- do not repeatedly reshape tables without reason
- keep naming consistent
- avoid storing derived logic that can be safely computed unless needed for performance or audit
- preserve audit timestamps

Reminder count and last reminder timestamp may be stored because they support operational workflows and history.

---

## Testing and Verification Architecture

### Principle
Architecture must support realistic validation.

Important validation targets:
- user ownership enforcement
- invoice CRUD correctness
- status derivation consistency
- dashboard accuracy
- reminder history persistence
- AI provider integration correctness
- graceful failure behavior

### Validation support design
The structure should make it easy to test:
- domain functions independently
- DB queries separately
- mutations separately
- prompt builders separately
- UI components with realistic inputs

This is another reason to keep business logic out of page files.

---

## Template Cleanup Rule
If the current codebase comes from a starter template, remove or isolate non-core sections early.

Examples of likely removals:
- marketing leftovers
- blog scaffolding
- billing systems unrelated to V1
- template analytics
- fake growth metrics
- unrelated admin modules
- experimental demo components

The architecture should reflect ChaseFree AI, not the original template’s ambitions.

---

## Performance Guidelines
Keep the architecture efficient and simple.

Recommended approach:
- fetch only required data per page
- avoid over-joining unnecessarily
- cache carefully where appropriate
- keep dashboard queries practical
- avoid client-side overfetching
- keep table rendering efficient

RLS-related ownership columns used in filters or policies should be indexed when appropriate for performance.[web:113]

---

## Future-Ready but Not Overbuilt
The architecture should allow later additions such as:
- email integrations
- smarter reminder cadence
- reply-aware reminder logic
- richer analytics
- payment links
- mobile app support

But do not prebuild these systems now.

Design enough extension points to support them later without polluting V1.

---

## Explicit Architectural Boundaries

### Allowed now
- auth
- clients
- invoices
- dashboard
- reminders
- provider settings
- reminder history
- CSV import later in a controlled way

### Not allowed now
- full accounting engine
- CRM pipelines
- payroll logic
- tax filing architecture
- enterprise organization hierarchy
- deep workflow automation
- autonomous email dispatch systems
- unrelated financial platform modules

---

## Final Architecture Standard
ChaseFree AI must be built as a focused, modular, secure Next.js product with:
- App Router structure
- user-owned Supabase data
- RLS on all user-owned tables
- centralized domain logic
- modular queries and mutations
- provider-agnostic AI integration
- clean separation between UI, business logic, and infrastructure

If a proposed implementation makes the app harder to reason about, less secure, more template-driven, or more tightly coupled, it should be rejected.