import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

interface SettingsTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tabs: SettingsTab[];
  children: React.ReactNode;
  onSave: (settings: any) => void;
  settings: any;
  sectionId: string;
}

// Context for settings changes
const SettingsContext = createContext<{
  settings: any;
  updateSetting: (key: string, value: any) => void;
} | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsModal');
  }
  return context;
}

export default function SettingsModal({
  isOpen,
  onClose,
  title,
  tabs,
  children,
  onSave,
  settings,
  sectionId
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  // Check for changes whenever localSettings changes
  useEffect(() => {
    const hasChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(hasChanged);
  }, [localSettings, settings]);

  // Listen for any form input changes to enable the Apply button
  useEffect(() => {
    if (!isOpen) return;

    const handleInputChange = () => {
      // Small delay to allow state updates to complete
      setTimeout(() => {
        setHasChanges(true);
      }, 50);
    };

    const handleInputEvent = (e: Event) => {
      // Check if this is a settings-related input
      const target = e.target as HTMLElement;
      const isSettingsInput = target.closest('[data-settings-modal]') !== null;
      
      if (isSettingsInput || target.matches('input, select, textarea, button[role="switch"]')) {
        handleInputChange();
      }
    };

    const handleSettingsChange = (e: CustomEvent) => {
      console.log('Settings change detected:', e.detail);
      setHasChanges(true);
    };

    // Add event listeners to the modal container
    const modalContainer = document.querySelector('[data-settings-modal]');
    if (modalContainer) {
      modalContainer.addEventListener('change', handleInputEvent);
      modalContainer.addEventListener('click', handleInputEvent);
      modalContainer.addEventListener('input', handleInputEvent);
    }

    // Listen for custom settings change events
    document.addEventListener('settingsChange', handleSettingsChange as EventListener);

    return () => {
      if (modalContainer) {
        modalContainer.removeEventListener('change', handleInputEvent);
        modalContainer.removeEventListener('click', handleInputEvent);
        modalContainer.removeEventListener('input', handleInputEvent);
      }
      document.removeEventListener('settingsChange', handleSettingsChange as EventListener);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [isOpen, tabs]);

  const handleSave = () => {
    try {
      onSave(localSettings);
      localStorage.setItem(`settings_${sectionId}`, JSON.stringify(localSettings));
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save preferences. Please try again.');
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div 
        className="bg-white h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        data-settings-modal="true"
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title} Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 px-6 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <SettingsContext.Provider value={{ settings: localSettings, updateSetting }}>
            {React.Children.toArray(children).filter((child: any) => 
              child.props?.tabId === activeTab || !child.props?.tabId
            )}
          </SettingsContext.Provider>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>Apply Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Section Component for organizing content
export function SettingsSection({ 
  title, 
  children, 
  tabId 
}: { 
  title?: string; 
  children: React.ReactNode; 
  tabId?: string;
}) {
  return (
    <div className="space-y-4" data-tab-id={tabId}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}

// Settings Item Component for individual settings
export function SettingsItem({ 
  label, 
  description, 
  children 
}: { 
  label: string; 
  description?: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {label}
          </label>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
export function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled = false 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// Export helper to get settings from localStorage
export function getLocalSettings<T>(sectionId: string, defaultSettings: T): T {
  try {
    const stored = localStorage.getItem(`settings_${sectionId}`);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
}