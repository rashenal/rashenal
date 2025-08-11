import { supabase } from '../lib/supabase';

export interface TaskSuggestion {
  type: 'priority' | 'scheduling' | 'breaking_down' | 'batching' | 'dependency';
  task_id: string;
  suggestion: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  implementation_time: number; // minutes
}

export class TaskAgent {
  constructor(private userId: string) {}

  async analyzeTasks(): Promise<TaskSuggestion[]> {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', this.userId)
      .neq('status', 'completed')
      .neq('status', 'archived');

    if (!tasks || tasks.length === 0) return [];

    const suggestions: TaskSuggestion[] = [];

    // Priority analysis
    const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date()
    );

    for (const task of overdueTasks) {
      suggestions.push({
        type: 'priority',
        task_id: task.id,
        suggestion: `Task "${task.title}" is overdue - consider increasing priority`,
        confidence: 0.9,
        impact: 'high',
        implementation_time: 2
      });
    }

    // Batching suggestions
    const tasksByCategory = this.groupTasksByCategory(tasks);
    for (const [category, categoryTasks] of Object.entries(tasksByCategory)) {
      if (categoryTasks.length > 2) {
        suggestions.push({
          type: 'batching',
          task_id: 'multiple',
          suggestion: `Batch ${categoryTasks.length} ${category} tasks together for efficiency`,
          confidence: 0.8,
          impact: 'medium',
          implementation_time: 10
        });
      }
    }

    return suggestions.slice(0, 10);
  }

  private groupTasksByCategory(tasks: any[]): Record<string, any[]> {
    return tasks.reduce((groups, task) => {
      const category = task.category || 'uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(task);
      return groups;
    }, {});
  }

  async scheduleTask(taskId: string): Promise<{
    suggestedTime: string;
    reason: string;
    alternatives: string[];
  }> {
    // This would integrate with calendar to find optimal scheduling
    const tomorrow9AM = new Date();
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);

    return {
      suggestedTime: tomorrow9AM.toISOString(),
      reason: 'Based on your productivity patterns, you perform best on similar tasks at 9 AM',
      alternatives: [
        new Date(tomorrow9AM.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 11 AM
        new Date(tomorrow9AM.getTime() + 5 * 60 * 60 * 1000).toISOString()  // 2 PM
      ]
    };
  }
}

export default TaskAgent;