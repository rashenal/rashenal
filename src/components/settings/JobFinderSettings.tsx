import React from 'react';
import { 
  Eye, 
  RefreshCcw, 
  Search, 
  Target,
  Building,
  DollarSign,
  MapPin,
  Star,
  Clock,
  FileDown,
  Palette,
  BarChart3,
  Shield
} from 'lucide-react';
import SettingsModal, { 
  SettingsSection, 
  SettingsItem, 
  ToggleSwitch,
  getLocalSettings 
} from '../shared/SettingsModal';

interface JobFinderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: JobFinderSettings) => void;
}

export interface JobFinderSettings {
  // Display settings
  showCompany: boolean;
  showSalary: boolean;
  showLocation: boolean;
  showMatchScore: boolean;
  showDatePosted: boolean;
  showJobType: boolean;
  showExperience: boolean;
  showDescription: boolean;
  
  // Search settings
  defaultSortOrder: 'match_score' | 'date_posted' | 'salary' | 'company';
  autoRefreshInterval: number;
  enableAutoRefresh: boolean;
  minMatchScore: number;
  maxResults: number;
  searchRadius: number;
  includeRemote: boolean;
  
  // Profile settings
  defaultProfile: string;
  profileSwitchConfirmation: boolean;
  
  // Notification settings
  newMatchNotifications: boolean;
  applicationDeadlines: boolean;
  weeklyDigest: boolean;
  
  // Data & Export settings
  exportFormat: 'csv' | 'json' | 'pdf';
  includeMatchDetails: boolean;
  includeApplicationHistory: boolean;
  
  // Privacy settings
  anonymizeData: boolean;
  shareAnalytics: boolean;
  
  // Theme settings
  cardLayout: 'compact' | 'detailed' | 'minimal';
  colorScheme: 'default' | 'professional' | 'vibrant';
  showLogos: boolean;
}

export const defaultJobFinderSettings: JobFinderSettings = {
  // Display settings
  showCompany: true,
  showSalary: true,
  showLocation: true,
  showMatchScore: true,
  showDatePosted: true,
  showJobType: true,
  showExperience: true,
  showDescription: true,
  
  // Search settings
  defaultSortOrder: 'match_score',
  autoRefreshInterval: 60,
  enableAutoRefresh: false,
  minMatchScore: 70,
  maxResults: 50,
  searchRadius: 25,
  includeRemote: true,
  
  // Profile settings
  defaultProfile: '',
  profileSwitchConfirmation: true,
  
  // Notification settings
  newMatchNotifications: true,
  applicationDeadlines: true,
  weeklyDigest: false,
  
  // Data & Export settings
  exportFormat: 'csv',
  includeMatchDetails: true,
  includeApplicationHistory: false,
  
  // Privacy settings
  anonymizeData: false,
  shareAnalytics: true,
  
  // Theme settings
  cardLayout: 'detailed',
  colorScheme: 'professional',
  showLogos: true,
};

export default function JobFinderSettings({
  isOpen,
  onClose,
  onSettingsChange
}: JobFinderSettingsProps) {
  const [settings, setSettings] = React.useState<JobFinderSettings>(
    () => getLocalSettings('job-finder', defaultJobFinderSettings)
  );

  const handleSettingChange = <K extends keyof JobFinderSettings>(
    key: K,
    value: JobFinderSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'display', label: 'Display', icon: <Eye className="h-4 w-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Target className="h-4 w-4" /> },
    { id: 'data', label: 'Data & Export', icon: <FileDown className="h-4 w-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="h-4 w-4" /> },
  ];

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Job Finder"
      tabs={tabs}
      onSave={onSettingsChange}
      settings={settings}
      sectionId="job-finder"
    >
      {/* Display Tab */}
      <SettingsSection title="Card Display Fields" tabId="display">
        <SettingsItem 
          label="Show Company Name"
          description="Display company name on job cards"
        >
          <ToggleSwitch
            checked={settings.showCompany}
            onChange={(checked) => handleSettingChange('showCompany', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Salary Range"
          description="Display salary information when available"
        >
          <ToggleSwitch
            checked={settings.showSalary}
            onChange={(checked) => handleSettingChange('showSalary', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Location"
          description="Display job location and remote options"
        >
          <ToggleSwitch
            checked={settings.showLocation}
            onChange={(checked) => handleSettingChange('showLocation', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Match Score"
          description="Display AI-generated match percentage"
        >
          <ToggleSwitch
            checked={settings.showMatchScore}
            onChange={(checked) => handleSettingChange('showMatchScore', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Date Posted"
          description="Display when job was posted"
        >
          <ToggleSwitch
            checked={settings.showDatePosted}
            onChange={(checked) => handleSettingChange('showDatePosted', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Job Type"
          description="Display full-time, part-time, contract, etc."
        >
          <ToggleSwitch
            checked={settings.showJobType}
            onChange={(checked) => handleSettingChange('showJobType', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Experience Level"
          description="Display required experience level"
        >
          <ToggleSwitch
            checked={settings.showExperience}
            onChange={(checked) => handleSettingChange('showExperience', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Description Preview"
          description="Display job description preview"
        >
          <ToggleSwitch
            checked={settings.showDescription}
            onChange={(checked) => handleSettingChange('showDescription', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Search Tab */}
      <SettingsSection title="Search & Filtering" tabId="search">
        <SettingsItem 
          label="Default Sort Order"
          description="How to sort job results by default"
        >
          <select
            value={settings.defaultSortOrder}
            onChange={(e) => handleSettingChange('defaultSortOrder', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="match_score">Match Score</option>
            <option value="date_posted">Date Posted</option>
            <option value="salary">Salary</option>
            <option value="company">Company</option>
          </select>
        </SettingsItem>

        <SettingsItem 
          label="Auto-refresh Results"
          description="Automatically check for new job matches"
        >
          <ToggleSwitch
            checked={settings.enableAutoRefresh}
            onChange={(checked) => handleSettingChange('enableAutoRefresh', checked)}
          />
        </SettingsItem>

        {settings.enableAutoRefresh && (
          <SettingsItem 
            label="Refresh Interval"
            description="How often to check for new jobs (minutes)"
          >
            <select
              value={settings.autoRefreshInterval}
              onChange={(e) => handleSettingChange('autoRefreshInterval', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
              <option value={120}>Every 2 hours</option>
              <option value={240}>Every 4 hours</option>
            </select>
          </SettingsItem>
        )}
        
        <SettingsItem 
          label="Minimum Match Score"
          description="Only show jobs above this match percentage"
        >
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.minMatchScore}
              onChange={(e) => handleSettingChange('minMatchScore', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-600 min-w-[40px]">
              {settings.minMatchScore}%
            </span>
          </div>
        </SettingsItem>
        
        <SettingsItem 
          label="Max Results Per Search"
          description="Limit number of results to show"
        >
          <select
            value={settings.maxResults}
            onChange={(e) => handleSettingChange('maxResults', parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={25}>25 results</option>
            <option value={50}>50 results</option>
            <option value={100}>100 results</option>
            <option value={200}>200 results</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Search Radius (miles)"
          description="Maximum distance for local job searches"
        >
          <select
            value={settings.searchRadius}
            onChange={(e) => handleSettingChange('searchRadius', parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
            <option value={100}>100 miles</option>
            <option value={0}>Unlimited</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Include Remote Jobs"
          description="Show remote and hybrid positions in results"
        >
          <ToggleSwitch
            checked={settings.includeRemote}
            onChange={(checked) => handleSettingChange('includeRemote', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Confirm Profile Switch"
          description="Ask for confirmation when switching job profiles"
        >
          <ToggleSwitch
            checked={settings.profileSwitchConfirmation}
            onChange={(checked) => handleSettingChange('profileSwitchConfirmation', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Notifications Tab */}
      <SettingsSection title="Notifications" tabId="notifications">
        <SettingsItem 
          label="New Match Notifications"
          description="Get notified when new job matches are found"
        >
          <ToggleSwitch
            checked={settings.newMatchNotifications}
            onChange={(checked) => handleSettingChange('newMatchNotifications', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Application Deadline Reminders"
          description="Remind me about upcoming application deadlines"
        >
          <ToggleSwitch
            checked={settings.applicationDeadlines}
            onChange={(checked) => handleSettingChange('applicationDeadlines', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Weekly Digest"
          description="Receive weekly summary of job market activity"
        >
          <ToggleSwitch
            checked={settings.weeklyDigest}
            onChange={(checked) => handleSettingChange('weeklyDigest', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Data & Export Tab */}
      <SettingsSection title="Data Management" tabId="data">
        <SettingsItem 
          label="Export Format"
          description="Default format for exporting job data"
        >
          <select
            value={settings.exportFormat}
            onChange={(e) => handleSettingChange('exportFormat', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF Report</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Include Match Analysis"
          description="Include AI match analysis in exports"
        >
          <ToggleSwitch
            checked={settings.includeMatchDetails}
            onChange={(checked) => handleSettingChange('includeMatchDetails', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Include Application History"
          description="Include application tracking data in exports"
        >
          <ToggleSwitch
            checked={settings.includeApplicationHistory}
            onChange={(checked) => handleSettingChange('includeApplicationHistory', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Privacy Tab */}
      <SettingsSection title="Privacy & Security" tabId="privacy">
        <SettingsItem 
          label="Anonymize Exported Data"
          description="Remove personally identifiable information from exports"
        >
          <ToggleSwitch
            checked={settings.anonymizeData}
            onChange={(checked) => handleSettingChange('anonymizeData', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Share Usage Analytics"
          description="Help improve Job Finder by sharing anonymous usage data"
        >
          <ToggleSwitch
            checked={settings.shareAnalytics}
            onChange={(checked) => handleSettingChange('shareAnalytics', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Theme Tab */}
      <SettingsSection title="Theme & Appearance" tabId="theme">
        <SettingsItem 
          label="Card Layout Style"
          description="Choose how job cards are displayed"
        >
          <select
            value={settings.cardLayout}
            onChange={(e) => handleSettingChange('cardLayout', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="compact">Compact</option>
            <option value="detailed">Detailed</option>
            <option value="minimal">Minimal</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Color Scheme"
          description="Choose visual theme for Job Finder"
        >
          <select
            value={settings.colorScheme}
            onChange={(e) => handleSettingChange('colorScheme', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default</option>
            <option value="professional">Professional</option>
            <option value="vibrant">Vibrant</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Show Company Logos"
          description="Display company logos on job cards when available"
        >
          <ToggleSwitch
            checked={settings.showLogos}
            onChange={(checked) => handleSettingChange('showLogos', checked)}
          />
        </SettingsItem>
      </SettingsSection>
    </SettingsModal>
  );
}