@echo off
REM SIMPLE MANUAL APPROACH - Just show the SQL to copy/paste

echo 🚨 IMMEDIATE FIX - enhanced_taskboard_analytics missing updated_at
echo.
echo Due to CLI syntax issues, let's do this manually:
echo.
echo 📋 STEP 1: Run this command:
echo supabase db remote sql
echo.
echo 📋 STEP 2: When prompted, copy and paste this EXACT SQL:
echo.
echo ========================= COPY THIS SQL =========================
echo -- Quick manual fix for enhanced_taskboard_analytics missing updated_at
echo -- Paste this directly into: supabase db remote sql
echo.
echo BEGIN;
echo.
echo -- Drop and recreate enhanced_taskboard_analytics with updated_at
echo DROP VIEW IF EXISTS enhanced_taskboard_analytics CASCADE;
echo.
echo CREATE VIEW enhanced_taskboard_analytics AS
echo SELECT 
echo     tb.id as taskboard_id,
echo     tb.name as taskboard_name,
echo     tb.description as taskboard_description,
echo     tb.user_id,
echo     tb.created_at as taskboard_created_at,
echo     tb.updated_at as taskboard_updated_at, -- CRITICAL: Include updated_at
echo     
echo     -- Task statistics
echo     COUNT(t.id) as total_tasks,
echo     COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
echo     COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
echo     COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
echo     COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
echo     
echo     -- Progress metrics
echo     CASE 
echo         WHEN COUNT(t.id) ^> 0 
echo         THEN ROUND((COUNT(CASE WHEN t.status = 'done' THEN 1 END)::DECIMAL / COUNT(t.id)::DECIMAL) * 100, 2)
echo         ELSE 0 
echo     END as completion_percentage,
echo     
echo     -- Updated timestamp for the analytics view itself
echo     GREATEST(tb.updated_at, MAX(t.updated_at)) as updated_at -- CRITICAL: This ensures updated_at exists
echo     
echo FROM taskboards tb
echo LEFT JOIN tasks t ON tb.id = t.taskboard_id
echo GROUP BY 
echo     tb.id, 
echo     tb.name, 
echo     tb.description, 
echo     tb.user_id, 
echo     tb.created_at, 
echo     tb.updated_at;
echo.
echo -- Grant permissions
echo GRANT SELECT ON enhanced_taskboard_analytics TO authenticated;
echo.
echo COMMIT;
echo.
echo -- Test the view
echo SELECT 'enhanced_taskboard_analytics created successfully!' as status;
echo SELECT column_name FROM information_schema.columns 
echo WHERE table_name = 'enhanced_taskboard_analytics' AND column_name = 'updated_at';
echo ================================================================
echo.
echo 📋 STEP 3: Press Enter to execute the SQL
echo.
echo 📋 STEP 4: You should see "enhanced_taskboard_analytics created successfully!"
echo.
echo 🎉 Your frontend should then work without missing column errors!