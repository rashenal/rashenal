-- 🎯 QUICK FIX FOR FEATURE BUILD HOPPER
-- Clean up the duplicate and fix the routing

-- Step 1: Verify which taskboard has our development tasks
SELECT 
    '✅ CONFIRM TASKBOARD WITH OUR TASKS:' as info,
    tb.id,
    tb.name,
    tb.created_at,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.title ILIKE '%Deploy Enhanced%' OR t.title ILIKE '%Test Enhanced%') as dev_tasks,
    tb.is_active,
    tb.is_archived
FROM taskboards tb
LEFT JOIN tasks t ON tb.id = t.taskboard_id
WHERE tb.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND tb.name ILIKE '%Feature Build Hopper%'
GROUP BY tb.id, tb.name, tb.created_at, tb.is_active, tb.is_archived
ORDER BY COUNT(t.id) FILTER (WHERE t.title ILIKE '%Deploy Enhanced%' OR t.title ILIKE '%Test Enhanced%') DESC;

-- Step 2: Fix the task counter mismatch for the main taskboard
UPDATE taskboards 
SET task_counter = (
    SELECT COUNT(*) 
    FROM tasks 
    WHERE taskboard_id = taskboards.id
)
WHERE id = '6d042ba6-04df-42e5-b708-45ca4bf39527'
AND user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65';

-- Step 3: Archive or deactivate the duplicate taskboard (the one without our dev tasks)
UPDATE taskboards 
SET 
    is_active = false,
    is_archived = true,
    updated_at = NOW()
WHERE id = 'aca877a0-dd0c-4eff-909f-372c7806dee8'
AND user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND name ILIKE '%Feature Build Hopper%';

-- Step 4: Ensure the main taskboard is active and updated
UPDATE taskboards 
SET 
    is_active = true,
    is_archived = false,
    updated_at = NOW()
WHERE id = '6d042ba6-04df-42e5-b708-45ca4bf39527'
AND user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65';

-- Step 5: Verify the fix
SELECT 
    '🎯 AFTER CLEANUP:' as info,
    tb.name,
    tb.id,
    tb.is_active,
    tb.is_archived,
    tb.task_counter as stored_counter,
    COUNT(t.id) as actual_tasks,
    COUNT(t.id) FILTER (WHERE t.task_uid ILIKE 'FEAB-%') as feab_tasks
FROM taskboards tb
LEFT JOIN tasks t ON tb.id = t.taskboard_id
WHERE tb.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND tb.name ILIKE '%Feature Build Hopper%'
GROUP BY tb.id, tb.name, tb.is_active, tb.is_archived, tb.task_counter
ORDER BY tb.is_active DESC, COUNT(t.id) DESC;
