import { supabase } from './supabase';

// Types for our database tables
export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  target_value: number;
  target_unit: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  value_completed: number;
  notes: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface AIChatMessage {
  id: string;
  user_id: string;
  message: string;
  sender: 'user' | 'ai';
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  earned_at: string;
}

// Database functions
export const database = {
  // User Profile functions
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    return true;
  },

  // Habits functions
  async getUserHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
    return data || [];
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at'>): Promise<Habit | null> {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating habit:', error);
      return null;
    }
    return data;
  },

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<boolean> {
    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId);
    
    if (error) {
      console.error('Error updating habit:', error);
      return false;
    }
    return true;
  },

  async deleteHabit(habitId: string): Promise<boolean> {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId);
    
    if (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
    return true;
  },

  // Habit Completions functions
  async getHabitCompletions(userId: string, habitId?: string, days?: number): Promise<HabitCompletion[]> {
    let query = supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId);
    
    if (habitId) {
      query = query.eq('habit_id', habitId);
    }
    
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = query.gte('completed_at', startDate.toISOString().split('T')[0]);
    }
    
    query = query.order('completed_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching habit completions:', error);
      return [];
    }
    return data || [];
  },

  async recordHabitCompletion(completion: Omit<HabitCompletion, 'id' | 'created_at'>): Promise<HabitCompletion | null> {
    const { data, error } = await supabase
      .from('habit_completions')
      .upsert(completion, { onConflict: 'habit_id,completed_at' })
      .select()
      .single();
    
    if (error) {
      console.error('Error recording habit completion:', error);
      return null;
    }
    return data;
  },

  // Goals functions
  async getUserGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
    return data || [];
  },

  async createGoal(goal: Omit<Goal, 'id' | 'created_at'>): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating goal:', error);
      return null;
    }
    return data;
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<boolean> {
    const { error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId);
    
    if (error) {
      console.error('Error updating goal:', error);
      return false;
    }
    return true;
  },

  // AI Chat functions
  async getChatMessages(userId: string, limit: number = 50): Promise<AIChatMessage[]> {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    return (data || []).reverse(); // Reverse to show oldest first
  },

  async saveChatMessage(message: Omit<AIChatMessage, 'id' | 'created_at'>): Promise<AIChatMessage | null> {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .insert(message)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving chat message:', error);
      return null;
    }
    return data;
  },

  // Achievements functions
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
    return data || [];
  },

  async awardAchievement(achievement: Omit<Achievement, 'id' | 'earned_at'>): Promise<Achievement | null> {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievement)
      .select()
      .single();
    
    if (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
    return data;
  },

  // Analytics functions
  async getHabitStreaks(userId: string): Promise<{ [habitId: string]: number }> {
    const habits = await this.getUserHabits(userId);
    const streaks: { [habitId: string]: number } = {};
    
    for (const habit of habits) {
      const completions = await this.getHabitCompletions(userId, habit.id, 365);
      
      // Calculate current streak
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const completion = completions.find(c => c.completed_at === dateStr);
        if (completion && completion.value_completed >= habit.target_value) {
          streak++;
        } else {
          break;
        }
      }
      
      streaks[habit.id] = streak;
    }
    
    return streaks;
  },

  async getWeeklyProgress(userId: string, habitId: string): Promise<boolean[]> {
    const completions = await this.getHabitCompletions(userId, habitId, 7);
    const weekProgress: boolean[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const completion = completions.find(c => c.completed_at === dateStr);
      weekProgress.push(!!completion && completion.value_completed > 0);
    }
    
    return weekProgress;
  }
};