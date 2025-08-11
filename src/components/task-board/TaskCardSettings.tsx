import React, { useState } from 'react';
import {
  Settings,
  Eye,
  EyeOff,
  X,
  RotateCcw,
  Save,
  Palette,
  Layout,
  Info
} from 'lucide-react';

export interface TaskCardDisplaySettings {
  showDescription: boolean;
  showPriority: boolean;
  showEnergyLevel: boolean;
  showTags: boolean;
  showDueDate: boolean;
  showProgress: boolean;
  showAssignee: boolean;
  showAttachments: boolean;
  showComments: boolean;
  showAIInsights: boolean;
  showBusinessValue: boolean;
  showPersonalValue: boolean;
  compactMode: boolean;
  showQuickActions: boolean;
}

export const defaultTaskCardSettings: TaskCardDisplaySettings = {
  showDescription: true,
  showPriority: true,
  showEnergyLevel: true,
  showTags: true,
  showDueDate: true,
  showProgress: true,
  showAssignee: true,
  showAttachments: true,
  showComments: true,
  showAIInsights: true,
  showBusinessValue: false,
  showPersonalValue: false,
  compactMode: false,
  showQuickActions: true
};

interface TaskCardSettingsProps {
  settings: TaskCardDisplaySettings;
  onSettingsChange: (settings: TaskCardDisplaySettings) => void;
  onClose: () => void;
}

export default function TaskCardSettings({
  settings,
  onSettingsChange,
  onClose
}: TaskCardSettingsProps) {
  const [localSettings, setLocalSettings] = useState<TaskCardDisplaySettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(defaultTaskCardSettings);
  };

  const updateSetting = (key: keyof TaskCardDisplaySettings, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingGroups = [
    {
      title: 'Task Information',
      icon: Info,
      settings: [
        { key: 'showDescription' as keyof TaskCardDisplaySettings, label: 'Description', description: 'Show task description' },
        { key: 'showPriority' as keyof TaskCardDisplaySettings, label: 'Priority', description: 'Show priority indicators' },
        { key: 'showEnergyLevel' as keyof TaskCardDisplaySettings, label: 'Energy Level', description: 'Show energy level badges' },
        { key: 'showTags' as keyof TaskCardDisplaySettings, label: 'Tags', description: 'Show task tags' },
        { key: 'showDueDate' as keyof TaskCardDisplaySettings, label: 'Due Date', description: 'Show due date information' }
      ]
    },
    {
      title: 'Progress & Activity',
      icon: Layout,
      settings: [
        { key: 'showProgress' as keyof TaskCardDisplaySettings, label: 'Progress Bar', description: 'Show subtask progress' },
        { key: 'showAttachments' as keyof TaskCardDisplaySettings, label: 'Attachments', description: 'Show attachment count' },
        { key: 'showComments' as keyof TaskCardDisplaySettings, label: 'Comments', description: 'Show comment count' },
        { key: 'showAssignee' as keyof TaskCardDisplaySettings, label: 'Assignee', description: 'Show task assignee' }
      ]
    },
    {
      title: 'AI & Values',
      icon: Palette,
      settings: [
        { key: 'showAIInsights' as keyof TaskCardDisplaySettings, label: 'AI Insights', description: 'Show AI completion probability and suggestions' },
        { key: 'showBusinessValue' as keyof TaskCardDisplaySettings, label: 'Business Value', description: 'Show business value indicators' },
        { key: 'showPersonalValue' as keyof TaskCardDisplaySettings, label: 'Personal Value', description: 'Show personal value indicators' }
      ]
    },
    {
      title: 'Display Options',
      icon: Eye,
      settings: [
        { key: 'compactMode' as keyof TaskCardDisplaySettings, label: 'Compact Mode', description: 'Show cards in compact layout' },
        { key: 'showQuickActions' as keyof TaskCardDisplaySettings, label: 'Quick Actions', description: 'Show hover actions on cards' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Task Card Display</h2>
                <p className="text-blue-100">Customize what information shows on task cards</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {settingGroups.map((group, groupIndex) => {
            const Icon = group.icon;
            return (
              <div key={groupIndex} className="space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">{group.title}</h3>
                </div>
                
                <div className="space-y-3">
                  {group.settings.map((setting) => (
                    <label
                      key={setting.key}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{setting.label}</span>
                          {localSettings[setting.key] ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={localSettings[setting.key] as boolean}
                          onChange={(e) => updateSetting(setting.key, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${
                          localSettings[setting.key] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform m-0.5 ${
                            localSettings[setting.key] ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Preview Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="font-medium text-gray-900">Sample Task Title</div>
                {localSettings.showDescription && (
                  <p className="text-sm text-gray-600">This is what a task description looks like...</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {localSettings.showPriority && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">🟠 High</span>
                  )}
                  {localSettings.showEnergyLevel && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">🔥 M</span>
                  )}
                  {localSettings.showTags && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">design</span>
                  )}
                </div>

                {localSettings.showProgress && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full w-1/3"></div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <div className="flex items-center space-x-3">
                    {localSettings.showAttachments && <span>📎 2</span>}
                    {localSettings.showComments && <span>💬 1</span>}
                    {localSettings.showDueDate && <span>📅 Tomorrow</span>}
                  </div>
                  {localSettings.showAIInsights && (
                    <span className="text-purple-600">🧠 85%</span>
                  )}
                </div>

                {(localSettings.showBusinessValue || localSettings.showPersonalValue) && (
                  <div className="flex space-x-3 mt-2">
                    {localSettings.showBusinessValue && (
                      <div className="flex items-center space-x-1">
                        <span className="text-green-600">💼</span>
                        <div className="w-12 h-1 bg-gray-200 rounded">
                          <div className="w-8 h-1 bg-green-500 rounded"></div>
                        </div>
                      </div>
                    )}
                    {localSettings.showPersonalValue && (
                      <div className="flex items-center space-x-1">
                        <span className="text-pink-600">❤️</span>
                        <div className="w-12 h-1 bg-gray-200 rounded">
                          <div className="w-6 h-1 bg-pink-500 rounded"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
            
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
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}