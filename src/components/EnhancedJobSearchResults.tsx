import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building,
  DollarSign,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Bot,
  Target,
  Zap,
  Calendar,
  Loader,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { 
  EnhancedJobSearch, 
  JobSearchResult, 
  JobProfile 
} from '../lib/database-types';
import { JobDiscoveryService } from '../lib/job-discovery-service';

interface EnhancedJobSearchResultsProps {
  searchId?: string;
  className?: string;
}

interface FilterOptions {
  minMatchScore: number;
  includeBookmarked: boolean;
  includeDismissed: boolean;
  jobBoards: string[];
  salaryRange: [number, number];
  experienceLevel: string[];
  remoteType: string[];
}

export default function EnhancedJobSearchResults({ 
  searchId,
  className = '' 
}: EnhancedJobSearchResultsProps) {
  const { user } = useUser();

  // Core state
  const [results, setResults] = useState<JobSearchResult[]>([]);
  const [search, setSearch] = useState<EnhancedJobSearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<JobSearchResult | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    minMatchScore: 0.5,
    includeBookmarked: true,
    includeDismissed: false,
    jobBoards: [],
    salaryRange: [0, 200000],
    experienceLevel: [],
    remoteType: []
  });

  const [filteredResults, setFilteredResults] = useState<JobSearchResult[]>([]);

  // Load results
  useEffect(() => {
    if (searchId) {
      loadSearchResults();
    }
  }, [searchId]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [results, filters]);

  const loadSearchResults = async () => {
    if (!searchId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const [searchData, resultsData] = await Promise.all([
        supabase.from('enhanced_job_searches').select('*').eq('id', searchId).single(),
        JobDiscoveryService.getSearchResults(searchId, {
          includeBookmarked: filters.includeBookmarked,
          includeDismissed: filters.includeDismissed,
          minMatchScore: filters.minMatchScore,
          limit: 100
        })
      ]);

      if (searchData.error) throw searchData.error;
      
      setSearch(searchData.data);
      setResults(resultsData);
    } catch (err) {
      console.error('Error loading search results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    // Apply match score filter
    if (filters.minMatchScore > 0) {
      filtered = filtered.filter(result => 
        (result.ai_match_score || 0) >= filters.minMatchScore
      );
    }

    // Apply bookmark filter
    if (!filters.includeBookmarked) {
      filtered = filtered.filter(result => !result.is_bookmarked);
    }

    // Apply dismissed filter
    if (!filters.includeDismissed) {
      filtered = filtered.filter(result => !result.is_dismissed);
    }

    // Apply salary filter
    filtered = filtered.filter(result => {
      if (!result.salary_min && !result.salary_max) return true;
      const jobSalary = result.salary_max || result.salary_min || 0;
      return jobSalary >= filters.salaryRange[0] && jobSalary <= filters.salaryRange[1];
    });

    // Apply experience level filter
    if (filters.experienceLevel.length > 0) {
      filtered = filtered.filter(result => 
        !result.experience_level || filters.experienceLevel.includes(result.experience_level)
      );
    }

    // Apply remote type filter
    if (filters.remoteType.length > 0) {
      filtered = filtered.filter(result => 
        !result.remote_type || filters.remoteType.includes(result.remote_type)
      );
    }

    setFilteredResults(filtered);
  };

  const handleBookmark = async (result: JobSearchResult) => {
    try {
      const newBookmarkStatus = !result.is_bookmarked;
      
      // Update locally immediately
      setResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, is_bookmarked: newBookmarkStatus } : r
      ));

      // Update in database
      const { error } = await supabase
        .from('job_search_results')
        .update({ is_bookmarked: newBookmarkStatus })
        .eq('id', result.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating bookmark:', err);
      // Revert optimistic update
      setResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, is_bookmarked: result.is_bookmarked } : r
      ));
    }
  };

  const handleDismiss = async (result: JobSearchResult) => {
    try {
      const newDismissedStatus = !result.is_dismissed;
      
      // Update locally immediately
      setResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, is_dismissed: newDismissedStatus } : r
      ));

      // Update in database
      const { error } = await supabase
        .from('job_search_results')
        .update({ is_dismissed: newDismissedStatus })
        .eq('id', result.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating dismiss status:', err);
      // Revert optimistic update
      setResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, is_dismissed: result.is_dismissed } : r
      ));
    }
  };

  const handleRefresh = async () => {
    if (!searchId || !user) return;

    try {
      setRefreshing(true);
      await JobDiscoveryService.executeSearch(searchId);
      await loadSearchResults();
    } catch (err) {
      console.error('Error refreshing search:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh search');
    } finally {
      setRefreshing(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const formatSalary = (min?: number | null, max?: number | null, currency?: string | null) => {
    const curr = currency || 'GBP';
    if (min && max) {
      return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) {
      return `${curr} ${min.toLocaleString()}+`;
    }
    if (max) {
      return `Up to ${curr} ${max.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  if (loading) {
    return (
      <div className={`bg-primary rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-purple-600 mr-2" />
          <span className="text-secondary">Loading search results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-primary rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Error Loading Results</span>
        </div>
        <p className="text-secondary mb-4">{error}</p>
        <button
          onClick={() => loadSearchResults()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-primary rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Search className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-primary">
              {search?.search_name || 'Job Search Results'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="Refresh search"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Summary */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
          <span className="flex items-center">
            <Target className="h-4 w-4 mr-1" />
            {filteredResults.length} of {results.length} jobs
          </span>
          {search?.last_executed_at && (
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {new Date(search.last_executed_at).toLocaleDateString()}
            </span>
          )}
          <span className="flex items-center">
            <Bot className="h-4 w-4 mr-1" />
            AI-Enhanced
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters & Sorting
          {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </button>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Match Score Filter */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Minimum Match Score: {Math.round(filters.minMatchScore * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.minMatchScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minMatchScore: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Include Options */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.includeBookmarked}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeBookmarked: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-primary">Include bookmarked</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.includeDismissed}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeDismissed: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-primary">Include dismissed</span>
                </label>
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Salary Range: £{filters.salaryRange[0].toLocaleString()} - £{filters.salaryRange[1].toLocaleString()}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={filters.salaryRange[0]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      salaryRange: [parseInt(e.target.value) || 0, prev.salaryRange[1]] 
                    }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.salaryRange[1]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      salaryRange: [prev.salaryRange[0], parseInt(e.target.value) || 200000] 
                    }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-6">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">No jobs found</h3>
            <p className="text-secondary mb-4">
              {results.length === 0 
                ? "No jobs have been found for this search yet. Try running the search again."
                : "No jobs match your current filters. Try adjusting the filter criteria."
              }
            </p>
            {results.length === 0 && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {refreshing ? (
                  <Loader className="h-4 w-4 animate-spin mr-2 inline" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2 inline" />
                )}
                Run Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all"
              >
                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-primary">
                        {result.job_title}
                      </h3>
                      {result.ai_match_score && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(result.ai_match_score)}`}>
                          {Math.round(result.ai_match_score * 100)}% match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-secondary">
                      <span className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        {result.company_name}
                      </span>
                      {result.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {result.location}
                        </span>
                      )}
                      {(result.salary_min || result.salary_max) && (
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatSalary(result.salary_min, result.salary_max, result.salary_currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBookmark(result)}
                      className={`p-2 rounded-lg transition-colors ${
                        result.is_bookmarked
                          ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
                          : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                      }`}
                      title={result.is_bookmarked ? 'Remove bookmark' : 'Bookmark job'}
                    >
                      {result.is_bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => handleDismiss(result)}
                      className={`p-2 rounded-lg transition-colors ${
                        result.is_dismissed
                          ? 'text-gray-600 bg-gray-100 dark:bg-gray-800'
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={result.is_dismissed ? 'Show job' : 'Dismiss job'}
                    >
                      {result.is_dismissed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    <a
                      href={result.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="View job posting"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Job Description */}
                {result.job_description && (
                  <div className="mb-4">
                    <p className="text-secondary text-sm line-clamp-3">
                      {result.job_description}
                    </p>
                  </div>
                )}

                {/* AI Analysis */}
                {result.ai_analysis && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Bot className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        AI Analysis
                      </span>
                    </div>
                    {/* AI analysis content would go here */}
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Analysis available - click to view detailed insights
                    </p>
                  </div>
                )}

                {/* Skills Match */}
                {(result.skill_matches || result.missing_skills) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.skill_matches?.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs rounded-full"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                    {result.missing_skills?.slice(0, 3).map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-xs rounded-full"
                      >
                        ? {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Posted Date */}
                {result.posted_date && (
                  <div className="mt-4 text-xs text-secondary flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Posted: {new Date(result.posted_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}