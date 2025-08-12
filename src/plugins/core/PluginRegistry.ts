// Main plugin registry that manages all plugins
// Integrates with existing Rashenal services

import { PluginManifest, Plugin, PluginContext } from './types';
import { PluginSandbox } from './PluginSandbox';
import { PluginAPIImpl } from './PluginAPI';

export class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private sandboxes = new Map<string, PluginSandbox>();
  private supabase: any;
  private userId: string;
  private eventBus = new Map<string, Function[]>();
  
  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.initializeGlobalVoiceCommands();
  }
  
  private initializeGlobalVoiceCommands() {
    if (typeof window !== 'undefined') {
      (window as any).voiceCommands = new Map();
    }
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
      
      // For built-in plugins, load directly
      let plugin: Plugin;
      if (manifest.id === 'ai.asista.motivation') {
        const { default: MotivationPlugin } = await import('../official/motivation/index');
        plugin = new MotivationPlugin();
      } else {
        // For future plugins, dynamically import
        const module = await import(manifest.entry);
        const PluginClass = module.default;
        plugin = new PluginClass();
      }
      
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
          load_count: (installation.load_count || 0) + 1 
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
      api: new PluginAPIImpl(this.supabase, manifest.permissions),
      ui: this.createUI(manifest.id),
      events: this.createEvents(manifest.id),
      user: this.createUserContext(),
      supabase: this.createRestrictedSupabase(manifest.permissions)
    };
  }
  
  private createStorage(pluginId: string) {
    return {
      get: async (key: string) => {
        const { data } = await this.supabase
          .from('plugin_storage')
          .select('value')
          .eq('user_id', this.userId)
          .eq('plugin_id', pluginId)
          .eq('key', key)
          .single();
        return data?.value || null;
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
  
  private createUI(pluginId: string) {
    return {
      registerWidget: async (widget: any) => {
        console.log(`Registering widget for ${pluginId}:`, widget);
        this.emit('widget:registered', { pluginId, widget });
      },
      registerMenuItem: async (item: any) => {
        console.log(`Registering menu item for ${pluginId}:`, item);
        this.emit('menu:registered', { pluginId, item });
      },
      registerRoute: async (route: any) => {
        console.log(`Registering route for ${pluginId}:`, route);
        this.emit('route:registered', { pluginId, route });
      },
      showNotification: (notification: any) => {
        console.log(`Notification from ${pluginId}:`, notification);
        this.emit('notification:show', { pluginId, notification });
        
        // Try to use existing notification system
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification(notification);
        } else {
          // Fallback to browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        }
      }
    };
  }
  
  private createEvents(pluginId: string) {
    return {
      on: (event: string, handler: Function) => {
        const eventKey = `${pluginId}:${event}`;
        if (!this.eventBus.has(eventKey)) {
          this.eventBus.set(eventKey, []);
        }
        this.eventBus.get(eventKey)!.push(handler);
      },
      emit: (event: string, data: any) => {
        const eventKey = `${pluginId}:${event}`;
        const handlers = this.eventBus.get(eventKey) || [];
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for ${eventKey}:`, error);
          }
        });
      },
      off: (event: string, handler: Function) => {
        const eventKey = `${pluginId}:${event}`;
        const handlers = this.eventBus.get(eventKey) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  private emit(event: string, data: any) {
    const handlers = this.eventBus.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in global event handler for ${event}:`, error);
      }
    });
  }
  
  on(event: string, handler: Function) {
    if (!this.eventBus.has(event)) {
      this.eventBus.set(event, []);
    }
    this.eventBus.get(event)!.push(handler);
  }
  
  private createUserContext() {
    return {
      id: this.userId,
      preferences: {},
    };
  }
  
  private createRestrictedSupabase(permissions: string[]) {
    // Create restricted Supabase client based on permissions
    // For now, return the full client - TODO: Implement restrictions
    return this.supabase;
  }
  
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin?.deactivate) {
      const sandbox = this.sandboxes.get(pluginId);
      if (sandbox) {
        await sandbox.execute(async () => {
          await plugin.deactivate!();
        });
      }
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
  
  async getInstalledPlugins(): Promise<any[]> {
    const { data } = await this.supabase
      .from('plugin_installations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('enabled', true);
    return data || [];
  }
  
  async installPlugin(pluginId: string, permissions: string[] = []): Promise<boolean> {
    try {
      const { data: marketplacePlugin } = await this.supabase
        .from('plugin_marketplace')
        .select('*')
        .eq('plugin_id', pluginId)
        .single();
      
      if (!marketplacePlugin) {
        throw new Error('Plugin not found in marketplace');
      }
      
      await this.supabase
        .from('plugin_installations')
        .insert({
          user_id: this.userId,
          plugin_id: pluginId,
          plugin_name: marketplacePlugin.name,
          plugin_version: marketplacePlugin.version,
          permissions: permissions.length > 0 ? permissions : marketplacePlugin.default_permissions,
          enabled: true
        });
      
      return true;
    } catch (error) {
      console.error('Error installing plugin:', error);
      return false;
    }
  }
}