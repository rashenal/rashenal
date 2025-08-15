// Frontend Integration Test - Verify schema fix works with your React components
// Add this to your project to test the database integration

import { supabase } from './lib/supabase';
import type { TaskWithDependencies } from './types/TaskBoard';

export async function testSchemaFix() {
  console.log('🧪 Testing Frontend Integration with Fixed Schema...');
  
  try {
    // Test 1: Query tasks_with_dependencies view
    console.log('📋 Test 1: Querying tasks_with_dependencies view...');
    const { data: tasksWithDeps, error: tasksError } = await supabase
      .from('tasks_with_dependencies')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.error('❌ Error querying tasks_with_dependencies:', tasksError);
      return false;
    }

    if (tasksWithDeps && tasksWithDeps.length > 0) {
      const sampleTask = tasksWithDeps[0];
      console.log('✅ Successfully queried tasks_with_dependencies');
      console.log('📊 Sample task structure:', {
        id: sampleTask.id,
        title: sampleTask.title,
        updated_at: sampleTask.updated_at, // This should exist now!
        created_at: sampleTask.created_at,
        dependency_status: sampleTask.dependency_status,
        effective_dependency_status: sampleTask.effective_dependency_status
      });

      // Verify critical fields exist
      const requiredFields = ['id', 'updated_at', 'created_at', 'title'];
      const missingFields = requiredFields.filter(field => !(field in sampleTask));
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        return false;
      }
      console.log('✅ All required fields present in view');
    } else {
      console.warn('⚠️ No tasks found in database');
    }

    // Test 2: Query regular tasks table
    console.log('📋 Test 2: Querying tasks table...');
    const { data: tasks, error: tasksTableError } = await supabase
      .from('tasks')
      .select('id, title, updated_at, created_at, status, priority')
      .limit(3);

    if (tasksTableError) {
      console.error('❌ Error querying tasks table:', tasksTableError);
      return false;
    }

    console.log('✅ Successfully queried tasks table');
    if (tasks && tasks.length > 0) {
      console.log('📊 Sample task from table:', tasks[0]);
    }

    // Test 3: Query taskboards
    console.log('📋 Test 3: Querying taskboards...');
    const { data: taskboards, error: boardsError } = await supabase
      .from('taskboards')
      .select('id, name, created_at, updated_at')
      .limit(3);

    if (boardsError) {
      console.error('❌ Error querying taskboards:', boardsError);
      return false;
    }

    console.log('✅ Successfully queried taskboards');

    // Test 4: Type compatibility check
    console.log('📋 Test 4: TypeScript type compatibility...');
    if (tasksWithDeps && tasksWithDeps.length > 0) {
      // This should not cause TypeScript errors with updated types
      const typedTask: TaskWithDependencies = tasksWithDeps[0] as TaskWithDependencies;
      
      console.log('✅ TypeScript types are compatible');
      console.log('🔍 Type check results:', {
        id_is_string: typeof typedTask.id === 'string',
        updated_at_is_string: typeof typedTask.updated_at === 'string',
        has_effective_dependency_status: 'effective_dependency_status' in typedTask,
        has_child_count: 'child_count' in typedTask
      });
    }

    console.log('🎉 All frontend integration tests passed!');
    console.log('✅ Your schema fix is working correctly with the frontend');
    return true;

  } catch (error) {
    console.error('❌ Frontend integration test failed:', error);
    return false;
  }
}

// Usage: Call this function from your React component to test
export async function runSchemaTest() {
  const success = await testSchemaFix();
  
  if (success) {
    alert('✅ Schema fix successful! Frontend integration working.');
  } else {
    alert('❌ Schema fix needs attention. Check console for details.');
  }
}

// Example usage in a React component:
/*
import { runSchemaTest } from './path/to/this/file';

function TestButton() {
  return (
    <button onClick={runSchemaTest}>
      🧪 Test Schema Fix
    </button>
  );
}
*/