@echo off
REM deploy-ai-coach.bat
REM Automated deployment script for AI Coaching features (Windows)

echo 🤖 Deploying AI Transformation Coach...
echo ==================================

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    pause
    exit /b 1
)

REM Check if we're linked to a Supabase project
if not exist ".supabase\config.toml" (
    echo ❌ Not linked to a Supabase project.
    echo Run: supabase link --project-ref your-project-ref
    pause
    exit /b 1
)

echo ✅ Supabase CLI found

REM Deploy Edge Function
echo 📤 Deploying ai-chat Edge Function...
supabase functions deploy ai-chat

if %ERRORLEVEL% neq 0 (
    echo ❌ Edge Function deployment failed
    pause
    exit /b 1
)

echo ✅ Edge Function deployed successfully

REM Check environment variables
echo 🔐 Checking environment variables...
echo ⚠️  Please ensure these secrets are set in your Supabase dashboard:
echo - ANTHROPIC_API_KEY
echo - SUPABASE_URL  
echo - SUPABASE_ANON_KEY
echo.
echo You can set them with:
echo supabase secrets set ANTHROPIC_API_KEY=your-key-here
echo supabase secrets set SUPABASE_URL=your-url-here
echo supabase secrets set SUPABASE_ANON_KEY=your-key-here

REM Test the function
echo 🧪 Testing AI Coach function...
supabase functions invoke ai-chat --data "{\"message\": \"Hello coach!\"}"

echo.
echo 🎉 Deployment complete!
echo.
echo Next steps:
echo 1. Ensure your .env.local file has the correct Supabase credentials
echo 2. Start your development server: npm run dev  
echo 3. Test the AI coach in your application
echo.
echo For troubleshooting, see: AI_COACHING_SETUP.md
echo.
pause
