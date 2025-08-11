// components/TaskBoardKanban.tsx
// Enhanced kanban board with smaller cards, tag filtering, and move tasks

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Clock,
  Zap,
  AlertCircle,
  X,
  Save,
  Filter,
  ArrowRightLeft,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import type {
  TaskUI,
  CreateTaskInput,
  UpdateTaskInput,
} from '../lib/database-types';

interface TaskBoardKanbanProps {
  taskboardId?: string;
  taskboardColor?: string;
}

interface Taskboard {
  id: string;
  name: string;
  color: string;
}

const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

export default function TaskBoardKanban({
  taskboardId,
  taskboardColor,
}: TaskBoardKanbanProps) {
  const { user } = useUser();
  const [tasks, setTasks] = useState<TaskUI[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskUI[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [allTaskboards, setAllTaskboards] = useState<Taskboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskUI | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateTaskInput>>({});
  const [showMoveDropdown, setShowMoveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAllTaskboards();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && taskboardId) {
      loadTasks();
    }
  }, [user?.id, taskboardId]);

  useEffect(() => {
    applyTagFilter();
  }, [tasks, selectedTags]);

  const loadAllTaskboards = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('taskboards')
        .select('id, name, color')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error loading taskboards:', error);
      } else {
        setAllTaskboards(data || []);
      }
    } catch (err) {
      console.error('Error loading taskboards:', err);
    }
  };

  const loadTasks = async () => {
    if (!user?.id || !taskboardId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('taskboard_id', taskboardId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
      } else {
        const convertedTasks = (data || []).map(convertToUI);
        setTasks(convertedTasks);

        // Extract unique tags
        const tags = new Set<string>();
        convertedTasks.forEach((task) => {
          if (task.tags) {
            task.tags.forEach((tag) => tags.add(tag));
          }
        });
        setAvailableTags(Array.from(tags).sort());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const convertToUI = (dbTask: any): TaskUI => {
    return {
      ...dbTask,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
      dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
      targetDate: dbTask.target_date ? new Date(dbTask.target_date) : undefined,
      completedAt: dbTask.completed_at
        ? new Date(dbTask.completed_at)
        : undefined,
      plannedStartDate: dbTask.planned_start_date
        ? new Date(dbTask.planned_start_date)
        : undefined,
    };
  };

  const applyTagFilter = () => {
    if (selectedTags.length === 0) {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(
        (task) =>
          task.tags && task.tags.some((tag) => selectedTags.includes(tag))
      );
      setFilteredTasks(filtered);
    }
  };

  const getTasksByStatus = (status: string) => {
    return filteredTasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const moveTaskToBoard = async (taskId: string, targetTaskboardId: string) => {
    if (!user?.id || targetTaskboardId === taskboardId) return;

    try {
      // Get target taskboard to check available statuses
      const currentTask = tasks.find((t) => t.id === taskId);
      if (!currentTask) return;

      // For now, if moving to different board, put in backlog
      // Later we could check if target board has same status
      const newStatus = 'backlog';
      const newPosition = 0; // Put at top of backlog

      const { data, error } = await supabase
        .from('tasks')
        .update({
          taskboard_id: targetTaskboardId,
          status: newStatus,
          position: newPosition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error moving task:', error);
        setError(error.message);
      } else {
        // Remove from current board
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        setShowMoveDropdown(null);

        // Show success message
        const targetBoard = allTaskboards.find(
          (b) => b.id === targetTaskboardId
        );
        alert(`Task moved to "${targetBoard?.name}" successfully!`);
      }
    } catch (err) {
      console.error('Error moving task:', err);
      setError(err instanceof Error ? err.message : 'Failed to move task');
    }
  };

  const createTask = async () => {
    if (!formData.title?.trim() || !user?.id || !taskboardId) {
      alert('Task title is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          taskboard_id: taskboardId,
          title: formData.title,
          description: formData.description || '',
          status: formData.status || 'backlog',
          priority: formData.priority || 'medium',
          category: formData.category || null,
          due_date: formData.due_date || null,
          target_date: formData.target_date || null,
          estimated_time: formData.estimated_time || null,
          estimated_energy: formData.estimated_energy || null,
          owner: formData.owner || null,
          tags: formData.tags || null,
          position: getTasksByStatus(formData.status || 'backlog').length,
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        const newTask = convertToUI(data);
        setTasks((prev) => [...prev, newTask]);
        setShowTaskForm(false);
        setFormData({});

        // Update available tags
        if (newTask.tags) {
          setAvailableTags((prev) => {
            const newTags = new Set([...prev, ...newTask.tags!]);
            return Array.from(newTags).sort();
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const updateTask = async (taskId: string, updates: UpdateTaskInput) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        const updatedTask = convertToUI(data);
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?') || !user?.id) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        setError(error.message);
      } else {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    const newPosition = getTasksByStatus(newStatus).length;

    await updateTask(taskId, {
      status: newStatus as any,
      position: newPosition,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();

    if (!draggedTask) return;
    moveTask(draggedTask, targetStatus);
    setDraggedTask(null);
  };

  const startEdit = (task: TaskUI) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category || '',
      due_date: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      target_date: task.targetDate
        ? task.targetDate.toISOString().split('T')[0]
        : '',
      estimated_time: task.estimated_time || 0,
      estimated_energy: task.estimated_energy || 'M',
      owner: task.owner || '',
      tags: task.tags || [],
    });
  };

  const handleFormSubmit = () => {
    if (!formData.title?.trim()) {
      alert('Task title is required');
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, formData);
      setEditingTask(null);
    } else {
      createTask();
    }
    setFormData({});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!taskboardId) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          Please select a taskboard to view tasks.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 font-medium">Error:</span>
          <span className="text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Task Board</h3>
            <p className="text-gray-600">
              Drag tasks between columns to update status
            </p>
          </div>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  selectedTags.length > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>
                  {selectedTags.length > 0
                    ? `${selectedTags.length} tag(s)`
                    : 'Filter by tags'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showTagFilter && (
                <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        Filter by Tags
                      </span>
                      {selectedTags.length > 0 && (
                        <button
                          onClick={() => setSelectedTags([])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTagFilter(tag)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowTaskForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Active Filter Display */}
      {selectedTags.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filtered by:</span>
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
            >
              <span>{tag}</span>
              <button
                onClick={() => toggleTagFilter(tag)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-6">
        {KANBAN_COLUMNS.map((column) => (
          <div
            key={column.id}
            className={`${column.color} rounded-xl p-4 min-h-96`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{column.title}</h2>
              <span className="bg-white px-2 py-1 rounded-full text-sm text-gray-600">
                {getTasksByStatus(column.id).length}
              </span>
            </div>

            <div className="space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDoubleClick={() => startEdit(task)}
                  className={`bg-white rounded-lg p-3 shadow-sm border-l-4 cursor-move hover:shadow-md transition-all group min-h-[80px] ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {/* Compact Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-2">
                      {/* Task UID */}
                      {task.task_uid && (
                        <div className="text-xs text-gray-500 mb-1 font-mono">
                          {task.task_uid}
                        </div>
                      )}
                      {/* Title */}
                      <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                        {task.title}
                      </h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Move to board dropdown */}
                      {allTaskboards.length > 1 && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMoveDropdown(
                                showMoveDropdown === task.id ? null : task.id
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Move to another board"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                          </button>

                          {showMoveDropdown === task.id && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-32">
                              <div className="p-2 border-b border-gray-200">
                                <span className="text-xs font-medium text-gray-700">
                                  Move to:
                                </span>
                              </div>
                              {allTaskboards
                                .filter((board) => board.id !== taskboardId)
                                .map((board) => (
                                  <button
                                    key={board.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveTaskToBoard(task.id, board.id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: board.color }}
                                    ></div>
                                    <span>{board.name}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(task);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit task"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Compact Metadata */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      {task.estimated_time && (
                        <span className="flex items-center space-x-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{task.estimated_time}h</span>
                        </span>
                      )}
                      {task.ai_suggested && (
                        <Zap
                          className="h-3 w-3 text-purple-500"
                          title="AI Suggested"
                        />
                      )}
                    </div>

                    {task.owner && (
                      <span
                        className="text-gray-500 truncate max-w-16"
                        title={task.owner}
                      >
                        {task.owner}
                      </span>
                    )}
                  </div>

                  {/* Tags - Max 2 */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded"
                        >
                          {tag.length > 8 ? tag.substring(0, 8) + '...' : tag}
                        </span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowTaskForm(false);
                  setEditingTask(null);
                  setFormData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || 'backlog'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as any,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        due_date: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={formData.estimated_time || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimated_time: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Energy Level
                  </label>
                  <select
                    value={formData.estimated_energy || 'M'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimated_energy: e.target.value as any,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="XS">Extra Small (XS)</option>
                    <option value="S">Small (S)</option>
                    <option value="M">Medium (M)</option>
                    <option value="XL">Extra Large (XL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={formData.owner || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        owner: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Task owner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags ? formData.tags.join(', ') : ''}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter((tag) => tag);
                    setFormData((prev) => ({ ...prev, tags }));
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., urgent, frontend, api"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowTaskForm(false);
                    setEditingTask(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFormSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingTask ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showTagFilter || showMoveDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowTagFilter(false);
            setShowMoveDropdown(null);
          }}
        />
      )}
    </div>
  );
}
