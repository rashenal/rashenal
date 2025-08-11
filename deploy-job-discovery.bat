@echo off
echo 🚀 Deploying Job Discovery Edge Function...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI is not installed. Please install it first:
    echo npm install -g supabase
    exit /b 1
)

REM Check if we're in the right directory
if not exist "supabase\functions\job-discovery\index.ts" (
    echo ❌ job-discovery function not found. Make sure you're in the project root directory.
    exit /b 1
)

REM Deploy the function
echo 📦 Deploying job-discovery function...
supabase functions deploy job-discovery

if %ERRORLEVEL% EQU 0 (
    echo ✅ Job Discovery function deployed successfully!
    echo.
    echo 🔑 Don't forget to set the required secrets:
    echo supabase secrets set ANTHROPIC_API_KEY=your-api-key
    echo supabase secrets set SUPABASE_URL=your-supabase-url
    echo supabase secrets set SUPABASE_ANON_KEY=your-anon-key
    echo.
    echo 📋 Function capabilities:
    echo - AI-powered job analysis and scoring
    echo - Job matching against user profiles
    echo - Automated job search execution
    echo.
    echo 🎯 Ready to power your Job Finder module!
) else (
    echo ❌ Deployment failed. Please check the error messages above.
    exit /b 1
)