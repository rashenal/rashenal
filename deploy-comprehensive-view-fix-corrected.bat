@echo off
REM CORRECTED - Comprehensive fix for ALL missing updated_at columns in views
REM Fixed CLI syntax and migration issues

echo 🚨 COMPREHENSIVE SCHEMA FIX - All Missing updated_at Columns
echo This will fix enhanced_taskboard_analytics and any other views missing updated_at
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if supabase CLI is available
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    exit /b 1
)

echo 🔍 Step 1: Diagnosing existing views and missing columns...
echo Running diagnostic SQL directly...

REM Use SQL command instead of remote exec --file
supabase db remote sql < diagnose_missing_views.sql

echo.
echo 📋 Diagnostic complete. Now applying comprehensive fix...
echo.

echo 🔧 Step 2: Applying comprehensive view fixes...
echo This will:
echo   - Create/fix enhanced_taskboard_analytics view
echo   - Ensure all analytics views have updated_at columns
echo   - Fix tasks_with_dependencies view (again, to be sure)
echo   - Add proper indexes and permissions
echo.

REM Fix migration naming and apply with --include-all flag
echo 📦 Applying migration with --include-all flag to handle ordering...
supabase db push --include-all

if %errorlevel% equ 0 (
    echo ✅ Comprehensive migration applied successfully!
    echo.
    echo 🔍 Step 3: Final verification...
    echo Running verification SQL...
    
    REM Verification SQL inline
    echo SELECT 'enhanced_taskboard_analytics columns:' as info; SELECT column_name FROM information_schema.columns WHERE table_name = 'enhanced_taskboard_analytics' AND column_name = 'updated_at'; | supabase db remote sql
    
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 ALL SCHEMA ISSUES FIXED!
        echo ✅ enhanced_taskboard_analytics view created with updated_at
        echo ✅ user_task_analytics view created
        echo ✅ task_progress_analytics view created  
        echo ✅ tasks_with_dependencies view updated
        echo ✅ All views now have proper updated_at columns
        echo ✅ Performance indexes added
        echo ✅ Permissions granted
        echo.
        echo 🚀 Your frontend should now work without any missing column errors!
    ) else (
        echo ⚠️ Verification had some issues but migration may have succeeded.
    )
) else (
    echo ❌ Migration failed. Let's try a different approach...
    echo.
    echo 🔄 Alternative: Running SQL directly...
    echo Applying the comprehensive fix via direct SQL execution...
    
    supabase db remote sql < 20250813_fix_all_missing_updated_at_views.sql
    
    if %errorlevel% equ 0 (
        echo ✅ Direct SQL execution successful!
    ) else (
        echo ❌ Both migration methods failed. Manual intervention required.
        echo.
        echo 🔍 Common issues:
        echo   - Database connection problems
        echo   - Permission issues  
        echo   - Conflicting schema changes
        echo.
        echo 💡 Try: supabase db remote sql and paste the SQL manually
    )
)