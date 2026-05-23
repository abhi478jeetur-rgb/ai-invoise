-- Migration: Feature 14 & 15 (Recycle Bin & Account Deletion)
-- Description: Adds deleted_at to clients and invoices for soft-delete, and creates a secure RPC for account hard deletion.

-- 1. Add deleted_at columns for Soft Delete (Recycle Bin)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Create RPC for Account Deletion (GDPR Hard Delete)
-- This function allows an authenticated user to delete their own account from auth.users.
-- Since auth.users cascades to public.profiles, public.clients, public.invoices, etc.,
-- this single action securely wipes all of the user's data.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to access auth.users
SET search_path = ''
AS $$
BEGIN
  -- Delete the currently authenticated user from auth.users
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
