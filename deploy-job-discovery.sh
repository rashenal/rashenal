#!/bin/bash

# Deploy Job Discovery Edge Function
# This script deploys the AI-powered job discovery function to Supabase

echo "🚀 Deploying Job Discovery Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/functions/job-discovery/index.ts" ]; then
    echo "❌ job-discovery function not found. Make sure you're in the project root directory."
    exit 1
fi

# Deploy the function
echo "📦 Deploying job-discovery function..."
supabase functions deploy job-discovery

if [ $? -eq 0 ]; then
    echo "✅ Job Discovery function deployed successfully!"
    echo ""
    echo "🔑 Don't forget to set the required secrets:"
    echo "supabase secrets set ANTHROPIC_API_KEY=your-api-key"
    echo "supabase secrets set SUPABASE_URL=your-supabase-url"
    echo "supabase secrets set SUPABASE_ANON_KEY=your-anon-key"
    echo ""
    echo "📋 Function capabilities:"
    echo "- AI-powered job analysis and scoring"
    echo "- Job matching against user profiles"
    echo "- Automated job search execution"
    echo ""
    echo "🎯 Ready to power your Job Finder module!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi