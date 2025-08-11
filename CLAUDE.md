# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rashenal is an AI-powered personal transformation platform built with React, TypeScript, and Supabase. It features habit tracking, goal management, smart task management, and an AI coaching system powered by Claude API.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Deployment
```bash
# Deploy AI Coach Edge Function
supabase functions deploy ai-chat
supabase secrets set ANTHROPIC_API_KEY=your-key

# Run deployment scripts
./deploy-ai-coach.sh  # Unix/Linux/Mac
deploy-ai-coach.bat   # Windows
```

### Database
```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend Stack
- **Database & Auth**: Supabase (PostgreSQL)
- **Edge Functions**: Supabase Functions (Deno)
- **AI Integration**: Claude API via Edge Functions

### Key Components Architecture

1. **Authentication Flow**
   - `App.tsx`: Main auth state management
   - `src/lib/supabase.ts`: Auth helper functions
   - `src/components/AuthForm.tsx`, `SignInForm.tsx`, `SignUpForm.tsx`: Auth UI

2. **AI Coaching System**
   - `src/components/AICoachingDashboard.tsx`: Main coaching interface
   - `src/components/AICoachChat.tsx`: Chat interface with Claude
   - `src/hooks/useAIChat.ts`: Chat state management
   - `supabase/functions/ai-chat/index.ts`: Claude API integration

3. **Task Management**
   - `src/components/TaskBoard*.tsx`: Various task board views
   - `src/lib/task-service.ts`: Task CRUD operations
   - `src/lib/use-tasks.ts`: Task state management hook

4. **Habit Tracking**
   - `src/components/AIHabitTracker.tsx`: Habit tracking UI
   - `src/hooks/useHabits.ts`: Habit state management

5. **Job Finder Module**
   - `src/components/JobFinderDashboard.tsx`: Main job finder interface
   - `src/components/JobProfileManager.tsx`: Multi-profile career management
   - `src/components/JobSearchCreator.tsx`: Automated search configuration
   - `src/components/JobDiscoveryFeed.tsx`: AI-powered job matching results
   - `supabase/functions/job-discovery/index.ts`: Job search and AI evaluation

6. **Database Schema** (from `src/lib/database-types.ts`)
   - **users**: User profiles
   - **tasks**: Smart task management with AI suggestions
   - **habits**: Habit definitions
   - **habit_completions**: Habit tracking data
   - **goals**: User goals with progress tracking
   - **projects**: Project organization for tasks
   - **job_profiles**: Career personas for targeted job matching
   - **job_searches**: Automated job search configurations
   - **job_matches**: AI-evaluated job opportunities
   - **job_applications**: Application tracking and management

### Environment Variables
Required in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Edge Function secrets:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Important Context

### AI Coaching Features
- Habit-focused approach with micro-steps
- Contextual responses using user's habit/goal data
- Accessibility design for neurotypical/neurodiverse users
- Multiple coaching styles (encouraging, direct, analytical)

### Task Management Features
- Kanban board with drag-and-drop
- AI-powered task suggestions and time estimates
- Task dependencies and subtasks
- Energy-based task categorization (XS to XL)

### Job Finder Features
- **Multi-Profile Career System**: Create distinct professional personas for different career paths or roles
- **AI-Powered Job Matching**: Claude API integration for intelligent job evaluation and scoring (0-100)
- **Semantic Job Search**: Natural language search with keyword extraction and context understanding
- **Task System Integration**: Automatic task creation for applications, interviews, and follow-ups
- **Accessibility-First Design**: Full WCAG compliance with screen reader support and keyboard navigation
- **Automated Application Tracking**: Complete workflow from discovery to offer negotiation
- **Smart Notifications**: Configurable alerts for new matches and application deadlines
- **Resume & Portfolio Management**: Centralized document storage with version tracking

#### Job Finder Architecture
The Job Finder module implements a comprehensive career management system:

1. **Profile-Based Matching**: Users create multiple job profiles representing different career paths, each with:
   - Skills, experience level, and industry preferences
   - Salary expectations and location requirements
   - Company culture values and deal breakers
   - Resume/portfolio links and cover letter templates

2. **Intelligent Search & Discovery**: Automated job searches with:
   - Configurable frequency (realtime, daily, weekly)
   - Multi-source aggregation (LinkedIn, Indeed, company sites)
   - AI-powered relevance scoring and filtering
   - Semantic keyword matching and exclusion lists

3. **AI Evaluation System**: Each job opportunity receives:
   - Match score (0-100) based on profile alignment
   - Detailed pros/cons analysis from Claude API
   - Personalized application suggestions
   - Company culture fit assessment

4. **Application Workflow Integration**: Seamless task creation for:
   - Application preparation and submission
   - Interview scheduling and preparation
   - Follow-up reminders and networking tasks
   - Offer evaluation and negotiation steps

5. **Analytics & Insights**: Track job search effectiveness with:
   - Application success rates by profile
   - Interview conversion metrics
   - Salary trend analysis
   - Time-to-hire tracking

### Security Considerations
- Row Level Security (RLS) enabled on all tables
- User data isolation via user_id foreign keys
- API keys stored securely in Edge Functions
- Authentication required for all data operations
- Job search data encrypted and anonymized for external APIs