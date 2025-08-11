// src/components/LinkedInScrapingSettings.tsx
// LinkedIn scraping configuration interface for Job Finder settings

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Save,
  Loader,
  AlertCircle,
  Check,
  Info,
  Activity,
  Lock,
  Globe,
  Search,
  TrendingUp,
  ChevronDown,
  Linkedin,
  BarChart,
  Database,
  Trash2
} from 'lucide-react';
import { ScrapingConfigService, ScrapingPreferences } from '../lib/scraping-config-service';
import { supabase } from '../lib/supabase';

interface LinkedInScrapingSettingsProps {
  className?: string;
}

interface QuotaInfo {
  daily_searches_used: number;
  linkedin_max_searches_per_day: number;
  success_rate_7d: number;
  total_searches_7d: number;
  last_search_at?: string;
}

export default function LinkedInScrapingSettings({ className = '' }: LinkedInScrapingSettingsProps) {
  const [preferences, setPreferences] = useState<ScrapingPreferences | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load preferences and stats on mount
  useEffect(() => {
    loadUserPreferences();
    loadScrapingStats();
    loadQuotaInfo();
  }, []);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const prefs = await ScrapingConfigService.getUserPreferences(user.id);
      setPreferences(prefs);

    } catch (err) {
      console.error('Error loading scraping preferences:', err);
      setError('Failed to load preferences. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadScrapingStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const statsData = await ScrapingConfigService.getScrapingStats(user.id, 'day');
      setStats(statsData);

    } catch (err) {
      console.error('Error loading scraping stats:', err);
    }
  };

  const loadQuotaInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate quota info from recent activity
      const weekStats = await ScrapingConfigService.getScrapingStats(user.id, 'week');
      const dayStats = await ScrapingConfigService.getScrapingStats(user.id, 'day');
      
      const successRate = weekStats.requests_made > 0 
        ? Math.round((weekStats.successful_requests / weekStats.requests_made) * 100)
        : 0;

      setQuotaInfo({
        daily_searches_used: dayStats.requests_made,
        linkedin_max_searches_per_day: preferences?.linkedin_max_results_per_search || 10,
        success_rate_7d: successRate,
        total_searches_7d: weekStats.requests_made,
        last_search_at: weekStats.last_request_at
      });

    } catch (err) {
      console.error('Error loading quota info:', err);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      await ScrapingConfigService.updatePreferences(user.id, preferences);
      
      setSuccess('✅ LinkedIn scraping settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Reload stats after saving
      await loadScrapingStats();
      await loadQuotaInfo();

    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof ScrapingPreferences>(
    key: K, 
    value: ScrapingPreferences[K]
  ) => {
    if (!preferences) return;
    
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700 dark:text-red-300">Failed to load scraping preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-2">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Current Usage Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Today's Usage</p>
              <p className="text-2xl font-bold text-primary">{stats?.requests_made || 0}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Search className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-secondary opacity-70 mt-1">
            of {preferences.linkedin_max_results_per_search || 50} daily limit
          </p>
        </div>
        
        <div className="bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Success Rate</p>
              <p className="text-2xl font-bold text-primary">
                {stats && stats.requests_made > 0 
                  ? Math.round((stats.successful_requests / stats.requests_made) * 100)
                  : 0}%
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-secondary opacity-70 mt-1">Last 24 hours</p>
        </div>
        
        <div className="bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Rate Limit</p>
              <p className="text-2xl font-bold text-primary">
                {(preferences.linkedin_rate_limit_ms || 3000) / 1000}s
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-secondary opacity-70 mt-1">Between requests</p>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-primary">Basic Configuration</h4>
        
        {/* Enable/Disable LinkedIn Scraping */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h5 className="font-medium text-primary">Enable LinkedIn Scraping</h5>
            <p className="text-sm text-secondary">Allow Rashenal to search LinkedIn for job opportunities</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.linkedin_enabled}
              onChange={(e) => updatePreference('linkedin_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>
        
        {/* Rate Limiting */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h5 className="font-medium text-primary mb-2">
            <Clock className="h-4 w-4 inline mr-1" />
            Rate Limiting
          </h5>
          <p className="text-sm text-secondary mb-3">Delay between LinkedIn requests (seconds)</p>
          <div className="space-y-3">
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={(preferences.linkedin_rate_limit_ms || 3000) / 1000}
              onChange={(e) => updatePreference('linkedin_rate_limit_ms', parseFloat(e.target.value) * 1000)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-secondary opacity-70">
              <span>1s (Fast)</span>
              <span className="font-medium text-primary">
                {((preferences.linkedin_rate_limit_ms || 3000) / 1000).toFixed(1)}s
              </span>
              <span>10s (Safe)</span>
            </div>
          </div>
          <p className="text-xs text-secondary opacity-70 mt-2">
            Higher values are more respectful to LinkedIn's servers (recommended: 3-5s)
          </p>
        </div>
        
        {/* Results per Search */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h5 className="font-medium text-primary mb-2">
            <Zap className="h-4 w-4 inline mr-1" />
            Results per Search
          </h5>
          <p className="text-sm text-secondary mb-3">Maximum jobs to extract per search</p>
          <select
            value={preferences.linkedin_max_results_per_search || 50}
            onChange={(e) => updatePreference('linkedin_max_results_per_search', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value={25}>25 jobs (Quick)</option>
            <option value={50}>50 jobs (Recommended)</option>
            <option value={75}>75 jobs (Thorough)</option>
            <option value={100}>100 jobs (Maximum)</option>
          </select>
          <p className="text-xs text-secondary opacity-70 mt-2">
            Lower values reduce server load and scraping time
          </p>
        </div>

        {/* User Agent Rotation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h5 className="font-medium text-primary">
              <Shield className="h-4 w-4 inline mr-1" />
              User Agent Rotation
            </h5>
            <p className="text-sm text-secondary">Rotate browser signatures for better reliability</p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.linkedin_user_agent_rotation !== false}
              onChange={(e) => updatePreference('linkedin_user_agent_rotation', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-secondary">Enable</span>
          </label>
        </div>
      </div>

      {/* Advanced Settings (Collapsible) */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          type="button"
          className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <h4 className="text-lg font-semibold text-primary">Advanced Settings</h4>
          <ChevronDown className={`h-5 w-5 text-secondary transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        
        {showAdvanced && (
          <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            {/* Privacy Settings */}
            <div className="space-y-3">
              <h5 className="font-medium text-primary flex items-center">
                <Lock className="h-4 w-4 mr-2 text-green-600" />
                Privacy & Safety
              </h5>
              
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-primary">Respect Rate Limits</span>
                  <p className="text-xs text-secondary">Always honor server rate limits</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.respect_rate_limits !== false}
                  disabled // Always required
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-primary">Anti-Bot Measures</span>
                  <p className="text-xs text-secondary">Use stealth techniques to avoid detection</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enable_anti_bot_measures !== false}
                  disabled // Always required
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-primary">Anonymize Searches</span>
                  <p className="text-xs text-secondary">Remove personal info from logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.anonymize_searches !== false}
                  onChange={(e) => updatePreference('anonymize_searches', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-primary">Store Raw HTML</span>
                  <p className="text-xs text-secondary">Keep scraped data for debugging</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.store_raw_html === true}
                  onChange={(e) => updatePreference('store_raw_html', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>
            
            {/* Technical Settings */}
            <div className="space-y-3">
              <h5 className="font-medium text-primary">Technical Configuration</h5>
              
              {/* Concurrent Requests */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Maximum Concurrent Requests
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={preferences.max_concurrent_requests || 1}
                    onChange={(e) => updatePreference('max_concurrent_requests', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-secondary min-w-[2rem]">
                    {preferences.max_concurrent_requests || 1}
                  </span>
                </div>
                <p className="text-xs text-secondary opacity-70 mt-1">
                  Higher values may trigger anti-bot detection (recommended: 1)
                </p>
              </div>

              {/* Default Delay */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Default Delay Between Requests (ms)
                </label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={preferences.default_delay_ms || 2000}
                  onChange={(e) => updatePreference('default_delay_ms', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
                />
                <p className="text-xs text-secondary opacity-70 mt-1">
                  Minimum delay for all job boards (minimum: 500ms)
                </p>
              </div>

              {/* Max Retries */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Maximum Retries on Failure
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={preferences.max_retries || 3}
                    onChange={(e) => updatePreference('max_retries', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-secondary min-w-[2rem]">
                    {preferences.max_retries || 3}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      {stats && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-primary flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Today's Usage Statistics
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.requests_made}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Total Requests</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.successful_requests}</div>
              <div className="text-xs text-green-700 dark:text-green-300">Successful</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.rate_limited_requests}</div>
              <div className="text-xs text-orange-700 dark:text-orange-300">Rate Limited</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.failed_requests}</div>
              <div className="text-xs text-red-700 dark:text-red-300">Failed</div>
            </div>
          </div>

          {stats.last_request_at && (
            <p className="text-xs text-secondary opacity-70">
              Last request: {new Date(stats.last_request_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-secondary">
        <button
          onClick={handleSave}
          disabled={saving || !preferences.linkedin_enabled}
          className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">⚖️ Legal Notice</p>
            <p>
              Job board scraping must comply with LinkedIn's Terms of Service and robots.txt files. 
              This tool is designed for personal job searching only. Commercial use may require permission 
              from LinkedIn. Users are responsible for ensuring compliance with applicable laws and terms.
              Rashenal implements respectful scraping practices to minimize server impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}