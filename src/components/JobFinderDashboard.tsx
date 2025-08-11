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
  Globe2,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { JobProfile, JobSearch, JobMatch, JobApplication } from '../lib/database-types';
import { JobFinderService } from '../lib/job-finder-service';
import { EmailJobProcessor } from '../lib/email-job-processor';
import JobProfileManager from './JobProfileManager';
import JobSearchCreator from './JobSearchCreator';
import JobDiscoveryFeed from './JobDiscoveryFeed';
import JobApplicationTracker from './JobApplicationTracker';
import LinkedInScrapingSettings from './LinkedInScrapingSettings';
import EmailJobMonitor from './EmailJobMonitor';
import JobFinderSettings, { JobFinderSettings as JobFinderSettingsType, defaultJobFinderSettings } from './settings/JobFinderSettings';
import { getLocalSettings } from './shared/SettingsModal';

interface JobFinderDashboardProps {
  className?: string;
}

interface DashboardStats {
  totalProfiles: number;
  activeSearches: number;
  totalMatches: number;
  savedMatches: number;
  totalApplications: number;
  pendingApplications: number;
  avgMatchScore: number;
  // Email processing stats
  emailsProcessed: number;
  jobsFound: number;
  jobsAdded: number;
  belowThreshold: number;
  matchThreshold: number;
  lastProcessed: string | null;
}

export default function JobFinderDashboard({ className = '' }: JobFinderDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'profiles' | 'searches' | 'feed' | 'applications' | 'monitor' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showJobFinderSettings, setShowJobFinderSettings] = useState(false);
  const [settings, setSettings] = useState<JobFinderSettingsType>(
    () => getLocalSettings('job-finder', defaultJobFinderSettings)
  );
  const [stats, setStats] = useState<DashboardStats>({
    totalProfiles: 0,
    activeSearches: 0,
    totalMatches: 0,
    savedMatches: 0,
    totalApplications: 0,
    pendingApplications: 0,
    avgMatchScore: 0,
    emailsProcessed: 0,
    jobsFound: 0,
    jobsAdded: 0,
    belowThreshold: 0,
    matchThreshold: 80,
    lastProcessed: null
  });
  
  // Recent activity data
  const [recentMatches, setRecentMatches] = useState<JobMatch[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data when returning from other routes (like settings)
  useEffect(() => {
    const handleFocus = () => {
      loadDashboardData();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Test connection first
      const connectionTest = await JobFinderService.testConnection();
      if (!connectionTest.success) {
        setError(`Connection failed: ${connectionTest.error}`);
        return;
      }

      const userId = connectionTest.userId!;
      console.log('Loading dashboard data for user:', userId);

      // Load dashboard stats using the service
      const dashboardStats = await JobFinderService.getDashboardStats(userId);
      
      // Load email processing stats
      const emailStats = EmailJobProcessor.getProcessingStats();
      const matchThreshold = EmailJobProcessor.getMatchThreshold();
      
      // Combine both sets of stats
      setStats({
        ...dashboardStats,
        emailsProcessed: emailStats.emailsProcessed || 0,
        jobsFound: emailStats.jobsFound || 0,
        jobsAdded: emailStats.jobsAdded || 0,
        belowThreshold: emailStats.belowThreshold || 0,
        matchThreshold: matchThreshold,
        lastProcessed: emailStats.lastProcessed || null
      });

      // Load recent data with individual error handling
      try {
        const matches = await JobFinderService.getMatches(userId, { minScore: 0 });
        setRecentMatches(matches.slice(0, 5));
      } catch (matchError) {
        console.error('Error loading matches:', matchError);
        setRecentMatches([]);
      }

      try {
        const applications = await JobFinderService.getApplications(userId);
        setRecentApplications(applications.slice(0, 5));
      } catch (appError) {
        console.error('Error loading applications:', appError);
        setRecentApplications([]);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(`Failed to load dashboard data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'screening':
      case 'phone_interview':
      case 'technical_interview':
      case 'onsite_interview':
      case 'final_interview':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'offer':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'accepted':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      case 'rejected':
      case 'withdrawn':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
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
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Briefcase className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
          Job Finder
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              const test = await JobFinderService.testConnection();
              console.log('Connection test result:', test);
              if (test.success) {
                setSuccess(`Connected successfully! User ID: ${test.userId}`);
              } else {
                setError(`Connection test failed: ${test.error}`);
              }
            }}
            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
              rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Test Connection
          </button>
          <button
            onClick={async () => {
              const validation = await JobFinderService.validateSchema();
              console.log('Schema validation result:', validation);
              if (validation.success) {
                setSuccess(`Schema validation passed! All tables accessible.`);
              } else {
                const failedTables = Object.entries(validation.results)
                  .filter(([_, result]) => !result.success)
                  .map(([table, result]) => `${table}: ${result.error}`)
                  .join('; ');
                setError(`Schema validation failed: ${failedTables}`);
              }
            }}
            className="px-3 py-1 text-xs bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-300 
              rounded hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors"
          >
            Validate Schema
          </button>
          <div className="text-sm text-secondary">
            AI-powered career discovery platform
          </div>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Success Alert */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
          rounded-lg flex items-start space-x-2 theme-transition" role="alert">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Success</p>
            <p className="text-xs text-green-600 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-primary rounded-xl shadow-sm p-1 theme-transition">
        <nav className="flex space-x-1" role="tablist">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'profiles', label: 'Profiles', icon: Users },
            { id: 'searches', label: 'Searches', icon: Search },
            { id: 'feed', label: 'Job Feed', icon: TrendingUp },
            { id: 'applications', label: 'Applications', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'profiles' | 'searches' | 'feed' | 'applications' | 'settings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-tertiary'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Emails Processed</p>
                    <p className="text-2xl font-bold text-primary">{stats.emailsProcessed}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Jobs Found</p>
                    <p className="text-2xl font-bold text-primary">{stats.jobsFound}</p>
                  </div>
                  <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Jobs Added</p>
                    <p className="text-2xl font-bold text-primary">{stats.jobsAdded}</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Below Threshold</p>
                    <p className="text-2xl font-bold text-primary">{stats.belowThreshold}</p>
                  </div>
                  <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Job Profiles</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalProfiles}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Total Matches</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalMatches}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Applications</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalApplications}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Match Threshold</p>
                    <p className="text-2xl font-bold text-primary">{stats.matchThreshold}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Star className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-secondary">Saved Matches</p>
                    <p className="text-lg font-semibold text-primary">{stats.savedMatches}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-secondary">Pending Applications</p>
                    <p className="text-lg font-semibold text-primary">{stats.pendingApplications}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-secondary">Average Match Score</p>
                    <p className={`text-lg font-semibold ${getScoreColor(stats.avgMatchScore)}`}>
                      {stats.avgMatchScore}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-primary rounded-xl p-6 shadow-sm theme-transition">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                Quick Actions
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('profiles')}
                  className="p-4 bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-600 
                    rounded-lg transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <ArrowRight className="h-4 w-4 text-tertiary group-hover:text-purple-600 
                      dark:group-hover:text-purple-400 transition-colors" />
                  </div>
                  <h4 className="font-medium text-primary mb-1">Manage Profiles</h4>
                  <p className="text-sm text-secondary">Create and edit your job profiles</p>
                </button>

                <button
                  onClick={() => setActiveTab('searches')}
                  className="p-4 bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-600 
                    rounded-lg transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <ArrowRight className="h-4 w-4 text-tertiary group-hover:text-blue-600 
                      dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h4 className="font-medium text-primary mb-1">Create Searches</h4>
                  <p className="text-sm text-secondary">Set up automated job searches</p>
                </button>

                <button
                  onClick={() => setActiveTab('feed')}
                  className="p-4 bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-600 
                    rounded-lg transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <ArrowRight className="h-4 w-4 text-tertiary group-hover:text-green-600 
                      dark:group-hover:text-green-400 transition-colors" />
                  </div>
                  <h4 className="font-medium text-primary mb-1">Browse Jobs</h4>
                  <p className="text-sm text-secondary">View AI-matched job opportunities</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Matches */}
              <div className="bg-primary rounded-xl p-6 shadow-sm theme-transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    Recent Matches
                  </h3>
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline 
                      flex items-center"
                  >
                    View all
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </button>
                </div>

                <div className="space-y-3">
                  {recentMatches.length === 0 ? (
                    <p className="text-sm text-secondary italic">No recent matches</p>
                  ) : (
                    recentMatches.map(match => (
                      <div key={match.id} className="p-3 bg-tertiary rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-primary truncate">
                              {match.job_title}
                            </h4>
                            <p className="text-xs text-secondary">{match.company_name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {match.ai_match_score && (
                                <div className={`flex items-center ${getScoreColor(match.ai_match_score)}`}>
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  <span className="text-xs font-medium">{match.ai_match_score}%</span>
                                </div>
                              )}
                              <span className="text-xs text-tertiary">
                                {formatDate(match.created_at)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('feed')}
                            className="p-1 text-tertiary hover:text-purple-600 dark:hover:text-purple-400"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-primary rounded-xl p-6 shadow-sm theme-transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center">
                    <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                    Recent Applications
                  </h3>
                  <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline 
                    flex items-center">
                    View all
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </button>
                </div>

                <div className="space-y-3">
                  {recentApplications.length === 0 ? (
                    <p className="text-sm text-secondary italic">No recent applications</p>
                  ) : (
                    recentApplications.map(application => (
                      <div key={application.id} className="p-3 bg-tertiary rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-primary truncate">
                              {application.job_title}
                            </h4>
                            <p className="text-xs text-secondary">{application.company_name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(application.application_status)}`}>
                                {application.application_status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-tertiary">
                                {formatDate(application.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Getting Started Guide */}
            {stats.totalProfiles === 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 
                dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 theme-transition">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary mb-2">Welcome to Job Finder!</h3>
                    <p className="text-sm text-secondary mb-4">
                      Get started by creating your first job profile. This will help our AI match you 
                      with the most relevant opportunities.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setActiveTab('profiles')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                          transition-colors flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Profile</span>
                      </button>
                      <button className="px-4 py-2 text-purple-600 dark:text-purple-400 border 
                        border-purple-600 dark:border-purple-400 rounded-lg hover:bg-purple-50 
                        dark:hover:bg-purple-900/20 transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <JobProfileManager />
        )}

        {/* Searches Tab */}
        {activeTab === 'searches' && (
          <JobSearchCreator />
        )}

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <JobDiscoveryFeed />
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <JobApplicationTracker />
        )}


        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* LinkedIn Scraping Settings Section */}
            <div className="bg-primary rounded-xl p-6 shadow-sm theme-transition">
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
            <div className="bg-primary rounded-xl p-6 shadow-sm theme-transition">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                  <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary">Job Finder Settings</h3>
                  <p className="text-sm text-secondary">Customize display, search, and notification preferences</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm flex-1">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Display & Layout</h4>
                    <p className="text-blue-700 dark:text-blue-300">Customize job card information and layout.</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Search & Filtering</h4>
                    <p className="text-green-700 dark:text-green-300">Set search parameters and filters.</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Notifications</h4>
                    <p className="text-purple-700 dark:text-purple-300">Manage alerts and preferences.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowJobFinderSettings(true)}
                  className="ml-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
            
            {/* Security & Privacy Section (Placeholder for future) */}
            <div className="bg-primary rounded-xl p-6 shadow-sm theme-transition">
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

      {/* Job Finder Settings Modal */}
      <JobFinderSettings
        isOpen={showJobFinderSettings}
        onClose={() => setShowJobFinderSettings(false)}
        onSettingsChange={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('settings_job-finder', JSON.stringify(newSettings));
        }}
      />
    </div>
  );
}