-- Add activity logging system for tasks
-- Run this in your Supabase SQL editor

-- 1. Create task_activities table
CREATE TABLE IF NOT EXISTS task_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT, -- Cache user display name for performance
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'moved', 'status_changed', 'priority_changed', 'assigned', 'completed', 'deleted')),
    field_name TEXT, -- Field that was changed (e.g., 'status', 'priority')
    old_value TEXT, -- Previous value (as string)
    new_value TEXT, -- New value (as string)
    description TEXT NOT NULL, -- Human-readable description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on task_activities
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for task_activities
CREATE POLICY "Users can view activity for their tasks" ON task_activities
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_activities.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can create activity for their tasks" ON task_activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_activities.task_id AND tasks.user_id = auth.uid())
  );

-- 4. Add created_by field to tasks table if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_activities_task_id ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_user_id ON task_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created_at ON task_activities(created_at);

-- 6. Create function to log task changes
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log task creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_activities (
      task_id, 
      user_id, 
      action, 
      description,
      created_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'created',
      'Task created',
      NOW()
    );
    RETURN NEW;
  END IF;
  
  -- Log task updates
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO task_activities (
        task_id, 
        user_id, 
        action, 
        field_name,
        old_value,
        new_value,
        description,
        created_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'status_changed',
        'status',
        OLD.status,
        NEW.status,
        'Status changed from ' || COALESCE(OLD.status, 'unknown') || ' to ' || COALESCE(NEW.status, 'unknown'),
        NOW()
      );
    END IF;
    
    -- Priority change
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO task_activities (
        task_id, 
        user_id, 
        action, 
        field_name,
        old_value,
        new_value,
        description,
        created_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'priority_changed',
        'priority',
        OLD.priority,
        NEW.priority,
        'Priority changed from ' || COALESCE(OLD.priority, 'unknown') || ' to ' || COALESCE(NEW.priority, 'unknown'),
        NOW()
      );
    END IF;
    
    -- Title change
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      INSERT INTO task_activities (
        task_id, 
        user_id, 
        action, 
        field_name,
        old_value,
        new_value,
        description,
        created_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'updated',
        'title',
        OLD.title,
        NEW.title,
        'Title updated',
        NOW()
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger on tasks table
DROP TRIGGER IF EXISTS trigger_log_task_activity ON tasks;
CREATE TRIGGER trigger_log_task_activity
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_activity();

-- 8. Add initial activity records for existing tasks (optional)
INSERT INTO task_activities (task_id, user_id, action, description, created_at)
SELECT 
  id,
  user_id,
  'created',
  'Task created (imported)',
  created_at
FROM tasks 
WHERE NOT EXISTS (
  SELECT 1 FROM task_activities 
  WHERE task_activities.task_id = tasks.id 
  AND task_activities.action = 'created'
);

-- 9. Grant permissions
GRANT SELECT, INSERT ON task_activities TO authenticated;

SELECT 'Activity logging system created successfully!' as result;