-- ============================================================
-- Migration: Unbilled Tasks & Reminder Preferences
-- ============================================================

-- 1. Add Reminder columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_day text NOT NULL DEFAULT 'Friday',
ADD COLUMN IF NOT EXISTS reminder_time text NOT NULL DEFAULT 'Afternoon';

-- 2. Create unbilled_tasks table
CREATE TABLE IF NOT EXISTS public.unbilled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12,2),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Trigger for updated_at
DROP TRIGGER IF EXISTS update_unbilled_tasks_updated_at ON public.unbilled_tasks;
CREATE TRIGGER update_unbilled_tasks_updated_at
BEFORE UPDATE ON public.unbilled_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE public.unbilled_tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for unbilled_tasks
DROP POLICY IF EXISTS "unbilled_tasks_select_own" ON public.unbilled_tasks;
CREATE POLICY "unbilled_tasks_select_own"
ON public.unbilled_tasks FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "unbilled_tasks_insert_own" ON public.unbilled_tasks;
CREATE POLICY "unbilled_tasks_insert_own"
ON public.unbilled_tasks FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "unbilled_tasks_update_own" ON public.unbilled_tasks;
CREATE POLICY "unbilled_tasks_update_own"
ON public.unbilled_tasks FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "unbilled_tasks_delete_own" ON public.unbilled_tasks;
CREATE POLICY "unbilled_tasks_delete_own"
ON public.unbilled_tasks FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS unbilled_tasks_user_id_idx ON public.unbilled_tasks(user_id);
CREATE INDEX IF NOT EXISTS unbilled_tasks_status_idx ON public.unbilled_tasks(status);
