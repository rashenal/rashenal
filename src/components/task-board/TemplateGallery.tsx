import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  Star,
  Users,
  Clock,
  Sparkles,
  Bot,
  ChevronRight,
  Grid3X3,
  Heart,
  Brain,
  Briefcase,
  GraduationCap,
  Dumbbell,
  User,
  TrendingUp,
  Award,
  ArrowRight,
  Play
} from 'lucide-react';
import { BOARD_TEMPLATES, TEMPLATE_CATEGORIES } from '../../data/boardTemplates';
import { TaskBoardTemplate } from '../../types/TaskBoard';

interface TemplateGalleryProps {
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  onCreateBoard: (templateId: string) => void;
}

export default function TemplateGallery({ onClose, onSelectTemplate, onCreateBoard }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskBoardTemplate | null>(null);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = [...BOARD_TEMPLATES];

    // Filter by search query
    if (searchQuery) {
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(template => template.category === selectedCategory);
    }

    // Sort templates
    templates.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usage_count - a.usage_count;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return templates;
  }, [searchQuery, selectedCategory, sortBy]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal': return User;
      case 'professional': return Briefcase;
      case 'wellness': return Dumbbell;
      case 'education': return GraduationCap;
      case 'project_management': return Grid3X3;
      default: return Star;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Template Gallery</h2>
              <p className="text-blue-100">Choose from our curated collection of productivity templates</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50"
            >
              <option value="all">All Categories</option>
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key} className="text-gray-900">
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50"
            >
              <option value="popular" className="text-gray-900">Most Popular</option>
              <option value="rating" className="text-gray-900">Highest Rated</option>
              <option value="recent" className="text-gray-900">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or browse all categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const CategoryIcon = getCategoryIcon(template.category);
                
                return (
                  <div
                    key={template.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    {/* Template Header */}
                    <div className={`h-32 ${template.color_scheme} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute top-4 left-4 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">{template.icon}</span>
                        </div>
                        <div className="text-white">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            <CategoryIcon className="h-3 w-3" />
                            <span>{TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES]?.name}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute top-4 right-4 flex items-center space-x-1 text-white text-sm">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{template.rating}</span>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty_level)}`}>
                          {template.difficulty_level}
                        </div>
                      </div>
                    </div>

                    {/* Template Content */}
                    <div className="p-4">
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {template.description}
                      </p>

                      <div className="space-y-3">
                        {/* Template Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{template.usage_count} users</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{template.estimated_completion_time}</span>
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTemplate(template.id);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                          >
                            <Bot className="h-3 w-3" />
                            <span>Customize with AI</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateBoard(template.id);
                            }}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Use as-is
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Template Details Modal */}
        {selectedTemplate && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              {/* Template Header */}
              <div className={`${selectedTemplate.color_scheme} text-white p-6 relative`}>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                    {selectedTemplate.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h2>
                    <p className="text-blue-100 mb-4">{selectedTemplate.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{selectedTemplate.rating} rating</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{selectedTemplate.usage_count} users</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedTemplate.difficulty_level)}`}>
                        {selectedTemplate.difficulty_level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Columns */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Board Structure</h3>
                    <div className="space-y-2">
                      {selectedTemplate.columns.map((column, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full bg-${column.color}-500`} />
                          <div>
                            <div className="font-medium text-gray-900">{column.name}</div>
                            <div className="text-sm text-gray-600">{column.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample Tasks */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Tasks</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedTemplate.default_tasks.slice(0, 5).map((task, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {task.energy_level.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{task.estimated_duration}m</span>
                          </div>
                        </div>
                      ))}
                      {selectedTemplate.default_tasks.length > 5 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          +{selectedTemplate.default_tasks.length - 5} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Customization Info */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">AI Customization Available</h3>
                  </div>
                  <p className="text-sm text-purple-800 mb-3">
                    Our AI can customize this template based on your specific needs, goals, and context.
                  </p>
                  <div className="text-sm text-purple-700">
                    <strong>Customization areas:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {selectedTemplate.ai_customization_prompts.customization_areas.slice(0, 3).map((area, index) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      onSelectTemplate(selectedTemplate.id);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    <Bot className="h-4 w-4" />
                    <span>Customize with AI</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      onCreateBoard(selectedTemplate.id);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Use Template As-Is
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}