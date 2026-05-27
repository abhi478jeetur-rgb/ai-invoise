-- ==============================================================================
-- v6_tax_discount.sql
-- Add tax and discount columns to public.invoices table for ChaseFree AI v2.5
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. Add Columns to public.invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tax_label       TEXT DEFAULT 'Tax',
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_type   TEXT DEFAULT 'flat';

-- 2. Add Constraints for Data Integrity
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_tax_rate_range
    CHECK (tax_rate >= 0 AND tax_rate <= 100),
  ADD CONSTRAINT invoices_discount_amount_non_negative
    CHECK (discount_amount >= 0),
  ADD CONSTRAINT invoices_discount_type_value
    CHECK (discount_type IN ('flat', 'percentage'));

-- 3. Populate default values for existing records just in case
UPDATE public.invoices
SET 
  tax_rate = 0.00,
  tax_label = 'Tax',
  discount_amount = 0.00,
  discount_type = 'flat'
WHERE tax_rate IS NULL;
