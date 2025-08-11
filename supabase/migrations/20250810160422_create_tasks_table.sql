
-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    blocked_by TEXT[] DEFAULT '{}',
    user_id UUID,
    taskboard_id UUID,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_blocked_by ON tasks USING GIN (blocked_by);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_taskboard_id ON tasks(taskboard_id);

-- Create a Rashenal AI board for development
DO $$
DECLARE
    rashenal_board_id UUID;
    dev_user_id UUID;
BEGIN
    -- Get the dev user ID (you may need to adjust this based on your actual user)
    SELECT id INTO dev_user_id FROM auth.users WHERE email = 'rharveybis@hotmail.com' LIMIT 1;
    
    -- If no user found, use a placeholder (you'll need to update this after creating user)
    IF dev_user_id IS NULL THEN
        dev_user_id := gen_random_uuid();
    END IF;
    
    -- Create the Rashenal AI board
    INSERT INTO public.taskboards (id, user_id, name, description, color, position, is_active)
    VALUES (
        gen_random_uuid(),
        dev_user_id,
        'Rashenal AI Board',
        'AI-powered development roadmap for Rashenal platform',
        '#8B5CF6',
        0,
        true
    )
    RETURNING id INTO rashenal_board_id;
    
    -- Store the board ID for use in task inserts
    PERFORM set_config('app.rashenal_board_id', rashenal_board_id::text, false);
    PERFORM set_config('app.dev_user_id', dev_user_id::text, false);
END $$;

-- Seed data from the CSV
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-1',
  'Security & Data Model Baseline',
  'Foundation for trust: RLS, encryption, audit logs, privacy controls.',
  NULL,
  '{}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  10
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-1.1',
  'Lock RLS on every table',
  'Verify Row-Level Security across all new/existing tables; add policies where missing.',
  'rsh-1',
  '{}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  20
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-1.2',
  'Add client-side encryption framework',
  'Per-user keys; dev override for rharveybis@hotmail.com; plan for key rotation & migrations.',
  'rsh-1',
  '{}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  30
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-1.3',
  'Implement audit logging',
  'Capture CRUD events with who/when/what; store immutable audit trail.',
  'rsh-1',
  '{}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  40
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-1.4',
  'Add GDPR/privacy controls',
  'User data export & delete endpoints; document data retention.',
  'rsh-1',
  '{}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  50
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-2',
  'Data Layer (Life Management Spine)',
  'Wire real persistence for tasks, habits, goals.',
  NULL,
  '{rsh-1.1,rsh-1.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'high',
  60
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-2.1',
  'Tasks CRUD with persistence',
  'Fix save/reload bugs; filters by project/tag/status.',
  'rsh-2',
  '{rsh-1.1,rsh-1.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'high',
  70
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-2.2',
  'Habits CRUD and streak calculation',
  'Simple streak logic; daily/weekly cadence fields.',
  'rsh-2',
  '{rsh-1.1,rsh-1.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'high',
  80
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-2.3',
  'Habit progress analytics (basic)',
  'Counts, streaks, completion % (charts later).',
  'rsh-2',
  '{rsh-2.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  90
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-2.4',
  'Goals CRUD and link to tasks/habits',
  'Goal ↔ Task/Habit relationships; status rollups.',
  'rsh-2',
  '{rsh-1.1,rsh-1.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'high',
  100
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-3',
  'Jobs Module Foundation',
  'Store jobs, score them, and explode to tasks.',
  NULL,
  '{rsh-1.1,rsh-1.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'high',
  110
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-3.1',
  'Create Jobs table schema',
  'All fields for scoring, tagging, and metadata.',
  'rsh-3',
  '{rsh-1.1,rsh-1.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'high',
  120
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-3.2',
  'Manual job entry + edit',
  'Form to add/edit jobs; validation & persistence.',
  'rsh-3',
  '{rsh-3.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  130
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-3.3',
  'Score calculation + manual override',
  'Base scoring function with user override field.',
  'rsh-3',
  '{rsh-3.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  140
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-3.4',
  'Link jobs to tasks (auto-subtasks)',
  'On job add: create subtasks, attach doc ids.',
  'rsh-3',
  '{rsh-3.1,rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  150
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-4',
  'Unified Weekly View',
  'Single source of truth for week plan.',
  NULL,
  '{rsh-2.1,rsh-2.2,rsh-2.4}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  160
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-4.1',
  'Calendar aggregates Tasks/Habits/Goals',
  'Internal aggregation first; external sync later.',
  'rsh-4',
  '{rsh-2.1,rsh-2.2,rsh-2.4}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  170
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-4.2',
  'Calendar filtering & colour-coding',
  'Filter by type/status; quick legend.',
  'rsh-4',
  '{rsh-4.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  180
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-4.3',
  'Deadlines & streak markers',
  'Show task deadlines and habit streak badges.',
  'rsh-4',
  '{rsh-4.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  190
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-5',
  'Error Handling & Test Harness',
  'Stability and basic quality gates.',
  NULL,
  '{rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  200
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-5.1',
  'Global error boundary',
  'Catch UI crashes; friendly fallback.',
  'rsh-5',
  '{rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  210
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-5.2',
  'API error handling & messages',
  'Surface API errors with actionable copy.',
  'rsh-5',
  '{rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  220
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-5.3',
  'Minimal unit tests',
  'Focus on Tasks, Habits, Jobs core paths.',
  'rsh-5',
  '{rsh-5.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  230
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-5.4',
  'Basic a11y & E2E smoke test',
  'Keyboard nav + one happy-path flow.',
  'rsh-5',
  '{rsh-5.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  240
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-6',
  'Quick-Win Engagement Features',
  'Stickiness boosters that don’t block MVP.',
  NULL,
  '{}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  250
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-6.1',
  'Next Best Action widget',
  'Reads Tasks/Habits; suggests the next action.',
  'rsh-6',
  '{rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  260
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-6.2',
  'Daily accountability check-in',
  'Simple text capture & reminder hook.',
  'rsh-6',
  '{rsh-2.2}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  270
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-6.3',
  'CV/cover letter generator per job',
  'Generate docs from profile + job data.',
  'rsh-6',
  '{rsh-3.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  280
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-7',
  'Post-MVP / Nice-to-Have Integrations',
  'Do not start before MVP spine is stable.',
  NULL,
  '{rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  290
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-7.1',
  'External calendar sync (Google)',
  'OAuth, 2-way sync, conflict handling.',
  'rsh-7',
  '{rsh-1.1,rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'low',
  300
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-7.2',
  'External calendar sync (Outlook)',
  'Graph API; similar to 7.1.',
  'rsh-7',
  '{rsh-1.1,rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'low',
  310
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-7.3',
  'Email SMTP/IMAP integration',
  'Alerts, follow-ups, job inbox rules.',
  'rsh-7',
  '{rsh-1.1,rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'low',
  320
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-7.4',
  'External job API import',
  'Indeed/LinkedIn adapters; rate limiters.',
  'rsh-7',
  '{rsh-1.1,rsh-2.1,rsh-3.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'low',
  330
);
INSERT INTO tasks (id, title, description, parent_id, blocked_by, user_id, taskboard_id, status, priority, position) VALUES (
  'rsh-7.5',
  'Plugin architecture core (RashPlugs)',
  'Registry, loader, sandbox; versioning.',
  'rsh-7',
  '{rsh-2.1}',
  current_setting('app.dev_user_id')::UUID,
  current_setting('app.rashenal_board_id')::UUID,
  'todo',
  'medium',
  340
);
