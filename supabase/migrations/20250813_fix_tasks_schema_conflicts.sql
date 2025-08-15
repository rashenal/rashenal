-- Migration: Fix tasks table schema conflicts and ensure updated_at column
-- Date: 2025-08-13
-- Description: Resolves ID type conflicts and ensures all expected columns exist

BEGIN;

-- ==============================================
-- 1. DROP CONFLICTING FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Drop foreign key constraints that reference tasks(id) with wrong type
DO $$
BEGIN
    -- Drop foreign keys from task_subtasks if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name LIKE '%task_subtasks%parent_task_id%' 
               AND constraint_type = 'FOREIGN KEY') THEN
        ALTER TABLE task_subtasks DROP CONSTRAINT IF EXISTS task_subtasks_parent_task_id_fkey;
    END IF;
    
    -- Drop foreign keys from task_comments if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name LIKE '%task_comments%task_id%' 
               AND constraint_type = 'FOREIGN KEY') THEN
        ALTER TABLE task_comments DROP CONSTRAINT IF EXISTS task_comments_task_id_fkey;
    END IF;
    
    -- Drop foreign keys from task_attachments if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name LIKE '%task_attachments%task_id%' 
               AND constraint_type = 'FOREIGN KEY') THEN
        ALTER TABLE task_attachments DROP CONSTRAINT IF EXISTS task_attachments_task_id_fkey;
    END IF;
    
    -- Drop self-referencing parent_id constraint if it exists with wrong type
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'tasks' AND constraint_name LIKE '%parent_id%' 
               AND constraint_type = 'FOREIGN KEY') THEN
        ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_parent_id_fkey;
    END IF;
END $$;

-- ==============================================
-- 2. ENSURE TASKS TABLE HAS CORRECT SCHEMA
-- ==============================================

-- Ensure tasks table exists with correct structure
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    taskboard_id UUID,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add parent_id as TEXT to match tasks.id type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'parent_id') THEN
        ALTER TABLE tasks ADD COLUMN parent_id TEXT;
    END IF;
    
    -- Add blocked_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'blocked_by') THEN
        ALTER TABLE tasks ADD COLUMN blocked_by TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add task_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'task_number') THEN
        ALTER TABLE tasks ADD COLUMN task_number TEXT UNIQUE;
    END IF;
    
    -- Add has_children column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'has_children') THEN
        ALTER TABLE tasks ADD COLUMN has_children BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add dependency_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'dependency_status') THEN
        ALTER TABLE tasks ADD COLUMN dependency_status TEXT DEFAULT 'independent' 
            CHECK (dependency_status IN ('independent', 'blocked', 'ready', 'in_progress', 'completed'));
    END IF;
    
    -- Add energy_level column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'energy_level') THEN
        ALTER TABLE tasks ADD COLUMN energy_level TEXT DEFAULT 'm' 
            CHECK (energy_level IN ('xs', 's', 'm', 'l', 'xl'));
    END IF;
    
    -- Add business_value column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'business_value') THEN
        ALTER TABLE tasks ADD COLUMN business_value INTEGER DEFAULT 50 CHECK (business_value >= 0 AND business_value <= 100);
    END IF;
    
    -- Add personal_value column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'personal_value') THEN
        ALTER TABLE tasks ADD COLUMN personal_value INTEGER DEFAULT 50 CHECK (personal_value >= 0 AND personal_value <= 100);
    END IF;
    
    -- Add estimated_duration column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'estimated_duration') THEN
        ALTER TABLE tasks ADD COLUMN estimated_duration INTEGER DEFAULT 30; -- minutes
    END IF;
    
    -- Add due_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
        ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add tags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'tags') THEN
        ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Ensure updated_at column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
        ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
    END IF;
END $$;

-- ==============================================
-- 3. ADD SELF-REFERENCING FOREIGN KEY FOR PARENT_ID
-- ==============================================

-- Add foreign key constraint for parent_id (self-referencing, TEXT to TEXT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'tasks' AND constraint_name = 'tasks_parent_id_fkey') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_parent_id_fkey 
            FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==============================================
-- 4. FIX OTHER TABLES TO USE TEXT FOR TASK REFERENCES
-- ==============================================

-- Fix task_subtasks table
DO $$
BEGIN
    -- Check if task_subtasks exists and needs fixing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_subtasks') THEN
        -- Drop and recreate with correct type if parent_task_id is UUID
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_subtasks' AND column_name = 'parent_task_id' 
                   AND data_type = 'uuid') THEN
            
            -- Drop the table and recreate with correct types
            DROP TABLE IF EXISTS task_subtasks CASCADE;
            
            CREATE TABLE task_subtasks (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              parent_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
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
        END IF;
    END IF;
END $$;

-- Fix task_comments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        -- Drop and recreate if task_id is UUID
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_comments' AND column_name = 'task_id' 
                   AND data_type = 'uuid') THEN
            
            DROP TABLE IF EXISTS task_comments CASCADE;
            
            CREATE TABLE task_comments (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
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
        END IF;
    END IF;
END $$;

-- Fix task_attachments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_attachments') THEN
        -- Drop and recreate if task_id is UUID
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_attachments' AND column_name = 'task_id' 
                   AND data_type = 'uuid') THEN
            
            DROP TABLE IF EXISTS task_attachments CASCADE;
            
            CREATE TABLE task_attachments (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
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
        END IF;
    END IF;
END $$;

-- ==============================================
-- 5. ADD UPDATED_AT TRIGGER
-- ==============================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. RECREATE VIEWS WITH CORRECT SCHEMA
-- ==============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS tasks_with_dependencies;

-- Create the view with all expected columns including updated_at
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
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_taskboard_id ON tasks(taskboard_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_number ON tasks(task_number);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);

-- Indexes for related tables if they exist
DO $$
BEGIN
    -- task_subtasks indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_subtasks') THEN
        CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent_task ON task_subtasks(parent_task_id);
        CREATE INDEX IF NOT EXISTS idx_task_subtasks_user ON task_subtasks(user_id);
    END IF;
    
    -- task_comments indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
    END IF;
    
    -- task_attachments indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_attachments') THEN
        CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_attachments_user ON task_attachments(user_id);
    END IF;
END $$;

-- ==============================================
-- 8. ENABLE RLS AND CREATE POLICIES
-- ==============================================

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for tasks
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

-- Grant permissions on the view
GRANT SELECT ON tasks_with_dependencies TO authenticated;

-- ==============================================
-- 9. UPDATE EXISTING DATA FOR CONSISTENCY
-- ==============================================

-- Set parent_id to self for independent tasks (if null)
UPDATE tasks 
SET parent_id = id 
WHERE parent_id IS NULL;

-- Set default values for new columns
UPDATE tasks 
SET 
    dependency_status = 'independent',
    energy_level = 'm',
    business_value = 50,
    personal_value = 50,
    estimated_duration = 30
WHERE dependency_status IS NULL 
   OR energy_level IS NULL 
   OR business_value IS NULL 
   OR personal_value IS NULL 
   OR estimated_duration IS NULL;

-- ==============================================
-- 10. ADD HELPFUL COMMENTS
-- ==============================================

COMMENT ON TABLE tasks IS 'Main tasks table with TEXT id for frontend compatibility';
COMMENT ON COLUMN tasks.id IS 'Text-based primary key for frontend compatibility';
COMMENT ON COLUMN tasks.task_number IS 'Human-readable task identifier (e.g., RAI-1)';
COMMENT ON COLUMN tasks.parent_id IS 'Self-reference for task dependencies (TEXT)';
COMMENT ON COLUMN tasks.updated_at IS 'Timestamp of last update - REQUIRED by frontend';
COMMENT ON VIEW tasks_with_dependencies IS 'Enhanced view with dependency info and updated_at column';

COMMIT;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify the view has updated_at column
SELECT 'Schema fix completed successfully!' as status;

-- Check if updated_at column exists in the view
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks_with_dependencies' 
AND column_name = 'updated_at';

-- Sample data from the view
SELECT 'Sample data from tasks_with_dependencies view:' as info;
SELECT id, title, updated_at, created_at 
FROM tasks_with_dependencies 
LIMIT 3;