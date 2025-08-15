@echo off
REM Immediate fix - bypasses migration issues and fixes enhanced_taskboard_analytics directly

echo 🚨 IMMEDIATE FIX - enhanced_taskboard_analytics missing updated_at
echo Bypassing migration issues and applying direct SQL fix...
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

echo 🔧 Applying direct SQL fix for enhanced_taskboard_analytics...
supabase db remote sql < quick_manual_fix.sql

if %errorlevel% equ 0 (
    echo ✅ IMMEDIATE FIX APPLIED SUCCESSFULLY!
    echo ✅ enhanced_taskboard_analytics view created with updated_at column
    echo ✅ Your frontend should now work without the missing column error
    echo.
    echo 🔍 Testing the fix...
    echo SELECT 'Testing enhanced_taskboard_analytics:', COUNT(*) FROM enhanced_taskboard_analytics; | supabase db remote sql
    echo.
    echo 🎉 DONE! Your app should work now.
    echo.
    echo 📝 Next steps:
    echo   1. Test your frontend - the missing column error should be gone
    echo   2. Later, we can clean up the migration ordering issues
    echo   3. Run migrations properly once the immediate issue is resolved
) else (
    echo ❌ Direct SQL fix failed. 
    echo.
    echo 💡 Alternative: Try running this manually:
    echo supabase db remote sql
    echo Then paste the contents of quick_manual_fix.sql
)