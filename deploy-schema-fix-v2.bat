@echo off
REM Deploy CORRECTED schema fix for tasks table and views
REM This script applies the corrected migration to fix UUID consistency

echo 🔧 Deploying CORRECTED schema fix for tasks table...
echo This will ensure UUID consistency and fix the updated_at column issue

REM Navigate to project directory
cd /d "%~dp0"

REM Check if supabase CLI is available
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    exit /b 1
)

echo 📋 The fix will:
echo   - Standardize all IDs to UUID type for consistency
echo   - Ensure updated_at column exists in tasks_with_dependencies view
echo   - Fix foreign key constraints between tasks and related tables
echo   - Recreate all related tables with proper UUID references
echo.

REM Apply the corrected migration
echo 📦 Applying CORRECTED migration: 20250813_fix_tasks_schema_conflicts_v2.sql
supabase db push

if %errorlevel% equ 0 (
    echo ✅ Migration applied successfully!
    echo.
    echo 🔍 Running verification script...
    supabase db remote exec --file=verify_schema_fix_v2.sql
    
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 Schema fix completed successfully!
        echo ✓ All tables now use UUID consistently
        echo ✓ updated_at column is included in tasks_with_dependencies view
        echo ✓ Foreign key constraints are properly aligned
        echo ✓ RLS policies are in place
        echo.
        echo 🚀 Your frontend should now work properly with UUID-based task system!
        echo.
        echo 📝 NOTE: Frontend expects:
        echo   - task.id as string (UUID format)
        echo   - task.updated_at as string (ISO timestamp)
        echo   - All references use UUID format
    ) else (
        echo ⚠️ Verification script had issues. Check the output above.
    )
) else (
    echo ❌ Migration failed. Check the error output above.
    echo.
    echo 🔍 Common issues:
    echo   - Conflicting data in existing tables
    echo   - Missing permissions
    echo   - Supabase connection problems
    exit /b 1
)