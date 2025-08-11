import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Filter,
  Star,
  Users,
  Clock,
  Plus,
  Bot,
  Grid3X3,
  Briefcase,
  GraduationCap,
  Dumbbell,
  User,
  FileText,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  PlusCircle,
  Layout
} from 'lucide-react';
import { BOARD_TEMPLATES, TEMPLATE_CATEGORIES } from '../../data/boardTemplates';
import { TaskBoardTemplate } from '../../types/TaskBoard';

interface AccessibleTemplateGalleryProps {
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  onCreateBoard: (templateId: string) => void;
  onCreateEmptyBoard: () => void;
}

// Difficulty level icons for better accessibility
const DIFFICULTY_ICONS = {
  beginner: { icon: '⭐', label: 'Beginner - Easy to start', count: 1 },
  intermediate: { icon: '⭐⭐', label: 'Intermediate - Some experience needed', count: 2 },
  advanced: { icon: '⭐⭐⭐', label: 'Advanced - Complex workflow', count: 3 }
};

export default function AccessibleTemplateGallery({ 
  onClose, 
  onSelectTemplate, 
  onCreateBoard,
  onCreateEmptyBoard 
}: AccessibleTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskBoardTemplate | null>(null);
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrastMode') === 'true';
  });

  // Apply high contrast mode
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('highContrastMode', highContrast.toString());
  }, [highContrast]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = [...BOARD_TEMPLATES];

    if (searchQuery) {
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      templates = templates.filter(template => template.category === selectedCategory);
    }

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

  const handleCreateEmpty = () => {
    onCreateEmptyBoard();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-gallery-title"
    >
      <div className={`bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl ${
        highContrast ? 'border-4 border-black' : ''
      }`}>
        
        {/* Skip to content link for screen readers */}
        <a href="#template-grid" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded">
          Skip to templates
        </a>
        
        {/* Header with proper contrast */}
        <header className={`${
          highContrast 
            ? 'bg-gray-900 text-white border-b-4 border-gray-700' 
            : 'bg-gray-800 text-white'
        } p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 id="template-gallery-title" className="text-2xl font-bold mb-2">
                Create New Board
              </h1>
              <p className={`${highContrast ? 'text-gray-100' : 'text-gray-300'}`}>
                Start from scratch or choose a template to get started quickly
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* High Contrast Toggle */}
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`p-2 rounded-lg transition-colors ${
                  highContrast 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
                title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
              >
                {highContrast ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  highContrast 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                aria-label="Close template gallery"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Primary Actions - Create Empty Board */}
        <section className={`${
          highContrast ? 'bg-gray-100 border-b-2 border-gray-400' : 'bg-gray-50 border-b'
        } p-6`}>
          <div className="flex flex-wrap gap-4">
            {/* Create Empty Board - Primary Option */}
            <button
              onClick={handleCreateEmpty}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 ${
                highContrast 
                  ? 'bg-black text-white hover:bg-gray-800 focus:ring-gray-600 border-2 border-black' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg focus:ring-blue-500'
              }`}
              aria-label="Create an empty board without a template"
            >
              <PlusCircle className="h-6 w-6" />
              <div className="text-left">
                <span className="block font-semibold text-lg">Create Empty Board</span>
                <span className={`block text-sm ${highContrast ? 'text-gray-300' : 'text-blue-100'}`}>
                  Start from scratch with a blank canvas
                </span>
              </div>
            </button>

            {/* Use Template Option */}
            <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl ${
              highContrast ? 'bg-white border-2 border-gray-600' : 'bg-white border border-gray-300'
            }`}>
              <Layout className="h-6 w-6 text-gray-600" />
              <div className="text-left">
                <span className="block font-semibold text-lg text-gray-900">Or Choose a Template</span>
                <span className="block text-sm text-gray-600">
                  Pre-built boards with tasks ready to go
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="p-6 border-b" aria-label="Search and filter templates">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <label htmlFor="template-search" className="sr-only">Search templates</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                id="template-search"
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                  highContrast 
                    ? 'bg-white border-2 border-black text-black focus:ring-black' 
                    : 'border border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
                aria-label="Search templates by name, description, or tags"
              />
            </div>

            <div>
              <label htmlFor="category-filter" className="sr-only">Filter by category</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                  highContrast 
                    ? 'bg-white border-2 border-black text-black focus:ring-black' 
                    : 'border border-gray-300 focus:ring-blue-500'
                }`}
                aria-label="Filter templates by category"
              >
                <option value="all">All Categories</option>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort-by" className="sr-only">Sort templates</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                  highContrast 
                    ? 'bg-white border-2 border-black text-black focus:ring-black' 
                    : 'border border-gray-300 focus:ring-blue-500'
                }`}
                aria-label="Sort templates"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>

          {/* Results count for screen readers */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {filteredTemplates.length} templates found
          </div>
        </section>

        {/* Template Grid */}
        <main 
          id="template-grid" 
          className="p-6 overflow-y-auto max-h-[50vh]"
          aria-label="Available templates"
        >
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12" role="status">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h2>
              <p className="text-gray-600">Try adjusting your search criteria or browse all categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Start from Scratch Card - Always First */}
              <article 
                className={`rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer focus-within:ring-4 ${
                  highContrast 
                    ? 'bg-white border-2 border-black focus-within:ring-black' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 focus-within:ring-blue-500'
                }`}
                onClick={handleCreateEmpty}
                tabIndex={0}
                role="button"
                aria-label="Create an empty board to start from scratch"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateEmpty()}
              >
                <div className={`h-32 flex items-center justify-center ${
                  highContrast ? 'bg-gray-200 border-b-2 border-black' : 'bg-gradient-to-br from-gray-200 to-gray-300'
                }`}>
                  <PlusCircle className="h-16 w-16 text-gray-600" aria-hidden="true" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Start from Scratch</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create a completely blank board and build your own workflow
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      highContrast 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      No setup required
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  </div>
                </div>
              </article>

              {/* Template Cards */}
              {filteredTemplates.map((template) => {
                const CategoryIcon = getCategoryIcon(template.category);
                const difficulty = DIFFICULTY_ICONS[template.difficulty_level as keyof typeof DIFFICULTY_ICONS] || DIFFICULTY_ICONS.beginner;
                
                return (
                  <article
                    key={template.id}
                    className={`rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer focus-within:ring-4 ${
                      highContrast 
                        ? 'bg-white border-2 border-black focus-within:ring-black' 
                        : 'bg-white border border-gray-200 focus-within:ring-blue-500'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${template.name} template. ${template.description}. Difficulty: ${difficulty.label}`}
                    onKeyPress={(e) => e.key === 'Enter' && setSelectedTemplate(template)}
                  >
                    {/* Template Header with Better Contrast */}
                    <div className={`h-32 relative overflow-hidden ${
                      highContrast ? 'bg-gray-800' : template.color_scheme
                    }`}>
                      {!highContrast && <div className="absolute inset-0 bg-black/20" aria-hidden="true" />}
                      <div className="absolute top-4 left-4 flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          highContrast ? 'bg-white text-black' : 'bg-white/30 backdrop-blur-sm'
                        }`}>
                          <span className={`text-lg ${highContrast ? '' : 'text-white'}`} aria-hidden="true">
                            {template.icon}
                          </span>
                        </div>
                        <div className="text-white">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            <CategoryIcon className="h-3 w-3" aria-hidden="true" />
                            <span>{TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES]?.name}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating with label */}
                      <div className="absolute top-4 right-4 flex items-center space-x-1 text-white text-sm">
                        <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                        <span aria-label={`Rating: ${template.rating} out of 5`}>{template.rating}</span>
                      </div>
                      
                      {/* Difficulty with text and icons */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                          highContrast 
                            ? 'bg-white text-black border-2 border-black' 
                            : 'bg-white/90 text-gray-800'
                        }`}>
                          <span aria-hidden="true">{difficulty.icon}</span>
                          <span>{template.difficulty_level}</span>
                        </div>
                      </div>
                    </div>

                    {/* Template Content */}
                    <div className="p-4">
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {template.description}
                      </p>

                      <div className="space-y-3">
                        {/* Template Stats with Labels */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center space-x-1 text-gray-500">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            <span aria-label={`${template.usage_count} users are using this template`}>
                              {template.usage_count} users
                            </span>
                          </span>
                          <span className="flex items-center space-x-1 text-gray-500">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            <span aria-label={`Estimated time: ${template.estimated_completion_time}`}>
                              {template.estimated_completion_time}
                            </span>
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1" role="list" aria-label="Template tags">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              role="listitem"
                              className={`text-xs px-2 py-1 rounded-full ${
                                highContrast 
                                  ? 'bg-gray-200 text-black border border-black' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs text-gray-400" aria-label={`and ${template.tags.length - 3} more tags`}>
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons with Clear Labels */}
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTemplate(template.id);
                            }}
                            className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 ${
                              highContrast 
                                ? 'bg-black text-white hover:bg-gray-800 focus:ring-black' 
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-md focus:ring-purple-500'
                            }`}
                            aria-label={`Customize ${template.name} template with AI assistance`}
                          >
                            <Bot className="h-3 w-3" aria-hidden="true" />
                            <span>Customize with AI</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateBoard(template.id);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
                              highContrast 
                                ? 'border-2 border-black text-black hover:bg-gray-100 focus:ring-black' 
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
                            }`}
                            aria-label={`Use ${template.name} template as is`}
                          >
                            Use as-is
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* Template Details Modal */}
        {selectedTemplate && (
          <div 
            className="absolute inset-0 bg-black/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-details-title"
          >
            <div className={`bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${
              highContrast ? 'border-4 border-black' : ''
            }`}>
              {/* Template Details Header */}
              <header className={`${
                highContrast ? 'bg-gray-800' : selectedTemplate.color_scheme
              } text-white p-6 relative`}>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className={`absolute top-4 right-4 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                    highContrast 
                      ? 'bg-white text-black hover:bg-gray-200 focus:ring-white' 
                      : 'hover:bg-white/20 focus:ring-white'
                  }`}
                  aria-label="Close template details"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-start space-x-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                    highContrast ? 'bg-white text-black' : 'bg-white/20 backdrop-blur-sm'
                  }`}>
                    {selectedTemplate.icon}
                  </div>
                  <div className="flex-1">
                    <h2 id="template-details-title" className="text-2xl font-bold mb-2">
                      {selectedTemplate.name}
                    </h2>
                    <p className={highContrast ? 'text-gray-200' : 'text-blue-100'}>
                      {selectedTemplate.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm mt-4">
                      <span className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                        <span aria-label={`Rating: ${selectedTemplate.rating} out of 5`}>
                          {selectedTemplate.rating} rating
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        <span>{selectedTemplate.usage_count} users</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        highContrast ? 'bg-white text-black' : 'bg-white/90 text-gray-800'
                      }`}>
                        {DIFFICULTY_ICONS[selectedTemplate.difficulty_level as keyof typeof DIFFICULTY_ICONS]?.icon} {selectedTemplate.difficulty_level}
                      </span>
                    </div>
                  </div>
                </div>
              </header>

              {/* Template Details Content */}
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Board Structure */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Board Structure</h3>
                    <div className="space-y-2" role="list" aria-label="Board columns">
                      {selectedTemplate.columns.map((column, index) => (
                        <div 
                          key={index} 
                          role="listitem"
                          className={`flex items-center space-x-3 p-3 rounded-lg ${
                            highContrast ? 'bg-gray-100 border border-black' : 'bg-gray-50'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full bg-${column.color}-500`} aria-hidden="true" />
                          <div>
                            <div className="font-medium text-gray-900">{column.name}</div>
                            <div className="text-sm text-gray-600">{column.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Sample Tasks */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Tasks</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto" role="list" aria-label="Sample tasks">
                      {selectedTemplate.default_tasks.slice(0, 5).map((task, index) => (
                        <div 
                          key={index} 
                          role="listitem"
                          className={`p-3 rounded-lg ${
                            highContrast ? 'border-2 border-gray-600' : 'border border-gray-200'
                          }`}
                        >
                          <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              highContrast 
                                ? 'bg-gray-200 text-black border border-black' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {task.energy_level.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{task.estimated_duration}m</span>
                          </div>
                        </div>
                      ))}
                      {selectedTemplate.default_tasks.length > 5 && (
                        <div className="text-sm text-gray-500 text-center py-2" aria-label={`Plus ${selectedTemplate.default_tasks.length - 5} more tasks`}>
                          +{selectedTemplate.default_tasks.length - 5} more tasks
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      onSelectTemplate(selectedTemplate.id);
                    }}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 ${
                      highContrast 
                        ? 'bg-black text-white hover:bg-gray-800 focus:ring-black' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg focus:ring-purple-500'
                    }`}
                    aria-label={`Customize ${selectedTemplate.name} template with AI assistance`}
                  >
                    <Bot className="h-4 w-4" aria-hidden="true" />
                    <span>Customize with AI</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      onCreateBoard(selectedTemplate.id);
                    }}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 ${
                      highContrast 
                        ? 'border-2 border-black text-black hover:bg-gray-100 focus:ring-black' 
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
                    }`}
                    aria-label={`Use ${selectedTemplate.name} template as is`}
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