// Supabase Edge Function: WhatsApp Webhook Handler
// Processes incoming WhatsApp messages and routes to voice agents

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'audio' | 'button';
  text?: { body: string };
  audio?: { id: string };
  button?: { text: string; payload: string };
}

interface UserContext {
  userId?: string;
  phone: string;
  preferences: any;
  habits: any[];
  goals: any[];
  tasks: any[];
  voiceAgentConfig: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle webhook verification
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('WHATSAPP_VERIFY_TOKEN')) {
      console.log('WhatsApp webhook verified');
      return new Response(challenge, { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    // Process incoming messages
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await processWhatsAppMessages(change.value, supabase);
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: 'success' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processWhatsAppMessages(messageData: any, supabase: any) {
  const messages = messageData.messages;
  if (!messages) return;

  for (const message of messages) {
    try {
      const userPhone = message.from;
      const messageType = message.type;

      // Get or create user context
      const userContext = await getUserContext(userPhone, supabase);
      
      let responseText = '';
      let messageContent = '';

      // Extract message content based on type
      if (messageType === 'text') {
        messageContent = message.text.body;
      } else if (messageType === 'audio') {
        // For now, acknowledge voice messages
        messageContent = '[Voice message received]';
        responseText = "I received your voice message! Voice processing is coming soon. For now, please send text messages.";
      } else if (messageType === 'button') {
        messageContent = message.button.text;
      }

      // Generate AI response if we have message content
      if (messageContent && !responseText) {
        responseText = await generateAIResponse(messageContent, userContext, supabase);
      }

      // Log conversation
      await logConversation(userPhone, messageContent, responseText, supabase);

      // Send response back to WhatsApp
      if (responseText) {
        await sendWhatsAppResponse(userPhone, responseText);
      }

    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      await sendWhatsAppResponse(message.from, "I'm sorry, I'm having trouble right now. Please try again in a moment.");
    }
  }
}

async function getUserContext(phone: string, supabase: any): Promise<UserContext> {
  try {
    // Try to find existing user by phone
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      // Get user's habits, goals, tasks
      const [habitsResult, goalsResult, tasksResult] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', existingUser.user_id),
        supabase.from('goals').select('*').eq('user_id', existingUser.user_id),
        supabase.from('tasks').select('*').eq('user_id', existingUser.user_id).eq('status', 'todo').limit(5)
      ]);

      return {
        userId: existingUser.user_id,
        phone,
        preferences: existingUser.preferences || {},
        habits: habitsResult.data || [],
        goals: goalsResult.data || [],
        tasks: tasksResult.data || [],
        voiceAgentConfig: existingUser.voice_agent_config || null
      };
    }

    // Return minimal context for new users
    return {
      phone,
      preferences: {},
      habits: [],
      goals: [],
      tasks: [],
      voiceAgentConfig: null
    };

  } catch (error) {
    console.error('Error getting user context:', error);
    return {
      phone,
      preferences: {},
      habits: [],
      goals: [],
      tasks: [],
      voiceAgentConfig: null
    };
  }
}

async function generateAIResponse(message: string, context: UserContext, supabase: any): Promise<string> {
  try {
    // Build context for Claude
    const aiContext = {
      userMessage: message,
      platform: 'whatsapp',
      userPhone: context.phone,
      hasAccount: !!context.userId,
      habits: context.habits.map(h => ({ name: h.name, category: h.category, current_streak: h.current_streak })),
      goals: context.goals.map(g => ({ title: g.title, progress: g.progress, category: g.category })),
      recentTasks: context.tasks.map(t => ({ title: t.title, priority: t.priority })),
      voiceAgentConfig: context.voiceAgentConfig,
      timestamp: new Date().toISOString()
    };

    // Use existing ai-chat function
    const aiChatUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-chat`;
    const response = await fetch(aiChatUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        context: aiContext,
        systemPrompt: getWhatsAppSystemPrompt(context)
      })
    });

    if (!response.ok) {
      throw new Error(`AI chat failed: ${response.statusText}`);
    }

    const aiResult = await response.json();
    return aiResult.response || "I'm here to help! How can I support you today?";

  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fallback responses based on context
    if (context.userId) {
      return "Hello! I'm your Rashenal AI coach. How are you doing today?";
    } else {
      return "Hi! I'm Rashenal, your AI transformation coach. I can help you with habits, goals, and productivity. To get the full experience, visit rashenal.com to create your account!";
    }
  }
}

function getWhatsAppSystemPrompt(context: UserContext): string {
  const basePrompt = `You are Rashee, the AI coach from Rashenal - a personal transformation platform. You're conversing via WhatsApp, so keep responses concise but warm and encouraging.

Key guidelines:
- Be conversational and supportive
- Keep responses under 160 characters when possible (WhatsApp-friendly)
- Use emojis sparingly but appropriately
- Focus on actionable advice
- Be encouraging about habits and goals`;

  if (context.userId) {
    return `${basePrompt}

User context:
- Active Rashenal user
- Current habits: ${context.habits.length}
- Active goals: ${context.goals.length}
- Pending tasks: ${context.tasks.length}

Reference their specific habits and goals when relevant. Provide personalized encouragement based on their progress.`;
  } else {
    return `${basePrompt}

This user doesn't have a Rashenal account yet. Gently encourage them to sign up at rashenal.com for the full experience while still providing helpful general advice.`;
  }
}

async function logConversation(phone: string, userMessage: string, botResponse: string, supabase: any) {
  try {
    await supabase.from('whatsapp_conversations').insert({
      phone_number: phone,
      user_message: userMessage,
      bot_response: botResponse,
      timestamp: new Date().toISOString(),
      platform: 'whatsapp'
    });
  } catch (error) {
    console.error('Error logging conversation:', error);
  }
}

async function sendWhatsAppResponse(to: string, message: string) {
  try {
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp credentials not configured');
      return;
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('WhatsApp API error:', error);
    } else {
      console.log('WhatsApp message sent successfully');
    }

  } catch (error) {
    console.error('Error sending WhatsApp response:', error);
  }
}
