#!/bin/bash
# deploy-ai-coach.sh
# Automated deployment script for AI Coaching features

echo "🤖 Deploying AI Transformation Coach..."
echo "=================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're linked to a Supabase project
if [ ! -f .supabase/config.toml ]; then
    echo "❌ Not linked to a Supabase project."
    echo "Run: supabase link --project-ref your-project-ref"
    exit 1
fi

echo "✅ Supabase CLI found"

# Deploy Edge Function
echo "📤 Deploying ai-chat Edge Function..."
supabase functions deploy ai-chat

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully"
else
    echo "❌ Edge Function deployment failed"
    exit 1
fi

# Check if environment variables are set
echo "🔐 Checking environment variables..."
secrets=$(supabase secrets list 2>/dev/null)

if echo "$secrets" | grep -q "ANTHROPIC_API_KEY"; then
    echo "✅ ANTHROPIC_API_KEY is set"
else
    echo "⚠️  ANTHROPIC_API_KEY not set. Run:"
    echo "supabase secrets set ANTHROPIC_API_KEY=your-key-here"
fi

if echo "$secrets" | grep -q "SUPABASE_URL"; then
    echo "✅ SUPABASE_URL is set"
else
    echo "⚠️  SUPABASE_URL not set. Run:"
    echo "supabase secrets set SUPABASE_URL=your-url-here"
fi

if echo "$secrets" | grep -q "SUPABASE_ANON_KEY"; then
    echo "✅ SUPABASE_ANON_KEY is set"
else
    echo "⚠️  SUPABASE_ANON_KEY not set. Run:"
    echo "supabase secrets set SUPABASE_ANON_KEY=your-key-here"
fi

# Test the function
echo "🧪 Testing AI Coach function..."
test_result=$(supabase functions invoke ai-chat --data '{"message": "Hello coach!"}' 2>/dev/null)

if echo "$test_result" | grep -q "message"; then
    echo "✅ AI Coach function is working!"
else
    echo "⚠️  AI Coach function test failed. Check your environment variables."
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your .env.local file has the correct Supabase credentials"
echo "2. Start your development server: npm run dev"
echo "3. Test the AI coach in your application"
echo ""
echo "For troubleshooting, see: AI_COACHING_SETUP.md"
