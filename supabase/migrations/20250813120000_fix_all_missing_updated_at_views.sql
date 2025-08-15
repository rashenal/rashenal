-- Comprehensive fix for ALL missing updated_at columns in views
-- Date: 2025-08-13
-- Description: Creates enhanced_taskboard_analytics and fixes any other missing updated_at issues

BEGIN;

-- ==============================================
-- 1. DROP AND RECREATE enhanced_taskboard_analytics
-- ==============================================

-- Drop the view if it exists (it might be broken)
DROP VIEW IF EXISTS enhanced_taskboard_analytics CASCADE;

-- Create enhanced_taskboard_analytics view with proper updated_at column
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
    
    -- Priority distribution
    COUNT(CASE WHEN t.priority = 'low' THEN 1 END) as low_priority_tasks,
    COUNT(CASE WHEN t.priority = 'medium' THEN 1 END) as medium_priority_tasks,
    COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_tasks,
    COUNT(CASE WHEN t.priority = 'urgent' THEN 1 END) as urgent_priority_tasks,
    
    -- Energy level distribution
    COUNT(CASE WHEN t.energy_level = 'xs' THEN 1 END) as xs_energy_tasks,
    COUNT(CASE WHEN t.energy_level = 's' THEN 1 END) as s_energy_tasks,
    COUNT(CASE WHEN t.energy_level = 'm' THEN 1 END) as m_energy_tasks,
    COUNT(CASE WHEN t.energy_level = 'l' THEN 1 END) as l_energy_tasks,
    COUNT(CASE WHEN t.energy_level = 'xl' THEN 1 END) as xl_energy_tasks,
    
    -- Value metrics
    AVG(t.business_value) as avg_business_value,
    AVG(t.personal_value) as avg_personal_value,
    AVG(t.estimated_duration) as avg_estimated_duration,
    SUM(t.estimated_duration) as total_estimated_duration,
    
    -- Time tracking
    MIN(t.created_at) as first_task_created,
    MAX(t.updated_at) as last_task_updated,
    
    -- Activity metrics
    COUNT(CASE WHEN t.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as tasks_created_last_7_days,
    COUNT(CASE WHEN t.updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as tasks_updated_last_7_days,
    COUNT(CASE WHEN t.status = 'done' AND t.updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as tasks_completed_last_7_days,
    
    -- Dependency metrics
    COUNT(CASE WHEN t.has_children = true THEN 1 END) as parent_tasks,
    COUNT(CASE WHEN t.parent_id IS NOT NULL AND t.parent_id != t.id THEN 1 END) as child_tasks,
    COUNT(CASE WHEN t.dependency_status = 'blocked' THEN 1 END) as dependency_blocked_tasks,
    
    -- Overdue tasks (if due_date is past)
    COUNT(CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN 1 END) as overdue_tasks,
    
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

-- ==============================================
-- 2. CREATE OTHER MISSING ANALYTICS VIEWS
-- ==============================================

-- Create user_task_analytics view (in case it's needed)
DROP VIEW IF EXISTS user_task_analytics CASCADE;
CREATE VIEW user_task_analytics AS
SELECT 
    u.id as user_id,
    u.email,
    
    -- Task counts across all taskboards
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status IN ('todo', 'in_progress') THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
    
    -- Productivity metrics
    CASE 
        WHEN COUNT(t.id) > 0 
        THEN ROUND((COUNT(CASE WHEN t.status = 'done' THEN 1 END)::DECIMAL / COUNT(t.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as overall_completion_rate,
    
    -- Time metrics
    SUM(t.estimated_duration) as total_estimated_time,
    AVG(t.estimated_duration) as avg_task_duration,
    
    -- Value metrics
    AVG(t.business_value) as avg_business_value,
    AVG(t.personal_value) as avg_personal_value,
    
    -- Activity metrics
    COUNT(CASE WHEN t.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as tasks_created_last_30_days,
    COUNT(CASE WHEN t.updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as tasks_updated_last_7_days,
    
    -- Taskboard count
    COUNT(DISTINCT t.taskboard_id) as active_taskboards,
    
    -- Latest activity
    MAX(t.updated_at) as last_task_activity,
    
    -- Updated timestamp - CRITICAL
    COALESCE(MAX(t.updated_at), NOW()) as updated_at
    
FROM auth.users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.email;

-- ==============================================
-- 3. CREATE TASK_PROGRESS_ANALYTICS VIEW
-- ==============================================

-- Task progress analytics with updated_at
DROP VIEW IF EXISTS task_progress_analytics CASCADE;
CREATE VIEW task_progress_analytics AS
SELECT 
    t.id as task_id,
    t.title,
    t.taskboard_id,
    t.user_id,
    t.status,
    t.priority,
    t.energy_level,
    t.business_value,
    t.personal_value,
    t.estimated_duration,
    t.created_at as task_created_at,
    t.updated_at as task_updated_at, -- CRITICAL
    
    -- Progress metrics
    CASE WHEN t.status = 'done' THEN 100 ELSE 0 END as completion_percentage,
    
    -- Time since creation
    EXTRACT(DAYS FROM NOW() - t.created_at) as days_since_created,
    EXTRACT(DAYS FROM NOW() - t.updated_at) as days_since_updated,
    
    -- Overdue status
    CASE 
        WHEN t.due_date IS NOT NULL AND t.due_date < NOW() AND t.status != 'done' 
        THEN true 
        ELSE false 
    END as is_overdue,
    
    -- Days until due (negative if overdue)
    CASE 
        WHEN t.due_date IS NOT NULL 
        THEN EXTRACT(DAYS FROM t.due_date - NOW())::INTEGER
        ELSE NULL 
    END as days_until_due,
    
    -- Dependencies
    t.dependency_status,
    t.has_children,
    CASE WHEN t.parent_id IS NOT NULL AND t.parent_id != t.id THEN true ELSE false END as is_child_task,
    
    -- Taskboard info
    tb.name as taskboard_name,
    tb.abbreviation as taskboard_abbreviation,
    
    -- Updated timestamp for the view
    GREATEST(t.updated_at, tb.updated_at) as updated_at -- CRITICAL
    
FROM tasks t
LEFT JOIN taskboards tb ON t.taskboard_id = tb.id;

-- ==============================================
-- 4. FIX ANY OTHER VIEWS MISSING UPDATED_AT
-- ==============================================

-- Check if tasks_with_dependencies view needs updating (it should have been fixed already)
DROP VIEW IF EXISTS tasks_with_dependencies CASCADE;
CREATE VIEW tasks_with_dependencies AS
SELECT 
    t.id,
    t.task_number,
    t.title,
    t.description,
    t.user_id,
    t.taskboard_id,
    t.status,
    t.priority,
    t.position,
    t.parent_id,
    t.blocked_by,
    t.has_children,
    t.dependency_status,
    t.energy_level,
    t.business_value,
    t.personal_value,
    t.estimated_duration,
    t.due_date,
    t.tags,
    t.created_at,
    t.updated_at, -- CRITICAL: This ensures updated_at is included
    -- Additional derived columns
    tb.abbreviation as board_abbreviation,
    tb.name as board_name,
    p.task_number as parent_task_number,
    p.title as parent_title,
    p.status as parent_status,
    CASE 
        WHEN t.parent_id = t.id OR t.parent_id IS NULL THEN 'independent'
        WHEN p.status = 'done' THEN 'unblocked'
        ELSE 'blocked'
    END as effective_dependency_status,
    (
        SELECT COUNT(*) 
        FROM tasks c 
        WHERE c.parent_id = t.id AND c.id != t.id
    ) as child_count
FROM tasks t
LEFT JOIN taskboards tb ON t.taskboard_id = tb.id
LEFT JOIN tasks p ON t.parent_id = p.id AND t.parent_id != t.id;

-- ==============================================
-- 5. GRANT PERMISSIONS
-- ==============================================

-- Grant permissions on all analytics views
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;
GRANT SELECT ON user_task_analytics TO authenticated;
GRANT SELECT ON task_progress_analytics TO authenticated;
GRANT SELECT ON tasks_with_dependencies TO authenticated;

-- ==============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for better analytics performance (on base tables)
CREATE INDEX IF NOT EXISTS idx_tasks_status_updated_at ON tasks(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_updated_at ON tasks(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_taskboard_updated_at ON tasks(taskboard_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_taskboards_user_updated_at ON taskboards(user_id, updated_at DESC);

-- ==============================================
-- 7. ADD HELPFUL COMMENTS
-- ==============================================

COMMENT ON VIEW enhanced_taskboard_analytics IS 'Comprehensive analytics for taskboards including task counts, progress, and activity metrics';
COMMENT ON VIEW user_task_analytics IS 'User-level task analytics and productivity metrics across all taskboards';
COMMENT ON VIEW task_progress_analytics IS 'Individual task progress and status analytics with due date tracking';
COMMENT ON VIEW tasks_with_dependencies IS 'Enhanced task view with dependency information and updated_at column';

COMMIT;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

SELECT 'Analytics views created successfully!' as status;

-- Verify enhanced_taskboard_analytics has updated_at
SELECT 'enhanced_taskboard_analytics structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enhanced_taskboard_analytics' 
    AND column_name IN ('updated_at', 'taskboard_updated_at', 'last_task_updated')
ORDER BY column_name;

-- Test the view
SELECT 'Sample data from enhanced_taskboard_analytics:' as info;
SELECT 
    taskboard_name,
    total_tasks,
    completion_percentage,
    updated_at
FROM enhanced_taskboard_analytics 
LIMIT 3;