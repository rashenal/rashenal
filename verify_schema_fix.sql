-- Quick verification script to check if the schema fix worked
-- Run this after applying the migration

-- 1. Check if tasks table has correct structure
SELECT 'Tasks table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 2. Verify tasks_with_dependencies view exists and has updated_at
SELECT 'tasks_with_dependencies view columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks_with_dependencies' 
AND column_name IN ('updated_at', 'created_at', 'id', 'title')
ORDER BY column_name;

-- 3. Check if foreign key constraints are working
SELECT 'Foreign key constraints on tasks:' as info;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'tasks' AND constraint_type = 'FOREIGN KEY';

-- 4. Test the view with a simple query
SELECT 'Sample data from view (should include updated_at):' as info;
SELECT id, title, updated_at, dependency_status 
FROM tasks_with_dependencies 
LIMIT 5;

-- 5. Check if related tables have correct task_id types
SELECT 'Related table task reference types:' as info;
SELECT 
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('task_subtasks', 'task_comments', 'task_attachments')
    AND c.column_name LIKE '%task_id'
ORDER BY t.table_name, c.column_name;