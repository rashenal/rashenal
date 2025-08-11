import React from 'react';
import { 
  Eye, 
  Target, 
  TrendingUp, 
  Clock,
  Award,
  BarChart3,
  Palette,
  Zap,
  Calendar,
  Bell
} from 'lucide-react';
import SettingsModal, { 
  SettingsSection, 
  SettingsItem, 
  ToggleSwitch,
  getLocalSettings 
} from '../shared/SettingsModal';

interface GoalsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: GoalsSettings) => void;
}

export interface GoalsSettings {
  // Display settings
  showProgress: boolean;
  showStreaks: boolean;
  showTargets: boolean;
  showTimeRemaining: boolean;
  showCompletionStatus: boolean;
  showCategories: boolean;
  
  // Goal tracking
  trackDailyGoals: boolean;
  trackWeeklyGoals: boolean;
  trackMonthlyGoals: boolean;
  allowPartialCompletion: boolean;
  
  // Progress visualization
  progressStyle: 'bar' | 'circle' | 'number';
  showPercentages: boolean;
  animateProgress: boolean;
  
  // Reminders & notifications
  enableGoalReminders: boolean;
  reminderTime: string;
  deadlineAlerts: boolean;
  celebrateCompletions: boolean;
  
  // AI coaching integration
  enableAITips: boolean;
  requestFeedback: boolean;
  autoAdjustTargets: boolean;
  
  // Layout & appearance
  goalLayout: 'grid' | 'list' | 'timeline';
  compactView: boolean;
  colorScheme: 'default' | 'vibrant' | 'minimal';
  cardStyle: 'modern' | 'classic' | 'gradient';
  
  // Advanced features
  showAchievements: boolean;
  trackHabits: boolean;
  linkToCalendar: boolean;
  exportData: boolean;
}

export const defaultGoalsSettings: GoalsSettings = {
  // Display settings
  showProgress: true,
  showStreaks: true,
  showTargets: true,
  showTimeRemaining: true,
  showCompletionStatus: true,
  showCategories: true,
  
  // Goal tracking
  trackDailyGoals: true,
  trackWeeklyGoals: true,
  trackMonthlyGoals: false,
  allowPartialCompletion: true,
  
  // Progress visualization
  progressStyle: 'bar',
  showPercentages: true,
  animateProgress: true,
  
  // Reminders & notifications
  enableGoalReminders: true,
  reminderTime: '09:00',
  deadlineAlerts: true,
  celebrateCompletions: true,
  
  // AI coaching integration
  enableAITips: true,
  requestFeedback: false,
  autoAdjustTargets: false,
  
  // Layout & appearance
  goalLayout: 'grid',
  compactView: false,
  colorScheme: 'default',
  cardStyle: 'modern',
  
  // Advanced features
  showAchievements: true,
  trackHabits: true,
  linkToCalendar: false,
  exportData: false,
};

export default function GoalsSettings({
  isOpen,
  onClose,
  onSettingsChange
}: GoalsSettingsProps) {
  const [settings, setSettings] = React.useState<GoalsSettings>(
    () => getLocalSettings('goals', defaultGoalsSettings)
  );

  const handleSettingChange = <K extends keyof GoalsSettings>(
    key: K,
    value: GoalsSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'display', label: 'Display', icon: <Eye className="h-4 w-4" /> },
    { id: 'tracking', label: 'Tracking', icon: <Target className="h-4 w-4" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'reminders', label: 'Reminders', icon: <Bell className="h-4 w-4" /> },
    { id: 'ai', label: 'AI Coach', icon: <Zap className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  ];

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Goals"
      tabs={tabs}
      onSave={onSettingsChange}
      settings={settings}
      sectionId="goals"
    >
      {/* Display Tab */}
      <SettingsSection title="Display Options" tabId="display">
        <SettingsItem 
          label="Show Progress Bars"
          description="Display visual progress indicators for each goal"
        >
          <ToggleSwitch
            checked={settings.showProgress}
            onChange={(checked) => handleSettingChange('showProgress', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Streaks"
          description="Display consecutive day counts for goal completion"
        >
          <ToggleSwitch
            checked={settings.showStreaks}
            onChange={(checked) => handleSettingChange('showStreaks', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Targets"
          description="Display target values and completion criteria"
        >
          <ToggleSwitch
            checked={settings.showTargets}
            onChange={(checked) => handleSettingChange('showTargets', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Time Remaining"
          description="Display time left to complete daily goals"
        >
          <ToggleSwitch
            checked={settings.showTimeRemaining}
            onChange={(checked) => handleSettingChange('showTimeRemaining', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Completion Status"
          description="Display checkmarks and completion indicators"
        >
          <ToggleSwitch
            checked={settings.showCompletionStatus}
            onChange={(checked) => handleSettingChange('showCompletionStatus', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Categories"
          description="Display goal categories and tags"
        >
          <ToggleSwitch
            checked={settings.showCategories}
            onChange={(checked) => handleSettingChange('showCategories', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Tracking Tab */}
      <SettingsSection title="Goal Tracking" tabId="tracking">
        <SettingsItem 
          label="Track Daily Goals"
          description="Monitor and track daily goal completion"
        >
          <ToggleSwitch
            checked={settings.trackDailyGoals}
            onChange={(checked) => handleSettingChange('trackDailyGoals', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Track Weekly Goals"
          description="Monitor weekly goal progress and completion"
        >
          <ToggleSwitch
            checked={settings.trackWeeklyGoals}
            onChange={(checked) => handleSettingChange('trackWeeklyGoals', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Track Monthly Goals"
          description="Monitor long-term monthly objectives"
        >
          <ToggleSwitch
            checked={settings.trackMonthlyGoals}
            onChange={(checked) => handleSettingChange('trackMonthlyGoals', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Allow Partial Completion"
          description="Enable marking goals as partially completed"
        >
          <ToggleSwitch
            checked={settings.allowPartialCompletion}
            onChange={(checked) => handleSettingChange('allowPartialCompletion', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Progress Tab */}
      <SettingsSection title="Progress Visualization" tabId="progress">
        <SettingsItem 
          label="Progress Style"
          description="Choose how progress is displayed"
        >
          <select
            value={settings.progressStyle}
            onChange={(e) => handleSettingChange('progressStyle', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="bar">Progress Bars</option>
            <option value="circle">Circular Progress</option>
            <option value="number">Numbers Only</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Show Percentages"
          description="Display numerical progress percentages"
        >
          <ToggleSwitch
            checked={settings.showPercentages}
            onChange={(checked) => handleSettingChange('showPercentages', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Animate Progress"
          description="Use smooth animations when progress updates"
        >
          <ToggleSwitch
            checked={settings.animateProgress}
            onChange={(checked) => handleSettingChange('animateProgress', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Reminders Tab */}
      <SettingsSection title="Reminders & Notifications" tabId="reminders">
        <SettingsItem 
          label="Enable Goal Reminders"
          description="Send reminders about incomplete goals"
        >
          <ToggleSwitch
            checked={settings.enableGoalReminders}
            onChange={(checked) => handleSettingChange('enableGoalReminders', checked)}
          />
        </SettingsItem>
        
        {settings.enableGoalReminders && (
          <SettingsItem 
            label="Reminder Time"
            description="When to send daily goal reminders"
          >
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </SettingsItem>
        )}
        
        <SettingsItem 
          label="Deadline Alerts"
          description="Alert when goal deadlines are approaching"
        >
          <ToggleSwitch
            checked={settings.deadlineAlerts}
            onChange={(checked) => handleSettingChange('deadlineAlerts', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Celebrate Completions"
          description="Show celebration animations when goals are completed"
        >
          <ToggleSwitch
            checked={settings.celebrateCompletions}
            onChange={(checked) => handleSettingChange('celebrateCompletions', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* AI Coach Tab */}
      <SettingsSection title="AI Coaching Integration" tabId="ai">
        <SettingsItem 
          label="Enable AI Tips"
          description="Receive AI-powered tips and suggestions for goal achievement"
        >
          <ToggleSwitch
            checked={settings.enableAITips}
            onChange={(checked) => handleSettingChange('enableAITips', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Request Feedback"
          description="Get AI feedback on goal progress and patterns"
        >
          <ToggleSwitch
            checked={settings.requestFeedback}
            onChange={(checked) => handleSettingChange('requestFeedback', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Auto-adjust Targets"
          description="Let AI suggest target adjustments based on your progress"
        >
          <ToggleSwitch
            checked={settings.autoAdjustTargets}
            onChange={(checked) => handleSettingChange('autoAdjustTargets', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Appearance Tab */}
      <SettingsSection title="Layout & Appearance" tabId="appearance">
        <SettingsItem 
          label="Goal Layout"
          description="Choose how goals are arranged"
        >
          <select
            value={settings.goalLayout}
            onChange={(e) => handleSettingChange('goalLayout', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="grid">Grid Layout</option>
            <option value="list">List Layout</option>
            <option value="timeline">Timeline Layout</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Compact View"
          description="Use smaller cards to fit more goals on screen"
        >
          <ToggleSwitch
            checked={settings.compactView}
            onChange={(checked) => handleSettingChange('compactView', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Color Scheme"
          description="Choose color theme for goals display"
        >
          <select
            value={settings.colorScheme}
            onChange={(e) => handleSettingChange('colorScheme', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default</option>
            <option value="vibrant">Vibrant Colors</option>
            <option value="minimal">Minimal</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Card Style"
          description="Visual style of goal cards"
        >
          <select
            value={settings.cardStyle}
            onChange={(e) => handleSettingChange('cardStyle', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="gradient">Gradient</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Show Achievements"
          description="Display achievement badges and milestones"
        >
          <ToggleSwitch
            checked={settings.showAchievements}
            onChange={(checked) => handleSettingChange('showAchievements', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Connect to Habits"
          description="Link goals with habit tracking system"
        >
          <ToggleSwitch
            checked={settings.trackHabits}
            onChange={(checked) => handleSettingChange('trackHabits', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Calendar Integration"
          description="Sync goals with calendar events and deadlines"
        >
          <ToggleSwitch
            checked={settings.linkToCalendar}
            onChange={(checked) => handleSettingChange('linkToCalendar', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Data Export"
          description="Enable exporting goal data and progress reports"
        >
          <ToggleSwitch
            checked={settings.exportData}
            onChange={(checked) => handleSettingChange('exportData', checked)}
          />
        </SettingsItem>
      </SettingsSection>
    </SettingsModal>
  );
}