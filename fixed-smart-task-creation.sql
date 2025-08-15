-- 🧠 FIXED SMART SCHEMA-AWARE TASK CREATION
-- This script automatically detects your schema and adapts accordingly
-- FIXED: Parameter numbering bug resolved!

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
    insert_columns TEXT;
    insert_values TEXT;
    param_count INTEGER := 5; -- Start after the 5 core parameters
    task_sql TEXT;
BEGIN
    -- Detect which columns exist in your tasks table
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'energy_level') INTO has_energy_level;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'tags') INTO has_tags;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'business_value') INTO has_business_value;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'estimated_time') INTO has_estimated_time;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') INTO has_priority;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') INTO has_position;
    
    -- Report what we found
    RAISE NOTICE '🔍 SCHEMA DETECTION RESULTS:';
    RAISE NOTICE 'energy_level column exists: %', has_energy_level;
    RAISE NOTICE 'tags column exists: %', has_tags;
    RAISE NOTICE 'business_value column exists: %', has_business_value;
    RAISE NOTICE 'estimated_time column exists: %', has_estimated_time;
    RAISE NOTICE 'priority column exists: %', has_priority;
    RAISE NOTICE 'position column exists: %', has_position;
    
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
    
    -- Build dynamic INSERT statement based on available columns
    insert_columns := 'taskboard_id, user_id, title, description, status';
    insert_values := '$1, $2, $3, $4, $5';
    
    -- Add optional columns with sequential parameter numbering
    IF has_priority THEN
        param_count := param_count + 1;
        insert_columns := insert_columns || ', priority';
        insert_values := insert_values || ', $' || param_count;
    END IF;
    
    IF has_estimated_time THEN
        param_count := param_count + 1;
        insert_columns := insert_columns || ', estimated_time';
        insert_values := insert_values || ', $' || param_count;
    END IF;
    
    IF has_energy_level THEN
        param_count := param_count + 1;
        insert_columns := insert_columns || ', energy_level';
        insert_values := insert_values || ', $' || param_count;
    END IF;
    
    IF has_tags THEN
        param_count := param_count + 1;
        insert_columns := insert_columns || ', tags';
        insert_values := insert_values || ', $' || param_count;
    END IF;
    
    IF has_business_value THEN
        param_count := param_count + 1;
        insert_columns := insert_columns || ', business_value';
        insert_values := insert_values || ', $' || param_count;
    END IF;
    
    IF has_position THEN
        param_count := param_count + 1;
        insert_columns := insert_columns || ', position';
        insert_values := insert_values || ', $' || param_count;
    END IF;
    
    -- Always add timestamps
    insert_columns := insert_columns || ', created_at, updated_at';
    insert_values := insert_values || ', NOW(), NOW()';
    
    RAISE NOTICE 'Using columns: %', insert_columns;
    RAISE NOTICE 'Using values: %', insert_values;
    RAISE NOTICE 'Total parameters: %', param_count;
    
    -- Build the complete SQL statement
    task_sql := 'INSERT INTO tasks (' || insert_columns || ') VALUES (' || insert_values || ')';
    
    -- Task 1: Database Schema Enhancement
    IF has_position AND has_business_value AND has_tags AND has_energy_level AND has_priority AND has_estimated_time THEN
        -- Full featured version (6 core + 6 optional = 12 parameters)
        EXECUTE task_sql USING 
            taskboard_uuid,                                                              -- $1
            user_uuid,                                                                   -- $2
            '🚨 Deploy Enhanced Taskboards Database Schema',                             -- $3
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

📁 FILES: enhanced-taskboards-schema.sql',                                              -- $4
            'todo',                                                                      -- $5
            'high',                                                                      -- $6 priority
            30,                                                                          -- $7 estimated_time
            'm',                                                                         -- $8 energy_level
            ARRAY['database', 'schema', 'critical'],                                    -- $9 tags
            90,                                                                          -- $10 business_value
            0;                                                                           -- $11 position
            
    ELSIF has_priority AND has_estimated_time THEN
        -- Basic version with priority and time
        EXECUTE task_sql USING 
            taskboard_uuid,
            user_uuid,
            '🚨 Deploy Enhanced Taskboards Database Schema',
            'URGENT: Deploy enhanced-taskboards-schema.sql to add business intelligence columns to existing taskboards. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'high',
            30;
    ELSE
        -- Minimal version - just core columns
        EXECUTE 'INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())'
        USING 
            taskboard_uuid,
            user_uuid,
            '🚨 Deploy Enhanced Taskboards Database Schema',
            'URGENT: Deploy enhanced-taskboards-schema.sql to add business intelligence columns to existing taskboards. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo';
    END IF;
    
    -- Task 2: UI Component Testing
    IF has_position AND has_business_value AND has_tags AND has_energy_level AND has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
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
            1;
    ELSIF has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
            taskboard_uuid,
            user_uuid,
            '🧪 Test Enhanced Taskboard Manager Component',
            'Comprehensive testing of EnhancedTaskboardManager component. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'high',
            90;
    ELSE
        EXECUTE 'INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())'
        USING 
            taskboard_uuid,
            user_uuid,
            '🧪 Test Enhanced Taskboard Manager Component',
            'Comprehensive testing of EnhancedTaskboardManager component. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo';
    END IF;
    
    -- Task 3: Business Template Testing
    IF has_position AND has_business_value AND has_tags AND has_energy_level AND has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
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
            2;
    ELSIF has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
            taskboard_uuid,
            user_uuid,
            '🎯 Test Business Template Creation Flow',
            'Test CreateTaskboardModal with revenue-focused templates. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'high',
            60;
    ELSE
        EXECUTE 'INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())'
        USING 
            taskboard_uuid,
            user_uuid,
            '🎯 Test Business Template Creation Flow',
            'Test CreateTaskboardModal with revenue-focused templates. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo';
    END IF;
    
    -- Task 4: Navigation Integration
    IF has_position AND has_business_value AND has_tags AND has_energy_level AND has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
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
            3;
    ELSIF has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
            taskboard_uuid,
            user_uuid,
            '🧭 Test Navigation & Route Integration',
            'Verify enhanced taskboards integrate with navigation. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'medium',
            30;
    ELSE
        EXECUTE 'INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())'
        USING 
            taskboard_uuid,
            user_uuid,
            '🧭 Test Navigation & Route Integration',
            'Verify enhanced taskboards integrate with navigation. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo';
    END IF;
    
    -- Task 5: Performance Testing
    IF has_position AND has_business_value AND has_tags AND has_energy_level AND has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
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
            4;
    ELSIF has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
            taskboard_uuid,
            user_uuid,
            '🏢 Enterprise Performance & Load Testing',
            'Comprehensive performance testing for enterprise readiness. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo',
            'high',
            120;
    ELSE
        EXECUTE 'INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())'
        USING 
            taskboard_uuid,
            user_uuid,
            '🏢 Enterprise Performance & Load Testing',
            'Comprehensive performance testing for enterprise readiness. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full test plan.',
            'todo';
    END IF;
    
    -- Task 6: Automated Testing Framework
    IF has_position AND has_business_value AND has_tags AND has_energy_level AND has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
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
            5;
    ELSIF has_priority AND has_estimated_time THEN
        EXECUTE task_sql USING 
            taskboard_uuid,
            user_uuid,
            '🤖 Build Automated Test Suite Framework',
            'Create comprehensive automated testing framework. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo',
            'medium',
            180;
    ELSE
        EXECUTE 'INSERT INTO tasks (taskboard_id, user_id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())'
        USING 
            taskboard_uuid,
            user_uuid,
            '🤖 Build Automated Test Suite Framework',
            'Create comprehensive automated testing framework. See ENHANCED_TASKBOARDS_TASK_BREAKDOWN.md for full details.',
            'todo';
    END IF;
    
    -- Update taskboard counter
    UPDATE taskboards 
    SET task_counter = task_counter + 6,
        updated_at = NOW()
    WHERE id = taskboard_uuid
    AND user_id = user_uuid;
    
    RAISE NOTICE '✅ Successfully added 6 development tasks to Feature Build Hopper!';
    RAISE NOTICE '📋 Tasks adapted to your schema: total columns detected = %', 
        (CASE WHEN has_priority THEN 1 ELSE 0 END +
         CASE WHEN has_estimated_time THEN 1 ELSE 0 END +
         CASE WHEN has_energy_level THEN 1 ELSE 0 END +
         CASE WHEN has_tags THEN 1 ELSE 0 END +
         CASE WHEN has_business_value THEN 1 ELSE 0 END +
         CASE WHEN has_position THEN 1 ELSE 0 END);
    
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
    '📝 TASKS CREATED (adapted to your schema):' as info,
    ROW_NUMBER() OVER (ORDER BY 
        CASE WHEN t.position IS NOT NULL THEN t.position ELSE t.created_at END
    ) as task_number,
    LEFT(t.title, 50) || CASE WHEN LENGTH(t.title) > 50 THEN '...' ELSE '' END as title_preview,
    COALESCE(t.priority, 'N/A') as priority,
    COALESCE(t.estimated_time::text || ' min', 'N/A') as estimated_time,
    t.status,
    to_char(t.created_at, 'HH24:MI:SS') as created_time
FROM tasks t
JOIN taskboards tb ON t.taskboard_id = tb.id
WHERE tb.name LIKE '%Feature Build Hopper%'
AND t.user_id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
AND t.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY COALESCE(t.position, 999), t.created_at;
