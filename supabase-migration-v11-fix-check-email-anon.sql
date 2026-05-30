-- Migration: Revoke anonymous access to check_email_exists RPC
-- Fixes C11: Prevents user enumeration attacks via anonymous RPC calls
-- Run this in Supabase SQL Editor after the original migration

-- Revoke from anon role
REVOKE EXECUTE ON FUNCTION check_email_exists(text) FROM anon;

-- Ensure only authenticated users can call it
GRANT EXECUTE ON FUNCTION check_email_exists(text) TO authenticated;
