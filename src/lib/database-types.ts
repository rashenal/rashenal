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

// Work Preferences Types
export interface WorkPreferences {
  remote_work: 'required' | 'preferred' | 'hybrid' | 'no_preference' | 'office_only';
  company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | 'no_preference';
  work_environment: 'collaborative' | 'independent' | 'mixed' | 'no_preference';
  travel_requirements: 'none' | 'minimal' | 'moderate' | 'frequent' | 'no_preference';
  overtime_expectations: 'none' | 'occasional' | 'regular' | 'no_preference';
  deal_breakers: string[]; // e.g., ["No remote work", "Required weekend work", "Unpaid overtime"]
  must_haves: string[]; // e.g., ["Health insurance", "Flexible hours", "Professional development"]
  preferred_benefits: string[]; // e.g., ["Stock options", "Gym membership", "Free meals"]
  work_life_balance_priority: 1 | 2 | 3 | 4 | 5; // 1 = not important, 5 = critical
  growth_opportunities_priority: 1 | 2 | 3 | 4 | 5;
  compensation_priority: 1 | 2 | 3 | 4 | 5;
  company_mission_priority: 1 | 2 | 3 | 4 | 5;
  technical_challenges_priority: 1 | 2 | 3 | 4 | 5;
}

// Job Finder Module Types - Updated to match exact schema
export interface JobProfile {
  id: string;
  user_id: string;
  name: string; // Renamed from 'title' in migration
  email?: string | null; // Added in migration
  phone?: string | null; // Added in migration  
  location?: string | null; // Added in migration
  bio?: string | null;
  summary?: string | null;
  skills?: string[];
  work_preferences?: WorkPreferences | null; // JSONB field
  cv_tone?: string | null;
  cover_letter_tone?: string | null;
  avatar_url?: string | null;
  intro_video_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Fields from original database migration
  experience_level?: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null;
  employment_types?: string[];
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  salary_currency?: string;
  locations?: string[]; // Note: different from singular 'location' above
  remote_preference?: 'onsite' | 'hybrid' | 'remote' | 'flexible' | null;
  industries?: string[];
  company_sizes?: string[];
  values?: string[];
  deal_breakers?: string[];
  resume_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  cover_letter_template?: string | null;
}

// Enhanced Job Search Types - New Schema
export interface EnhancedJobSearch {
  id: string;
  user_id: string;
  profile_id?: string | null;
  name: string;
  
  // Basic Search Criteria
  job_title?: string | null;
  location?: string | null;
  remote_type?: 'onsite' | 'hybrid' | 'remote' | 'flexible' | null;
  employment_type?: string[] | null;
  experience_level?: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  
  // Advanced Criteria
  company_size?: string[] | null;
  industry_sectors?: string[] | null;
  required_skills?: string[] | null;
  preferred_skills?: string[] | null;
  work_authorization?: string | null;
  visa_sponsorship?: boolean | null;
  
  // Job Board Selection
  selected_job_boards?: string[] | null;
  
  // Search Configuration
  search_frequency?: 'manual' | 'daily' | 'weekly' | 'bi_weekly' | null;
  scheduled_time?: string | null;
  timezone?: string | null;
  max_results_per_board?: number | null;
  
  // AI Configuration
  ai_matching_enabled?: boolean | null;
  minimum_match_score?: number | null;
  
  // Status and Metadata
  is_active?: boolean;
  last_executed_at?: string | null;
  next_execution_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobBoardSource {
  id: string;
  name: string;
  display_name: string;
  website_url: string;
  api_available: boolean;
  is_active: boolean;
  rate_limit_per_hour?: number | null;
  supports_remote_filter: boolean;
  supports_salary_filter: boolean;
  supports_experience_filter: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobSearchResult {
  id: string;
  search_id: string;
  job_board_source_id: string;
  
  // Job Details
  job_title: string;
  company_name: string;
  job_description?: string | null;
  location?: string | null;
  remote_type?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  
  // Source Information
  original_job_id?: string | null;
  job_url: string;
  posted_date?: string | null;
  application_deadline?: string | null;
  
  // AI Analysis
  ai_match_score?: number | null;
  ai_analysis?: any | null; // JSONB
  skill_matches?: string[] | null;
  missing_skills?: string[] | null;
  
  // User Actions
  is_bookmarked?: boolean;
  is_dismissed?: boolean;
  viewed_at?: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface SearchExecutionLog {
  id: string;
  search_id: string;
  execution_type: 'manual' | 'scheduled';
  started_at: string;
  completed_at?: string | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Results Summary
  total_results_found?: number | null;
  results_by_board?: any | null; // JSONB
  
  // Error Information
  error_message?: string | null;
  error_details?: any | null; // JSONB
  
  created_at: string;
}

// Legacy JobSearch interface (maintain compatibility)
export interface JobSearch {
  id: string;
  user_id: string;
  profile_id: string | null;
  name: string; // Changed from 'search_name'
  job_description: string | null;
  exclusions: string | null;
  location: string | null;
  job_type: string | null;
  minimum_salary: number | null;
  preferred_companies: string[];
  avoid_companies: string[];
  avoid_sectors: string[];
  search_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobMatch {
  id: string;
  search_id: string; // Changed from job_search_id, NO user_id
  job_listing_id: string | null;
  job_title: string;
  company_name: string;
  job_url: string;
  job_description: string | null;
  salary_range: string | null;
  location: string | null;
  job_type: string | null;
  remote_option: string | null;
  ai_score: number | null; // Changed from ai_match_score
  ai_reasoning: string | null;
  fit_analysis: any | null; // JSONB
  skills_match: any | null; // JSONB
  preference_alignment: any | null; // JSONB
  red_flags: string[] | null;
  opportunities: string[] | null;
  is_applied: boolean;
  is_saved: boolean;
  is_dismissed: boolean; // Changed from is_hidden
  discovered_at: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 
  | 'draft' 
  | 'applied' 
  | 'screening' 
  | 'phone_interview'
  | 'technical_interview'
  | 'onsite_interview'
  | 'final_interview'
  | 'offer'
  | 'negotiating'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface JobApplication {
  id: string;
  user_id: string;
  job_listing_id: string | null; // Changed from job_match_id
  profile_id: string | null;
  task_id: string | null;
  status: ApplicationStatus; // Changed from application_status
  applied_at: string | null; // Changed from application_date
  cv_version_url: string | null;
  cover_letter_url: string | null;
  video_pitch_url: string | null;
  notes: string | null;
  follow_up_date: string | null; // Singular, not plural
  created_at: string;
  updated_at: string;
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
