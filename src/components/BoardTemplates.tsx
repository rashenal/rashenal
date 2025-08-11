import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  ArrowRight,
  Check,
  Users,
  Briefcase,
  Heart,
  GraduationCap,
  Building,
  BookOpen,
  Home,
  TrendingUp,
  Clock,
  Tag
} from 'lucide-react';
import { BoardTemplate, boardTemplates, getBoardTemplatesByCategory, createBoardFromTemplate } from '../lib/board-templates';
import { useUser } from '../contexts/userContext';
import { supabase } from '../lib/supabase';

interface BoardTemplatesProps {
  onTemplateSelected: (templateId: string) => void;
  onClose: () => void;
}

export default function BoardTemplates({ onTemplateSelected, onClose }: BoardTemplatesProps) {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [creating, setCreating] = useState(false);

  const categories = [
    { id: 'all', name: 'All Templates', icon: Sparkles },
    { id: 'lifestyle', name: 'Lifestyle', icon: Heart },
    { id: 'career', name: 'Career', icon: Briefcase },
    { id: 'personal', name: 'Personal', icon: Users },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'education', name: 'Education', icon: GraduationCap }
  ];

  const getFilteredTemplates = () => {
    if (selectedCategory === 'all') {
      return boardTemplates;
    }
    return getBoardTemplatesByCategory(selectedCategory as any);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      lifestyle: 'text-green-600 bg-green-100',
      career: 'text-blue-600 bg-blue-100',
      personal: 'text-purple-600 bg-purple-100',
      business: 'text-indigo-600 bg-indigo-100',
      education: 'text-orange-600 bg-orange-100'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !user) return;

    setCreating(true);
    try {
      // Create the board
      const boardData = createBoardFromTemplate(
        selectedTemplate, 
        user.id, 
        customName.trim() || undefined
      );

      const { data: newBoard, error: boardError } = await supabase
        .from('taskboards')
        .insert([boardData])
        .select()
        .single();

      if (boardError) throw boardError;

      // Create tasks from template
      const tasksData = selectedTemplate.tasks.map(task => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        user_id: user.id,
        taskboard_id: newBoard.id,
        estimated_hours: task.estimatedHours || null,
        tags: task.tags || [],
        position: task.order,
        metadata: {
          template_task: true,
          template_id: selectedTemplate.id
        }
      }));

      if (tasksData.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksData);

        if (tasksError) throw tasksError;
      }

      // Success! Redirect to the new board
      onTemplateSelected(newBoard.id);
      onClose();

    } catch (error) {
      console.error('Error creating board from template:', error);
      alert('Failed to create board from template. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sparkles className="h-6 w-6 text-purple-600 mr-3" />
                Choose a Board Template
              </h2>
              <p className="text-gray-600 mt-1">
                Start with a pre-configured board for common life areas and goals
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Category Sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto">
            {!selectedTemplate ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getFilteredTemplates().map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{template.icon}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Check className="h-3 w-3" />
                            <span>{template.tasks.length} tasks</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {template.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1">
                          {template.tasks.slice(0, 3).map((task, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                            </span>
                          ))}
                          {template.tasks.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{template.tasks.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Template Details & Creation */
              <div className="p-6">
                <div className="mb-6">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-purple-600 hover:text-purple-700 text-sm mb-4"
                  >
                    ← Back to templates
                  </button>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl">{selectedTemplate.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                      <span className={`inline-block px-3 py-1 text-sm rounded-full ${getCategoryColor(selectedTemplate.category)}`}>
                        {selectedTemplate.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{selectedTemplate.description}</p>

                  {/* Custom Name Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Board Name (optional)
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={selectedTemplate.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use the default template name
                    </p>
                  </div>

                  {/* Tasks Preview */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Tasks Included ({selectedTemplate.tasks.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedTemplate.tasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            task.priority === 'HIGH' ? 'bg-red-400' :
                            task.priority === 'MEDIUM' ? 'bg-yellow-400' : 'bg-green-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                              <span className="capitalize">{task.status.toLowerCase().replace('_', ' ')}</span>
                              {task.estimatedHours && (
                                <span>{task.estimatedHours}h</span>
                              )}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Tag className="h-3 w-3" />
                                  <span>{task.tags.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            {task.subtasks && task.subtasks.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                +{task.subtasks.length} subtasks
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      This will create a new board with {selectedTemplate.tasks.length} pre-configured tasks
                    </div>
                    <button
                      onClick={handleCreateFromTemplate}
                      disabled={creating}
                      className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>{creating ? 'Creating...' : 'Create Board'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}