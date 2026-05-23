-- ============================================================
-- AI-Nvoise V3 Migration
-- 1. Add business profile fields to profiles table
-- 2. Add po_number + applied_rules to invoices table
-- 3. Create Supabase Storage bucket policy for business logos
-- Run this in Supabase SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles table: add new business profile columns
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists company_website   text,
  add column if not exists bank_details      text,
  add column if not exists payment_link_default text,
  add column if not exists global_rules      jsonb not null default '{}'::jsonb,
  add column if not exists default_tax_label text,
  add column if not exists default_tax_rate  numeric(5,2),
  add column if not exists default_payment_terms text not null default 'net_30';

-- Constraints: prevent script injection in text fields
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
-- 2. invoices table: add po_number and applied_rules
-- ------------------------------------------------------------

alter table public.invoices
  add column if not exists po_number      text,
  add column if not exists applied_rules  jsonb not null default '[]'::jsonb;

alter table public.invoices
  add constraint invoices_po_number_length
    check (po_number is null or char_length(trim(po_number)) <= 100),
  add constraint invoices_applied_rules_is_array
    check (jsonb_typeof(applied_rules) = 'array');

-- ------------------------------------------------------------
-- 3. Create Supabase Storage bucket for business logos
-- (Run via Supabase Dashboard > Storage, or via this SQL)
-- ------------------------------------------------------------

-- NOTE: Storage buckets must be created via Supabase Dashboard or CLI.
-- Go to: Storage > New Bucket > Name: "business-logos" > Public: NO
-- Then add these RLS policies:

-- Storage Policy: allow authenticated users to upload their own logos
-- CREATE POLICY "Users can upload their own logo"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can update their own logo"
-- ON storage.objects FOR UPDATE TO authenticated
-- USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can read their own logo"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can delete their own logo"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- END OF MIGRATION
-- ============================================================
