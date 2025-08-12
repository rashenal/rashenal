import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Settings,
  Filter,
  SortAsc,
  Grid,
  List,
  Brain,
  RefreshCw,
  Save,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Task } from '../lib/database-types';
import { clsx } from '../lib/utils';

interface TaskBoardEnhancedProps {
  taskboardId?: string;
  taskboardColor?: string;
}

const COLUMN_CONFIG = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-100 dark:bg-red-900' },
  { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900' },
];

export default function TaskBoardEnhanced({ taskboardId, taskboardColor }: TaskBoardEnhancedProps) {
  const { user } = useUser();
  const { preferences, updatePreference, loading: prefsLoading } = useUserPreferences();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [localSettings, setLocalSettings] = useState(preferences.taskBoard);
  
  // Real-time subscription reference
  const subscriptionRef = React.useRef<any>(null);

  // Load tasks from database
  const loadTasks = useCallback(async () => {
    if (!user?.id || !taskboardId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('taskboard_id', taskboardId)
        .order('position', { ascending: true });

      if (queryError) {
        throw queryError;
      }

      setTasks(data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user?.id, taskboardId]);

  // Set up real-time subscription for tasks
  useEffect(() => {
    if (!user?.id || !taskboardId) return;

    // Load initial tasks
    loadTasks();

    // Set up real-time subscription
    const channel = supabase
      .channel(`tasks_${taskboardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `taskboard_id=eq.${taskboardId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new as Task : task
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user?.id, taskboardId, loadTasks]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...tasks];

    // Apply tag filter
    if (preferences.taskBoard.filterTags.length > 0) {
      result = result.filter(task => 
        task.tags?.some(tag => preferences.taskBoard.filterTags.includes(tag))
      );
    }

    // Apply sorting
    switch (preferences.taskBoard.sortOrder) {
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'dueDate':
        result.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
        break;
      case 'created':
        result.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      default: // position
        result.sort((a, b) => a.position - b.position);
    }

    setFilteredTasks(result);
  }, [tasks, preferences.taskBoard.filterTags, preferences.taskBoard.sortOrder]);

  // Handle drag and drop with immediate persistence
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || !user?.id) return;

    const task = tasks.find(t => t.id === draggedTask);
    if (!task || task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === draggedTask ? { ...t, status: newStatus } : t
    ));

    try {
      // Persist to database immediately
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggedTask)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error updating task:', err);
      // Revert optimistic update on error
      setTasks(prev => prev.map(t => 
        t.id === draggedTask ? task : t
      ));
      setError('Failed to update task');
    }

    setDraggedTask(null);
  };

  // Toggle card details view
  const toggleCardDetails = async () => {
    const newValue = !preferences.taskBoard.showCardDetails;
    await updatePreference('taskBoard', 'showCardDetails', newValue);
  };

  // Toggle compact view
  const toggleCompactView = async () => {
    const newValue = !preferences.taskBoard.compactView;
    await updatePreference('taskBoard', 'compactView', newValue);
  };

  // Toggle AI insights
  const toggleAIInsights = async () => {
    const newValue = !preferences.taskBoard.showAIInsights;
    await updatePreference('taskBoard', 'showAIInsights', newValue);
  };

  // Toggle column visibility
  const toggleColumn = async (columnId: string) => {
    const newVisibility = {
      ...preferences.taskBoard.columnVisibility,
      [columnId]: !preferences.taskBoard.columnVisibility[columnId]
    };
    await updatePreference('taskBoard', 'columnVisibility', newVisibility);
  };

  // Change sort order
  const changeSortOrder = async (order: 'position' | 'priority' | 'dueDate' | 'created') => {
    await updatePreference('taskBoard', 'sortOrder', order);
  };

  // Get tasks for a specific status column
  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  if (!taskboardId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a taskboard to view tasks
      </div>
    );
  }

  if (loading || prefsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Control Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* View Toggle Buttons */}
            <button
              onClick={toggleCardDetails}
              className={clsx(
                'px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors',
                preferences.taskBoard.showCardDetails
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}
              title="Toggle card details"
            >
              {preferences.taskBoard.showCardDetails ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="text-sm">Details</span>
            </button>

            <button
              onClick={toggleCompactView}
              className={clsx(
                'px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors',
                preferences.taskBoard.compactView
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}
              title="Toggle compact view"
            >
              {preferences.taskBoard.compactView ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              <span className="text-sm">Compact</span>
            </button>

            <button
              onClick={toggleAIInsights}
              className={clsx(
                'px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors',
                preferences.taskBoard.showAIInsights
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}
              title="Toggle AI insights"
            >
              <Brain className="h-4 w-4" />
              <span className="text-sm">AI Insights</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={preferences.taskBoard.sortOrder}
                onChange={(e) => changeSortOrder(e.target.value as any)}
                className="pl-8 pr-4 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm appearance-none cursor-pointer"
              >
                <option value="position">Position</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="created">Created</option>
              </select>
              <SortAsc className="absolute left-2 top-2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettingsPanel && (
          <div className="absolute right-4 top-14 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-64">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Column Visibility</h3>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-2">
              {COLUMN_CONFIG.map(column => (
                <label key={column.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.taskBoard.columnVisibility[column.id]}
                    onChange={() => toggleColumn(column.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{column.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-4 p-4 h-full overflow-x-auto">
        {COLUMN_CONFIG.filter(col => preferences.taskBoard.columnVisibility[col.id]).map(column => (
          <div
            key={column.id}
            className={clsx(
              'flex-1 min-w-[280px] rounded-lg p-3',
              column.color
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                {column.title}
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getTasksByStatus(column.id).length}
              </span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              {getTasksByStatus(column.id).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showDetails={preferences.taskBoard.showCardDetails}
                  compact={preferences.taskBoard.compactView}
                  showAIInsights={preferences.taskBoard.showAIInsights}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  showDetails: boolean;
  compact: boolean;
  showAIInsights: boolean;
  onDragStart: (e: React.DragEvent) => void;
}

function TaskCard({ task, showDetails, compact, showAIInsights, onDragStart }: TaskCardProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent': return 'border-l-4 border-red-500';
      case 'high': return 'border-l-4 border-orange-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-400';
    }
  };

  const getEnergyIcon = () => {
    switch (task.estimated_energy) {
      case 'XS': return '⚡';
      case 'S': return '⚡⚡';
      case 'M': return '⚡⚡⚡';
      case 'H': return '⚡⚡⚡⚡';
      case 'XL': return '⚡⚡⚡⚡⚡';
      default: return '';
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-move',
        getPriorityColor(),
        compact ? 'p-2' : 'p-3'
      )}
    >
      <h4 className={clsx(
        'font-medium text-gray-800 dark:text-gray-200',
        compact ? 'text-sm' : 'text-base'
      )}>
        {task.title}
      </h4>

      {showDetails && !compact && (
        <>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              {task.estimated_energy && (
                <span className="text-xs" title={`Energy: ${task.estimated_energy}`}>
                  {getEnergyIcon()}
                </span>
              )}
              
              {task.due_date && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {showAIInsights && task.ai_suggested && (
              <Brain className="h-3 w-3 text-purple-500" title="AI Suggested" />
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}