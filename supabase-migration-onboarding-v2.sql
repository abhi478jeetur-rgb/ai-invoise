-- ============================================================
-- Migration: Onboarding V2 - Survey Columns
-- ============================================================
-- Run this in the Supabase SQL Editor to add the new
-- onboarding survey columns to the profiles table.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS use_case text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS setup_preference text;
