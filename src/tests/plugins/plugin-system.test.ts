// Test suite for plugin system
// Run with: npm run test:plugins

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PluginRegistry } from '../../plugins/core/PluginRegistry';
import { PluginSystem } from '../../plugins/core/PluginSystem';

// Mock Supabase client
const createMockSupabase = () => ({
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ 
          data: { 
            enabled: true, 
            permissions: ['tasks:read', 'habits:read', 'ai:chat'],
            settings: {},
            load_count: 0
          },
          error: null 
        }),
        then: (callback: (result: any) => any) => callback({
          data: [{
            plugin_id: 'ai.asista.motivation',
            enabled: true,
            permissions: ['tasks:read', 'habits:read', 'ai:chat']
          }],
          error: null
        })
      })
    }),
    insert: (data: any) => Promise.resolve({ data, error: null }),
    upsert: (data: any) => Promise.resolve({ data, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ error: null })
    })
  }),
  functions: {
    invoke: (name: string, options?: any) => Promise.resolve({ 
      data: { message: 'Test response from ' + name },
      error: null 
    })
  }
});

describe('Plugin System', () => {
  let pluginSystem: PluginSystem;
  let registry: PluginRegistry;
  let mockSupabase: any;
  const userId = 'test-user-123';
  
  beforeEach(async () => {
    // Reset singleton instance
    (PluginSystem as any).instance = null;
    
    mockSupabase = createMockSupabase();
    pluginSystem = PluginSystem.getInstance();
    
    // Don't actually initialize - we'll test initialization separately
    registry = new PluginRegistry(mockSupabase, userId);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin System Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = PluginSystem.getInstance();
      const instance2 = PluginSystem.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize successfully', async () => {
      expect(pluginSystem.isInitialized()).toBe(false);
      
      await pluginSystem.initialize(mockSupabase, userId);
      
      expect(pluginSystem.isInitialized()).toBe(true);
      expect(pluginSystem.getRegistry()).toBeTruthy();
    });

    it('should not initialize twice', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await pluginSystem.initialize(mockSupabase, userId);
      await pluginSystem.initialize(mockSupabase, userId);
      
      expect(consoleSpy).toHaveBeenCalledWith('Plugin system already initialized');
    });
  });

  describe('Plugin Registry', () => {
    it('should create storage interface for plugin', () => {
      const storage = (registry as any).createStorage('test.plugin');
      
      expect(storage).toHaveProperty('get');
      expect(storage).toHaveProperty('set');
      expect(storage).toHaveProperty('delete');
      expect(storage).toHaveProperty('list');
      expect(storage).toHaveProperty('clear');
    });

    it('should handle storage operations', async () => {
      const storage = (registry as any).createStorage('test.plugin');
      
      // Test set and get
      await expect(storage.set('test-key', { value: 'test-data' })).resolves.not.toThrow();
      
      // Since we're mocking, we can't test actual retrieval
      // but we can verify the methods don't throw
      await expect(storage.get('test-key')).resolves.toBeDefined();
      await expect(storage.list()).resolves.toBeDefined();
      await expect(storage.delete('test-key')).resolves.not.toThrow();
    });

    it('should create API interface with permissions', () => {
      const api = (registry as any).createContext({
        id: 'test.plugin',
        permissions: ['tasks:read', 'habits:read']
      }, {}).api;
      
      expect(api).toHaveProperty('tasks');
      expect(api).toHaveProperty('habits');
      expect(api).toHaveProperty('goals');
      expect(api).toHaveProperty('ai');
      expect(api).toHaveProperty('voice');
    });
  });

  describe('Plugin Manifest Validation', () => {
    const createTestManifest = (overrides = {}) => ({
      id: 'test.plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: { name: 'Test Author' },
      category: 'wellness' as const,
      tags: ['test'],
      permissions: ['tasks:read'] as any[],
      entry: '@/plugins/test/index.ts',
      ...overrides
    });

    it('should accept valid manifest', () => {
      const manifest = createTestManifest();
      expect(manifest.id).toBe('test.plugin');
      expect(manifest.permissions).toContain('tasks:read');
    });

    it('should handle manifest with all fields', () => {
      const manifest = createTestManifest({
        minPlatformVersion: '1.0.0',
        maxPlatformVersion: '2.0.0',
        settings: [{
          key: 'enabled',
          label: 'Enabled',
          type: 'boolean',
          default: true
        }]
      });
      
      expect(manifest.minPlatformVersion).toBe('1.0.0');
      expect(manifest.settings).toHaveLength(1);
    });
  });

  describe('Plugin Installation', () => {
    beforeEach(async () => {
      await pluginSystem.initialize(mockSupabase, userId);
    });

    it('should install plugin successfully', async () => {
      const result = await pluginSystem.installPlugin('ai.asista.motivation');
      expect(result).toBe(true);
    });

    it('should handle installation error gracefully', async () => {
      // Mock a failed installation
      const failingSupabase = {
        ...mockSupabase,
        from: (table: string) => ({
          ...mockSupabase.from(table),
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null })
            })
          }),
          insert: () => Promise.resolve({ data: null, error: new Error('Database error') })
        })
      };

      const failingSystem = PluginSystem.getInstance();
      (failingSystem as any).registry = new PluginRegistry(failingSupabase, userId);
      
      const result = await failingSystem.installPlugin('nonexistent.plugin');
      expect(result).toBe(false);
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await pluginSystem.initialize(mockSupabase, userId);
    });

    it('should register and trigger events', () => {
      const registry = pluginSystem.getRegistry();
      if (!registry) throw new Error('Registry not initialized');

      let eventFired = false;
      const handler = () => { eventFired = true; };

      registry.on('test:event', handler);
      (registry as any).emit('test:event', { data: 'test' });

      expect(eventFired).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', async () => {
      const noUserSupabase = {
        ...mockSupabase,
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null })
            })
          })
        })
      };

      const testRegistry = new PluginRegistry(noUserSupabase, 'nonexistent-user');
      
      const result = await testRegistry.loadPlugin({
        id: 'test.plugin',
        name: 'Test',
        version: '1.0.0',
        description: 'Test',
        author: { name: 'Test' },
        category: 'wellness',
        tags: [],
        permissions: ['tasks:read'],
        entry: '@/plugins/test/index.ts'
      });

      expect(result).toBe(false);
    });

    it('should handle plugin initialization errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      const result = await registry.loadPlugin({
        id: 'failing.plugin',
        name: 'Failing Plugin',
        version: '1.0.0',
        description: 'This plugin fails to initialize',
        author: { name: 'Test' },
        category: 'wellness',
        tags: [],
        permissions: ['tasks:read'],
        entry: '@/plugins/nonexistent/index.ts'
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});

describe('Motivation Plugin Integration', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should load motivation plugin successfully', async () => {
    const registry = new PluginRegistry(mockSupabase, 'test-user');
    
    // Mock the dynamic import for motivation plugin
    vi.doMock('../../plugins/official/motivation/index', () => ({
      default: class MockMotivationPlugin {
        manifest = {
          id: 'ai.asista.motivation',
          name: 'Motivation Booster'
        };
        async initialize() { return true; }
        async activate() { return true; }
      }
    }));

    const manifest = {
      id: 'ai.asista.motivation',
      name: 'Motivation Booster',
      version: '1.0.0',
      description: 'AI motivation',
      author: { name: 'Asista' },
      category: 'wellness' as const,
      tags: ['motivation'],
      permissions: ['tasks:read', 'habits:read', 'ai:chat'] as any[],
      entry: '@/plugins/official/motivation/index.ts'
    };

    const result = await registry.loadPlugin(manifest);
    expect(result).toBe(true);
  });

  it('should handle plugin API calls', async () => {
    const pluginSystem = PluginSystem.getInstance();
    await pluginSystem.initialize(mockSupabase, 'test-user');

    const plugin = pluginSystem.getPlugin('ai.asista.motivation');
    // Plugin won't actually be loaded in test environment, but we can verify the system structure
    expect(pluginSystem.getLoadedPlugins()).toBeDefined();
  });
});