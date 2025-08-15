-- 🧠 BULLETPROOF SCHEMA-AWARE TASK CREATION
-- This script detects your schema and uses the right INSERT for each combination
-- NO MORE PARAMETER MISMATCHES!

-- Step 1: Discover your actual tasks table schema
DO $$ 
DECLARE
    has_energy_level BOOLEAN;
    has_tags BOOLEAN;
    has_business_value BOOLEAN;
    has_estimated_time BOOLEAN;
    has_priority BOOLEAN;
    has_position BOOLEAN;
    taskboard_uuid UUID;
    user_uuid UUID := 'fec8b253-9b68-4136-9611-e1dfcbd4be65';
    schema_type TEXT;
BEGIN
    -- Detect which columns exist in your tasks table
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'energy_level') INTO has_energy_level;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'tags') INTO has_tags;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'business_value') INTO has_business_value;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'estimated_time') INTO has_estimated_time;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') INTO has_priority;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') INTO has_position;
    
    -- Determine schema type
    IF has_position AND has_business_value AND has_tags AND has_energy_level AND has_priority AND has_estimated_time THEN
        schema_type := 'FULL';
    ELSIF has_priority AND has_estimated_time AND has_tags AND has_position THEN
        schema_type := 'STANDARD_PLUS';
    ELSIF has_priority AND has_estimated_time THEN
        schema_type := 'BASIC';
    ELSE
        schema_type := 'MINIMAL';
    END IF;
    
    -- Report what we found
    RAISE NOTICE '🔍 SCHEMA DETECTION RESULTS:';
    RAISE NOTICE 'energy_level: %, tags: %, business_value: %, estimated_time: %, priority: %, position: %', 
        has_energy_level, has_tags, has_business_value, has_estimated_time, has_priority, has_position;
    RAISE NOTICE 'Schema type detected: %', schema_type;
    
    -- Find Feature Build Hopper taskboard
    SELECT id INTO taskboard_uuid 
    FROM taskboards 
    WHERE name LIKE '%Feature Build Hopper%' 
    AND user_id = user_uuid
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF taskboard_uuid IS NULL THEN
        RAISE EXCEPTION 'Feature Build Hopper taskboard not found for user %', user_uuid;
    END IF;
    
    RAISE NOTICE 'Found Feature Build Hopper taskboard: %', taskboard_uuid;
    
    -- Create tasks based on schema type
    IF schema_type = 'FULL' THEN
        -- Full schema: all columns available
        
        -- Task 1
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, energy_level, tags, business_value, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🚨 Deploy Enhanced Taskboards Database Schema',
            'URGENT: Deploy enhanced-taskboards-schema.sql to add business intelligence columns to existing taskboards.

✅ ACCEPTANCE CRITERIA:
- Schema deployed successfully in Supabase
- All existing taskboards preserved (no data loss)
- New columns added: category, priority, budget, revenue_target
- Automatic categorization of existing taskboards
- Enhanced analytics view created

🧪 TEST PLAN:
1. Verify existing taskboard count before deployment
2. Run enhanced-taskboards-schema.sql
3. Check automatic categorization worked
4. Test enhanced_taskboard_analytics view
5. Confirm all existing tasks still linked

📁 FILES: enhanced-taskboards-schema.sql',
            'todo',
            'high',
            30,
            'm',
            ARRAY['database', 'schema', 'critical'],
            90,
            0,
            NOW(),
            NOW()
        );
        
        -- Task 2
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, energy_level, tags, business_value, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧪 Test Enhanced Taskboard Manager Component',
            'Comprehensive testing of EnhancedTaskboardManager component with existing data integration.

✅ ACCEPTANCE CRITERIA:
- Component loads existing taskboards without errors
- Business intelligence fields display correctly
- Analytics calculations accurate
- Filtering and sorting work properly
- Mobile responsiveness verified

🧪 TEST PLAN:
1. Unit tests with mock data
2. Integration tests with real Supabase data
3. Manual testing with existing taskboards
4. Performance testing
5. Cross-browser compatibility

📁 FILES: EnhancedTaskboardManager.tsx',
            'todo',
            'high',
            90,
            'l',
            ARRAY['frontend', 'testing', 'ui'],
            85,
            1,
            NOW(),
            NOW()
        );
        
        -- Task 3
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, energy_level, tags, business_value, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🎯 Test Business Template Creation Flow',
            'Test CreateTaskboardModal with revenue-focused templates for business planning.

✅ ACCEPTANCE CRITERIA:
- Modal displays business templates correctly
- Template selection populates form fields
- Revenue/Marketing/Product templates work
- Form validation catches errors
- Created taskboards appear immediately

🧪 TEST PLAN:
1. Test each template type
2. Verify template data population
3. Test custom taskboard creation
4. Validate form edge cases
5. Check analytics updates

📁 FILES: CreateTaskboardModal.tsx',
            'todo',
            'high',
            60,
            'm',
            ARRAY['frontend', 'templates', 'business'],
            80,
            2,
            NOW(),
            NOW()
        );
        
        -- Task 4
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, energy_level, tags, business_value, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧭 Test Navigation & Route Integration',
            'Verify enhanced taskboards integrate with navigation system.

✅ ACCEPTANCE CRITERIA:
- /projects route loads correctly
- Navigation menu shows Projects
- Mobile navigation works
- Breadcrumbs display properly
- Authentication redirects work

🧪 TEST PLAN:
1. Desktop navigation testing
2. Mobile navigation testing
3. Direct URL access testing
4. Inter-component navigation
5. Authentication flow testing

📁 FILES: AisistaNavigation.tsx, App.tsx',
            'todo',
            'medium',
            30,
            's',
            ARRAY['navigation', 'routing'],
            70,
            3,
            NOW(),
            NOW()
        );
        
        -- Task 5
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, energy_level, tags, business_value, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🏢 Enterprise Performance & Load Testing',
            'Comprehensive performance testing for enterprise readiness.

✅ ACCEPTANCE CRITERIA:
- Page loads in <2 seconds with 50+ taskboards
- Analytics calculations <1 second
- Database queries optimized
- Memory usage stable
- Mobile performance meets standards

🧪 TEST PLAN:
1. Create test dataset (100+ taskboards)
2. Database query performance analysis
3. Memory usage monitoring
4. Browser compatibility testing
5. Accessibility compliance testing

📁 FILES: Performance test scripts',
            'todo',
            'high',
            120,
            'xl',
            ARRAY['performance', 'enterprise'],
            95,
            4,
            NOW(),
            NOW()
        );
        
        -- Task 6
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, energy_level, tags, business_value, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🤖 Build Automated Test Suite Framework',
            'Create comprehensive automated testing framework for current and future features.

✅ ACCEPTANCE CRITERIA:
- Unit tests >90% coverage
- Integration tests for all Supabase operations
- E2E tests for critical user journeys
- Tests run in CI/CD pipeline
- Test data setup/teardown automated

🧪 TEST FRAMEWORK:
1. Jest + React Testing Library
2. Playwright for E2E testing
3. Supabase test environment
4. CI/CD integration
5. Performance regression testing

📁 FILES: Test framework config, CI/CD pipeline',
            'todo',
            'medium',
            180,
            'xl',
            ARRAY['testing', 'automation', 'framework'],
            75,
            5,
            NOW(),
            NOW()
        );
        
    ELSIF schema_type = 'STANDARD_PLUS' THEN
        -- Standard plus schema: priority, estimated_time, tags, position
        
        -- Task 1
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, tags, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🚨 Deploy Enhanced Taskboards Database Schema',
            'URGENT: Deploy enhanced-taskboards-schema.sql to add business intelligence columns. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'high',
            30,
            ARRAY['database', 'schema', 'critical'],
            0,
            NOW(),
            NOW()
        );
        
        -- Task 2
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, tags, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧪 Test Enhanced Taskboard Manager Component',
            'Comprehensive testing of EnhancedTaskboardManager component. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'high',
            90,
            ARRAY['frontend', 'testing', 'ui'],
            1,
            NOW(),
            NOW()
        );
        
        -- Task 3
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, tags, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🎯 Test Business Template Creation Flow',
            'Test CreateTaskboardModal with revenue-focused templates. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'high',
            60,
            ARRAY['frontend', 'templates', 'business'],
            2,
            NOW(),
            NOW()
        );
        
        -- Task 4
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, tags, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧭 Test Navigation & Route Integration',
            'Verify enhanced taskboards integrate with navigation. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'medium',
            30,
            ARRAY['navigation', 'routing'],
            3,
            NOW(),
            NOW()
        );
        
        -- Task 5
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, tags, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🏢 Enterprise Performance & Load Testing',
            'Comprehensive performance testing for enterprise readiness. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'high',
            120,
            ARRAY['performance', 'enterprise'],
            4,
            NOW(),
            NOW()
        );
        
        -- Task 6
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, tags, position, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🤖 Build Automated Test Suite Framework',
            'Create comprehensive automated testing framework. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'medium',
            180,
            ARRAY['testing', 'automation', 'framework'],
            5,
            NOW(),
            NOW()
        );
        
    ELSIF schema_type = 'BASIC' THEN
        -- Basic schema: priority, estimated_time
        
        -- Task 1
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🚨 Deploy Enhanced Taskboards Database Schema',
            'URGENT: Deploy enhanced-taskboards-schema.sql to add business intelligence columns. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'high',
            30,
            NOW(),
            NOW()
        );
        
        -- Task 2
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧪 Test Enhanced Taskboard Manager Component',
            'Comprehensive testing of EnhancedTaskboardManager component. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'high',
            90,
            NOW(),
            NOW()
        );
        
        -- Task 3
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🎯 Test Business Template Creation Flow',
            'Test CreateTaskboardModal with revenue-focused templates. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'high',
            60,
            NOW(),
            NOW()
        );
        
        -- Task 4
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧭 Test Navigation & Route Integration',
            'Verify enhanced taskboards integrate with navigation. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'medium',
            30,
            NOW(),
            NOW()
        );
        
        -- Task 5
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🏢 Enterprise Performance & Load Testing',
            'Comprehensive performance testing for enterprise readiness. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'high',
            120,
            NOW(),
            NOW()
        );
        
        -- Task 6
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, priority, estimated_time, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🤖 Build Automated Test Suite Framework',
            'Create comprehensive automated testing framework. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'medium',
            180,
            NOW(),
            NOW()
        );
        
    ELSE
        -- Minimal schema: just core columns
        
        -- Task 1
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🚨 Deploy Enhanced Taskboards Database Schema',
            'URGENT: Deploy enhanced-taskboards-schema.sql to add business intelligence columns. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            NOW(),
            NOW()
        );
        
        -- Task 2
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧪 Test Enhanced Taskboard Manager Component',
            'Comprehensive testing of EnhancedTaskboardManager component. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            NOW(),
            NOW()
        );
        
        -- Task 3
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🎯 Test Business Template Creation Flow',
            'Test CreateTaskboardModal with revenue-focused templates. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            NOW(),
            NOW()
        );
        
        -- Task 4
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🧭 Test Navigation & Route Integration',
            'Verify enhanced taskboards integrate with navigation. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            NOW(),
            NOW()
        );
        
        -- Task 5
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🏢 Enterprise Performance & Load Testing',
            'Comprehensive performance testing for enterprise readiness. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            NOW(),
            NOW()
        );
        
        -- Task 6
        INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at)
        VALUES (
            taskboard_uuid,
            user_uuid,
            '🤖 Build Automated Test Suite Framework',
            'Create comprehensive automated testing framework. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            NOW(),
            NOW()
        );
        
    END IF;
    
    -- Update taskboard counter
    UPDATE taskboards 
    SET task_counter = task_counter + 6,
        updated_at = NOW()
    WHERE id = taskboard_uuid
    AND user_id = user_uuid;
    
    RAISE NOTICE '✅ Successfully added 6 development tasks to Feature Build Hopper!';
    RAISE NOTICE '📋 Schema type used: %', schema_type;
    
END $$;

-- Verification: Show what was actually created
SELECT 
    '✅ VERIFICATION RESULTS' as status,
    COUNT(*) as tasks_added,
    tb.name as taskboard_name,
    tb.task_counter as total_tasks_in_board,
    MIN(t.created_at) as first_task_created,
    MAX(t.created_at) as last_task_created
FROM tasks t
JOIN taskboards tb ON t.taskboard_id = tb.id
WHERE tb.name LIKE '%Feature Build Hopper%'
AND t.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND t.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY tb.name, tb.task_counter;

-- Show your actual tasks table schema for reference
SELECT 
    '📋 YOUR ACTUAL TASKS TABLE SCHEMA:' as info,
    column_name,
    data_type,
    is_nullable,
    COALESCE(column_default, 'No default') as column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the tasks that were created
SELECT 
    '📝 TASKS CREATED:' as info,
    ROW_NUMBER() OVER (ORDER BY 
        COALESCE(t.position, 999), t.created_at
    ) as task_number,
    LEFT(t.title, 50) || CASE WHEN LENGTH(t.title) > 50 THEN '...' ELSE '' END as title_preview,
    COALESCE(t.priority, 'N/A') as priority,
    COALESCE(t.estimated_time::text || ' min', 'N/A') as estimated_time,
    COALESCE(t.position::text, 'N/A') as position,
    t.status,
    to_char(t.created_at, 'HH24:MI:SS') as created_time
FROM tasks t
JOIN taskboards tb ON t.taskboard_id = tb.id
WHERE tb.name LIKE '%Feature Build Hopper%'
AND t.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND t.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY COALESCE(t.position, 999), t.created_at;
