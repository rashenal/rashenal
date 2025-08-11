import React from 'react';
import { 
  Eye, 
  Layout, 
  Palette, 
  RefreshCcw,
  Target,
  BarChart3,
  Clock,
  Grid3x3
} from 'lucide-react';
import SettingsModal, { 
  SettingsSection, 
  SettingsItem, 
  ToggleSwitch,
  getLocalSettings 
} from '../shared/SettingsModal';

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: DashboardSettings) => void;
}

export interface DashboardSettings {
  // Widget visibility
  showHabitsWidget: boolean;
  showTasksWidget: boolean;
  showAchievementsWidget: boolean;
  showQuickActionsWidget: boolean;
  showAIInsightsWidget: boolean;
  showProgressWidget: boolean;
  showTimerWidget: boolean;
  showGoalsWidget: boolean;
  
  // Layout preferences
  layoutStyle: 'grid' | 'list' | 'masonry';
  widgetColumns: number;
  compactMode: boolean;
  
  // Refresh & updates
  autoRefresh: boolean;
  refreshInterval: number; // in minutes
  
  // Personalization
  greeting: 'formal' | 'casual' | 'motivational';
  showUserAvatar: boolean;
  showProgressPercentages: boolean;
  showStreaks: boolean;
  
  // AI Coach integration
  showAICoachWidget: boolean;
  enableQuickTips: boolean;
  
  // Theme & appearance
  colorScheme: 'default' | 'vibrant' | 'minimal' | 'professional';
  widgetStyle: 'cards' | 'flat' | 'gradient';
  backgroundStyle: 'default' | 'subtle' | 'vibrant';
}

export const defaultDashboardSettings: DashboardSettings = {
  // Widget visibility
  showHabitsWidget: true,
  showTasksWidget: true,
  showAchievementsWidget: true,
  showQuickActionsWidget: true,
  showAIInsightsWidget: true,
  showProgressWidget: true,
  showTimerWidget: true,
  showGoalsWidget: true,
  
  // Layout preferences
  layoutStyle: 'grid',
  widgetColumns: 3,
  compactMode: false,
  
  // Refresh & updates
  autoRefresh: true,
  refreshInterval: 5,
  
  // Personalization
  greeting: 'casual',
  showUserAvatar: true,
  showProgressPercentages: true,
  showStreaks: true,
  
  // AI Coach integration
  showAICoachWidget: true,
  enableQuickTips: true,
  
  // Theme & appearance
  colorScheme: 'default',
  widgetStyle: 'cards',
  backgroundStyle: 'default',
};

export default function DashboardSettings({
  isOpen,
  onClose,
  onSettingsChange
}: DashboardSettingsProps) {
  const [settings, setSettings] = React.useState<DashboardSettings>(
    () => getLocalSettings('dashboard', defaultDashboardSettings)
  );

  const handleSettingChange = <K extends keyof DashboardSettings>(
    key: K,
    value: DashboardSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: <Grid3x3 className="h-4 w-4" /> },
    { id: 'layout', label: 'Layout', icon: <Layout className="h-4 w-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <RefreshCcw className="h-4 w-4" /> },
    { id: 'personalization', label: 'Personal', icon: <Target className="h-4 w-4" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="h-4 w-4" /> },
  ];

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Dashboard"
      tabs={tabs}
      onSave={onSettingsChange}
      settings={settings}
      sectionId="dashboard"
    >
      {/* Widgets Tab */}
      <SettingsSection title="Widget Visibility" tabId="widgets">
        <SettingsItem 
          label="Habits Overview"
          description="Show daily habits progress and streaks"
        >
          <ToggleSwitch
            checked={settings.showHabitsWidget}
            onChange={(checked) => handleSettingChange('showHabitsWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Tasks Summary"
          description="Display today's tasks and quick actions"
        >
          <ToggleSwitch
            checked={settings.showTasksWidget}
            onChange={(checked) => handleSettingChange('showTasksWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Achievements"
          description="Show badges, milestones, and recent accomplishments"
        >
          <ToggleSwitch
            checked={settings.showAchievementsWidget}
            onChange={(checked) => handleSettingChange('showAchievementsWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Quick Actions"
          description="Show quick start buttons for common actions"
        >
          <ToggleSwitch
            checked={settings.showQuickActionsWidget}
            onChange={(checked) => handleSettingChange('showQuickActionsWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="AI Insights"
          description="Display personalized AI recommendations"
        >
          <ToggleSwitch
            checked={settings.showAIInsightsWidget}
            onChange={(checked) => handleSettingChange('showAIInsightsWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Progress Overview"
          description="Show weekly and monthly progress charts"
        >
          <ToggleSwitch
            checked={settings.showProgressWidget}
            onChange={(checked) => handleSettingChange('showProgressWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Focus Timer"
          description="Show integrated Pomodoro timer widget"
        >
          <ToggleSwitch
            checked={settings.showTimerWidget}
            onChange={(checked) => handleSettingChange('showTimerWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Goals Tracker"
          description="Display current goals and milestones"
        >
          <ToggleSwitch
            checked={settings.showGoalsWidget}
            onChange={(checked) => handleSettingChange('showGoalsWidget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="AI Coach Widget"
          description="Show AI coach quick chat and tips"
        >
          <ToggleSwitch
            checked={settings.showAICoachWidget}
            onChange={(checked) => handleSettingChange('showAICoachWidget', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Layout Tab */}
      <SettingsSection title="Layout & Display" tabId="layout">
        <SettingsItem 
          label="Layout Style"
          description="Choose how widgets are arranged"
        >
          <select
            value={settings.layoutStyle}
            onChange={(e) => handleSettingChange('layoutStyle', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="grid">Grid Layout</option>
            <option value="list">List Layout</option>
            <option value="masonry">Masonry Layout</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Widget Columns"
          description="Number of columns in grid layout"
        >
          <select
            value={settings.widgetColumns}
            onChange={(e) => handleSettingChange('widgetColumns', parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Compact Mode"
          description="Use smaller widget sizes to fit more on screen"
        >
          <ToggleSwitch
            checked={settings.compactMode}
            onChange={(checked) => handleSettingChange('compactMode', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Behavior Tab */}
      <SettingsSection title="Behavior & Updates" tabId="behavior">
        <SettingsItem 
          label="Auto-refresh Data"
          description="Automatically update widget data in the background"
        >
          <ToggleSwitch
            checked={settings.autoRefresh}
            onChange={(checked) => handleSettingChange('autoRefresh', checked)}
          />
        </SettingsItem>
        
        {settings.autoRefresh && (
          <SettingsItem 
            label="Refresh Interval"
            description="How often to update data (minutes)"
          >
            <select
              value={settings.refreshInterval}
              onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Every minute</option>
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
            </select>
          </SettingsItem>
        )}
      </SettingsSection>

      {/* Personalization Tab */}
      <SettingsSection title="Personalization" tabId="personalization">
        <SettingsItem 
          label="Greeting Style"
          description="How the dashboard greets you"
        >
          <select
            value={settings.greeting}
            onChange={(e) => handleSettingChange('greeting', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="formal">Formal (Good morning, [Name])</option>
            <option value="casual">Casual (Hey [Name]!)</option>
            <option value="motivational">Motivational (Ready to conquer the day, [Name]?)</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Show User Avatar"
          description="Display your profile picture on the dashboard"
        >
          <ToggleSwitch
            checked={settings.showUserAvatar}
            onChange={(checked) => handleSettingChange('showUserAvatar', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Progress Percentages"
          description="Display numerical progress percentages"
        >
          <ToggleSwitch
            checked={settings.showProgressPercentages}
            onChange={(checked) => handleSettingChange('showProgressPercentages', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Streaks"
          description="Highlight streak counts and achievements"
        >
          <ToggleSwitch
            checked={settings.showStreaks}
            onChange={(checked) => handleSettingChange('showStreaks', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Enable Quick Tips"
          description="Show contextual tips and suggestions"
        >
          <ToggleSwitch
            checked={settings.enableQuickTips}
            onChange={(checked) => handleSettingChange('enableQuickTips', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Theme Tab */}
      <SettingsSection title="Theme & Appearance" tabId="theme">
        <SettingsItem 
          label="Color Scheme"
          description="Choose overall dashboard color theme"
        >
          <select
            value={settings.colorScheme}
            onChange={(e) => handleSettingChange('colorScheme', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default</option>
            <option value="vibrant">Vibrant</option>
            <option value="minimal">Minimal</option>
            <option value="professional">Professional</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Widget Style"
          description="Choose widget appearance style"
        >
          <select
            value={settings.widgetStyle}
            onChange={(e) => handleSettingChange('widgetStyle', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="cards">Card Style</option>
            <option value="flat">Flat Style</option>
            <option value="gradient">Gradient Style</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Background Style"
          description="Dashboard background appearance"
        >
          <select
            value={settings.backgroundStyle}
            onChange={(e) => handleSettingChange('backgroundStyle', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default Gradient</option>
            <option value="subtle">Subtle Pattern</option>
            <option value="vibrant">Vibrant Colors</option>
          </select>
        </SettingsItem>
      </SettingsSection>
    </SettingsModal>
  );
}