-- 🔧 COMPLETE TASKBOARDS TABLE AND VIEW FIX
-- This script checks what exists and adds missing columns safely

-- Step 1: Add missing columns to taskboards table (if they don't exist)
DO $$ 
BEGIN
    -- Add is_favorite column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'taskboards' AND column_name = 'is_favorite') THEN
        ALTER TABLE taskboards ADD COLUMN is_favorite BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_favorite column';
    ELSE
        RAISE NOTICE 'is_favorite column already exists';
    END IF;

    -- Add is_archived column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'taskboards' AND column_name = 'is_archived') THEN
        ALTER TABLE taskboards ADD COLUMN is_archived BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_archived column';
    ELSE
        RAISE NOTICE 'is_archived column already exists';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'taskboards' AND column_name = 'is_active') THEN
        ALTER TABLE taskboards ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;

    -- Add color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'taskboards' AND column_name = 'color') THEN
        ALTER TABLE taskboards ADD COLUMN color TEXT DEFAULT '#8B5CF6';
        RAISE NOTICE 'Added color column';
    ELSE
        RAISE NOTICE 'color column already exists';
    END IF;

    -- Add position column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'taskboards' AND column_name = 'position') THEN
        ALTER TABLE taskboards ADD COLUMN position INTEGER DEFAULT 0;
        RAISE NOTICE 'Added position column';
    ELSE
        RAISE NOTICE 'position column already exists';
    END IF;

    -- Add completion_percentage column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'taskboards' AND column_name = 'completion_percentage') THEN
        ALTER TABLE taskboards ADD COLUMN completion_percentage DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE 'Added completion_percentage column';
    ELSE
        RAISE NOTICE 'completion_percentage column already exists';
    END IF;
END $$;

-- Step 2: Update existing taskboards with better defaults based on their names
UPDATE taskboards 
SET 
    category = CASE 
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' OR name ILIKE '%hopper%' OR name ILIKE '%development%' THEN 'product'
        WHEN name ILIKE '%marketing%' OR name ILIKE '%campaign%' THEN 'marketing'
        WHEN name ILIKE '%revenue%' OR name ILIKE '%sales%' THEN 'revenue'
        WHEN name ILIKE '%operations%' OR name ILIKE '%ops%' THEN 'operations'
        WHEN name ILIKE '%personal%' OR name ILIKE '%learning%' THEN 'personal'
        ELSE 'other'
    END,
    priority = CASE 
        WHEN name ILIKE '%urgent%' OR name ILIKE '%critical%' OR name ILIKE '%asap%' THEN 'urgent'
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' OR name ILIKE '%important%' THEN 'high'
        WHEN name ILIKE '%nice%' OR name ILIKE '%later%' THEN 'low'
        ELSE 'medium'
    END,
    budget = CASE 
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' OR name ILIKE '%development%' THEN 10000
        WHEN name ILIKE '%marketing%' OR name ILIKE '%campaign%' THEN 5000
        WHEN name ILIKE '%revenue%' THEN 15000
        ELSE 3000
    END,
    revenue_target = CASE 
        WHEN name ILIKE '%feature%' OR name ILIKE '%build%' OR name ILIKE '%development%' THEN 50000
        WHEN name ILIKE '%marketing%' OR name ILIKE '%campaign%' THEN 25000
        WHEN name ILIKE '%revenue%' THEN 75000
        ELSE 15000
    END,
    color = CASE 
        WHEN category = 'product' THEN '#F59E0B'
        WHEN category = 'marketing' THEN '#8B5CF6'
        WHEN category = 'revenue' THEN '#10B981'
        WHEN category = 'operations' THEN '#3B82F6'
        WHEN category = 'personal' THEN '#EC4899'
        ELSE '#6B7280'
    END,
    start_date = COALESCE(start_date, CURRENT_DATE),
    target_date = COALESCE(target_date, CURRENT_DATE + INTERVAL '90 days'),
    is_active = COALESCE(is_active, true),
    is_archived = COALESCE(is_archived, false),
    is_favorite = COALESCE(is_favorite, 
        CASE WHEN name ILIKE '%feature%' OR name ILIKE '%build%' THEN true ELSE false END
    )
WHERE budget IS NULL OR category IS NULL OR color IS NULL;

-- Step 3: Now create the enhanced view with all columns
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
    tb.position,
    tb.completion_percentage as stored_completion_percentage,
    tb.task_counter,
    tb.created_at,
    tb.updated_at,
    
    -- Task Statistics
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    COALESCE(task_stats.in_progress_tasks, 0) as in_progress_tasks,
    COALESCE(task_stats.todo_tasks, 0) as todo_tasks,
    COALESCE(task_stats.blocked_tasks, 0) as blocked_tasks,
    
    -- Calculated Progress (overrides stored value)
    CASE 
        WHEN COALESCE(task_stats.total_tasks, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(task_stats.completed_tasks, 0)::DECIMAL / task_stats.total_tasks) * 100, 1)
    END as completion_percentage,
    
    -- Time Estimates
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

-- Grant permissions
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

-- Step 4: Show current taskboards table schema
SELECT 
    '📋 CURRENT TASKBOARDS SCHEMA:' as info,
    column_name,
    data_type,
    is_nullable,
    COALESCE(column_default, 'No default') as column_default
FROM information_schema.columns 
WHERE table_name = 'taskboards' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Test the view and show results
SELECT 
    '✅ ENHANCED VIEW WORKING:' as status,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE is_archived = false) as active_projects,
    COUNT(*) FILTER (WHERE total_tasks > 0) as projects_with_tasks
FROM enhanced_taskboard_analytics;

-- Step 6: Show your projects
SELECT 
    '🎯 YOUR PROJECTS:' as info,
    name,
    category,
    priority,
    total_tasks,
    completed_tasks,
    completion_percentage || '%' as completion,
    '$' || COALESCE(budget::text, '0') as budget,
    '$' || COALESCE(revenue_target::text, '0') as revenue_target,
    status,
    is_favorite,
    roi_percentage || '%' as roi
FROM enhanced_taskboard_analytics
WHERE user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY is_favorite DESC, priority DESC, updated_at DESC;
