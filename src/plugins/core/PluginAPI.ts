// Plugin API implementation
// Provides controlled access to Rashenal features

import { PluginAPI, PluginPermission } from './types';
import { supabase } from '../../lib/supabase';

export class PluginAPIImpl implements PluginAPI {
  private supabase: any;
  private permissions: PluginPermission[];

  constructor(supabaseClient: any, permissions: PluginPermission[]) {
    this.supabase = supabaseClient;
    this.permissions = permissions;
  }

  private hasPermission(permission: PluginPermission): boolean {
    return this.permissions.includes(permission);
  }

  // Task API
  tasks = {
    list: async () => {
      if (!this.hasPermission('tasks:read')) {
        throw new Error('Permission denied: tasks:read');
      }
      
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    get: async (id: string) => {
      if (!this.hasPermission('tasks:read')) {
        throw new Error('Permission denied: tasks:read');
      }
      
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    create: async (task: any) => {
      if (!this.hasPermission('tasks:write')) {
        throw new Error('Permission denied: tasks:write');
      }
      
      const { data, error } = await this.supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id: string, updates: any) => {
      if (!this.hasPermission('tasks:write')) {
        throw new Error('Permission denied: tasks:write');
      }
      
      const { data, error } = await this.supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  };

  // Habits API
  habits = {
    list: async () => {
      if (!this.hasPermission('habits:read')) {
        throw new Error('Permission denied: habits:read');
      }
      
      const { data, error } = await this.supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    getActive: async () => {
      if (!this.hasPermission('habits:read')) {
        throw new Error('Permission denied: habits:read');
      }
      
      const { data, error } = await this.supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },

    recordCompletion: async (habitId: string, value: number) => {
      if (!this.hasPermission('habits:write')) {
        throw new Error('Permission denied: habits:write');
      }
      
      const { error } = await this.supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          value,
          completed_at: new Date().toISOString()
        });
      
      if (error) throw error;
    }
  };

  // Goals API
  goals = {
    list: async () => {
      if (!this.hasPermission('goals:read')) {
        throw new Error('Permission denied: goals:read');
      }
      
      const { data, error } = await this.supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    updateProgress: async (goalId: string, progress: number) => {
      if (!this.hasPermission('goals:write')) {
        throw new Error('Permission denied: goals:write');
      }
      
      const { error } = await this.supabase
        .from('goals')
        .update({ progress })
        .eq('id', goalId);
      
      if (error) throw error;
    }
  };

  // AI API
  ai = {
    chat: async (message: string, context?: any) => {
      if (!this.hasPermission('ai:chat')) {
        throw new Error('Permission denied: ai:chat');
      }
      
      try {
        const response = await this.supabase.functions.invoke('ai-chat', {
          body: { message, context }
        });
        
        if (response.error) throw response.error;
        return response.data?.response || 'No response generated';
      } catch (error) {
        console.error('AI chat error:', error);
        return 'I apologize, but I cannot respond at the moment. Please try again.';
      }
    },

    analyze: async (data: any, prompt: string) => {
      if (!this.hasPermission('ai:analyze')) {
        throw new Error('Permission denied: ai:analyze');
      }
      
      const response = await this.supabase.functions.invoke('ai-chat', {
        body: { 
          message: prompt,
          context: { analysis_data: data }
        }
      });
      
      if (response.error) throw response.error;
      return response.data;
    }
  };

  // Voice API
  voice = {
    registerCommand: async (command: string, handler: Function) => {
      if (!this.hasPermission('voice:commands')) {
        throw new Error('Permission denied: voice:commands');
      }
      
      // This would integrate with the existing voice system
      console.log(`Voice command registered: ${command}`);
      // Store the command handler for the voice system to use
      if (window.voiceCommands) {
        window.voiceCommands.set(command, handler);
      }
    },

    speak: async (text: string, options?: any) => {
      if (!this.hasPermission('voice:synthesis')) {
        throw new Error('Permission denied: voice:synthesis');
      }
      
      // Use Web Speech API or integrate with voice service
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        if (options?.voice) utterance.voice = options.voice;
        if (options?.rate) utterance.rate = options.rate;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Calendar API
  calendar = {
    getEvents: async (start: Date, end: Date) => {
      if (!this.hasPermission('calendar:read')) {
        throw new Error('Permission denied: calendar:read');
      }
      
      // This would integrate with the calendar system
      console.log(`Getting calendar events from ${start} to ${end}`);
      return [];
    },

    createEvent: async (event: any) => {
      if (!this.hasPermission('calendar:write')) {
        throw new Error('Permission denied: calendar:write');
      }
      
      // This would integrate with the calendar system
      console.log('Creating calendar event:', event);
      return event;
    }
  };
}