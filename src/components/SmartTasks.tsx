import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  Users,
  Target,
  RotateCcw,
  X,
  Save,
  Kanban,
  Loader,
} from 'lucide-react';
import { useUser } from '@contexts/userContext';
import { supabase } from '../lib/supabase'; // Adjust import path as needed

// Types
interface WorkItem {
  id: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  owner?: string;
  estimatedHours?: number;
  attachments: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

interface Comment {
  id: string;
  text: string;
  commenter: string;
  createdAt: Date;
}

// Database mapping functions
const mapDbToWorkItem = (dbTask: any): WorkItem => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description || '',
  status: dbTask.status?.toUpperCase() || 'TODO',
  priority: dbTask.priority?.toUpperCase() || 'MEDIUM',
  owner: dbTask.category || '', // Using category field as owner for now
  estimatedHours: 0, // Not in current DB schema
  attachments: [], // Not in current DB schema
  comments: [], // Not in current DB schema
  createdAt: new Date(dbTask.created_at),
  updatedAt: new Date(dbTask.updated_at),
  order: dbTask.position || 0,
});

const mapWorkItemToDb = (workItem: Partial<WorkItem>, userId: string) => ({
  title: workItem.title,
  description: workItem.description,
  status: workItem.status?.toLowerCase(),
  priority: workItem.priority?.toLowerCase(),
  category: workItem.owner || null,
  position: workItem.order || 0,
  user_id: userId,
});

export default function SmartTasks() {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [recycledItems, setRecycledItems] = useState<WorkItem[]>([]);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<WorkItem>>({});

  const columns = [
    { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-100' },
    { id: 'TODO', title: 'To Do', color: 'bg-blue-100' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-100' },
    { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-100' },
    { id: 'DONE', title: 'Done', color: 'bg-green-100' },
  ];

  // Load tasks from database
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;

      const mappedTasks = data?.map(mapDbToWorkItem) || [];
      setWorkItems(mappedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      alert('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const generateId = () =>
    `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getItemsByStatus = (status: string) => {
    return workItems
      .filter((item) => item.status === status)
      .sort((a, b) => a.order - b.order);
  };

  // Database CRUD operations
  const createWorkItem = async (data: Partial<WorkItem>) => {
    if (!user) return;

    try {
      const newItemData = mapWorkItemToDb(
        {
          ...data,
          status: 'BACKLOG',
          order: getItemsByStatus('BACKLOG').length,
        },
        user.id
      );

      const { data: dbData, error } = await supabase
        .from('tasks')
        .insert([newItemData])
        .select()
        .single();

      if (error) throw error;

      const newItem = mapDbToWorkItem(dbData);
      setWorkItems((prev) => [...prev, newItem]);
      setShowNewItemForm(false);
      setFormData({});
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>) => {
    if (!user) return;

    try {
      const updateData = mapWorkItemToDb(updates, user.id);

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setWorkItems((prev) =>
        prev.map((item) => (item.id === id ? mapDbToWorkItem(data) : item))
      );
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const deleteWorkItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      const item = workItems.find((w) => w.id === id);
      if (item) {
        setRecycledItems((prev) => [...prev, item]);
        setWorkItems((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const restoreWorkItem = async (item: WorkItem) => {
    if (!user) return;

    try {
      const restoreData = mapWorkItemToDb(item, user.id);

      const { data, error } = await supabase
        .from('tasks')
        .insert([restoreData])
        .select()
        .single();

      if (error) throw error;

      const restoredItem = mapDbToWorkItem(data);
      setWorkItems((prev) => [...prev, restoredItem]);
      setRecycledItems((prev) => prev.filter((w) => w.id !== item.id));
    } catch (error) {
      console.error('Error restoring task:', error);
      alert('Failed to restore task. Please try again.');
    }
  };

  const moveWorkItem = async (id: string, newStatus: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus.toLowerCase(),
          updated_at: new Date().toISOString(),
          ...(newStatus === 'DONE'
            ? { completed_at: new Date().toISOString() }
            : { completed_at: null }),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWorkItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return { ...item, status: newStatus as any, updatedAt: new Date() };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error moving task:', error);
      alert('Failed to move task. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();

    if (!draggedItem) return;

    moveWorkItem(draggedItem, targetStatus);
    setDraggedItem(null);
  };

  // Form handlers
  const handleFormSubmit = () => {
    if (!formData.title || !formData.description) {
      alert('Title and description are required');
      return;
    }

    if (editingItem) {
      updateWorkItem(editingItem.id, formData);
    } else {
      createWorkItem(formData);
    }
  };

  const startEdit = (item: WorkItem) => {
    setEditingItem(item);
    setFormData(item);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-4 min-h-96 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Kanban className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Smart Tasks</h2>
          <p className="text-gray-600 mb-6">
            Please log in to access your personal task management dashboard.
          </p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            Log In to Continue
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-4 min-h-96 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Loader className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Kanban className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Smart Tasks
                </h1>
                <p className="text-gray-600">AI-Powered Project Management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRecycleBin(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Recycle Bin ({recycledItems.length})</span>
              </button>
              <button
                onClick={() => setShowNewItemForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-5 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`${column.color} rounded-xl p-4 min-h-96`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">{column.title}</h2>
                <span className="bg-white px-2 py-1 rounded-full text-sm text-gray-600">
                  {getItemsByStatus(column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {getItemsByStatus(column.id).map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDoubleClick={() => startEdit(item)}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">
                        {item.title}
                      </h3>
                      <div className="flex space-x-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <button
                          onClick={() => deleteWorkItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p
                      className="text-gray-600 text-xs mb-3 overflow-hidden"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {item.estimatedHours && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.estimatedHours}h</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        {item.comments.length > 0 && (
                          <span
                            className="flex items-center space-x-1"
                            title="Comments"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{item.comments.length}</span>
                          </span>
                        )}
                        {item.attachments.length > 0 && (
                          <span
                            className="flex items-center space-x-1"
                            title="Attachments"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{item.attachments.length}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {item.owner && (
                      <div className="mt-2 flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {item.owner}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* New/Edit Work Item Modal */}
        {(showNewItemForm || editingItem) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingItem ? 'Edit Task' : 'Create New Task'}
                </h2>
                <button
                  onClick={() => {
                    setShowNewItemForm(false);
                    setEditingItem(null);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority || 'MEDIUM'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: e.target.value as any,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimatedHours || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estimatedHours: Number(e.target.value),
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowNewItemForm(false);
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recycle Bin */}
        {showRecycleBin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recycle Bin</h2>
                <button
                  onClick={() => setShowRecycleBin(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {recycledItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No deleted items
                </p>
              ) : (
                <div className="space-y-3">
                  {recycledItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Deleted: {item.updatedAt?.toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreWorkItem(item)}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
