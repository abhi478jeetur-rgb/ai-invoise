# Supabase Schema.md

## Document Purpose
This document defines the database schema for ChaseFree AI V1 using Supabase Postgres.

The schema is designed to be:
- minimal
- safe
- scalable
- user-isolated
- easy to query
- easy to extend in V2
- aligned with the V1 product scope only

This schema should support:
- authentication-linked profiles
- clients
- invoices
- reminder drafts
- reminder events
- AI provider settings

Do not add advanced billing, accounting, tax, team, CRM pipeline, or payment-processing tables in V1.

---

## Core Schema Principles

### 1. Every Record Belongs to One User
All core product records must belong to a single authenticated user.

Use `user_id` on user-owned tables and enforce access through Row Level Security.

### 2. Keep V1 Narrow
Only create tables needed for:
- user profile
- client records
- invoice records
- reminder generation history
- reminder activity history
- user AI configuration

### 3. Use Enums for Controlled Product States
Use Postgres enums for:
- invoice status
- reminder tone
- reminder event type

This reduces bugs and keeps state values consistent.

### 4. Use Timestamps Everywhere
Every important table should include:
- created_at
- updated_at

### 5. Use Soft Simplicity
Do not over-normalize V1.

The schema should be practical, not academically perfect.

---

## Required Extensions
Use these if needed:

```sql
create extension if not exists pgcrypto;
```

This can help with UUID generation if necessary.

---

## Enum Definitions

### Invoice Status Enum
```sql
create type public.invoice_status as enum (
  'draft',
  'sent',
  'due_soon',
  'overdue',
  'paid',
  'archived'
);
```

### Reminder Tone Enum
```sql
create type public.reminder_tone as enum (
  'friendly',
  'professional',
  'firm',
  'final_notice'
);
```

### Reminder Event Type Enum
```sql
create type public.reminder_event_type as enum (
  'draft_generated',
  'draft_copied',
  'marked_sent',
  'marked_paid',
  'status_changed',
  'invoice_imported'
);
```

---

## Shared Timestamp Trigger

### Updated At Function
```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Use this trigger on tables that contain `updated_at`.

---

## Table: profiles

### Purpose
Stores app-specific user profile information for authenticated users from `auth.users`.

### SQL
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Notes
- `id` must match `auth.users.id`
- `email` is duplicated here for convenience in the app
- keep this table lightweight

### Trigger
```sql
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
```

---

## Table: clients

### Purpose
Stores customer/client records for each user.

### SQL
```sql
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  contact_name text,
  email text,
  phone text,
  company_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Constraints
```sql
alter table public.clients
add constraint clients_client_name_not_blank
check (char_length(trim(client_name)) > 0);
```

### Trigger
```sql
create trigger set_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();
```

---

## Table: invoices

### Purpose
Stores invoices created or imported by the user.

### SQL
```sql
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null,
  title text not null,
  description text,
  issue_date date not null,
  due_date date not null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  status public.invoice_status not null default 'sent',
  payment_link text,
  notes text,
  reminder_count integer not null default 0,
  last_reminder_at timestamptz,
  paid_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Constraints
```sql
alter table public.invoices
add constraint invoices_title_not_blank
check (char_length(trim(title)) > 0);

alter table public.invoices
add constraint invoices_invoice_number_not_blank
check (char_length(trim(invoice_number)) > 0);

alter table public.invoices
add constraint invoices_amount_non_negative
check (amount >= 0);

alter table public.invoices
add constraint invoices_due_date_after_issue_date
check (due_date >= issue_date);

alter table public.invoices
add constraint invoices_reminder_count_non_negative
check (reminder_count >= 0);
```

### Optional Unique Constraint
Invoice number only needs to be unique per user, not globally.

```sql
create unique index invoices_user_id_invoice_number_unique
on public.invoices(user_id, invoice_number);
```

### Trigger
```sql
create trigger set_invoices_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();
```

---

## Table: reminder_drafts

### Purpose
Stores AI-generated reminder drafts for invoices.

### SQL
```sql
create table public.reminder_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  tone public.reminder_tone not null,
  provider_label text not null,
  model_name text not null,
  subject text not null,
  body text not null,
  short_version text,
  was_copied boolean not null default false,
  was_marked_sent boolean not null default false,
  created_at timestamptz not null default now()
);
```

### Notes
- each record represents one generated draft option
- multiple draft rows can belong to the same invoice and same generation session if needed later
- keep V1 simple; no need for advanced version trees

---

## Table: reminder_events

### Purpose
Stores simple activity history for reminders and invoice follow-up actions.

### SQL
```sql
create table public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  event_type public.reminder_event_type not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### Notes
Use this table for lightweight event history such as:
- draft generated
- draft copied
- marked sent
- status changed
- invoice imported

Keep metadata small and practical.

---

## Table: user_ai_settings

### Purpose
Stores per-user AI provider configuration for OpenAI-compatible providers.

### SQL
```sql
create table public.user_ai_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_label text not null,
  base_url text not null,
  model_name text not null,
  api_key_encrypted text not null,
  temperature numeric(3,2) not null default 0.4,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Constraints
```sql
alter table public.user_ai_settings
add constraint user_ai_settings_temperature_range
check (temperature >= 0 and temperature <= 2);
```

### Trigger
```sql
create trigger set_user_ai_settings_updated_at
before update on public.user_ai_settings
for each row
execute function public.set_updated_at();
```

### Important Security Note
Do not expose raw API keys to the browser unnecessarily.

The application should treat this column carefully and only access it in trusted server-side paths.

If a stronger secret-management strategy is used later, this table can be adapted.

---

## Optional Table: invoice_import_batches
Only create this in V1 if import history is actually implemented.

If import history is not needed in the UI yet, skip this table.

### Purpose
Tracks CSV import batch metadata.

### SQL
```sql
create table public.invoice_import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);
```

### Constraints
```sql
alter table public.invoice_import_batches
add constraint invoice_import_batches_row_count_non_negative
check (row_count >= 0);

alter table public.invoice_import_batches
add constraint invoice_import_batches_imported_count_non_negative
check (imported_count >= 0);

alter table public.invoice_import_batches
add constraint invoice_import_batches_failed_count_non_negative
check (failed_count >= 0);
```

---

## Suggested Indexes

### Clients
```sql
create index clients_user_id_idx on public.clients(user_id);
create index clients_user_id_created_at_idx on public.clients(user_id, created_at desc);
```

### Invoices
```sql
create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_client_id_idx on public.invoices(client_id);
create index invoices_status_idx on public.invoices(status);
create index invoices_due_date_idx on public.invoices(due_date);
create index invoices_user_id_status_due_date_idx
on public.invoices(user_id, status, due_date);

create index invoices_user_id_created_at_idx
on public.invoices(user_id, created_at desc);
```

### Reminder Drafts
```sql
create index reminder_drafts_user_id_idx on public.reminder_drafts(user_id);
create index reminder_drafts_invoice_id_idx on public.reminder_drafts(invoice_id);
create index reminder_drafts_created_at_idx on public.reminder_drafts(created_at desc);
```

### Reminder Events
```sql
create index reminder_events_user_id_idx on public.reminder_events(user_id);
create index reminder_events_invoice_id_idx on public.reminder_events(invoice_id);
create index reminder_events_event_type_idx on public.reminder_events(event_type);
create index reminder_events_created_at_idx on public.reminder_events(created_at desc);
```

### User AI Settings
```sql
create index user_ai_settings_is_active_idx on public.user_ai_settings(is_active);
```

---

## Recommended Derived Logic (App-Level, Not DB Enum)
Do not store every urgency bucket as a database enum in V1.

Instead, derive urgency in the app from:
- current date
- due_date
- status
- paid_at

Recommended derived urgency buckets:
- due_in_3_days
- due_today
- overdue_1_3
- overdue_4_7
- overdue_8_14
- overdue_15_plus

This keeps the database simpler and avoids unnecessary state drift.

---

## Row Level Security (RLS)

### General Rule
Enable RLS on every user-owned table.

Use policies based on `auth.uid()` matching the table’s `user_id`, or matching `id` for `profiles`.

Supabase recommends using `auth.uid()` for per-user access control, and unauthenticated requests may return `null`, so all policies should assume authenticated access only.[cite:64]

---

## Enable RLS

```sql
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.reminder_drafts enable row level security;
alter table public.reminder_events enable row level security;
alter table public.user_ai_settings enable row level security;
```

If `invoice_import_batches` is used:
```sql
alter table public.invoice_import_batches enable row level security;
```

---

## Profiles Policies

```sql
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
```

---

## Clients Policies

```sql
create policy "clients_select_own"
on public.clients
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "clients_insert_own"
on public.clients
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "clients_update_own"
on public.clients
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "clients_delete_own"
on public.clients
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

## Invoices Policies

```sql
create policy "invoices_select_own"
on public.invoices
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "invoices_insert_own"
on public.invoices
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "invoices_update_own"
on public.invoices
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "invoices_delete_own"
on public.invoices
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

## Reminder Drafts Policies

```sql
create policy "reminder_drafts_select_own"
on public.reminder_drafts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "reminder_drafts_insert_own"
on public.reminder_drafts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "reminder_drafts_update_own"
on public.reminder_drafts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "reminder_drafts_delete_own"
on public.reminder_drafts
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

## Reminder Events Policies

```sql
create policy "reminder_events_select_own"
on public.reminder_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "reminder_events_insert_own"
on public.reminder_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "reminder_events_update_own"
on public.reminder_events
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "reminder_events_delete_own"
on public.reminder_events
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

## User AI Settings Policies

```sql
create policy "user_ai_settings_select_own"
on public.user_ai_settings
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_ai_settings_insert_own"
on public.user_ai_settings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_ai_settings_update_own"
on public.user_ai_settings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_ai_settings_delete_own"
on public.user_ai_settings
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

## Invoice Import Batch Policies
Only needed if the table exists.

```sql
create policy "invoice_import_batches_select_own"
on public.invoice_import_batches
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "invoice_import_batches_insert_own"
on public.invoice_import_batches
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "invoice_import_batches_delete_own"
on public.invoice_import_batches
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

## Profile Creation Strategy

### Recommendation
When a new auth user signs up:
- create a matching row in `public.profiles`
- use the auth user id as `profiles.id`

This can be handled:
- in app code after signup
- or via a database trigger later

For V1, app-code creation is simpler and easier to debug.

---

## Cross-Table Ownership Rule
The app must ensure:
- a user can only attach invoices to their own clients
- a user can only create reminder records for their own invoices

RLS helps protect this, but the app should also validate ownership before writes.

For extra safety in V1, all writes should be done through trusted server-side paths where ownership checks are explicit.

---

## Suggested Query Patterns

### Dashboard Queries
Needed for:
- total unpaid amount
- overdue amount
- due soon invoices
- chase today list
- recent reminder activity

Useful filters:
- `user_id = current user`
- `status != 'paid'`
- `status != 'archived'`
- `due_date <= current_date + interval '3 days'`

### Clients Page
- fetch all clients for user
- order by created_at desc or client_name asc

### Invoices Page
- filter by status
- sort by due_date
- search by invoice_number, title, or client name

### Invoice Detail
- fetch invoice
- join client
- fetch reminder drafts
- fetch reminder events

---

## V1 Data Validation Rules
The app must validate:

### Clients
- `client_name` required

### Invoices
- `invoice_number` required
- `title` required
- `issue_date` required
- `due_date` required
- `amount` required
- `amount >= 0`
- `due_date >= issue_date`

### Reminder Drafts
- `tone` required
- `subject` required
- `body` required

### AI Settings
- `provider_label` required
- `base_url` required
- `model_name` required
- `api_key_encrypted` required

---

## V1 Things to Avoid in the Schema
Do NOT add these yet:
- teams table
- organizations table
- roles table
- permissions matrix
- projects table
- pipeline stages table
- accounting ledger entries
- journal entries
- tax tables
- exchange rate tables
- payment transactions
- webhook logs
- email inbox sync tables
- contract storage schema
- automation rule engines
- audit systems beyond simple reminder events

These can be added later if the product grows.

---

## Recommended Migration Order

### Step 1
Create extension and enums

### Step 2
Create `set_updated_at()` function

### Step 3
Create base tables:
- profiles
- clients
- invoices
- reminder_drafts
- reminder_events
- user_ai_settings

### Step 4
Add constraints

### Step 5
Add indexes

### Step 6
Add triggers

### Step 7
Enable RLS

### Step 8
Create RLS policies

### Step 9
Test with authenticated and unauthenticated users

---

## Minimal V1 Relationship Map

- `profiles.id` -> `auth.users.id`
- `clients.user_id` -> `auth.users.id`
- `invoices.user_id` -> `auth.users.id`
- `invoices.client_id` -> `clients.id`
- `reminder_drafts.user_id` -> `auth.users.id`
- `reminder_drafts.invoice_id` -> `invoices.id`
- `reminder_events.user_id` -> `auth.users.id`
- `reminder_events.invoice_id` -> `invoices.id`
- `user_ai_settings.user_id` -> `auth.users.id`

---

## Final Agent Instruction
Implement the Supabase schema for ChaseFree AI V1 exactly around:
- profiles
- clients
- invoices
- reminder_drafts
- reminder_events
- user_ai_settings

Use:
- enums for controlled states
- RLS on every user-owned table
- `auth.uid()`-based access policies
- practical indexes
- minimal but strong constraints
- no V2 tables
- no enterprise abstractions
- no accounting system complexity

The schema must remain focused on invoice tracking and AI-powered follow-up workflows for one authenticated user at a time.