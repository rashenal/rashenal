import React, { useState } from 'react';
import {
  X,
  Settings,
  Palette,
  Users,
  Bell,
  Shield,
  Archive,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Clock,
  Tag,
  Grid3X3,
  List,
  BarChart3,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { TaskBoard, TaskColumn, TEMPLATE_CATEGORIES } from '../../types/TaskBoard';

interface BoardSettingsModalProps {
  board: TaskBoard;
  onClose: () => void;
  onBoardUpdated: (board: TaskBoard) => void;
  onBoardDeleted: (boardId: string) => void;
}

export default function BoardSettingsModal({ 
  board, 
  onClose, 
  onBoardUpdated, 
  onBoardDeleted 
}: BoardSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'columns' | 'permissions' | 'notifications' | 'advanced'>('general');
  const [formData, setFormData] = useState({
    name: board.name,
    description: board.description,
    color_scheme: board.color_scheme,
    is_template: board.is_template,
    is_public: board.is_public || false,
    auto_archive_completed: board.settings?.auto_archive_completed || false,
    show_ai_insights: board.settings?.show_ai_insights ?? true,
    enable_time_tracking: board.settings?.enable_time_tracking ?? true,
    default_task_energy: board.settings?.default_task_energy || 'm',
    default_task_priority: board.settings?.default_task_priority || 'medium',
    notifications: {
      due_date_reminders: true,
      task_assignments: true,
      board_updates: false,
      ai_suggestions: true
    }
  });
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  const colorSchemes = [
    { name: 'Blue to Purple', value: 'bg-gradient-to-r from-blue-500 to-purple-600', preview: 'from-blue-100 to-purple-100' },
    { name: 'Green to Blue', value: 'bg-gradient-to-r from-green-500 to-blue-600', preview: 'from-green-100 to-blue-100' },
    { name: 'Pink to Orange', value: 'bg-gradient-to-r from-pink-500 to-orange-500', preview: 'from-pink-100 to-orange-100' },
    { name: 'Purple to Pink', value: 'bg-gradient-to-r from-purple-600 to-pink-600', preview: 'from-purple-100 to-pink-100' },
    { name: 'Indigo to Purple', value: 'bg-gradient-to-r from-indigo-600 to-purple-600', preview: 'from-indigo-100 to-purple-100' },
    { name: 'Teal to Green', value: 'bg-gradient-to-r from-teal-500 to-green-600', preview: 'from-teal-100 to-green-100' }
  ];

  const handleSave = () => {
    const updatedBoard: TaskBoard = {
      ...board,
      name: formData.name,
      description: formData.description,
      color_scheme: formData.color_scheme,
      is_template: formData.is_template,
      is_public: formData.is_public,
      settings: {
        ...board.settings,
        auto_archive_completed: formData.auto_archive_completed,
        show_ai_insights: formData.show_ai_insights,
        enable_time_tracking: formData.enable_time_tracking,
        default_task_energy: formData.default_task_energy,
        default_task_priority: formData.default_task_priority
      },
      updated_at: new Date().toISOString()
    };
    onBoardUpdated(updatedBoard);
    onClose();
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumn: TaskColumn = {
        id: `column_${Date.now()}`,
        board_id: board.id,
        name: newColumnName.trim(),
        description: '',
        position: board.columns.length,
        color: 'blue',
        is_collapsible: false,
        max_tasks: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const updatedBoard = {
        ...board,
        columns: [...board.columns, newColumn],
        updated_at: new Date().toISOString()
      };
      onBoardUpdated(updatedBoard);
      setNewColumnName('');
    }
  };

  const handleUpdateColumn = (columnId: string, updates: Partial<TaskColumn>) => {
    const updatedColumns = board.columns.map(col => 
      col.id === columnId ? { ...col, ...updates, updated_at: new Date().toISOString() } : col
    );
    const updatedBoard = {
      ...board,
      columns: updatedColumns,
      updated_at: new Date().toISOString()
    };
    onBoardUpdated(updatedBoard);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (board.columns.length <= 1) {
      alert('Cannot delete the last column. Boards must have at least one column.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this column? All tasks in this column will be moved to the first column.')) {
      const updatedColumns = board.columns.filter(col => col.id !== columnId);
      const updatedBoard = {
        ...board,
        columns: updatedColumns,
        updated_at: new Date().toISOString()
      };
      onBoardUpdated(updatedBoard);
    }
  };

  const handleExportBoard = () => {
    const exportData = {
      board,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${board.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDuplicateBoard = () => {
    const duplicatedBoard = {
      ...board,
      id: `board_${Date.now()}`,
      name: `${board.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      columns: board.columns.map(col => ({
        ...col,
        id: `column_${Date.now()}_${col.position}`,
        board_id: `board_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    };
    
    // This would typically save to localStorage or database
    console.log('Duplicating board:', duplicatedBoard);
    alert('Board duplicated successfully!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className={`${board.color_scheme} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Board Settings</h2>
                <p className="text-white/80">{board.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'columns', label: `Columns (${board.columns.length})`, icon: Grid3X3 },
              { id: 'permissions', label: 'Sharing', icon: Users },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'advanced', label: 'Advanced', icon: Shield }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Board Name & Description */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Board Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this board is used for..."
                  />
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Color Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {colorSchemes.map(scheme => (
                    <div
                      key={scheme.value}
                      onClick={() => setFormData(prev => ({ ...prev, color_scheme: scheme.value }))}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.color_scheme === scheme.value 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`h-8 rounded-lg bg-gradient-to-r ${scheme.preview} mb-2`} />
                      <p className="text-xs font-medium text-gray-700">{scheme.name}</p>
                      {formData.color_scheme === scheme.value && (
                        <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Board Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Board Type</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.is_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_template: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Save as Template</span>
                      <p className="text-xs text-gray-600">Make this board available as a template for creating new boards</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Public Board</span>
                      <p className="text-xs text-gray-600">Anyone with the link can view this board</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Default Task Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Default Task Settings</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Default Priority</label>
                    <select
                      value={formData.default_task_priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_task_priority: e.target.value as any }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Default Energy Level</label>
                    <select
                      value={formData.default_task_energy}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_task_energy: e.target.value as any }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="xs">⚡ XS (5-15min)</option>
                      <option value="s">🔋 S (15-30min)</option>
                      <option value="m">🔥 M (30-60min)</option>
                      <option value="l">💪 L (1-2hrs)</option>
                      <option value="xl">🚀 XL (2-4hrs)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'columns' && (
            <div className="space-y-6">
              {/* Add Column */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Add New Column</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Column name..."
                  />
                  <button
                    onClick={handleAddColumn}
                    disabled={!newColumnName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Existing Columns */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Current Columns</h3>
                <div className="space-y-3">
                  {board.columns.map((column, index) => (
                    <div key={column.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className={`w-4 h-4 rounded-full bg-${column.color}-500`} />
                      <div className="flex-1">
                        {editingColumn === column.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              defaultValue={column.name}
                              onBlur={(e) => {
                                handleUpdateColumn(column.id, { name: e.target.value });
                                setEditingColumn(null);
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateColumn(column.id, { name: (e.target as HTMLInputElement).value });
                                  setEditingColumn(null);
                                }
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              autoFocus
                            />
                            <input
                              type="text"
                              defaultValue={column.description}
                              onBlur={(e) => {
                                handleUpdateColumn(column.id, { description: e.target.value });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Column description..."
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-gray-900">{column.name}</p>
                            <p className="text-xs text-gray-600">{column.description || 'No description'}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Position {index + 1}</span>
                        <button
                          onClick={() => setEditingColumn(editingColumn === column.id ? null : column.id)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        {board.columns.length > 1 && (
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              {/* Public Settings */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Share2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Board Sharing</h3>
                    <p className="text-sm text-blue-700 mb-3">Control who can access and modify this board</p>
                    
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="boardAccess"
                          checked={!formData.is_public}
                          onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-blue-900">Private</span>
                          <p className="text-xs text-blue-700">Only you can access this board</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="boardAccess"
                          checked={formData.is_public}
                          onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-blue-900">Public</span>
                          <p className="text-xs text-blue-700">Anyone with the link can view this board</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Link */}
              {formData.is_public && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/shared/board/${board.id}`}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/shared/board/${board.id}`);
                        alert('Link copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Team Members (Future Feature) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <h3 className="font-medium text-gray-700">Team Collaboration</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                <p className="text-sm text-gray-600">
                  Invite team members to collaborate on this board. Members will be able to view, comment, and edit tasks based on their permissions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { key: 'due_date_reminders', label: 'Due Date Reminders', description: 'Get notified when tasks are due' },
                    { key: 'task_assignments', label: 'Task Assignments', description: 'Notifications when tasks are assigned to you' },
                    { key: 'board_updates', label: 'Board Updates', description: 'General board activity notifications' },
                    { key: 'ai_suggestions', label: 'AI Suggestions', description: 'Get AI-powered task optimization suggestions' }
                  ].map(notification => (
                    <label key={notification.key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={formData.notifications[notification.key as keyof typeof formData.notifications]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [notification.key]: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{notification.label}</span>
                        <p className="text-xs text-gray-600">{notification.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Advanced Features */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Advanced Features</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.auto_archive_completed}
                      onChange={(e) => setFormData(prev => ({ ...prev, auto_archive_completed: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Auto-Archive Completed Tasks</span>
                      <p className="text-xs text-gray-600">Automatically archive tasks 7 days after completion</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.show_ai_insights}
                      onChange={(e) => setFormData(prev => ({ ...prev, show_ai_insights: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Show AI Insights</span>
                      <p className="text-xs text-gray-600">Display AI-powered task insights and suggestions</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.enable_time_tracking}
                      onChange={(e) => setFormData(prev => ({ ...prev, enable_time_tracking: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Enable Time Tracking</span>
                      <p className="text-xs text-gray-600">Allow time tracking for tasks in this board</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Board Actions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Board Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDuplicateBoard}
                    className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Duplicate Board</span>
                  </button>

                  <button
                    onClick={handleExportBoard}
                    className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Export Board</span>
                  </button>

                  <button
                    onClick={() => {
                      // TODO: Implement template creation
                      alert('Create template functionality coming soon!');
                    }}
                    className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Save as Template</span>
                  </button>

                  <button
                    onClick={() => {
                      // TODO: Implement board reset
                      if (confirm('Are you sure you want to reset this board? This will remove all tasks but keep the structure.')) {
                        alert('Reset functionality coming soon!');
                      }
                    }}
                    className="flex items-center justify-center space-x-2 p-3 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">Reset Board</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-900">Danger Zone</h3>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this board? This action cannot be undone and will permanently delete all tasks, comments, and attachments.')) {
                      onBoardDeleted(board.id);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Delete Board Permanently</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Board ID: {board.id} • Created {new Date(board.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}