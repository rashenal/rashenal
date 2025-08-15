import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Rocket
} from 'lucide-react';
import { useUser } from '../../contexts/userContext';
import { supabase } from '../../lib/supabase';
import CreateProjectModal from './CreateProjectModal';

interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'revenue' | 'operations' | 'marketing' | 'product' | 'personal' | 'other';
  budget?: number;
  revenue_target?: number;
  start_date?: string;
  target_date?: string;
  completion_percentage: number;
  color: string;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  task_count?: number;
  completed_tasks?: number;
  total_estimated_hours?: number;
  days_remaining?: number;
  revenue_potential?: number;
}

interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_revenue_target: number;
  projects_behind_schedule: number;
  average_completion: number;
}

const PROJECT_CATEGORIES = {
  revenue: { label: 'Revenue Generation', icon: DollarSign, color: 'green' },
  operations: { label: 'Operations', icon: Settings, color: 'blue' },
  marketing: { label: 'Marketing', icon: TrendingUp, color: 'purple' },
  product: { label: 'Product Development', icon: Rocket, color: 'orange' },
  personal: { label: 'Personal Development', icon: Target, color: 'pink' },
  other: { label: 'Other', icon: Folder, color: 'gray' }
};

const PROJECT_STATUS = {
  planning: { label: 'Planning', color: 'gray', icon: '📋' },
  active: { label: 'Active', color: 'blue', icon: '⚡' },
  on_hold: { label: 'On Hold', color: 'yellow', icon: '⏸️' },
  completed: { label: 'Completed', color: 'green', icon: '✅' },
  cancelled: { label: 'Cancelled', color: 'red', icon: '❌' }
};

const PRIORITY_LEVELS = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'blue' },
  high: { label: 'High', color: 'orange' },
  urgent: { label: 'Urgent', color: 'red' }
};

export default function ProjectManager() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProjects();
      loadStats();
    }
  }, [user?.id]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      
      // Load projects with task counts
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          tasks!inner(count)
        `)
        .eq('user_id', user!.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        return;
      }

      // Enhance projects with computed fields
      const enhancedProjects = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get task statistics
          const { data: taskStats } = await supabase
            .from('tasks')
            .select('status, estimated_time')
            .eq('project_id', project.id);

          const totalTasks = taskStats?.length || 0;
          const completedTasks = taskStats?.filter(t => t.status === 'done').length || 0;
          const totalEstimatedHours = taskStats?.reduce((sum, t) => sum + (t.estimated_time || 0), 0) || 0;

          // Calculate days remaining
          const daysRemaining = project.target_date 
            ? Math.ceil((new Date(project.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return {
            ...project,
            task_count: totalTasks,
            completed_tasks: completedTasks,
            total_estimated_hours: totalEstimatedHours,
            days_remaining: daysRemaining,
            completion_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          };
        })
      );

      setProjects(enhancedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('status, revenue_target, completion_percentage, target_date')
        .eq('user_id', user!.id)
        .eq('is_archived', false);

      if (projectsData) {
        const totalProjects = projectsData.length;
        const activeProjects = projectsData.filter(p => p.status === 'active').length;
        const completedProjects = projectsData.filter(p => p.status === 'completed').length;
        const totalRevenueTarget = projectsData.reduce((sum, p) => sum + (p.revenue_target || 0), 0);
        const averageCompletion = totalProjects > 0 
          ? Math.round(projectsData.reduce((sum, p) => sum + p.completion_percentage, 0) / totalProjects)
          : 0;

        // Projects behind schedule (past target date with < 100% completion)
        const projectsBehindSchedule = projectsData.filter(p => 
          p.target_date && 
          new Date(p.target_date) < new Date() && 
          p.completion_percentage < 100
        ).length;

        setStats({
          total_projects: totalProjects,
          active_projects: activeProjects,
          completed_projects: completedProjects,
          total_revenue_target: totalRevenueTarget,
          projects_behind_schedule: projectsBehindSchedule,
          average_completion: averageCompletion
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
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

  const getStatusColor = (status: string) => {
    const statusConfig = PROJECT_STATUS[status as keyof typeof PROJECT_STATUS];
    return statusConfig?.color || 'gray';
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

  const openTaskboard = (projectId: string, projectName: string) => {
    navigate(`/taskboard/${projectId}?name=${encodeURIComponent(projectName)}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
            Project Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Organize and track your revenue-generating initiatives
          </p>
        </div>
        <button
          onClick={() => setShowCreateProject(true)}
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
                <p className="text-2xl font-bold text-gray-900">{stats.total_projects}</p>
              </div>
              <Folder className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active_projects}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_projects}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.projects_behind_schedule}</p>
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {Object.entries(PROJECT_STATUS).map(([key, status]) => (
              <option key={key} value={key}>
                {status.icon} {status.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.entries(PROJECT_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.label}
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

      {/* Projects List */}
      <div className="space-y-4">
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onDoubleClick={() => openTaskboard(project.id, project.name)}
            title="Double-click to open taskboard"
          >
            {/* Project Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                    
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(project.status) === 'green' ? 'bg-green-100 text-green-800' :
                      getStatusColor(project.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                      getStatusColor(project.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      getStatusColor(project.status) === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {PROJECT_STATUS[project.status]?.icon} {PROJECT_STATUS[project.status]?.label}
                    </span>

                    {/* Priority Badge */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      getPriorityColor(project.priority) === 'red' ? 'bg-red-100 text-red-800' :
                      getPriorityColor(project.priority) === 'orange' ? 'bg-orange-100 text-orange-800' :
                      getPriorityColor(project.priority) === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {PRIORITY_LEVELS[project.priority]?.label}
                    </span>

                    {/* Category Badge */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.category === 'revenue' ? 'bg-green-100 text-green-800' :
                      project.category === 'marketing' ? 'bg-purple-100 text-purple-800' :
                      project.category === 'product' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {PROJECT_CATEGORIES[project.category]?.label}
                    </span>

                    {project.is_favorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {project.description && (
                    <p className="text-gray-600 mb-3">{project.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{project.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Project Metrics */}
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {project.completed_tasks}/{project.task_count} tasks
                    </div>
                    
                    {project.total_estimated_hours > 0 && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {project.total_estimated_hours}h estimated
                      </div>
                    )}

                    {project.revenue_target && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(project.revenue_target)} target
                      </div>
                    )}

                    {project.target_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {project.days_remaining !== null && project.days_remaining >= 0 
                          ? `${project.days_remaining} days left`
                          : project.days_remaining !== null && project.days_remaining < 0
                          ? `${Math.abs(project.days_remaining)} days overdue`
                          : 'Target date set'
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedProject === project.id ? (
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

            {/* Expanded Project Details */}
            {expandedProject === project.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Recent Tasks */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recent Tasks</h4>
                    <div className="space-y-2">
                      {/* This would load actual tasks from the project */}
                      <div className="p-2 bg-white rounded border border-gray-200">
                        <div className="text-sm font-medium text-gray-900">Sample Task 1</div>
                        <div className="text-xs text-gray-600">In Progress • High Priority</div>
                      </div>
                      <div className="p-2 bg-white rounded border border-gray-200">
                        <div className="text-sm font-medium text-gray-900">Sample Task 2</div>
                        <div className="text-xs text-gray-600">To Do • Medium Priority</div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="text-gray-900">
                          {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Date:</span>
                        <span className="text-gray-900">
                          {project.target_date ? new Date(project.target_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Budget & Revenue */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Financial</h4>
                    <div className="space-y-2 text-sm">
                      {project.budget && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="text-gray-900">{formatCurrency(project.budget)}</span>
                        </div>
                      )}
                      {project.revenue_target && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue Target:</span>
                          <span className="text-green-600 font-medium">{formatCurrency(project.revenue_target)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">ROI Potential:</span>
                        <span className="text-purple-600 font-medium">
                          {project.budget && project.revenue_target 
                            ? `${Math.round(((project.revenue_target - project.budget) / project.budget) * 100)}%`
                            : 'TBD'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center space-x-3">
                  <button 
                    onClick={() => openTaskboard(project.id, project.name)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Tasks
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Edit Project
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
      {sortedProjects.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'No projects found' 
              : 'No projects yet'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first project to start organizing your work and tracking progress.'
            }
          </p>
          <button
            onClick={() => setShowCreateProject(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Create Your First Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onProjectCreated={(project) => {
          setProjects(prev => [project, ...prev]);
          loadStats(); // Refresh stats
          setShowCreateProject(false);
        }}
      />
    </div>
  );
}