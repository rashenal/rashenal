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
  context?: string; // 'cv_parsing' | 'coaching' | etc.
  userContext?: {
    name: string;
    habits: any[];
    goals: any[];
    tasks: any[];
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
    const { message, context: requestContext, userContext }: ChatRequest = await req.json()

    if (!message?.trim()) {
      throw new Error('Message is required')
    }

    // Handle CV parsing requests
    if (requestContext === 'cv_parsing') {
      return await handleCVParsing(message)
    }

    // Get comprehensive user data if not provided
    let context = userContext
    if (!context) {
      // Fetch user profile
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('full_name, email')
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

      // Fetch outstanding tasks for contextual awareness
      const { data: tasks } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['todo', 'in_progress'])
        .order('priority', { ascending: false })
        .limit(5)

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

      // Determine personalized name
      let userName = 'there'
      if (user.email === 'rharveybis@hotmail.com') {
        userName = 'Elizabeth'
      } else if (profile?.full_name) {
        userName = profile.full_name
      } else if (user.email) {
        userName = user.email.split('@')[0]
      }

      context = {
        name: userName,
        habits: enrichedHabits,
        goals: goals || [],
        tasks: tasks || [],
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

Outstanding tasks (for contextual awareness):
${context.tasks.slice(0, 3).map((t: any) => `• ${t.title} (${t.priority} priority, ${t.status})`).join('\n')}

Recent activity patterns:
- Last 3 completions: ${context.recentCompletions.slice(0, 3).map((c: any) => `${c.habits.name} (${c.value_completed} ${c.habits.target_unit})`).join(', ')}

User's message: "${message}"

Respond as their AI coach with:
1. Acknowledge their specific progress/efforts from the data
2. Provide habit-focused, actionable advice (micro-steps when possible)
3. Reference their actual data when relevant (habits, goals, and tasks)
4. When appropriate, mention outstanding tasks to show contextual awareness
5. Be encouraging but realistic
6. Ask one engaging follow-up question
7. Keep responses 100-150 words, structured clearly for accessibility
8. Use simple language and clear formatting for neurodiverse users

Focus on habit stacking, consistency over perfection, and building self-belief through small wins. Show that you understand their full context by occasionally referencing their tasks alongside their habits and goals.`

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
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

// Helper function to handle CV parsing with Claude AI
async function handleCVParsing(cvText: string) {
  console.log('🤖 CV Parsing request received')
  console.log('   - Text length:', cvText.length)
  console.log('   - Text preview:', cvText.substring(0, 200) + '...')
  
  // Check API key availability
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not found')
    throw new Error('Claude API key not configured')
  }
  console.log('✅ API key found (length:', apiKey.length, ')')
  
  try {
    console.log('📡 Sending request to Claude API...')
    
    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: cvText
        }
      ]
    }
    
    console.log('📋 Request body prepared:', JSON.stringify(requestBody, null, 2))
    
    // Call Claude API specifically for CV parsing
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📥 Received response from Claude API')
    console.log('   - Status:', claudeResponse.status)
    console.log('   - Status text:', claudeResponse.statusText)
    console.log('   - Headers:', Object.fromEntries(claudeResponse.headers.entries()))

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('❌ Claude API error for CV parsing:')
      console.error('   - Status:', claudeResponse.status)
      console.error('   - Error text:', errorText)
      
      // Return more specific error information
      return new Response(
        JSON.stringify({ 
          error: `Claude API error: ${claudeResponse.status}`,
          details: errorText,
          timestamp: new Date().toISOString(),
          debug: 'Check Supabase Edge Function logs for more details'
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        },
      )
    }

    const claudeData = await claudeResponse.json()
    console.log('✅ Claude API response parsed successfully')
    console.log('   - Response structure:', Object.keys(claudeData))
    
    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.error('❌ Unexpected Claude API response structure:', claudeData)
      throw new Error('Invalid response structure from Claude API')
    }
    
    const aiResponse = claudeData.content[0].text
    console.log('📝 AI response length:', aiResponse.length)
    console.log('📝 AI response preview:', aiResponse.substring(0, 300) + '...')

    console.log('🎉 Claude AI CV parsing completed successfully')
    
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        timestamp: new Date().toISOString(),
        parsed_by: 'claude-ai',
        debug: {
          model: 'claude-3-5-sonnet-20241022',
          input_length: cvText.length,
          output_length: aiResponse.length
        }
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  } catch (error) {
    console.error('💥 Error in CV parsing:', error)
    console.error('   - Error type:', error.constructor.name)
    console.error('   - Error message:', error.message)
    console.error('   - Error stack:', error.stack)
    
    // Return detailed error information
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
        debug: 'CV parsing failed - check Edge Function logs',
        fallback_message: 'CV parsing temporarily unavailable. Please fill out the form manually.'
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  }
}

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