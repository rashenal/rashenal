-- Add subtasks, comments, and attachments support to tasks
-- This migration creates the missing tables needed for full task functionality

BEGIN;

-- ==============================================
-- 1. CREATE SUBTASKS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subtask content
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  
  -- Optional metadata
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE TASK COMMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Comment content
  content TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'status_update', 'question', 'solution', 'blocker')),
  
  -- Optional metadata
  mentions UUID[], -- Array of user IDs mentioned in comment
  is_private BOOLEAN DEFAULT FALSE,
  is_system_generated BOOLEAN DEFAULT FALSE,
  
  -- For threaded comments (optional)
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  
  -- Edit history
  edited_at TIMESTAMP WITH TIME ZONE,
  edit_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. CREATE TASK ATTACHMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File information
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_extension TEXT,
  
  -- Storage information
  storage_bucket TEXT NOT NULL DEFAULT 'task-attachments',
  storage_path TEXT NOT NULL,
  download_url TEXT, -- Pre-signed URL or public URL
  
  -- File metadata
  description TEXT,
  is_image BOOLEAN DEFAULT FALSE,
  thumbnail_path TEXT, -- For image thumbnails
  
  -- Upload status
  upload_status TEXT DEFAULT 'uploading' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'deleted')),
  upload_error TEXT,
  
  -- Security
  is_public BOOLEAN DEFAULT FALSE,
  access_level TEXT DEFAULT 'task_members' CHECK (access_level IN ('task_members', 'project_members', 'public')),
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Subtasks indexes
CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent_task ON task_subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_user ON task_subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_completed ON task_subtasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_position ON task_subtasks(parent_task_id, position);

-- Comments indexes  
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON task_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_mentions ON task_comments USING gin(mentions);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user ON task_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_status ON task_attachments(upload_status);
CREATE INDEX IF NOT EXISTS idx_task_attachments_bucket_path ON task_attachments(storage_bucket, storage_path);

-- ==============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 6. CREATE RLS POLICIES
-- ==============================================

-- Subtasks policies
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

-- Comments policies
CREATE POLICY "Users can view comments for their tasks" ON task_comments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid()) OR
    (NOT is_private AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id))
  );

CREATE POLICY "Users can create comments on their tasks" ON task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE USING (user_id = auth.uid());

-- Attachments policies
CREATE POLICY "Users can view attachments for their tasks" ON task_attachments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid()) OR
    (is_public AND access_level = 'public')
  );

CREATE POLICY "Users can upload attachments to their tasks" ON task_attachments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own attachments" ON task_attachments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own attachments" ON task_attachments
  FOR DELETE USING (user_id = auth.uid());

-- ==============================================
-- 7. CREATE UPDATE TRIGGERS
-- ==============================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_subtasks_updated_at 
  BEFORE UPDATE ON task_subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at 
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_attachments_updated_at 
  BEFORE UPDATE ON task_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 8. ADD HELPFUL COMMENTS
-- ==============================================

COMMENT ON TABLE task_subtasks IS 'Subtasks/checklist items for main tasks with completion tracking';
COMMENT ON TABLE task_comments IS 'Comments and discussion threads for tasks with mention support';
COMMENT ON TABLE task_attachments IS 'File attachments for tasks stored in Supabase Storage';

COMMENT ON COLUMN task_subtasks.position IS 'Display order within parent task (0-based)';
COMMENT ON COLUMN task_subtasks.estimated_minutes IS 'Estimated completion time in minutes';
COMMENT ON COLUMN task_subtasks.actual_minutes IS 'Actual time spent in minutes';

COMMENT ON COLUMN task_comments.comment_type IS 'Category of comment for filtering and display';
COMMENT ON COLUMN task_comments.mentions IS 'Array of user UUIDs mentioned in comment with @ syntax';
COMMENT ON COLUMN task_comments.is_system_generated IS 'True for automated comments (status changes, etc.)';

COMMENT ON COLUMN task_attachments.storage_bucket IS 'Supabase storage bucket name';
COMMENT ON COLUMN task_attachments.storage_path IS 'Full path within storage bucket';
COMMENT ON COLUMN task_attachments.download_url IS 'Pre-signed or public download URL';
COMMENT ON COLUMN task_attachments.access_level IS 'Who can access this attachment';

COMMIT;