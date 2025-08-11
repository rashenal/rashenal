import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  Square,
  Clock,
  Users,
  Globe,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  X,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import { SearchMonitorService, ActiveSearchInfo, SearchLogEntry } from '../lib/search-monitor-service';

interface SearchMonitorDashboardProps {
  className?: string;
}

export default function SearchMonitorDashboard({ className = '' }: SearchMonitorDashboardProps) {
  const [activeSearches, setActiveSearches] = useState<ActiveSearchInfo[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLogEntry[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSearch, setSelectedSearch] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Auto-refresh data with selective updates
  useEffect(() => {
    loadInitialData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadActiveSearchesOnly, 2000); // Refresh active searches every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Load logs and stats when time range changes
  useEffect(() => {
    loadLogsAndStats();
  }, [timeRange]);

  // Real-time subscription to search updates with selective updates
  useEffect(() => {
    const unsubscribe = SearchMonitorService.subscribeToSearchUpdates((update) => {
      console.log('Real-time search update:', update);
      
      // Update specific search instead of reloading everything
      if (update.eventType === 'UPDATE' && update.new) {
        updateSingleSearch(update.new);
      } else if (update.eventType === 'INSERT') {
        addNewSearch(update.new);
      } else if (update.eventType === 'DELETE') {
        removeSearch(update.old?.id);
      } else {
        // Fallback to reload active searches only
        loadActiveSearchesOnly();
      }
    });

    return unsubscribe;
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [searches, logs, stats] = await Promise.all([
        SearchMonitorService.getActiveSearches(),
        SearchMonitorService.getSearchLogs(),
        SearchMonitorService.getSearchStatistics(timeRange)
      ]);

      setActiveSearches(searches);
      setSearchLogs(logs);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading initial monitoring data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSearchesOnly = async () => {
    try {
      const searches = await SearchMonitorService.getActiveSearches();
      
      // Only update if there are actual changes
      if (JSON.stringify(searches) !== JSON.stringify(activeSearches)) {
        setActiveSearches(searches);
      }
    } catch (err) {
      console.error('Error loading active searches:', err);
      // Don't show error for background updates
    }
  };

  const loadLogsAndStats = async () => {
    try {
      const [logs, stats] = await Promise.all([
        SearchMonitorService.getSearchLogs(),
        SearchMonitorService.getSearchStatistics(timeRange)
      ]);

      setSearchLogs(logs);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading logs and stats:', err);
    }
  };

  // Update individual search without full reload
  const updateSingleSearch = (updatedSearch: any) => {
    setActiveSearches(prev => 
      prev.map(search => 
        search.id === updatedSearch.id 
          ? { ...search, ...updatedSearch }
          : search
      )
    );
  };

  // Add new search to the list
  const addNewSearch = (newSearch: any) => {
    setActiveSearches(prev => {
      const exists = prev.some(search => search.id === newSearch.id);
      if (!exists) {
        return [newSearch, ...prev];
      }
      return prev;
    });
  };

  // Remove search from the list
  const removeSearch = (searchId: string) => {
    if (searchId) {
      setActiveSearches(prev => prev.filter(search => search.id !== searchId));
    }
  };

  const handleCancelSearch = async (searchId: string) => {
    try {
      await SearchMonitorService.cancelSearch(searchId);
      await loadActiveSearchesOnly(); // Refresh active searches
    } catch (err) {
      console.error('Error cancelling search:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel search');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'running':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getProgressPercentage = (progress?: ActiveSearchInfo['progress']) => {
    if (!progress) return 0;
    return Math.round((progress.completed_steps / progress.total_steps) * 100);
  };

  if (loading && activeSearches.length === 0) {
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
          <Activity className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-2xl font-bold text-primary">Search Monitor</h2>
          <div className="ml-3 flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <Globe className="h-3 w-3 text-blue-600 mr-1" />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Real-time</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1 text-sm border border-secondary bg-primary text-primary rounded-md"
          >
            <option value="day">Last 24 hours</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {autoRefresh ? <Pause className="h-3 w-3 inline mr-1" /> : <Play className="h-3 w-3 inline mr-1" />}
            Auto-refresh
          </button>
          
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error</p>
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Active Searches</p>
                <p className="text-2xl font-bold text-primary">{statistics.active_searches}</p>
              </div>
              <Play className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-primary rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Total Searches</p>
                <p className="text-2xl font-bold text-primary">{statistics.total_searches}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-primary rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Results Found</p>
                <p className="text-2xl font-bold text-primary">{statistics.total_results_found}</p>
              </div>
              <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-primary rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Avg Time</p>
                <p className="text-2xl font-bold text-primary">
                  {statistics.avg_execution_time ? formatDuration(statistics.avg_execution_time) : 'N/A'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Active Searches */}
      <div className="bg-primary rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
          <Play className="h-5 w-5 text-blue-600 mr-2" />
          Active Searches ({activeSearches.length})
        </h3>
        
        {activeSearches.length === 0 ? (
          <p className="text-secondary text-center py-8">No active searches running</p>
        ) : (
          <div className="space-y-3">
            {activeSearches.map(search => (
              <div key={search.id} className="p-4 bg-tertiary rounded-lg border border-secondary">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(search.status)}
                      <h4 className="font-medium text-primary">{search.search_name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(search.status)}`}>
                        {search.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-secondary mb-2">
                      <span className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        {search.job_board}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Started {new Date(search.started_at).toLocaleTimeString()}
                      </span>
                      {search.estimated_completion && (
                        <span className="flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          ETA {new Date(search.estimated_completion).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {search.progress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary">{search.progress.current_step}</span>
                          <span className="text-primary font-medium">
                            {search.progress.completed_steps}/{search.progress.total_steps} steps
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(search.progress)}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-secondary">
                          <span>{getProgressPercentage(search.progress)}% complete</span>
                          <span>{search.progress.results_found} results found</span>
                        </div>

                        {search.progress.current_url && (
                          <div className="text-xs text-tertiary truncate">
                            Currently processing: {search.progress.current_url}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedSearch(search.id)}
                      className="p-2 text-tertiary hover:text-purple-600 rounded-lg hover:bg-secondary"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {['pending', 'running'].includes(search.status) && (
                      <button
                        onClick={() => handleCancelSearch(search.id)}
                        className="p-2 text-tertiary hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Cancel search"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Search History */}
      <div className="bg-primary rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-purple-600 mr-2" />
          Recent Search History
        </h3>
        
        {searchLogs.length === 0 ? (
          <p className="text-secondary text-center py-8">No recent searches</p>
        ) : (
          <div className="space-y-2">
            {searchLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 hover:bg-tertiary rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="text-sm font-medium text-primary">{log.search_name}</p>
                    <p className="text-xs text-secondary">
                      {log.job_boards?.join(', ')} • 
                      {new Date(log.started_at).toLocaleString()}
                      {log.execution_time_ms && ` • ${formatDuration(log.execution_time_ms)}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {log.total_results_found !== undefined && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      {log.total_results_found} results
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Job Boards */}
      {statistics && statistics.top_job_boards.length > 0 && (
        <div className="bg-primary rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            Most Used Job Boards
          </h3>
          
          <div className="space-y-3">
            {statistics.top_job_boards.map((board: any, index: number) => (
              <div key={board.board} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-primary capitalize">{board.board}</span>
                </div>
                <span className="text-secondary">{board.count} searches</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Detail Modal with Verbose Activity Log */}
      {selectedSearch && (
        <SearchDetailModal 
          searchId={selectedSearch}
          onClose={() => setSelectedSearch(null)}
        />
      )}
    </div>
  );
}

// Search Detail Modal Component
interface SearchDetailModalProps {
  searchId: string;
  onClose: () => void;
}

function SearchDetailModal({ searchId, onClose }: SearchDetailModalProps) {
  const [searchDetails, setSearchDetails] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerboseLog, setShowVerboseLog] = useState(false);

  // Helper functions for the modal
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  const getProgressPercentage = (progress: any) => {
    if (!progress || !progress.total_steps) return 0;
    return Math.round((progress.completed_steps / progress.total_steps) * 100);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  useEffect(() => {
    loadSearchDetails();
    
    // Auto-refresh details every 2 seconds for active searches
    const interval = setInterval(loadSearchDetails, 2000);
    
    // Subscribe to real-time activity logs
    const unsubscribe = SearchMonitorService.subscribeToActivityLogs(searchId, (newLog) => {
      setActivityLog(prev => [...prev, newLog]);
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [searchId]);

  const loadSearchDetails = async () => {
    try {
      const [details, logs] = await Promise.all([
        SearchMonitorService.getSearchStatus(searchId),
        SearchMonitorService.getSearchActivityLog(searchId)
      ]);
      
      setSearchDetails(details);
      setActivityLog(logs);
    } catch (error) {
      console.error('Error loading search details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'debug':
        return <Activity className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatActivityDetails = (details: any) => {
    if (!details) return null;
    
    return (
      <div className="mt-2 text-xs text-secondary">
        {details.search_terms && (
          <div><strong>Search Terms:</strong> {details.search_terms}</div>
        )}
        {details.location && (
          <div><strong>Location:</strong> {details.location}</div>
        )}
        {details.company && (
          <div><strong>Company:</strong> {details.company}</div>
        )}
        {details.salary_range && (
          <div><strong>Salary:</strong> {details.salary_range}</div>
        )}
        {details.url && (
          <div><strong>URL:</strong> <a href={details.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{details.url}</a></div>
        )}
        {details.jobs && Array.isArray(details.jobs) && (
          <div><strong>Jobs Found:</strong> {details.jobs.join(', ')}</div>
        )}
        {details.companies && Array.isArray(details.companies) && (
          <div><strong>Companies:</strong> {details.companies.join(', ')}</div>
        )}
        {details.salary_range && typeof details.salary_range === 'object' && (
          <div><strong>Salary Range:</strong> ${details.salary_range.min?.toLocaleString()} - ${details.salary_range.max?.toLocaleString()}</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary">
          <h2 className="text-xl font-semibold text-primary">Search Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Search Overview */}
            {searchDetails && (
              <div className="bg-tertiary rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Search Overview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary">Search Name:</span>
                    <span className="ml-2 text-primary font-medium">{searchDetails.search_name}</span>
                  </div>
                  <div>
                    <span className="text-secondary">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(searchDetails.status)}`}>
                      {searchDetails.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary">Started:</span>
                    <span className="ml-2 text-primary">{new Date(searchDetails.started_at).toLocaleString()}</span>
                  </div>
                  {searchDetails.completed_at && (
                    <div>
                      <span className="text-secondary">Completed:</span>
                      <span className="ml-2 text-primary">{new Date(searchDetails.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                  {searchDetails.total_results_found !== undefined && (
                    <div>
                      <span className="text-secondary">Results Found:</span>
                      <span className="ml-2 text-primary font-medium">{searchDetails.total_results_found}</span>
                    </div>
                  )}
                  {searchDetails.execution_time_ms && (
                    <div>
                      <span className="text-secondary">Execution Time:</span>
                      <span className="ml-2 text-primary">{formatDuration(searchDetails.execution_time_ms)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress */}
            {searchDetails?.progress && (
              <div className="bg-tertiary rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Current Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">{searchDetails.progress.current_step}</span>
                    <span className="text-primary font-medium">
                      {searchDetails.progress.completed_steps}/{searchDetails.progress.total_steps} steps
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(searchDetails.progress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-secondary">
                    <span>{getProgressPercentage(searchDetails.progress)}% complete</span>
                    <span>{searchDetails.progress.results_found} results found</span>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Log */}
            <div className="bg-tertiary rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary">Activity Log</h3>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showVerboseLog}
                      onChange={(e) => setShowVerboseLog(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-secondary">Show verbose logging</span>
                  </label>
                  <button
                    onClick={loadSearchDetails}
                    className="p-1 hover:bg-secondary rounded"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <p className="text-secondary text-center py-4">No activity logged yet</p>
                ) : (
                  activityLog
                    .filter(log => showVerboseLog || log.type !== 'debug')
                    .map((log, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 hover:bg-secondary rounded-lg">
                        <div className="mt-0.5">
                          {getActivityIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-primary font-medium">{log.message}</p>
                            <span className="text-xs text-tertiary whitespace-nowrap ml-2">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {log.details && formatActivityDetails(log.details)}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}