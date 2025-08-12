-- Database Schema Verification Script
-- Run this in Supabase SQL Editor to check if migrations were applied

-- 1. Check if preferences column exists in user_profiles
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'preferences';

-- 2. Check if task-related tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('task_subtasks', 'task_comments', 'task_attachments', 'tasks', 'taskboards', 'user_profiles')
ORDER BY table_name;

-- 3. Check all columns in tasks table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 4. Check all columns in user_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check if task_subtasks table exists and its columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'task_subtasks'
ORDER BY ordinal_position;

-- 6. Check RLS policies on task_subtasks
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('task_subtasks', 'task_comments', 'task_attachments');

-- 7. Check if required functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'update_updated_at_column';

-- 8. Quick data check - see if any preferences are saved
SELECT 
    id,
    email,
    CASE 
        WHEN preferences IS NULL THEN 'NULL'
        WHEN preferences = '{}'::jsonb THEN 'EMPTY'
        ELSE 'HAS DATA'
    END as pref_status
FROM user_profiles
LIMIT 10;