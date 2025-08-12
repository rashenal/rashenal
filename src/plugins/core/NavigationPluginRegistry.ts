import React from 'react';
import { LucideIcon } from 'lucide-react';

// Enhanced plugin types for navigation integration
export interface NavigationPlugin {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  section: 'main' | 'settings' | 'admin';
  order?: number;
  requiresAdmin?: boolean;
  badge?: string;
  component?: React.ComponentType;
  voiceCommands?: string[];
}

export interface VoiceCommand {
  trigger: string[];
  action: () => void;
  description: string;
  pluginId: string;
}

class NavigationPluginRegistry {
  private plugins: Map<string, NavigationPlugin> = new Map();
  private voiceCommands: Map<string, VoiceCommand> = new Map();
  private subscribers: ((plugins: NavigationPlugin[]) => void)[] = [];

  // Register a new navigation plugin
  registerPlugin(plugin: NavigationPlugin): void {
    this.plugins.set(plugin.id, plugin);
    this.notifySubscribers();
  }

  // Unregister a plugin
  unregisterPlugin(pluginId: string): void {
    this.plugins.delete(pluginId);
    // Remove associated voice commands
    Array.from(this.voiceCommands.keys()).forEach(key => {
      if (this.voiceCommands.get(key)?.pluginId === pluginId) {
        this.voiceCommands.delete(key);
      }
    });
    this.notifySubscribers();
  }

  // Get all plugins for a specific section
  getPluginsBySection(section: NavigationPlugin['section'], isAdmin: boolean = false): NavigationPlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => {
        if (plugin.section !== section) return false;
        if (plugin.requiresAdmin && !isAdmin) return false;
        return true;
      })
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  // Get all registered plugins
  getAllPlugins(): NavigationPlugin[] {
    return Array.from(this.plugins.values());
  }

  // Register voice commands for a plugin
  registerVoiceCommands(commands: VoiceCommand[]): void {
    commands.forEach(command => {
      command.trigger.forEach(trigger => {
        this.voiceCommands.set(trigger.toLowerCase(), command);
      });
    });
  }

  // Process voice command
  processVoiceCommand(command: string): boolean {
    const lowerCommand = command.toLowerCase();
    const voiceCommand = this.voiceCommands.get(lowerCommand);
    
    if (voiceCommand) {
      voiceCommand.action();
      return true;
    }
    
    // Try partial matches
    for (const [trigger, cmd] of this.voiceCommands.entries()) {
      if (lowerCommand.includes(trigger)) {
        cmd.action();
        return true;
      }
    }
    
    return false;
  }

  // Get all voice commands
  getAllVoiceCommands(): VoiceCommand[] {
    return Array.from(this.voiceCommands.values());
  }

  // Subscribe to plugin changes
  subscribe(callback: (plugins: NavigationPlugin[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    const allPlugins = this.getAllPlugins();
    this.subscribers.forEach(callback => callback(allPlugins));
  }
}

// Global registry instance
export const navigationPluginRegistry = new NavigationPluginRegistry();

// React hook for using the plugin registry
export function useNavigationPlugins(section?: NavigationPlugin['section'], isAdmin?: boolean) {
  const [plugins, setPlugins] = React.useState<NavigationPlugin[]>([]);

  React.useEffect(() => {
    const updatePlugins = () => {
      if (section) {
        setPlugins(navigationPluginRegistry.getPluginsBySection(section, isAdmin));
      } else {
        setPlugins(navigationPluginRegistry.getAllPlugins());
      }
    };

    updatePlugins();
    return navigationPluginRegistry.subscribe(updatePlugins);
  }, [section, isAdmin]);

  return plugins;
}

// React hook for voice commands
export function useVoiceCommands() {
  const [commands, setCommands] = React.useState<VoiceCommand[]>([]);

  React.useEffect(() => {
    const updateCommands = () => {
      setCommands(navigationPluginRegistry.getAllVoiceCommands());
    };

    updateCommands();
    return navigationPluginRegistry.subscribe(updateCommands);
  }, []);

  const processCommand = (command: string) => {
    return navigationPluginRegistry.processVoiceCommand(command);
  };

  return { commands, processCommand };
}

// Default aisista.ai plugins
export const registerDefaultPlugins = () => {
  // These would be loaded dynamically based on what's available
  // The navigation component will check for these and add them
};