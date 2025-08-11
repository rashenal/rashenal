import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

export interface CoachingSession {
  id: string;
  user_id: string;
  type: 'chat' | 'goal_review' | 'habit_check' | 'task_planning' | 'reflection';
  messages: CoachMessage[];
  context: {
    current_goals: string[];
    recent_habits: any[];
    pending_tasks: any[];
    mood?: string;
    energy_level?: number;
  };
  insights: string[];
  action_items: string[];
  created_at: string;
  updated_at: string;
}

export interface CoachMessage {
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    references?: string[];
  };
}

class CoachAPI {
  static async getChatHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { limit = 10, offset = 0 } = req.query;

      const { data: sessions, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) return res.status(500).json({ error: error.message });

      res.json({ sessions, count: sessions?.length || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async sendMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { message, session_id, context } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Get or create session
      let session;
      if (session_id) {
        const { data } = await supabase
          .from('coaching_sessions')
          .select('*')
          .eq('id', session_id)
          .eq('user_id', userId)
          .single();
        session = data;
      }

      if (!session) {
        // Create new session
        const { data: newSession } = await supabase
          .from('coaching_sessions')
          .insert({
            user_id: userId,
            type: 'chat',
            messages: [],
            context: context || {},
            insights: [],
            action_items: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        session = newSession;
      }

      // Add user message
      const userMessage: CoachMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Generate AI response (mock for now)
      const coachResponse: CoachMessage = {
        role: 'coach',
        content: await this.generateCoachResponse(message, session.context),
        timestamp: new Date().toISOString(),
        metadata: {
          suggestions: ['Consider breaking this into smaller steps', 'Set a specific deadline'],
          references: []
        }
      };

      const updatedMessages = [...(session.messages || []), userMessage, coachResponse];

      // Update session
      const { data: updatedSession, error } = await supabase
        .from('coaching_sessions')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      res.json({ 
        session: updatedSession, 
        response: coachResponse,
        message: 'Message sent successfully' 
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private static async generateCoachResponse(message: string, context: any): Promise<string> {
    // This would integrate with Claude API
    // For now, return contextual mock responses
    
    const responses = [
      "That's a great goal! Let's break it down into manageable steps.",
      "I can see you're making progress. What's been working well for you?",
      "It sounds like you might be feeling overwhelmed. Let's prioritize what's most important.",
      "Remember, small consistent actions lead to big results over time.",
      "How can we make this more specific and measurable?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  static async getInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Generate insights based on user data
      const insights = await this.generateUserInsights(userId);

      res.json({ insights, generated_at: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private static async generateUserInsights(userId: string): Promise<string[]> {
    const insights = [];

    // Get recent user data
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .neq('status', 'archived');

    if (habits?.length) {
      insights.push(`You have ${habits.length} active habits. Keep up the consistency!`);
    }

    if (tasks?.length) {
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
      if (highPriorityTasks > 0) {
        insights.push(`You have ${highPriorityTasks} high-priority tasks. Consider tackling these first.`);
      }
    }

    return insights;
  }
}

export default CoachAPI;