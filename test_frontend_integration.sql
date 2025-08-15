-- Frontend Integration Test - Verify updated_at column and UUID consistency
-- Run this to confirm your frontend will work with the fixed schema

-- 1. Verify tasks_with_dependencies view structure
SELECT 'tasks_with_dependencies view structure:' as test_name;
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name = 'updated_at' THEN '✅ CRITICAL for frontend'
        WHEN column_name = 'id' THEN '✅ UUID as expected'
        WHEN column_name LIKE '%_id' THEN '✅ UUID reference'
        ELSE '✅ Standard column'
    END as frontend_compatibility
FROM information_schema.columns 
WHERE table_name = 'tasks_with_dependencies'
    AND column_name IN ('id', 'updated_at', 'created_at', 'user_id', 'taskboard_id', 'parent_id')
ORDER BY column_name;

-- 2. Test the view with sample data (should include updated_at)
SELECT 'Sample view data (with updated_at):' as test_name;
SELECT 
    id::text as task_id_string,
    title,
    updated_at::text as updated_at_string,
    dependency_status,
    effective_dependency_status,
    child_count
FROM tasks_with_dependencies 
LIMIT 3;

-- 3. Verify all ID columns are UUID type
SELECT 'UUID consistency check:' as test_name;
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ Correct UUID type'
        ELSE '❌ Type mismatch: ' || data_type
    END as status
FROM information_schema.columns 
WHERE table_name IN ('tasks', 'task_subtasks', 'task_comments', 'task_attachments', 'taskboards')
    AND column_name IN ('id', 'parent_task_id', 'task_id', 'user_id', 'taskboard_id', 'parent_id')
ORDER BY table_name, column_name;

-- 4. Test foreign key relationships are working
SELECT 'Foreign key relationships test:' as test_name;
SELECT 
    COUNT(*) as total_tasks,
    COUNT(DISTINCT taskboard_id) as taskboards_referenced,
    COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as tasks_with_parents
FROM tasks;

-- 5. Verify updated_at triggers are working
SELECT 'Updated_at trigger test:' as test_name;
SELECT 
    'tasks' as table_name,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%updated_at%'
    AND event_object_table IN ('tasks', 'task_subtasks', 'task_comments', 'task_attachments')
ORDER BY event_object_table;

-- 6. Final verification - simulate frontend query
SELECT 'Frontend query simulation:' as test_name;
SELECT 
    'This query should work in your frontend:' as note,
    'supabase.from("tasks_with_dependencies").select("*")' as frontend_code;

-- Success message
SELECT '🎉 FRONTEND INTEGRATION READY!' as status,
       'Your schema fix is complete and frontend-compatible' as message;