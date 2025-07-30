// lib/database-types.ts
// Fixed types that match your existing Supabase schema

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  template: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string | null;
  due_date: string | null;
  ai_suggested: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;

  // FIXED: Adding missing fields from schema
  parent_task_id: string | null; // ✅ This was missing!
  taskboard_id: string; // ✅ This was missing too!
  created_by: string; // ✅ This was missing!
  estimated_time: number | null; // ✅ From your schema
  actual_time: number | null; // ✅ From your schema
  ai_estimated_time: number | null; // ✅ From your schema
  ai_estimated_effort: number | null; // ✅ Added this field
  estimated_energy: 'XS' | 'S' | 'M' | 'H' | 'XL' | null; // ✅ From your schema
  planned_start_date: string | null; // ✅ From your schema
  target_date: string | null; // ✅ From your schema
  close_comments: string | null; // ✅ From your schema
  tags: string[] | null; // ✅ From your schema

  // NEW: Task dependencies
  predecessor_task_ids: string[] | null; // ✅ For task dependencies
  successor_task_ids: string[] | null; // ✅ For task dependencies

  // Enhanced fields (after schema update)
  task_uid?: string | null;
  owner?: string | null;
  ai_suggestions?: any[] | null;
  notifications?: any[] | null;
  attachments?: any[] | null;
  comments?: any[] | null;
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

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: 'productivity' | 'habit' | 'goal' | 'motivation';
  title: string;
  content: string;
  confidence_score: number | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
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

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  notifications_enabled: boolean;
  ai_coaching_style: 'encouraging' | 'direct' | 'analytical';
  dashboard_layout: any;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type:
    | 'finish_to_start'
    | 'start_to_start'
    | 'finish_to_finish'
    | 'start_to_finish';
  lag_days: number;
  created_at: string;
  created_by: string;
}

// Input types for creating/updating records
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  category?: string;
  due_date?: string; // ISO date string
  target_date?: string; // ISO date string
  ai_suggested?: boolean;
  project_id?: string;
  taskboard_id?: string; // ✅ Added this
  parent_task_id?: string; // ✅ Added this
  created_by?: string; // ✅ Added this
  owner?: string;
  estimated_time?: number;
  ai_estimated_effort?: number;
  ai_suggestions?: any[];
  estimated_energy?: 'XS' | 'S' | 'M' | 'XL';
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  category?: string;
  due_date?: string;
  target_date?: string;
  position?: number;
  completed_at?: string;
  parent_task_id?: string; // ✅ Added this
  owner?: string;
  estimated_time?: number;
  actual_time?: number; // ✅ Added this
  ai_estimated_effort?: number;
  ai_suggestions?: any[];
  estimated_energy?: 'XS' | 'S' | 'M' | 'XL';
  tags?: string[];
  close_comments?: string; // ✅ Added this
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  template?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  template?: string;
  is_active?: boolean;
}

export interface CreateHabitInput {
  name: string;
  category?: string;
  target_value?: number;
  target_unit?: string;
  color?: string;
  icon?: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category?: string;
  target_date?: string;
  status?: Goal['status'];
}

// UI-friendly types (converted from database types)
export interface TaskUI
  extends Omit<
    Task,
    | 'created_at'
    | 'updated_at'
    | 'due_date'
    | 'target_date'
    | 'completed_at'
    | 'planned_start_date'
  > {
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  targetDate?: Date;
  completedAt?: Date;
  plannedStartDate?: Date; // ✅ Added this
  // All other fields including parent_task_id are now inherited correctly
}

export interface ProjectUI extends Omit<Project, 'created_at' | 'updated_at'> {
  createdAt: Date;
  updatedAt: Date;
}

// Database response types
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseListResponse<T> {
  data: T[];
  error: Error | null;
  count?: number;
}
