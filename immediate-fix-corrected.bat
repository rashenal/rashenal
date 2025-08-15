@echo off
REM CORRECTED - Immediate fix using proper Supabase CLI syntax

echo 🚨 IMMEDIATE FIX - enhanced_taskboard_analytics missing updated_at
echo Using correct CLI syntax for your Supabase version...
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

echo 🔧 Opening interactive SQL console...
echo Please copy and paste the SQL below when prompted:
echo.
echo ============= COPY THIS SQL =============
type quick_manual_fix.sql
echo ========================================
echo.
echo 🔍 Starting Supabase SQL console...
supabase db remote sql

echo.
echo ✅ If you pasted the SQL successfully, your fix should be applied!
echo 🎉 Test your frontend - the missing column error should be gone.