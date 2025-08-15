-- ✅ CORRECTED: Fix existing data BEFORE adding constraints
-- This handles the constraint violation error properly

-- 1. Add missing columns to tasks table (NO foreign key constraints)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accountability_email TEXT;

-- 2. Add column limits to taskboards 
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS column_limits JSONB DEFAULT '{"todo": 5, "in_progress": 3}';

-- 3. Add business intelligence columns WITHOUT constraints initially
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2);
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS revenue_target DECIMAL(12,2);
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 4. FIRST: Check what category values currently exist
SELECT 'Current category values:' as info, category, COUNT(*) as count 
FROM taskboards 
GROUP BY category 
ORDER BY count DESC;

-- 5. FIX ALL EXISTING DATA to match constraint values
UPDATE taskboards 
SET 
    category = CASE 
        WHEN category IS NULL THEN 'other'
        WHEN LOWER(category) LIKE '%revenue%' OR LOWER(category) LIKE '%sales%' OR LOWER(category) LIKE '%income%' THEN 'revenue'
        WHEN LOWER(category) LIKE '%marketing%' OR LOWER(category) LIKE '%campaign%' OR LOWER(category) LIKE '%brand%' THEN 'marketing'
        WHEN LOWER(category) LIKE '%work%' OR LOWER(category) LIKE '%career%' OR LOWER(category) LIKE '%job%' OR LOWER(category) LIKE '%feature%' OR LOWER(category) LIKE '%build%' OR LOWER(category) LIKE '%product%' THEN 'product'
        WHEN LOWER(category) LIKE '%health%' OR LOWER(category) LIKE '%personal%' OR LOWER(category) LIKE '%development%' THEN 'personal'
        WHEN LOWER(category) LIKE '%admin%' OR LOWER(category) LIKE '%management%' OR LOWER(category) LIKE '%process%' OR LOWER(category) LIKE '%operation%' THEN 'operations'
        -- Handle any other values that don't match
        ELSE 'other'
    END;

-- Also fix the name-based categorization for any that are still 'other'
UPDATE taskboards 
SET 
    category = CASE 
        WHEN LOWER(name) LIKE '%revenue%' OR LOWER(name) LIKE '%sales%' OR LOWER(name) LIKE '%income%' THEN 'revenue'
        WHEN LOWER(name) LIKE '%marketing%' OR LOWER(name) LIKE '%campaign%' OR LOWER(name) LIKE '%brand%' THEN 'marketing'
        WHEN LOWER(name) LIKE '%work%' OR LOWER(name) LIKE '%career%' OR LOWER(name) LIKE '%job%' OR LOWER(name) LIKE '%feature%' OR LOWER(name) LIKE '%build%' THEN 'product'
        WHEN LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%personal%' OR LOWER(name) LIKE '%development%' THEN 'personal'
        WHEN LOWER(name) LIKE '%admin%' OR LOWER(name) LIKE '%management%' OR LOWER(name) LIKE '%process%' THEN 'operations'
        ELSE category -- Keep existing value if name doesn't match patterns
    END
WHERE category = 'other';

-- 6. Fix priority values similarly
UPDATE taskboards 
SET 
    priority = CASE 
        WHEN priority IS NULL THEN 'medium'
        WHEN LOWER(priority) LIKE '%urgent%' OR LOWER(priority) LIKE '%critical%' THEN 'urgent'
        WHEN LOWER(priority) LIKE '%high%' OR LOWER(priority) LIKE '%important%' THEN 'high'
        WHEN LOWER(priority) LIKE '%low%' THEN 'low'
        ELSE 'medium'
    END;

-- 7. Fix completion_percentage values
UPDATE taskboards 
SET completion_percentage = CASE 
    WHEN completion_percentage IS NULL THEN 0
    WHEN completion_percentage < 0 THEN 0
    WHEN completion_percentage > 100 THEN 100
    ELSE completion_percentage
END;

-- 8. Verify all data is now valid BEFORE adding constraints
SELECT 'Checking category values:' as check, category, COUNT(*) 
FROM taskboards 
WHERE category NOT IN ('revenue', 'operations', 'marketing', 'product', 'personal', 'other')
GROUP BY category;

SELECT 'Checking priority values:' as check, priority, COUNT(*) 
FROM taskboards 
WHERE priority NOT IN ('low', 'medium', 'high', 'urgent')
GROUP BY priority;

SELECT 'Checking completion_percentage values:' as check, 
       COUNT(*) as invalid_count
FROM taskboards 
WHERE completion_percentage < 0 OR completion_percentage > 100;

-- 9. NOW add constraints (only if data is clean)
DO $$ 
BEGIN
    -- Add category constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taskboards_category_check') THEN
        BEGIN
            ALTER TABLE taskboards ADD CONSTRAINT taskboards_category_check 
            CHECK (category IN ('revenue', 'operations', 'marketing', 'product', 'personal', 'other'));
            RAISE NOTICE '✅ Category constraint added successfully';
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE '❌ Category constraint failed - some rows still have invalid values';
                RAISE NOTICE 'Run this query to see invalid values: SELECT DISTINCT category FROM taskboards WHERE category NOT IN (''revenue'', ''operations'', ''marketing'', ''product'', ''personal'', ''other'');';
        END;
    END IF;
    
    -- Add priority constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taskboards_priority_check') THEN
        BEGIN
            ALTER TABLE taskboards ADD CONSTRAINT taskboards_priority_check 
            CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
            RAISE NOTICE '✅ Priority constraint added successfully';
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE '❌ Priority constraint failed - some rows still have invalid values';
        END;
    END IF;
    
    -- Add completion percentage constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taskboards_completion_check') THEN
        BEGIN
            ALTER TABLE taskboards ADD CONSTRAINT taskboards_completion_check 
            CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
            RAISE NOTICE '✅ Completion percentage constraint added successfully';
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE '❌ Completion percentage constraint failed - some rows still have invalid values';
        END;
    END IF;
END $$;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_taskboards_category ON taskboards(category);
CREATE INDEX IF NOT EXISTS idx_taskboards_priority ON taskboards(priority);
CREATE INDEX IF NOT EXISTS idx_taskboards_target_date ON taskboards(target_date);
CREATE INDEX IF NOT EXISTS idx_taskboards_is_archived ON taskboards(is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);

-- 11. Create enhanced analytics view
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
    t.task_counter,
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

-- 12. Grant access to the view
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

-- 13. Set intelligent defaults for remaining fields
UPDATE taskboards 
SET 
    is_archived = CASE WHEN COALESCE(is_active, true) = false THEN true ELSE false END,
    start_date = COALESCE(start_date, CURRENT_DATE),
    target_date = COALESCE(target_date, CURRENT_DATE + INTERVAL '90 days')
WHERE start_date IS NULL OR target_date IS NULL;

-- 14. Set revenue targets only for appropriate categories
UPDATE taskboards 
SET 
    revenue_target = CASE 
        WHEN category = 'revenue' AND revenue_target IS NULL THEN 50000
        WHEN category = 'marketing' AND revenue_target IS NULL THEN 25000
        WHEN category = 'product' AND revenue_target IS NULL THEN 75000
        ELSE revenue_target
    END,
    budget = CASE 
        WHEN category = 'revenue' AND budget IS NULL THEN 10000
        WHEN category = 'marketing' AND budget IS NULL THEN 5000
        WHEN category = 'product' AND budget IS NULL THEN 15000
        ELSE budget
    END
WHERE category IN ('revenue', 'marketing', 'product');

-- 15. Final verification
SELECT '✅ SCHEMA UPDATE COMPLETED!' as status;

-- 16. Show summary of your taskboards (modify user ID as needed)
SELECT 
    'Summary of enhanced taskboards:' as info,
    COUNT(*) as total_taskboards,
    COUNT(*) FILTER (WHERE category = 'product') as product_boards,
    COUNT(*) FILTER (WHERE category = 'personal') as personal_boards,
    COUNT(*) FILTER (WHERE category = 'revenue') as revenue_boards,
    COUNT(*) FILTER (WHERE revenue_target > 0) as boards_with_targets
FROM taskboards;

-- 17. Test the analytics view
SELECT 'Analytics view test - row count:' as test, COUNT(*) as rows FROM enhanced_taskboard_analytics;

-- Manual query to see your specific results:
-- SELECT name, category, priority, revenue_target, actual_task_count, days_until_target
-- FROM enhanced_taskboard_analytics 
-- WHERE user_id = 'your-user-id-here'
-- ORDER BY priority DESC, name;
