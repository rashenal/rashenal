// Edge function to handle plugin API calls
// Deploy with: npx supabase functions deploy plugin-api

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plugin_id, method, params } = await req.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verify plugin is installed for user
    const { data: installation } = await supabaseClient
      .from('plugin_installations')
      .select('*')
      .eq('user_id', user.id)
      .eq('plugin_id', plugin_id)
      .eq('enabled', true)
      .single();
    
    if (!installation) {
      return new Response(
        JSON.stringify({ error: 'Plugin not installed or disabled' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Handle plugin methods
    let result;
    switch (method) {
      case 'getPersonalizedMotivation':
        result = await getMotivation(supabaseClient, user.id);
        break;
      case 'saveMotivation':
        result = await saveMotivation(supabaseClient, user.id, plugin_id, params);
        break;
      case 'getMotivationStats':
        result = await getStats(supabaseClient, user.id, plugin_id);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Method not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Plugin API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getMotivation(supabase: any, userId: string) {
  try {
    // Get user context for personalized motivation
    const [tasksResult, habitsResult, goalsResult] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId).eq('is_active', true),
      supabase.from('goals').select('*').eq('user_id', userId)
    ]);

    const tasks = tasksResult.data || [];
    const habits = habitsResult.data || [];
    const goals = goalsResult.data || [];

    // Determine energy level from task patterns
    const lowEnergyTasks = tasks.filter((t: any) => 
      t.energy_level === 'xs' || t.energy_level === 's'
    ).length;
    const totalTasks = tasks.length;
    const energyLevel = lowEnergyTasks > totalTasks / 2 ? 'low' : 'normal';

    // Build context for AI
    const context = {
      activeGoals: goals.filter((g: any) => g.status === 'active').length,
      currentHabits: habits.length,
      energyLevel,
      taskCount: tasks.filter((t: any) => t.status !== 'completed').length
    };

    // Generate contextual motivation based on user data
    const motivations = energyLevel === 'low' 
      ? [
          "Rest is productive too. Your mind and body need time to recharge.",
          "It's okay to take things slow today. Progress isn't always about speed.",
          "Small steps count. Even tiny movements forward are victories.",
          "Listen to your body. Sometimes the most productive thing is to pause."
        ]
      : [
          "Your energy is a gift. Use it on what truly matters to you.",
          "Every small step you take today builds the future you want.",
          "You're capable of more than you realize. Trust your journey.",
          "Consistency beats perfection. You're doing great."
        ];

    const selectedMotivation = motivations[Math.floor(Math.random() * motivations.length)];

    // Store in history
    await supabase
      .from('plugin_storage')
      .upsert({
        user_id: userId,
        plugin_id: 'ai.asista.motivation',
        key: `motivation_${Date.now()}`,
        value: {
          text: selectedMotivation,
          context,
          timestamp: Date.now()
        }
      });

    return {
      text: selectedMotivation,
      author: 'Asista',
      context
    };
  } catch (error) {
    console.error('Error generating motivation:', error);
    return {
      text: "You're doing great. Keep going! 💜",
      author: 'Asista'
    };
  }
}

async function saveMotivation(supabase: any, userId: string, pluginId: string, params: any) {
  try {
    await supabase
      .from('plugin_storage')
      .upsert({
        user_id: userId,
        plugin_id: pluginId,
        key: `saved_${Date.now()}`,
        value: {
          text: params.text,
          author: params.author,
          timestamp: Date.now(),
          saved: true
        }
      });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving motivation:', error);
    return { success: false, error: error.message };
  }
}

async function getStats(supabase: any, userId: string, pluginId: string) {
  try {
    // Get motivation history from plugin storage
    const { data: storageData } = await supabase
      .from('plugin_storage')
      .select('*')
      .eq('user_id', userId)
      .eq('plugin_id', pluginId)
      .order('created_at', { ascending: false });

    const motivationHistory = storageData?.filter(d => d.key.startsWith('motivation_')) || [];
    const savedMotivations = storageData?.filter(d => d.key.startsWith('saved_')) || [];

    // Calculate streak (days with motivation interactions)
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime()) / (24 * 60 * 60 * 1000));
    const activeDays = new Set();
    
    motivationHistory.forEach(item => {
      const date = new Date(item.created_at).toDateString();
      activeDays.add(date);
    });

    // Get current energy level from tasks
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('energy_level')
      .eq('user_id', userId)
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const energyLevels = recentTasks || [];
    const avgEnergyMap = { xs: 1, s: 2, m: 3, l: 4, xl: 5 };
    const energySum = energyLevels.reduce((sum: number, task: any) => {
      return sum + (avgEnergyMap[task.energy_level as keyof typeof avgEnergyMap] || 3);
    }, 0);
    
    const avgEnergy = energySum / Math.max(energyLevels.length, 1);
    let energyLevel = 'medium';
    if (avgEnergy <= 2) energyLevel = 'low';
    else if (avgEnergy >= 4) energyLevel = 'high';

    return {
      streak: Math.min(activeDays.size, 30),
      saved: savedMotivations.length,
      energy: energyLevel,
      totalMotivations: motivationHistory.length
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      streak: 1,
      saved: 0,
      energy: 'medium',
      totalMotivations: 0
    };
  }
}