-- Migration: Add INSERT policy for notifications table
-- Fixes M30: Allows authenticated users to insert their own notifications
-- Run this in Supabase SQL Editor

-- Add INSERT policy for authenticated users
CREATE POLICY "Users can insert own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
