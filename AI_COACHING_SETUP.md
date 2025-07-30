# AI Coaching Setup Guide

## 🎯 Overview
This guide helps you deploy the AI Transformation Coach with real Claude API integration, designed for habit-focused coaching with accessibility for neurotypical and neurodiverse users.

## 📋 Prerequisites
1. **Supabase Project**: Active Supabase project with authentication enabled
2. **Anthropic API Key**: From https://console.anthropic.com/
3. **Supabase CLI**: Install globally with `npm install -g supabase`

## 🚀 Deployment Steps

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your actual keys:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### 2. Database Setup
```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply database migrations
supabase db push

# Or manually run the migration from src/supabase/migrations/
```

### 3. Deploy Edge Function
```bash
# Deploy the AI chat function
supabase functions deploy ai-chat

# Set environment variables for Edge Function
supabase secrets set ANTHROPIC_API_KEY=your-claude-api-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
```

### 4. Test the Function
```bash
# Test locally (optional)
supabase functions serve

# Test the deployed function
supabase functions invoke ai-chat --data '{"message": "Hello coach!"}'
```

## 🧠 AI Coaching Features

### Habit-Focused Approach
- **Micro-step recommendations**: Breaks down goals into tiny, achievable actions
- **Streak awareness**: Celebrates consistency and helps maintain momentum  
- **Progress contextualization**: References actual user data in responses
- **Behavioral science integration**: Uses habit stacking and cue-based triggers

### Accessibility Design
- **Clear visual hierarchy**: High contrast, consistent spacing
- **Screen reader support**: Proper ARIA labels and semantic markup
- **Cognitive load reduction**: Simple language, structured responses
- **Status indicators**: Clear feedback for all user actions
- **Keyboard navigation**: Full functionality without mouse

### Neurodiverse-Friendly Features
- **Structured communication**: Consistent formatting and clear categories
- **Progress transparency**: Shows exactly what data the AI can see
- **Predictable interactions**: Consistent response patterns and timing
- **Error recovery**: Clear error messages with actionable solutions

## 🔧 Customization Options

### Coaching Styles
Users can set their preferred coaching style in user_preferences:
- `encouraging`: Positive, motivational approach (default)
- `direct`: Straightforward, fact-based guidance
- `analytical`: Data-driven insights with detailed metrics

### Quick Prompts
The component includes categorized quick prompts:
- **Motivation**: "How can I stay motivated?"
- **Challenge**: "I'm struggling with consistency"  
- **Planning**: "What should I focus on today?"
- **Celebration**: "Celebrate my progress!"

## 📊 Data Integration

### User Context Includes:
- **Habits**: Current progress, streaks, completion patterns
- **Goals**: Active goals with progress tracking
- **Recent Activity**: Last 10 habit completions for context
- **Preferences**: Coaching style and customizations
- **Weekly Stats**: Aggregated metrics for meaningful insights

### Privacy & Security
- **Row Level Security**: All data access restricted to authenticated user
- **Secure API calls**: Edge Function handles sensitive API keys
- **Data minimization**: Only relevant context sent to AI
- **Conversation storage**: Chat history saved for continuity

## 🎨 UI/UX Design Principles

### Visual Design
- **Purple/Blue gradient**: Trustworthy, calming color scheme
- **Rounded corners**: Friendly, approachable interface
- **Clear typography**: Optimized for readability
- **Status indicators**: Always-visible connection and loading states

### Interaction Design
- **Progressive disclosure**: Context panel shows/hides based on relevance
- **Immediate feedback**: Visual confirmation for all user actions
- **Error resilience**: Graceful degradation when AI is unavailable
- **Conversation flow**: Natural chat interface with clear turn-taking

## 🔍 Debugging

### Common Issues
1. **"No authorization header"**: Check Supabase authentication setup
2. **"Claude API error"**: Verify ANTHROPIC_API_KEY is set correctly
3. **"User not authenticated"**: Ensure user is logged in to Supabase
4. **Empty context**: Check database permissions and table structure

### Debug Tools
```bash
# View Edge Function logs
supabase functions logs ai-chat

# Test database access
supabase db inspect

# Check environment variables
supabase secrets list
```

## 📈 Future Enhancements
- **Voice integration**: Speech-to-text for accessibility
- **Mood tracking**: Emotional context for coaching
- **Goal recommendations**: AI-suggested habits based on patterns
- **Achievement system**: Gamified progress recognition
- **Peer coaching**: Community features for accountability

## 🤝 Contributing
When adding features, maintain:
- **Accessibility standards**: WCAG 2.1 AA compliance
- **Performance**: Fast, responsive interactions
- **Error handling**: Graceful failure modes
- **Testing**: Manual testing with screen readers and keyboard navigation

---
**Need help?** Check the Supabase documentation or Anthropic API docs for detailed troubleshooting.
