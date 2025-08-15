import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  BarChart3,
  Settings,
  Star,
  Archive,
  Folder,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Rocket,
  FolderKanban
} from 'lucide-react';
import { useUser } from '../../contexts/userContext';
import { supabase } from '../../lib/supabase';
import CreateTaskboardModal from './CreateTaskboardModal';

interface Taskboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'revenue' | 'operations' | 'marketing' | 'product' | 'personal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  revenue_target?: number;
  start_date?: string;
  target_date?: string;
  completion_percentage: number;
  color: string;
  is_favorite: boolean;
  is_archived: boolean;
  is_active: boolean;
  task_counter: number;
  created_at: string;
  updated_at: string;
  
  // Computed fields from view
  actual_task_count?: number;
  completed_tasks?: number;
  total_estimated_hours?: number;
  days_until_target?: number;
  is_behind_schedule?: boolean;
  roi_percentage?: number;
}

interface TaskboardStats {
  total_taskboards: number;
  active_taskboards: number;
  completed_taskboards: number;
  total_revenue_target: number;
  taskboards_behind_schedule: number;
  average_completion: number;
}

const TASKBOARD_CATEGORIES = {
  revenue: { label: 'Revenue Generation', icon: DollarSign, color: 'green' },
  operations: { label: 'Operations', icon: Settings, color: 'blue' },
  marketing: { label: 'Marketing', icon: TrendingUp, color: 'purple' },
  product: { label: 'Product Development', icon: Rocket, color: 'orange' },
  personal: { label: 'Personal Development', icon: Target, color: 'pink' },
  other: { label: 'Other', icon: Folder, color: 'gray' }
};

const PRIORITY_LEVELS = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'blue' },
  high: { label: 'High', color: 'orange' },
  urgent: { label: 'Urgent', color: 'red' }
};

export default function EnhancedTaskboardManager() {
  const { user } = useUser();
  const [taskboards, setTaskboards] = useState<Taskboard[]>([]);
  const [stats, setStats] = useState<TaskboardStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTaskboard, setShowCreateTaskboard] = useState(false);
  const [expandedTaskboard, setExpandedTaskboard] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadTaskboards();
      loadStats();
    }
  }, [user?.id]);

  const loadTaskboards = async () => {
    try {
      setIsLoading(true);
      
      // Load taskboards with enhanced analytics - fallback to taskboards table if view is broken
      console.log('🔍 Attempting to load from enhanced_taskboard_analytics view...');
      let taskboardsData;
      let taskboardsError;
      
      try {
        const result = await supabase
          .from('enhanced_taskboard_analytics')
          .select('*')
          .eq('user_id', user!.id)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false });
        
        taskboardsData = result.data;
        taskboardsError = result.error;
        
        // Check if we got data but no IDs - indicates view is broken
        if (taskboardsData && taskboardsData.length > 0 && !taskboardsData[0].id) {
          console.warn('⚠️ Enhanced view returning data without IDs, falling back to taskboards table...');
          throw new Error('View missing IDs');
        }
      } catch (viewError) {
        console.warn('Enhanced view failed, using taskboards table directly:', viewError);
        // Fallback to basic taskboards table
        const fallbackResult = await supabase
          .from('taskboards')
          .select('*')
          .eq('user_id', user!.id)
          .eq('is_archived', false)
          .eq('is_active', true)
          .order('updated_at', { ascending: false });
        
        taskboardsData = fallbackResult.data;
        taskboardsError = fallbackResult.error;
      }

      if (taskboardsError) {
        console.error('Error loading taskboards:', taskboardsError);
        return;
      }

      // Debug: Check for duplicate or missing IDs
      if (taskboardsData) {
        console.log('📊 Raw taskboard data from DB:', taskboardsData);
        const ids = taskboardsData.map(t => t.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          console.error('⚠️ Duplicate taskboard IDs detected!');
          const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
          console.error('Duplicate IDs:', duplicates);
        }
        const missingIds = taskboardsData.filter(t => !t.id);
        if (missingIds.length > 0) {
          console.error('⚠️ Taskboards with missing IDs:', missingIds);
          console.error('First taskboard without ID:', missingIds[0]);
        }
      }

      setTaskboards(taskboardsData || []);
    } catch (error) {
      console.error('Error loading taskboards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: taskboardsData } = await supabase
        .from('enhanced_taskboard_analytics')
        .select('completion_percentage, revenue_target, target_date, is_behind_schedule')
        .eq('user_id', user!.id)
        .eq('is_archived', false);

      if (taskboardsData) {
        const totalTaskboards = taskboardsData.length;
        const activeTaskboards = taskboardsData.filter(t => t.completion_percentage < 100).length;
        const completedTaskboards = taskboardsData.filter(t => t.completion_percentage >= 100).length;
        const totalRevenueTarget = taskboardsData.reduce((sum, t) => sum + (t.revenue_target || 0), 0);
        const averageCompletion = totalTaskboards > 0 
          ? Math.round(taskboardsData.reduce((sum, t) => sum + t.completion_percentage, 0) / totalTaskboards)
          : 0;
        const taskboardsBehindSchedule = taskboardsData.filter(t => t.is_behind_schedule).length;

        setStats({
          total_taskboards: totalTaskboards,
          active_taskboards: activeTaskboards,
          completed_taskboards: completedTaskboards,
          total_revenue_target: totalRevenueTarget,
          taskboards_behind_schedule: taskboardsBehindSchedule,
          average_completion: averageCompletion
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredTaskboards = taskboards.filter(taskboard => {
    const matchesSearch = searchQuery === '' || 
      taskboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      taskboard.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || taskboard.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || taskboard.priority === priorityFilter;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const sortedTaskboards = [...filteredTaskboards].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      case 'target_date':
        if (!a.target_date && !b.target_date) return 0;
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      case 'completion':
        return b.completion_percentage - a.completion_percentage;
      case 'revenue_target':
        return (b.revenue_target || 0) - (a.revenue_target || 0);
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });

  const getCategoryColor = (category: string) => {
    const categoryConfig = TASKBOARD_CATEGORIES[category as keyof typeof TASKBOARD_CATEGORIES];
    return categoryConfig?.color || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = PRIORITY_LEVELS[priority as keyof typeof PRIORITY_LEVELS];
    return priorityConfig?.color || 'gray';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading taskboards...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FolderKanban className="h-8 w-8 text-purple-600 mr-3" />
            Projects
          </h1>
          <p className="text-gray-600 mt-1">
            Your projects enhanced with business intelligence and revenue tracking
          </p>
        </div>
        <button
          onClick={() => setShowCreateTaskboard(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_taskboards}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active_taskboards}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_taskboards}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Target</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.total_revenue_target)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Behind Schedule</p>
                <p className="text-2xl font-bold text-red-600">{stats.taskboards_behind_schedule}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.average_completion}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.entries(TASKBOARD_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
              <option key={key} value={key}>
                {priority.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="updated_at">Recently Updated</option>
            <option value="name">Name</option>
            <option value="priority">Priority</option>
            <option value="target_date">Target Date</option>
            <option value="completion">Progress</option>
            <option value="revenue_target">Revenue Target</option>
          </select>
        </div>
      </div>

      {/* Taskboards List */}
      <div className="space-y-4">
        {sortedTaskboards.map((taskboard, index) => (
          <div
            key={taskboard?.id || `taskboard-fallback-${index}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            onDoubleClick={() => window.location.href = `/taskboard/${taskboard.id}`}
            style={{ cursor: 'pointer' }}
          >
            {/* Taskboard Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{taskboard.name}</h3>
                    
                    {/* Category Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      getCategoryColor(taskboard.category) === 'green' ? 'bg-green-100 text-green-800' :
                      getCategoryColor(taskboard.category) === 'blue' ? 'bg-blue-100 text-blue-800' :
                      getCategoryColor(taskboard.category) === 'purple' ? 'bg-purple-100 text-purple-800' :
                      getCategoryColor(taskboard.category) === 'orange' ? 'bg-orange-100 text-orange-800' :
                      getCategoryColor(taskboard.category) === 'pink' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {TASKBOARD_CATEGORIES[taskboard.category]?.label}
                    </span>

                    {/* Priority Badge */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      getPriorityColor(taskboard.priority) === 'red' ? 'bg-red-100 text-red-800' :
                      getPriorityColor(taskboard.priority) === 'orange' ? 'bg-orange-100 text-orange-800' :
                      getPriorityColor(taskboard.priority) === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {PRIORITY_LEVELS[taskboard.priority]?.label}
                    </span>

                    {taskboard.is_favorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}

                    {taskboard.is_behind_schedule && (
                      <AlertTriangle className="h-4 w-4 text-red-500" title="Behind Schedule" />
                    )}
                  </div>

                  {taskboard.description && (
                    <p className="text-gray-600 mb-3">{taskboard.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{taskboard.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${taskboard.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Taskboard Metrics */}
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {taskboard.completed_tasks || 0}/{taskboard.actual_task_count || taskboard.task_counter} tasks
                    </div>
                    
                    {taskboard.total_estimated_hours && taskboard.total_estimated_hours > 0 && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {taskboard.total_estimated_hours}h estimated
                      </div>
                    )}

                    {taskboard.revenue_target && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(taskboard.revenue_target)} target
                      </div>
                    )}

                    {taskboard.roi_percentage && (
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {taskboard.roi_percentage}% ROI
                      </div>
                    )}

                    {taskboard.target_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {taskboard.days_until_target !== null && taskboard.days_until_target >= 0 
                          ? `${taskboard.days_until_target} days left`
                          : taskboard.days_until_target !== null && taskboard.days_until_target < 0
                          ? `${Math.abs(taskboard.days_until_target)} days overdue`
                          : 'Target date set'
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedTaskboard(expandedTaskboard === taskboard.id ? null : taskboard.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedTaskboard === taskboard.id ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Taskboard Details */}
            {expandedTaskboard === taskboard.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Timeline */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="text-gray-900">
                          {taskboard.start_date ? new Date(taskboard.start_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Date:</span>
                        <span className="text-gray-900">
                          {taskboard.target_date ? new Date(taskboard.target_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">
                          {new Date(taskboard.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Financial</h4>
                    <div className="space-y-2 text-sm">
                      {taskboard.budget && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="text-gray-900">{formatCurrency(taskboard.budget)}</span>
                        </div>
                      )}
                      {taskboard.revenue_target && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue Target:</span>
                          <span className="text-green-600 font-medium">{formatCurrency(taskboard.revenue_target)}</span>
                        </div>
                      )}
                      {taskboard.roi_percentage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected ROI:</span>
                          <span className="text-purple-600 font-medium">{taskboard.roi_percentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks Overview */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Tasks</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Tasks:</span>
                        <span className="text-gray-900">{taskboard.actual_task_count || taskboard.task_counter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="text-green-600">{taskboard.completed_tasks || 0}</span>
                      </div>
                      {taskboard.total_estimated_hours && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Hours:</span>
                          <span className="text-gray-900">{taskboard.total_estimated_hours}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center space-x-3">
                  <button 
                    onClick={() => window.location.href = `/taskboard/${taskboard.id}`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Open Taskboard
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Edit Details
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Add to Calendar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedTaskboards.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all' 
              ? 'No projects found' 
              : 'No projects yet'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first project to start organizing your work and tracking progress.'
            }
          </p>
          <button
            onClick={() => setShowCreateTaskboard(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Create Your First Project
          </button>
        </div>
      )}

      {/* Create Taskboard Modal */}
      <CreateTaskboardModal
        isOpen={showCreateTaskboard}
        onClose={() => setShowCreateTaskboard(false)}
        onTaskboardCreated={(taskboard) => {
          setTaskboards(prev => [taskboard, ...prev]);
          loadStats(); // Refresh stats
          setShowCreateTaskboard(false);
        }}
      />
    </div>
  );
}