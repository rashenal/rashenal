// components/TaskBoardDemo.tsx
// Demo version that bypasses authentication for development

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw, Database, Loader, AlertCircle, Play } from 'lucide-react';
import TaskCard from './TaskCard';
import { TaskServiceDemo } from '../lib/task-service-demo';
import type { TaskUI, CreateTaskInput } from '../lib/database-types';

const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' }
];

export default function TaskBoardDemo() {
  const [tasks, setTasks] = useState<TaskUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState<Partial<CreateTaskInput>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize demo user and load tasks
  useEffect(() => {
    initializeDemo();
  }, []);

  const initializeDemo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, ensure demo user exists
      const { error: initError } = await TaskServiceDemo.initializeDemoUser();
      if (initError) {
        setError(`Demo initialization failed: ${initError.message}`);
        return;
      }
      
      setIsInitialized(true);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize demo');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: taskError } = await TaskServiceDemo.getUserTasks();
      
      if (taskError) {
        setError(taskError.message);
      } else {
        setTasks(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!taskFormData.title?.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      const { data, error } = await TaskServiceDemo.createTask({
        title: taskFormData.title,
        description: taskFormData.description || '',
        priority: taskFormData.priority || 'medium',
        status: 'backlog',
        owner: 'Demo User'
      });

      if (error) {
        setError(error.message);
      } else if (data) {
        setTasks(prev => [...prev, data]);
        setShowTaskForm(false);
        setTaskFormData({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      const { error } = await TaskServiceDemo.deleteTask(taskId);
      
      if (error) {
        setError(error.message);
      } else {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    try {
      const { data, error } = await TaskServiceDemo.moveTask(taskId, newStatus as any);
      
      if (error) {
        setError(error.message);
      } else if (data) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? data : task
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task');
    }
  };

  const addSampleTasks = async () => {
    const sampleTasks = [
      {
        title: 'Design AI Coaching Dashboard',
        description: 'Create wireframes and mockups for the main AI coaching interface',
        priority: 'high' as const,
        status: 'in_progress' as const
      },
      {
        title: 'Implement Task Management',
        description: 'Build the kanban board with drag & drop functionality',
        priority: 'high' as const,
        status: 'todo' as const
      },
      {
        title: 'Setup Database Schema',
        description: 'Create tables for users, tasks, and projects',
        priority: 'medium' as const,
        status: 'done' as const
      },
      {
        title: 'Add User Authentication',
        description: 'Implement signup, login, and session management',
        priority: 'high' as const,
        status: 'blocked' as const
      },
      {
        title: 'Create Project Templates',
        description: 'Build pre-made project templates for common use cases',
        priority: 'medium' as const,
        status: 'backlog' as const
      }
    ];

    try {
      for (const task of sampleTasks) {
        const { data, error } = await TaskServiceDemo.createTask(task);
        if (error) {
          console.error('Error creating sample task:', error);
        } else if (data) {
          setTasks(prev => [...prev, data]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sample tasks');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTask(taskId, newStatus);
    }
  };

  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2">Initializing demo...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Demo Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🎭</span>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Demo Mode - Database Connected (No Auth Required)</p>
              <p className="text-blue-600 text-sm">Fully functional task management with real database operations!</p>
            </div>
          </div>
          {tasks.length === 0 && (
            <button
              onClick={addSampleTasks}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Add Sample Tasks</span>
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Management Demo</h1>
              <p className="text-gray-600">Real database operations without authentication</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadTasks}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map(column => (
            <div key={column.id} className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {getTasksByStatus(column.id).length}
              </div>
              <div className="text-xs text-gray-600">{column.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Error:</span>
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-6">
        {KANBAN_COLUMNS.map(column => (
          <div
            key={column.id}
            className={`${column.color} rounded-lg p-4 min-h-96`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <h2 className="font-semibold text-gray-800 mb-4">{column.title}</h2>
            
            <div className="space-y-3">
              {getTasksByStatus(column.id).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(task) => {
                    // TODO: Implement edit functionality
                    console.log('Edit task:', task);
                  }}
                  onDelete={deleteTask}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={taskFormData.title || ''}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={taskFormData.description || ''}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Task description (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={taskFormData.priority || 'medium'}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTaskForm(false);
                  setTaskFormData({});
                }}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}