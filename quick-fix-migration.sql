-- Quick Fix Migration
-- Run this to ensure all necessary columns and tables exist

-- 1. Add preferences column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
        
        -- Set default preferences for existing users
        UPDATE user_profiles 
        SET preferences = jsonb_build_object(
          'taskBoard', jsonb_build_object(
            'showCardDetails', true,
            'compactView', false,
            'showAIInsights', true,
            'columnVisibility', jsonb_build_object(
              'backlog', true,
              'todo', true,
              'in_progress', true,
              'blocked', true,
              'done', true
            ),
            'sortOrder', 'position',
            'filterTags', jsonb_build_array()
          ),
          'ui', jsonb_build_object(
            'theme', 'system',
            'sidebarCollapsed', false,
            'autoFocusInput', true,
            'enableAnimations', true
          ),
          'ai', jsonb_build_object(
            'coachingStyle', 'encouraging',
            'autoSuggest', true,
            'showInsights', true
          ),
          'notifications', jsonb_build_object(
            'emailEnabled', false,
            'pushEnabled', false,
            'taskReminders', true,
            'habitReminders', true
          )
        )
        WHERE preferences IS NULL OR preferences = '{}'::jsonb;
    END IF;
END $$;

-- 2. Create taskboards table if it doesn't exist
CREATE TABLE IF NOT EXISTS taskboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on taskboards if not already enabled
ALTER TABLE taskboards ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for taskboards
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'taskboards' 
        AND policyname = 'Users can view their own taskboards'
    ) THEN
        CREATE POLICY "Users can view their own taskboards" ON taskboards
          FOR SELECT USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'taskboards' 
        AND policyname = 'Users can create their own taskboards'
    ) THEN
        CREATE POLICY "Users can create their own taskboards" ON taskboards
          FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'taskboards' 
        AND policyname = 'Users can update their own taskboards'
    ) THEN
        CREATE POLICY "Users can update their own taskboards" ON taskboards
          FOR UPDATE USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'taskboards' 
        AND policyname = 'Users can delete their own taskboards'
    ) THEN
        CREATE POLICY "Users can delete their own taskboards" ON taskboards
          FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- 5. Create indexes for taskboards
CREATE INDEX IF NOT EXISTS idx_taskboards_user_id ON taskboards(user_id);

-- 6. Ensure task_subtasks table exists (from previous migration)
CREATE TABLE IF NOT EXISTS task_subtasks (
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

-- 7. Create task_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_comments (
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

-- 8. Create task_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_attachments (
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

-- 9. Enable RLS on new tables
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- 10. Create basic RLS policies for subtasks
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_subtasks' 
        AND policyname = 'Users can manage subtasks for their tasks'
    ) THEN
        CREATE POLICY "Users can manage subtasks for their tasks" ON task_subtasks
          FOR ALL USING (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM tasks WHERE tasks.id = parent_task_id AND tasks.user_id = auth.uid())
          );
    END IF;
END $$;

-- 11. Create basic RLS policies for comments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_comments' 
        AND policyname = 'Users can manage comments on their tasks'
    ) THEN
        CREATE POLICY "Users can manage comments on their tasks" ON task_comments
          FOR ALL USING (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
          );
    END IF;
END $$;

-- 12. Create basic RLS policies for attachments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_attachments' 
        AND policyname = 'Users can manage attachments on their tasks'
    ) THEN
        CREATE POLICY "Users can manage attachments on their tasks" ON task_attachments
          FOR ALL USING (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
          );
    END IF;
END $$;

-- 13. Verify everything was created
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('taskboards', 'task_subtasks', 'task_comments', 'task_attachments')
ORDER BY table_name;

SELECT 'Preferences column status:' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'preferences';

SELECT 'Migration complete!' as status;