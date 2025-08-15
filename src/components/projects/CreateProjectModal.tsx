import React, { useState } from 'react';
import {
  X,
  Plus,
  DollarSign,
  Calendar,
  Target,
  Briefcase,
  Settings,
  TrendingUp,
  Rocket,
  Users,
  Folder,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useUser } from '../../contexts/userContext';
import { supabase } from '../../lib/supabase';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

const PROJECT_CATEGORIES = {
  revenue: { label: 'Revenue Generation', icon: DollarSign, color: '#10B981', description: 'Direct revenue-generating activities' },
  operations: { label: 'Operations', icon: Settings, color: '#3B82F6', description: 'Process improvements and efficiency' },
  marketing: { label: 'Marketing', icon: TrendingUp, color: '#8B5CF6', description: 'Brand building and customer acquisition' },
  product: { label: 'Product Development', icon: Rocket, color: '#F59E0B', description: 'Creating and improving products/services' },
  personal: { label: 'Personal Development', icon: Target, color: '#EC4899', description: 'Skills and career advancement' },
  other: { label: 'Other', icon: Folder, color: '#6B7280', description: 'General projects and initiatives' }
};

const PRIORITY_LEVELS = {
  low: { label: 'Low', color: '#6B7280', description: 'Can be done when time allows' },
  medium: { label: 'Medium', color: '#3B82F6', description: 'Important but not urgent' },
  high: { label: 'High', color: '#F59E0B', description: 'Important and should be prioritized' },
  urgent: { label: 'Urgent', color: '#EF4444', description: 'Needs immediate attention' }
};

const REVENUE_TEMPLATES = [
  {
    name: 'Product Launch',
    description: 'Launch a new product or service to generate revenue',
    category: 'revenue',
    priority: 'high',
    revenue_target: 50000,
    estimated_duration: 90,
    tasks: [
      'Market research and validation',
      'Product development and testing',
      'Marketing strategy creation',
      'Launch campaign execution',
      'Sales funnel optimization'
    ]
  },
  {
    name: 'Client Acquisition Campaign',
    description: 'Systematic approach to acquiring new high-value clients',
    category: 'marketing',
    priority: 'high',
    revenue_target: 100000,
    estimated_duration: 60,
    tasks: [
      'Define ideal customer profile',
      'Create lead generation strategy',
      'Develop sales materials',
      'Execute outreach campaigns',
      'Convert leads to customers'
    ]
  },
  {
    name: 'Process Automation',
    description: 'Automate manual processes to reduce costs and increase efficiency',
    category: 'operations',
    priority: 'medium',
    revenue_target: 25000,
    estimated_duration: 45,
    tasks: [
      'Identify automation opportunities',
      'Select automation tools',
      'Implement automated workflows',
      'Train team on new processes',
      'Monitor and optimize'
    ]
  }
];

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'revenue',
    priority: 'high',
    status: 'planning',
    budget: '',
    revenue_target: '',
    start_date: '',
    target_date: '',
    color: PROJECT_CATEGORIES.revenue.color
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      category: template.category,
      priority: template.priority,
      revenue_target: template.revenue_target.toString(),
      color: PROJECT_CATEGORIES[template.category as keyof typeof PROJECT_CATEGORIES].color,
      target_date: new Date(Date.now() + template.estimated_duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    setStep(2);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update color when category changes
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        color: PROJECT_CATEGORIES[value as keyof typeof PROJECT_CATEGORIES].color
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Project name is required');
      }

      // Create project
      const projectData = {
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        revenue_target: formData.revenue_target ? parseFloat(formData.revenue_target) : null,
        start_date: formData.start_date || null,
        target_date: formData.target_date || null,
        color: formData.color,
        completion_percentage: 0,
        is_favorite: false,
        is_archived: false
      };

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (projectError) {
        throw projectError;
      }

      // If using a template, create template tasks
      if (selectedTemplate && selectedTemplate.tasks) {
        const taskPromises = selectedTemplate.tasks.map((taskTitle: string, index: number) => {
          return supabase
            .from('tasks')
            .insert([{
              user_id: user.id,
              project_id: project.id,
              title: taskTitle,
              description: `Task from ${selectedTemplate.name} template`,
              status: 'todo',
              priority: 'medium',
              energy_level: 'm',
              estimated_time: 60, // 1 hour default
              position: index,
              tags: [selectedTemplate.category, 'template']
            }]);
        });

        await Promise.all(taskPromises);
      }

      onProjectCreated(project);
      onClose();
      
      // Reset form
      setStep(1);
      setSelectedTemplate(null);
      setFormData({
        name: '',
        description: '',
        category: 'revenue',
        priority: 'high',
        status: 'planning',
        budget: '',
        revenue_target: '',
        start_date: '',
        target_date: '',
        color: PROJECT_CATEGORIES.revenue.color
      });

    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Plus className="h-6 w-6 text-purple-600 mr-2" />
              Create New Project
            </h2>
            <p className="text-gray-600 mt-1">
              {step === 1 ? 'Choose a template or start from scratch' : 'Configure your project details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Choose Template</span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Project Details</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div>
              {/* Revenue-Focused Templates */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue-Focused Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {REVENUE_TEMPLATES.map((template, index) => (
                  <div
                    key={index}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="flex items-center mb-3">
                      {React.createElement(PROJECT_CATEGORIES[template.category as keyof typeof PROJECT_CATEGORIES].icon, {
                        className: 'h-6 w-6 text-purple-600 mr-2'
                      })}
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Revenue Target:</span>
                        <span className="font-medium text-green-600">
                          ${template.revenue_target.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium text-gray-900">{template.estimated_duration} days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Tasks:</span>
                        <span className="font-medium text-gray-900">{template.tasks.length} included</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Start from Scratch */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Start From Scratch</h3>
                <button
                  onClick={() => setStep(2)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div className="flex items-center justify-center">
                    <Plus className="h-6 w-6 text-gray-400 mr-2" />
                    <span className="text-gray-600 font-medium">Create Custom Project</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Q4 Revenue Campaign"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the project goals and scope..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(PROJECT_CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
                      <option key={key} value={key}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="10000"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revenue Target ($)
                  </label>
                  <input
                    type="number"
                    value={formData.revenue_target}
                    onChange={(e) => handleInputChange('revenue_target', e.target.value)}
                    placeholder="50000"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => handleInputChange('target_date', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Template Tasks Preview */}
              {selectedTemplate && selectedTemplate.tasks && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">
                    Template Tasks ({selectedTemplate.tasks.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.tasks.map((task: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-purple-800">{task}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-700 mt-3">
                    These tasks will be automatically added to your project
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}