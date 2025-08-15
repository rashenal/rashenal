-- Quick manual fix for enhanced_taskboard_analytics missing updated_at
-- Paste this directly into: supabase db remote sql

BEGIN;

-- Drop and recreate enhanced_taskboard_analytics with updated_at
DROP VIEW IF EXISTS enhanced_taskboard_analytics CASCADE;

CREATE VIEW enhanced_taskboard_analytics AS
SELECT 
    tb.id as taskboard_id,
    tb.name as taskboard_name,
    tb.description as taskboard_description,
    tb.user_id,
    tb.created_at as taskboard_created_at,
    tb.updated_at as taskboard_updated_at, -- CRITICAL: Include updated_at
    
    -- Task statistics
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
    COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
    
    -- Progress metrics
    CASE 
        WHEN COUNT(t.id) > 0 
        THEN ROUND((COUNT(CASE WHEN t.status = 'done' THEN 1 END)::DECIMAL / COUNT(t.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as completion_percentage,
    
    -- Updated timestamp for the analytics view itself
    GREATEST(tb.updated_at, MAX(t.updated_at)) as updated_at -- CRITICAL: This ensures updated_at exists
    
FROM taskboards tb
LEFT JOIN tasks t ON tb.id = t.taskboard_id
GROUP BY 
    tb.id, 
    tb.name, 
    tb.description, 
    tb.user_id, 
    tb.created_at, 
    tb.updated_at;

-- Grant permissions
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

COMMIT;

-- Test the view
SELECT 'enhanced_taskboard_analytics created successfully!' as status;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'enhanced_taskboard_analytics' AND column_name = 'updated_at';