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
  Pause,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Filter,
  Bot,
  Clock,
  DollarSign,
  Users,
  Zap,
  Globe,
  Calendar,
  Star,
  Sparkles,
  Square,
  Lock,
  Unlock,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EnhancedJobSearch, JobProfile } from '../lib/database-types';
import { JobFinderService } from '../lib/job-finder-service';
import { JobDiscoveryService, AIJobLevelAnalysis } from '../lib/job-discovery-service';
import { ScrapingConfigService } from '../lib/scraping-config-service';
import { LinkedInScraperService } from '../lib/linkedin-scraper-service';
import { BackgroundSearchService } from '../lib/background-search-service';
import SearchControlPanel from './SearchControlPanel';
import AccessibilitySettings from './AccessibilitySettings';
import '../styles/linkedin-theme.css';

interface JobSearchCreatorProps {
  className?: string;
}

export default function JobSearchCreator({ className = '' }: JobSearchCreatorProps) {
  const [searches, setSearches] = useState<EnhancedJobSearch[]>([]);
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [isSearchRunning, setIsSearchRunning] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingSearch, setEditingSearch] = useState<Partial<EnhancedJobSearch> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiLevelAnalysis, setAiLevelAnalysis] = useState<AIJobLevelAnalysis | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Enhanced form state with all required fields
  const [formData, setFormData] = useState<Partial<EnhancedJobSearch>>({
    name: '',
    profile_id: null,
    job_title: '',
    location: '',
    remote_type: null,
    employment_type: ['permanent'],
    experience_level: null,
    salary_min: null,
    salary_max: null,
    salary_currency: 'GBP',
    required_skills: [],
    company_size: null,
    industry_sectors: null,
    work_authorization: null,
    search_frequency: 'manual',
    scheduled_time: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ai_matching_enabled: true,
    minimum_match_score: 70,
    is_active: true
  });

  // Enhanced options for dropdowns
  const remoteOptions = [
    { value: 'onsite', label: 'On-site Only', icon: '🏢', description: 'Must be in office' },
    { value: 'hybrid', label: 'Hybrid', icon: '🔄', description: 'Mix of office and remote' },
    { value: 'remote', label: 'Remote Only', icon: '🏠', description: 'Work from anywhere' },
    { value: 'flexible', label: 'Flexible', icon: '⚡', description: 'Open to any arrangement' }
  ];

  const employmentTypes = [
    { value: 'permanent', label: 'Permanent', icon: '💼', description: 'Full-time permanent role' },
    { value: 'contract', label: 'Contract', icon: '📋', description: 'Fixed-term contract' },
    { value: 'temporary', label: 'Temporary', icon: '⏰', description: 'Short-term position' },
    { value: 'freelance', label: 'Freelance', icon: '💻', description: 'Project-based work' },
    { value: 'part-time', label: 'Part-time', icon: '🕐', description: 'Reduced hours' },
    { value: 'internship', label: 'Internship', icon: '🎓', description: 'Learning opportunity' }
  ];

  // Use the standardized experience levels from AI system
  const experienceLevels = JobDiscoveryService.EXPERIENCE_LEVELS.map(level => ({
    value: level.value,
    label: level.label,
    description: level.description,
    icon: level.value === 'entry' ? '🌱' : 
          level.value === 'junior' ? '🚀' : 
          level.value === 'mid' ? '⭐' : 
          level.value === 'senior' ? '🏆' : 
          level.value === 'principal' ? '👑' : 
          level.value === 'executive' ? '💎' : '⭐'
  }));

  const companySizes = [
    { value: 'startup', label: 'Startup', icon: '🚀', description: '1-10 employees' },
    { value: 'small', label: 'Small', icon: '🏪', description: '11-50 employees' },
    { value: 'medium', label: 'Medium', icon: '🏢', description: '51-200 employees' },
    { value: 'large', label: 'Large', icon: '🏬', description: '201-1000 employees' },
    { value: 'enterprise', label: 'Enterprise', icon: '🏦', description: '1000+ employees' }
  ];

  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing',
    'Consulting', 'Media', 'Real Estate', 'Transportation', 'Energy', 'Government'
  ];

  const workAuthOptions = [
    { value: 'citizen', label: 'Citizen/Permanent Resident', description: 'No visa required' },
    { value: 'visa_required', label: 'Visa Required', description: 'Need work authorization' },
    { value: 'visa_sponsored', label: 'Visa Sponsorship Available', description: 'Employer can sponsor' }
  ];

  const frequencies = [
    { value: 'manual', label: 'Manual Only', description: 'Run searches manually', icon: '👤' },
    { value: 'daily', label: 'Daily', description: 'Once per day', icon: '📅' },
    { value: 'weekly', label: 'Weekly', description: 'Once per week', icon: '📆' },
    { value: 'bi_weekly', label: 'Bi-weekly', description: 'Every two weeks', icon: '🗓️' }
  ];

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-populate form when profile is selected
  useEffect(() => {
    if (selectedProfileId && profiles.length > 0) {
      const profile = profiles.find(p => p.id === selectedProfileId);
      if (profile) {
        populateFromProfile(profile);
      }
    }
  }, [selectedProfileId, profiles]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [searchesData, profilesData] = await Promise.all([
        loadSearches(),
        loadProfiles()
      ]);
      
      // Don't auto-select profile - let user choose manually
      // This prevents unwanted auto-population of the form
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const populateFromProfile = async (profile: JobProfile) => {
    setAiAnalyzing(true);
    setError(null);
    setSuccess(null);
    setInfo(null);
    setAiLevelAnalysis(null);
    
    try {
      // Get AI-enhanced profile population with job level analysis
      const { searchData, levelAnalysis } = await JobDiscoveryService.populateSearchFromProfileWithAI(profile);
      
      // Populate form with AI-enhanced data
      setFormData(prev => ({ ...prev, ...searchData }));
      setAiLevelAnalysis(levelAnalysis);
      
      // Show AI insights to user
      const levelLabel = experienceLevels.find(l => l.value === levelAnalysis.detectedLevel)?.label || 'Unknown';
      const confidencePercent = Math.round(levelAnalysis.confidence * 100);
      
      setSuccess(
        `🤖 Profile analyzed! Experience level: ${levelLabel} (${confidencePercent}% confidence)`
      );
      
      // Show additional info if confidence is lower or alternatives exist
      if (levelAnalysis.confidence < 0.7 || levelAnalysis.alternativeOptions.length > 0) {
        const alternatives = levelAnalysis.alternativeOptions
          .map(opt => experienceLevels.find(l => l.value === opt)?.label)
          .filter(Boolean)
          .join(', ');
        
        if (alternatives) {
          setInfo(`💡 ${levelAnalysis.reasoning}. Alternative levels to consider: ${alternatives}`);
        } else {
          setInfo(`💡 ${levelAnalysis.reasoning}`);
        }
      }
      
      // Auto-clear messages after delay
      setTimeout(() => {
        setSuccess(null);
        setInfo(null);
      }, 8000);
      
    } catch (error) {
      console.error('AI-enhanced profile population failed:', error);
      
      // Fallback to basic population
      try {
        const basicData = JobDiscoveryService.populateSearchFromProfile(profile);
        setFormData(prev => ({ 
          ...prev, 
          ...basicData,
          name: `${profile.name} - Job Search`,
          profile_id: profile.id
        }));
        
        setError('AI analysis unavailable. Form populated with basic profile data.');
        setTimeout(() => setError(null), 5000);
      } catch (fallbackError) {
        setError('Failed to populate form from profile. Please fill manually.');
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  const loadSearches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const data = await JobDiscoveryService.getEnhancedSearches(user.id);
      setSearches(data);
      return data;
    } catch (err) {
      console.error('Error loading searches:', err);
      setError('Failed to load searches.');
      return [];
    }
  };

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const data = await JobFinderService.getProfiles(user.id);
      setProfiles(data);
      return data;
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles.');
      return [];
    }
  };

  const handleChange = (field: keyof EnhancedJobSearch, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      setError('Search name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingSearch) {
        // Update existing search
        await JobDiscoveryService.createEnhancedSearch({
          ...editingSearch,
          ...formData
        });
        setSuccess('Search updated successfully!');
      } else {
        // Create new search
        await JobDiscoveryService.createEnhancedSearch(formData);
        setSuccess('Search created successfully!');
      }

      // Reset form and reload
      resetForm();
      await loadSearches();
    } catch (err) {
      console.error('Error saving search:', err);
      setError('Failed to save search. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchNow = async () => {
    if (!formData.name?.trim()) {
      setError('Please name your search first');
      return;
    }

    try {
      setExecuting(true);
      setError(null);
      setSuccess(null);
      setInfo(null);
      setShowResults(false);
      setRecentResults([]);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check LinkedIn scraping permissions and configuration
      const scrapingCheck = await ScrapingConfigService.isLinkedInScrapingAllowed(user.id);
      
      if (!scrapingCheck.allowed) {
        setError(`❌ LinkedIn Scraping: ${scrapingCheck.reason}. Please check your settings.`);
        return;
      }

      // Check rate limits
      const rateLimitCheck = await ScrapingConfigService.checkRateLimit(user.id, 'linkedin');
      if (!rateLimitCheck.allowed) {
        const nextAllowed = rateLimitCheck.next_allowed_at;
        const waitTime = nextAllowed ? Math.round((nextAllowed.getTime() - Date.now()) / 60000) : 60;
        setError(`⏰ Rate limit exceeded. ${rateLimitCheck.requests_in_last_hour} requests in last hour. Try again in ${waitTime} minutes.`);
        return;
      }

      setInfo(`🔍 LinkedIn scraping enabled! Quota: ${rateLimitCheck.requests_in_last_hour}/10 requests this hour.`);

      // Save or reuse existing search
      let savedSearch;
      if (currentSearchId) {
        // Reuse existing search
        savedSearch = searches.find(s => s.id === currentSearchId);
        if (!savedSearch) {
          setError('Selected search not found. Creating new search...');
          savedSearch = await JobDiscoveryService.createEnhancedSearch(formData);
          setCurrentSearchId(savedSearch.id);
        }
      } else {
        // Create new search only if none exists
        savedSearch = await JobDiscoveryService.createEnhancedSearch(formData);
        setCurrentSearchId(savedSearch.id);
      }
      
      setInfo('🚀 Starting background job search with AI analysis...');
      setIsSearchRunning(true);

      // Start background search execution
      const executionId = await BackgroundSearchService.executeSearchWithMonitoring(
        savedSearch.id,
        // Progress callback
        (progress) => {
          console.log('Search progress:', progress);
          setInfo(`🔍 ${progress.current_step} - ${progress.results_found} results found (${progress.completed_steps}/${progress.total_steps})`);
        },
        // Completion callback
        (results) => {
          console.log('Search completed:', results);
          setSuccess(`🎉 Background search completed! Found ${results.totalResults || 'unknown'} total results. Check the Job Feed tab for detailed matches.`);
          setInfo(`✨ Search execution ID: ${results.executionId}. View progress in the Monitor tab.`);
          setIsSearchRunning(false);
          // Reload searches to show updated data
          loadSearches();
        },
        // Error callback
        (error) => {
          console.error('Search failed:', error);
          setError(`❌ Background search failed: ${error.message}`);
          setIsSearchRunning(false);
        }
      );

      setSuccess(`🚀 Background search started! Execution ID: ${executionId}`);
      setInfo(`🔍 Your search is now running in the background. You can monitor progress in the Monitor tab and continue using the app.`);
      
      // Auto-clear messages after delay
      setTimeout(() => {
        setSuccess(null);
        setInfo(null);
      }, 10000);

    } catch (err) {
      console.error('Error executing LinkedIn search:', err);
      
      // Log failed attempt
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await ScrapingConfigService.logScrapingRequest(user.id, 'linkedin', 'failed', {
            error_message: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      } catch (logError) {
        console.error('Failed to log scraping error:', logError);
      }

      setError(`❌ LinkedIn search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  // Search control functions
  const handlePauseSearch = async (searchId: string) => {
    try {
      // Update search status to paused
      await supabase
        .from('enhanced_job_searches')
        .update({ search_status: 'paused' })
        .eq('id', searchId);
      
      setIsSearchRunning(false);
      setSuccess('🔄 Search paused successfully');
      loadSearches();
    } catch (error) {
      setError('Failed to pause search');
    }
  };

  const handleResumeSearch = async (searchId: string) => {
    try {
      // Update search status to running and restart
      await supabase
        .from('enhanced_job_searches')
        .update({ search_status: 'running' })
        .eq('id', searchId);
      
      setIsSearchRunning(true);
      setSuccess('▶️ Search resumed successfully');
      
      // Restart the background search
      const executionId = await BackgroundSearchService.executeSearchWithMonitoring(
        searchId,
        (progress) => {
          setInfo(`🔍 ${progress.current_step} - ${progress.results_found} results found`);
        },
        (results) => {
          setSuccess(`🎉 Search completed! Found ${results.totalResults || 'unknown'} results.`);
          setIsSearchRunning(false);
          loadSearches();
        },
        (error) => {
          setError(`❌ Search failed: ${error.message}`);
          setIsSearchRunning(false);
        }
      );
      
      loadSearches();
    } catch (error) {
      setError('Failed to resume search');
      setIsSearchRunning(false);
    }
  };

  const handleStopSearch = async (searchId: string) => {
    try {
      // Update search status to stopped
      await supabase
        .from('enhanced_job_searches')
        .update({ search_status: 'stopped' })
        .eq('id', searchId);
      
      setIsSearchRunning(false);
      setSuccess('⏹️ Search stopped successfully');
      loadSearches();
    } catch (error) {
      setError('Failed to stop search');
    }
  };

  const handleRenameSearch = async (searchId: string, newName: string) => {
    try {
      await supabase
        .from('enhanced_job_searches')
        .update({ name: newName })
        .eq('id', searchId);
      
      setSuccess('✏️ Search renamed successfully');
      loadSearches();
    } catch (error) {
      setError('Failed to rename search');
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    try {
      await supabase
        .from('enhanced_job_searches')
        .delete()
        .eq('id', searchId);
      
      setSuccess('🗑️ Search deleted successfully');
      if (currentSearchId === searchId) {
        setCurrentSearchId(null);
      }
      loadSearches();
    } catch (error) {
      setError('Failed to delete search');
    }
  };

  const handleLockSearch = async (searchId: string, code: string) => {
    try {
      // Hash the code and lock the search
      const { error } = await supabase.rpc('hash_lock_code', { code });
      if (error) throw error;
      
      await supabase
        .from('enhanced_job_searches')
        .update({ 
          is_locked: true, 
          locked_at: new Date().toISOString(),
          locked_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', searchId);
      
      setSuccess('🔒 Search locked successfully');
      loadSearches();
    } catch (error) {
      setError('Failed to lock search');
    }
  };

  const handleUnlockSearch = async (searchId: string, code: string) => {
    try {
      // Verify the code and unlock
      const { data: isValid } = await supabase.rpc('verify_lock_code', { 
        search_id: searchId, 
        code 
      });
      
      if (!isValid) {
        setError('Invalid unlock code');
        return;
      }
      
      await supabase
        .from('enhanced_job_searches')
        .update({ 
          is_locked: false, 
          lock_code_hash: null,
          locked_at: null,
          locked_by: null
        })
        .eq('id', searchId);
      
      setSuccess('🔓 Search unlocked successfully');
      loadSearches();
    } catch (error) {
      setError('Failed to unlock search');
    }
  };

  const resetForm = () => {
    setEditingSearch(null);
    setIsCreating(false);
    setSelectedProfileId(null); // Don't auto-select profile
    setAiLevelAnalysis(null);
    setError(null);
    setSuccess(null);
    setInfo(null);
    setShowResults(false);
    setRecentResults([]);
    setFormData({
      name: '',
      profile_id: null,
      job_title: '',
      location: '',
      remote_type: null,
      employment_type: ['permanent'],
      experience_level: null,
      salary_min: null,
      salary_max: null,
      salary_currency: 'GBP',
      required_skills: [],
      company_size: null,
      industry_sectors: null,
      work_authorization: null,
      search_frequency: 'manual',
      scheduled_time: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ai_matching_enabled: true,
      minimum_match_score: 70,
      is_active: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-2xl font-bold text-primary">Enhanced Job Search</h2>
          <div className="ml-3 flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/20 rounded-full">
            <Bot className="h-3 w-3 text-purple-600 mr-1" />
            <span className="text-xs font-medium text-purple-800 dark:text-purple-200">AI-Powered</span>
          </div>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Create new job search"
          >
            <Plus className="h-4 w-4" />
            <span>Create Search</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2" role="alert">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-2" role="status">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {info && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start space-x-2" role="status">
          <Bot className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">{info}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-primary rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">
              {editingSearch ? 'Edit Search' : 'Create Enhanced Job Search'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 text-tertiary hover:text-secondary rounded-lg hover:bg-tertiary transition-colors"
              aria-label="Cancel editing"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Profile Selection with AI Analysis */}
          {profiles.length > 0 && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-primary mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                🤖 AI-Powered Profile Analysis & Auto-Population
                {aiAnalyzing && (
                  <Loader className="h-4 w-4 ml-2 animate-spin text-purple-600" />
                )}
              </h4>
              <select
                value={selectedProfileId || ''}
                onChange={(e) => setSelectedProfileId(e.target.value || null)}
                disabled={aiAnalyzing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a profile for AI analysis and auto-population...</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} - {profile.experience_level || 'Level will be AI-detected'}
                  </option>
                ))}
              </select>
              {aiAnalyzing && (
                <div className="mt-2 flex items-center text-sm text-purple-700 dark:text-purple-300">
                  <Bot className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing profile with Claude AI...
                </div>
              )}
            </div>
          )}

          {/* Basic Search Fields */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-primary border-b border-gray-200 dark:border-gray-700 pb-2">
              Essential Search Criteria
            </h4>

            {/* Search Name */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Search Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
                placeholder="e.g., Senior Developer Roles - Remote"
              />
            </div>

            {/* Job Title and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Job Title/Role
                </label>
                <input
                  type="text"
                  value={formData.job_title || ''}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
                  placeholder="e.g., Software Engineer, Product Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
                  placeholder="e.g., London, UK or Remote"
                />
              </div>
            </div>

            {/* Remote Type and Experience Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Remote Preference
                </label>
                <select
                  value={formData.remote_type || ''}
                  onChange={(e) => handleChange('remote_type', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
                >
                  <option value="">Any</option>
                  {remoteOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  <Star className="h-4 w-4 inline mr-1" />
                  Experience Level
                  {aiLevelAnalysis && (
                    <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                      🤖 AI Detected ({Math.round(aiLevelAnalysis.confidence * 100)}% confidence)
                    </span>
                  )}
                </label>
                <select
                  value={formData.experience_level || ''}
                  onChange={(e) => {
                    handleChange('experience_level', e.target.value || null);
                    // Clear AI analysis if user manually changes
                    if (aiLevelAnalysis && e.target.value !== aiLevelAnalysis.detectedLevel) {
                      setAiLevelAnalysis(null);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary"
                >
                  <option value="">Any Experience Level</option>
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.icon} {level.label} - {level.description}
                    </option>
                  ))}
                </select>
                
                {aiLevelAnalysis && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>🤖 AI Analysis:</strong> {aiLevelAnalysis.reasoning}
                    </p>
                    {aiLevelAnalysis.alternativeOptions.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <strong>💡 Alternative levels to consider:</strong> {aiLevelAnalysis.alternativeOptions
                          .map(opt => experienceLevels.find(l => l.value === opt)?.label)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      You can manually override the AI suggestion by selecting a different level above.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Employment Type (Multi-select) */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Employment Type (Fixed Issue - No longer "Role Type")
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {employmentTypes.map(type => (
                  <label key={type.value} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={(formData.employment_type || []).includes(type.value)}
                      onChange={(e) => handleArrayChange('employment_type', type.value, e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-primary">{type.icon} {type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
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
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center py-2 mb-4 text-sm text-purple-600 hover:text-purple-800 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced Search Criteria
            {showAdvanced ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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

              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Company Size</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {companySizes.map(size => (
                    <label key={size.value} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={(formData.company_size || []).includes(size.value)}
                        onChange={(e) => handleArrayChange('company_size', size.value, e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-primary">{size.icon} {size.label}</span>
                    </label>
                  ))}
                </div>
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
                      max="100"
                      step="10"
                      value={formData.minimum_match_score || 70}
                      onChange={(e) => handleChange('minimum_match_score', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleSearchNow}
              disabled={executing || !formData.name?.trim()}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              {executing ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  <span>🔍 Searching LinkedIn...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  <span>🚀 Search LinkedIn Now</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={saving || !formData.name?.trim()}
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
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start">
              <Sparkles className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">🚀 LinkedIn Scraping + AI Analysis</p>
                <p>
                  <strong>"Search LinkedIn Now"</strong> performs real-time LinkedIn job scraping with your current criteria, 
                  then runs AI analysis for match scoring and personalized recommendations. 
                  Results appear instantly with detailed insights and skill gap analysis.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">
                  ⚙️ Configure LinkedIn scraping settings in the Settings tab • 🛡️ Respectful rate limiting applied
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Inline Search Results */}
      {showResults && recentResults.length > 0 && (
        <div className="bg-primary rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary flex items-center">
              <Target className="h-6 w-6 text-purple-600 mr-2" />
              🚀 Latest LinkedIn Search Results
            </h3>
            <button
              onClick={() => setShowResults(false)}
              className="p-2 text-tertiary hover:text-secondary rounded-lg hover:bg-secondary transition-colors"
              aria-label="Hide results"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {recentResults.map((job, index) => (
              <div key={`${job.originalJobId}-${index}`} className="p-4 bg-secondary rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-primary mb-1 hover:text-purple-600 transition-colors">
                          <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {job.jobTitle}
                          </a>
                        </h4>
                        <p className="text-sm text-secondary mb-1">{job.companyName}</p>
                        <div className="flex items-center space-x-3 text-xs text-tertiary">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </span>
                          {job.remoteType && (
                            <span className="flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {job.remoteType}
                            </span>
                          )}
                          {job.employmentType && (
                            <span className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {job.employmentType}
                            </span>
                          )}
                          {job.experienceLevel && (
                            <span className="flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {job.experienceLevel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {job.postedDate && (
                          <span className="text-xs text-tertiary bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(job.postedDate).toLocaleDateString()}
                          </span>
                        )}
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          View on LinkedIn
                        </a>
                      </div>
                    </div>
                    <p className="text-sm text-secondary line-clamp-2 leading-relaxed">
                      {job.jobDescription && job.jobDescription.length > 200 
                        ? `${job.jobDescription.substring(0, 200)}...` 
                        : job.jobDescription || 'No description available'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start">
              <Bot className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">🤖 Next Steps</p>
                <ul className="text-xs space-y-1">
                  <li>• Visit the <strong>Job Feed</strong> tab to see all results with AI match scores</li>
                  <li>• Use the <strong>Applications</strong> tab to track your application progress</li>
                  <li>• Configure scraping settings in the <strong>Settings</strong> tab for optimized searches</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Searches List */}
      {!isCreating && searches.length > 0 && (
        <div className="bg-primary rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Your Job Searches</h3>
          <div className="space-y-3">
            {searches.map(search => (
              <div key={search.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-primary">{search.name}</h4>
                  <p className="text-sm text-secondary">
                    {search.job_title} • {search.location || 'Any location'} • {search.search_frequency}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {search.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>
                  )}
                  <button
                    onClick={() => {
                      setEditingSearch(search);
                      setFormData(search);
                      setIsCreating(true);
                    }}
                    className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isCreating && searches.length === 0 && (
        <div className="text-center py-12 bg-primary rounded-xl shadow-lg">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary mb-2">No job searches created yet</h3>
          <p className="text-secondary mb-4">Create your first AI-powered job search to get started</p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Your First Search
          </button>
        </div>
      )}
    </div>
  );
}