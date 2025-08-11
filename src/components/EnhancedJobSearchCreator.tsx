import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building,
  Briefcase,
  Plus,
  X,
  Save,
  Loader,
  AlertCircle,
  Check,
  Target,
  Settings,
  Play,
  ChevronDown,
  ChevronUp,
  Bot,
  Clock,
  DollarSign,
  Users,
  Zap,
  Filter,
  Globe,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { 
  EnhancedJobSearch, 
  JobProfile, 
  JobBoardSource,
  SearchExecutionLog 
} from '../lib/database-types';
import { JobDiscoveryService } from '../lib/job-discovery-service';

interface EnhancedJobSearchCreatorProps {
  className?: string;
  onSearchCreated?: (search: EnhancedJobSearch) => void;
  onSearchExecuted?: (results: number) => void;
}

export default function EnhancedJobSearchCreator({ 
  className = '',
  onSearchCreated,
  onSearchExecuted 
}: EnhancedJobSearchCreatorProps) {
  const { user } = useUser();
  
  // Core state
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [jobBoards, setJobBoards] = useState<JobBoardSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<EnhancedJobSearch>>({
    name: '',
    job_title: '',
    location: '',
    remote_type: null,
    employment_type: ['full-time'],
    experience_level: null,
    salary_min: null,
    salary_max: null,
    salary_currency: 'GBP',
    company_size: null,
    industry_sectors: null,
    required_skills: [],
    preferred_skills: [],
    work_authorization: null,
    visa_sponsorship: null,
    selected_job_boards: ['linkedin', 'indeed'],
    search_frequency: 'manual',
    scheduled_time: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    max_results_per_board: 50,
    ai_matching_enabled: true,
    minimum_match_score: 70,
    is_active: true
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [profilesData, jobBoardsData] = await Promise.all([
        supabase.from('job_profiles').select('*').eq('user_id', user.id),
        JobDiscoveryService.getJobBoardSources()
      ]);

      if (profilesData.error) throw profilesData.error;
      
      setProfiles(profilesData.data || []);
      setJobBoards(jobBoardsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile selection and population
  const handleProfileSelect = (profile: JobProfile) => {
    setSelectedProfile(profile);
    const populatedData = JobDiscoveryService.populateSearchFromProfile(profile);
    setFormData(prev => ({
      ...prev,
      ...populatedData,
      name: `${profile.name} - Job Search`
    }));
    setSuccess('Search form populated from profile!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle form field changes
  const handleChange = (field: keyof EnhancedJobSearch, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle array field changes
  const handleArrayChange = (field: keyof EnhancedJobSearch, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  // Save search
  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      if (!formData.name?.trim()) {
        throw new Error('Search name is required');
      }

      const savedSearch = await JobDiscoveryService.createEnhancedSearch(formData);
      setSuccess('Job search saved successfully!');
      onSearchCreated?.(savedSearch);
      
      // Reset form
      setFormData({
        name: '',
        job_title: '',
        location: '',
        remote_type: null,
        employment_type: ['full-time'],
        experience_level: null,
        salary_min: null,
        salary_max: null,
        salary_currency: 'GBP',
        company_size: null,
        industry_sectors: null,
        required_skills: [],
        preferred_skills: [],
        work_authorization: null,
        visa_sponsorship: null,
        selected_job_boards: ['linkedin', 'indeed'],
        search_frequency: 'manual',
        scheduled_time: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        max_results_per_board: 50,
        ai_matching_enabled: true,
        minimum_match_score: 70,
        is_active: true
      });
      setSelectedProfile(null);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving search:', err);
      setError(err instanceof Error ? err.message : 'Failed to save search');
    } finally {
      setSaving(false);
    }
  };

  // Execute search immediately
  const handleSearchNow = async () => {
    if (!user) return;

    try {
      setExecuting(true);
      setError(null);

      // First save the search if not already saved
      const savedSearch = await JobDiscoveryService.createEnhancedSearch(formData);
      
      // Then execute it
      const executionLog = await JobDiscoveryService.executeSearch(savedSearch.id);
      
      setSuccess(`Search executed! Found ${executionLog.total_results_found || 0} jobs across job boards.`);
      onSearchExecuted?.(executionLog.total_results_found || 0);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error executing search:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute search');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-primary rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-purple-600 mr-2" />
          <span className="text-secondary">Loading job search creator...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-primary rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-2xl font-bold text-primary">Enhanced Job Search</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-purple-600" />
          <span className="text-sm text-secondary">AI-Powered</span>
        </div>
      </div>

      {/* Profile Selection */}
      {profiles.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-primary mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Quick Setup from Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                className={`p-3 text-left rounded-lg transition-all ${
                  selectedProfile?.id === profile.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                <div className="font-medium text-sm">{profile.name}</div>
                <div className="text-xs opacity-75">{profile.experience_level || 'Experience level not set'}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
          <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
          <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
          <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
          <span className="text-green-800 dark:text-green-200 text-sm">{success}</span>
        </div>
      )}

      {/* Basic Search Form */}
      <div className="space-y-4 mb-6">
        {/* Search Name */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Search Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value))
            placeholder="e.g., Senior Developer Roles - Remote"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            required
          />
        </div>

        {/* Job Title and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              <Briefcase className="h-4 w-4 inline mr-1" />
              Job Title
            </label>
            <input
              type="text"
              value={formData.job_title || ''}
              onChange={(e) => handleChange('job_title', e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., London, UK or Remote"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            />
          </div>
        </div>

        {/* Remote Type and Experience Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Remote Preference
            </label>
            <select
              value={formData.remote_type || ''}
              onChange={(e) => handleChange('remote_type', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            >
              <option value="">Any</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              <Target className="h-4 w-4 inline mr-1" />
              Experience Level
            </label>
            <select
              value={formData.experience_level || ''}
              onChange={(e) => handleChange('experience_level', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            >
              <option value="">Any</option>
              <option value="intern">Intern</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Salary Range
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={formData.salary_min || ''}
              onChange={(e) => handleChange('salary_min', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Min"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            />
            <input
              type="number"
              value={formData.salary_max || ''}
              onChange={(e) => handleChange('salary_max', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Max"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            />
            <select
              value={formData.salary_currency || 'GBP'}
              onChange={(e) => handleChange('salary_currency', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            >
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Job Boards Selection */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            <Search className="h-4 w-4 inline mr-1" />
            Job Boards to Search
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {jobBoards.map(board => (
              <label key={board.id} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="checkbox"
                  checked={(formData.selected_job_boards || []).includes(board.name)}
                  onChange={(e) => handleArrayChange('selected_job_boards', board.name, e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-primary">{board.display_name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-center py-2 mb-4 text-sm text-purple-600 hover:text-purple-800 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
      >
        <Filter className="h-4 w-4 mr-2" />
        Advanced Options
        {showAdvanced ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              value={(formData.required_skills || []).join(', ')}
              onChange={(e) => handleChange('required_skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
              placeholder="e.g., JavaScript, React, Node.js"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
            />
          </div>

          {/* AI Configuration */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.ai_matching_enabled !== false}
                onChange={(e) => handleChange('ai_matching_enabled', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-primary">Enable AI job matching and scoring</span>
            </label>
            
            {formData.ai_matching_enabled !== false && (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Minimum Match Score: {formData.minimum_match_score || 70}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.minimum_match_score || 70}
                  onChange={(e) => handleChange('minimum_match_score', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheduling Toggle */}
      <button
        onClick={() => setShowScheduling(!showScheduling)}
        className="w-full flex items-center justify-center py-2 mb-4 text-sm text-purple-600 hover:text-purple-800 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Schedule Automated Searches
        {showScheduling ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
      </button>

      {/* Scheduling Options */}
      {showScheduling && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Search Frequency
              </label>
              <select
                value={formData.search_frequency || 'manual'}
                onChange={(e) => handleChange('search_frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
              >
                <option value="manual">Manual only</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi_weekly">Bi-weekly</option>
              </select>
            </div>

            {formData.search_frequency !== 'manual' && (
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Preferred Time
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time || '09:00'}
                  onChange={(e) => handleChange('scheduled_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSearchNow}
          disabled={executing || !formData.name?.trim()}
          className="flex-1 flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {executing ? (
            <Loader className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {executing ? 'Searching...' : 'Search Now'}
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !formData.name?.trim())
          className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <Loader className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Search'}
        </button>
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <Zap className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">AI-Enhanced Job Matching</p>
            <p>
              Your searches will be analyzed by AI to provide match scores, skill gap analysis, 
              and personalized recommendations for each job opportunity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}