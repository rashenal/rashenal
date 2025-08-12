// Core type definitions for the plugin system
// These types integrate with existing Rashenal types

import type { ReactNode } from 'react';

export interface PluginManifest {
  id: string;                    // Unique identifier (e.g., 'ai.asista.motivation')
  name: string;                   // Display name
  version: string;                // Semantic version
  description: string;            // Brief description
  author: {
    name: string;
    email?: string;
    website?: string;
  };
  category: PluginCategory;
  tags: string[];
  permissions: PluginPermission[];
  minPlatformVersion?: string;   // Minimum Rashenal version required
  maxPlatformVersion?: string;   // Maximum compatible version
  entry: string;                  // Entry point file
  settings?: PluginSettingDefinition[];
  hooks?: PluginHooks;
}

export type PluginCategory = 
  | 'wellness'
  | 'productivity' 
  | 'ai'
  | 'integration'
  | 'analytics'
  | 'communication'
  | 'automation';

export type PluginPermission = 
  | 'tasks:read' | 'tasks:write'
  | 'habits:read' | 'habits:write'
  | 'goals:read' | 'goals:write'
  | 'ai:chat' | 'ai:analyze'
  | 'voice:commands' | 'voice:synthesis'
  | 'calendar:read' | 'calendar:write'
  | 'notifications:send'
  | 'storage:unlimited';

export interface PluginContext {
  // Storage API
  storage: PluginStorage;
  
  // Rashenal API access
  api: PluginAPI;
  
  // UI registration
  ui: PluginUI;
  
  // Event system
  events: PluginEvents;
  
  // User context
  user: PluginUserContext;
  
  // Supabase client (restricted)
  supabase: any; // Use existing Supabase client type
}

export interface PluginStorage {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
}

export interface PluginAPI {
  tasks: {
    list(): Promise<any[]>;
    get(id: string): Promise<any>;
    create(task: any): Promise<any>;
    update(id: string, updates: any): Promise<any>;
  };
  habits: {
    list(): Promise<any[]>;
    getActive(): Promise<any[]>;
    recordCompletion(habitId: string, value: number): Promise<void>;
  };
  goals: {
    list(): Promise<any[]>;
    updateProgress(goalId: string, progress: number): Promise<void>;
  };
  ai: {
    chat(message: string, context?: any): Promise<string>;
    analyze(data: any, prompt: string): Promise<any>;
  };
  voice: {
    registerCommand(command: string, handler: Function): Promise<void>;
    speak(text: string, options?: any): Promise<void>;
  };
  calendar: {
    getEvents(start: Date, end: Date): Promise<any[]>;
    createEvent(event: any): Promise<any>;
  };
}

export interface PluginUI {
  registerWidget(widget: WidgetDefinition): Promise<void>;
  registerMenuItem(item: MenuItemDefinition): Promise<void>;
  registerRoute(route: RouteDefinition): Promise<void>;
  showNotification(notification: NotificationOptions): void;
}

export interface PluginEvents {
  on(event: string, handler: Function): void;
  emit(event: string, data: any): void;
  off(event: string, handler: Function): void;
}

export interface PluginUserContext {
  id: string;
  email?: string;
  preferences?: any;
}

export interface Plugin {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  activate?(): Promise<void>;
  deactivate?(): Promise<void>;
  uninstall?(): Promise<void>;
}

export interface WidgetDefinition {
  id: string;
  type: 'card' | 'sidebar' | 'modal';
  position: 'dashboard-top' | 'dashboard-bottom' | 'sidebar';
  component: string;
  props?: any;
}

export interface MenuItemDefinition {
  id: string;
  label: string;
  icon?: string;
  path: string;
  order?: number;
}

export interface RouteDefinition {
  path: string;
  component: ReactNode;
  requireAuth?: boolean;
}

export interface NotificationOptions {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface PluginSettingDefinition {
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'number' | 'select';
  default?: any;
  options?: any[];
  description?: string;
}

export interface PluginHooks {
  onTaskCreate?: string;
  onHabitComplete?: string;
  onGoalUpdate?: string;
}