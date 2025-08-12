# Plugin System Implementation Specification
**Version:** 1.0.0  
**Date:** August 2025  
**Branch:** `feat/plugin-system`  
**Author:** Rashenal/Asista.AI Team  
**Location:** `C:\Users\rharv\Documents\rashenal\docs\specs\plugin-system-implementation.md`

---

## 🎯 Implementation Overview

This specification provides complete instructions for implementing the Asista.AI plugin system into the existing Rashenal platform. The system will integrate with existing features including Voice Integration, Calendar, Task Management, and AI Coaching.

**Estimated Time:** 2-3 hours  
**Complexity:** Medium  
**Dependencies:** Existing Supabase, React Router, Claude API integration

---

## 📁 File Structure Requirements

Create the following directory structure:

```
C:\Users\rharv\Documents\rashenal\
├── src/
│   ├── plugins/
│   │   ├── core/
│   │   │   ├── PluginSystem.ts
│   │   │   ├── PluginRegistry.ts
│   │   │   ├── PluginSandbox.ts
│   │   │   ├── PluginAPI.ts
│   │   │   └── types.ts
│   │   ├── official/
│   │   │   ├── motivation/
│   │   │   │   ├── index.ts
│   │   │   │   ├── manifest.json
│   │   │   │   └── components/
│   │   │   │       └── MotivationWidget.tsx
│   │   │   └── README.md
│   │   └── marketplace/
│   │       ├── PluginStore.tsx
│   │       └── PluginInstaller.tsx
│   ├── components/
│   │   └── plugins/
│   │       ├── PluginContainer.tsx
│   │       └── PluginWidgetArea.tsx
│   └── tests/
│       └── plugins/
│           ├── plugin-system.test.ts
│           └── motivation-plugin.test.ts
├── supabase/
│   └── migrations/
│       └── 20250812_plugin_system.sql
└── docs/
    └── specs/
        └── plugin-system-implementation.md (this file)
```

---

## 🔧 Step 1: Database Schema Setup

### Create Migration File
**File:** `supabase/migrations/20250812_plugin_system.sql`

```sql
-- Plugin System Tables
-- Run this migration first before any code implementation

-- Plugin installations tracking
CREATE TABLE IF NOT EXISTS plugin_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  plugin_name TEXT NOT NULL,
  plugin_version TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plugin_id)
);

-- Plugin data storage (sandboxed)
CREATE TABLE IF NOT EXISTS plugin_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plugin_id, key)
);

-- Plugin marketplace metadata
CREATE TABLE IF NOT EXISTS plugin_marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category TEXT,
  tags TEXT[],
  version TEXT,
  min_platform_version TEXT,
  pricing_model TEXT DEFAULT 'free', -- 'free', 'paid', 'freemium'
  price_monthly DECIMAL(10,2),
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE plugin_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_marketplace ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own plugin installations"
  ON plugin_installations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own plugin storage"
  ON plugin_storage FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view marketplace"
  ON plugin_marketplace FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX idx_plugin_installations_user_id ON plugin_installations(user_id);
CREATE INDEX idx_plugin_storage_user_plugin ON plugin_storage(user_id, plugin_id);
CREATE INDEX idx_plugin_marketplace_category ON plugin_marketplace(category);

-- Run migration
```

**Execute:** `npx supabase db push`

---

## 🔧 Step 2: Core Plugin System Implementation

### 2.1 Plugin Types Definition
**File:** `src/plugins/core/types.ts`

```typescript
// Core type definitions for the plugin system
// These types integrate with existing Rashenal types

import type { Database } from '@/types/database';
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

export interface Plugin {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  activate?(): Promise<void>;
  deactivate?(): Promise<void>;
  uninstall?(): Promise<void>;
}
```

### 2.2 Plugin Registry Implementation
**File:** `src/plugins/core/PluginRegistry.ts`

```typescript
// Main plugin registry that manages all plugins
// Integrates with existing Rashenal services

import { PluginManifest, Plugin, PluginContext } from './types';
import { PluginSandbox } from './PluginSandbox';
import { PluginAPI } from './PluginAPI';

export class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private sandboxes = new Map<string, PluginSandbox>();
  private supabase: any;
  private userId: string;
  
  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }
  
  async loadPlugin(manifest: PluginManifest): Promise<boolean> {
    try {
      console.log(`Loading plugin: ${manifest.name} v${manifest.version}`);
      
      // Check if user has permission to load this plugin
      const { data: installation } = await this.supabase
        .from('plugin_installations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('plugin_id', manifest.id)
        .single();
      
      if (!installation?.enabled) {
        console.log(`Plugin ${manifest.id} is not enabled for user`);
        return false;
      }
      
      // Verify permissions are granted
      const grantedPermissions = installation.permissions || [];
      const hasAllPermissions = manifest.permissions.every(p => 
        grantedPermissions.includes(p)
      );
      
      if (!hasAllPermissions) {
        console.error(`Plugin ${manifest.id} missing required permissions`);
        return false;
      }
      
      // Create sandbox for plugin
      const sandbox = new PluginSandbox(manifest.id, manifest.permissions);
      this.sandboxes.set(manifest.id, sandbox);
      
      // Create plugin context
      const context = this.createContext(manifest, installation.settings);
      
      // Dynamically import and initialize plugin
      const module = await import(manifest.entry);
      const PluginClass = module.default;
      const plugin = new PluginClass();
      plugin.manifest = manifest;
      
      // Initialize in sandbox
      await sandbox.execute(async () => {
        await plugin.initialize(context);
        if (plugin.activate) {
          await plugin.activate();
        }
      });
      
      this.plugins.set(manifest.id, plugin);
      
      // Track successful load
      await this.supabase
        .from('plugin_installations')
        .update({ 
          last_loaded: new Date().toISOString(),
          load_count: installation.load_count + 1 
        })
        .eq('id', installation.id);
      
      console.log(`✅ Successfully loaded plugin: ${manifest.name}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to load plugin ${manifest.id}:`, error);
      return false;
    }
  }
  
  private createContext(manifest: PluginManifest, settings: any): PluginContext {
    return {
      storage: this.createStorage(manifest.id),
      api: new PluginAPI(this.supabase, manifest.permissions),
      ui: this.createUI(manifest.id),
      events: this.createEvents(manifest.id),
      user: this.createUserContext(),
      supabase: this.createRestrictedSupabase(manifest.permissions)
    };
  }
  
  private createStorage(pluginId: string) {
    // Implementation connects to plugin_storage table
    return {
      get: async (key: string) => {
        const { data } = await this.supabase
          .from('plugin_storage')
          .select('value')
          .eq('user_id', this.userId)
          .eq('plugin_id', pluginId)
          .eq('key', key)
          .single();
        return data?.value;
      },
      set: async (key: string, value: any) => {
        await this.supabase
          .from('plugin_storage')
          .upsert({
            user_id: this.userId,
            plugin_id: pluginId,
            key,
            value,
            updated_at: new Date().toISOString()
          });
      },
      delete: async (key: string) => {
        await this.supabase
          .from('plugin_storage')
          .delete()
          .eq('user_id', this.userId)
          .eq('plugin_id', pluginId)
          .eq('key', key);
      },
      list: async () => {
        const { data } = await this.supabase
          .from('plugin_storage')
          .select('key')
          .eq('user_id', this.userId)
          .eq('plugin_id', pluginId);
        return data?.map(d => d.key) || [];
      },
      clear: async () => {
        await this.supabase
          .from('plugin_storage')
          .delete()
          .eq('user_id', this.userId)
          .eq('plugin_id', pluginId);
      }
    };
  }
  
  // Additional methods for UI, events, etc.
  private createUI(pluginId: string) {
    // This will be implemented to connect with existing UI system
    return {
      registerWidget: async (widget: any) => {
        // Store widget configuration
        console.log(`Registering widget for ${pluginId}:`, widget);
      },
      registerMenuItem: async (item: any) => {
        // Add to navigation
        console.log(`Registering menu item for ${pluginId}:`, item);
      },
      registerRoute: async (route: any) => {
        // Add to router
        console.log(`Registering route for ${pluginId}:`, route);
      },
      showNotification: (notification: any) => {
        // Use existing notification system
        console.log(`Notification from ${pluginId}:`, notification);
      }
    };
  }
  
  private createEvents(pluginId: string) {
    // Event system for plugin communication
    return {
      on: (event: string, handler: Function) => {
        // Subscribe to events
      },
      emit: (event: string, data: any) => {
        // Emit events
      },
      off: (event: string, handler: Function) => {
        // Unsubscribe
      }
    };
  }
  
  private createUserContext() {
    // Provide user context to plugins
    return {
      id: this.userId,
      // Additional user context from existing system
    };
  }
  
  private createRestrictedSupabase(permissions: string[]) {
    // Create restricted Supabase client based on permissions
    // This prevents plugins from accessing unauthorized data
    return this.supabase; // TODO: Implement restrictions
  }
  
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin?.deactivate) {
      await plugin.deactivate();
    }
    this.plugins.delete(pluginId);
    this.sandboxes.delete(pluginId);
  }
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}
```

---

## 🔧 Step 3: First Plugin Implementation (Motivation)

### 3.1 Motivation Plugin Core
**File:** `src/plugins/official/motivation/index.ts`

```typescript
// Motivation Plugin - First official Asista.AI plugin
// Demonstrates integration with existing Rashenal features

import { Plugin, PluginContext, PluginManifest } from '@/plugins/core/types';

export default class MotivationPlugin implements Plugin {
  manifest: PluginManifest = {
    id: 'ai.asista.motivation',
    name: 'Motivation Booster',
    version: '1.0.0',
    description: 'AI-powered motivational support that adapts to your energy and goals',
    author: {
      name: 'Asista.AI',
      email: 'plugins@asista.ai',
      website: 'https://asista.ai'
    },
    category: 'wellness',
    tags: ['motivation', 'wellness', 'ai', 'energy-aware'],
    permissions: [
      'tasks:read',
      'habits:read', 
      'goals:read',
      'ai:chat',
      'notifications:send'
    ],
    entry: '@/plugins/official/motivation/index.ts'
  };
  
  private context!: PluginContext;
  private checkInterval?: NodeJS.Timeout;
  
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    
    // Set up dashboard widget
    await this.registerWidget();
    
    // Set up voice commands if voice system is available
    await this.registerVoiceCommands();
    
    // Start energy monitoring
    await this.startEnergyMonitoring();
    
    console.log('Motivation Plugin initialized');
  }
  
  async activate(): Promise<void> {
    // Called when plugin is activated
    await this.sendWelcomeMessage();
  }
  
  async deactivate(): Promise<void> {
    // Clean up when plugin is deactivated
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
  
  private async registerWidget(): Promise<void> {
    await this.context.ui.registerWidget({
      id: 'motivation-daily',
      type: 'card',
      position: 'dashboard-top',
      component: 'MotivationWidget',
      props: {
        refreshInterval: 3600000, // 1 hour
        interactive: true
      }
    });
  }
  
  private async registerVoiceCommands(): Promise<void> {
    // Connect to existing voice system
    await this.context.api.voice.registerCommand(
      'motivate me',
      async () => {
        const motivation = await this.getPersonalizedMotivation();
        await this.context.api.voice.speak(motivation);
        return motivation;
      }
    );
    
    await this.context.api.voice.registerCommand(
      'how am I doing',
      async () => {
        const progress = await this.getProgressSummary();
        await this.context.api.voice.speak(progress);
        return progress;
      }
    );
  }
  
  private async startEnergyMonitoring(): Promise<void> {
    // Check energy levels periodically
    this.checkInterval = setInterval(async () => {
      const shouldMotivate = await this.shouldSendMotivation();
      if (shouldMotivate) {
        const motivation = await this.getPersonalizedMotivation();
        this.context.ui.showNotification({
          title: '💜 Gentle Reminder',
          message: motivation,
          type: 'info',
          duration: 10000
        });
      }
    }, 1800000); // Check every 30 minutes
  }
  
  private async shouldSendMotivation(): Promise<boolean> {
    // Check user's recent activity
    const tasks = await this.context.api.tasks.list();
    const recentTasks = tasks.filter(t => {
      const updated = new Date(t.updated_at);
      const hoursSince = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
      return hoursSince < 2;
    });
    
    // If no recent activity and it's working hours, send motivation
    const hour = new Date().getHours();
    const isWorkingHours = hour >= 9 && hour <= 17;
    
    return recentTasks.length === 0 && isWorkingHours;
  }
  
  async getPersonalizedMotivation(): Promise<string> {
    // Get user context
    const [tasks, habits, goals] = await Promise.all([
      this.context.api.tasks.list(),
      this.context.api.habits.getActive(),
      this.context.api.goals.list()
    ]);
    
    // Determine energy level from task patterns
    const lowEnergyTasks = tasks.filter(t => 
      t.energy_level === 'XS' || t.energy_level === 'S'
    ).length;
    const totalTasks = tasks.length;
    const energyLevel = lowEnergyTasks > totalTasks / 2 ? 'low' : 'normal';
    
    // Build context for AI
    const context = {
      activeGoals: goals.filter(g => g.status === 'active').map(g => g.title),
      currentHabits: habits.map(h => h.name),
      energyLevel,
      taskCount: tasks.filter(t => t.status !== 'done').length
    };
    
    // Get AI-generated motivation
    const prompt = `Generate a brief, warm, encouraging motivation message for someone with:
    - Energy level: ${context.energyLevel}
    - Active goals: ${context.activeGoals.join(', ') || 'none set'}
    - Pending tasks: ${context.taskCount}
    
    Keep it under 2 sentences. Be genuine, not overly positive. 
    If energy is low, validate rest. Focus on progress, not perfection.`;
    
    const motivation = await this.context.api.ai.chat(prompt);
    
    // Store in history
    const history = await this.context.storage.get('motivation_history') || [];
    history.push({
      text: motivation,
      timestamp: Date.now(),
      context
    });
    await this.context.storage.set('motivation_history', history.slice(-50));
    
    return motivation;
  }
  
  private async getProgressSummary(): Promise<string> {
    const [tasks, habits] = await Promise.all([
      this.context.api.tasks.list(),
      this.context.api.habits.getActive()
    ]);
    
    const completedToday = tasks.filter(t => {
      const completed = t.status === 'done' && t.completed_at;
      if (!completed) return false;
      const today = new Date().toDateString();
      return new Date(t.completed_at).toDateString() === today;
    }).length;
    
    return `You've completed ${completedToday} tasks today. ${
      completedToday > 0 
        ? "That's wonderful progress!" 
        : "It's okay to start small. You're exactly where you need to be."
    }`;
  }
  
  private async sendWelcomeMessage(): Promise<void> {
    this.context.ui.showNotification({
      title: '✨ Motivation Booster Activated',
      message: "I'm here to support your journey with gentle encouragement.",
      type: 'success',
      duration: 5000
    });
  }
}
```

### 3.2 Motivation Widget Component
**File:** `src/plugins/official/motivation/components/MotivationWidget.tsx`

```typescript
// Widget component for the Motivation plugin
// Integrates with existing Rashenal UI components

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Heart, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MotivationWidgetProps {
  pluginId: string;
  refreshInterval?: number;
  interactive?: boolean;
}

export function MotivationWidget({ 
  pluginId = 'ai.asista.motivation',
  refreshInterval = 3600000,
  interactive = true 
}: MotivationWidgetProps) {
  const [motivation, setMotivation] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const fetchMotivation = async () => {
    setLoading(true);
    try {
      // Call plugin API endpoint
      const response = await supabase.functions.invoke('plugin-api', {
        body: {
          plugin_id: pluginId,
          method: 'getPersonalizedMotivation'
        }
      });
      
      if (response.data) {
        setMotivation(response.data.text);
        setAuthor(response.data.author || 'Asista');
        setSaved(false);
      }
    } catch (error) {
      console.error('Error fetching motivation:', error);
      setMotivation("You're doing great. Keep going! 💜");
      setAuthor('Asista');
    } finally {
      setLoading(false);
    }
  };
  
  const saveMotivation = async () => {
    try {
      await supabase.functions.invoke('plugin-api', {
        body: {
          plugin_id: pluginId,
          method: 'saveMotivation',
          params: { text: motivation, author }
        }
      });
      setSaved(true);
    } catch (error) {
      console.error('Error saving motivation:', error);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await supabase.functions.invoke('plugin-api', {
        body: {
          plugin_id: pluginId,
          method: 'getMotivationStats'
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  useEffect(() => {
    fetchMotivation();
    fetchStats();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMotivation, refreshInterval);
      return () => clearInterval(interval);
    }
  }, []);
  
  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 
                     dark:from-purple-900/20 dark:to-pink-900/20 
                     border-purple-200 dark:border-purple-800">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Daily Motivation
            </h3>
          </div>
          
          {interactive && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMotivation}
                disabled={loading}
                className="hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveMotivation}
                className="hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          )}
        </div>
        
        {/* Quote */}
        <blockquote className="text-lg font-medium text-gray-800 dark:text-gray-200 
                             leading-relaxed">
          "{motivation || 'Loading your personalized motivation...'}"
        </blockquote>
        
        {/* Author */}
        {author && (
          <cite className="block text-sm text-gray-600 dark:text-gray-400 not-italic">
            — {author}
          </cite>
        )}
        
        {/* Stats */}
        {stats && (
          <div className="pt-3 mt-3 border-t border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{stats.streak} day streak</span>
              </div>
              <div>
                <span>{stats.saved} saved</span>
              </div>
              <div>
                <span>{stats.energy} energy</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Energy-aware message */}
        <div className="text-xs text-gray-600 dark:text-gray-400 italic">
          Personalized for your current energy and goals
        </div>
      </div>
    </Card>
  );
}
```

---

## 🔧 Step 4: Integration with Main Application

### 4.1 Update Dashboard
**File:** `src/components/MyRashenalDashboard.tsx`

```typescript
// ADD these imports at the top of the file
import { PluginRegistry } from '@/plugins/core/PluginRegistry';
import { MotivationWidget } from '@/plugins/official/motivation/components/MotivationWidget';

// ADD this to the component's state (around line 50-60)
const [pluginRegistry, setPluginRegistry] = useState<PluginRegistry | null>(null);
const [pluginWidgets, setPluginWidgets] = useState<any[]>([]);

// ADD this useEffect after the existing useEffects (around line 100-120)
useEffect(() => {
  const initializePlugins = async () => {
    if (!user?.id) return;
    
    try {
      // Initialize plugin registry
      const registry = new PluginRegistry(supabase, user.id);
      
      // Load installed plugins
      const { data: installations } = await supabase
        .from('plugin_installations')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true);
      
      if (installations) {
        for (const installation of installations) {
          // For now, hardcode motivation plugin
          if (installation.plugin_id === 'ai.asista.motivation') {
            const motivationManifest = {
              id: 'ai.asista.motivation',
              name: 'Motivation Booster',
              version: '1.0.0',
              description: 'AI-powered motivational support',
              author: { name: 'Asista.AI' },
              category: 'wellness' as const,
              tags: ['motivation', 'wellness'],
              permissions: ['tasks:read', 'habits:read', 'ai:chat'] as any[],
              entry: '@/plugins/official/motivation/index.ts'
            };
            
            await registry.loadPlugin(motivationManifest);
            
            // Add widget to dashboard
            setPluginWidgets(prev => [...prev, {
              id: 'motivation-widget',
              component: MotivationWidget,
              props: { pluginId: 'ai.asista.motivation' }
            }]);
          }
        }
      }
      
      setPluginRegistry(registry);
    } catch (error) {
      console.error('Error initializing plugins:', error);
    }
  };
  
  initializePlugins();
}, [user, supabase]);

// ADD this in the render section, after the main dashboard content (around line 400)
{/* Plugin Widgets Area */}
{pluginWidgets.length > 0 && (
  <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {pluginWidgets.map(widget => {
      const Component = widget.component;
      return (
        <Component key={widget.id} {...widget.props} />
      );
    })}
  </div>
)}
```

### 4.2 Add Plugin Management Page
**File:** `src/pages/Plugins.tsx`

```typescript
// New page for plugin management
// This connects to the marketplace and allows installation

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Download, Settings, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function PluginsPage() {
  const { user } = useAuth();
  const [marketplace, setMarketplace] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchMarketplace();
    fetchInstalled();
  }, []);
  
  const fetchMarketplace = async () => {
    const { data } = await supabase
      .from('plugin_marketplace')
      .select('*')
      .order('featured', { ascending: false });
    setMarketplace(data || []);
  };
  
  const fetchInstalled = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('plugin_installations')
      .select('plugin_id')
      .eq('user_id', user.id);
    setInstalled(new Set(data?.map(d => d.plugin_id) || []));
  };
  
  const installPlugin = async (plugin: any) => {
    if (!user?.id) return;
    setLoading(true);
    
    try {
      await supabase
        .from('plugin_installations')
        .insert({
          user_id: user.id,
          plugin_id: plugin.plugin_id,
          plugin_name: plugin.name,
          plugin_version: plugin.version,
          permissions: plugin.default_permissions || [],
          enabled: true
        });
      
      setInstalled(prev => new Set([...prev, plugin.plugin_id]));
    } catch (error) {
      console.error('Error installing plugin:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plugin Marketplace</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Extend Rashenal with powerful plugins
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {marketplace.map(plugin => (
          <Card key={plugin.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">{plugin.name}</h3>
                  <p className="text-sm text-gray-600">v{plugin.version}</p>
                </div>
              </div>
              {plugin.featured && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                  Featured
                </span>
              )}
            </div>
            
            <p className="text-sm mb-4">{plugin.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {plugin.tags?.map((tag: string) => (
                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 rounded">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {plugin.downloads || 0} downloads
              </span>
              
              {installed.has(plugin.plugin_id) ? (
                <Button variant="outline" size="sm" disabled>
                  <Check className="h-4 w-4 mr-2" />
                  Installed
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => installPlugin(plugin)}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 4.3 Update Router
**File:** `src/App.tsx`

```typescript
// ADD import at the top
import { PluginsPage } from '@/pages/Plugins';

// ADD route in the Routes section (around line 150)
<Route path="/plugins" element={<PluginsPage />} />
```

---

## 🔧 Step 5: Testing Implementation

### 5.1 Plugin System Test
**File:** `src/tests/plugins/plugin-system.test.ts`

```typescript
// Test suite for plugin system
// Run with: npm run test:plugins

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginRegistry } from '@/plugins/core/PluginRegistry';
import { createClient } from '@supabase/supabase-js';

describe('Plugin System', () => {
  let registry: PluginRegistry;
  let supabase: any;
  const userId = 'test-user-123';
  
  beforeEach(() => {
    // Mock Supabase client
    supabase = {
      from: (table: string) => ({
        select: () => ({ 
          eq: () => ({ 
            single: () => Promise.resolve({ 
              data: { enabled: true, permissions: ['tasks:read'] } 
            }) 
          }) 
        }),
        insert: () => Promise.resolve({ data: {}, error: null }),
        upsert: () => Promise.resolve({ data: {}, error: null })
      }),
      functions: {
        invoke: () => Promise.resolve({ data: { message: 'Test motivation' } })
      }
    };
    
    registry = new PluginRegistry(supabase, userId);
  });
  
  describe('Plugin Loading', () => {
    it('should load a valid plugin', async () => {
      const manifest = {
        id: 'test.plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: { name: 'Test' },
        category: 'wellness' as const,
        tags: [],
        permissions: ['tasks:read'] as any[],
        entry: '@/plugins/test/index.ts'
      };
      
      const result = await registry.loadPlugin(manifest);
      expect(result).toBe(true);
    });
    
    it('should reject plugin without permissions', async () => {
      // Mock no permissions granted
      supabase.from = () => ({
        select: () => ({ 
          eq: () => ({ 
            single: () => Promise.resolve({ 
              data: { enabled: true, permissions: [] } 
            }) 
          }) 
        })
      });
      
      const manifest = {
        id: 'test.plugin',
        name: 'Test Plugin', 
        version: '1.0.0',
        description: 'Test',
        author: { name: 'Test' },
        category: 'wellness' as const,
        tags: [],
        permissions: ['tasks:write'] as any[],
        entry: '@/plugins/test/index.ts'
      };
      
      const result = await registry.loadPlugin(manifest);
      expect(result).toBe(false);
    });
  });
  
  describe('Plugin Storage', () => {
    it('should store and retrieve data', async () => {
      // Test storage implementation
      const storage = registry['createStorage']('test.plugin');
      
      await storage.set('test-key', { value: 'test-data' });
      const data = await storage.get('test-key');
      
      expect(data).toEqual({ value: 'test-data' });
    });
  });
});
```

### 5.2 Test Dashboard Integration
**File:** `src/tests/plugins/dashboard-integration.test.tsx`

```typescript
// Test plugin integration with dashboard
// Ensures plugins appear correctly in UI

import { render, screen, waitFor } from '@testing-library/react';
import { MyRashenalDashboard } from '@/components/MyRashenalDashboard';
import { vi } from 'vitest';

describe('Dashboard Plugin Integration', () => {
  it('should display plugin widgets when installed', async () => {
    // Mock plugin installation
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{
              plugin_id: 'ai.asista.motivation',
              enabled: true
            }]
          })
        })
      })
    };
    
    render(<MyRashenalDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Daily Motivation')).toBeInTheDocument();
    });
  });
});
```

---

## 🔧 Step 6: Edge Function for Plugin API

### 6.1 Plugin API Edge Function
**File:** `supabase/functions/plugin-api/index.ts`

```typescript
// Edge function to handle plugin API calls
// Deploy with: npx supabase functions deploy plugin-api

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { plugin_id, method, params } = await req.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Verify plugin is installed for user
    const { data: installation } = await supabaseClient
      .from('plugin_installations')
      .select('*')
      .eq('user_id', user.id)
      .eq('plugin_id', plugin_id)
      .eq('enabled', true)
      .single();
    
    if (!installation) {
      return new Response(
        JSON.stringify({ error: 'Plugin not installed' }),
        { status: 403 }
      );
    }
    
    // Handle plugin methods
    let result;
    switch (method) {
      case 'getPersonalizedMotivation':
        result = await getMotivation(supabaseClient, user.id);
        break;
      case 'saveMotivation':
        result = await saveMotivation(supabaseClient, user.id, params);
        break;
      case 'getMotivationStats':
        result = await getStats(supabaseClient, user.id);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Method not found' }),
          { status: 404 }
        );
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

async function getMotivation(supabase: any, userId: string) {
  // Implementation for getting personalized motivation
  // This would integrate with Claude API
  return {
    text: "You're making progress every day. Trust your journey.",
    author: "Asista"
  };
}

async function saveMotivation(supabase: any, userId: string, params: any) {
  // Save motivation to plugin storage
  await supabase
    .from('plugin_storage')
    .upsert({
      user_id: userId,
      plugin_id: 'ai.asista.motivation',
      key: `saved_${Date.now()}`,
      value: params
    });
  
  return { success: true };
}

async function getStats(supabase: any, userId: string) {
  // Get motivation statistics
  return {
    streak: 7,
    saved: 12,
    energy: 'medium'
  };
}
```

---

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Create feature branch: `git checkout -b feat/plugin-system`
- [ ] Ensure all existing tests pass: `npm test`
- [ ] Backup database

### Database Setup
- [ ] Run migration script in Supabase
- [ ] Verify tables created with RLS enabled
- [ ] Add sample marketplace entries

### Core Implementation
- [ ] Create plugin directory structure
- [ ] Implement PluginRegistry
- [ ] Implement PluginSandbox
- [ ] Implement PluginAPI
- [ ] Create type definitions

### First Plugin
- [ ] Implement Motivation plugin
- [ ] Create MotivationWidget component
- [ ] Add manifest.json
- [ ] Test plugin loading

### Integration
- [ ] Update MyRashenalDashboard.tsx
- [ ] Add PluginsPage
- [ ] Update router
- [ ] Deploy edge function

### Testing
- [ ] Run plugin system tests
- [ ] Test dashboard integration
- [ ] Test voice command integration
- [ ] Verify sandbox isolation

### Documentation
- [ ] Update API documentation
- [ ] Create plugin developer guide
- [ ] Add example plugins
- [ ] Update README

### Deployment
- [ ] Merge to main: `git merge feat/plugin-system`
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production

---

## 🧪 Testing Commands

```bash
# Run all plugin tests
npm run test:plugins

# Test specific plugin
npm run test:plugins -- motivation

# Integration tests
npm run test:integration

# Full test suite
npm run test:comprehensive

# Add to test dashboard
# Update src/components/TestDashboard.tsx to include:
# - Plugin loading status
# - Active plugins list
# - Plugin API test buttons
```

---

## 🚀 Post-Implementation

### Next Plugins to Build
1. **Focus Timer** - Pomodoro with energy awareness
2. **Journal** - Reflection prompts
3. **Calendar Sync** - Google Calendar integration
4. **Email Processor** - Gmail to tasks

### Developer Portal
- Create `developers.asista.ai` subdomain
- Plugin submission form
- Revenue sharing documentation
- API reference

### Marketing Launch
- Blog post: "Introducing Asista.AI Plugins"
- Developer outreach program
- Partner plugin development

---

## 📝 Notes for Claude Code

1. **Use existing patterns** - Follow the existing code style in the Rashenal project
2. **Preserve working features** - Don't modify existing working components unless necessary
3. **Test incrementally** - Test each step before moving to the next
4. **Handle errors gracefully** - All plugin operations should fail silently without crashing the app
5. **Document changes** - Update relevant documentation as you implement

## Success Criteria

The implementation is complete when:
1. ✅ Motivation plugin appears on dashboard
2. ✅ Plugin can access task/habit data
3. ✅ Plugin storage works correctly
4. ✅ Voice commands registered successfully
5. ✅ All tests pass
6. ✅ No regression in existing features

---

**End of Specification**

Please implement this step by step, testing after each major section. Start with the database migration, then core system, then the first plugin, and finally integration.

Make extra sure that each feature is working as expected. Think beyond the fix,  any bug  that reaches human qa first is a process failure, and needs to be analysed so that a similar miss does not occur again. 