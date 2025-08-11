import React from 'react';
import { 
  Eye, 
  Calendar, 
  Palette, 
  Zap,
  Target,
  Clock,
  BarChart3,
  FileDown
} from 'lucide-react';
import SettingsModal, { 
  SettingsSection, 
  SettingsItem, 
  ToggleSwitch,
  getLocalSettings 
} from '../shared/SettingsModal';

interface HabitsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: HabitsSettings) => void;
}

export interface HabitsSettings {
  // Display settings
  showStreak: boolean;
  showTarget: boolean;
  showLastCompleted: boolean;
  showProgress: boolean;
  showIcon: boolean;
  showCategory: boolean;
  
  // Calendar settings
  weekStartDay: 'monday' | 'sunday';
  showWeekNumbers: boolean;
  highlightToday: boolean;
  
  // View settings
  defaultView: 'circles' | 'list' | 'calendar' | 'grid';
  cardsPerRow: number;
  showCompletionAnimation: boolean;
  
  // Notification settings
  enableReminders: boolean;
  reminderTime: string;
  reminderDays: string[];
  motivationalMessages: boolean;
  
  // Behavior settings
  confirmCompletion: boolean;
  allowPartialCompletion: boolean;
  autoAdvanceDay: boolean;
  showInsights: boolean;
  
  // Data settings
  trackMissedDays: boolean;
  showStatistics: boolean;
  exportFormat: 'csv' | 'json';
  
  // Theme settings
  colorScheme: 'default' | 'vibrant' | 'minimal' | 'dark';
  cardStyle: 'modern' | 'classic' | 'compact';
}

export const defaultHabitsSettings: HabitsSettings = {
  // Display settings
  showStreak: true,
  showTarget: true,
  showLastCompleted: true,
  showProgress: true,
  showIcon: true,
  showCategory: true,
  
  // Calendar settings
  weekStartDay: 'monday',
  showWeekNumbers: false,
  highlightToday: true,
  
  // View settings
  defaultView: 'circles',
  cardsPerRow: 3,
  showCompletionAnimation: true,
  
  // Notification settings
  enableReminders: false,
  reminderTime: '09:00',
  reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  motivationalMessages: true,
  
  // Behavior settings
  confirmCompletion: false,
  allowPartialCompletion: true,
  autoAdvanceDay: true,
  showInsights: true,
  
  // Data settings
  trackMissedDays: true,
  showStatistics: true,
  exportFormat: 'csv',
  
  // Theme settings
  colorScheme: 'default',
  cardStyle: 'modern',
};

export default function HabitsSettings({
  isOpen,
  onClose,
  onSettingsChange
}: HabitsSettingsProps) {
  const [settings, setSettings] = React.useState<HabitsSettings>(
    () => getLocalSettings('habits', defaultHabitsSettings)
  );

  const handleSettingChange = <K extends keyof HabitsSettings>(
    key: K,
    value: HabitsSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReminderDayToggle = (day: string) => {
    setSettings(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day]
    }));
  };

  const tabs = [
    { id: 'display', label: 'Display', icon: <Eye className="h-4 w-4" /> },
    { id: 'view', label: 'View', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Zap className="h-4 w-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <Target className="h-4 w-4" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="h-4 w-4" /> },
  ];

  const dayNames = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Habits"
      tabs={tabs}
      onSave={onSettingsChange}
      settings={settings}
      sectionId="habits"
    >
      {/* Display Tab */}
      <SettingsSection title="Card Display Options" tabId="display">
        <SettingsItem 
          label="Show Streak"
          description="Display current streak count on habit cards"
        >
          <ToggleSwitch
            checked={settings.showStreak}
            onChange={(checked) => handleSettingChange('showStreak', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Target"
          description="Display target/goal on habit cards"
        >
          <ToggleSwitch
            checked={settings.showTarget}
            onChange={(checked) => handleSettingChange('showTarget', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Last Completed"
          description="Display when habit was last completed"
        >
          <ToggleSwitch
            checked={settings.showLastCompleted}
            onChange={(checked) => handleSettingChange('showLastCompleted', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Progress Bar"
          description="Display progress visualization"
        >
          <ToggleSwitch
            checked={settings.showProgress}
            onChange={(checked) => handleSettingChange('showProgress', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Icons"
          description="Display habit icons/emojis"
        >
          <ToggleSwitch
            checked={settings.showIcon}
            onChange={(checked) => handleSettingChange('showIcon', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Category"
          description="Display habit category labels"
        >
          <ToggleSwitch
            checked={settings.showCategory}
            onChange={(checked) => handleSettingChange('showCategory', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* View Tab */}
      <SettingsSection title="View & Layout" tabId="view">
        <SettingsItem 
          label="Default View"
          description="Choose default view when loading habits"
        >
          <select
            value={settings.defaultView}
            onChange={(e) => handleSettingChange('defaultView', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="circles">Circles View</option>
            <option value="list">List View</option>
            <option value="calendar">Calendar View</option>
            <option value="grid">Grid View</option>
          </select>
        </SettingsItem>

        <SettingsItem 
          label="Cards Per Row"
          description="Number of habit cards to display per row"
        >
          <select
            value={settings.cardsPerRow}
            onChange={(e) => handleSettingChange('cardsPerRow', parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>1 card</option>
            <option value={2}>2 cards</option>
            <option value={3}>3 cards</option>
            <option value={4}>4 cards</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Week Start Day"
          description="First day of the week in calendar views"
        >
          <select
            value={settings.weekStartDay}
            onChange={(e) => handleSettingChange('weekStartDay', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Show Week Numbers"
          description="Display week numbers in calendar view"
        >
          <ToggleSwitch
            checked={settings.showWeekNumbers}
            onChange={(checked) => handleSettingChange('showWeekNumbers', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Highlight Today"
          description="Highlight current day in views"
        >
          <ToggleSwitch
            checked={settings.highlightToday}
            onChange={(checked) => handleSettingChange('highlightToday', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Completion Animation"
          description="Show animation when completing habits"
        >
          <ToggleSwitch
            checked={settings.showCompletionAnimation}
            onChange={(checked) => handleSettingChange('showCompletionAnimation', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Notifications Tab */}
      <SettingsSection title="Reminders & Notifications" tabId="notifications">
        <SettingsItem 
          label="Enable Reminders"
          description="Send daily habit reminders"
        >
          <ToggleSwitch
            checked={settings.enableReminders}
            onChange={(checked) => handleSettingChange('enableReminders', checked)}
          />
        </SettingsItem>
        
        {settings.enableReminders && (
          <>
            <SettingsItem 
              label="Reminder Time"
              description="Time to send daily reminders"
            >
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </SettingsItem>

            <div className="space-y-2 mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Reminder Days</h4>
              {dayNames.map((day) => (
                <SettingsItem 
                  key={day.key}
                  label={day.label}
                  description=""
                >
                  <ToggleSwitch
                    checked={settings.reminderDays.includes(day.key)}
                    onChange={() => handleReminderDayToggle(day.key)}
                  />
                </SettingsItem>
              ))}
            </div>
          </>
        )}
        
        <SettingsItem 
          label="Motivational Messages"
          description="Show encouraging messages and tips"
        >
          <ToggleSwitch
            checked={settings.motivationalMessages}
            onChange={(checked) => handleSettingChange('motivationalMessages', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Behavior Tab */}
      <SettingsSection title="Behavior Settings" tabId="behavior">
        <SettingsItem 
          label="Confirm Completion"
          description="Show confirmation when marking habits complete"
        >
          <ToggleSwitch
            checked={settings.confirmCompletion}
            onChange={(checked) => handleSettingChange('confirmCompletion', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Allow Partial Completion"
          description="Allow marking habits as partially complete"
        >
          <ToggleSwitch
            checked={settings.allowPartialCompletion}
            onChange={(checked) => handleSettingChange('allowPartialCompletion', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Auto-advance Day"
          description="Automatically advance to next day at midnight"
        >
          <ToggleSwitch
            checked={settings.autoAdvanceDay}
            onChange={(checked) => handleSettingChange('autoAdvanceDay', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show AI Insights"
          description="Display AI-powered habit insights and suggestions"
        >
          <ToggleSwitch
            checked={settings.showInsights}
            onChange={(checked) => handleSettingChange('showInsights', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Track Missed Days"
          description="Keep record of days when habits weren't completed"
        >
          <ToggleSwitch
            checked={settings.trackMissedDays}
            onChange={(checked) => handleSettingChange('trackMissedDays', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Statistics"
          description="Display detailed habit statistics and analytics"
        >
          <ToggleSwitch
            checked={settings.showStatistics}
            onChange={(checked) => handleSettingChange('showStatistics', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Export Format"
          description="Default format for exporting habit data"
        >
          <select
            value={settings.exportFormat}
            onChange={(e) => handleSettingChange('exportFormat', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </SettingsItem>
      </SettingsSection>

      {/* Theme Tab */}
      <SettingsSection title="Theme & Appearance" tabId="theme">
        <SettingsItem 
          label="Color Scheme"
          description="Choose overall color theme"
        >
          <select
            value={settings.colorScheme}
            onChange={(e) => handleSettingChange('colorScheme', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default</option>
            <option value="vibrant">Vibrant</option>
            <option value="minimal">Minimal</option>
            <option value="dark">Dark Mode</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Card Style"
          description="Choose how habit cards are styled"
        >
          <select
            value={settings.cardStyle}
            onChange={(e) => handleSettingChange('cardStyle', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="compact">Compact</option>
          </select>
        </SettingsItem>
      </SettingsSection>
    </SettingsModal>
  );
}