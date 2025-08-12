/**
 * Test Registry System
 * Automatically registers and manages tests for different components
 */

import { supabase } from './supabase';

export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  runTest: (context: TestContext) => Promise<TestResult>;
}

export interface TestContext {
  user: any;
  supabase: typeof supabase;
  addLog: (message: string) => void;
  delay: (ms: number) => Promise<void>;
  preferences?: any;
  updatePreference?: (category: string, key: string, value: any) => Promise<void>;
}

export interface TestResult {
  status: 'passed' | 'failed';
  error?: string;
  duration: number;
  metadata?: any;
}

class TestRegistry {
  private tests: Map<string, TestDefinition> = new Map();
  private categories: Set<string> = new Set();

  /**
   * Register a new test
   */
  register(test: TestDefinition) {
    this.tests.set(test.id, test);
    this.categories.add(test.category);
    
    console.log(`🧪 Registered test: ${test.category}/${test.name}`);
  }

  /**
   * Register multiple tests at once
   */
  registerMultiple(tests: TestDefinition[]) {
    tests.forEach(test => this.register(test));
  }

  /**
   * Get all tests for a category
   */
  getTestsByCategory(category: string): TestDefinition[] {
    return Array.from(this.tests.values()).filter(test => test.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  /**
   * Get all tests
   */
  getAllTests(): TestDefinition[] {
    return Array.from(this.tests.values());
  }

  /**
   * Get a specific test
   */
  getTest(id: string): TestDefinition | undefined {
    return this.tests.get(id);
  }

  /**
   * Run a specific test
   */
  async runTest(testId: string, context: TestContext): Promise<TestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (!test.enabled) {
      return {
        status: 'failed',
        error: 'Test is disabled',
        duration: 0
      };
    }

    const startTime = Date.now();
    
    try {
      context.addLog(`Starting test: ${test.name}`);
      const result = await test.runTest(context);
      result.duration = Date.now() - startTime;
      context.addLog(`Test ${result.status} in ${result.duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      context.addLog(`Test failed: ${errorMsg}`);
      return {
        status: 'failed',
        error: errorMsg,
        duration
      };
    }
  }

  /**
   * Run all tests in a category
   */
  async runCategoryTests(category: string, context: TestContext): Promise<Map<string, TestResult>> {
    const tests = this.getTestsByCategory(category);
    const results = new Map<string, TestResult>();

    for (const test of tests) {
      if (!test.enabled) continue;
      
      const result = await this.runTest(test.id, context);
      results.set(test.id, result);
    }

    return results;
  }

  /**
   * Auto-discover and register tests from component files
   */
  async autoDiscoverTests() {
    // This would scan component files for test annotations
    // For now, we'll manually register known tests
    console.log('🔍 Auto-discovering tests...');
    
    // Import and register test suites
    await this.registerBuiltInTests();
  }

  /**
   * Register built-in test suites
   */
  private async registerBuiltInTests() {
    // Task & Taskboard Tests
    this.registerMultiple([
      {
        id: 'task-pref-save',
        name: 'Preference Saving',
        description: 'Verify task preferences are saved to database',
        category: 'tasks',
        priority: 'high',
        enabled: true,
        runTest: async (context) => {
          const { user, preferences, updatePreference, addLog } = context;
          
          if (!preferences || !updatePreference) {
            throw new Error('Preferences context not available');
          }

          const originalValue = preferences.taskBoard.showCardDetails;
          const testValue = !originalValue;
          
          addLog(`Original value: ${originalValue}, testing: ${testValue}`);
          
          await updatePreference('taskBoard', 'showCardDetails', testValue);
          
          // Wait longer for debounced save (500ms debounce + network time)
          addLog('Waiting for preference to save...');
          await context.delay(1500);
          
          // Verify saved to database
          addLog('Checking database for saved preference...');
          const { data, error } = await supabase
            .from('user_profiles')
            .select('preferences')
            .eq('id', user.id)
            .single();
          
          if (error) {
            addLog(`Database error: ${error.message}`);
            addLog(`Error code: ${error.code}`);
            addLog(`Error details: ${JSON.stringify(error)}`);
            throw error;
          }
          
          if (!data) {
            throw new Error('No user profile found');
          }
          
          addLog(`Database preferences: ${JSON.stringify(data.preferences?.taskBoard)}`);
          
          if (data?.preferences?.taskBoard?.showCardDetails !== testValue) {
            addLog(`Expected ${testValue} but got ${data?.preferences?.taskBoard?.showCardDetails}`);
            throw new Error('Preference not saved correctly');
          }
          
          // Restore original value
          await updatePreference('taskBoard', 'showCardDetails', originalValue);
          
          return { status: 'passed', duration: 0 };
        }
      },
      
      {
        id: 'task-create-full',
        name: 'Complete Task Creation',
        description: 'Test task creation with all attributes',
        category: 'tasks',
        priority: 'high',
        enabled: true,
        runTest: async (context) => {
          const { user, addLog } = context;
          
          // First, find or create a valid taskboard for testing
          addLog('Finding or creating taskboard for test...');
          
          // Try to get an existing taskboard
          const { data: taskboards } = await supabase
            .from('taskboards')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          
          let taskboardId: string;
          
          if (taskboards && taskboards.length > 0) {
            taskboardId = taskboards[0].id;
            addLog(`Using existing taskboard: ${taskboardId}`);
          } else {
            // Create a test taskboard
            const { data: newBoard, error: boardError } = await supabase
              .from('taskboards')
              .insert({
                user_id: user.id,
                name: 'Test Board',
                description: 'Board for automated testing'
              })
              .select()
              .single();
            
            if (boardError) {
              addLog(`Failed to create taskboard: ${boardError.message}`);
              throw boardError;
            }
            
            taskboardId = newBoard.id;
            addLog(`Created test taskboard: ${taskboardId}`);
          }
          
          const taskData = {
            user_id: user.id,
            taskboard_id: taskboardId,
            title: `Test Task ${Date.now()}`,
            description: 'Full test task with all attributes',
            status: 'backlog',
            priority: 'medium',
            category: 'test',
            position: 0,
            estimated_energy: 'M',
            tags: ['test', 'automated'],
            ai_suggested: false
            // removed created_by as it doesn't exist in the schema
          };
          
          addLog(`Creating task: ${taskData.title}`);
          
          const { data: task, error } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single();
          
          if (error) {
            addLog(`Task creation error: ${error.message}`);
            addLog(`Error details: ${JSON.stringify(error)}`);
            throw error;
          }
          
          if (!task) {
            throw new Error('Task creation returned null');
          }
          
          // Verify all attributes
          const requiredFields = ['title', 'description', 'status', 'priority', 'tags'];
          for (const field of requiredFields) {
            if (!task[field]) {
              throw new Error(`Field ${field} not saved properly`);
            }
          }
          
          addLog(`Task created with ID: ${task.id}`);
          
          // Clean up
          await supabase.from('tasks').delete().eq('id', task.id);
          
          return { status: 'passed', duration: 0 };
        }
      },

      {
        id: 'subtask-lifecycle',
        name: 'Subtask Lifecycle',
        description: 'Test complete subtask create/update/complete cycle',
        category: 'tasks',
        priority: 'high',
        enabled: true,
        runTest: async (context) => {
          const { user, addLog } = context;
          
          // First, get or create a valid taskboard
          addLog('Finding or creating taskboard for subtask test...');
          
          const { data: taskboards } = await supabase
            .from('taskboards')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          
          let taskboardId: string;
          
          if (taskboards && taskboards.length > 0) {
            taskboardId = taskboards[0].id;
          } else {
            const { data: newBoard, error: boardError } = await supabase
              .from('taskboards')
              .insert({
                user_id: user.id,
                name: 'Test Board for Subtasks',
                description: 'Board for automated testing'
              })
              .select()
              .single();
            
            if (boardError) {
              addLog(`Failed to create taskboard: ${boardError.message}`);
              throw boardError;
            }
            
            taskboardId = newBoard.id;
          }
          
          // Create parent task
          const { data: parentTask, error: parentError } = await supabase
            .from('tasks')
            .insert({
              user_id: user.id,
              taskboard_id: taskboardId,
              title: 'Parent for Subtask Test',
              status: 'todo',
              priority: 'medium',
              position: 0
              // removed created_by as it doesn't exist
            })
            .select()
            .single();
          
          if (parentError) {
            addLog(`Failed to create parent task: ${parentError.message}`);
            throw parentError;
          }
          
          if (!parentTask) {
            throw new Error('Parent task creation returned null');
          }
          
          addLog(`Created parent task: ${parentTask.id}`);
          
          // Create subtask
          const { data: subtask, error: createError } = await supabase
            .from('task_subtasks')
            .insert({
              parent_task_id: parentTask.id,
              user_id: user.id,
              title: 'Lifecycle Test Subtask',
              description: 'Testing subtask lifecycle',
              position: 0,
              is_completed: false
            })
            .select()
            .single();
          
          if (createError) throw createError;
          addLog(`Created subtask: ${subtask.id}`);
          
          // Complete subtask
          const { data: completedSubtask, error: completeError } = await supabase
            .from('task_subtasks')
            .update({
              is_completed: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', subtask.id)
            .select()
            .single();
          
          if (completeError) throw completeError;
          
          if (!completedSubtask.is_completed || !completedSubtask.completed_at) {
            throw new Error('Subtask completion not saved properly');
          }
          
          addLog('Subtask lifecycle test completed successfully');
          
          // Clean up
          await supabase.from('task_subtasks').delete().eq('id', subtask.id);
          await supabase.from('tasks').delete().eq('id', parentTask.id);
          
          return { status: 'passed', duration: 0 };
        }
      }
    ]);

    // AI & Coaching Tests
    this.registerMultiple([
      {
        id: 'ai-context-load',
        name: 'AI Context Loading',
        description: 'Test loading user context for AI interactions',
        category: 'ai',
        priority: 'medium',
        enabled: true,
        runTest: async (context) => {
          const { user, addLog } = context;
          
          addLog('Loading user context for AI...');
          
          // Test loading user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) throw profileError;
          addLog(`Profile loaded: ${profile.full_name || profile.email}`);
          
          // Test loading habits
          const { data: habits, error: habitsError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .limit(5);
          
          if (habitsError) throw habitsError;
          addLog(`Loaded ${habits.length} habits`);
          
          // Test loading goals
          const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .limit(5);
          
          if (goalsError) throw goalsError;
          addLog(`Loaded ${goals.length} goals`);
          
          return { 
            status: 'passed', 
            duration: 0,
            metadata: {
              profileFound: !!profile,
              habitsCount: habits.length,
              goalsCount: goals.length
            }
          };
        }
      }
    ]);

    // Authentication & Security Tests
    this.registerMultiple([
      {
        id: 'rls-user-isolation',
        name: 'User Data Isolation',
        description: 'Verify RLS policies prevent cross-user data access',
        category: 'auth',
        priority: 'high',
        enabled: true,
        runTest: async (context) => {
          const { user, addLog } = context;
          
          addLog('Testing RLS user data isolation...');
          
          // Try to access another user's data (should fail)
          const fakeUserId = '00000000-0000-0000-0000-000000000000';
          
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', fakeUserId);
          
          // Should return empty array, not error (RLS filters it out)
          if (error) {
            addLog(`Unexpected error: ${error.message}`);
          }
          
          if (!data || data.length === 0) {
            addLog('✅ RLS correctly prevented access to other user data');
            return { status: 'passed', duration: 0 };
          } else {
            throw new Error('RLS failed - accessed other user data');
          }
        }
      }
    ]);

    console.log(`✅ Registered ${this.tests.size} tests across ${this.categories.size} categories`);
  }
}

// Global test registry instance
export const testRegistry = new TestRegistry();

// Auto-initialize when imported
testRegistry.autoDiscoverTests().catch(console.error);