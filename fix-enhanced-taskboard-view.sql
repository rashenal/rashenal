-- Fix the enhanced_taskboard_analytics view to properly include all columns
-- This fixes the missing ID issue in the view

-- First, drop the existing view if it exists
DROP VIEW IF EXISTS enhanced_taskboard_analytics CASCADE;

-- Recreate the view with proper column selection and grouping
CREATE OR REPLACE VIEW enhanced_taskboard_analytics AS
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
    t.is_active,
    t.task_counter,
    t.created_at,
    t.updated_at,
    COUNT(tasks.id) as actual_task_count,
    COUNT(CASE WHEN tasks.status = 'done' THEN 1 END) as completed_tasks,
    SUM(COALESCE(tasks.estimated_time, 0)) as total_estimated_hours,
    CASE 
        WHEN t.target_date IS NOT NULL AND t.target_date < CURRENT_DATE AND t.completion_percentage < 100 
        THEN true 
        ELSE false 
    END as is_behind_schedule,
    CASE 
        WHEN t.target_date IS NOT NULL 
        THEN DATE_PART('day', t.target_date - CURRENT_DATE)::INTEGER 
        ELSE NULL 
    END as days_until_target,
    CASE 
        WHEN t.budget IS NOT NULL AND t.revenue_target IS NOT NULL AND t.budget > 0
        THEN ROUND(((t.revenue_target - t.budget) / t.budget * 100)::numeric, 2)
        ELSE NULL 
    END as roi_percentage
FROM taskboards t
LEFT JOIN tasks ON tasks.taskboard_id = t.id
WHERE t.is_active = true
GROUP BY 
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
    t.is_active,
    t.task_counter,
    t.created_at,
    t.updated_at;

-- Grant access to the view
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

-- If you need to test that the view is working properly, run this query:
-- It should return your taskboards WITH their IDs
SELECT id, name, category, priority FROM enhanced_taskboard_analytics LIMIT 5;