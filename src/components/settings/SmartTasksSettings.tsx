import React from 'react';
import { 
  Layout, 
  Eye, 
  Clock, 
  Database, 
  FileDown, 
  Palette,
  List,
  Grid3x3,
  Calendar,
  Upload,
  Download,
  Trash2
} from 'lucide-react';
import SettingsModal, { 
  SettingsSection, 
  SettingsItem, 
  ToggleSwitch,
  getLocalSettings 
} from '../shared/SettingsModal';

interface SmartTasksSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: SmartTasksSettings) => void;
  onImportExport?: () => void;
  onRecycleBin?: () => void;
  recycleCount?: number;
}

export interface SmartTasksSettings {
  // Display settings
  showTitle: boolean;
  showDescription: boolean;
  showPriority: boolean;
  showOwner: boolean;
  showEstimatedHours: boolean;
  showComments: boolean;
  showAttachments: boolean;
  
  // View settings
  defaultView: 'kanban' | 'list' | 'calendar';
  columnsVisible: {
    backlog: boolean;
    todo: boolean;
    inProgress: boolean;
    blocked: boolean;
    done: boolean;
  };
  
  // Behavior settings
  autosaveInterval: number;
  enableDragDrop: boolean;
  confirmDelete: boolean;
  showCompletedTasks: boolean;
  
  // Board settings
  defaultTaskStatus: string;
  maxTasksPerColumn: number;
  
  // Theme settings
  cardStyle: 'minimal' | 'detailed' | 'compact';
  colorScheme: 'default' | 'dark' | 'colorful';
}

export const defaultSmartTasksSettings: SmartTasksSettings = {
  // Display settings
  showTitle: true,
  showDescription: true,
  showPriority: true,
  showOwner: true,
  showEstimatedHours: true,
  showComments: true,
  showAttachments: true,
  
  // View settings
  defaultView: 'kanban',
  columnsVisible: {
    backlog: true,
    todo: true,
    inProgress: true,
    blocked: true,
    done: true,
  },
  
  // Behavior settings
  autosaveInterval: 30,
  enableDragDrop: true,
  confirmDelete: true,
  showCompletedTasks: true,
  
  // Board settings
  defaultTaskStatus: 'BACKLOG',
  maxTasksPerColumn: 50,
  
  // Theme settings
  cardStyle: 'detailed',
  colorScheme: 'default',
};

export default function SmartTasksSettings({
  isOpen,
  onClose,
  onSettingsChange,
  onImportExport,
  onRecycleBin,
  recycleCount = 0
}: SmartTasksSettingsProps) {
  const [settings, setSettings] = React.useState<SmartTasksSettings>(
    () => getLocalSettings('smart-tasks', defaultSmartTasksSettings)
  );

  const handleSettingChange = <K extends keyof SmartTasksSettings>(
    key: K,
    value: SmartTasksSettings[K]
  ) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    
    // Trigger change detection immediately
    const event = new CustomEvent('settingsChange', { 
      detail: { key, value, settings: newSettings },
      bubbles: true 
    });
    document.dispatchEvent(event);
  };

  const handleColumnVisibilityChange = (column: string, visible: boolean) => {
    const newSettings = {
      ...settings,
      columnsVisible: {
        ...settings.columnsVisible,
        [column]: visible
      }
    };
    setSettings(newSettings);
    
    // Trigger change detection immediately
    const event = new CustomEvent('settingsChange', { 
      detail: { key: 'columnsVisible', value: newSettings.columnsVisible, settings: newSettings },
      bubbles: true 
    });
    document.dispatchEvent(event);
  };

  const tabs = [
    { id: 'display', label: 'Display', icon: <Eye className="h-4 w-4" /> },
    { id: 'view', label: 'View', icon: <Layout className="h-4 w-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <Clock className="h-4 w-4" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="h-4 w-4" /> },
  ];

  const handleSave = (updatedSettings: SmartTasksSettings) => {
    try {
      setSettings(updatedSettings);
      onSettingsChange(updatedSettings);
      console.log('SmartTasks settings saved successfully:', updatedSettings);
    } catch (error) {
      console.error('Error in SmartTasks settings save:', error);
      throw error; // Re-throw to let SettingsModal handle the alert
    }
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Tasks"
      tabs={tabs}
      onSave={handleSave}
      settings={settings}
      sectionId="smart-tasks"
    >
      {/* Display Tab */}
      <SettingsSection title="Card Display Fields" tabId="display">
        <SettingsItem 
          label="Show Title"
          description="Display task title on cards"
        >
          <ToggleSwitch
            checked={settings.showTitle}
            onChange={(checked) => handleSettingChange('showTitle', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Description"
          description="Display task description preview"
        >
          <ToggleSwitch
            checked={settings.showDescription}
            onChange={(checked) => handleSettingChange('showDescription', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Priority"
          description="Display priority badge on cards"
        >
          <ToggleSwitch
            checked={settings.showPriority}
            onChange={(checked) => handleSettingChange('showPriority', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Owner"
          description="Display task owner/assignee"
        >
          <ToggleSwitch
            checked={settings.showOwner}
            onChange={(checked) => handleSettingChange('showOwner', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Estimated Hours"
          description="Display time estimates"
        >
          <ToggleSwitch
            checked={settings.showEstimatedHours}
            onChange={(checked) => handleSettingChange('showEstimatedHours', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Comments Count"
          description="Display number of comments"
        >
          <ToggleSwitch
            checked={settings.showComments}
            onChange={(checked) => handleSettingChange('showComments', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Attachments Count"
          description="Display number of attachments"
        >
          <ToggleSwitch
            checked={settings.showAttachments}
            onChange={(checked) => handleSettingChange('showAttachments', checked)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* View Tab */}
      <SettingsSection title="View Settings" tabId="view">
        <SettingsItem 
          label="Default View"
          description="Choose default board view when loading"
        >
          <select
            value={settings.defaultView}
            onChange={(e) => handleSettingChange('defaultView', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="kanban">Kanban Board</option>
            <option value="list">List View</option>
            <option value="calendar">Calendar View</option>
          </select>
        </SettingsItem>

        <div className="space-y-2 mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Column Visibility</h4>
          
          <SettingsItem 
            label="Backlog"
            description="Show Backlog column"
          >
            <ToggleSwitch
              checked={settings.columnsVisible.backlog}
              onChange={(checked) => handleColumnVisibilityChange('backlog', checked)}
            />
          </SettingsItem>
          
          <SettingsItem 
            label="To Do"
            description="Show To Do column"
          >
            <ToggleSwitch
              checked={settings.columnsVisible.todo}
              onChange={(checked) => handleColumnVisibilityChange('todo', checked)}
            />
          </SettingsItem>
          
          <SettingsItem 
            label="In Progress"
            description="Show In Progress column"
          >
            <ToggleSwitch
              checked={settings.columnsVisible.inProgress}
              onChange={(checked) => handleColumnVisibilityChange('inProgress', checked)}
            />
          </SettingsItem>
          
          <SettingsItem 
            label="Blocked"
            description="Show Blocked column"
          >
            <ToggleSwitch
              checked={settings.columnsVisible.blocked}
              onChange={(checked) => handleColumnVisibilityChange('blocked', checked)}
            />
          </SettingsItem>
          
          <SettingsItem 
            label="Done"
            description="Show Done column"
          >
            <ToggleSwitch
              checked={settings.columnsVisible.done}
              onChange={(checked) => handleColumnVisibilityChange('done', checked)}
            />
          </SettingsItem>
        </div>
      </SettingsSection>

      {/* Behavior Tab */}
      <SettingsSection title="Behavior Settings" tabId="behavior">
        <SettingsItem 
          label="Autosave Interval"
          description="How often to save changes (in seconds)"
        >
          <input
            type="number"
            min="5"
            max="300"
            value={settings.autosaveInterval}
            onChange={(e) => handleSettingChange('autosaveInterval', parseInt(e.target.value))}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Enable Drag & Drop"
          description="Allow dragging tasks between columns"
        >
          <ToggleSwitch
            checked={settings.enableDragDrop}
            onChange={(checked) => handleSettingChange('enableDragDrop', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Confirm Before Delete"
          description="Show confirmation dialog when deleting tasks"
        >
          <ToggleSwitch
            checked={settings.confirmDelete}
            onChange={(checked) => handleSettingChange('confirmDelete', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Show Completed Tasks"
          description="Display tasks in Done column"
        >
          <ToggleSwitch
            checked={settings.showCompletedTasks}
            onChange={(checked) => handleSettingChange('showCompletedTasks', checked)}
          />
        </SettingsItem>
        
        <SettingsItem 
          label="Default Task Status"
          description="Status for newly created tasks"
        >
          <select
            value={settings.defaultTaskStatus}
            onChange={(e) => handleSettingChange('defaultTaskStatus', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Max Tasks Per Column"
          description="Maximum number of tasks to display per column"
        >
          <input
            type="number"
            min="10"
            max="200"
            value={settings.maxTasksPerColumn}
            onChange={(e) => handleSettingChange('maxTasksPerColumn', parseInt(e.target.value))}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </SettingsItem>
      </SettingsSection>

      {/* Theme Tab */}
      <SettingsSection title="Theme & Appearance" tabId="theme">
        <SettingsItem 
          label="Card Style"
          description="Choose how task cards are displayed"
        >
          <select
            value={settings.cardStyle}
            onChange={(e) => handleSettingChange('cardStyle', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="minimal">Minimal</option>
            <option value="detailed">Detailed</option>
            <option value="compact">Compact</option>
          </select>
        </SettingsItem>
        
        <SettingsItem 
          label="Color Scheme"
          description="Choose board color theme"
        >
          <select
            value={settings.colorScheme}
            onChange={(e) => handleSettingChange('colorScheme', e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default</option>
            <option value="dark">Dark Mode</option>
            <option value="colorful">Colorful</option>
          </select>
        </SettingsItem>
      </SettingsSection>

      {/* Data Management Tab */}
      <SettingsSection title="Data Management" tabId="data">
        <SettingsItem 
          label="Import/Export Tasks"
          description="Import tasks from CSV or export current tasks"
        >
          <button
            onClick={onImportExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import/Export</span>
          </button>
        </SettingsItem>
        
        <SettingsItem 
          label="Recycle Bin"
          description={`View and restore deleted tasks (${recycleCount} items)`}
        >
          <button
            onClick={onRecycleBin}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Open Recycle Bin</span>
          </button>
        </SettingsItem>
      </SettingsSection>
    </SettingsModal>
  );
}