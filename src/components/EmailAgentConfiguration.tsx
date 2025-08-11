import React, { useState } from 'react';
import {
  Bot,
  Calendar,
  Clock,
  Filter,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Mail,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  Zap,
  Database,
  Target
} from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  type: 'job-finder' | 'task-extractor' | 'habit-tracker' | 'goal-analyzer';
  status: 'active' | 'paused' | 'error' | 'configuring';
  integration: string; // e.g., 'outlook', 'gmail'
  config: {
    startDate: string;
    pollingFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    emailFilters: {
      folders: string[];
      keywords: string[];
      excludeKeywords: string[];
      senders: string[];
      dateRange: {
        enabled: boolean;
        from?: string;
        to?: string;
      };
    };
    analysisSettings: {
      confidenceThreshold: number;
      createTasks: boolean;
      notifyOnMatch: boolean;
      maxProcessingPerHour: number;
    };
  };
  stats: {
    totalProcessed: number;
    matches: number;
    tasksCreated: number;
    errors: number;
    lastRun: string;
    avgProcessingTime: number;
  };
}

interface EmailAgentConfigurationProps {
  agentId?: string;
  integration: string;
  onSave: (config: AgentConfig) => void;
  onClose: () => void;
}

export default function EmailAgentConfiguration({
  agentId,
  integration,
  onSave,
  onClose
}: EmailAgentConfigurationProps) {
  // Mock data - replace with real agent config
  const [config, setConfig] = useState<AgentConfig>({
    id: agentId || 'new-agent',
    name: 'Job Finder - Outlook',
    type: 'job-finder',
    status: 'configuring',
    integration: integration,
    config: {
      startDate: '2025-01-01',
      pollingFrequency: 'hourly',
      emailFilters: {
        folders: ['Inbox', 'Jobs'],
        keywords: ['job', 'opportunity', 'position', 'hiring', 'career', 'opening'],
        excludeKeywords: ['spam', 'newsletter', 'unsubscribe', 'promotion'],
        senders: [],
        dateRange: {
          enabled: true,
          from: '2025-01-01'
        }
      },
      analysisSettings: {
        confidenceThreshold: 75,
        createTasks: true,
        notifyOnMatch: true,
        maxProcessingPerHour: 50
      }
    },
    stats: {
      totalProcessed: 1247,
      matches: 23,
      tasksCreated: 18,
      errors: 2,
      lastRun: '2 minutes ago',
      avgProcessingTime: 2.3
    }
  });

  const agentTypes = [
    {
      id: 'job-finder',
      name: 'Job Finder',
      description: 'Analyzes emails for job opportunities and creates tasks',
      icon: <Target className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'task-extractor',
      name: 'Task Extractor',
      description: 'Extracts actionable items from emails and creates tasks',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />
    },
    {
      id: 'habit-tracker',
      name: 'Habit Tracker',
      description: 'Identifies habit-related content and updates tracking',
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />
    },
    {
      id: 'goal-analyzer',
      name: 'Goal Analyzer',
      description: 'Analyzes progress updates and goal-related communications',
      icon: <Zap className="h-5 w-5 text-orange-600" />
    }
  ];

  const pollingOptions = [
    { value: 'realtime', label: 'Real-time (Webhook)', description: 'Instant processing when emails arrive' },
    { value: 'hourly', label: 'Every Hour', description: 'Check for new emails hourly' },
    { value: 'daily', label: 'Daily', description: 'Process emails once per day' },
    { value: 'weekly', label: 'Weekly', description: 'Process emails once per week' }
  ];

  const handleConfigUpdate = (section: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: {
          ...prev.config[section as keyof typeof prev.config],
          [field]: value
        }
      }
    }));
  };

  const handleArrayUpdate = (section: string, field: string, value: string[]) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: {
          ...prev.config[section as keyof typeof prev.config],
          [field]: value
        }
      }
    }));
  };

  const addKeyword = (type: 'keywords' | 'excludeKeywords', keyword: string) => {
    if (!keyword.trim()) return;
    
    const current = config.config.emailFilters[type];
    if (!current.includes(keyword.trim())) {
      handleArrayUpdate('emailFilters', type, [...current, keyword.trim()]);
    }
  };

  const removeKeyword = (type: 'keywords' | 'excludeKeywords', keyword: string) => {
    const current = config.config.emailFilters[type];
    handleArrayUpdate('emailFilters', type, current.filter(k => k !== keyword));
  };

  const handleStartAgent = () => {
    setConfig(prev => ({ ...prev, status: 'active' }));
    onSave({ ...config, status: 'active' });
  };

  const handlePauseAgent = () => {
    setConfig(prev => ({ ...prev, status: 'paused' }));
    onSave({ ...config, status: 'paused' });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: <Play className="h-4 w-4 text-green-600" />, text: 'Active', color: 'text-green-600' };
      case 'paused':
        return { icon: <Pause className="h-4 w-4 text-yellow-600" />, text: 'Paused', color: 'text-yellow-600' };
      case 'error':
        return { icon: <AlertCircle className="h-4 w-4 text-red-600" />, text: 'Error', color: 'text-red-600' };
      default:
        return { icon: <Settings className="h-4 w-4 text-gray-600" />, text: 'Configuring', color: 'text-gray-600' };
    }
  };

  const statusDisplay = getStatusDisplay(config.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Email Agent Configuration</h1>
                <p className="text-sm text-gray-600">Configure AI analysis for {integration}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {statusDisplay.icon}
                <span className={`font-medium ${statusDisplay.color}`}>
                  {statusDisplay.text}
                </span>
              </div>
              
              {config.status === 'active' ? (
                <button
                  onClick={handlePauseAgent}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={handleStartAgent}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>Start</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Type Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Type</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setConfig(prev => ({ ...prev, type: type.id as any }))}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      config.type === type.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {type.icon}
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Filters</h3>
              
              <div className="space-y-6">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Start Date
                  </label>
                  <input
                    type="date"
                    value={config.config.startDate}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      config: { ...prev.config, startDate: e.target.value }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Agent will process emails from this date onwards
                  </p>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include Keywords
                  </label>
                  <div className="space-y-2">
                    <KeywordInput
                      keywords={config.config.emailFilters.keywords}
                      onAdd={(keyword) => addKeyword('keywords', keyword)}
                      onRemove={(keyword) => removeKeyword('keywords', keyword)}
                      placeholder="Add keywords to look for..."
                    />
                  </div>
                </div>

                {/* Exclude Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclude Keywords
                  </label>
                  <div className="space-y-2">
                    <KeywordInput
                      keywords={config.config.emailFilters.excludeKeywords}
                      onAdd={(keyword) => addKeyword('excludeKeywords', keyword)}
                      onRemove={(keyword) => removeKeyword('excludeKeywords', keyword)}
                      placeholder="Add keywords to exclude..."
                      variant="red"
                    />
                  </div>
                </div>

                {/* Folders */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Folders
                  </label>
                  <div className="space-y-2">
                    <KeywordInput
                      keywords={config.config.emailFilters.folders}
                      onAdd={(folder) => handleArrayUpdate('emailFilters', 'folders', [...config.config.emailFilters.folders, folder])}
                      onRemove={(folder) => handleArrayUpdate('emailFilters', 'folders', config.config.emailFilters.folders.filter(f => f !== folder))}
                      placeholder="Add folder names..."
                      variant="blue"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Settings</h3>
              
              <div className="space-y-6">
                {/* Polling Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Frequency
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pollingOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleConfigUpdate('', 'pollingFrequency', option.value)}
                        className={`p-3 text-left rounded-lg border transition-colors ${
                          config.config.pollingFrequency === option.value
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidence Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Threshold: {config.config.analysisSettings.confidenceThreshold}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={config.config.analysisSettings.confidenceThreshold}
                    onChange={(e) => handleConfigUpdate('analysisSettings', 'confidenceThreshold', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only process items above this confidence level
                  </p>
                </div>

                {/* Toggle Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.config.analysisSettings.createTasks}
                      onChange={(e) => handleConfigUpdate('analysisSettings', 'createTasks', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-create tasks</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.config.analysisSettings.notifyOnMatch}
                      onChange={(e) => handleConfigUpdate('analysisSettings', 'notifyOnMatch', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Notify on matches</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Processed</span>
                  <span className="font-semibold">{config.stats.totalProcessed.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Matches Found</span>
                  <span className="font-semibold text-green-600">{config.stats.matches}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks Created</span>
                  <span className="font-semibold text-blue-600">{config.stats.tasksCreated}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Errors</span>
                  <span className="font-semibold text-red-600">{config.stats.errors}</span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((config.stats.matches / config.stats.totalProcessed) * 100)}%
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Last run: {config.stats.lastRun}<br />
                  Avg processing: {config.stats.avgProcessingTime}s per email
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => onSave(config)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Database className="h-4 w-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for keyword input
function KeywordInput({ 
  keywords, 
  onAdd, 
  onRemove, 
  placeholder, 
  variant = 'green' 
}: { 
  keywords: string[]; 
  onAdd: (keyword: string) => void; 
  onRemove: (keyword: string) => void; 
  placeholder: string;
  variant?: 'green' | 'red' | 'blue';
}) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div>
      <div className="flex space-x-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          Add
        </button>
      </div>
      
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getVariantClasses()}`}
            >
              {keyword}
              <button
                onClick={() => onRemove(keyword)}
                className="ml-1 text-current hover:text-opacity-75"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}