import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Building, 
  Calendar,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Star,
  TrendingUp,
  Filter,
  SortDesc,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Check,
  X,
  Heart,
  Clock,
  Target,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  FileText,
  Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { JobMatch, JobProfile, JobApplication } from '../lib/database-types';
import { JobFinderService } from '../lib/job-finder-service';
import { TaskService } from '../lib/task-service';
import { EmailJobProcessor } from '../lib/email-job-processor';

interface JobDiscoveryFeedProps {
  className?: string;
}

interface JobMatchWithProfile extends JobMatch {
  job_profiles?: JobProfile;
}

export default function JobDiscoveryFeed({ className = '' }: JobDiscoveryFeedProps) {
  const [matches, setMatches] = useState<JobMatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [sortBy, setSortBy] = useState<'match_score' | 'posted_date' | 'salary'>('match_score');
  const [filterSources, setFilterSources] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [liveThreshold, setLiveThreshold] = useState<number>(80);
  
  // Modal states
  const [selectedMatch, setSelectedMatch] = useState<JobMatchWithProfile | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationNotes, setApplicationNotes] = useState('');

  // Load threshold on mount
  useEffect(() => {
    const threshold = EmailJobProcessor.getMatchThreshold();
    setLiveThreshold(threshold);
    setMinScore(threshold); // Set minimum filter to match the threshold
  }, []);

  // Load matches on mount and when filters change
  useEffect(() => {
    loadMatches();
  }, [sortBy, filterSources, showSaved, showDismissed, minScore]);

  // Auto-refresh matches every 30 seconds for live feed
  useEffect(() => {
    const interval = setInterval(() => {
      loadMatches();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [sortBy, filterSources, showSaved, showDismissed, minScore]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build filters for the service
      const filters = {
        saved: showSaved ? true : undefined,
        dismissed: showDismissed ? true : false,
        minScore: minScore > 0 ? minScore : undefined
      };

      let matches = await JobFinderService.getMatches(user.id, filters);

      // Apply custom sorting since the service sorts by ai_score
      if (sortBy === 'posted_date') {
        matches = matches.sort((a, b) => {
          const dateA = a.discovered_at ? new Date(a.discovered_at).getTime() : 0;
          const dateB = b.discovered_at ? new Date(b.discovered_at).getTime() : 0;
          return dateB - dateA;
        });
      } else if (sortBy === 'salary') {
        matches = matches.sort((a, b) => {
          // Sort by salary_range string comparison (basic)
          return (b.salary_range || '').localeCompare(a.salary_range || '');
        });
      }

      setMatches(matches);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Failed to load job matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateMatch = async (matchId: string, updates: Partial<JobMatch>) => {
    try {
      await JobFinderService.updateMatch(matchId, updates);
      
      // Update local state
      setMatches(prev => prev.map(match => 
        match.id === matchId ? { ...match, ...updates } : match
      ));
    } catch (err) {
      console.error('Error updating match:', err);
      setError('Failed to update job match.');
    }
  };

  const toggleSaved = (match: JobMatchWithProfile) => {
    updateMatch(match.id, { is_saved: !match.is_saved });
  };

  const toggleDismissed = (match: JobMatchWithProfile) => {
    updateMatch(match.id, { is_dismissed: !match.is_dismissed }); // Changed from is_hidden
  };

  const rateMatch = (match: JobMatchWithProfile, rating: number) => {
    updateMatch(match.id, { user_rating: rating });
  };

  const createApplication = async (match: JobMatchWithProfile) => {
    try {
      const applicationData = {
        job_listing_id: match.job_listing_id, // Changed from job_match_id
        status: 'draft' as const, // Changed from application_status
        notes: applicationNotes
      };

      const application = await JobFinderService.createApplication(applicationData);
      
      // Create a task for tracking the application
      await TaskService.createTask({
        title: `Apply to ${match.job_title} at ${match.company_name}`,
        description: `Application for ${match.job_title} position at ${match.company_name}. ${match.location ? `Location: ${match.location}` : ''} ${match.salary_range ? `Salary: ${match.salary_range}` : ''}`,
        status: 'todo',
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        energy_level: 'medium',
        estimated_minutes: 30,
        tags: ['job-application', match.company_name.toLowerCase().replace(/\s+/g, '-')],
        project_id: null
      });
      
      setSuccess('Application created successfully! A task has been added to track your application.');
      setShowApplicationModal(false);
      setApplicationNotes('');
      setSelectedMatch(null);
    } catch (err) {
      console.error('Error creating application:', err);
      setError('Failed to create application. Please try again.');
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return 'Salary not disclosed';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
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
        <h2 className="text-2xl font-bold text-primary flex items-center">
          <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
          Live Job Feed
          <div className="ml-3 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Live</span>
          </div>
        </h2>
        <div className="text-sm text-secondary">
          {matches.length} matches ({liveThreshold}%+ threshold)
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
          rounded-lg flex items-start space-x-2 theme-transition" role="alert">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
          rounded-lg flex items-start space-x-2 theme-transition" role="status">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="bg-primary rounded-xl shadow-sm p-4 theme-transition">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort */}
          <div className="flex items-center space-x-2">
            <SortDesc className="h-4 w-4 text-tertiary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-secondary bg-primary text-primary 
                rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              <option value="match_score">Match Score</option>
              <option value="posted_date">Posted Date</option>
              <option value="salary">Salary</option>
            </select>
          </div>

          {/* Score Filter */}
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-tertiary" />
            <span className="text-sm text-secondary">Min Score:</span>
            <input
              type="range"
              min={liveThreshold}
              max="100"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm font-medium text-primary w-12">{minScore}%</span>
            <span className="text-xs text-tertiary">(Live: {liveThreshold}%)</span>
          </div>

          {/* Toggle Filters */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                showSaved
                  ? 'bg-purple-600 text-white'
                  : 'bg-tertiary text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Heart className="h-3 w-3 inline mr-1" />
              Saved Only
            </button>
            
            <button
              onClick={() => setShowDismissed(!showDismissed)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                showDismissed
                  ? 'bg-gray-600 text-white'
                  : 'bg-tertiary text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <EyeOff className="h-3 w-3 inline mr-1" />
              {showDismissed ? 'Show All' : 'Show Dismissed'}
            </button>
          </div>
        </div>
      </div>

      {/* Job Matches */}
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="bg-secondary rounded-xl p-8 text-center theme-transition">
            <Search className="h-12 w-12 text-tertiary mx-auto mb-4" />
            <p className="text-secondary mb-2">
              No job matches found above {liveThreshold}% threshold.
            </p>
            <p className="text-tertiary text-sm">
              Jobs need to meet the {liveThreshold}%+ AI match score to appear in your live feed.<br />
              <Link to="/preferences" className="text-purple-600 hover:underline">
                Adjust threshold in Settings →
              </Link>
            </p>
          </div>
        ) : (
          matches.map(match => (
            <div
              key={match.id}
              className="bg-primary rounded-xl shadow-md hover:shadow-lg p-6 
                transition-all duration-200 theme-transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-primary hover:text-purple-600 
                      dark:hover:text-purple-400 cursor-pointer transition-colors">
                      {match.job_title}
                    </h3>
                    {match.ai_score && (
                      <div className={`flex items-center space-x-1 ${getScoreColor(match.ai_score)}`}>
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-semibold">{match.ai_score}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-secondary mb-2">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {match.company_name}
                    </div>
                    {match.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {match.location}
                        {match.remote_type && ` (${match.remote_type})`}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(match.posted_date)}
                    </div>
                  </div>

                  {(match.salary_min || match.salary_max) && (
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-3">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatSalary(match.salary_min, match.salary_max, match.salary_currency)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleSaved(match)}
                    className={`p-2 rounded-lg transition-colors ${
                      match.is_saved
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                        : 'text-tertiary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                    }`}
                    title={match.is_saved ? 'Remove from saved' : 'Save for later'}
                  >
                    {match.is_saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={() => toggleDismissed(match)}
                    className="p-2 text-tertiary hover:text-secondary hover:bg-tertiary 
                      rounded-lg transition-colors"
                    title={match.is_dismissed ? 'Show job' : 'Dismiss job'}
                  >
                    {match.is_dismissed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <a
                    href={match.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 
                      dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="View original job posting"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* AI Analysis */}
              {match.ai_analysis && (match.ai_pros.length > 0 || match.ai_cons.length > 0) && (
                <div className="mb-4 p-4 bg-tertiary rounded-lg">
                  <div className="flex items-center mb-2">
                    <Target className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                    <span className="text-sm font-medium text-primary">AI Analysis</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {match.ai_pros.length > 0 && (
                      <div>
                        <div className="flex items-center text-green-600 dark:text-green-400 mb-1">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          <span className="font-medium">Pros</span>
                        </div>
                        <ul className="space-y-1 text-secondary">
                          {match.ai_pros.slice(0, 3).map((pro, index) => (
                            <li key={index} className="text-xs">• {pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {match.ai_cons.length > 0 && (
                      <div>
                        <div className="flex items-center text-red-600 dark:text-red-400 mb-1">
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          <span className="font-medium">Cons</span>
                        </div>
                        <ul className="space-y-1 text-secondary">
                          {match.ai_cons.slice(0, 3).map((con, index) => (
                            <li key={index} className="text-xs">• {con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {match.ai_suggestions && (
                    <div className="mt-3 pt-3 border-t border-secondary">
                      <div className="text-xs text-tertiary font-medium mb-1">AI SUGGESTION</div>
                      <p className="text-xs text-secondary">{match.ai_suggestions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-secondary">
                {/* User Rating */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-tertiary">Rate this match:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => rateMatch(match, rating)}
                        className={`w-4 h-4 transition-colors ${
                          match.user_rating && rating <= match.user_rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMatch(match);
                      setShowApplicationModal(true);
                    }}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 
                      transition-colors text-sm flex items-center space-x-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Apply</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedMatch(match)}
                    className="px-3 py-1 bg-tertiary text-secondary hover:bg-gray-300 
                      dark:hover:bg-gray-600 rounded-md transition-colors text-sm flex items-center space-x-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Details</span>
                  </button>
                </div>
              </div>

              {/* Source Badge */}
              {match.source && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 
                    text-blue-700 dark:text-blue-300 text-xs rounded-full capitalize">
                    {match.source.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-primary rounded-xl shadow-xl max-w-md w-full p-6 theme-transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Create Application</h3>
              <button
                onClick={() => {
                  setShowApplicationModal(false);
                  setSelectedMatch(null);
                  setApplicationNotes('');
                }}
                className="p-2 text-tertiary hover:text-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-primary">{selectedMatch.job_title}</p>
                <p className="text-sm text-secondary">{selectedMatch.company_name}</p>
              </div>

              <div>
                <label htmlFor="application_notes" className="block text-sm font-medium text-secondary mb-2">
                  Application Notes (Optional)
                </label>
                <textarea
                  id="application_notes"
                  value={applicationNotes}
                  onChange={(e) => setApplicationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary bg-primary text-primary 
                    rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent theme-transition"
                  placeholder="Add any notes about this application..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedMatch(null);
                    setApplicationNotes('');
                  }}
                  className="px-4 py-2 text-secondary bg-tertiary hover:bg-gray-300 
                    dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createApplication(selectedMatch)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                    transition-colors flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Create Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedMatch && !showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-primary rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 theme-transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary mb-1">{selectedMatch.job_title}</h3>
                <p className="text-secondary">{selectedMatch.company_name}</p>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="p-2 text-tertiary hover:text-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Job Details */}
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  {selectedMatch.location && (
                    <div className="flex items-center text-secondary">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedMatch.location} {selectedMatch.remote_type && `(${selectedMatch.remote_type})`}
                    </div>
                  )}
                  <div className="flex items-center text-secondary">
                    <Calendar className="h-4 w-4 mr-2" />
                    Posted {formatDate(selectedMatch.posted_date)}
                  </div>
                  {selectedMatch.source && (
                    <div className="flex items-center text-secondary">
                      <Globe className="h-4 w-4 mr-2" />
                      Source: {selectedMatch.source.replace('_', ' ')}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {(selectedMatch.salary_min || selectedMatch.salary_max) && (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {formatSalary(selectedMatch.salary_min, selectedMatch.salary_max, selectedMatch.salary_currency)}
                    </div>
                  )}
                  {selectedMatch.ai_score && (
                    <div className={`flex items-center ${getScoreColor(selectedMatch.ai_score)}`}>
                      <Star className="h-4 w-4 mr-2 fill-current" />
                      AI Match Score: {selectedMatch.ai_score}%
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              {selectedMatch.job_description && (
                <div>
                  <h4 className="font-medium text-primary mb-2">Job Description</h4>
                  <div className="text-sm text-secondary bg-tertiary rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedMatch.job_description}</p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {(selectedMatch.ai_pros.length > 0 || selectedMatch.ai_cons.length > 0) && (
                <div>
                  <h4 className="font-medium text-primary mb-2">AI Analysis</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedMatch.ai_pros.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                          Pros
                        </div>
                        <ul className="space-y-1 text-sm text-secondary">
                          {selectedMatch.ai_pros.map((pro, index) => (
                            <li key={index}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedMatch.ai_cons.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                          Cons
                        </div>
                        <ul className="space-y-1 text-sm text-secondary">
                          {selectedMatch.ai_cons.map((con, index) => (
                            <li key={index}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {selectedMatch.ai_suggestions && (
                    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                        AI Suggestion
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {selectedMatch.ai_suggestions}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-secondary">
                <a
                  href={selectedMatch.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 
                    dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 
                    transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Original</span>
                </a>
                <button
                  onClick={() => {
                    setShowApplicationModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                    transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}