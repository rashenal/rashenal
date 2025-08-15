-- Diagnostic script to find ALL views missing updated_at column
-- This will help us catch ALL such issues at once

-- 1. Find all views in the database
SELECT 'All views in database:' as diagnostic_step;
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 2. Find all tables and views with columns containing 'updated'
SELECT 'Tables/views with updated columns:' as diagnostic_step;
SELECT DISTINCT
    table_name,
    table_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name ILIKE '%updated%'
ORDER BY table_name, column_name;

-- 3. Check specifically for enhanced_taskboard_analytics
SELECT 'enhanced_taskboard_analytics check:' as diagnostic_step;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_taskboard_analytics')
        THEN 'Table exists'
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'enhanced_taskboard_analytics')
        THEN 'View exists'
        ELSE 'Does not exist'
    END as status;

-- 4. If enhanced_taskboard_analytics exists, show its structure
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'enhanced_taskboard_analytics' AND table_schema = 'public'
    ) OR EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'enhanced_taskboard_analytics' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'enhanced_taskboard_analytics structure:';
        PERFORM 1; -- This is just to make the block valid
    ELSE
        RAISE NOTICE 'enhanced_taskboard_analytics does not exist in database';
    END IF;
END $$;

-- 5. Show columns if the table/view exists
SELECT 'enhanced_taskboard_analytics columns (if exists):' as diagnostic_step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_taskboard_analytics' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Find any views that might be referencing tasks but missing updated_at
SELECT 'Views referencing tasks table:' as diagnostic_step;
SELECT 
    v.viewname,
    v.definition
FROM pg_views v
WHERE v.schemaname = 'public'
    AND v.definition ILIKE '%tasks%'
ORDER BY v.viewname;

-- 7. Find all views that are missing updated_at column
SELECT 'Views missing updated_at column:' as diagnostic_step;
SELECT DISTINCT
    t.table_name as view_name,
    t.table_type
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
    AND t.table_type = 'VIEW'
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c 
        WHERE c.table_name = t.table_name 
            AND c.table_schema = 'public'
            AND c.column_name = 'updated_at'
    )
ORDER BY t.table_name;