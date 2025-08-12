// Main Plugin System coordinator
// Provides high-level interface for plugin management

import { PluginRegistry } from './PluginRegistry';
import { PluginManifest } from './types';

export class PluginSystem {
  private static instance: PluginSystem | null = null;
  private registry: PluginRegistry | null = null;
  private initialized = false;
  
  static getInstance(): PluginSystem {
    if (!PluginSystem.instance) {
      PluginSystem.instance = new PluginSystem();
    }
    return PluginSystem.instance;
  }
  
  async initialize(supabase: any, userId: string): Promise<void> {
    if (this.initialized) {
      console.log('Plugin system already initialized');
      return;
    }
    
    console.log('Initializing plugin system...');
    
    this.registry = new PluginRegistry(supabase, userId);
    
    // Load all installed plugins
    await this.loadInstalledPlugins();
    
    this.initialized = true;
    console.log('✅ Plugin system initialized');
  }
  
  private async loadInstalledPlugins(): Promise<void> {
    if (!this.registry) return;
    
    try {
      const installed = await this.registry.getInstalledPlugins();
      
      for (const installation of installed) {
        const manifest = await this.getPluginManifest(installation.plugin_id);
        if (manifest) {
          await this.registry.loadPlugin(manifest);
        }
      }
    } catch (error) {
      console.error('Error loading installed plugins:', error);
    }
  }
  
  private async getPluginManifest(pluginId: string): Promise<PluginManifest | null> {
    // For now, hardcode the motivation plugin manifest
    if (pluginId === 'ai.asista.motivation') {
      return {
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
    }
    
    return null;
  }
  
  getRegistry(): PluginRegistry | null {
    return this.registry;
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  async installPlugin(pluginId: string, permissions?: string[]): Promise<boolean> {
    if (!this.registry) {
      console.error('Plugin system not initialized');
      return false;
    }
    
    const success = await this.registry.installPlugin(pluginId, permissions);
    if (success) {
      // Load the plugin after installation
      const manifest = await this.getPluginManifest(pluginId);
      if (manifest) {
        await this.registry.loadPlugin(manifest);
      }
    }
    
    return success;
  }
  
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    if (!this.registry) {
      console.error('Plugin system not initialized');
      return false;
    }
    
    await this.registry.unloadPlugin(pluginId);
    
    // Remove from database
    // Note: This would need the supabase instance, which we should pass through
    console.log(`Plugin ${pluginId} unloaded`);
    return true;
  }
  
  getLoadedPlugins() {
    return this.registry?.getAllPlugins() || [];
  }
  
  getPlugin(pluginId: string) {
    return this.registry?.getPlugin(pluginId);
  }
  
  // Event system for plugin communication
  onPluginEvent(event: string, handler: Function) {
    if (this.registry) {
      this.registry.on(event, handler);
    }
  }
  
  // Widget registration
  getRegisteredWidgets(): any[] {
    // This would return all registered widgets from all plugins
    // For now, return empty array - will be populated by plugins
    return [];
  }
  
  // Cleanup
  async shutdown(): Promise<void> {
    if (!this.registry) return;
    
    const plugins = this.registry.getAllPlugins();
    for (const plugin of plugins) {
      await this.registry.unloadPlugin(plugin.manifest.id);
    }
    
    this.registry = null;
    this.initialized = false;
    PluginSystem.instance = null;
  }
}