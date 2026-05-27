-- supabase-migration-v7-reminder-archival.sql
-- Run this SQL script in your Supabase SQL Editor to support the Reminder Audit Log body text archival feature.

ALTER TABLE public.reminder_events ADD COLUMN IF NOT EXISTS mail_subject text;
ALTER TABLE public.reminder_events ADD COLUMN IF NOT EXISTS mail_body text;

-- Add descriptive comments to columns for self-documentation
COMMENT ON COLUMN public.reminder_events.mail_subject IS 'Archives the full AI generated subject line at the time of follow-up for audit compliance.';
COMMENT ON COLUMN public.reminder_events.mail_body IS 'Archives the full AI generated email/message body text at the time of follow-up for audit compliance.';
