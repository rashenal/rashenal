-- Migration: Fix tasks table schema conflicts - CORRECTED VERSION
-- Date: 2025-08-13
-- Description: Check actual schema and fix inconsistencies properly

BEGIN;

-- ==============================================
-- 1. DISCOVER ACTUAL SCHEMA STATE
-- ==============================================

-- Check what type tasks.id actually is
DO $$
DECLARE
    tasks_id_type TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Check if tasks table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tasks'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get the actual data type of tasks.id
        SELECT data_type INTO tasks_id_type
        FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'id';
        
        RAISE NOTICE 'Current tasks.id type: %', tasks_id_type;
        
        -- Store this for later use
        PERFORM set_config('app.tasks_id_type', tasks_id_type, false);
    ELSE
        RAISE NOTICE 'Tasks table does not exist yet';
        PERFORM set_config('app.tasks_id_type', 'none', false);
    END IF;
END $$;

-- ==============================================
-- 2. DROP PROBLEMATIC CONSTRAINTS AND TABLES
-- ==============================================

-- Drop all dependent tables to avoid constraint conflicts
DROP TABLE IF EXISTS task_attachments CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE; 
DROP TABLE IF EXISTS task_subtasks CASCADE;

-- Drop the problematic view
DROP VIEW IF EXISTS tasks_with_dependencies CASCADE;

-- ==============================================
-- 3. STANDARDIZE ON UUID FOR ALL IDS
-- ==============================================

-- If tasks table exists with TEXT id, convert it to UUID
DO $$
DECLARE
    current_id_type TEXT;
BEGIN
    current_id_type := current_setting('app.tasks_id_type', true);
    
    IF current_id_type = 'text' THEN
        -- Convert TEXT id to UUID
        RAISE NOTICE 'Converting tasks.id from TEXT to UUID...';
        
        -- First, update any existing TEXT ids to valid UUIDs
        UPDATE tasks 
        SET id = gen_random_uuid()::text 
        WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- Change column type to UUID
        ALTER TABLE tasks ALTER COLUMN id TYPE UUID USING id::UUID;
        
        -- Fix parent_id references 
        UPDATE tasks SET parent_id = NULL WHERE parent_id IS NOT NULL;
        ALTER TABLE tasks ALTER COLUMN parent_id TYPE UUID USING NULL;
        
        RAISE NOTICE 'Converted tasks.id to UUID';
        
    ELSIF current_id_type = 'uuid' THEN
        RAISE NOTICE 'tasks.id is already UUID - good!';
    ELSE
        RAISE NOTICE 'Creating new tasks table with UUID id';
    END IF;
END $$;

-- ==============================================
-- 4. ENSURE TASKS TABLE EXISTS WITH PROPER SCHEMA
-- ==============================================

-- Create or update tasks table with UUID id and all required columns
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    taskboard_id UUID REFERENCES taskboards(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add all missing columns with UUID types where appropriate
DO $$
BEGIN
    -- Add parent_id as UUID to match tasks.id type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'parent_id') THEN
        ALTER TABLE tasks ADD COLUMN parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'blocked_by') THEN
        ALTER TABLE tasks ADD COLUMN blocked_by UUID[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'task_number') THEN
        ALTER TABLE tasks ADD COLUMN task_number TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'has_children') THEN
        ALTER TABLE tasks ADD COLUMN has_children BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'dependency_status') THEN
        ALTER TABLE tasks ADD COLUMN dependency_status TEXT DEFAULT 'independent' 
            CHECK (dependency_status IN ('independent', 'blocked', 'ready', 'in_progress', 'completed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'energy_level') THEN
        ALTER TABLE tasks ADD COLUMN energy_level TEXT DEFAULT 'm' 
            CHECK (energy_level IN ('xs', 's', 'm', 'l', 'xl'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'business_value') THEN
        ALTER TABLE tasks ADD COLUMN business_value INTEGER DEFAULT 50 CHECK (business_value >= 0 AND business_value <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'personal_value') THEN
        ALTER TABLE tasks ADD COLUMN personal_value INTEGER DEFAULT 50 CHECK (personal_value >= 0 AND personal_value <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'estimated_duration') THEN
        ALTER TABLE tasks ADD COLUMN estimated_duration INTEGER DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
        ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'tags') THEN
        ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
        ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
    END IF;
END $$;

-- ==============================================
-- 5. CREATE RELATED TABLES WITH CORRECT UUID REFERENCES
-- ==============================================

-- Create task_subtasks with UUID references
CREATE TABLE task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_comments with UUID references
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'status_update', 'question', 'solution', 'blocker')),
  mentions UUID[],
  is_private BOOLEAN DEFAULT FALSE,
  is_system_generated BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  edited_at TIMESTAMP WITH TIME ZONE,
  edit_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_attachments with UUID references
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_extension TEXT,
  storage_bucket TEXT NOT NULL DEFAULT 'task-attachments',
  storage_path TEXT NOT NULL,
  download_url TEXT,
  description TEXT,
  is_image BOOLEAN DEFAULT FALSE,
  thumbnail_path TEXT,
  upload_status TEXT DEFAULT 'uploading' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'deleted')),
  upload_error TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  access_level TEXT DEFAULT 'task_members' CHECK (access_level IN ('task_members', 'project_members', 'public')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 6. CREATE UPDATED_AT TRIGGERS
-- ==============================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_subtasks_updated_at ON task_subtasks;
CREATE TRIGGER update_task_subtasks_updated_at 
    BEFORE UPDATE ON task_subtasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at 
    BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_attachments_updated_at ON task_attachments;
CREATE TRIGGER update_task_attachments_updated_at 
    BEFORE UPDATE ON task_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 7. CREATE THE TASKS_WITH_DEPENDENCIES VIEW
-- ==============================================

-- Create the enhanced view with all expected columns including updated_at
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
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_taskboard_id ON tasks(taskboard_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_number ON tasks(task_number);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);

-- Indexes for related tables
CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent_task ON task_subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_user ON task_subtasks(user_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user ON task_attachments(user_id);

-- ==============================================
-- 9. ENABLE RLS AND CREATE POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
    
    -- Create new policies
    CREATE POLICY "Users can view their own tasks" ON tasks
        FOR SELECT USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can insert their own tasks" ON tasks
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
    CREATE POLICY "Users can update their own tasks" ON tasks
        FOR UPDATE USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can delete their own tasks" ON tasks
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Policies for task_subtasks
CREATE POLICY "Users can view subtasks for their tasks" ON task_subtasks
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = parent_task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can create subtasks for their tasks" ON task_subtasks
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = parent_task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can update subtasks for their tasks" ON task_subtasks
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = parent_task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can delete subtasks for their tasks" ON task_subtasks
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = parent_task_id AND tasks.user_id = auth.uid())
  );

-- Similar policies for comments and attachments
CREATE POLICY "Users can view comments for their tasks" ON task_comments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can create comments on their tasks" ON task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can view attachments for their tasks" ON task_attachments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can upload attachments to their tasks" ON task_attachments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

-- Grant permissions on the view
GRANT SELECT ON tasks_with_dependencies TO authenticated;

-- ==============================================
-- 10. ADD HELPFUL COMMENTS
-- ==============================================

COMMENT ON TABLE tasks IS 'Main tasks table with UUID id for consistency with other tables';
COMMENT ON COLUMN tasks.id IS 'UUID primary key for consistency across all tables';
COMMENT ON COLUMN tasks.parent_id IS 'Self-reference for task dependencies (UUID)';
COMMENT ON COLUMN tasks.updated_at IS 'Timestamp of last update - REQUIRED by frontend';
COMMENT ON VIEW tasks_with_dependencies IS 'Enhanced view with dependency info and updated_at column';

COMMIT;

-- ==============================================
-- VERIFICATION
-- ==============================================

SELECT 'Schema fix completed with UUID consistency!' as status;

-- Verify tasks.id type
SELECT 'Tasks id column type:' as info, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'id';

-- Verify view has updated_at
SELECT 'View columns check:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tasks_with_dependencies' 
AND column_name IN ('id', 'updated_at', 'created_at')
ORDER BY column_name;