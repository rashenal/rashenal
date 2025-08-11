import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { createSwaggerSchema } from '../../lib/swagger/utils';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  project_id?: string;
  due_date?: string;
  estimated_time?: number; // in minutes
  actual_time?: number; // in minutes
  tags: string[];
  dependencies: string[]; // task IDs
  ai_suggestions: {
    priority_reason?: string;
    time_estimate_reason?: string;
    related_tasks?: string[];
    scheduling_suggestion?: string;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskSuggestion {
  type: 'priority_adjustment' | 'time_estimate' | 'dependency' | 'scheduling' | 'batching';
  task_id: string;
  suggestion: string;
  confidence: number; // 0-1
  reason: string;
  action?: {
    type: string;
    data: any;
  };
}

class TasksAPI {
  // GET /api/v1/tasks - Get all tasks for user
  static async getAllTasks(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { 
        status, 
        priority, 
        project_id, 
        limit = 50, 
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      let query = supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, name, color)
        `)
        .eq('user_id', userId)
        .neq('status', 'archived');

      // Apply filters
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (project_id) query = query.eq('project_id', project_id);

      // Apply sorting and pagination
      query = query
        .order(sort_by as string, { ascending: sort_order === 'asc' })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      const { data: tasks, error, count } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ tasks, count, pagination: { limit, offset } });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/tasks/:id - Get specific task
  static async getTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, name, color),
          dependencies:tasks!inner(id, title, status)
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ task });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/v1/tasks - Create new task
  static async createTask(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate AI suggestions for the new task
      const aiSuggestions = await this.generateAISuggestions(req.body, userId);

      const taskData = {
        ...req.body,
        user_id: userId,
        ai_suggestions: aiSuggestions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select(`
          *,
          project:projects(id, name, color)
        `)
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ task, suggestions: aiSuggestions });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /api/v1/tasks/:id - Update task
  static async updateTask(req: Request, res: Response) {
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

      const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select(`
          *,
          project:projects(id, name, color)
        `)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ task });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /api/v1/tasks/:id - Delete task
  static async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { error } = await supabase
        .from('tasks')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: 'Task archived successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/tasks/suggestions - Get AI suggestions for task optimization
  static async getAISuggestions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user's current tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .neq('status', 'archived');

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const suggestions = await this.analyzeTasksForSuggestions(tasks || [], userId);

      res.json({ suggestions, count: suggestions.length });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/v1/tasks/batch-operations - Perform batch operations on tasks
  static async batchOperations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { operation, task_ids, data } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let result;
      switch (operation) {
        case 'complete':
          result = await this.batchComplete(task_ids, userId);
          break;
        case 'update_priority':
          result = await this.batchUpdatePriority(task_ids, data.priority, userId);
          break;
        case 'move_to_project':
          result = await this.batchMoveToProject(task_ids, data.project_id, userId);
          break;
        case 'archive':
          result = await this.batchArchive(task_ids, userId);
          break;
        default:
          return res.status(400).json({ error: 'Invalid operation' });
      }

      res.json({ message: 'Batch operation completed', affected_count: result.count });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper method to generate AI suggestions for a new task
  private static async generateAISuggestions(taskData: any, userId: string): Promise<any> {
    // This would integrate with Claude API to generate suggestions
    // For now, return mock suggestions
    const suggestions = {
      priority_reason: `Based on the task title "${taskData.title}", this appears to be a ${taskData.priority || 'medium'} priority task.`,
      time_estimate_reason: 'Similar tasks typically take 30-60 minutes to complete.',
      related_tasks: [],
      scheduling_suggestion: 'Best scheduled for morning hours when focus is highest.'
    };

    // In a real implementation, this would:
    // 1. Analyze the task content
    // 2. Look at user's task history
    // 3. Consider current workload
    // 4. Generate contextual suggestions

    return suggestions;
  }

  // Helper method to analyze tasks for AI suggestions
  private static async analyzeTasksForSuggestions(tasks: Task[], userId: string): Promise<TaskSuggestion[]> {
    const suggestions: TaskSuggestion[] = [];

    // Analyze for various suggestion types
    for (const task of tasks) {
      // Priority adjustment suggestions
      if (task.due_date && new Date(task.due_date) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        suggestions.push({
          type: 'priority_adjustment',
          task_id: task.id,
          suggestion: 'Consider increasing priority - due date is approaching',
          confidence: 0.8,
          reason: 'Task due within 24 hours',
          action: {
            type: 'update_priority',
            data: { priority: 'high' }
          }
        });
      }

      // Time estimate suggestions
      if (!task.estimated_time) {
        suggestions.push({
          type: 'time_estimate',
          task_id: task.id,
          suggestion: 'Add time estimate to improve planning',
          confidence: 0.7,
          reason: 'Tasks with time estimates are completed 40% faster',
          action: {
            type: 'add_time_estimate',
            data: { suggested_time: 30 }
          }
        });
      }
    }

    // Task batching suggestions
    const similarTasks = this.findSimilarTasks(tasks);
    if (similarTasks.length > 1) {
      suggestions.push({
        type: 'batching',
        task_id: 'multiple',
        suggestion: `Batch ${similarTasks.length} similar tasks together for efficiency`,
        confidence: 0.9,
        reason: 'Batching similar tasks reduces context switching',
        action: {
          type: 'create_batch',
          data: { task_ids: similarTasks.map(t => t.id) }
        }
      });
    }

    return suggestions.slice(0, 10); // Return top 10 suggestions
  }

  private static findSimilarTasks(tasks: Task[]): Task[] {
    // Simple similarity check based on category and tags
    const categories = tasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Return tasks from the largest category with more than 1 task
    const largestCategory = Object.entries(categories)
      .filter(([_, tasks]) => tasks.length > 1)
      .sort(([_, a], [__, b]) => b.length - a.length)[0];

    return largestCategory ? largestCategory[1] : [];
  }

  // Batch operation helpers
  private static async batchComplete(taskIds: string[], userId: string) {
    return await supabase
      .from('tasks')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('id', taskIds);
  }

  private static async batchUpdatePriority(taskIds: string[], priority: string, userId: string) {
    return await supabase
      .from('tasks')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', taskIds);
  }

  private static async batchMoveToProject(taskIds: string[], projectId: string, userId: string) {
    return await supabase
      .from('tasks')
      .update({ project_id: projectId, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', taskIds);
  }

  private static async batchArchive(taskIds: string[], userId: string) {
    return await supabase
      .from('tasks')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', taskIds);
  }
}

// Swagger schema for tasks API
export const tasksSwaggerSchema = createSwaggerSchema({
  paths: {
    '/api/v1/tasks': {
      get: {
        summary: 'Get all tasks for user',
        tags: ['Tasks'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'project_id', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'List of tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
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
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          user_id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'archived'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          category: { type: 'string' },
          due_date: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
});

export default TasksAPI;