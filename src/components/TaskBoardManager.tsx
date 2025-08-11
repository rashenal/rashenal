// components/TaskBoardManager.tsx
// Enhanced with board deletion, color management, and restore functionality

import React, { useState, useEffect } from 'react';
import { Plus, X, Kanban, Trash2, RotateCcw, Palette, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';

interface Taskboard {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface TaskBoardManagerProps {
  currentTaskboardId?: string;
  onTaskboardChange: (taskboardId: string) => void;
}

const BOARD_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
];

export default function TaskBoardManager({
  currentTaskboardId,
  onTaskboardChange,
}: TaskBoardManagerProps) {
  const [taskboards, setTaskboards] = useState<Taskboard[]>([]);
  const [deletedTaskboards, setDeletedTaskboards] = useState<Taskboard[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [newTaskboardName, setNewTaskboardName] = useState('');
  const [newTaskboardDescription, setNewTaskboardDescription] = useState('');
  const [newTaskboardColor, setNewTaskboardColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      loadTaskboards();
      loadDeletedTaskboards();
    }
  }, [user]);

  const loadTaskboards = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const { data, error: queryError } = await supabase
        .from('taskboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
      } else {
        setTaskboards(data || []);

        // Auto-select first taskboard if none selected
        if (!currentTaskboardId && data && data.length > 0) {
          onTaskboardChange(data[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load taskboards');
    }
  };

  const loadDeletedTaskboards = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('taskboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading deleted taskboards:', error);
      } else {
        setDeletedTaskboards(data || []);
      }
    } catch (err) {
      console.error('Error loading deleted taskboards:', err);
    }
  };

  const createTaskboard = async () => {
    if (!newTaskboardName.trim() || !user?.id) {
      alert('Taskboard name is required');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('taskboards')
        .insert({
          user_id: user.id,
          name: newTaskboardName.trim(),
          description: newTaskboardDescription.trim() || null,
          color: newTaskboardColor,
          position: taskboards.length,
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        setTaskboards(prev => [data, ...prev]);
        setNewTaskboardName('');
        setNewTaskboardDescription('');
        setNewTaskboardColor('#3B82F6');
        setShowCreateForm(false);
        onTaskboardChange(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create taskboard');
    } finally {
      setLoading(false);
    }
  };

  const deleteTaskboard = async (taskboardId: string) => {
    const taskboard = taskboards.find(tb => tb.id === taskboardId);
    if (!taskboard) return;

    const confirmMessage = `Are you sure you want to delete "${taskboard.name}"?\n\nThis will hide the board and all its tasks. You can restore it later if needed.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('taskboards')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskboardId)
        .eq('user_id', user?.id);

      if (error) {
        setError(error.message);
      } else {
        // Remove from active taskboards
        setTaskboards(prev => prev.filter(tb => tb.id !== taskboardId));
        
        // Add to deleted taskboards
        setDeletedTaskboards(prev => [{ ...taskboard, is_active: false }, ...prev]);
        
        // If this was the current taskboard, switch to another one
        if (currentTaskboardId === taskboardId && taskboards.length > 1) {
          const nextTaskboard = taskboards.find(tb => tb.id !== taskboardId);
          if (nextTaskboard) {
            onTaskboardChange(nextTaskboard.id);
          }
        }

        alert('Taskboard deleted successfully. You can restore it from the Archive if needed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete taskboard');
    }
  };

  const restoreTaskboard = async (taskboardId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('taskboards')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskboardId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        // Remove from deleted taskboards
        setDeletedTaskboards(prev => prev.filter(tb => tb.id !== taskboardId));
        
        // Add to active taskboards
        setTaskboards(prev => [data, ...prev]);
        
        // Switch to restored taskboard
        onTaskboardChange(data.id);
        
        alert(`"${data.name}" has been restored successfully!`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore taskboard');
    }
  };

  const handleCreateFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskboard();
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Taskboard Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto">
        {taskboards.map((taskboard) => (
          <div key={taskboard.id} className="relative group">
            <button
              onClick={() => onTaskboardChange(taskboard.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors flex items-center space-x-2 ${
                currentTaskboardId === taskboard.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: taskboard.color }}
              />
              <Kanban className="h-4 w-4" />
              <span>{taskboard.name}</span>
            </button>
            
            {/* Delete button (appears on hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTaskboard(taskboard.id);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Delete taskboard"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Add New Taskboard Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-t-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
        >
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Taskboard</span>
          </div>
        </button>

        {/* Archive/Restore Button */}
        {deletedTaskboards.length > 0 && (
          <button
            onClick={() => setShowRestoreDialog(true)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            <div className="flex items-center space-x-2">
              <Archive className="h-4 w-4" />
              <span>Archive ({deletedTaskboards.length})</span>
            </div>
          </button>
        )}
      </div>

      {/* No taskboards message */}
      {taskboards.length === 0 && (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
          <Kanban className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-600 mb-2">No taskboards found</p>
          <p className="text-sm text-gray-500 mb-4">Create your first taskboard to get started with task management!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Taskboard
          </button>
        </div>
      )}

      {/* Create New Taskboard Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Taskboard
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFormSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taskboard Name *
                </label>
                <input
                  type="text"
                  value={newTaskboardName}
                  onChange={(e) => setNewTaskboardName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter taskboard name"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newTaskboardDescription}
                  onChange={(e) => setNewTaskboardDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter taskboard description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BOARD_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewTaskboardColor(color.value)}
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        newTaskboardColor === color.value
                          ? 'border-gray-800 ring-2 ring-gray-300'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newTaskboardName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{loading ? 'Creating...' : 'Create Taskboard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Deleted Taskboards Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Archive className="h-5 w-5" />
                <span>Archive - Deleted Taskboards</span>
              </h3>
              <button
                onClick={() => setShowRestoreDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {deletedTaskboards.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No deleted taskboards</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deletedTaskboards.map((taskboard) => (
                    <div
                      key={taskboard.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: taskboard.color }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{taskboard.name}</h4>
                          {taskboard.description && (
                            <p className="text-sm text-gray-600">{taskboard.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Deleted: {new Date(taskboard.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => restoreTaskboard(taskboard.id)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}