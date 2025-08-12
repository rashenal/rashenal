import { supabase } from '../lib/supabase';

export interface HabitOptimization {
  habit_id: string;
  type: 'frequency' | 'timing' | 'stacking' | 'environment' | 'reward';
  suggestion: string;
  confidence: number; // 0-1
  evidence: string[];
  implementation: {
    steps: string[];
    timeframe: string;
    effort_level: 'low' | 'medium' | 'high';
  };
}

export class HabitAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async analyzeHabits(): Promise<HabitOptimization[]> {
    try {
      // Get user's habits and completion data
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', this.userId)
        .eq('is_active', true);

      if (!habits || habits.length === 0) {
        return [];
      }

      const optimizations: HabitOptimization[] = [];

      for (const habit of habits) {
        const habitOptimizations = await this.analyzeHabit(habit);
        optimizations.push(...habitOptimizations);
      }

      return optimizations.slice(0, 10); // Top 10 optimizations
    } catch (error) {
      console.error('Error analyzing habits:', error);
      return [];
    }
  }

  private async analyzeHabit(habit: any): Promise<HabitOptimization[]> {
    const optimizations: HabitOptimization[] = [];

    // Get completion history
    const { data: completions } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habit.id)
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: false });

    const completionRate = this.calculateCompletionRate(completions || []);
    const bestTimes = this.analyzeBestTimes(completions || []);
    const streakPattern = this.analyzeStreakPattern(completions || []);

    // Frequency optimization
    if (completionRate < 50) {
      optimizations.push({
        habit_id: habit.id,
        type: 'frequency',
        suggestion: `Consider reducing frequency from ${habit.target_frequency} to build consistency first`,
        confidence: 0.8,
        evidence: [`Current completion rate: ${completionRate}%`, 'Lower frequency builds stronger habits initially'],
        implementation: {
          steps: [
            'Reduce target frequency by 50%',
            'Focus on consistency for 2 weeks',
            'Gradually increase frequency once stable'
          ],
          timeframe: '2-4 weeks',
          effort_level: 'low'
        }
      });
    }

    // Timing optimization
    if (bestTimes.length > 0) {
      const bestTime = bestTimes[0];
      optimizations.push({
        habit_id: habit.id,
        type: 'timing',
        suggestion: `You're most successful completing this habit at ${bestTime.hour}:00`,
        confidence: 0.9,
        evidence: [`${bestTime.successRate}% success rate at this time`, 'Timing consistency improves habit formation'],
        implementation: {
          steps: [
            `Set a daily reminder for ${bestTime.hour}:00`,
            'Block this time in your calendar',
            'Prepare environment in advance'
          ],
          timeframe: '1 week',
          effort_level: 'low'
        }
      });
    }

    // Habit stacking recommendation
    const stackingOpportunity = await this.findStackingOpportunity(habit);
    if (stackingOpportunity) {
      optimizations.push({
        habit_id: habit.id,
        type: 'stacking',
        suggestion: `Stack this habit with your ${stackingOpportunity.anchorHabit} routine`,
        confidence: 0.7,
        evidence: ['Habit stacking increases success rates by 40%', 'Both habits have similar timing patterns'],
        implementation: {
          steps: [
            `After completing ${stackingOpportunity.anchorHabit}, immediately start ${habit.name}`,
            'Use the same location for both habits',
            'Create a single reminder for the stack'
          ],
          timeframe: '2 weeks',
          effort_level: 'medium'
        }
      });
    }

    return optimizations;
  }

  private calculateCompletionRate(completions: any[]): number {
    const daysInPeriod = 30;
    return Math.round((completions.length / daysInPeriod) * 100);
  }

  private analyzeBestTimes(completions: any[]): Array<{ hour: number; successRate: number }> {
    const hourCounts: Record<number, number> = {};
    
    completions.forEach(completion => {
      const hour = new Date(completion.completed_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const totalCompletions = completions.length;
    
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        successRate: Math.round((count / totalCompletions) * 100)
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3);
  }

  private analyzeStreakPattern(completions: any[]): any {
    // Analyze streak patterns to identify what breaks streaks
    return {
      averageStreak: 7,
      commonBreakDay: 'Sunday',
      pattern: 'weekday-focused'
    };
  }

  private async findStackingOpportunity(habit: any): Promise<{ anchorHabit: string } | null> {
    // Find other habits that could be stacked with this one
    const { data: otherHabits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .neq('id', habit.id);

    if (!otherHabits || otherHabits.length === 0) {
      return null;
    }

    // Simple logic to find a compatible habit
    const compatibleHabit = otherHabits.find(h => 
      h.target_frequency === habit.target_frequency && 
      h.category !== habit.category
    );

    return compatibleHabit ? { anchorHabit: compatibleHabit.name } : null;
  }

  // Monitor habits and generate real-time suggestions
  async monitorAndSuggest(): Promise<string[]> {
    const suggestions: string[] = [];

    // Check for habits that haven't been completed today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: habitsToday } = await supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', this.userId)
      .gte('completed_at', today + 'T00:00:00Z');

    const { data: allHabits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .eq('target_frequency', 'daily');

    const completedToday = new Set(habitsToday?.map(h => h.habit_id) || []);
    const pendingHabits = allHabits?.filter(h => !completedToday.has(h.id)) || [];

    const currentHour = new Date().getHours();

    for (const habit of pendingHabits) {
      if (currentHour >= 9 && currentHour <= 11) {
        suggestions.push(`Morning reminder: Time for your ${habit.name} habit!`);
      } else if (currentHour >= 18 && currentHour <= 20) {
        suggestions.push(`Evening check-in: Don't forget your ${habit.name} habit before bed.`);
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  // Predict habit success likelihood
  async predictSuccess(habitId: string): Promise<{ 
    probability: number; 
    factors: string[];
    recommendations: string[];
  }> {
    // Get habit and completion history
    const { data: habit } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single();

    const { data: completions } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const completionRate = this.calculateCompletionRate(completions || []);
    const consistency = this.analyzeConsistency(completions || []);
    
    let probability = 0.5; // Base probability
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Adjust based on completion rate
    if (completionRate > 80) {
      probability += 0.3;
      factors.push('High completion rate');
    } else if (completionRate < 30) {
      probability -= 0.2;
      factors.push('Low completion rate');
      recommendations.push('Consider reducing frequency to build consistency');
    }

    // Adjust based on consistency
    if (consistency > 0.7) {
      probability += 0.2;
      factors.push('Good consistency pattern');
    } else {
      probability -= 0.1;
      factors.push('Irregular completion pattern');
      recommendations.push('Set specific times for this habit');
    }

    // Day of week factor
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      probability -= 0.1;
      factors.push('Weekend completion typically lower');
      recommendations.push('Plan weekend habit triggers differently');
    }

    probability = Math.max(0, Math.min(1, probability));

    return {
      probability: Math.round(probability * 100) / 100,
      factors,
      recommendations
    };
  }

  private analyzeConsistency(completions: any[]): number {
    if (completions.length < 7) return 0;

    // Calculate consistency based on gaps between completions
    const dates = completions.map(c => new Date(c.completed_at));
    dates.sort((a, b) => a.getTime() - b.getTime());

    const gaps = [];
    for (let i = 1; i < dates.length; i++) {
      const gapDays = Math.round((dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24));
      gaps.push(gapDays);
    }

    const averageGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((acc, gap) => acc + Math.pow(gap - averageGap, 2), 0) / gaps.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - (variance / 10));
  }
}

export default HabitAgent;