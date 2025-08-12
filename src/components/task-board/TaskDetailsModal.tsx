import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  Tag,
  Paperclip,
  MessageSquare,
  User,
  Target,
  Zap,
  AlertTriangle,
  Plus,
  Edit3,
  Save,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Brain,
  Star,
  Heart,
  DollarSign,
  Upload,
  File,
  Image,
  FileText,
  Download,
  Link,
  ArrowRight,
  Timer,
  BarChart3
} from 'lucide-react';
import { Task, TaskBoard, SubTask, ENERGY_LEVELS, PRIORITY_LEVELS } from '../../types/TaskBoard';
import { EnhancedTaskService } from '../../lib/enhanced-task-service';
import TaskDependenciesModal from './TaskDependenciesModal';

interface TaskDetailsModalProps {
  task: Task;
  board: TaskBoard;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function TaskDetailsModal({ 
  task, 
  board, 
  onClose, 
  onTaskUpdated, 
  onTaskDeleted 
}: TaskDetailsModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    energy_level: task.energy_level,
    estimated_duration: task.estimated_duration,
    due_date: task.due_date || '',
    tags: [...task.tags],
    business_value: task.business_value,
    personal_value: task.personal_value,
    column_id: task.column_id
  });
  const [newTag, setNewTag] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [showDependenciesModal, setShowDependenciesModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'comments' | 'attachments' | 'time' | 'ai' | 'dependencies'>('details');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleSave = () => {
    const updatedTask: Task = {
      ...task,
      ...formData,
      tags: formData.tags,
      updated_at: new Date().toISOString()
    };
    onTaskUpdated(updatedTask);
    setEditMode(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        // Save comment to database
        const { data: savedComment, error } = await EnhancedTaskService.addComment(
          task.id,
          newComment.trim()
        );
        
        if (error) {
          console.error('Failed to add comment:', error);
          // You might want to show an error toast here
          return;
        }

        // Update local state with the saved comment
        const updatedTask = {
          ...task,
          comments: [
            ...task.comments,
            {
              id: savedComment?.id || `comment_${Date.now()}`,
              author: savedComment?.user_name || 'Current User',
              content: savedComment?.content || newComment.trim(),
              created_at: savedComment?.created_at || new Date().toISOString()
            }
          ],
          updated_at: new Date().toISOString()
        };
        
        onTaskUpdated(updatedTask);
        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
        // You might want to show an error toast here
      }
    }
  };

  const handleAddSubtask = async () => {
    if (newSubtask.trim()) {
      try {
        // Save subtask to database
        const { data: savedSubtask, error } = await EnhancedTaskService.addSubtask(
          task.id,
          newSubtask.trim()
        );
        
        if (error) {
          console.error('Failed to add subtask:', error);
          return;
        }

        // Update local state with the saved subtask
        const updatedTask = {
          ...task,
          sub_tasks: [
            ...task.sub_tasks,
            {
              id: savedSubtask?.id || `subtask_${Date.now()}`,
              task_id: task.id,
              title: savedSubtask?.title || newSubtask.trim(),
              description: savedSubtask?.description || '',
              is_completed: savedSubtask?.is_completed || false,
              position: savedSubtask?.position || task.sub_tasks.length,
              created_at: savedSubtask?.created_at || new Date().toISOString(),
              updated_at: savedSubtask?.updated_at || new Date().toISOString()
            }
          ],
          updated_at: new Date().toISOString()
        };
        
        onTaskUpdated(updatedTask);
        setNewSubtask('');
      } catch (error) {
        console.error('Error adding subtask:', error);
      }
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = task.sub_tasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    try {
      // Toggle in database
      const { error } = await EnhancedTaskService.toggleSubtask(
        subtaskId,
        !subtask.is_completed
      );
      
      if (error) {
        console.error('Failed to toggle subtask:', error);
        return;
      }

      // Update local state
      const updatedSubtasks = task.sub_tasks.map(st => 
        st.id === subtaskId ? { ...st, is_completed: !st.is_completed, updated_at: new Date().toISOString() } : st
      );
      const completedCount = updatedSubtasks.filter(st => st.is_completed).length;
      const progress = updatedSubtasks.length > 0 ? (completedCount / updatedSubtasks.length) * 100 : 0;
      
      const updatedTask = {
        ...task,
        sub_tasks: updatedSubtasks,
        progress_percentage: Math.round(progress),
        updated_at: new Date().toISOString()
      };
      onTaskUpdated(updatedTask);
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      // Stop timer and save time entry
      const updatedTask = {
        ...task,
        time_tracking: [
          ...task.time_tracking,
          {
            id: `time_${Date.now()}`,
            task_id: task.id,
            start_time: new Date(Date.now() - currentSessionTime * 1000).toISOString(),
            end_time: new Date().toISOString(),
            duration_minutes: Math.round(currentSessionTime / 60),
            description: 'Work session',
            created_at: new Date().toISOString()
          }
        ],
        updated_at: new Date().toISOString()
      };
      onTaskUpdated(updatedTask);
      setCurrentSessionTime(0);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTrackedTime = task.time_tracking.reduce((total, entry) => total + entry.duration_minutes, 0);

  const priorityConfig = PRIORITY_LEVELS[task.priority];
  const energyConfig = ENERGY_LEVELS[task.energy_level];

  const completedSubtasks = task.sub_tasks.filter(st => st.is_completed).length;
  const totalSubtasks = task.sub_tasks.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none w-full"
                />
              ) : (
                <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              )}
              <div className="flex items-center space-x-3 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  task.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  'bg-green-100 text-green-700 border-green-200'
                }`}>
                  {priorityConfig.icon} {priorityConfig.name}
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {energyConfig.icon} {energyConfig.name}
                </span>
                <span className="text-xs text-gray-500">
                  Created {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-lg transition-colors ${
                  isTimerRunning 
                    ? 'text-red-600 hover:bg-red-100' 
                    : 'text-green-600 hover:bg-green-100'
                }`}
              >
                {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Timer Display */}
          {(isTimerRunning || currentSessionTime > 0) && (
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Session</span>
                <span className={`font-mono text-lg ${isTimerRunning ? 'text-green-600' : 'text-gray-900'}`}>
                  {formatTime(currentSessionTime)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details', icon: Edit3 },
              { id: 'subtasks', label: `Subtasks (${completedSubtasks}/${totalSubtasks})`, icon: CheckCircle2 },
              { id: 'comments', label: `Comments (${task.comments.length})`, icon: MessageSquare },
              { id: 'attachments', label: `Files (${task.attachments.length})`, icon: Paperclip },
              { id: 'dependencies', label: 'Dependencies', icon: Link },
              { id: 'time', label: `Time (${totalTrackedTime}m)`, icon: Timer },
              { id: 'ai', label: 'AI Insights', icon: Brain }
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
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {editMode ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add task description..."
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {task.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Task Properties Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Priority & Energy */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    {editMode ? (
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
                          <option key={key} value={key}>
                            {level.icon} {level.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{priorityConfig.icon}</span>
                        <span>{priorityConfig.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
                    {editMode ? (
                      <select
                        value={formData.energy_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, energy_level: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.entries(ENERGY_LEVELS).map(([key, level]) => (
                          <option key={key} value={key}>
                            {level.icon} {level.name} ({level.duration})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{energyConfig.icon}</span>
                        <span>{energyConfig.name} ({energyConfig.duration})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration & Due Date */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    {editMode ? (
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{task.estimated_duration} minutes</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Value Sliders */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Value</label>
                  {editMode ? (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.business_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, business_value: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low</span>
                        <span>{formData.business_value}%</span>
                        <span>High</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${task.business_value}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{task.business_value}%</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Value</label>
                  {editMode ? (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.personal_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, personal_value: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low</span>
                        <span>{formData.personal_value}%</span>
                        <span>High</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-pink-500 h-2 rounded-full" 
                          style={{ width: `${task.personal_value}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{task.personal_value}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                {editMode && (
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Add tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(editMode ? formData.tags : task.tags).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subtasks' && (
            <div className="space-y-4">
              {/* Add Subtask */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add subtask..."
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Bar */}
              {task.sub_tasks.length > 0 && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">
                      {completedSubtasks} of {totalSubtasks} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtask List */}
              <div className="space-y-2">
                {task.sub_tasks.map(subtask => (
                  <div
                    key={subtask.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                      subtask.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className="flex-shrink-0"
                    >
                      {subtask.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-green-600 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${subtask.is_completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                        {subtask.title}
                      </p>
                      {subtask.description && (
                        <p className="text-xs text-gray-600 mt-1">{subtask.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {task.sub_tasks.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No subtasks yet. Add one above to break this task into smaller steps.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a comment..."
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {task.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
                {task.comments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No comments yet. Add one above to start a discussion.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Choose Files
                </button>
              </div>

              {/* Attachments List */}
              <div className="space-y-2">
                {task.attachments.map(attachment => (
                  <div key={attachment.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      {attachment.file_type.startsWith('image/') ? (
                        <Image className="h-8 w-8 text-blue-600" />
                      ) : (
                        <File className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                      <p className="text-xs text-gray-600">
                        {attachment.file_size} • Uploaded {new Date(attachment.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {task.attachments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No files attached yet. Upload files above.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div className="space-y-6">
              {/* Time Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalTrackedTime}m</div>
                  <div className="text-sm text-blue-700">Total Tracked</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{task.estimated_duration}m</div>
                  <div className="text-sm text-green-700">Estimated</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {totalTrackedTime > 0 ? Math.round((totalTrackedTime / task.estimated_duration) * 100) : 0}%
                  </div>
                  <div className="text-sm text-purple-700">Progress</div>
                </div>
              </div>

              {/* Current Session */}
              {isTimerRunning && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-700 font-medium">Active Session</span>
                    </div>
                    <span className="text-green-700 font-mono text-lg">
                      {formatTime(currentSessionTime)}
                    </span>
                  </div>
                </div>
              )}

              {/* Time Entries */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Time Entries</h4>
                <div className="space-y-2">
                  {task.time_tracking.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-900">{entry.description || 'Work session'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.start_time).toLocaleString()} - {new Date(entry.end_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{entry.duration_minutes}m</span>
                    </div>
                  ))}
                  {task.time_tracking.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No time entries yet. Start the timer to track your work.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="space-y-6">
              {/* Dependencies Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Link className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Task Dependencies</h3>
                  </div>
                  <button
                    onClick={() => setShowDependenciesModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Manage Dependencies
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${
                      task.dependency_status === 'blocked' ? 'text-red-600' :
                      task.dependency_status === 'ready' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {task.dependency_status === 'blocked' ? 'Blocked' :
                       task.dependency_status === 'ready' ? 'Ready' :
                       'Independent'}
                    </div>
                    <div className="text-sm text-gray-600">Current Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {task.parent_id && task.parent_id !== task.id ? '1' : '0'}
                    </div>
                    <div className="text-sm text-gray-600">Parent Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {task.has_children ? '1+' : '0'}
                    </div>
                    <div className="text-sm text-gray-600">Child Tasks</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDependenciesModal(true)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Link className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Manage Dependencies</div>
                        <div className="text-sm text-gray-500">Set parent tasks or view dependent tasks</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* AI Completion Probability */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-900">AI Task Analysis</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {task.ai_insights.completion_probability}%
                    </div>
                    <div className="text-sm text-purple-700">Completion Probability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {task.ai_insights.estimated_effort_accuracy}%
                    </div>
                    <div className="text-sm text-blue-700">Effort Accuracy</div>
                  </div>
                </div>

                {task.ai_insights.best_time_to_work && (
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Optimal Work Time</h4>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{task.ai_insights.best_time_to_work.preferred_time_slots.join(', ')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-gray-500" />
                        <span>{task.ai_insights.best_time_to_work.focus_requirements} focus</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Optimization Suggestions */}
              {task.ai_insights.optimization_suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">💡 Optimization Suggestions</h4>
                  <div className="space-y-2">
                    {task.ai_insights.optimization_suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Potential Blockers */}
              {task.ai_insights.potential_blockers.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">⚠️ Potential Blockers</h4>
                  <div className="space-y-2">
                    {task.ai_insights.potential_blockers.map((blocker, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{blocker}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Tasks */}
              {task.ai_insights.similar_tasks.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">🔗 Similar Tasks</h4>
                  <div className="space-y-2">
                    {task.ai_insights.similar_tasks.map((similarTask, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-900 font-medium">{similarTask.title}</p>
                        <p className="text-xs text-gray-600">
                          Similarity: {Math.round(similarTask.similarity_score * 100)}% • 
                          Completed in {similarTask.actual_duration}m
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Last updated: {new Date(task.updated_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onTaskDeleted(task.id);
                  }
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dependencies Modal */}
      {showDependenciesModal && (
        <TaskDependenciesModal
          task={task}
          allTasks={board.tasks}
          onClose={() => setShowDependenciesModal(false)}
          onTaskUpdated={onTaskUpdated}
        />
      )}
    </div>
  );
}