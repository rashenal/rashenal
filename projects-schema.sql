-- Projects System Database Schema
-- Run this in your Supabase SQL editor

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('revenue', 'operations', 'marketing', 'product', 'personal', 'other')),
    budget DECIMAL(12,2),
    revenue_target DECIMAL(12,2),
    start_date DATE,
    target_date DATE,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    color TEXT DEFAULT '#6B7280',
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add project_id to existing tasks table (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
        ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create user_scheduling_preferences table (for calendar integration)
CREATE TABLE IF NOT EXISTS user_scheduling_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    work_hours_per_day DECIMAL(3,1) DEFAULT 8.0,
    work_days_per_week INTEGER DEFAULT 5 CHECK (work_days_per_week >= 1 AND work_days_per_week <= 7),
    work_start_time TIME DEFAULT '09:00',
    work_end_time TIME DEFAULT '17:00',
    buffer_time_percentage DECIMAL(3,2) DEFAULT 0.20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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

-- Create project_collaborators table (for future team features)
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions TEXT[] DEFAULT ARRAY['read'],
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scheduling_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_scheduling_preferences
CREATE POLICY "Users can view their own scheduling preferences" ON user_scheduling_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduling preferences" ON user_scheduling_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduling preferences" ON user_scheduling_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduling preferences" ON user_scheduling_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for project_milestones
CREATE POLICY "Users can view milestones for their projects" ON project_milestones
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_milestones.project_id));

CREATE POLICY "Users can create milestones for their projects" ON project_milestones
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_milestones.project_id));

CREATE POLICY "Users can update milestones for their projects" ON project_milestones
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_milestones.project_id));

CREATE POLICY "Users can delete milestones for their projects" ON project_milestones
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_milestones.project_id));

-- Create RLS policies for project_collaborators
CREATE POLICY "Users can view collaborators for their projects" ON project_collaborators
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM projects WHERE id = project_collaborators.project_id)
        OR auth.uid() = user_id
    );

CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_collaborators.project_id));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON projects(target_date);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_target_date ON project_milestones(target_date);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_scheduling_preferences_updated_at BEFORE UPDATE ON user_scheduling_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default revenue-focused project templates
INSERT INTO projects (user_id, name, description, status, priority, category, revenue_target, color, is_archived) 
SELECT 
    auth.uid(),
    'Revenue Generation Template',
    'A template project focused on generating revenue through strategic initiatives',
    'planning',
    'high',
    'revenue',
    100000,
    '#10B981',
    false
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create a view for project analytics
CREATE OR REPLACE VIEW project_analytics AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.category,
    p.status,
    p.priority,
    p.revenue_target,
    p.budget,
    p.completion_percentage,
    p.target_date,
    COUNT(t.id) as task_count,
    COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
    SUM(COALESCE(t.estimated_time, 0)) as total_estimated_hours,
    CASE 
        WHEN p.target_date IS NOT NULL AND p.target_date < CURRENT_DATE AND p.completion_percentage < 100 
        THEN true 
        ELSE false 
    END as is_behind_schedule,
    CASE 
        WHEN p.target_date IS NOT NULL 
        THEN DATE_PART('day', p.target_date - CURRENT_DATE)::INTEGER 
        ELSE NULL 
    END as days_until_target
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
WHERE p.is_archived = false
GROUP BY p.id, p.user_id, p.name, p.category, p.status, p.priority, p.revenue_target, p.budget, p.completion_percentage, p.target_date;

-- Grant access to the view
GRANT SELECT ON project_analytics TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view their own project analytics" ON project_analytics
    FOR SELECT USING (auth.uid() = user_id);
