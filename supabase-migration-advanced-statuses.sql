-- Migration for Advanced Invoice Statuses
-- Adds promised, paused, and partial statuses to the invoice_status ENUM
-- Adds amount_paid column to the invoices table for partial payments

ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'promised';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'partial';

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid numeric default 0;
