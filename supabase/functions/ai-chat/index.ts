// supabase/functions/ai-chat/index.ts
// Secure AI coaching with Claude API integration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string;
  userContext?: {
    name: string;
    habits: any[];
    goals: any[];
    weeklyStats: any;
    recentCompletions: any[];
    preferences?: any;
  };
}

interface HabitData {
  id: string;
  name: string;
  category: string;
  target_value: number;
  target_unit: string;
  progress: number;
  streak: number;
  lastCompleted?: string;
}

interface GoalData {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  status: string;
  target_date?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Parse the request body
    const { message, userContext }: ChatRequest = await req.json()

    if (!message?.trim()) {
      throw new Error('Message is required')
    }

    // Get comprehensive user data if not provided
    let context = userContext
    if (!context) {
      // Fetch user profile
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Fetch user's active habits
      const { data: habits } = await supabaseClient
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Fetch user's active goals
      const { data: goals } = await supabaseClient
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })

      // Get recent completions (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const { data: completions } = await supabaseClient
        .from('habit_completions')
        .select(`
          *,
          habits!inner(name, target_value, target_unit)
        `)
        .eq('user_id', user.id)
        .gte('completed_at', thirtyDaysAgo)
        .order('completed_at', { ascending: false })

      // Get user preferences for coaching style
      const { data: preferences } = await supabaseClient
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Calculate habit progress and streaks
      const enrichedHabits = habits?.map((habit: any) => {
        const habitCompletions = completions?.filter(c => c.habit_id === habit.id) || []
        const last7Days = habitCompletions.filter(c => {
          const completedDate = new Date(c.completed_at)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return completedDate >= weekAgo
        })

        // Calculate current streak
        let streak = 0
        const today = new Date()
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(today.getDate() - i)
          const dateStr = checkDate.toISOString().split('T')[0]
          
          const hasCompletion = habitCompletions.some(c => 
            c.completed_at === dateStr && c.value_completed >= habit.target_value
          )
          
          if (hasCompletion) {
            streak++
          } else if (i > 0) {
            break // Streak broken
          }
        }

        // Calculate weekly progress
        const weeklyTarget = habit.target_value * 7
        const weeklyCompleted = last7Days.reduce((sum: number, c: any) => sum + c.value_completed, 0)
        const progress = Math.min(100, Math.round((weeklyCompleted / weeklyTarget) * 100))

        return {
          ...habit,
          progress,
          streak,
          weeklyCompleted,
          weeklyTarget,
          lastCompleted: habitCompletions[0]?.completed_at
        }
      }) || []

      // Calculate weekly stats
      const totalGoals = goals?.length || 0
      const completedGoals = goals?.filter(g => g.progress >= 100).length || 0
      const maxStreak = Math.max(...enrichedHabits.map(h => h.streak), 0)
      const avgProgress = enrichedHabits.length > 0 
        ? Math.round(enrichedHabits.reduce((sum, h) => sum + h.progress, 0) / enrichedHabits.length)
        : 0

      context = {
        name: profile?.full_name || user.email?.split('@')[0] || 'there',
        habits: enrichedHabits,
        goals: goals || [],
        recentCompletions: completions?.slice(0, 10) || [],
        preferences: preferences || { ai_coaching_style: 'encouraging' },
        weeklyStats: {
          goalsCompleted: `${completedGoals}/${totalGoals}`,
          streakDays: maxStreak,
          averageProgress: avgProgress,
          totalHabits: enrichedHabits.length,
          improvement: avgProgress > 60 ? `+${avgProgress - 60}%` : `${avgProgress}%`
        }
      }
    }

    // Build habit-focused coaching prompt
    const coachingStyle = context.preferences?.ai_coaching_style || 'encouraging'
    const strugglingHabits = context.habits.filter((h: any) => h.progress < 50)
    const strongHabits = context.habits.filter((h: any) => h.progress >= 80)
    const recentGoals = context.goals.slice(0, 3)

    const systemPrompt = `You are an expert AI transformation coach specializing in habit formation and replacing self-doubt with self-belief. Your coaching style is ${coachingStyle}.

Core principles:
- Use habit-focused approach for sustainable change
- Design for both neurotypical and neurodiverse users (clear, structured communication)
- Acknowledge progress and build on existing momentum
- Provide specific, actionable micro-steps
- Address both practical strategies and emotional support

User Context:
- Name: ${context.name}
- Total habits tracked: ${context.habits.length}
- Current streak record: ${context.weeklyStats.streakDays} days
- Average progress: ${context.weeklyStats.averageProgress}%
- Goals progress: ${context.weeklyStats.goalsCompleted}

Strong habits (80%+ progress):
${strongHabits.map((h: any) => `• ${h.name}: ${h.progress}% (${h.streak}-day streak)`).join('\n')}

Habits needing attention (<50% progress):
${strugglingHabits.map((h: any) => `• ${h.name}: ${h.progress}% progress, ${h.weeklyCompleted}/${h.weeklyTarget} ${h.target_unit} this week`).join('\n')}

Active goals:
${recentGoals.map((g: any) => `• ${g.title}: ${g.progress}% complete`).join('\n')}

Recent activity patterns:
- Last 3 completions: ${context.recentCompletions.slice(0, 3).map((c: any) => `${c.habits.name} (${c.value_completed} ${c.habits.target_unit})`).join(', ')}

User's message: "${message}"

Respond as their AI coach with:
1. Acknowledge their specific progress/efforts from the data
2. Provide habit-focused, actionable advice (micro-steps when possible)
3. Reference their actual data when relevant
4. Be encouraging but realistic
5. Ask one engaging follow-up question
6. Keep responses 100-150 words, structured clearly for accessibility
7. Use simple language and clear formatting for neurodiverse users

Focus on habit stacking, consistency over perfection, and building self-belief through small wins.`

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: systemPrompt
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      console.error('Claude API error:', await claudeResponse.text())
      throw new Error(`Claude API error: ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    const aiMessage = claudeData.content[0].text

    // Save the conversation to database
    try {
      await supabaseClient
        .from('ai_chat_messages')
        .insert([
          {
            user_id: user.id,
            message: message,
            sender: 'user'
          },
          {
            user_id: user.id,
            message: aiMessage,
            sender: 'ai'
          }
        ])
    } catch (dbError) {
      console.error('Database error saving messages:', dbError)
      // Continue anyway - the chat still works
    }

    // Check for achievements based on conversation
    try {
      await checkAndAwardAchievements(supabaseClient, user.id, context)
    } catch (achievementError) {
      console.error('Achievement error:', achievementError)
      // Continue anyway
    }

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        context: context,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  } catch (error) {
    console.error('Error in ai-chat function:', error)
    
    // Provide helpful fallback response
    const fallbackResponse = "I'm having trouble connecting to my AI systems right now, but I'm here to support you! Based on what I can see, you're making great progress. What specific habit or goal would you like to focus on today?"
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: fallbackResponse,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200, // Return 200 to allow graceful fallback
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  }
})

// Helper function to check and award achievements
async function checkAndAwardAchievements(supabaseClient: any, userId: string, context: any) {
  const achievements = []

  // Check for streak achievements
  if (context.weeklyStats.streakDays >= 7) {
    achievements.push({
      user_id: userId,
      title: "Week Warrior",
      description: "Maintained a 7-day habit streak!",
      icon: "🔥",
      category: "streak"
    })
  }

  if (context.weeklyStats.streakDays >= 30) {
    achievements.push({
      user_id: userId,
      title: "Habit Master",
      description: "30-day streak achieved! You're unstoppable!",
      icon: "👑",
      category: "streak"
    })
  }

  // Check for goal completion achievements
  const completedGoals = context.goals.filter((g: any) => g.progress >= 100)
  if (completedGoals.length >= 1) {
    achievements.push({
      user_id: userId,
      title: "Goal Crusher",
      description: "Completed your first goal!",
      icon: "🎯",
      category: "goals"
    })
  }

  // Insert achievements (will be ignored if already exist due to unique constraints you might add)
  if (achievements.length > 0) {
    await supabaseClient
      .from('achievements')
      .upsert(achievements, { 
        onConflict: 'user_id,title',
        ignoreDuplicates: true 
      })
  }
}