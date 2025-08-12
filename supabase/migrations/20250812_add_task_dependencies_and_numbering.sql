-- Migration: Add task dependencies and task numbering system
-- Date: 2025-08-12
-- Description: Adds parent-child task relationships and automatic task numbering

BEGIN;

-- ==============================================
-- 1. ADD TASK NUMBERING TO TASKBOARDS
-- ==============================================

-- Add abbreviation column to taskboards
ALTER TABLE taskboards 
ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10) UNIQUE,
ADD COLUMN IF NOT EXISTS task_counter INTEGER DEFAULT 0;

-- Function to generate abbreviation from taskboard name
CREATE OR REPLACE FUNCTION generate_taskboard_abbreviation(board_name TEXT)
RETURNS TEXT AS $$
DECLARE
    words TEXT[];
    abbrev TEXT := '';
    word TEXT;
    base_abbrev TEXT;
    counter INTEGER := 1;
    final_abbrev TEXT;
BEGIN
    -- Split the name into words
    words := string_to_array(lower(board_name), ' ');
    
    -- Take first letter of each word (up to 3 words)
    FOREACH word IN ARRAY words[1:3]
    LOOP
        IF length(word) > 0 THEN
            abbrev := abbrev || substring(word, 1, 1);
        END IF;
    END LOOP;
    
    -- If abbreviation is less than 3 chars, pad with first name letters
    WHILE length(abbrev) < 3 AND length(words[1]) > length(abbrev) LOOP
        abbrev := abbrev || substring(words[1], length(abbrev) + 1, 1);
    END LOOP;
    
    -- If still too short, pad with 'x'
    WHILE length(abbrev) < 3 LOOP
        abbrev := abbrev || 'x';
    END LOOP;
    
    -- Ensure it's exactly 3 characters
    base_abbrev := upper(substring(abbrev, 1, 3));
    final_abbrev := base_abbrev;
    
    -- Check for uniqueness and add number if needed
    WHILE EXISTS (SELECT 1 FROM taskboards WHERE abbreviation = final_abbrev) LOOP
        final_abbrev := base_abbrev || counter::text;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_abbrev;
END;
$$ LANGUAGE plpgsql;

-- Update existing taskboards with abbreviations
UPDATE taskboards 
SET abbreviation = generate_taskboard_abbreviation(name)
WHERE abbreviation IS NULL;

-- ==============================================
-- 2. ADD TASK NUMBER AND PARENT REFERENCE
-- ==============================================

-- Add task number and parent reference columns
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS task_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dependency_status VARCHAR(20) DEFAULT 'independent' 
    CHECK (dependency_status IN ('independent', 'blocked', 'ready', 'in_progress', 'completed'));

-- Create index for task lookups
CREATE INDEX IF NOT EXISTS idx_tasks_task_number ON tasks(task_number);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dependency_status ON tasks(dependency_status);

-- Function to generate task number
CREATE OR REPLACE FUNCTION generate_task_number(board_id UUID)
RETURNS TEXT AS $$
DECLARE
    board_abbrev TEXT;
    next_number INTEGER;
    new_task_number TEXT;
BEGIN
    -- Get the board abbreviation and increment counter
    UPDATE taskboards 
    SET task_counter = task_counter + 1
    WHERE id = board_id
    RETURNING abbreviation, task_counter INTO board_abbrev, next_number;
    
    -- Generate task number
    new_task_number := board_abbrev || '-' || next_number::text;
    
    RETURN new_task_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign task numbers
CREATE OR REPLACE FUNCTION assign_task_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign if task_number is null
    IF NEW.task_number IS NULL THEN
        NEW.task_number := generate_task_number(NEW.taskboard_id);
    END IF;
    
    -- Set parent_id to self if not specified (independent task)
    IF NEW.parent_id IS NULL THEN
        NEW.parent_id := NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new tasks
DROP TRIGGER IF EXISTS trigger_assign_task_number ON tasks;
CREATE TRIGGER trigger_assign_task_number
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION assign_task_number();

-- ==============================================
-- 3. UPDATE DEPENDENCY STATUS TRIGGER
-- ==============================================

-- Function to update parent's has_children flag
CREATE OR REPLACE FUNCTION update_parent_has_children()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT or UPDATE with parent_id
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.parent_id IS DISTINCT FROM OLD.parent_id) THEN
        -- Update new parent
        IF NEW.parent_id IS NOT NULL AND NEW.parent_id != NEW.id THEN
            UPDATE tasks 
            SET has_children = TRUE 
            WHERE id = NEW.parent_id;
        END IF;
        
        -- Update old parent if changed
        IF TG_OP = 'UPDATE' AND OLD.parent_id IS NOT NULL AND OLD.parent_id != OLD.id THEN
            -- Check if old parent still has children
            UPDATE tasks 
            SET has_children = EXISTS (
                SELECT 1 FROM tasks t2 
                WHERE t2.parent_id = OLD.parent_id 
                AND t2.id != t2.parent_id
            )
            WHERE id = OLD.parent_id;
        END IF;
    END IF;
    
    -- On DELETE
    IF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL AND OLD.parent_id != OLD.id THEN
        -- Check if parent still has children
        UPDATE tasks 
        SET has_children = EXISTS (
            SELECT 1 FROM tasks t2 
            WHERE t2.parent_id = OLD.parent_id 
            AND t2.id != t2.parent_id
        )
        WHERE id = OLD.parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dependency updates
DROP TRIGGER IF EXISTS trigger_update_parent_has_children ON tasks;
CREATE TRIGGER trigger_update_parent_has_children
    AFTER INSERT OR UPDATE OF parent_id OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_has_children();

-- Function to update dependency status based on parent completion
CREATE OR REPLACE FUNCTION update_dependency_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a task is completed, update children to 'ready' if they were 'blocked'
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
        UPDATE tasks 
        SET dependency_status = 'ready'
        WHERE parent_id = NEW.id 
        AND parent_id != id
        AND dependency_status = 'blocked';
    END IF;
    
    -- When a task is uncompleted, update children back to 'blocked'
    IF NEW.status != 'done' AND OLD.status = 'done' THEN
        UPDATE tasks 
        SET dependency_status = 'blocked'
        WHERE parent_id = NEW.id 
        AND parent_id != id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dependency status updates
DROP TRIGGER IF EXISTS trigger_update_dependency_status ON tasks;
CREATE TRIGGER trigger_update_dependency_status
    AFTER UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_dependency_status();

-- ==============================================
-- 4. GENERATE TASK NUMBERS FOR EXISTING TASKS
-- ==============================================

-- Generate task numbers for existing tasks that don't have them
DO $$
DECLARE
    task_record RECORD;
    board_record RECORD;
    task_counter INTEGER;
BEGIN
    -- Initialize counters for each board
    FOR board_record IN 
        SELECT DISTINCT taskboard_id 
        FROM tasks 
        WHERE task_number IS NULL
    LOOP
        task_counter := 0;
        
        -- Generate numbers for tasks in this board
        FOR task_record IN 
            SELECT id 
            FROM tasks 
            WHERE taskboard_id = board_record.taskboard_id 
            AND task_number IS NULL
            ORDER BY created_at
        LOOP
            task_counter := task_counter + 1;
            
            UPDATE tasks 
            SET task_number = (
                SELECT abbreviation || '-' || task_counter::text 
                FROM taskboards 
                WHERE id = board_record.taskboard_id
            )
            WHERE id = task_record.id;
        END LOOP;
        
        -- Update the board's counter
        UPDATE taskboards 
        SET task_counter = task_counter 
        WHERE id = board_record.taskboard_id;
    END LOOP;
END $$;

-- Set parent_id to self for all existing independent tasks
UPDATE tasks 
SET parent_id = id 
WHERE parent_id IS NULL;

-- ==============================================
-- 5. CREATE VIEWS FOR EASIER QUERYING
-- ==============================================

-- View for tasks with dependency information
CREATE OR REPLACE VIEW tasks_with_dependencies AS
SELECT 
    t.*,
    tb.abbreviation as board_abbreviation,
    p.task_number as parent_task_number,
    p.title as parent_title,
    p.status as parent_status,
    CASE 
        WHEN t.parent_id = t.id THEN 'independent'
        WHEN p.status = 'done' THEN 'unblocked'
        ELSE 'blocked'
    END as effective_dependency_status,
    (
        SELECT COUNT(*) 
        FROM tasks c 
        WHERE c.parent_id = t.id AND c.id != c.parent_id
    ) as child_count
FROM tasks t
LEFT JOIN taskboards tb ON t.taskboard_id = tb.id
LEFT JOIN tasks p ON t.parent_id = p.id AND t.parent_id != t.id;

-- ==============================================
-- 6. HELPER FUNCTIONS
-- ==============================================

-- Function to get all children of a task (recursive)
CREATE OR REPLACE FUNCTION get_task_children(task_id UUID)
RETURNS TABLE(
    id UUID,
    task_number VARCHAR(20),
    title TEXT,
    status TEXT,
    level INTEGER
) AS $$
WITH RECURSIVE task_tree AS (
    -- Base case: direct children
    SELECT 
        t.id,
        t.task_number,
        t.title,
        t.status,
        1 as level
    FROM tasks t
    WHERE t.parent_id = task_id AND t.id != t.parent_id
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT 
        t.id,
        t.task_number,
        t.title,
        t.status,
        tt.level + 1
    FROM tasks t
    INNER JOIN task_tree tt ON t.parent_id = tt.id
    WHERE t.id != t.parent_id
)
SELECT * FROM task_tree ORDER BY level, task_number;
$$ LANGUAGE sql;

-- Function to check if task can be started (parent is done)
CREATE OR REPLACE FUNCTION can_start_task(task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    parent_status TEXT;
BEGIN
    SELECT p.status INTO parent_status
    FROM tasks t
    LEFT JOIN tasks p ON t.parent_id = p.id
    WHERE t.id = task_id;
    
    -- Can start if no parent or parent is done
    RETURN parent_status IS NULL OR parent_status = 'done' OR task_id = (SELECT parent_id FROM tasks WHERE id = task_id);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 7. PERMISSIONS AND COMMENTS
-- ==============================================

-- Grant permissions on new functions and views
GRANT EXECUTE ON FUNCTION generate_taskboard_abbreviation TO authenticated;
GRANT EXECUTE ON FUNCTION generate_task_number TO authenticated;
GRANT EXECUTE ON FUNCTION get_task_children TO authenticated;
GRANT EXECUTE ON FUNCTION can_start_task TO authenticated;
GRANT SELECT ON tasks_with_dependencies TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN tasks.task_number IS 'Unique task identifier in format ABBREV-NUMBER (e.g., RAI-1)';
COMMENT ON COLUMN tasks.parent_id IS 'Reference to parent task for dependencies. Self-reference if independent.';
COMMENT ON COLUMN tasks.has_children IS 'True if this task has dependent child tasks';
COMMENT ON COLUMN tasks.dependency_status IS 'Current dependency state: independent, blocked, ready, in_progress, completed';
COMMENT ON COLUMN taskboards.abbreviation IS 'Unique 3+ letter abbreviation for task numbering (e.g., RAI for Rashenal AI)';
COMMENT ON COLUMN taskboards.task_counter IS 'Counter for generating sequential task numbers';

COMMIT;

-- Verification queries
SELECT 'Task numbering system installed successfully!' as status;
SELECT 'Run these queries to verify:' as info;
-- SELECT * FROM taskboards;
-- SELECT id, task_number, title, parent_id, has_children FROM tasks LIMIT 10;
-- SELECT * FROM tasks_with_dependencies LIMIT 10;