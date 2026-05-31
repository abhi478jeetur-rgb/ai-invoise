-- Create a secure function to check if an email exists
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE LOWER(email) = LOWER(email_to_check)
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;

-- Grant execution permissions
-- SECURITY FIX (C11): Removed anon access to prevent user enumeration.
-- See supabase-migration-v11-fix-check-email-anon.sql for the patch.
GRANT EXECUTE ON FUNCTION check_email_exists(text) TO authenticated;
