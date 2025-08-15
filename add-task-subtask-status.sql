-- Add status fields for tasks and subtasks
-- Run this in your Supabase SQL editor

-- 1. Add status field to task_subtasks table
ALTER TABLE task_subtasks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo' 
CHECK (status IN ('todo', 'in_progress', 'done'));

-- 2. Update existing subtasks to set status based on is_completed
UPDATE task_subtasks 
SET status = CASE 
  WHEN is_completed = true THEN 'done'
  ELSE 'todo'
END
WHERE status IS NULL;

-- 3. Ensure tasks table has proper status constraint (it should already exist)
DO $$
BEGIN
  -- Check if status column exists and add constraint if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    -- Drop existing constraint if any
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
    
    -- Add comprehensive status constraint
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'blocked', 'done', 'completed'));
    
    -- Set default values for any NULL status
    UPDATE tasks SET status = 'todo' WHERE status IS NULL;
  ELSE
    -- Add status column if it doesn't exist
    ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'todo' 
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'blocked', 'done', 'completed'));
  END IF;
END $$;

-- 4. Create an index on task status for reporting/dashboard queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_status ON task_subtasks(status);

-- 5. Create a trigger to auto-update is_completed when status changes
CREATE OR REPLACE FUNCTION update_subtask_completion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_completed based on status
  NEW.is_completed = (NEW.status = 'done');
  
  -- Set completed_at timestamp
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to task_subtasks
DROP TRIGGER IF EXISTS trigger_update_subtask_completion ON task_subtasks;
CREATE TRIGGER trigger_update_subtask_completion
  BEFORE UPDATE ON task_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_subtask_completion_status();

-- 6. Verify the changes
SELECT 'Status fields added successfully!' as result;

-- Check the schema
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('tasks', 'task_subtasks') 
  AND column_name = 'status'
ORDER BY table_name;