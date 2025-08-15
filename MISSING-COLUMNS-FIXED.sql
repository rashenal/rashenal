-- ✅ QUICK FIX: Add missing columns to enhanced_taskboard_analytics view
-- This addresses the "column updated_at does not exist" error

DROP VIEW IF EXISTS enhanced_taskboard_analytics;

CREATE VIEW enhanced_taskboard_analytics AS
SELECT 
    t.id,
    t.user_id,
    t.name,
    t.description,
    t.category,
    t.priority,
    t.revenue_target,
    t.budget,
    t.completion_percentage,
    t.target_date,
    t.start_date,
    t.color,
    t.is_favorite,
    t.is_archived,
    t.task_counter,
    t.created_at,        -- ✅ MISSING: Frontend expects this
    t.updated_at,        -- ✅ MISSING: Frontend expects this  
    t.is_active,         -- ✅ MISSING: Might be used in filtering
    COALESCE(task_stats.total_tasks, 0) as actual_task_count,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    COALESCE(task_stats.total_estimated_hours, 0) as total_estimated_hours,
    
    -- Behind schedule detection
    CASE 
        WHEN t.target_date IS NOT NULL AND t.target_date < CURRENT_DATE AND COALESCE(t.completion_percentage, 0) < 100 
        THEN true 
        ELSE false 
    END as is_behind_schedule,
    
    -- Days calculation (returns integer directly)
    CASE 
        WHEN t.target_date IS NOT NULL 
        THEN (t.target_date - CURRENT_DATE)
        ELSE NULL 
    END as days_until_target,
    
    -- ROI calculation
    CASE 
        WHEN t.budget IS NOT NULL AND t.revenue_target IS NOT NULL AND t.budget > 0
        THEN ROUND(((t.revenue_target - t.budget) / t.budget * 100)::numeric, 2)
        ELSE NULL 
    END as roi_percentage
FROM taskboards t
LEFT JOIN (
    SELECT 
        taskboard_id,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        SUM(COALESCE(estimated_time, 0)) as total_estimated_hours
    FROM tasks 
    GROUP BY taskboard_id
) task_stats ON t.id = task_stats.taskboard_id
WHERE COALESCE(t.is_active, true) = true;

-- Grant access to the view
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

-- Verification
SELECT '✅ VIEW UPDATED WITH MISSING COLUMNS!' as status;
SELECT 'Column test:' as test, updated_at, created_at FROM enhanced_taskboard_analytics LIMIT 1;
