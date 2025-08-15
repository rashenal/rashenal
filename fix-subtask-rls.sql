-- Fix task_subtasks RLS policies
-- Run this in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view subtasks for their tasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can create subtasks for their tasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can update subtasks for their tasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks for their tasks" ON task_subtasks;

-- Create more permissive policies for debugging
CREATE POLICY "Users can view subtasks for their tasks" ON task_subtasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create subtasks for their tasks" ON task_subtasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update subtasks for their tasks" ON task_subtasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete subtasks for their tasks" ON task_subtasks
  FOR DELETE USING (user_id = auth.uid());

-- Test the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'task_subtasks';