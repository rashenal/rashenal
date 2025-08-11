/**
 * Enhanced Task Board System Types
 * Complete redesign for AI-powered project management
 */

export interface TaskBoardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'professional' | 'wellness' | 'education' | 'project_management';
  icon: string;
  color_scheme: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_completion_time: string;
  created_by: 'system' | 'user' | 'ai';
  is_public: boolean;
  usage_count: number;
  rating: number;
  tags: string[];
  columns: TaskColumn[];
  default_tasks: TaskTemplate[];
  ai_customization_prompts: {
    context_questions: string[];
    customization_areas: string[];
    success_metrics: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface TaskBoard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  template_id?: string;
  color_scheme: string;
  is_archived: boolean;
  is_favorite: boolean;
  progress_percentage: number;
  columns: TaskColumn[];
  tasks: Task[];
  goals_connected: string[]; // Goal IDs
  ai_insights: AIBoardInsights;
  settings: BoardSettings;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface TaskColumn {
  id: string;
  board_id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  task_limit?: number;
  is_completion_column: boolean;
  automation_rules?: ColumnAutomationRule[];
}

export interface Task {
  id: string;
  board_id: string;
  column_id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  energy_level: 'xs' | 's' | 'm' | 'l' | 'xl';
  business_value: number; // 0-100
  personal_value: number; // 0-100
  estimated_duration: number; // minutes
  actual_duration?: number; // minutes
  due_date?: string;
  ai_estimated_completion?: {
    date: string;
    confidence_level: number; // 0-100
    factors: string[];
  };
  position: number;
  tags: string[];
  assignee_id?: string;
  parent_task_id?: string;
  sub_tasks: SubTask[];
  dependencies: TaskDependency[];
  goal_connections: GoalConnection[];
  attachments: TaskAttachment[];
  time_tracking: TimeTrackingEntry[];
  comments: TaskComment[];
  ai_insights: AITaskInsights;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SubTask {
  id: string;
  parent_task_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  position: number;
  estimated_duration?: number;
  actual_duration?: number;
  assignee_id?: string;
  due_date?: string;
  created_at: string;
  completed_at?: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  delay_days?: number;
  is_critical: boolean;
}

export interface GoalConnection {
  goal_id: string;
  contribution_weight: number; // 0-100, how much this task contributes to the goal
  impact_description?: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  ai_summary?: string;
  ai_extracted_text?: string;
  upload_date: string;
  uploaded_by: string;
}

export interface TimeTrackingEntry {
  id: string;
  task_id: string;
  start_time: string;
  end_time?: string;
  duration: number; // minutes
  description?: string;
  session_type: 'focused' | 'pomodoro' | 'collaborative' | 'research';
  productivity_score?: number; // 1-5
  energy_level_start?: number; // 1-5
  energy_level_end?: number; // 1-5
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  comment_type: 'note' | 'update' | 'question' | 'ai_suggestion';
  ai_generated: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AIBoardInsights {
  productivity_score: number; // 0-100
  bottlenecks: {
    area: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendations: string[];
  }[];
  progress_prediction: {
    estimated_completion_date: string;
    confidence_level: number;
    key_risks: string[];
  };
  optimization_suggestions: {
    type: 'workflow' | 'prioritization' | 'resource_allocation' | 'time_management';
    title: string;
    description: string;
    potential_impact: string;
    effort_required: 'low' | 'medium' | 'high';
  }[];
  workload_analysis: {
    current_capacity_usage: number; // 0-100
    energy_distribution: { [key: string]: number };
    peak_productivity_times: string[];
    suggested_task_scheduling: TaskSchedulingSuggestion[];
  };
}

export interface AITaskInsights {
  completion_probability: number; // 0-100
  estimated_effort_accuracy: number; // 0-100 (compared to similar tasks)
  similar_tasks: {
    task_id: string;
    similarity_score: number;
    lessons_learned: string[];
  }[];
  optimization_suggestions: string[];
  potential_blockers: {
    blocker: string;
    probability: number;
    mitigation_strategy: string;
  }[];
  best_time_to_work: {
    preferred_time_slots: string[];
    energy_requirements: string;
    focus_requirements: string;
  };
}

export interface TaskSchedulingSuggestion {
  task_id: string;
  suggested_start_time: string;
  suggested_duration: number;
  reasoning: string;
  energy_alignment_score: number;
}

export interface BoardSettings {
  default_column_limit?: number;
  auto_archive_completed: boolean;
  auto_archive_days: number;
  enable_ai_suggestions: boolean;
  enable_time_tracking: boolean;
  enable_goal_integration: boolean;
  notification_preferences: {
    due_date_reminders: boolean;
    progress_updates: boolean;
    ai_insights: boolean;
    collaboration_updates: boolean;
  };
  view_preferences: {
    default_view: 'kanban' | 'list' | 'calendar' | 'timeline';
    show_sub_tasks: boolean;
    show_dependencies: boolean;
    show_ai_insights: boolean;
    compact_mode: boolean;
  };
}

export interface ColumnAutomationRule {
  id: string;
  trigger: 'task_moved_to' | 'task_completed' | 'due_date_passed' | 'time_spent';
  conditions: { [key: string]: any };
  actions: {
    type: 'move_task' | 'assign_user' | 'add_comment' | 'send_notification' | 'update_priority';
    parameters: { [key: string]: any };
  }[];
  is_active: boolean;
}

export interface TaskTemplate {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  column_name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  energy_level: 'xs' | 's' | 'm' | 'l' | 'xl';
  estimated_duration: number;
  tags: string[];
  sub_task_templates: SubTaskTemplate[];
  position: number;
}

export interface SubTaskTemplate {
  title: string;
  description?: string;
  estimated_duration?: number;
  position: number;
}

// View and interaction types
export interface TaskFilters {
  search?: string;
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  energy_level?: ('xs' | 's' | 'm' | 'l' | 'xl')[];
  tags?: string[];
  assignee?: string[];
  due_date_range?: {
    start?: string;
    end?: string;
  };
  status?: ('not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled')[];
  has_attachments?: boolean;
  connected_to_goals?: boolean;
  ai_recommended?: boolean;
}

export interface TaskSortOptions {
  field: 'priority' | 'due_date' | 'created_at' | 'updated_at' | 'business_value' | 'personal_value' | 'estimated_duration';
  direction: 'asc' | 'desc';
}

export interface BoardView {
  type: 'kanban' | 'list' | 'calendar' | 'timeline' | 'dashboard';
  filters: TaskFilters;
  sort: TaskSortOptions;
  grouping?: 'priority' | 'assignee' | 'due_date' | 'energy_level' | 'tags';
}

// AI Template Customization Types
export interface AITemplateCustomization {
  template_id: string;
  user_context: {
    role?: string;
    industry?: string;
    experience_level?: string;
    team_size?: number;
    timeline?: string;
    specific_goals?: string[];
    constraints?: string[];
  };
  customization_requests: {
    question: string;
    answer: string;
    weight: number; // influence on customization
  }[];
  generated_modifications: {
    added_tasks: TaskTemplate[];
    modified_tasks: { task_id: string; modifications: Partial<TaskTemplate> }[];
    removed_tasks: string[];
    column_changes: { column_id: string; changes: Partial<TaskColumn> }[];
  };
  ai_rationale: string;
}

// Predefined template constants
export const TEMPLATE_CATEGORIES = {
  personal: {
    name: 'Personal Development',
    icon: '🌱',
    color: 'green'
  },
  professional: {
    name: 'Professional Growth',
    icon: '💼',
    color: 'blue'
  },
  wellness: {
    name: 'Health & Wellness',
    icon: '💪',
    color: 'emerald'
  },
  education: {
    name: 'Learning & Education',
    icon: '📚',
    color: 'purple'
  },
  project_management: {
    name: 'Project Management',
    icon: '📊',
    color: 'indigo'
  }
} as const;

export const ENERGY_LEVELS = {
  xs: { name: 'Quick Win', duration: '5-15 min', color: 'green', icon: '⚡' },
  s: { name: 'Light Task', duration: '15-30 min', color: 'blue', icon: '🔵' },
  m: { name: 'Standard Task', duration: '30-60 min', color: 'yellow', icon: '🟡' },
  l: { name: 'Deep Work', duration: '1-2 hours', color: 'orange', icon: '🟠' },
  xl: { name: 'Major Project', duration: '2+ hours', color: 'red', icon: '🔴' }
} as const;

export const PRIORITY_LEVELS = {
  low: { name: 'Low', color: 'gray', icon: '⬇️' },
  medium: { name: 'Medium', color: 'blue', icon: '➡️' },
  high: { name: 'High', color: 'orange', icon: '⬆️' },
  urgent: { name: 'Urgent', color: 'red', icon: '🚨' }
} as const;