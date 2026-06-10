-- ============================================================
-- ChaseFree AI - Unified Database Schema & Migrations
-- ============================================================
-- Run this script in the Supabase SQL Editor to set up the
-- complete database schema, tables, policies, and RPCs.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================
create type public.invoice_status as enum (
  'draft',
  'sent',
  'due_soon',
  'overdue',
  'paid',
  'archived',
  'promised',
  'paused',
  'partial'
);

create type public.reminder_tone as enum (
  'friendly',
  'professional',
  'firm',
  'final_notice'
);

create type public.reminder_event_type as enum (
  'draft_generated',
  'draft_copied',
  'marked_sent',
  'sent_failed',
  'status_changed',
  'invoice_imported'
);

-- ============================================================
-- 3. TABLES & COLUMNS
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  onboarding_completed boolean not null default false,
  profession text,
  primary_problem text,
  discovery_source text,
  use_case text,
  role text,
  setup_preference text,
  credits_balance integer not null default 5,
  timezone text,
  default_currency text not null default 'USD',
  company_name text,
  company_address text,
  tax_id text,
  logo_url text,
  theme_preference text not null default 'system',
  stripe_customer_id text,
  company_website text,
  bank_details text,
  payment_link_default text,
  global_rules jsonb not null default '{}'::jsonb,
  default_tax_label text,
  default_tax_rate numeric(5,2),
  default_payment_terms text not null default 'net_30',
  reminder_enabled boolean not null default false,
  reminder_day text not null default 'Friday',
  reminder_time text not null default 'Afternoon',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_bank_details_length
    check (bank_details is null or char_length(bank_details) <= 2000),
  add constraint profiles_global_rules_is_object
    check (jsonb_typeof(global_rules) = 'object'),
  add constraint profiles_tax_rate_range
    check (default_tax_rate is null or (default_tax_rate >= 0 and default_tax_rate <= 100)),
  add constraint profiles_website_format
    check (company_website is null or company_website ~ '^https?://');

-- ------------------------------------------------------------
-- clients
-- ------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  contact_name text,
  email text,
  phone text,
  company_name text,
  notes text,
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients
add constraint clients_client_name_not_blank
check (char_length(trim(client_name)) > 0);

-- ------------------------------------------------------------
-- invoices
-- ------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null,
  title text,
  description text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  status public.invoice_status not null default 'sent',
  amount_paid numeric(12,2) not null default 0,
  due_date date not null,
  paid_date date,
  reminder_count integer not null default 0,
  last_reminder_at timestamptz,
  notes text,
  payment_link text,
  po_number text,
  applied_rules jsonb not null default '[]'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  tax_rate numeric(5,2) default 0.00,
  tax_label text default 'Tax',
  discount_amount numeric(12,2) default 0.00,
  discount_type text default 'flat',
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices
add constraint invoices_invoice_number_not_blank
check (char_length(trim(invoice_number)) > 0);

alter table public.invoices
add constraint invoices_amount_non_negative
check (amount >= 0);

alter table public.invoices
add constraint invoices_reminder_count_non_negative
check (reminder_count >= 0);

alter table public.invoices
  add constraint invoices_po_number_length
    check (po_number is null or char_length(trim(po_number)) <= 100),
  add constraint invoices_applied_rules_is_array
    check (jsonb_typeof(applied_rules) = 'array'),
  add constraint invoices_tax_rate_range
    check (tax_rate >= 0 and tax_rate <= 100),
  add constraint invoices_discount_amount_non_negative
    check (discount_amount >= 0),
  add constraint invoices_discount_type_value
    check (discount_type in ('flat', 'percentage')),
  add constraint valid_currency 
    check (currency in ('USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'));

-- unique invoice number per user
create unique index invoices_user_id_invoice_number_unique
on public.invoices(user_id, invoice_number);

-- ------------------------------------------------------------
-- reminder_drafts
-- ------------------------------------------------------------
create table public.reminder_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  tone public.reminder_tone not null,
  subject text not null,
  body text not null,
  status text not null default 'generated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- reminder_events
-- ------------------------------------------------------------
create table public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  draft_id uuid references public.reminder_drafts(id) on delete set null,
  event_type public.reminder_event_type not null,
  description text,
  mail_subject text,
  mail_body text,
  created_at timestamptz not null default now()
);

comment on column public.reminder_events.mail_subject is 'Archives the full AI generated subject line at the time of follow-up for audit compliance.';
comment on column public.reminder_events.mail_body is 'Archives the full AI generated email/message body text at the time of follow-up for audit compliance.';

-- ------------------------------------------------------------
-- user_ai_settings
-- ------------------------------------------------------------
create table public.user_ai_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_url text not null,
  api_key_encrypted text not null,
  provider_label text,
  model_name text not null,
  temperature numeric(3,2) not null default 0.4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_ai_settings
add constraint user_ai_settings_temperature_range
check (temperature >= 0 and temperature <= 2);

-- ------------------------------------------------------------
-- user_knowledge_base
-- ------------------------------------------------------------
create table public.user_knowledge_base (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    file_name text not null,
    file_size integer not null,
    file_type text not null,
    extracted_text text not null,
    storage_path text not null,
    created_at timestamptz default now() not null
);

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null default 'system',
    link text,
    is_read boolean not null default false,
    created_at timestamptz default now() not null
);

-- ------------------------------------------------------------
-- unbilled_tasks
-- ------------------------------------------------------------
create table public.unbilled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  description text not null,
  amount numeric(12,2),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

-- clients
create index clients_user_id_idx on public.clients(user_id);
create index clients_user_id_created_at_idx on public.clients(user_id, created_at desc);

-- invoices
create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_client_id_idx on public.invoices(client_id);
create index invoices_status_idx on public.invoices(status);
create index invoices_due_date_idx on public.invoices(due_date);
create index invoices_user_id_status_due_date_idx on public.invoices(user_id, status, due_date);
create index invoices_user_id_created_at_idx on public.invoices(user_id, created_at desc);

-- reminder_drafts
create index reminder_drafts_user_id_idx on public.reminder_drafts(user_id);
create index reminder_drafts_invoice_id_idx on public.reminder_drafts(invoice_id);
create index reminder_drafts_created_at_idx on public.reminder_drafts(created_at desc);

-- reminder_events
create index reminder_events_user_id_idx on public.reminder_events(user_id);
create index reminder_events_invoice_id_idx on public.reminder_events(invoice_id);
create index reminder_events_event_type_idx on public.reminder_events(event_type);
create index reminder_events_created_at_idx on public.reminder_events(created_at desc);

-- notifications
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_is_read on public.notifications(is_read);

-- unbilled_tasks
create index unbilled_tasks_user_id_idx on public.unbilled_tasks(user_id);
create index unbilled_tasks_status_idx on public.unbilled_tasks(status);

-- ============================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================

-- auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- apply updated_at trigger to tables
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

create trigger update_clients_updated_at
before update on public.clients
for each row execute function public.update_updated_at_column();

create trigger update_invoices_updated_at
before update on public.invoices
for each row execute function public.update_updated_at_column();

create trigger update_reminder_drafts_updated_at
before update on public.reminder_drafts
for each row execute function public.update_updated_at_column();

create trigger update_user_ai_settings_updated_at
before update on public.user_ai_settings
for each row execute function public.update_updated_at_column();

create trigger update_unbilled_tasks_updated_at
before update on public.unbilled_tasks
for each row execute function public.update_updated_at_column();

-- auto-create profile on new auth user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- validate that an invoice's client belongs to the same user
create or replace function public.validate_invoice_client_ownership()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  client_owner uuid;
begin
  select user_id into client_owner
  from public.clients
  where id = new.client_id;

  if client_owner is not null and client_owner != new.user_id then
    raise exception 'Client does not belong to the user';
  end if;

  return new;
end;
$$;

create trigger validate_invoice_client_ownership
before insert or update on public.invoices
for each row execute function public.validate_invoice_client_ownership();

-- validate that a reminder draft/event's invoice belongs to the same user
create or replace function public.validate_reminder_invoice_ownership()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  invoice_owner uuid;
begin
  select user_id into invoice_owner
  from public.invoices
  where id = new.invoice_id;

  if invoice_owner is not null and invoice_owner != new.user_id then
    raise exception 'Invoice does not belong to the user';
  end if;

  return new;
end;
$$;

create trigger validate_reminder_draft_invoice_ownership
before insert or update on public.reminder_drafts
for each row execute function public.validate_reminder_invoice_ownership();

create trigger validate_reminder_event_invoice_ownership
before insert or update on public.reminder_events
for each row execute function public.validate_reminder_invoice_ownership();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================

-- enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.reminder_drafts enable row level security;
alter table public.reminder_events enable row level security;
alter table public.user_ai_settings enable row level security;
alter table public.user_knowledge_base enable row level security;
alter table public.notifications enable row level security;
alter table public.unbilled_tasks enable row level security;

-- profiles
create policy "profiles_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- clients
create policy "clients_select_own"
on public.clients for select to authenticated
using ((select auth.uid()) = user_id);

create policy "clients_insert_own"
on public.clients for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "clients_update_own"
on public.clients for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "clients_delete_own"
on public.clients for delete to authenticated
using ((select auth.uid()) = user_id);

-- invoices
create policy "invoices_select_own"
on public.invoices for select to authenticated
using ((select auth.uid()) = user_id);

create policy "invoices_insert_own"
on public.invoices for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "invoices_update_own"
on public.invoices for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "invoices_delete_own"
on public.invoices for delete to authenticated
using ((select auth.uid()) = user_id);

-- reminder_drafts
create policy "reminder_drafts_select_own"
on public.reminder_drafts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "reminder_drafts_insert_own"
on public.reminder_drafts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "reminder_drafts_update_own"
on public.reminder_drafts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "reminder_drafts_delete_own"
on public.reminder_drafts for delete to authenticated
using ((select auth.uid()) = user_id);

-- reminder_events
create policy "reminder_events_select_own"
on public.reminder_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "reminder_events_insert_own"
on public.reminder_events for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "reminder_events_update_own"
on public.reminder_events for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "reminder_events_delete_own"
on public.reminder_events for delete to authenticated
using ((select auth.uid()) = user_id);

-- user_ai_settings
create policy "user_ai_settings_select_own"
on public.user_ai_settings for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user_ai_settings_insert_own"
on public.user_ai_settings for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_ai_settings_update_own"
on public.user_ai_settings for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_ai_settings_delete_own"
on public.user_ai_settings for delete to authenticated
using ((select auth.uid()) = user_id);

-- user_knowledge_base
create policy "Users can view own knowledge base documents" 
on public.user_knowledge_base for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own knowledge base documents" 
on public.user_knowledge_base for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own knowledge base documents" 
on public.user_knowledge_base for delete to authenticated
using (auth.uid() = user_id);

-- notifications
create policy "Users can view their own notifications"
on public.notifications for select to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own notifications"
on public.notifications for update to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
on public.notifications for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own notifications"
on public.notifications for insert to authenticated
with check (auth.uid() = user_id);

-- unbilled_tasks
create policy "unbilled_tasks_select_own"
on public.unbilled_tasks for select to authenticated
using ((select auth.uid()) = user_id);

create policy "unbilled_tasks_insert_own"
on public.unbilled_tasks for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "unbilled_tasks_update_own"
on public.unbilled_tasks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "unbilled_tasks_delete_own"
on public.unbilled_tasks for delete to authenticated
using ((select auth.uid()) = user_id);

-- ============================================================
-- 7. SECURE DATABASE RPCS
-- ============================================================

-- RPC: check_email_exists
-- Check if an email exists securely (only for authenticated users)
create or replace function public.check_email_exists(email_to_check text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  user_exists boolean;
begin
  select exists (
    select 1 
    from auth.users 
    where email = email_to_check
  ) into user_exists;
  
  return user_exists;
end;
$$;

revoke execute on function public.check_email_exists(text) from anon;
grant execute on function public.check_email_exists(text) to authenticated;

-- RPC: delete_user_account (GDPR Hard Delete)
-- Deletes the authenticated user from auth.users (cascades to all user tables)
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- ============================================================
-- 8. STORAGE BUCKET CONFIGURATION & POLICIES
-- ============================================================

-- Ensure the 'ai-knowledge-base' bucket exists
insert into storage.buckets (id, name, public)
values ('ai-knowledge-base', 'ai-knowledge-base', false)
on conflict (id) do nothing;

create policy "Users can upload knowledge base files"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'ai-knowledge-base' and 
    auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view own knowledge base files"
on storage.objects for select to authenticated
using (
    bucket_id = 'ai-knowledge-base' and 
    auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own knowledge base files"
on storage.objects for delete to authenticated
using (
    bucket_id = 'ai-knowledge-base' and 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: The 'business-logos' bucket must be created via the dashboard
-- and configured with the following policies if needed:
-- CREATE POLICY "Users can upload their own logo" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Users can update their own logo" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Users can read their own logo" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Users can delete their own logo" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
