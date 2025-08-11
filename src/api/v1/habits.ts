import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { createSwaggerSchema } from '../../lib/swagger/utils';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  target_frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  streak_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  notes?: string;
}

export interface HabitAnalytics {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  weekly_average: number;
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
}

class HabitsAPI {
  // GET /api/v1/habits - Get all habits for user
  static async getAllHabits(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: habits, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ habits, count: habits?.length || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/habits/:id - Get specific habit
  static async getHabit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { data: habit, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json({ habit });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/v1/habits - Create new habit
  static async createHabit(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const habitData = {
        ...req.body,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: habit, error } = await supabase
        .from('habits')
        .insert(habitData)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ habit });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /api/v1/habits/:id - Update habit
  static async updateHabit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString()
      };

      const { data: habit, error } = await supabase
        .from('habits')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json({ habit });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /api/v1/habits/:id - Delete habit
  static async deleteHabit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/v1/habits/:id/complete - Mark habit completion
  static async completeHabit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { notes } = req.body;

      // First verify the habit exists and belongs to user
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (habitError || !habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      // Create completion record
      const { data: completion, error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: id,
          user_id: userId,
          completed_at: new Date().toISOString(),
          notes
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Update habit streak (this would be calculated properly in real implementation)
      await supabase
        .from('habits')
        .update({ 
          streak_count: habit.streak_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      res.json({ completion, message: 'Habit marked as complete' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/habits/:id/analytics - Get habit analytics
  static async getHabitAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { days = 30 } = req.query;

      // Get habit completions for the period
      const { data: completions, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', id)
        .eq('user_id', userId)
        .gte('completed_at', new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Calculate analytics
      const analytics: HabitAnalytics = {
        habit_id: id,
        current_streak: await this.calculateCurrentStreak(id, userId),
        longest_streak: await this.calculateLongestStreak(id, userId),
        completion_rate: this.calculateCompletionRate(completions || [], parseInt(days as string)),
        weekly_average: this.calculateWeeklyAverage(completions || []),
        trend: this.calculateTrend(completions || []),
        insights: this.generateInsights(completions || [])
      };

      res.json({ analytics });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper methods for analytics
  private static async calculateCurrentStreak(habitId: string, userId: string): Promise<number> {
    // This would calculate the current streak properly
    const { data: habit } = await supabase
      .from('habits')
      .select('streak_count')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();
    
    return habit?.streak_count || 0;
  }

  private static async calculateLongestStreak(habitId: string, userId: string): Promise<number> {
    // This would calculate the longest streak from completion history
    // For now, return mock data
    return 15;
  }

  private static calculateCompletionRate(completions: HabitCompletion[], days: number): number {
    return Math.round((completions.length / days) * 100);
  }

  private static calculateWeeklyAverage(completions: HabitCompletion[]): number {
    if (completions.length === 0) return 0;
    
    const weeks = Math.ceil(completions.length / 7);
    return Math.round(completions.length / weeks);
  }

  private static calculateTrend(completions: HabitCompletion[]): 'improving' | 'declining' | 'stable' {
    if (completions.length < 14) return 'stable';
    
    const firstWeek = completions.slice(-14, -7).length;
    const secondWeek = completions.slice(-7).length;
    
    if (secondWeek > firstWeek) return 'improving';
    if (secondWeek < firstWeek) return 'declining';
    return 'stable';
  }

  private static generateInsights(completions: HabitCompletion[]): string[] {
    const insights = [];
    
    if (completions.length > 0) {
      insights.push('You\'ve been consistent with this habit lately!');
    }
    
    if (completions.length > 7) {
      insights.push('Great job maintaining this habit for over a week!');
    }
    
    return insights;
  }
}

// Swagger schema for habits API
export const habitsSwaggerSchema = createSwaggerSchema({
  paths: {
    '/api/v1/habits': {
      get: {
        summary: 'Get all habits for user',
        tags: ['Habits'],
        responses: {
          200: {
            description: 'List of habits',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    habits: { type: 'array', items: { $ref: '#/components/schemas/Habit' } },
                    count: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create new habit',
        tags: ['Habits'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateHabitRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Habit created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    habit: { $ref: '#/components/schemas/Habit' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Habit: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          user_id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          target_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          target_count: { type: 'number' },
          streak_count: { type: 'number' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
});

export default HabitsAPI;