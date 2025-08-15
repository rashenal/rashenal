-- Enhanced Taskboards Schema - Works with Existing Data
-- Run this in your Supabase SQL editor to add business tracking to existing taskboards

-- Add business tracking columns to existing taskboards table
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

-- Create RLS policies for taskboard_milestones
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

-- Create RLS policy for the view
CREATE POLICY "Users can view their own enhanced taskboard analytics" ON enhanced_taskboard_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- Update existing taskboards with intelligent category assignment based on names
UPDATE taskboards SET 
    category = CASE 
        WHEN LOWER(name) LIKE '%revenue%' OR LOWER(name) LIKE '%sales%' OR LOWER(name) LIKE '%income%' THEN 'revenue'
        WHEN LOWER(name) LIKE '%marketing%' OR LOWER(name) LIKE '%campaign%' OR LOWER(name) LIKE '%brand%' THEN 'marketing'
        WHEN LOWER(name) LIKE '%work%' OR LOWER(name) LIKE '%career%' OR LOWER(name) LIKE '%job%' THEN 'product'
        WHEN LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%personal%' OR LOWER(name) LIKE '%development%' THEN 'personal'
        WHEN LOWER(name) LIKE '%admin%' OR LOWER(name) LIKE '%management%' OR LOWER(name) LIKE '%process%' THEN 'operations'
        ELSE 'other'
    END,
    priority = CASE 
        WHEN LOWER(name) LIKE '%urgent%' OR LOWER(name) LIKE '%critical%' THEN 'urgent'
        WHEN LOWER(name) LIKE '%important%' OR LOWER(name) LIKE '%priority%' THEN 'high'
        WHEN LOWER(name) LIKE '%feature%' OR LOWER(name) LIKE '%build%' THEN 'medium'
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
    END
WHERE revenue_target IS NULL AND category IN ('revenue', 'marketing', 'product');

-- Create trigger for automatic timestamp updates on taskboard_milestones
CREATE TRIGGER update_taskboard_milestones_updated_at BEFORE UPDATE ON taskboard_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
