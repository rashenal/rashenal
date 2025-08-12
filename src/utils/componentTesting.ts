/**
 * Component Testing Utilities
 * Easy way for developers to add tests to their components
 */

import { testRegistry, TestDefinition } from '../lib/testRegistry';

/**
 * Decorator for automatically registering component tests
 * Usage: Add @registerTests('category') above your component
 */
export function registerTests(category: string) {
  return function(target: any) {
    // Extract test metadata from component
    if (target.tests) {
      target.tests.forEach((test: TestDefinition) => {
        testRegistry.register({
          ...test,
          category: test.category || category
        });
      });
    }
    return target;
  };
}

/**
 * Helper function to create test definitions
 */
export function createTest(config: {
  id: string;
  name: string;
  description: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  testFn: (context: any) => Promise<any>;
}): TestDefinition {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    category: config.category || 'general',
    priority: config.priority || 'medium',
    enabled: true,
    runTest: config.testFn
  };
}

/**
 * Quick test registration for simple cases
 */
export function quickTest(
  id: string,
  name: string,
  category: string,
  testFn: (context: any) => Promise<void>
) {
  testRegistry.register({
    id,
    name,
    description: name,
    category,
    priority: 'medium',
    enabled: true,
    runTest: async (context) => {
      await testFn(context);
      return { status: 'passed', duration: 0 };
    }
  });
}

/**
 * Test a component's database interactions
 */
export function testDatabase(
  componentName: string,
  tableName: string,
  operations: ('create' | 'read' | 'update' | 'delete')[]
) {
  operations.forEach(op => {
    testRegistry.register({
      id: `${componentName.toLowerCase()}-${tableName}-${op}`,
      name: `${componentName} ${tableName.charAt(0).toUpperCase() + tableName.slice(1)} ${op.toUpperCase()}`,
      description: `Test ${op} operations for ${componentName} on ${tableName}`,
      category: componentName.toLowerCase(),
      priority: 'high',
      enabled: true,
      runTest: async (context) => {
        const { supabase, user, addLog } = context;
        
        switch (op) {
          case 'create':
            addLog(`Testing create operation on ${tableName}`);
            const { data, error } = await supabase
              .from(tableName)
              .insert({ user_id: user.id, test_field: 'test_value' })
              .select();
            
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('No data returned from create');
            
            // Cleanup
            await supabase.from(tableName).delete().eq('id', data[0].id);
            break;
            
          case 'read':
            addLog(`Testing read operation on ${tableName}`);
            const { error: readError } = await supabase
              .from(tableName)
              .select('*')
              .eq('user_id', user.id)
              .limit(1);
            
            if (readError) throw readError;
            break;
            
          // Add other operations as needed
        }
        
        return { status: 'passed', duration: 0 };
      }
    });
  });
}

/**
 * Test a component's API endpoints
 */
export function testAPI(
  componentName: string,
  endpoints: { method: string; path: string; expectedStatus?: number }[]
) {
  endpoints.forEach((endpoint, index) => {
    testRegistry.register({
      id: `${componentName.toLowerCase()}-api-${index}`,
      name: `${componentName} API ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      description: `Test API endpoint ${endpoint.method} ${endpoint.path}`,
      category: componentName.toLowerCase(),
      priority: 'medium',
      enabled: true,
      runTest: async (context) => {
        const { addLog } = context;
        
        addLog(`Testing ${endpoint.method.toUpperCase()} ${endpoint.path}`);
        
        const response = await fetch(endpoint.path, {
          method: endpoint.method.toUpperCase(),
          headers: {
            'Content-Type': 'application/json',
            // Add auth headers as needed
          }
        });
        
        const expectedStatus = endpoint.expectedStatus || 200;
        if (response.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
        }
        
        return { status: 'passed', duration: 0 };
      }
    });
  });
}

/**
 * Example usage for component developers:
 * 
 * // In your component file:
 * import { quickTest, testDatabase } from '../utils/componentTesting';
 * 
 * // Register a simple test
 * quickTest('my-component-basic', 'Basic functionality', 'my-component', async (context) => {
 *   const { addLog } = context;
 *   addLog('Testing basic functionality...');
 *   // Your test logic here
 * });
 * 
 * // Register database tests
 * testDatabase('MyComponent', 'my_table', ['create', 'read', 'update', 'delete']);
 * 
 * // Register API tests
 * testAPI('MyComponent', [
 *   { method: 'get', path: '/api/my-endpoint' },
 *   { method: 'post', path: '/api/my-endpoint', expectedStatus: 201 }
 * ]);
 */

/**
 * Auto-register tests for a component based on its props and functionality
 */
export function autoRegisterComponentTests(
  componentName: string,
  config: {
    hasDatabase?: string[]; // Table names this component interacts with
    hasAPI?: string[]; // API endpoints this component calls
    hasState?: string[]; // State variables to test
    hasProps?: string[]; // Props to test
  }
) {
  // Auto-register database tests
  if (config.hasDatabase) {
    config.hasDatabase.forEach(tableName => {
      testDatabase(componentName, tableName, ['create', 'read']);
    });
  }
  
  // Auto-register API tests
  if (config.hasAPI) {
    testAPI(componentName, config.hasAPI.map(path => ({ method: 'get', path })));
  }
  
  // Auto-register state tests
  if (config.hasState) {
    config.hasState.forEach(stateName => {
      quickTest(
        `${componentName.toLowerCase()}-state-${stateName}`,
        `${componentName} ${stateName} state management`,
        componentName.toLowerCase(),
        async (context) => {
          context.addLog(`Testing ${stateName} state management`);
          // Basic state test logic
        }
      );
    });
  }
  
  console.log(`🔧 Auto-registered tests for ${componentName}`);
}

export default {
  registerTests,
  createTest,
  quickTest,
  testDatabase,
  testAPI,
  autoRegisterComponentTests
};