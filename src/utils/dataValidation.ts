import { Task, PRIORITY_LEVELS, ENERGY_LEVELS } from '../types/TaskBoard';

export class DataValidationError extends Error {
  constructor(message: string, public field: string, public value: any) {
    super(message);
    this.name = 'DataValidationError';
  }
}

export class TaskDataValidator {
  private static logWarning(field: string, value: any, fallback: any) {
    console.warn(`🔧 Data Validation: Invalid ${field} "${value}", using fallback "${fallback}"`);
  }

  /**
   * Validates and normalizes task data to prevent component crashes
   */
  static validateTask(rawTask: any): Task {
    if (!rawTask) {
      throw new DataValidationError('Task is null or undefined', 'task', rawTask);
    }

    if (!rawTask.id) {
      throw new DataValidationError('Task ID is required', 'id', rawTask.id);
    }

    if (!rawTask.title) {
      throw new DataValidationError('Task title is required', 'title', rawTask.title);
    }

    // Validate and fix priority
    const validPriorities = Object.keys(PRIORITY_LEVELS);
    let priority = rawTask.priority?.toLowerCase();
    if (!priority || !validPriorities.includes(priority)) {
      this.logWarning('priority', rawTask.priority, 'medium');
      priority = 'medium';
    }

    // Validate and fix energy_level
    const validEnergyLevels = Object.keys(ENERGY_LEVELS);
    let energy_level = rawTask.energy_level?.toLowerCase();
    if (!energy_level || !validEnergyLevels.includes(energy_level)) {
      this.logWarning('energy_level', rawTask.energy_level, 'm');
      energy_level = 'm';
    }

    // Validate and fix status
    const validStatuses = ['not_started', 'in_progress', 'blocked', 'completed', 'cancelled'];
    let status = rawTask.status?.toLowerCase();
    if (!status || !validStatuses.includes(status)) {
      this.logWarning('status', rawTask.status, 'not_started');
      status = 'not_started';
    }

    // Create validated task object
    const validatedTask: Task = {
      id: rawTask.id,
      task_number: rawTask.task_number || undefined,
      board_id: rawTask.board_id || 'default',
      column_id: rawTask.column_id || status,
      user_id: rawTask.user_id || '',
      title: rawTask.title,
      description: rawTask.description || '',
      priority: priority as any,
      energy_level: energy_level as any,
      business_value: Math.max(0, Math.min(100, rawTask.business_value || 0)),
      personal_value: Math.max(0, Math.min(100, rawTask.personal_value || 0)),
      estimated_duration: Math.max(5, rawTask.estimated_duration || 30),
      due_date: rawTask.due_date,
      position: rawTask.position || 0,
      tags: Array.isArray(rawTask.tags) ? rawTask.tags : [],
      parent_id: rawTask.parent_id,
      has_children: Boolean(rawTask.has_children),
      dependency_status: rawTask.dependency_status || 'independent',
      sub_tasks: Array.isArray(rawTask.sub_tasks) ? rawTask.sub_tasks : [],
      dependencies: Array.isArray(rawTask.dependencies) ? rawTask.dependencies : [],
      goal_connections: Array.isArray(rawTask.goal_connections) ? rawTask.goal_connections : [],
      attachments: Array.isArray(rawTask.attachments) ? rawTask.attachments : [],
      time_tracking: Array.isArray(rawTask.time_tracking) ? rawTask.time_tracking : [],
      comments: Array.isArray(rawTask.comments) ? rawTask.comments : [],
      ai_insights: rawTask.ai_insights || {
        completion_probability: 75,
        estimated_effort_accuracy: 80,
        similar_tasks: [],
        optimization_suggestions: [],
        potential_blockers: [],
        best_time_to_work: {
          preferred_time_slots: ['morning'],
          energy_requirements: 'medium',
          focus_requirements: 'medium'
        }
      },
      progress_percentage: Math.max(0, Math.min(100, rawTask.progress_percentage || 0)),
      status: status as any,
      created_at: rawTask.created_at || new Date().toISOString(),
      updated_at: rawTask.updated_at || new Date().toISOString()
    };

    return validatedTask;
  }

  /**
   * Validates an array of tasks
   */
  static validateTasks(rawTasks: any[]): Task[] {
    if (!Array.isArray(rawTasks)) {
      console.warn('🔧 Data Validation: Tasks is not an array, returning empty array');
      return [];
    }

    const validatedTasks: Task[] = [];
    
    for (let i = 0; i < rawTasks.length; i++) {
      try {
        const validatedTask = this.validateTask(rawTasks[i]);
        validatedTasks.push(validatedTask);
      } catch (error) {
        console.error(`🔧 Data Validation: Failed to validate task at index ${i}:`, error);
        // Skip invalid tasks instead of crashing
      }
    }

    return validatedTasks;
  }

  /**
   * Safe getter for configuration objects
   */
  static safeGetConfig<T>(configMap: Record<string, T>, key: string, fallback: T): T {
    if (!key || !configMap[key]) {
      console.warn(`🔧 Config Access: Invalid key "${key}", using fallback`);
      return fallback;
    }
    return configMap[key];
  }
}

// Export utility functions for easy use
export const validateTask = TaskDataValidator.validateTask.bind(TaskDataValidator);
export const validateTasks = TaskDataValidator.validateTasks.bind(TaskDataValidator);
export const safeGetConfig = TaskDataValidator.safeGetConfig.bind(TaskDataValidator);