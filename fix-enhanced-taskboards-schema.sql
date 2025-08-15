-- 🚀 FIX ENHANCED TASKBOARDS SCHEMA
-- Add missing columns and views to make Projects work properly

-- Step 1: Add missing columns to taskboards table
ALTER TABLE taskboards 
ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue_target DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Step 2: Update existing taskboards with sensible defaults
UPDATE taskboards 
SET 
    category = CASE 
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' OR name ILIKE '%hopper%' THEN 'Product Development'
        WHEN name ILIKE '%marketing%' THEN 'Marketing'
        WHEN name ILIKE '%revenue%' OR name ILIKE '%sales%' THEN 'Revenue'
        ELSE 'General'
    END,
    priority = CASE 
        WHEN name ILIKE '%urgent%' OR name ILIKE '%critical%' THEN 'high'
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' THEN 'high'
        ELSE 'medium'
    END,
    budget = CASE 
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' THEN 10000
        WHEN name ILIKE '%marketing%' THEN 5000
        ELSE 2000
    END,
    revenue_target = CASE 
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' THEN 50000
        WHEN name ILIKE '%marketing%' THEN 25000
        ELSE 10000
    END,
    start_date = CURRENT_DATE,
    target_date = CURRENT_DATE + INTERVAL '90 days'
WHERE category IS NULL OR budget IS NULL;

-- Step 3: Create the enhanced_taskboard_analytics view
CREATE OR REPLACE VIEW enhanced_taskboard_analytics AS
SELECT 
    tb.id,
    tb.user_id,
    tb.name,
    tb.description,
    tb.category,
    tb.priority,
    tb.budget,
    tb.revenue_target,
    tb.start_date,
    tb.target_date,
    tb.created_at,
    tb.updated_at,
    
    -- Task Statistics
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    COALESCE(task_stats.in_progress_tasks, 0) as in_progress_tasks,
    COALESCE(task_stats.todo_tasks, 0) as todo_tasks,
    COALESCE(task_stats.blocked_tasks, 0) as blocked_tasks,
    
    -- Progress Calculations
    CASE 
        WHEN COALESCE(task_stats.total_tasks, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(task_stats.completed_tasks, 0)::DECIMAL / task_stats.total_tasks) * 100, 1)
    END as completion_percentage,
    
    -- Time Estimates
    COALESCE(task_stats.total_estimated_time, 0) as total_estimated_time,
    COALESCE(task_stats.remaining_estimated_time, 0) as remaining_estimated_time,
    
    -- Business Intelligence
    CASE 
        WHEN tb.budget > 0 AND task_stats.total_tasks > 0 
        THEN ROUND(tb.budget / task_stats.total_tasks, 2)
        ELSE 0
    END as budget_per_task,
    
    CASE 
        WHEN tb.revenue_target > 0 AND tb.budget > 0 
        THEN ROUND((tb.revenue_target / tb.budget), 2)
        ELSE 0
    END as roi_ratio,
    
    -- Status Indicators
    CASE 
        WHEN tb.target_date < CURRENT_DATE THEN 'overdue'
        WHEN tb.target_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        WHEN COALESCE(task_stats.completed_tasks, 0) = COALESCE(task_stats.total_tasks, 0) AND task_stats.total_tasks > 0 THEN 'completed'
        WHEN COALESCE(task_stats.in_progress_tasks, 0) > 0 THEN 'active'
        ELSE 'planning'
    END as status,
    
    -- Days remaining
    CASE 
        WHEN tb.target_date IS NOT NULL 
        THEN GREATEST(0, (tb.target_date - CURRENT_DATE))
        ELSE NULL
    END as days_remaining

FROM taskboards tb
LEFT JOIN (
    SELECT 
        taskboard_id,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'todo' OR status = 'backlog') as todo_tasks,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_tasks,
        SUM(COALESCE(estimated_time, 0)) as total_estimated_time,
        SUM(CASE WHEN status != 'done' THEN COALESCE(estimated_time, 0) ELSE 0 END) as remaining_estimated_time
    FROM tasks 
    GROUP BY taskboard_id
) task_stats ON tb.id = task_stats.taskboard_id;

-- Step 4: Grant permissions on the view
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

-- Step 5: Verification - Show what we created
SELECT 
    '✅ SCHEMA UPDATES COMPLETE' as status,
    COUNT(*) as taskboards_updated,
    COUNT(*) FILTER (WHERE budget > 0) as boards_with_budget,
    COUNT(*) FILTER (WHERE category != 'General') as categorized_boards
FROM taskboards;

-- Show the analytics view working
SELECT 
    '📊 ENHANCED ANALYTICS PREVIEW' as info,
    name,
    category,
    priority,
    budget,
    revenue_target,
    total_tasks,
    completion_percentage || '%' as completion,
    status,
    days_remaining
FROM enhanced_taskboard_analytics
WHERE user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY priority DESC, created_at DESC;
