@echo off
REM Deploy schema fix for tasks table and views
REM This script applies the critical migration to fix the updated_at column issue

echo 🔧 Deploying critical schema fix for tasks table...
echo This will fix the missing updated_at column in tasks_with_dependencies view

REM Navigate to project directory
cd /d "%~dp0"

REM Check if supabase CLI is available
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    exit /b 1
)

REM Apply the specific migration
echo 📦 Applying migration: 20250813_fix_tasks_schema_conflicts.sql
supabase db push

if %errorlevel% equ 0 (
    echo ✅ Migration applied successfully!
    echo.
    echo 🔍 Running verification script...
    supabase db remote exec --file=verify_schema_fix.sql
    
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 Schema fix completed successfully!
        echo ✓ tasks table now has proper TEXT id type
        echo ✓ updated_at column is included in tasks_with_dependencies view
        echo ✓ Foreign key constraints are properly aligned
        echo.
        echo 🚀 Your frontend should now work properly with the tasks_with_dependencies view!
    ) else (
        echo ⚠️ Verification script had issues. Check the output above.
    )
) else (
    echo ❌ Migration failed. Check the error output above.
    exit /b 1
)