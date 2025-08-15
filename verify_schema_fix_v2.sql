-- Updated verification script for UUID-based schema
-- Run this after applying the corrected migration

-- 1. Check actual tasks table ID type
SELECT 'Tasks table ID type check:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND column_name IN ('id', 'parent_id', 'user_id', 'taskboard_id', 'updated_at')
ORDER BY column_name;

-- 2. Verify tasks_with_dependencies view exists and has updated_at
SELECT 'tasks_with_dependencies view columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks_with_dependencies' 
    AND column_name IN ('updated_at', 'created_at', 'id', 'title', 'parent_id')
ORDER BY column_name;

-- 3. Check foreign key constraints are working properly
SELECT 'Foreign key constraints verification:' as info;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name LIKE 'task%' OR ccu.table_name = 'tasks')
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Test the view with a simple query
SELECT 'Sample data from view (should include updated_at):' as info;
SELECT 
    id::text as task_id, 
    title, 
    updated_at, 
    dependency_status,
    parent_id::text as parent_task_id
FROM tasks_with_dependencies 
LIMIT 5;

-- 5. Check if all related tables have correct UUID types
SELECT 'Related table UUID reference verification:' as info;
SELECT 
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('task_subtasks', 'task_comments', 'task_attachments')
    AND c.column_name LIKE '%task_id' OR c.column_name = 'parent_task_id'
ORDER BY t.table_name, c.column_name;

-- 6. Verify RLS policies exist
SELECT 'RLS policies check:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename LIKE 'task%'
ORDER BY tablename, policyname;