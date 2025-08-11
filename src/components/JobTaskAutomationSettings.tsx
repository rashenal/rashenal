import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Bell,
  Zap,
  List,
  Calendar,
  Briefcase,
  Save,
  RefreshCw
} from 'lucide-react';
import { AutoTaskConfig, jobTaskAutomation } from '../lib/job-task-automation';
import { useUser } from '../contexts/userContext';

interface JobTaskAutomationSettingsProps {
  onConfigChange?: (config: AutoTaskConfig) => void;
}

export default function JobTaskAutomationSettings({ onConfigChange }: JobTaskAutomationSettingsProps) {
  const { user } = useUser();
  const [config, setConfig] = useState<AutoTaskConfig>({
    enabled: true,
    min_match_score: 75,
    create_subtasks: true,
    set_deadlines: true,
    default_priority: 'MEDIUM',
    notify_user: true,
    templates: {
      research_task: true,
      application_task: true,
      follow_up_tasks: true,
      interview_prep: true
    }
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadUserConfig();
    }
  }, [user]);

  const loadUserConfig = async () => {
    if (!user) return;
    
    try {
      const userConfig = await jobTaskAutomation.getUserConfig(user.id);
      setConfig(userConfig);
    } catch (error) {
      console.error('Error loading automation config:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await jobTaskAutomation.updateUserConfig(user.id, config);
      setLastSaved(new Date());
      onConfigChange?.(config);
    } catch (error) {
      console.error('Error saving automation config:', error);
      alert('Failed to save automation settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = <K extends keyof AutoTaskConfig>(key: K, value: AutoTaskConfig[K]) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateTemplates = (templateKey: keyof AutoTaskConfig['templates'], enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [templateKey]: enabled
      }
    }));
  };

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority', color: 'text-gray-600' },
    { value: 'MEDIUM', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'HIGH', label: 'High Priority', color: 'text-red-600' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Job Task Automation</h3>
            <p className="text-sm text-gray-600">
              Automatically create tasks when high-scoring job matches are found
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Main Settings */}
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Settings className="h-4 w-4 text-gray-600 mr-2" />
            Automation Settings
          </h4>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">Enable Task Automation</label>
              <p className="text-sm text-gray-600 mt-1">
                Automatically create tasks for high-scoring job matches
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Minimum Match Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium text-gray-900 flex items-center">
                <Target className="h-4 w-4 text-gray-600 mr-2" />
                Minimum Match Score
              </label>
              <span className={`font-bold text-lg ${getScoreColor(config.min_match_score)}`}>
                {config.min_match_score}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={config.min_match_score}
              onChange={(e) => updateConfig('min_match_score', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-sm text-gray-600">
              Only create tasks for jobs with match scores above this threshold
            </p>
          </div>

          {/* Default Priority */}
          <div className="space-y-3">
            <label className="font-medium text-gray-900 flex items-center">
              <AlertCircle className="h-4 w-4 text-gray-600 mr-2" />
              Default Task Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateConfig('default_priority', option.value as any)}
                  className={`p-3 text-center rounded-lg border-2 transition-colors ${
                    config.default_priority === option.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Other Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.create_subtasks}
                onChange={(e) => updateConfig('create_subtasks', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-2">
                <List className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">Create Subtasks</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.set_deadlines}
                onChange={(e) => updateConfig('set_deadlines', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">Set Deadlines</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notify_user}
                onChange={(e) => updateConfig('notify_user', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">Send Notifications</span>
              </div>
            </label>
          </div>
        </div>

        {/* Task Templates */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Briefcase className="h-4 w-4 text-gray-600 mr-2" />
            Task Templates
          </h4>
          <p className="text-sm text-gray-600">
            Choose which types of tasks to automatically create for each job match
          </p>

          <div className="space-y-3">
            {/* Research Task */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.templates.research_task}
                  onChange={(e) => updateTemplates('research_task', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Company Research Task</span>
                  <p className="text-sm text-gray-600">
                    Research the company, role requirements, and interview process
                  </p>
                </div>
              </div>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>

            {/* Application Task */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.templates.application_task}
                  onChange={(e) => updateTemplates('application_task', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Application Submission Task</span>
                  <p className="text-sm text-gray-600">
                    Tailor resume, write cover letter, and submit application
                  </p>
                </div>
              </div>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </div>

            {/* Follow-up Tasks */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.templates.follow_up_tasks}
                  onChange={(e) => updateTemplates('follow_up_tasks', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Follow-up Task</span>
                  <p className="text-sm text-gray-600">
                    Check application status and send follow-up communications
                  </p>
                </div>
              </div>
              <Bell className="h-4 w-4 text-gray-400" />
            </div>

            {/* Interview Prep */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.templates.interview_prep}
                  onChange={(e) => updateTemplates('interview_prep', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Interview Preparation</span>
                  <p className="text-sm text-gray-600">
                    Prepare for interviews (only for high-scoring matches 85%+)
                  </p>
                </div>
              </div>
              <Zap className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
          <p className="text-sm text-blue-800">
            {config.enabled 
              ? `When a job match scores ${config.min_match_score}% or higher, ${Object.values(config.templates).filter(Boolean).length} tasks will be automatically created with ${config.default_priority.toLowerCase()} priority${config.set_deadlines ? ' and deadlines' : ''}${config.notify_user ? ', and you\'ll receive a notification' : ''}.`
              : 'Task automation is currently disabled. No tasks will be created automatically.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}