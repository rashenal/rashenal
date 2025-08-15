-- 🔧 UPDATE ENHANCED TASKBOARDS VIEW
-- Add missing columns that the frontend expects

-- Drop and recreate the view with all required columns
DROP VIEW IF EXISTS enhanced_taskboard_analytics;

CREATE OR REPLACE VIEW enhanced_taskboard_analytics AS
SELECT 
    -- Base taskboard columns
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
    tb.color,
    tb.is_favorite,
    tb.is_archived,
    tb.is_active,
    tb.task_counter,
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
    
    -- Time Estimates (convert minutes to hours)
    COALESCE(ROUND(task_stats.total_estimated_time / 60.0, 1), 0) as total_estimated_hours,
    COALESCE(ROUND(task_stats.remaining_estimated_time / 60.0, 1), 0) as remaining_estimated_hours,
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
        THEN ROUND((tb.revenue_target / tb.budget) * 100, 1)
        ELSE 0
    END as roi_percentage,
    
    -- Status Indicators
    CASE 
        WHEN tb.target_date < CURRENT_DATE THEN 'overdue'
        WHEN tb.target_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        WHEN COALESCE(task_stats.completed_tasks, 0) = COALESCE(task_stats.total_tasks, 0) AND task_stats.total_tasks > 0 THEN 'completed'
        WHEN COALESCE(task_stats.in_progress_tasks, 0) > 0 THEN 'active'
        ELSE 'planning'
    END as status,
    
    -- Days remaining/overdue
    CASE 
        WHEN tb.target_date IS NOT NULL 
        THEN (tb.target_date - CURRENT_DATE)
        ELSE NULL
    END as days_until_target,
    
    -- Behind schedule indicator
    CASE 
        WHEN tb.target_date IS NOT NULL AND tb.target_date < CURRENT_DATE THEN true
        ELSE false
    END as is_behind_schedule,
    
    -- Actual task count (vs task_counter which might be different)
    COALESCE(task_stats.total_tasks, 0) as actual_task_count

FROM taskboards tb
LEFT JOIN (
    SELECT 
        taskboard_id,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status IN ('todo', 'backlog')) as todo_tasks,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_tasks,
        SUM(COALESCE(estimated_time, 0)) as total_estimated_time,
        SUM(CASE WHEN status != 'done' THEN COALESCE(estimated_time, 0) ELSE 0 END) as remaining_estimated_time
    FROM tasks 
    GROUP BY taskboard_id
) task_stats ON tb.id = task_stats.taskboard_id;

-- Grant permissions on the view
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

-- Test the view
SELECT 
    '✅ VIEW UPDATED SUCCESSFULLY' as status,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE is_archived = false) as active_projects,
    COUNT(*) FILTER (WHERE total_tasks > 0) as projects_with_tasks
FROM enhanced_taskboard_analytics;

-- Show your projects with the new view
SELECT 
    '📊 YOUR PROJECTS' as info,
    name,
    category,
    priority,
    total_tasks,
    completed_tasks,
    completion_percentage || '%' as completion,
    COALESCE(budget::text, 'No budget') as budget,
    COALESCE(revenue_target::text, 'No target') as revenue_target,
    status,
    is_archived,
    is_active
FROM enhanced_taskboard_analytics
WHERE user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY updated_at DESC;
