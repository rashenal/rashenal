-- 🔍 FIND OUR DEVELOPMENT TASKS
-- Let's see exactly where the 6 tasks we created are located

-- Step 1: Find our 6 development tasks specifically
SELECT 
    '🎯 OUR 6 DEVELOPMENT TASKS:' as info,
    t.id,
    t.title,
    t.taskboard_id,
    tb.name as taskboard_name,
    t.status,
    t.position,
    COALESCE(t.task_id, 'NO TASK ID') as human_readable_id,
    t.created_at
FROM tasks t
JOIN taskboards tb ON t.taskboard_id = tb.id
WHERE t.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND (
    t.title ILIKE '%Deploy Enhanced Taskboards%'
    OR t.title ILIKE '%Test Enhanced Taskboard Manager%'
    OR t.title ILIKE '%Test Business Template%'
    OR t.title ILIKE '%Test Navigation%'
    OR t.title ILIKE '%Enterprise Performance%'
    OR t.title ILIKE '%Automated Test Suite%'
)
ORDER BY t.created_at DESC;

-- Step 2: Show ALL Feature Build Hopper taskboards and their details
SELECT 
    '🔍 ALL FEATURE BUILD HOPPER TASKBOARDS:' as info,
    tb.id,
    tb.name,
    tb.created_at,
    tb.task_counter,
    COUNT(t.id) as actual_tasks,
    tb.category,
    tb.priority,
    tb.is_archived,
    tb.is_active
FROM taskboards tb
LEFT JOIN tasks t ON tb.id = t.taskboard_id
WHERE tb.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND tb.name ILIKE '%Feature Build Hopper%'
GROUP BY tb.id, tb.name, tb.created_at, tb.task_counter, tb.category, tb.priority, tb.is_archived, tb.is_active
ORDER BY tb.created_at DESC;

-- Step 3: Check task_id field structure
SELECT 
    '📋 TASK ID FIELD CHECK:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
AND column_name ILIKE '%task_id%'
ORDER BY column_name;

-- Step 4: Show a few recent tasks to see task_id format
SELECT 
    '🆔 RECENT TASKS WITH IDs:' as info,
    t.title,
    COALESCE(t.task_id, 'NO TASK ID') as human_readable_id,
    t.id as uuid,
    tb.name as taskboard_name,
    t.created_at
FROM tasks t
JOIN taskboards tb ON t.taskboard_id = tb.id
WHERE t.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 5: Identify which Feature Build Hopper should be the main one
SELECT 
    '🏆 RECOMMENDED MAIN FEATURE BUILD HOPPER:' as info,
    tb.id,
    tb.name,
    tb.created_at,
    tb.task_counter,
    COUNT(t.id) as actual_tasks,
    tb.is_active,
    tb.is_archived,
    CASE 
        WHEN tb.is_active = true AND tb.is_archived = false THEN 'KEEP THIS ONE'
        WHEN COUNT(t.id) > 0 THEN 'HAS TASKS'
        ELSE 'CONSIDER REMOVING'
    END as recommendation
FROM taskboards tb
LEFT JOIN tasks t ON tb.id = t.taskboard_id
WHERE tb.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND tb.name ILIKE '%Feature Build Hopper%'
GROUP BY tb.id, tb.name, tb.created_at, tb.task_counter, tb.is_active, tb.is_archived
ORDER BY tb.is_active DESC, COUNT(t.id) DESC, tb.created_at DESC;
