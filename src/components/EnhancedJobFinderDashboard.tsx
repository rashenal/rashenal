import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  TrendingUp, 
  FileText,
  Settings,
  BarChart3,
  Users,
  Target,
  Clock,
  Star,
  MapPin,
  DollarSign,
  Building,
  Calendar,
  Plus,
  ArrowRight,
  Loader,
  AlertCircle,
  Check,
  Activity,
  Zap,
  Eye,
  Bot,
  Sparkles,
  Filter,
  Bookmark,
  Globe2,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { 
  JobProfile, 
  EnhancedJobSearch, 
  JobSearchResult,
  SearchExecutionLog 
} from '../lib/database-types';
import { JobFinderService } from '../lib/job-finder-service';
import { JobDiscoveryService } from '../lib/job-discovery-service';
import JobProfileManager from './JobProfileManager';
import EnhancedJobSearchCreator from './EnhancedJobSearchCreator';
import EnhancedJobSearchResults from './EnhancedJobSearchResults';
import LinkedInScrapingSettings from './LinkedInScrapingSettings';

interface EnhancedJobFinderDashboardProps {
  className?: string;
}

interface EnhancedDashboardStats {
  totalProfiles: number;
  totalSearches: number;
  activeSearches: number;
  totalResults: number;
  bookmarkedResults: number;
  recentExecutions: number;
  avgMatchScore: number;
}

export default function EnhancedJobFinderDashboard({ className = '' }: EnhancedJobFinderDashboardProps) {
  const { user } = useUser();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'profiles' | 'create-search' | 'searches' | 'results' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [searches, setSearches] = useState<EnhancedJobSearch[]>([]);
  const [recentResults, setRecentResults] = useState<JobSearchResult[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<SearchExecutionLog[]>([]);
  
  // Selected states
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [
        profilesData,
        searchesData,
        recentResultsData,
        recentExecutionsData
      ] = await Promise.all([
        JobFinderService.getProfiles(user.id),
        JobDiscoveryService.getEnhancedSearches(user.id),
        loadRecentResults(),
        loadRecentExecutions()
      ]);

      setProfiles(profilesData);
      setSearches(searchesData);
      setRecentResults(recentResultsData);
      setRecentExecutions(recentExecutionsData);

      // Calculate stats
      const calculatedStats = calculateStats(profilesData, searchesData, recentResultsData, recentExecutionsData);
      setStats(calculatedStats);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentResults = async (): Promise<JobSearchResult[]> => {
    try {
      const { data, error } = await supabase
        .from('job_search_results')
        .select(`
          *,
          enhanced_job_searches!job_search_results_search_id_fkey (
            user_id,
            search_name
          )
        `)
        .eq('enhanced_job_searches.user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading recent results:', err);
      return [];
    }
  };

  const loadRecentExecutions = async (): Promise<SearchExecutionLog[]> => {
    try {
      const { data, error } = await supabase
        .from('search_execution_log')
        .select(`
          *,
          enhanced_job_searches!search_execution_log_search_id_fkey (
            user_id,
            search_name
          )
        `)
        .eq('enhanced_job_searches.user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading recent executions:', err);
      return [];
    }
  };

  const calculateStats = (
    profiles: JobProfile[],
    searches: EnhancedJobSearch[],
    results: JobSearchResult[],
    executions: SearchExecutionLog[]
  ): EnhancedDashboardStats => {
    const activeSearches = searches.filter(s => s.is_active).length;
    const bookmarkedResults = results.filter(r => r.is_bookmarked).length;
    const recentExecutions = executions.filter(e => 
      new Date(e.started_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Calculate average match score
    const scoresWithValues = results
      .map(r => r.ai_match_score)
      .filter((score): score is number => score !== null && score !== undefined);
    
    const avgMatchScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length
      : 0;

    return {
      totalProfiles: profiles.length,
      totalSearches: searches.length,
      activeSearches,
      totalResults: results.length,
      bookmarkedResults,
      recentExecutions,
      avgMatchScore: Math.round(avgMatchScore * 100)
    };
  };

  const handleSearchCreated = (search: EnhancedJobSearch) => {
    setSearches(prev => [search, ...prev]);
    setActiveTab('searches');
  };

  const handleSearchExecuted = (resultsCount: number) => {
    // Refresh dashboard data to show updated stats
    loadDashboardData();
  };

  const handleSearchSelect = (searchId: string) => {
    setSelectedSearchId(searchId);
    setActiveTab('results');
  };

  if (loading) {
    return (
      <div className={`bg-primary rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-purple-600 mr-2" />
          <span className="text-secondary">Loading enhanced job finder...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-primary rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Error Loading Dashboard</span>
        </div>
        <p className="text-secondary mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-primary rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg mr-4">
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Enhanced Job Finder</h1>
              <p className="text-secondary mt-1">AI-powered job discovery and matching platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <Bot className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">AI-Enhanced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-primary rounded-xl shadow-lg p-2">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'profiles', label: 'Profiles', icon: Users },
            { id: 'create-search', label: 'Create Search', icon: Plus },
            { id: 'searches', label: 'My Searches', icon: Search },
            { id: 'results', label: 'Results', icon: Target },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-primary rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary text-sm">Profiles</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalProfiles}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-primary rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary text-sm">Active Searches</p>
                    <p className="text-2xl font-bold text-primary">{stats.activeSearches}</p>
                  </div>
                  <Search className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-primary rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary text-sm">Job Results</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalResults}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-primary rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary text-sm">Avg Match Score</p>
                    <p className="text-2xl font-bold text-primary">{stats.avgMatchScore}%</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Job Results */}
            <div className="bg-primary rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Recent Job Matches</h3>
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-3">
                {recentResults.slice(0, 5).map(result => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-primary text-sm">{result.job_title}</p>
                      <p className="text-secondary text-xs">{result.company_name}</p>
                    </div>
                    {result.ai_match_score && (
                      <div className="flex items-center">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          result.ai_match_score >= 0.8 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : result.ai_match_score >= 0.6
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        }`}>
                          {Math.round(result.ai_match_score * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {recentResults.length === 0 && (
                  <p className="text-secondary text-sm text-center py-4">
                    No job results yet. Create a search to get started!
                  </p>
                )}
              </div>
            </div>

            {/* Active Searches */}
            <div className="bg-primary rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Active Searches</h3>
                <Search className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-3">
                {searches.filter(s => s.is_active).slice(0, 5).map(search => (
                  <div key={search.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-primary text-sm">{search.search_name}</p>
                      <p className="text-secondary text-xs">
                        {search.job_title} • {search.location || 'Any location'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSearchSelect(search.id)}
                      className="text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {searches.filter(s => s.is_active).length === 0 && (
                  <p className="text-secondary text-sm text-center py-4">
                    No active searches. Create your first search!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-primary rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('profiles')}
                className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Users className="h-6 w-6 text-blue-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-primary">Manage Profiles</p>
                  <p className="text-sm text-secondary">Create and edit job profiles</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('create-search')}
                className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Plus className="h-6 w-6 text-purple-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-primary">Create Search</p>
                  <p className="text-sm text-secondary">Set up AI-powered job search</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <Target className="h-6 w-6 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-primary">View Results</p>
                  <p className="text-sm text-secondary">Browse matched jobs</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profiles' && (
        <JobProfileManager />
      )}

      {activeTab === 'create-search' && (
        <EnhancedJobSearchCreator
          onSearchCreated={handleSearchCreated}
          onSearchExecuted={handleSearchExecuted}
        />
      )}

      {activeTab === 'searches' && (
        <div className="bg-primary rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">My Job Searches</h2>
            <button
              onClick={() => setActiveTab('create-search')}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Search
            </button>
          </div>

          {searches.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No searches created yet</h3>
              <p className="text-secondary mb-4">Create your first AI-powered job search to get started</p>
              <button
                onClick={() => setActiveTab('create-search')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {searches.map(search => (
                <div key={search.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary mb-1">{search.search_name}</h3>
                      <div className="space-y-1 text-sm text-secondary">
                        {search.job_title && <p>Position: {search.job_title}</p>}
                        {search.location && <p>Location: {search.location}</p>}
                        <p>Frequency: {search.search_frequency || 'Manual'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {search.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-secondary">
                      {search.last_executed_at ? (
                        <span>Last run: {new Date(search.last_executed_at).toLocaleDateString()}</span>
                      ) : (
                        <span>Never executed</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSearchSelect(search.id)}
                      className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      View Results
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <EnhancedJobSearchResults 
          searchId={selectedSearchId || undefined}
        />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* LinkedIn Scraping Settings Section */}
          <div className="bg-primary rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                <Globe2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">LinkedIn Scraping Configuration</h3>
                <p className="text-sm text-secondary">Configure how Rashenal searches LinkedIn for job opportunities</p>
              </div>
            </div>
            
            <LinkedInScrapingSettings />
          </div>
          
          {/* Global Search Preferences Section (Placeholder for future) */}
          <div className="bg-primary rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">Global Search Preferences</h3>
                <p className="text-sm text-secondary">Default settings for all job searches</p>
              </div>
            </div>
            
            <div className="text-center py-8 text-secondary">
              <p>Global search preferences coming soon...</p>
            </div>
          </div>
          
          {/* Security & Privacy Section (Placeholder for future) */}
          <div className="bg-primary rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">Security & Privacy</h3>
                <p className="text-sm text-secondary">Manage your data and privacy settings</p>
              </div>
            </div>
            
            <div className="text-center py-8 text-secondary">
              <p>Advanced security settings coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}