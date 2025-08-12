// lib/task-service.ts
// Updated to fetch createdByName from profiles and standardise user_id ownership

import { supabase } from './supabase';
import type {
  Task,
  TaskUI,
  CreateTaskInput,
  UpdateTaskInput,
  DatabaseResponse,
  DatabaseListResponse,
} from './database-types';

export class TaskService {
  static async getUserTasks(
    taskboardId?: string
  ): Promise<DatabaseListResponse<TaskUI>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { data: [], error: new Error('User not authenticated') };
      }

      let query = supabase
        .from('tasks')
        .select('*, profiles(full_name)')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (taskboardId) {
        query = query.eq('taskboard_id', taskboardId);
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
        error:
          error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  static async createTask(
    taskData: CreateTaskInput
  ): Promise<DatabaseResponse<TaskUI>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      let taskboardId = taskData.taskboard_id;

      if (!taskboardId) {
        const { data: taskboards } = await supabase
          .from('taskboards')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1);

        if (taskboards && taskboards.length > 0) {
          taskboardId = taskboards[0].id;
        } else {
          const { data: newTaskboard, error: tbError } = await supabase
            .from('taskboards')
            .insert({
              user_id: user.id,
              name: 'My Tasks',
              description: 'Default taskboard',
            })
            .select('id')
            .single();

          taskboardId = newTaskboard?.id || null;
        }
      }

      const nextPosition = await this.getNextPosition(
        user.id,
        taskboardId,
        taskData.status || 'backlog'
      );

      const taskToInsert = {
        user_id: user.id,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'backlog',
        priority: taskData.priority || 'medium',
        category: taskData.category || null,
        due_date: taskData.due_date || null,
        ai_suggested: taskData.ai_suggested || false,
        position: nextPosition,
        ...(taskboardId && { taskboard_id: taskboardId }),
        ...(taskData.target_date && { target_date: taskData.target_date }),
        ...(taskData.estimated_time && {
          estimated_time: taskData.estimated_time,
        }),
        ...(taskData.estimated_energy && {
          estimated_energy: taskData.estimated_energy,
        }),
        ...(taskData.owner && { owner: taskData.owner }),
        ...(taskData.tags && { tags: taskData.tags }),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskToInsert])
        .select('*, profiles(full_name)')
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
        error:
          error instanceof Error ? error : new Error('Failed to create task'),
      };
    }
  }

  static async updateTask(
    taskId: string,
    updates: UpdateTaskInput
  ): Promise<DatabaseResponse<TaskUI>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const updateData: any = { updated_at: new Date().toISOString() };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined)
        updateData.priority = updates.priority;
      if (updates.category !== undefined)
        updateData.category = updates.category;
      if (updates.due_date !== undefined)
        updateData.due_date = updates.due_date;
      if (updates.target_date !== undefined)
        updateData.target_date = updates.target_date;
      if (updates.position !== undefined)
        updateData.position = updates.position;
      if (updates.completed_at !== undefined)
        updateData.completed_at = updates.completed_at;
      if (updates.owner !== undefined) updateData.owner = updates.owner;
      if (updates.estimated_time !== undefined)
        updateData.estimated_time = updates.estimated_time;
      if (updates.estimated_energy !== undefined)
        updateData.estimated_energy = updates.estimated_energy;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.close_comments !== undefined)
        updateData.close_comments = updates.close_comments;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select('*, profiles(full_name)')
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
        error:
          error instanceof Error ? error : new Error('Failed to update task'),
      };
    }
  }

  private static convertToUI(dbTask: any): TaskUI {
    return {
      ...dbTask,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
      dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
      targetDate: dbTask.target_date ? new Date(dbTask.target_date) : undefined,
      completedAt: dbTask.completed_at
        ? new Date(dbTask.completed_at)
        : undefined,
      plannedStartDate: dbTask.planned_start_date
        ? new Date(dbTask.planned_start_date)
        : undefined,
      createdByName: dbTask.profiles?.full_name || 'Unknown user',
    };
  }

  // Add convenience method for TaskImportExport component
  static async getTasks(): Promise<Task[]> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  private static async getNextPosition(
    userId: string,
    taskboardId: string | null,
    status: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .eq('status', status)
        .order('position', { ascending: false })
        .limit(1);

      if (taskboardId) {
        query = query.eq('taskboard_id', taskboardId);
      } else {
        query = query.is('taskboard_id', null);
      }

      const { data, error } = await query;
      const maxPosition = data?.[0]?.position || 0;
      return maxPosition + 1;
    } catch (error) {
      console.error('Unexpected error in getNextPosition:', error);
      return 0;
    }
  }
}
