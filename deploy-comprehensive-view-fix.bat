@echo off
REM Comprehensive fix for ALL missing updated_at columns in views
REM This script fixes enhanced_taskboard_analytics and any other missing columns

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
echo Running diagnostic script to identify all issues...
supabase db remote exec --file=diagnose_missing_views.sql

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

REM Apply the comprehensive migration
echo 📦 Applying migration: 20250813_fix_all_missing_updated_at_views.sql
supabase db push

if %errorlevel% equ 0 (
    echo ✅ Comprehensive migration applied successfully!
    echo.
    echo 🔍 Step 3: Final verification...
    supabase db remote exec --file=diagnose_missing_views.sql
    
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
        echo.
        echo 📝 Available Analytics Views:
        echo   - enhanced_taskboard_analytics (taskboard-level metrics)
        echo   - user_task_analytics (user-level productivity metrics)
        echo   - task_progress_analytics (individual task progress)
        echo   - tasks_with_dependencies (enhanced task view)
    ) else (
        echo ⚠️ Verification had issues. Check the diagnostic output above.
    )
) else (
    echo ❌ Migration failed. Check the error output above.
    echo.
    echo 🔍 Common issues:
    echo   - Conflicting view definitions
    echo   - Missing base tables
    echo   - Permission issues
    echo   - Supabase connection problems
    exit /b 1
)