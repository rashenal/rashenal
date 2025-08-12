import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { createSwaggerSchema } from '../../lib/swagger/utils';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'archived';
  target_value: number;
  current_value: number;
  unit: string; // 'tasks', 'habits', 'days', 'number', etc.
  target_date?: string;
  started_at?: string;
  completed_at?: string;
  milestones: GoalMilestone[];
  related_habits: string[]; // habit IDs
  related_tasks: string[]; // task IDs
  progress_tracking: {
    auto_update: boolean;
    update_frequency: 'daily' | 'weekly' | 'monthly';
    data_source: 'manual' | 'habits' | 'tasks' | 'external';
  };
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  target_value: number;
  target_date?: string;
  completed: boolean;
  completed_at?: string;
  reward?: string;
}

export interface GoalProgress {
  goal_id: string;
  current_progress: number; // 0-100 percentage
  trend: 'improving' | 'declining' | 'stable';
  projected_completion?: string;
  days_remaining?: number;
  weekly_progress: number[];
  milestones_completed: number;
  total_milestones: number;
  insights: string[];
}

class GoalsAPI {
  // GET /api/v1/goals - Get all goals for user
  static async getAllGoals(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { status, category, include_progress = 'false' } = req.query;

      let query = supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (category) query = query.eq('category', category);

      const { data: goals, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const response: any = { goals, count: goals?.length || 0 };

      // Include progress data if requested
      if (include_progress === 'true' && goals) {
        const progressData = await Promise.all(
          goals.map(goal => this.calculateGoalProgress(goal))
        );
        response.progress = progressData;
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/goals/:id - Get specific goal
  static async getGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { data: goal, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const progress = await this.calculateGoalProgress(goal);

      res.json({ goal, progress });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/v1/goals - Create new goal
  static async createGoal(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const goalData = {
        ...req.body,
        user_id: userId,
        status: 'draft',
        current_value: 0,
        milestones: req.body.milestones || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: goal, error } = await supabase
        .from('goals')
        .insert(goalData)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Create milestone records if provided
      if (req.body.milestones?.length > 0) {
        const milestoneData = req.body.milestones.map((milestone: any) => ({
          ...milestone,
          goal_id: goal.id,
          completed: false
        }));

        await supabase.from('goal_milestones').insert(milestoneData);
      }

      res.status(201).json({ goal });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /api/v1/goals/:id - Update goal
  static async updateGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString()
      };

      // If marking as completed, add completion time
      if (req.body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: goal, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ goal });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /api/v1/goals/:id - Delete goal
  static async deleteGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { error } = await supabase
        .from('goals')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ message: 'Goal archived successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/v1/goals/:id/progress - Update goal progress
  static async updateProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { value, note } = req.body;

      // Get the current goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (goalError || !goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      // Update the goal's current value
      const newCurrentValue = typeof value === 'number' ? value : goal.current_value + (parseInt(value) || 1);
      
      const { data: updatedGoal, error } = await supabase
        .from('goals')
        .update({
          current_value: newCurrentValue,
          updated_at: new Date().toISOString(),
          ...(newCurrentValue >= goal.target_value && {
            status: 'completed',
            completed_at: new Date().toISOString()
          })
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Log progress entry
      await supabase.from('goal_progress_logs').insert({
        goal_id: id,
        user_id: userId,
        previous_value: goal.current_value,
        new_value: newCurrentValue,
        note,
        logged_at: new Date().toISOString()
      });

      // Check and update milestones
      await this.checkAndUpdateMilestones(id, newCurrentValue);

      const progress = await this.calculateGoalProgress(updatedGoal);

      res.json({ goal: updatedGoal, progress, message: 'Progress updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/goals/:id/progress - Get goal progress data
  static async getGoalProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { days = 30 } = req.query;

      const { data: goal, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      // Get progress history
      const { data: progressLogs, error: logsError } = await supabase
        .from('goal_progress_logs')
        .select('*')
        .eq('goal_id', id)
        .gte('logged_at', new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: true });

      if (logsError) {
        return res.status(500).json({ error: logsError.message });
      }

      const progress = await this.calculateGoalProgress(goal);
      
      res.json({ 
        goal, 
        progress, 
        history: progressLogs,
        insights: this.generateProgressInsights(goal, progressLogs || [])
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/v1/goals/:id/milestones - Add milestone to goal
  static async addMilestone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Verify goal exists and belongs to user
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (goalError || !goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const milestoneData = {
        ...req.body,
        goal_id: id,
        completed: false
      };

      const { data: milestone, error } = await supabase
        .from('goal_milestones')
        .insert(milestoneData)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ milestone });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper method to calculate goal progress
  private static async calculateGoalProgress(goal: Goal): Promise<GoalProgress> {
    const progressPercentage = Math.min((goal.current_value / goal.target_value) * 100, 100);
    
    // Get milestone completion data
    const { data: milestones } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goal.id);

    const milestonesCompleted = milestones?.filter(m => m.completed).length || 0;
    const totalMilestones = milestones?.length || 0;

    // Calculate projected completion date if target date exists
    let projectedCompletion;
    let daysRemaining;
    
    if (goal.target_date && goal.current_value > 0) {
      const daysElapsed = Math.ceil((Date.now() - new Date(goal.started_at || goal.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const progressRate = goal.current_value / daysElapsed;
      const remainingValue = goal.target_value - goal.current_value;
      const projectedDaysToCompletion = Math.ceil(remainingValue / progressRate);
      
      projectedCompletion = new Date(Date.now() + projectedDaysToCompletion * 24 * 60 * 60 * 1000).toISOString();
      daysRemaining = Math.max(0, Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    return {
      goal_id: goal.id,
      current_progress: Math.round(progressPercentage),
      trend: this.calculateTrend(goal),
      projected_completion: projectedCompletion,
      days_remaining: daysRemaining,
      weekly_progress: await this.getWeeklyProgress(goal.id),
      milestones_completed: milestonesCompleted,
      total_milestones: totalMilestones,
      insights: this.generateGoalInsights(goal, progressPercentage, milestonesCompleted, totalMilestones)
    };
  }

  private static calculateTrend(goal: Goal): 'improving' | 'declining' | 'stable' {
    // This would analyze recent progress entries to determine trend
    // For now, return a simple calculation based on current progress
    const progressPercentage = (goal.current_value / goal.target_value) * 100;
    
    if (progressPercentage > 75) return 'improving';
    if (progressPercentage < 25) return 'declining';
    return 'stable';
  }

  private static async getWeeklyProgress(goalId: string): Promise<number[]> {
    // Get last 7 weeks of progress
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(Date.now() - (i - 1) * 7 * 24 * 60 * 60 * 1000);
      
      const { data: logs } = await supabase
        .from('goal_progress_logs')
        .select('new_value')
        .eq('goal_id', goalId)
        .gte('logged_at', weekStart.toISOString())
        .lt('logged_at', weekEnd.toISOString())
        .order('logged_at', { ascending: false })
        .limit(1);

      weeks.push(logs?.[0]?.new_value || 0);
    }
    
    return weeks;
  }

  private static generateGoalInsights(goal: Goal, progress: number, milestonesCompleted: number, totalMilestones: number): string[] {
    const insights = [];
    
    if (progress > 50) {
      insights.push('You\'re making great progress! Keep up the momentum.');
    }
    
    if (milestonesCompleted > 0) {
      insights.push(`You've completed ${milestonesCompleted} out of ${totalMilestones} milestones.`);
    }
    
    if (goal.target_date) {
      const daysRemaining = Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 30) {
        insights.push(`${daysRemaining} days remaining to reach your target date.`);
      }
    }
    
    return insights;
  }

  private static generateProgressInsights(goal: Goal, logs: any[]): string[] {
    const insights = [];
    
    if (logs.length > 0) {
      const recentActivity = logs.filter(log => 
        new Date(log.logged_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length;
      
      if (recentActivity > 0) {
        insights.push(`You've made ${recentActivity} progress updates this week.`);
      }
    }
    
    return insights;
  }

  private static async checkAndUpdateMilestones(goalId: string, currentValue: number) {
    const { data: milestones } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId)
      .eq('completed', false)
      .lte('target_value', currentValue);

    if (milestones?.length) {
      const milestoneIds = milestones.map(m => m.id);
      await supabase
        .from('goal_milestones')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .in('id', milestoneIds);
    }
  }
}

// Swagger schema for goals API
export const goalsSwaggerSchema = createSwaggerSchema({
  paths: {
    '/api/v1/goals': {
      get: {
        summary: 'Get all goals for user',
        tags: ['Goals'],
        responses: {
          200: {
            description: 'List of goals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    goals: { type: 'array', items: { $ref: '#/components/schemas/Goal' } },
                    count: { type: 'number' }
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
      Goal: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          user_id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'active', 'completed', 'paused', 'archived'] },
          target_value: { type: 'number' },
          current_value: { type: 'number' },
          unit: { type: 'string' },
          target_date: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
});

export default GoalsAPI;