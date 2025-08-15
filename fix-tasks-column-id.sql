-- Add missing column_id field to tasks table
-- Run this in your Supabase SQL editor

-- 1. Add column_id field to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS column_id TEXT DEFAULT 'todo';

-- 2. Update existing tasks to set column_id based on status
UPDATE tasks 
SET column_id = CASE 
  WHEN status IN ('backlog') THEN 'backlog'
  WHEN status IN ('todo', 'not_started') THEN 'todo'
  WHEN status IN ('in_progress', 'in progress') THEN 'in_progress'
  WHEN status IN ('blocked') THEN 'blocked' 
  WHEN status IN ('done', 'completed') THEN 'done'
  ELSE 'todo'
END
WHERE column_id IS NULL OR column_id = 'todo';

-- 3. Create an index on column_id for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);

-- 4. Verify the update worked
SELECT 
  status, 
  column_id, 
  COUNT(*) as task_count 
FROM tasks 
GROUP BY status, column_id 
ORDER BY status;

SELECT 'column_id field added successfully to tasks table!' as result;