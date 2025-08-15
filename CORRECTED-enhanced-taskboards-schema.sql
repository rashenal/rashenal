-- ✅ CORRECTED SCHEMA UPDATE - NO USERS TABLE ERROR
-- This script works with Supabase auth system properly

-- Add missing columns to tasks table (corrected references)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accountability_email TEXT;

-- Add column limits to taskboards 
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS column_limits JSONB DEFAULT '{"todo": 5, "in_progress": 3}';

-- Add business intelligence columns from enhanced-taskboards-schema.sql
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other' CHECK (category IN ('revenue', 'operations', 'marketing', 'product', 'personal', 'other'));
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2);
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS revenue_target DECIMAL(12,2);
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE taskboards ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create taskboard_milestones table
CREATE TABLE IF NOT EXISTS taskboard_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    taskboard_id UUID NOT NULL REFERENCES taskboards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    revenue_impact DECIMAL(12,2),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new table
ALTER TABLE taskboard_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for taskboard_milestones (using auth.uid() instead of users table)
CREATE POLICY "Users can view milestones for their taskboards" ON taskboard_milestones
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM taskboards WHERE id = taskboard_milestones.taskboard_id));

CREATE POLICY "Users can create milestones for their taskboards" ON taskboard_milestones
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM taskboards WHERE id = taskboard_milestones.taskboard_id));

CREATE POLICY "Users can update milestones for their taskboards" ON taskboard_milestones
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM taskboards WHERE id = taskboard_milestones.taskboard_id));

CREATE POLICY "Users can delete milestones for their taskboards" ON taskboard_milestones
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM taskboards WHERE id = taskboard_milestones.taskboard_id));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_taskboards_category ON taskboards(category);
CREATE INDEX IF NOT EXISTS idx_taskboards_priority ON taskboards(priority);
CREATE INDEX IF NOT EXISTS idx_taskboards_target_date ON taskboards(target_date);
CREATE INDEX IF NOT EXISTS idx_taskboards_is_archived ON taskboards(is_archived);
CREATE INDEX IF NOT EXISTS idx_taskboard_milestones_taskboard_id ON taskboard_milestones(taskboard_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);

-- Create enhanced taskboard analytics view
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
GROUP BY t.id, t.user_id, t.name, t.description, t.category, t.priority, t.revenue_target, t.budget, t.completion_percentage, t.target_date, t.start_date, t.color, t.is_favorite, t.is_archived, t.task_counter;

-- Grant access to the view
GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;

-- Update existing taskboards with intelligent category assignment based on names
UPDATE taskboards SET 
    category = CASE 
        WHEN LOWER(name) LIKE '%revenue%' OR LOWER(name) LIKE '%sales%' OR LOWER(name) LIKE '%income%' THEN 'revenue'
        WHEN LOWER(name) LIKE '%marketing%' OR LOWER(name) LIKE '%campaign%' OR LOWER(name) LIKE '%brand%' THEN 'marketing'
        WHEN LOWER(name) LIKE '%work%' OR LOWER(name) LIKE '%career%' OR LOWER(name) LIKE '%job%' OR LOWER(name) LIKE '%feature%' OR LOWER(name) LIKE '%build%' THEN 'product'
        WHEN LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%personal%' OR LOWER(name) LIKE '%development%' THEN 'personal'
        WHEN LOWER(name) LIKE '%admin%' OR LOWER(name) LIKE '%management%' OR LOWER(name) LIKE '%process%' THEN 'operations'
        ELSE 'other'
    END,
    priority = CASE 
        WHEN LOWER(name) LIKE '%urgent%' OR LOWER(name) LIKE '%critical%' THEN 'urgent'
        WHEN LOWER(name) LIKE '%important%' OR LOWER(name) LIKE '%priority%' OR LOWER(name) LIKE '%feature%' OR LOWER(name) LIKE '%build%' THEN 'high'
        ELSE 'medium'
    END,
    is_archived = CASE WHEN is_active = false THEN true ELSE false END
WHERE category IS NULL OR category = 'other';

-- Set intelligent revenue targets based on taskboard purpose
UPDATE taskboards SET 
    revenue_target = CASE 
        WHEN category = 'revenue' THEN 50000
        WHEN category = 'marketing' THEN 25000
        WHEN category = 'product' THEN 75000
        ELSE NULL
    END,
    budget = CASE 
        WHEN category = 'revenue' THEN 10000
        WHEN category = 'marketing' THEN 5000
        WHEN category = 'product' THEN 15000
        ELSE NULL
    END,
    start_date = CURRENT_DATE,
    target_date = CURRENT_DATE + INTERVAL '90 days'
WHERE revenue_target IS NULL AND category IN ('revenue', 'marketing', 'product');

-- ✅ VERIFICATION QUERIES
SELECT 
    '🎉 SCHEMA UPDATE COMPLETED SUCCESSFULLY!' as status,
    COUNT(*) as total_taskboards,
    COUNT(*) FILTER (WHERE category != 'other') as categorized_boards,
    COUNT(*) FILTER (WHERE revenue_target IS NOT NULL) as boards_with_revenue_targets
FROM taskboards;

SELECT 
    '📊 YOUR ENHANCED TASKBOARDS:' as info,
    name,
    category,
    priority,
    COALESCE(revenue_target, 0) as revenue_target,
    COALESCE(budget, 0) as budget,
    start_date,
    target_date
FROM taskboards 
WHERE user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ORDER BY priority DESC, name;
