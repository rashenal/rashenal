// Enhanced task service with document attachments and proper persistence
import { supabase } from './supabase';
import type {
  Task,
  TaskUI,
  CreateTaskInput,
  UpdateTaskInput,
  DatabaseResponse,
  DatabaseListResponse,
} from './database-types';

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface EnhancedTaskUI extends TaskUI {
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  attachment_count?: number;
  comment_count?: number;
}

export class EnhancedTaskService {
  // Get tasks with attachments and comments
  static async getUserTasks(
    taskboardId?: string
  ): Promise<DatabaseListResponse<EnhancedTaskUI>> {
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
        .select(`
          *,
          profiles(full_name),
          task_attachments(id, file_name, file_size, file_type, file_url, created_at),
          task_comments(id, content, created_at, profiles(full_name))
        `)
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

      const tasks = (data || []).map(this.convertToEnhancedUI);
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

  // Create task with proper persistence
  static async createTask(
    taskData: CreateTaskInput
  ): Promise<DatabaseResponse<EnhancedTaskUI>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      // Ensure we have a taskboard
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
              is_active: true
            })
            .select('id')
            .single();

          if (tbError) {
            console.error('Error creating taskboard:', tbError);
            return { data: null, error: new Error('Failed to create taskboard') };
          }

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
        taskboard_id: taskboardId,
        target_date: taskData.target_date || null,
        estimated_time: taskData.estimated_time || null,
        estimated_energy: taskData.estimated_energy || null,
        owner: taskData.owner || null,
        tags: taskData.tags || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskToInsert])
        .select(`
          *,
          profiles(full_name),
          task_attachments(id, file_name, file_size, file_type, file_url, created_at),
          task_comments(id, content, created_at, profiles(full_name))
        `)
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: this.convertToEnhancedUI(data), error: null };
    } catch (error) {
      console.error('Unexpected error in createTask:', error);
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Failed to create task'),
      };
    }
  }

  // Update task with proper persistence
  static async updateTask(
    taskId: string,
    updates: UpdateTaskInput
  ): Promise<DatabaseResponse<EnhancedTaskUI>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const updateData: any = { 
        updated_at: new Date().toISOString()
      };

      // Map all possible updates
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof UpdateTaskInput] !== undefined) {
          updateData[key] = updates[key as keyof UpdateTaskInput];
        }
      });

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select(`
          *,
          profiles(full_name),
          task_attachments(id, file_name, file_size, file_type, file_url, created_at),
          task_comments(id, content, created_at, profiles(full_name))
        `)
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: this.convertToEnhancedUI(data), error: null };
    } catch (error) {
      console.error('Unexpected error in updateTask:', error);
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Failed to update task'),
      };
    }
  }

  // Upload attachment to task
  static async uploadAttachment(
    taskId: string,
    file: File
  ): Promise<DatabaseResponse<TaskAttachment>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { data: null, error: new Error('File size must be less than 10MB') };
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return { data: null, error: new Error('Failed to upload file') };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      // Save attachment record
      const attachmentData = {
        task_id: taskId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        uploaded_by: user.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('task_attachments')
        .insert([attachmentData])
        .select()
        .single();

      if (error) {
        console.error('Error saving attachment record:', error);
        return { data: null, error: new Error('Failed to save attachment') };
      }

      return { data: data as TaskAttachment, error: null };
    } catch (error) {
      console.error('Unexpected error in uploadAttachment:', error);
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Failed to upload attachment'),
      };
    }
  }

  // Delete attachment
  static async deleteAttachment(attachmentId: string): Promise<{ error: Error | null }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { error: new Error('User not authenticated') };
      }

      // Get attachment info to delete from storage
      const { data: attachment, error: getError } = await supabase
        .from('task_attachments')
        .select('file_url')
        .eq('id', attachmentId)
        .single();

      if (getError) {
        return { error: new Error('Attachment not found') };
      }

      // Extract file path from URL
      const filePath = attachment.file_url.split('/task-attachments/')[1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([filePath]);

      if (storageError) {
        console.warn('Error deleting from storage:', storageError);
      }

      // Delete record
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId)
        .eq('uploaded_by', user.id);

      if (error) {
        return { error: new Error('Failed to delete attachment') };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error in deleteAttachment:', error);
      return {
        error:
          error instanceof Error ? error : new Error('Failed to delete attachment'),
      };
    }
  }

  // Add comment to task
  static async addComment(
    taskId: string,
    content: string
  ): Promise<DatabaseResponse<TaskComment>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const commentData = {
        task_id: taskId,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('task_comments')
        .insert([commentData])
        .select(`
          *,
          profiles(full_name)
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return { data: null, error: new Error('Failed to add comment') };
      }

      return { 
        data: {
          ...data,
          user_name: data.profiles?.full_name || 'Unknown user'
        } as TaskComment, 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error in addComment:', error);
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Failed to add comment'),
      };
    }
  }

  // Convert database task to enhanced UI task
  private static convertToEnhancedUI(dbTask: any): EnhancedTaskUI {
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
      attachments: dbTask.task_attachments || [],
      comments: (dbTask.task_comments || []).map((comment: any) => ({
        ...comment,
        user_name: comment.profiles?.full_name || 'Unknown user'
      })),
      attachment_count: dbTask.task_attachments?.length || 0,
      comment_count: dbTask.task_comments?.length || 0,
    };
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

  // Delete task
  static async deleteTask(taskId: string): Promise<{ error: Error | null }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { error: new Error('User not authenticated') };
      }

      // Delete attachments first
      const { data: attachments } = await supabase
        .from('task_attachments')
        .select('id')
        .eq('task_id', taskId);

      if (attachments) {
        for (const attachment of attachments) {
          await this.deleteAttachment(attachment.id);
        }
      }

      // Delete comments
      await supabase
        .from('task_comments')
        .delete()
        .eq('task_id', taskId);

      // Delete task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        return { error: new Error('Failed to delete task') };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error in deleteTask:', error);
      return {
        error:
          error instanceof Error ? error : new Error('Failed to delete task'),
      };
    }
  }
}