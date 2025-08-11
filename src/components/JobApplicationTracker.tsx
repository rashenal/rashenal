import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Building, 
  MapPin, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  Filter,
  Loader,
  Star,
  Send,
  UserCheck,
  Phone,
  Video,
  Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { JobApplication } from '../lib/database-types';
import { JobFinderService } from '../lib/job-finder-service';
import { TaskService } from '../lib/task-service';

interface JobApplicationTrackerProps {
  className?: string;
}

export default function JobApplicationTracker({ className = '' }: JobApplicationTrackerProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);

  // Application status options
  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Edit2, color: 'gray' },
    { value: 'applied', label: 'Applied', icon: Send, color: 'blue' },
    { value: 'screening', label: 'Screening', icon: UserCheck, color: 'purple' },
    { value: 'phone_interview', label: 'Phone Interview', icon: Phone, color: 'yellow' },
    { value: 'technical_interview', label: 'Technical Interview', icon: FileText, color: 'orange' },
    { value: 'onsite_interview', label: 'On-site Interview', icon: Video, color: 'indigo' },
    { value: 'final_interview', label: 'Final Interview', icon: Star, color: 'pink' },
    { value: 'offer', label: 'Offer Received', icon: Award, color: 'green' },
    { value: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'emerald' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'red' },
    { value: 'withdrawn', label: 'Withdrawn', icon: AlertCircle, color: 'gray' }
  ];

  // Load applications on mount
  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let allApplications = await JobFinderService.getApplications(user.id);
      
      // Apply status filter
      if (filterStatus !== 'all') {
        allApplications = allApplications.filter(app => app.status === filterStatus);
      }

      setApplications(allApplications);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      await JobFinderService.updateApplication(applicationId, { 
        status: newStatus, // Changed from application_status
        ...(newStatus === 'applied' ? { applied_at: new Date().toISOString() } : {}) // Changed from application_date
      });
      
      // Create tasks for important status changes
      const taskMappings: Record<string, { title: string; description: string; energy: string; minutes: number }> = {
        'phone_interview': {
          title: `Prepare for phone interview - ${application.company_name}`,
          description: `Phone interview scheduled for ${application.job_title} at ${application.company_name}`,
          energy: 'medium',
          minutes: 60
        },
        'technical_interview': {
          title: `Prepare for technical interview - ${application.company_name}`,
          description: `Technical interview for ${application.job_title} at ${application.company_name}. Review technical concepts and prepare coding examples.`,
          energy: 'high',
          minutes: 120
        },
        'onsite_interview': {
          title: `Prepare for on-site interview - ${application.company_name}`,
          description: `On-site interview for ${application.job_title} at ${application.company_name}. Research company culture, prepare questions, and plan outfit.`,
          energy: 'high',
          minutes: 180
        },
        'offer': {
          title: `Review job offer - ${application.company_name}`,
          description: `You received an offer for ${application.job_title} at ${application.company_name}! Review terms and prepare negotiation points.`,
          energy: 'medium',
          minutes: 90
        }
      };

      if (taskMappings[newStatus]) {
        const task = taskMappings[newStatus];
        await TaskService.createTask({
          title: task.title,
          description: task.description,
          status: 'todo',
          priority: 'high',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          energy_level: task.energy as 'small' | 'medium' | 'large',
          estimated_minutes: task.minutes,
          tags: ['job-interview', application.company_name.toLowerCase().replace(/\s+/g, '-')],
          project_id: null
        });
        setSuccess(`Application status updated! A task has been created to help you prepare.`);
      } else {
        setSuccess('Application status updated!');
      }
      
      await loadApplications();
    } catch (err) {
      console.error('Error updating application:', err);
      setError('Failed to update application status.');
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;
      
      setSuccess('Application deleted successfully!');
      await loadApplications();
    } catch (err) {
      console.error('Error deleting application:', err);
      setError('Failed to delete application.');
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return 'gray';
    return statusOption.color;
  };

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.icon || FileText;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return 'Salary not disclosed';
  };

  const getApplicationStats = () => {
    const stats = {
      total: applications.length,
      active: applications.filter(app => 
        ['applied', 'screening', 'phone_interview', 'technical_interview', 'onsite_interview', 'final_interview'].includes(app.status)
      ).length,
      offers: applications.filter(app => app.status === 'offer').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const stats = getApplicationStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary flex items-center">
          <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
          Application Tracker
        </h2>
        <div className="text-sm text-secondary">
          {stats.total} applications • {stats.active} active
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
          rounded-lg flex items-start space-x-2 theme-transition" role="alert">
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Success</p>
            <p className="text-xs text-green-600 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Total Applications</p>
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Active</p>
              <p className="text-2xl font-bold text-primary">{stats.active}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Offers</p>
              <p className="text-2xl font-bold text-primary">{stats.offers}</p>
            </div>
            <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Rejected</p>
              <p className="text-2xl font-bold text-primary">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-primary rounded-xl p-4 shadow-sm theme-transition">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-secondary" />
          <span className="text-sm font-medium text-secondary">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterStatus === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-tertiary text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All ({stats.total})
            </button>
            {statusOptions.map(status => {
              const count = applications.filter(app => app.status === status.value).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center space-x-1 ${
                    filterStatus === status.value
                      ? `bg-${status.color}-600 text-white`
                      : 'bg-tertiary text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <status.icon className="h-3 w-3" />
                  <span>{status.label} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-primary rounded-xl p-8 text-center theme-transition">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-secondary">No applications found</p>
            <p className="text-sm text-tertiary mt-2">
              Start applying to jobs from the Job Feed to track them here
            </p>
          </div>
        ) : (
          applications.map(application => {
            const StatusIcon = getStatusIcon(application.status);
            const statusColor = getStatusColor(application.status);
            
            return (
              <div key={application.id} className="bg-primary rounded-xl p-6 shadow-sm theme-transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary flex items-center">
                      {application.job_title}
                      {application.job_url && (
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 
                            dark:hover:text-purple-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-secondary mt-1">
                      <span className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        {application.company_name}
                      </span>
                      {application.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {application.location}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => deleteApplication(application.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 
                        dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Application Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-secondary">Applied Date</p>
                    <p className="text-sm font-medium text-primary">
                      {formatDate(application.applied_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary">Profile</p>
                    <p className="text-sm font-medium text-primary">
                      {application.profile_id ? `Profile ${application.profile_id.slice(0, 8)}...` : 'No profile'}
                    </p>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-5 w-5 text-${statusColor}-600 dark:text-${statusColor}-400`} />
                    <select
                      value={application.status}
                      onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                      className={`px-3 py-1 text-sm rounded-full bg-${statusColor}-100 dark:bg-${statusColor}-900/30 
                        text-${statusColor}-700 dark:text-${statusColor}-300 border-0 cursor-pointer`}
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {application.follow_up_date && (
                    <div className="flex items-center text-sm text-secondary">
                      <Calendar className="h-4 w-4 mr-1" />
                      Follow-up: {formatDate(application.follow_up_date)}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {application.notes && (
                  <div className="mt-4 p-3 bg-tertiary rounded-lg">
                    <p className="text-sm text-secondary">{application.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}