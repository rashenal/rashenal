import React, { useState, useEffect } from 'react';
import {
  Settings,
  Eye,
  Ear,
  MousePointer,
  Keyboard,
  Palette,
  Volume2,
  Monitor,
  Sun,
  Moon,
  Contrast,
  Type,
  Zap,
  Shield,
  Smartphone,
  Globe,
  Save,
  RotateCcw,
  Check,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme, ThemeMode, FontSize } from '../contexts/ThemeContext';

interface AccessibilityPreferences {
  // Visual Preferences
  theme: 'light' | 'dark' | 'auto' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reducedMotion: boolean;
  highContrast: boolean;
  showRolloverHints: boolean;
  
  // Audio Preferences
  soundEffects: boolean;
  screenReaderOptimized: boolean;
  voiceAnnouncements: boolean;
  
  // Navigation Preferences
  keyboardNavigation: boolean;
  focusIndicators: 'standard' | 'enhanced' | 'high-visibility';
  skipLinks: boolean;
  
  // Content Preferences
  autoPlay: boolean;
  animatedContent: boolean;
  complexLayouts: boolean;
  
  // Language & Localization
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';
  dateFormat: 'US' | 'EU' | 'ISO';
  
  // Security & Privacy
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  shareWithCommunity: boolean;
}

interface AccessibilitySettingsProps {
  onClose?: () => void;
  className?: string;
}

export default function AccessibilitySettings({ onClose, className = '' }: AccessibilitySettingsProps) {
  const { 
    theme, 
    accessibilitySettings, 
    setTheme, 
    setFontSize, 
    toggleHighContrast, 
    toggleMotionReduction, 
    updateAccessibilitySettings,
    getContrastRatio,
    isWCAGAACompliant
  } = useTheme();
  
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    theme: theme === 'high-contrast-light' || theme === 'high-contrast-dark' ? 'high-contrast' : 
          theme === 'dark' ? 'dark' : 'light',
    fontSize: accessibilitySettings.fontSize,
    colorBlindMode: 'none',
    reducedMotion: accessibilitySettings.motionReduced,
    highContrast: accessibilitySettings.highContrast,
    showRolloverHints: true,
    soundEffects: true,
    screenReaderOptimized: accessibilitySettings.screenReader,
    voiceAnnouncements: false,
    keyboardNavigation: accessibilitySettings.keyboardNavigation,
    focusIndicators: 'standard',
    skipLinks: true,
    autoPlay: false,
    animatedContent: true,
    complexLayouts: true,
    language: 'en',
    dateFormat: 'US',
    twoFactorEnabled: false,
    sessionTimeout: 60,
    shareWithCommunity: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'navigation' | 'content' | 'security'>('visual');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // First try to load from localStorage
      const localPrefs = localStorage.getItem('accessibility_preferences');
      if (localPrefs) {
        try {
          const parsed = JSON.parse(localPrefs);
          setPreferences(prevPrefs => ({ ...prevPrefs, ...parsed }));
          // Apply loaded preferences
          setTimeout(() => {
            applyLoadedPreferences(parsed);
          }, 100);
          return;
        } catch (e) {
          console.warn('Failed to parse local preferences:', e);
        }
      }

      // Fallback to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('accessibility_settings')
        .eq('user_id', user.id)
        .single();

      if (data?.accessibility_settings) {
        setPreferences(prevPrefs => ({ ...prevPrefs, ...data.accessibility_settings }));
        setTimeout(() => {
          applyLoadedPreferences(data.accessibility_settings);
        }, 100);
      } else {
        console.warn('No accessibility settings found in database');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      // Save to localStorage as primary storage (always works)
      localStorage.setItem('accessibility_preferences', JSON.stringify(preferences));
      
      // Try to save to database as backup (may fail if table doesn't exist)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try to save to user_preferences table
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              accessibility_settings: preferences,
              updated_at: new Date().toISOString()
            });
          
          // If table doesn't exist, create a simple record in profiles
          if (error && error.message.includes('relation "user_preferences" does not exist')) {
            await supabase
              .from('profiles')
              .update({
                accessibility_preferences: preferences,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
          } else if (error) {
            console.warn('Database save failed, using localStorage only:', error);
          }
        }
      } catch (dbError) {
        console.warn('Database save failed, using localStorage only:', dbError);
      }

      // Apply preferences immediately
      applyPreferences();
      
      // Show success message
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreferences = () => {
    // Update theme context
    if (preferences.theme === 'high-contrast') {
      const baseTheme = theme.includes('dark') ? 'dark' : 'light';
      setTheme(`high-contrast-${baseTheme}` as ThemeMode);
    } else if (preferences.theme === 'dark') {
      setTheme('dark');
    } else if (preferences.theme === 'light') {
      setTheme('light');
    }
    
    // Update font size
    setFontSize(preferences.fontSize as FontSize);
    
    // Update accessibility settings
    updateAccessibilitySettings({
      highContrast: preferences.highContrast,
      motionReduced: preferences.reducedMotion,
      screenReader: preferences.screenReaderOptimized,
      keyboardNavigation: preferences.keyboardNavigation,
      focusVisible: preferences.focusIndicators !== 'standard'
    });
    
    // Apply color blind mode filters (custom CSS)
    const root = document.documentElement;
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (preferences.colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${preferences.colorBlindMode}`);
    }
  };

  const applyLoadedPreferences = (loadedPrefs: Partial<AccessibilityPreferences>) => {
    // Update theme context
    if (loadedPrefs.theme === 'high-contrast') {
      const baseTheme = theme.includes('dark') ? 'dark' : 'light';
      setTheme(`high-contrast-${baseTheme}` as ThemeMode);
    } else if (loadedPrefs.theme === 'dark') {
      setTheme('dark');
    } else if (loadedPrefs.theme === 'light') {
      setTheme('light');
    }
    
    // Update font size
    if (loadedPrefs.fontSize) {
      setFontSize(loadedPrefs.fontSize as FontSize);
    }
    
    // Update accessibility settings
    updateAccessibilitySettings({
      highContrast: loadedPrefs.highContrast || false,
      motionReduced: loadedPrefs.reducedMotion || false,
      screenReader: loadedPrefs.screenReaderOptimized || false,
      keyboardNavigation: loadedPrefs.keyboardNavigation || false,
      focusVisible: (loadedPrefs.focusIndicators && loadedPrefs.focusIndicators !== 'standard') || false
    });
    
    // Apply color blind mode filters
    const root = document.documentElement;
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (loadedPrefs.colorBlindMode && loadedPrefs.colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${loadedPrefs.colorBlindMode}`);
    }
  };

  const resetToDefaults = () => {
    setPreferences({
      theme: 'auto',
      fontSize: 'medium',
      colorBlindMode: 'none',
      reducedMotion: false,
      highContrast: false,
      showRolloverHints: true,
      soundEffects: true,
      screenReaderOptimized: false,
      voiceAnnouncements: false,
      keyboardNavigation: true,
      focusIndicators: 'standard',
      skipLinks: true,
      autoPlay: false,
      animatedContent: true,
      complexLayouts: true,
      language: 'en',
      dateFormat: 'US',
      twoFactorEnabled: false,
      sessionTimeout: 60,
      shareWithCommunity: false
    });
  };

  const tabs = [
    { id: 'visual', label: 'Visual', icon: Eye },
    { id: 'audio', label: 'Audio', icon: Ear },
    { id: 'navigation', label: 'Navigation', icon: MousePointer },
    { id: 'content', label: 'Content', icon: Monitor },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="linkedin-card">
        <div className="linkedin-card-body text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-linkedin-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="linkedin-text">Loading accessibility settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`linkedin-theme ${className}`}>
      <div className="linkedin-card max-w-4xl mx-auto">
        <div className="linkedin-card-header">
          <div className="linkedin-flex">
            <Settings className="h-6 w-6 text-linkedin-blue" />
            <h2 className="linkedin-heading-2">Accessibility & Preferences</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="linkedin-btn linkedin-btn-ghost">
              ×
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-linkedin-gray-200">
          <nav className="linkedin-flex px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`linkedin-btn linkedin-btn-ghost px-4 py-3 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-linkedin-blue text-linkedin-blue'
                      : 'border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="linkedin-card-body">
          {/* Visual Settings */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              <div>
                <label className="linkedin-label">Theme Preference</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as any;
                    setPreferences({ ...preferences, theme: newTheme });
                    
                    // Apply immediately for visual feedback
                    if (newTheme === 'high-contrast') {
                      const baseTheme = theme.includes('dark') ? 'dark' : 'light';
                      setTheme(`high-contrast-${baseTheme}` as ThemeMode);
                    } else if (newTheme === 'dark') {
                      setTheme('dark');
                    } else if (newTheme === 'light') {
                      setTheme('light');
                    }
                  }}
                  className="linkedin-select"
                >
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="high-contrast">High Contrast</option>
                </select>
              </div>

              <div>
                <label className="linkedin-label">Font Size</label>
                <select
                  value={preferences.fontSize}
                  onChange={(e) => {
                    const newSize = e.target.value as FontSize;
                    setPreferences({ ...preferences, fontSize: newSize });
                    setFontSize(newSize); // Apply immediately
                  }}
                  className="linkedin-select"
                >
                  <option value="small">Small (14px)</option>
                  <option value="medium">Medium (16px)</option>
                  <option value="large">Large (18px)</option>
                  <option value="extra-large">Extra Large (20px)</option>
                </select>
              </div>

              <div>
                <label className="linkedin-label">Color Vision Support</label>
                <select
                  value={preferences.colorBlindMode}
                  onChange={(e) => setPreferences({ ...preferences, colorBlindMode: e.target.value as any })}
                  className="linkedin-select"
                >
                  <option value="none">None</option>
                  <option value="protanopia">Protanopia (Red-blind)</option>
                  <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                  <option value="tritanopia">Tritanopia (Blue-blind)</option>
                </select>
              </div>

              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="reducedMotion"
                  checked={preferences.reducedMotion}
                  onChange={(e) => setPreferences({ ...preferences, reducedMotion: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="reducedMotion" className="linkedin-label ml-3">
                  Reduce Motion
                  <p className="linkedin-text-sm font-normal">Minimize animations and transitions</p>
                </label>
              </div>

              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="showRolloverHints"
                  checked={preferences.showRolloverHints}
                  onChange={(e) => setPreferences({ ...preferences, showRolloverHints: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="showRolloverHints" className="linkedin-label ml-3">
                  Show rollover hints
                  <p className="linkedin-text-sm font-normal">Display helpful tooltips when hovering over UI elements</p>
                </label>
              </div>
            </div>
          )}

          {/* Audio Settings */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="soundEffects"
                  checked={preferences.soundEffects}
                  onChange={(e) => setPreferences({ ...preferences, soundEffects: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="soundEffects" className="linkedin-label ml-3">
                  Sound Effects
                  <p className="linkedin-text-sm font-normal">Play sounds for notifications and interactions</p>
                </label>
              </div>

              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="screenReader"
                  checked={preferences.screenReaderOptimized}
                  onChange={(e) => setPreferences({ ...preferences, screenReaderOptimized: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="screenReader" className="linkedin-label ml-3">
                  Screen Reader Optimization
                  <p className="linkedin-text-sm font-normal">Optimize interface for screen readers</p>
                </label>
              </div>

              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="voiceAnnouncements"
                  checked={preferences.voiceAnnouncements}
                  onChange={(e) => setPreferences({ ...preferences, voiceAnnouncements: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="voiceAnnouncements" className="linkedin-label ml-3">
                  Voice Announcements
                  <p className="linkedin-text-sm font-normal">Announce important updates and status changes</p>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Settings */}
          {activeTab === 'navigation' && (
            <div className="space-y-6">
              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="keyboardNav"
                  checked={preferences.keyboardNavigation}
                  onChange={(e) => setPreferences({ ...preferences, keyboardNavigation: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="keyboardNav" className="linkedin-label ml-3">
                  Enhanced Keyboard Navigation
                  <p className="linkedin-text-sm font-normal">Enable full keyboard access to all features</p>
                </label>
              </div>

              <div>
                <label className="linkedin-label">Focus Indicators</label>
                <select
                  value={preferences.focusIndicators}
                  onChange={(e) => setPreferences({ ...preferences, focusIndicators: e.target.value as any })}
                  className="linkedin-select"
                >
                  <option value="standard">Standard</option>
                  <option value="enhanced">Enhanced</option>
                  <option value="high-visibility">High Visibility</option>
                </select>
              </div>

              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="skipLinks"
                  checked={preferences.skipLinks}
                  onChange={(e) => setPreferences({ ...preferences, skipLinks: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="skipLinks" className="linkedin-label ml-3">
                  Skip Navigation Links
                  <p className="linkedin-text-sm font-normal">Show skip links for faster navigation</p>
                </label>
              </div>
            </div>
          )}

          {/* Content Settings */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="autoPlay"
                  checked={preferences.autoPlay}
                  onChange={(e) => setPreferences({ ...preferences, autoPlay: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="autoPlay" className="linkedin-label ml-3">
                  Auto-play Media
                  <p className="linkedin-text-sm font-normal">Automatically play videos and animations</p>
                </label>
              </div>

              <div>
                <label className="linkedin-label">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value as any })}
                  className="linkedin-select"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div>
                <label className="linkedin-label">Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value as any })}
                  className="linkedin-select"
                >
                  <option value="US">US (MM/DD/YYYY)</option>
                  <option value="EU">European (DD/MM/YYYY)</option>
                  <option value="ISO">ISO (YYYY-MM-DD)</option>
                </select>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="twoFactor"
                  checked={preferences.twoFactorEnabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShowPhonePrompt(true);
                    } else {
                      setPreferences({ ...preferences, twoFactorEnabled: false });
                    }
                  }}
                  className="mt-1"
                />
                <label htmlFor="twoFactor" className="linkedin-label ml-3">
                  Two-Factor Authentication (SMS)
                  <p className="linkedin-text-sm font-normal">Add an extra layer of security with SMS verification</p>
                </label>
              </div>

              <div>
                <label className="linkedin-label">Session Timeout (minutes)</label>
                <select
                  value={preferences.sessionTimeout}
                  onChange={(e) => setPreferences({ ...preferences, sessionTimeout: Number(e.target.value) })}
                  className="linkedin-select"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>

              <div className="linkedin-flex items-start">
                <input
                  type="checkbox"
                  id="shareWithCommunity"
                  checked={preferences.shareWithCommunity}
                  onChange={(e) => setPreferences({ ...preferences, shareWithCommunity: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="shareWithCommunity" className="linkedin-label ml-3">
                  Share with Rashenal Community
                  <p className="linkedin-text-sm font-normal">Allow friends to see your public job search activity</p>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="linkedin-card-footer linkedin-flex-between">
          <button
            onClick={resetToDefaults}
            className="linkedin-btn linkedin-btn-ghost"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
          
          <div className="linkedin-flex">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="linkedin-btn linkedin-btn-primary"
            >
              {saving ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Phone Setup Modal */}
      {showPhonePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="linkedin-card max-w-md w-full">
            <div className="linkedin-card-header">
              <h3 className="linkedin-heading-3">Setup Two-Factor Authentication</h3>
            </div>
            <div className="linkedin-card-body">
              <div className="linkedin-flex mb-4">
                <Smartphone className="h-5 w-5 text-linkedin-blue" />
                <div>
                  <p className="linkedin-text font-medium">Phone Verification</p>
                  <p className="linkedin-text-sm">We'll send a verification code to your phone</p>
                </div>
              </div>
              
              <label className="linkedin-label">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="linkedin-input"
                placeholder="+1 (555) 123-4567"
              />
              
              {verificationCode && (
                <>
                  <label className="linkedin-label mt-4">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="linkedin-input"
                    placeholder="123456"
                    maxLength={6}
                  />
                </>
              )}
            </div>
            <div className="linkedin-card-footer linkedin-flex-between">
              <button
                onClick={() => {
                  setShowPhonePrompt(false);
                  setPhoneNumber('');
                  setVerificationCode('');
                }}
                className="linkedin-btn linkedin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement SMS verification
                  setPreferences({ ...preferences, twoFactorEnabled: true });
                  setShowPhonePrompt(false);
                }}
                className="linkedin-btn linkedin-btn-primary"
                disabled={!phoneNumber}
              >
                <Shield className="h-4 w-4" />
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}