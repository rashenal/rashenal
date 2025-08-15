-- 🔍 DEBUG TASK LINKING ISSUE
-- Check why tasks aren't showing up in the taskboard view

-- Step 1: Check your taskboards and their IDs
SELECT 
    '🎯 YOUR TASKBOARDS:' as info,
    id,
    name,
    task_counter,
    category,
    created_at
FROM taskboards 
WHERE user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY name;

-- Step 2: Check your tasks and which taskboard they belong to
SELECT 
    '📝 YOUR TASKS:' as info,
    t.id,
    t.title,
    t.taskboard_id,
    tb.name as taskboard_name,
    t.status,
    t.created_at
FROM tasks t
JOIN taskboards tb ON t.taskboard_id = tb.id
WHERE t.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY t.created_at DESC;

-- Step 3: Check the enhanced view data
SELECT 
    '📊 ENHANCED VIEW DATA:' as info,
    name,
    total_tasks,
    completed_tasks,
    task_counter,
    actual_task_count,
    id
FROM enhanced_taskboard_analytics 
WHERE user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY name;

-- Step 4: Check if there's a mismatch between task_counter and actual tasks
SELECT 
    '🔍 TASK COUNT ANALYSIS:' as info,
    tb.name,
    tb.id as taskboard_id,
    tb.task_counter as stored_counter,
    COUNT(t.id) as actual_task_count,
    CASE 
        WHEN tb.task_counter != COUNT(t.id) THEN 'MISMATCH!' 
        ELSE 'OK' 
    END as status
FROM taskboards tb
LEFT JOIN tasks t ON tb.id = t.taskboard_id
WHERE tb.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
GROUP BY tb.id, tb.name, tb.task_counter
ORDER BY tb.name;
