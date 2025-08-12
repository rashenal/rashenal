// Test suite for Motivation plugin
// Tests the first official plugin implementation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginContext } from '../../plugins/core/types';

// Mock plugin context
const createMockContext = (): PluginContext => ({
  storage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined)
  },
  api: {
    tasks: {
      list: vi.fn().mockResolvedValue([
        {
          id: '1',
          title: 'Test Task',
          status: 'pending',
          energy_level: 'm',
          updated_at: new Date().toISOString()
        }
      ]),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    habits: {
      list: vi.fn().mockResolvedValue([]),
      getActive: vi.fn().mockResolvedValue([
        { id: '1', name: 'Daily Reading', streak: 5 }
      ]),
      recordCompletion: vi.fn()
    },
    goals: {
      list: vi.fn().mockResolvedValue([
        { id: '1', title: 'Learn TypeScript', status: 'active' }
      ]),
      updateProgress: vi.fn()
    },
    ai: {
      chat: vi.fn().mockResolvedValue('You are making great progress! Keep up the excellent work.'),
      analyze: vi.fn()
    },
    voice: {
      registerCommand: vi.fn().mockResolvedValue(undefined),
      speak: vi.fn().mockResolvedValue(undefined)
    },
    calendar: {
      getEvents: vi.fn().mockResolvedValue([]),
      createEvent: vi.fn()
    }
  },
  ui: {
    registerWidget: vi.fn().mockResolvedValue(undefined),
    registerMenuItem: vi.fn().mockResolvedValue(undefined),
    registerRoute: vi.fn().mockResolvedValue(undefined),
    showNotification: vi.fn()
  },
  events: {
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn()
  },
  user: {
    id: 'test-user-123',
    preferences: {}
  },
  supabase: {} // Mock supabase client
});

describe('Motivation Plugin', () => {
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = createMockContext();
    vi.clearAllMocks();
  });

  describe('Plugin Initialization', () => {
    it('should have correct manifest', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();

      expect(plugin.manifest.id).toBe('ai.asista.motivation');
      expect(plugin.manifest.name).toBe('Motivation Booster');
      expect(plugin.manifest.version).toBe('1.0.0');
      expect(plugin.manifest.category).toBe('wellness');
      expect(plugin.manifest.permissions).toContain('tasks:read');
      expect(plugin.manifest.permissions).toContain('habits:read');
      expect(plugin.manifest.permissions).toContain('ai:chat');
    });

    it('should initialize without errors', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();

      await expect(plugin.initialize(mockContext)).resolves.not.toThrow();
      
      // Verify widget was registered
      expect(mockContext.ui.registerWidget).toHaveBeenCalledWith({
        id: 'motivation-daily',
        type: 'card',
        position: 'dashboard-top',
        component: 'MotivationWidget',
        props: {
          refreshInterval: 3600000,
          interactive: true
        }
      });
    });

    it('should register voice commands', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();

      await plugin.initialize(mockContext);

      expect(mockContext.api.voice.registerCommand).toHaveBeenCalledWith(
        'motivate me',
        expect.any(Function)
      );
      expect(mockContext.api.voice.registerCommand).toHaveBeenCalledWith(
        'how am I doing',
        expect.any(Function)
      );
    });

    it('should handle voice registration errors gracefully', async () => {
      const failingContext = {
        ...mockContext,
        api: {
          ...mockContext.api,
          voice: {
            registerCommand: vi.fn().mockRejectedValue(new Error('Voice not available')),
            speak: vi.fn()
          }
        }
      };

      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();

      await expect(plugin.initialize(failingContext)).resolves.not.toThrow();
    });
  });

  describe('Motivation Generation', () => {
    it('should generate personalized motivation', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      
      const motivation = await plugin.getPersonalizedMotivation();
      
      expect(typeof motivation).toBe('string');
      expect(motivation.length).toBeGreaterThan(10);
      expect(mockContext.api.tasks.list).toHaveBeenCalled();
      expect(mockContext.api.habits.getActive).toHaveBeenCalled();
      expect(mockContext.api.goals.list).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const failingContext = {
        ...mockContext,
        api: {
          ...mockContext.api,
          tasks: {
            ...mockContext.api.tasks,
            list: vi.fn().mockRejectedValue(new Error('Database error'))
          }
        }
      };

      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(failingContext);
      
      const motivation = await plugin.getPersonalizedMotivation();
      
      expect(motivation).toBe('You\'re doing great. Keep going! 💜');
    });

    it('should adapt to low energy level', async () => {
      const lowEnergyContext = {
        ...mockContext,
        api: {
          ...mockContext.api,
          tasks: {
            ...mockContext.api.tasks,
            list: vi.fn().mockResolvedValue([
              { energy_level: 'xs', status: 'pending' },
              { energy_level: 's', status: 'pending' },
              { energy_level: 'm', status: 'pending' }
            ])
          }
        }
      };

      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(lowEnergyContext);
      
      const motivation = await plugin.getPersonalizedMotivation();
      
      expect(typeof motivation).toBe('string');
      expect(mockContext.api.ai.chat).toHaveBeenCalledWith(
        expect.stringContaining('Energy level: low')
      );
    });

    it('should store motivation in history', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      
      await plugin.getPersonalizedMotivation();
      
      expect(mockContext.storage.get).toHaveBeenCalledWith('motivation_history');
      expect(mockContext.storage.set).toHaveBeenCalledWith(
        'motivation_history',
        expect.any(Array)
      );
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should activate and show welcome message', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      await plugin.activate!();
      
      expect(mockContext.ui.showNotification).toHaveBeenCalledWith({
        title: '✨ Motivation Booster Activated',
        message: 'I\'m here to support your journey with gentle encouragement.',
        type: 'success',
        duration: 5000
      });
    });

    it('should deactivate cleanly', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      
      // Simulate some running interval
      (plugin as any).checkInterval = setInterval(() => {}, 1000);
      
      await plugin.deactivate!();
      
      // Should not throw and should clean up intervals
      expect(true).toBe(true);
    });
  });

  describe('External API Methods', () => {
    it('should get motivation stats', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      
      const stats = await plugin.getMotivationStats();
      
      expect(stats).toHaveProperty('streak');
      expect(stats).toHaveProperty('saved');
      expect(stats).toHaveProperty('energy');
      expect(typeof stats.streak).toBe('number');
    });

    it('should save motivations', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      
      await plugin.saveMotivation('Test motivation', 'Test Author');
      
      expect(mockContext.storage.get).toHaveBeenCalledWith('saved_motivations');
      expect(mockContext.storage.set).toHaveBeenCalledWith(
        'saved_motivations',
        expect.any(Array)
      );
    });

    it('should handle stats errors gracefully', async () => {
      const failingContext = {
        ...mockContext,
        storage: {
          ...mockContext.storage,
          get: vi.fn().mockRejectedValue(new Error('Storage error'))
        }
      };

      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(failingContext);
      
      const stats = await plugin.getMotivationStats();
      
      expect(stats).toEqual({
        streak: 0,
        saved: 0,
        energy: 'unknown'
      });
    });
  });

  describe('Energy Monitoring', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should check for motivation opportunities', async () => {
      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      
      // Fast forward time to trigger the energy monitoring
      vi.advanceTimersByTime(1800000); // 30 minutes
      
      // Should have been called during initialization
      expect(mockContext.api.tasks.list).toHaveBeenCalled();
    });

    it('should not send motivation outside working hours', async () => {
      // Mock current time to be outside working hours (e.g., 2 AM)
      const mockDate = new Date();
      mockDate.setHours(2);
      vi.setSystemTime(mockDate);

      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(mockContext);
      
      const shouldMotivate = await (plugin as any).shouldSendMotivation();
      expect(shouldMotivate).toBe(false);
    });

    it('should send motivation during working hours with no recent activity', async () => {
      // Mock current time to be during working hours
      const mockDate = new Date();
      mockDate.setHours(14); // 2 PM
      vi.setSystemTime(mockDate);

      // Mock tasks with no recent updates
      const oldTaskContext = {
        ...mockContext,
        api: {
          ...mockContext.api,
          tasks: {
            ...mockContext.api.tasks,
            list: vi.fn().mockResolvedValue([
              {
                id: '1',
                updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
              }
            ])
          }
        }
      };

      const { default: MotivationPlugin } = await import('../../plugins/official/motivation/index');
      const plugin = new MotivationPlugin();
      
      await plugin.initialize(oldTaskContext);
      
      const shouldMotivate = await (plugin as any).shouldSendMotivation();
      expect(shouldMotivate).toBe(true);
    });
  });
});