// lib/task-service-demo.ts
// Demo version of TaskService that bypasses authentication for development

import { supabase } from './supabase';
import type { 
  Task, 
  TaskUI, 
  CreateTaskInput, 
  UpdateTaskInput,
  DatabaseResponse,
  DatabaseListResponse 
} from './database-types';

// Demo user ID - we'll use this for all operations
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export class TaskServiceDemo {
  
  /**
   * Get all tasks for demo user (bypasses auth)
   */
  static async getUserTasks(projectId?: string): Promise<DatabaseListResponse<TaskUI>> {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return { data: [], error: new Error(error.message) };
      }
      
      const tasks = (data || []).map(this.convertToUI);
      return { data: tasks, error: null, count };
    } catch (error) {
      console.error('Unexpected error in getUserTasks:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  }

  /**
   * Create a new task (demo mode)
   */
  static async createTask(taskData: CreateTaskInput): Promise<DatabaseResponse<TaskUI>> {
    try {
      // Get next position for this status/project
      const nextPosition = await this.getNextPosition(DEMO_USER_ID, taskData.project_id, taskData.status || 'backlog');

      const taskToInsert = {
        user_id: DEMO_USER_ID,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'backlog',
        priority: taskData.priority || 'medium',
        category: taskData.category || null,
        due_date: taskData.due_date || null,
        target_date: taskData.target_date || null,
        ai_suggested: taskData.ai_suggested || false,
        project_id: taskData.project_id || null,
        owner: taskData.owner || 'Demo User',
        ai_estimated_effort: taskData.ai_estimated_effort || Math.floor(Math.random() * 8) + 2,
        ai_suggestions: taskData.ai_suggestions || this.generateAISuggestions(taskData.title),
        position: nextPosition,
        notifications: [],
        attachments: [],
        comments: []
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: this.convertToUI(data), error: null };
    } catch (error) {
      console.error('Unexpected error in createTask:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to create task') 
      };
    }
  }

  /**
   * Update an existing task (demo mode)
   */
  static async updateTask(taskId: string, updates: UpdateTaskInput): Promise<DatabaseResponse<TaskUI>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only update fields that are provided
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.target_date !== undefined) updateData.target_date = updates.target_date;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.completed_at !== undefined) updateData.completed_at = updates.completed_at;
      if (updates.owner !== undefined) updateData.owner = updates.owner;
      if (updates.ai_estimated_effort !== undefined) updateData.ai_estimated_effort = updates.ai_estimated_effort;
      if (updates.ai_suggestions !== undefined) updateData.ai_suggestions = updates.ai_suggestions;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', DEMO_USER_ID) // Security: only update demo user tasks
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: this.convertToUI(data), error: null };
    } catch (error) {
      console.error('Unexpected error in updateTask:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to update task') 
      };
    }
  }

  /**
   * Delete a task (demo mode)
   */
  static async deleteTask(taskId: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', DEMO_USER_ID); // Security: only delete demo user tasks

      if (error) {
        console.error('Error deleting task:', error);
        return { data: false, error: new Error(error.message) };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Unexpected error in deleteTask:', error);
      return { 
        data: false, 
        error: error instanceof Error ? error : new Error('Failed to delete task') 
      };
    }
  }

  /**
   * Move task to different status (for drag & drop)
   */
  static async moveTask(taskId: string, newStatus: Task['status'], newPosition?: number): Promise<DatabaseResponse<TaskUI>> {
    try {
      const updates: UpdateTaskInput = {
        status: newStatus,
        position: newPosition || 0
      };

      // If moving to done/completed, set completion date
      if (newStatus === 'done' || newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      // If moving from done/completed, clear completion date
      else {
        updates.completed_at = null;
      }

      return this.updateTask(taskId, updates);
    } catch (error) {
      console.error('Unexpected error in moveTask:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to move task') 
      };
    }
  }

  /**
   * Get task statistics (demo mode)
   */
  static async getTaskStats(projectId?: string): Promise<DatabaseResponse<{
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    backlog: number;
    blocked: number;
  }>> {
    try {
      let query = supabase
        .from('tasks')
        .select('status')
        .eq('user_id', DEMO_USER_ID);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching task stats:', error);
        return { 
          data: { total: 0, completed: 0, inProgress: 0, todo: 0, backlog: 0, blocked: 0 }, 
          error: new Error(error.message) 
        };
      }

      const stats = {
        total: data?.length || 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        backlog: 0,
        blocked: 0
      };

      data?.forEach(task => {
        switch (task.status) {
          case 'done':
          case 'completed':
            stats.completed++;
            break;
          case 'in_progress':
            stats.inProgress++;
            break;
          case 'todo':
            stats.todo++;
            break;
          case 'backlog':
            stats.backlog++;
            break;
          case 'blocked':
            stats.blocked++;
            break;
        }
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Unexpected error in getTaskStats:', error);
      return { 
        data: { total: 0, completed: 0, inProgress: 0, todo: 0, backlog: 0, blocked: 0 }, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  }

  /**
   * Initialize demo user if needed
   */
  static async initializeDemoUser(): Promise<DatabaseResponse<boolean>> {
    try {
      // Check if demo user already exists in user_profiles
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', DEMO_USER_ID)
        .single();

      if (!existingProfile) {
        // Create demo user profile
        const { error } = await supabase
          .from('user_profiles')
          .insert([{
            id: DEMO_USER_ID,
            email: 'demo@example.com',
            full_name: 'Demo User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error creating demo user:', error);
          return { data: false, error: new Error(error.message) };
        }

        console.log('Demo user created successfully');
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Error initializing demo user:', error);
      return { 
        data: false, 
        error: error instanceof Error ? error : new Error('Failed to initialize demo user') 
      };
    }
  }

  // Private helper methods

  /**
   * Convert database task to UI-friendly format
   */
  private static convertToUI(dbTask: Task): TaskUI {
    return {
      ...dbTask,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
      dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
      targetDate: dbTask.target_date ? new Date(dbTask.target_date) : undefined,
      completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined
    };
  }

  /**
   * Get next position for task in status column
   */
  private static async getNextPosition(userId: string, projectId: string | undefined, status: string): Promise<number> {
    try {
      let query = supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .eq('status', status)
        .order('position', { ascending: false })
        .limit(1);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting next position:', error);
        return 0;
      }

      const maxPosition = data?.[0]?.position || 0;
      return maxPosition + 1;
    } catch (error) {
      console.error('Unexpected error in getNextPosition:', error);
      return 0;
    }
  }

  /**
   * Generate AI suggestions for demo
   */
  private static generateAISuggestions(title: string): string[] {
    const suggestions = [
      'Break this task into smaller, more manageable subtasks',
      'Consider potential dependencies with other tasks',
      'Set up automated testing for this feature',
      'Document the implementation for future reference',
      'Get stakeholder review before finalizing',
      'Consider using a design system for consistency',
      'Test on multiple devices and browsers',
      'Add error handling and edge cases',
      'Optimize for performance',
      'Include accessibility features'
    ];

    // Return 2-3 random suggestions
    const shuffled = suggestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
  }
}