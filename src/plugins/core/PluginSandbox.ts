// Plugin Sandbox implementation
// Provides isolated execution environment for plugins

import { PluginPermission } from './types';

export class PluginSandbox {
  private pluginId: string;
  private permissions: PluginPermission[];
  private context: any = {};
  private errorHandler?: (error: Error) => void;

  constructor(pluginId: string, permissions: PluginPermission[]) {
    this.pluginId = pluginId;
    this.permissions = permissions;
  }

  setErrorHandler(handler: (error: Error) => void) {
    this.errorHandler = handler;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      // Create sandboxed context
      const originalConsole = console;
      const sandboxedConsole = this.createSandboxedConsole();
      
      // Override global console for this execution
      (global as any).console = sandboxedConsole;
      
      // Execute the function
      const result = await fn();
      
      // Restore original console
      (global as any).console = originalConsole;
      
      return result;
    } catch (error) {
      console.error(`Plugin ${this.pluginId} error:`, error);
      
      if (this.errorHandler) {
        this.errorHandler(error as Error);
      }
      
      throw error;
    }
  }

  private createSandboxedConsole() {
    return {
      log: (...args: any[]) => {
        console.log(`[Plugin:${this.pluginId}]`, ...args);
      },
      warn: (...args: any[]) => {
        console.warn(`[Plugin:${this.pluginId}]`, ...args);
      },
      error: (...args: any[]) => {
        console.error(`[Plugin:${this.pluginId}]`, ...args);
      },
      info: (...args: any[]) => {
        console.info(`[Plugin:${this.pluginId}]`, ...args);
      },
      debug: (...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[Plugin:${this.pluginId}]`, ...args);
        }
      }
    };
  }

  hasPermission(permission: PluginPermission): boolean {
    return this.permissions.includes(permission);
  }

  validateAPICall(requiredPermission: PluginPermission) {
    if (!this.hasPermission(requiredPermission)) {
      throw new Error(`Plugin ${this.pluginId} lacks permission: ${requiredPermission}`);
    }
  }

  // Resource monitoring (basic implementation)
  private resourceUsage = {
    memoryStart: 0,
    startTime: 0,
    apiCalls: 0
  };

  startResourceMonitoring() {
    this.resourceUsage.memoryStart = this.getMemoryUsage();
    this.resourceUsage.startTime = Date.now();
    this.resourceUsage.apiCalls = 0;
  }

  trackAPICall() {
    this.resourceUsage.apiCalls++;
    
    // Basic rate limiting
    const timeElapsed = Date.now() - this.resourceUsage.startTime;
    const callsPerSecond = this.resourceUsage.apiCalls / (timeElapsed / 1000);
    
    if (callsPerSecond > 10) { // Max 10 calls per second
      throw new Error(`Plugin ${this.pluginId} exceeding rate limit`);
    }
  }

  getResourceStats() {
    return {
      memoryUsed: this.getMemoryUsage() - this.resourceUsage.memoryStart,
      executionTime: Date.now() - this.resourceUsage.startTime,
      apiCalls: this.resourceUsage.apiCalls
    };
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0; // Fallback for browser environment
  }

  // Security helpers
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Basic XSS protection
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  // Storage quota management
  private storageQuota = 1024 * 1024; // 1MB default quota

  validateStorageQuota(newDataSize: number) {
    const currentUsage = this.getStorageUsage();
    if (currentUsage + newDataSize > this.storageQuota) {
      throw new Error(`Plugin ${this.pluginId} storage quota exceeded`);
    }
  }

  private getStorageUsage(): number {
    // This would query the actual storage usage from the database
    // For now, return a placeholder
    return 0;
  }
}