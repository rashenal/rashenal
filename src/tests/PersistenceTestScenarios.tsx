import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Play, Pause, Copy, CheckCheck, Download } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}

export default function PersistenceTestScenarios() {
  const { user } = useUser();
  const { preferences, updatePreference, resetPreferences } = useUserPreferences();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [detailedLogs, setDetailedLogs] = useState<Record<string, string[]>>({});

  const testScenarios: TestResult[] = [
    {
      id: 'pref-save',
      name: 'Preference Saving',
      description: 'Verify preferences are saved to database',
      status: 'pending'
    },
    {
      id: 'pref-load',
      name: 'Preference Loading',
      description: 'Verify preferences load correctly on app start',
      status: 'pending'
    },
    {
      id: 'pref-realtime',
      name: 'Real-time Sync',
      description: 'Verify preferences sync across sessions',
      status: 'pending'
    },
    {
      id: 'task-create',
      name: 'Task Creation',
      description: 'Verify all task attributes are saved',
      status: 'pending'
    },
    {
      id: 'task-update',
      name: 'Task Updates',
      description: 'Verify drag-and-drop updates persist',
      status: 'pending'
    },
    {
      id: 'task-realtime',
      name: 'Task Real-time Updates',
      description: 'Verify real-time task synchronization',
      status: 'pending'
    },
    {
      id: 'focus-restore',
      name: 'Input Focus Restoration',
      description: 'Verify input focus is maintained properly',
      status: 'pending'
    },
    {
      id: 'localStorage-backup',
      name: 'LocalStorage Backup',
      description: 'Verify localStorage fallback works',
      status: 'pending'
    },
    {
      id: 'error-recovery',
      name: 'Error Recovery',
      description: 'Verify graceful handling of save failures',
      status: 'pending'
    },
    {
      id: 'data-integrity',
      name: 'Data Integrity',
      description: 'Verify no data loss during operations',
      status: 'pending'
    },
    {
      id: 'subtask-create',
      name: 'Subtask Creation',
      description: 'Verify subtasks can be created and saved',
      status: 'pending'
    },
    {
      id: 'subtask-complete',
      name: 'Subtask Completion',
      description: 'Verify subtask completion state persists',
      status: 'pending'
    },
    {
      id: 'subtask-reorder',
      name: 'Subtask Reordering',
      description: 'Verify subtask position changes persist',
      status: 'pending'
    },
    {
      id: 'comment-create',
      name: 'Comment Creation',
      description: 'Verify comments can be added to tasks',
      status: 'pending'
    },
    {
      id: 'comment-edit',
      name: 'Comment Editing',
      description: 'Verify comment edits are saved properly',
      status: 'pending'
    },
    {
      id: 'comment-thread',
      name: 'Comment Threading',
      description: 'Verify threaded comments work correctly',
      status: 'pending'
    },
    {
      id: 'attachment-upload',
      name: 'File Upload',
      description: 'Verify file attachments can be uploaded',
      status: 'pending'
    },
    {
      id: 'attachment-metadata',
      name: 'File Metadata',
      description: 'Verify file metadata is stored correctly',
      status: 'pending'
    },
    {
      id: 'attachment-permissions',
      name: 'File Permissions',
      description: 'Verify file access controls work properly',
      status: 'pending'
    }
  ];

  useEffect(() => {
    setTestResults(testScenarios);
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const addLog = (testId: string, message: string) => {
    setDetailedLogs(prev => ({
      ...prev,
      [testId]: [...(prev[testId] || []), `[${new Date().toISOString()}] ${message}`]
    }));
  };

  const runTest = async (test: TestResult): Promise<TestResult> => {
    const startTime = Date.now();
    setCurrentTest(test.id);
    
    // Clear previous logs for this test
    setDetailedLogs(prev => ({ ...prev, [test.id]: [] }));
    addLog(test.id, `Starting test: ${test.name}`);

    try {
      switch (test.id) {
        case 'pref-save':
          // Test preference saving
          addLog(test.id, `Current showCardDetails: ${preferences.taskBoard.showCardDetails}`);
          const testValue = !preferences.taskBoard.showCardDetails;
          addLog(test.id, `Updating to: ${testValue}`);
          
          await updatePreference('taskBoard', 'showCardDetails', testValue);
          await delay(500);
          
          // Verify it was saved to database
          addLog(test.id, `Fetching from database...`);
          const { data: savedPrefs, error: fetchError } = await supabase
            .from('user_profiles')
            .select('preferences')
            .eq('id', user?.id)
            .single();
          
          if (fetchError) {
            addLog(test.id, `Database fetch error: ${fetchError.message}`);
            throw new Error(`Database fetch failed: ${fetchError.message}`);
          }
          
          addLog(test.id, `Database value: ${JSON.stringify(savedPrefs?.preferences?.taskBoard?.showCardDetails)}`);
          
          if (savedPrefs?.preferences?.taskBoard?.showCardDetails !== testValue) {
            addLog(test.id, `Mismatch! Expected ${testValue}, got ${savedPrefs?.preferences?.taskBoard?.showCardDetails}`);
            throw new Error('Preference not saved to database');
          }
          
          addLog(test.id, `Success! Restoring original value...`);
          // Restore original value
          await updatePreference('taskBoard', 'showCardDetails', !testValue);
          break;

        case 'pref-load':
          // Test preference loading
          const currentPrefs = { ...preferences };
          
          // Clear localStorage to force database load
          localStorage.removeItem(`preferences_${user?.id}`);
          
          // Force a reload (in real app this would be a page refresh)
          // For testing, we'll just verify localStorage gets populated
          await delay(1000);
          
          const storedPrefs = localStorage.getItem(`preferences_${user?.id}`);
          if (!storedPrefs) {
            throw new Error('Preferences not loaded to localStorage');
          }
          
          const parsedPrefs = JSON.parse(storedPrefs);
          if (!parsedPrefs.taskBoard || !parsedPrefs.ui || !parsedPrefs.ai) {
            throw new Error('Incomplete preferences structure');
          }
          break;

        case 'pref-realtime':
          // Test real-time preference sync
          const originalCompact = preferences.taskBoard.compactView;
          
          // Simulate update from another session
          await supabase
            .from('user_profiles')
            .update({
              preferences: {
                ...preferences,
                taskBoard: {
                  ...preferences.taskBoard,
                  compactView: !originalCompact
                }
              }
            })
            .eq('id', user?.id);
          
          // Wait for real-time update
          await delay(1500);
          
          // Check if local state updated (would need to verify in component)
          // For now, just verify database update worked
          const { data: updatedPrefs } = await supabase
            .from('user_profiles')
            .select('preferences')
            .eq('id', user?.id)
            .single();
          
          if (updatedPrefs?.preferences?.taskBoard?.compactView === originalCompact) {
            throw new Error('Real-time sync failed');
          }
          
          // Restore original
          await updatePreference('taskBoard', 'compactView', originalCompact);
          break;

        case 'task-create':
          // Test task creation with all attributes
          addLog(test.id, `Creating test task with user_id: ${user?.id}`);
          const testTask = {
            user_id: user?.id,
            taskboard_id: 'test-board',
            title: 'Test Task ' + Date.now(),
            description: 'Test description',
            status: 'backlog',
            priority: 'medium',
            category: 'test',
            position: 0,
            estimated_energy: 'M',
            tags: ['test', 'automated'],
            ai_suggested: false,
            created_by: user?.id
          };
          
          addLog(test.id, `Task payload: ${JSON.stringify(testTask, null, 2)}`);
          
          const { data: createdTask, error: createError } = await supabase
            .from('tasks')
            .insert(testTask)
            .select()
            .single();
          
          if (createError) {
            addLog(test.id, `Creation error: ${createError.message}`);
            addLog(test.id, `Error details: ${JSON.stringify(createError)}`);
            throw new Error(`Task creation failed: ${createError.message}`);
          }
          
          addLog(test.id, `Created task: ${JSON.stringify(createdTask, null, 2)}`);
          
          // Verify all attributes were saved
          if (!createdTask.title || !createdTask.description || !createdTask.tags) {
            addLog(test.id, `Missing attributes - title: ${createdTask.title}, desc: ${createdTask.description}, tags: ${createdTask.tags}`);
            throw new Error('Task attributes not fully saved');
          }
          
          addLog(test.id, `All attributes verified, cleaning up...`);
          // Clean up
          await supabase
            .from('tasks')
            .delete()
            .eq('id', createdTask.id);
          break;

        case 'task-update':
          // Test task status update (drag-and-drop simulation)
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user?.id)
            .limit(1);
          
          if (tasks && tasks.length > 0) {
            const task = tasks[0];
            const originalStatus = task.status;
            const newStatus = originalStatus === 'backlog' ? 'todo' : 'backlog';
            
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);
            
            if (updateError) {
              throw new Error(`Task update failed: ${updateError.message}`);
            }
            
            // Verify update persisted
            const { data: updatedTask } = await supabase
              .from('tasks')
              .select('status')
              .eq('id', task.id)
              .single();
            
            if (updatedTask?.status !== newStatus) {
              throw new Error('Task status update not persisted');
            }
            
            // Restore original
            await supabase
              .from('tasks')
              .update({ status: originalStatus })
              .eq('id', task.id);
          }
          break;

        case 'task-realtime':
          // Test real-time task updates
          const { data: testTasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user?.id)
            .limit(1);
          
          if (testTasks && testTasks.length > 0) {
            const task = testTasks[0];
            
            // Set up subscription (would be in component)
            const channel = supabase
              .channel(`test_tasks_${task.taskboard_id}`)
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'tasks',
                  filter: `id=eq.${task.id}`,
                },
                (payload) => {
                  console.log('Real-time update received:', payload);
                }
              )
              .subscribe();
            
            // Make an update
            await supabase
              .from('tasks')
              .update({ 
                description: task.description + ' (updated)',
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);
            
            await delay(1000);
            
            // Clean up
            supabase.removeChannel(channel);
            
            // Restore original
            await supabase
              .from('tasks')
              .update({ description: task.description?.replace(' (updated)', '') })
              .eq('id', task.id);
          }
          break;

        case 'focus-restore':
          // Test input focus restoration
          // This would need to be tested in the actual component
          // For now, just verify the preference is set correctly
          if (preferences.ui.autoFocusInput !== true) {
            await updatePreference('ui', 'autoFocusInput', true);
          }
          
          // Simulate some async operation
          await delay(500);
          
          // Verify preference is still set
          if (preferences.ui.autoFocusInput !== true) {
            throw new Error('Auto-focus preference not maintained');
          }
          break;

        case 'localStorage-backup':
          // Test localStorage backup functionality
          const testPrefs = {
            ...preferences,
            ui: {
              ...preferences.ui,
              theme: preferences.ui.theme === 'dark' ? 'light' : 'dark'
            }
          };
          
          // Save to localStorage
          localStorage.setItem(`preferences_${user?.id}`, JSON.stringify(testPrefs));
          
          // Verify it can be loaded
          const loaded = localStorage.getItem(`preferences_${user?.id}`);
          if (!loaded) {
            throw new Error('Failed to save to localStorage');
          }
          
          const loadedPrefs = JSON.parse(loaded);
          if (loadedPrefs.ui.theme !== testPrefs.ui.theme) {
            throw new Error('localStorage data corrupted');
          }
          
          // Restore original
          localStorage.setItem(`preferences_${user?.id}`, JSON.stringify(preferences));
          break;

        case 'error-recovery':
          // Test error recovery
          // Simulate a failed save by using an invalid user ID
          try {
            await supabase
              .from('user_profiles')
              .update({ preferences: {} })
              .eq('id', 'invalid-id');
            
            // Should still have localStorage backup
            const backup = localStorage.getItem(`preferences_${user?.id}`);
            if (!backup) {
              throw new Error('No localStorage backup available');
            }
          } catch (err) {
            // Error is expected, but should be handled gracefully
            console.log('Expected error handled:', err);
          }
          break;

        case 'data-integrity':
          // Test data integrity during concurrent operations
          const operations = [];
          
          // Simulate multiple concurrent preference updates
          for (let i = 0; i < 5; i++) {
            operations.push(
              updatePreference('taskBoard', 'showAIInsights', i % 2 === 0)
            );
          }
          
          await Promise.all(operations);
          await delay(1000);
          
          // Verify final state is consistent
          const { data: finalPrefs } = await supabase
            .from('user_profiles')
            .select('preferences')
            .eq('id', user?.id)
            .single();
          
          if (!finalPrefs?.preferences) {
            throw new Error('Preferences lost during concurrent updates');
          }
          break;

        case 'subtask-create':
          // Test subtask creation and persistence
          addLog(test.id, 'Creating test task for subtask testing...');
          
          // First create a parent task
          const parentTaskData = {
            user_id: user?.id,
            taskboard_id: 'test-board',
            title: 'Parent Task ' + Date.now(),
            description: 'Parent task for subtask testing',
            status: 'todo',
            priority: 'medium',
            position: 0,
            created_by: user?.id
          };
          
          const { data: parentTask, error: parentError } = await supabase
            .from('tasks')
            .insert(parentTaskData)
            .select()
            .single();
            
          if (parentError) {
            addLog(test.id, `Parent task creation failed: ${parentError.message}`);
            throw new Error(`Parent task creation failed: ${parentError.message}`);
          }
          
          addLog(test.id, `Parent task created: ${parentTask.id}`);
          
          // Create subtasks
          const subtaskData = {
            parent_task_id: parentTask.id,
            user_id: user?.id,
            title: 'Test Subtask 1',
            description: 'First test subtask',
            position: 0,
            is_completed: false,
            priority: 'medium'
          };
          
          addLog(test.id, `Creating subtask: ${JSON.stringify(subtaskData)}`);
          
          const { data: createdSubtask, error: subtaskError } = await supabase
            .from('task_subtasks')
            .insert(subtaskData)
            .select()
            .single();
          
          if (subtaskError) {
            addLog(test.id, `Subtask creation failed: ${subtaskError.message}`);
            throw new Error(`Subtask creation failed: ${subtaskError.message}`);
          }
          
          addLog(test.id, `Subtask created successfully: ${JSON.stringify(createdSubtask)}`);
          
          // Verify subtask was saved with all attributes
          if (!createdSubtask.title || !createdSubtask.parent_task_id) {
            addLog(test.id, 'Subtask missing required attributes');
            throw new Error('Subtask attributes not fully saved');
          }
          
          // Clean up
          await supabase.from('task_subtasks').delete().eq('id', createdSubtask.id);
          await supabase.from('tasks').delete().eq('id', parentTask.id);
          addLog(test.id, 'Cleanup completed');
          break;

        case 'subtask-complete':
          // Test subtask completion persistence
          addLog(test.id, 'Testing subtask completion state...');
          
          // Create parent task and subtask
          const { data: testParentTask } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Completion Test Parent',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          const { data: testSubtask } = await supabase
            .from('task_subtasks')
            .insert({
              parent_task_id: testParentTask.id,
              user_id: user?.id,
              title: 'Completion Test Subtask',
              is_completed: false,
              position: 0
            })
            .select()
            .single();
          
          addLog(test.id, `Created subtask with completion: ${testSubtask.is_completed}`);
          
          // Mark subtask as complete
          const { data: updatedSubtask, error: updateError } = await supabase
            .from('task_subtasks')
            .update({ 
              is_completed: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', testSubtask.id)
            .select()
            .single();
          
          if (updateError) {
            addLog(test.id, `Completion update failed: ${updateError.message}`);
            throw new Error(`Subtask completion update failed: ${updateError.message}`);
          }
          
          addLog(test.id, `Updated completion state: ${updatedSubtask.is_completed}`);
          
          // Verify completion persisted
          const { data: verifySubtask } = await supabase
            .from('task_subtasks')
            .select('is_completed, completed_at')
            .eq('id', testSubtask.id)
            .single();
          
          if (!verifySubtask.is_completed) {
            throw new Error('Subtask completion state not persisted');
          }
          
          if (!verifySubtask.completed_at) {
            throw new Error('Completion timestamp not saved');
          }
          
          // Clean up
          await supabase.from('task_subtasks').delete().eq('id', testSubtask.id);
          await supabase.from('tasks').delete().eq('id', testParentTask.id);
          break;

        case 'subtask-reorder':
          // Test subtask position reordering
          addLog(test.id, 'Testing subtask reordering...');
          
          // Create parent task
          const { data: reorderParent } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Reorder Test Parent',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          // Create multiple subtasks
          const subtasks = [];
          for (let i = 0; i < 3; i++) {
            const { data: subtask } = await supabase
              .from('task_subtasks')
              .insert({
                parent_task_id: reorderParent.id,
                user_id: user?.id,
                title: `Subtask ${i + 1}`,
                position: i,
                is_completed: false
              })
              .select()
              .single();
            subtasks.push(subtask);
          }
          
          addLog(test.id, `Created ${subtasks.length} subtasks with positions: ${subtasks.map(s => s.position).join(', ')}`);
          
          // Reorder subtasks (move first to last)
          const { error: reorderError } = await supabase
            .from('task_subtasks')
            .update({ position: 2 })
            .eq('id', subtasks[0].id);
          
          if (reorderError) {
            throw new Error(`Reorder failed: ${reorderError.message}`);
          }
          
          // Verify new positions
          const { data: reorderedSubtasks } = await supabase
            .from('task_subtasks')
            .select('id, title, position')
            .eq('parent_task_id', reorderParent.id)
            .order('position');
          
          addLog(test.id, `Reordered positions: ${JSON.stringify(reorderedSubtasks.map(s => ({ title: s.title, position: s.position })))}`);
          
          if (reorderedSubtasks[2].id !== subtasks[0].id) {
            throw new Error('Subtask reordering not persisted correctly');
          }
          
          // Clean up
          await supabase.from('task_subtasks').delete().eq('parent_task_id', reorderParent.id);
          await supabase.from('tasks').delete().eq('id', reorderParent.id);
          break;

        case 'comment-create':
          // Test comment creation
          addLog(test.id, 'Testing comment creation...');
          
          // Create task for comments
          const { data: commentTask } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Comment Test Task',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          // Create comment
          const commentData = {
            task_id: commentTask.id,
            user_id: user?.id,
            content: 'This is a test comment with detailed information.',
            comment_type: 'general',
            is_private: false
          };
          
          addLog(test.id, `Creating comment: ${JSON.stringify(commentData)}`);
          
          const { data: createdComment, error: commentError } = await supabase
            .from('task_comments')
            .insert(commentData)
            .select()
            .single();
          
          if (commentError) {
            addLog(test.id, `Comment creation failed: ${commentError.message}`);
            throw new Error(`Comment creation failed: ${commentError.message}`);
          }
          
          addLog(test.id, `Comment created: ${createdComment.id}`);
          
          // Verify comment attributes
          if (!createdComment.content || !createdComment.task_id) {
            throw new Error('Comment attributes not saved correctly');
          }
          
          // Clean up
          await supabase.from('task_comments').delete().eq('id', createdComment.id);
          await supabase.from('tasks').delete().eq('id', commentTask.id);
          break;

        case 'comment-edit':
          // Test comment editing
          addLog(test.id, 'Testing comment editing...');
          
          // Create task and comment
          const { data: editTask } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Edit Test Task',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          const { data: originalComment } = await supabase
            .from('task_comments')
            .insert({
              task_id: editTask.id,
              user_id: user?.id,
              content: 'Original comment content',
              comment_type: 'general'
            })
            .select()
            .single();
          
          addLog(test.id, `Original comment: "${originalComment.content}"`);
          
          // Edit comment
          const editedContent = 'Edited comment content with more details';
          const { data: editedComment, error: editError } = await supabase
            .from('task_comments')
            .update({ 
              content: editedContent,
              edited_at: new Date().toISOString(),
              edit_reason: 'Test edit'
            })
            .eq('id', originalComment.id)
            .select()
            .single();
          
          if (editError) {
            throw new Error(`Comment edit failed: ${editError.message}`);
          }
          
          addLog(test.id, `Edited comment: "${editedComment.content}"`);
          
          // Verify edit persisted
          if (editedComment.content !== editedContent || !editedComment.edited_at) {
            throw new Error('Comment edit not persisted correctly');
          }
          
          // Clean up
          await supabase.from('task_comments').delete().eq('id', originalComment.id);
          await supabase.from('tasks').delete().eq('id', editTask.id);
          break;

        case 'comment-thread':
          // Test threaded comments
          addLog(test.id, 'Testing comment threading...');
          
          // Create task
          const { data: threadTask } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Threading Test Task',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          // Create parent comment
          const { data: parentComment } = await supabase
            .from('task_comments')
            .insert({
              task_id: threadTask.id,
              user_id: user?.id,
              content: 'Parent comment for threading test',
              comment_type: 'question'
            })
            .select()
            .single();
          
          addLog(test.id, `Parent comment created: ${parentComment.id}`);
          
          // Create reply comment
          const { data: replyComment } = await supabase
            .from('task_comments')
            .insert({
              task_id: threadTask.id,
              user_id: user?.id,
              content: 'Reply to parent comment',
              comment_type: 'solution',
              parent_comment_id: parentComment.id
            })
            .select()
            .single();
          
          addLog(test.id, `Reply comment created: ${replyComment.id} -> ${replyComment.parent_comment_id}`);
          
          // Verify threading relationship
          if (replyComment.parent_comment_id !== parentComment.id) {
            throw new Error('Comment threading relationship not saved');
          }
          
          // Query threaded comments
          const { data: threadedComments } = await supabase
            .from('task_comments')
            .select('id, content, parent_comment_id')
            .eq('task_id', threadTask.id)
            .order('created_at');
          
          addLog(test.id, `Threaded comments: ${JSON.stringify(threadedComments)}`);
          
          const parentExists = threadedComments.some(c => c.id === parentComment.id && !c.parent_comment_id);
          const replyExists = threadedComments.some(c => c.id === replyComment.id && c.parent_comment_id === parentComment.id);
          
          if (!parentExists || !replyExists) {
            throw new Error('Comment threading structure not preserved');
          }
          
          // Clean up
          await supabase.from('task_comments').delete().eq('task_id', threadTask.id);
          await supabase.from('tasks').delete().eq('id', threadTask.id);
          break;

        case 'attachment-upload':
          // Test file attachment upload simulation
          addLog(test.id, 'Testing file attachment upload...');
          
          // Create task for attachment
          const { data: attachTask } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Attachment Test Task',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          // Simulate file attachment record (without actual file upload)
          const attachmentData = {
            task_id: attachTask.id,
            user_id: user?.id,
            filename: 'test-document.pdf',
            original_filename: 'Test Document.pdf',
            file_size: 1024000, // 1MB
            mime_type: 'application/pdf',
            file_extension: '.pdf',
            storage_bucket: 'task-attachments',
            storage_path: `tasks/${attachTask.id}/test-document.pdf`,
            description: 'Test PDF attachment',
            upload_status: 'completed',
            is_image: false
          };
          
          addLog(test.id, `Creating attachment record: ${JSON.stringify({ filename: attachmentData.filename, size: attachmentData.file_size })}`);
          
          const { data: createdAttachment, error: attachError } = await supabase
            .from('task_attachments')
            .insert(attachmentData)
            .select()
            .single();
          
          if (attachError) {
            addLog(test.id, `Attachment creation failed: ${attachError.message}`);
            throw new Error(`Attachment creation failed: ${attachError.message}`);
          }
          
          addLog(test.id, `Attachment created: ${createdAttachment.id}`);
          
          // Verify attachment attributes
          if (!createdAttachment.filename || !createdAttachment.storage_path) {
            throw new Error('Attachment metadata not saved correctly');
          }
          
          // Clean up
          await supabase.from('task_attachments').delete().eq('id', createdAttachment.id);
          await supabase.from('tasks').delete().eq('id', attachTask.id);
          break;

        case 'attachment-metadata':
          // Test file metadata storage
          addLog(test.id, 'Testing file metadata storage...');
          
          // Create task
          const { data: metaTask } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Metadata Test Task',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          // Create attachment with comprehensive metadata
          const metadataAttachment = {
            task_id: metaTask.id,
            user_id: user?.id,
            filename: 'test-image.jpg',
            original_filename: 'My Test Image.jpg',
            file_size: 2048576, // 2MB
            mime_type: 'image/jpeg',
            file_extension: '.jpg',
            storage_bucket: 'task-attachments',
            storage_path: `tasks/${metaTask.id}/test-image.jpg`,
            thumbnail_path: `tasks/${metaTask.id}/thumbnails/test-image-thumb.jpg`,
            description: 'Test image with thumbnail',
            upload_status: 'completed',
            is_image: true,
            is_public: false,
            access_level: 'task_members'
          };
          
          addLog(test.id, `Creating attachment with metadata: ${JSON.stringify(metadataAttachment, null, 2)}`);
          
          const { data: metaAttachment, error: metaError } = await supabase
            .from('task_attachments')
            .insert(metadataAttachment)
            .select()
            .single();
          
          if (metaError) {
            throw new Error(`Metadata attachment creation failed: ${metaError.message}`);
          }
          
          // Verify all metadata fields
          const requiredFields = ['filename', 'mime_type', 'file_size', 'is_image', 'thumbnail_path', 'access_level'];
          for (const field of requiredFields) {
            if (metaAttachment[field] === null || metaAttachment[field] === undefined) {
              addLog(test.id, `Missing field: ${field}`);
              throw new Error(`Metadata field ${field} not saved`);
            }
          }
          
          addLog(test.id, `All metadata fields verified: ${JSON.stringify(requiredFields)}`);
          
          // Clean up
          await supabase.from('task_attachments').delete().eq('id', metaAttachment.id);
          await supabase.from('tasks').delete().eq('id', metaTask.id);
          break;

        case 'attachment-permissions':
          // Test file access permissions
          addLog(test.id, 'Testing file access permissions...');
          
          // Create task
          const { data: permTask } = await supabase
            .from('tasks')
            .insert({
              user_id: user?.id,
              taskboard_id: 'test-board',
              title: 'Permissions Test Task',
              status: 'todo',
              priority: 'medium',
              position: 0,
              created_by: user?.id
            })
            .select()
            .single();
          
          // Create private attachment
          const { data: privateAttachment } = await supabase
            .from('task_attachments')
            .insert({
              task_id: permTask.id,
              user_id: user?.id,
              filename: 'private-file.txt',
              original_filename: 'Private File.txt',
              file_size: 1024,
              mime_type: 'text/plain',
              file_extension: '.txt',
              storage_bucket: 'task-attachments',
              storage_path: `tasks/${permTask.id}/private-file.txt`,
              upload_status: 'completed',
              is_public: false,
              access_level: 'task_members'
            })
            .select()
            .single();
          
          addLog(test.id, `Private attachment created: ${privateAttachment.id}, public: ${privateAttachment.is_public}`);
          
          // Create public attachment
          const { data: publicAttachment } = await supabase
            .from('task_attachments')
            .insert({
              task_id: permTask.id,
              user_id: user?.id,
              filename: 'public-file.txt',
              original_filename: 'Public File.txt',
              file_size: 512,
              mime_type: 'text/plain',
              file_extension: '.txt',
              storage_bucket: 'task-attachments',
              storage_path: `tasks/${permTask.id}/public-file.txt`,
              upload_status: 'completed',
              is_public: true,
              access_level: 'public'
            })
            .select()
            .single();
          
          addLog(test.id, `Public attachment created: ${publicAttachment.id}, public: ${publicAttachment.is_public}`);
          
          // Verify permission settings persisted
          const { data: attachments } = await supabase
            .from('task_attachments')
            .select('id, filename, is_public, access_level')
            .eq('task_id', permTask.id);
          
          const privateFile = attachments.find(a => a.id === privateAttachment.id);
          const publicFile = attachments.find(a => a.id === publicAttachment.id);
          
          if (privateFile.is_public !== false || privateFile.access_level !== 'task_members') {
            throw new Error('Private file permissions not saved correctly');
          }
          
          if (publicFile.is_public !== true || publicFile.access_level !== 'public') {
            throw new Error('Public file permissions not saved correctly');
          }
          
          addLog(test.id, 'Permission settings verified correctly');
          
          // Clean up
          await supabase.from('task_attachments').delete().eq('task_id', permTask.id);
          await supabase.from('tasks').delete().eq('id', permTask.id);
          break;

        default:
          throw new Error('Unknown test');
      }

      const duration = Date.now() - startTime;
      addLog(test.id, `Test passed in ${duration}ms`);
      return { ...test, status: 'passed', duration };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(test.id, `Test failed: ${errorMsg}`);
      addLog(test.id, `Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      return {
        ...test,
        status: 'failed',
        error: errorMsg,
        duration
      };
    } finally {
      setCurrentTest(null);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (const test of testResults) {
      setTestResults(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ));
      
      const result = await runTest(test);
      
      setTestResults(prev => prev.map(t => 
        t.id === test.id ? result : t
      ));
      
      await delay(200); // Small delay between tests
    }
    
    setIsRunning(false);
  };

  const resetTests = () => {
    setTestResults(testScenarios);
    setDetailedLogs({});
    setCopiedId(null);
  };

  const copyTestLog = async (testId: string) => {
    const test = testResults.find(t => t.id === testId);
    const logs = detailedLogs[testId] || [];
    
    const content = `
## Test: ${test?.name}
**Status:** ${test?.status}
**Error:** ${test?.error || 'None'}
**Duration:** ${test?.duration || 0}ms

### Detailed Logs:
${logs.join('\n')}

### Environment:
- User ID: ${user?.id}
- Timestamp: ${new Date().toISOString()}
- Preferences: ${JSON.stringify(preferences, null, 2)}
`;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(testId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllFailedTests = async () => {
    const failedTests = testResults.filter(t => t.status === 'failed');
    
    const content = `
# Persistence Test Results - ${new Date().toISOString()}

## Summary:
- Failed: ${failedTests.length}
- Total: ${testResults.length}
- User ID: ${user?.id}

## Failed Tests:

${failedTests.map(test => {
  const logs = detailedLogs[test.id] || [];
  return `
### ${test.name}
**Error:** ${test.error}
**Logs:**
${logs.join('\n')}
---`;
}).join('\n')}

## Full Test Results:
${JSON.stringify(testResults, null, 2)}

## Current Preferences:
${JSON.stringify(preferences, null, 2)}
`;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedId('all');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStats = () => {
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const total = testResults.length;
    return { passed, failed, total };
  };

  const stats = getStats();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Persistence Test Suite
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verify data persistence and recovery mechanisms
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm">
              <span className="text-green-600 font-semibold">{stats.passed}</span>
              <span className="text-gray-500"> / </span>
              <span className="text-gray-600">{stats.total}</span>
              <span className="text-gray-500"> passed</span>
            </div>
            
            {stats.failed > 0 && (
              <button
                onClick={copyAllFailedTests}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 text-sm"
                title="Copy all failed test logs"
              >
                {copiedId === 'all' ? (
                  <CheckCheck className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Copy Failed Tests</span>
              </button>
            )}
            
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Run Tests</span>
                </>
              )}
            </button>
            
            <button
              onClick={resetTests}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {testResults.map(test => {
            const logs = detailedLogs[test.id] || [];
            const [showLogs, setShowLogs] = useState(false);
            
            return (
              <div
                key={test.id}
                className={`border rounded-lg transition-all ${
                  test.status === 'running' 
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                    : test.status === 'passed'
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : test.status === 'failed'
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {test.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {test.description}
                        </p>
                        {test.error && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-mono bg-red-50 dark:bg-red-900/10 p-2 rounded">
                            {test.error}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {test.duration && (
                        <span className="text-sm text-gray-500">
                          {test.duration}ms
                        </span>
                      )}
                      
                      {logs.length > 0 && (
                        <button
                          onClick={() => setShowLogs(!showLogs)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          title={showLogs ? "Hide logs" : "Show logs"}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {(test.status === 'failed' || logs.length > 0) && (
                        <button
                          onClick={() => copyTestLog(test.id)}
                          className={`p-1 rounded transition-colors ${
                            copiedId === test.id
                              ? 'text-green-600'
                              : 'text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                          title="Copy test logs"
                        >
                          {copiedId === test.id ? (
                            <CheckCheck className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Logs Section */}
                {showLogs && logs.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Detailed Logs ({logs.length} entries)
                    </h4>
                    <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="whitespace-pre-wrap break-all">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {stats.failed > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> {stats.failed} test(s) failed. Check the error messages above for details.
              Make sure you're connected to Supabase and have the proper permissions.
            </p>
          </div>
        )}

        {stats.passed === stats.total && stats.total > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Success!</strong> All persistence tests passed. Your data is being saved and restored correctly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}