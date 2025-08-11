import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Clock,
  Users,
  Target,
  Zap,
  Brain,
  Star,
  ChevronDown,
  Grid3X3,
  List,
  BarChart3,
  Settings,
  Sparkles,
  Bot,
  FileText,
  Paperclip,
  CheckCircle2,
  Circle,
  ArrowRight,
  Flame,
  AlertCircle,
  TrendingUp,
  Eye,
  Archive,
  Heart,
  DollarSign,
  Move3D
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { TaskBoard, Task, TaskColumn, BoardView, TaskFilters, ENERGY_LEVELS, PRIORITY_LEVELS } from '../types/TaskBoard';
import { BOARD_TEMPLATES } from '../data/boardTemplates';
import AITemplateChatModal from './task-board/AITemplateChatModal';
import TaskCard from './task-board/TaskCard';
import CreateTaskModal from './task-board/CreateTaskModal';
import TaskDetailsModal from './task-board/TaskDetailsModal';
import BoardSettingsModal from './task-board/BoardSettingsModal';
import AccessibleTemplateGallery from './task-board/AccessibleTemplateGallery';
import BoardSelector from './task-board/BoardSelector';
import TaskCardSettings, { TaskCardDisplaySettings, defaultTaskCardSettings } from './task-board/TaskCardSettings';

interface EnhancedTaskBoardProps {
  boardId?: string;
}

export default function EnhancedTaskBoard({ boardId }: EnhancedTaskBoardProps) {
  const { user } = useUser();
  const [boards, setBoards] = useState<TaskBoard[]>([]);
  const [currentBoard, setCurrentBoard] = useState<TaskBoard | null>(null);
  const [view, setView] = useState<BoardView>({
    type: 'kanban',
    filters: {},
    sort: { field: 'position', direction: 'asc' }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showAICustomization, setShowAICustomization] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskCardSettings, setShowTaskCardSettings] = useState(false);
  const [showArchivedBoards, setShowArchivedBoards] = useState(false);
  const [taskCardSettings, setTaskCardSettings] = useState<TaskCardDisplaySettings>(() => {
    const saved = localStorage.getItem('taskCardDisplaySettings');
    return saved ? JSON.parse(saved) : defaultTaskCardSettings;
  });

  // Initialize boards from localStorage or create welcome board
  useEffect(() => {
    if (!user) return;
    
    const loadBoards = () => {
      const savedBoards = localStorage.getItem(`taskBoards_${user.id}`);
      if (savedBoards) {
        const parsedBoards = JSON.parse(savedBoards);
        setBoards(parsedBoards);
        if (boardId) {
          const board = parsedBoards.find((b: TaskBoard) => b.id === boardId);
          setCurrentBoard(board || parsedBoards[0]);
        } else {
          setCurrentBoard(parsedBoards[0]);
        }
      } else {
        // Create welcome board
        createWelcomeBoard();
      }
      setIsLoading(false);
    };

    loadBoards();
  }, [user, boardId]);

  // Save boards to localStorage whenever boards change
  useEffect(() => {
    if (user && boards.length > 0) {
      localStorage.setItem(`taskBoards_${user.id}`, JSON.stringify(boards));
    }
  }, [user, boards]);

  const createWelcomeBoard = useCallback(() => {
    if (!user) return;

    const welcomeBoard: TaskBoard = {
      id: `board_${Date.now()}`,
      user_id: user.id,
      name: '🚀 Welcome to Enhanced Task Boards',
      description: 'Get started with AI-powered productivity management',
      color_scheme: 'gradient-to-r from-blue-500 to-purple-600',
      is_archived: false,
      is_favorite: true,
      progress_percentage: 0,
      columns: [
        {
          id: 'getting-started',
          board_id: 'welcome',
          name: '🌟 Getting Started',
          description: 'Essential setup tasks',
          color: 'blue',
          position: 0,
          is_completion_column: false
        },
        {
          id: 'in-progress',
          board_id: 'welcome',
          name: '⚡ In Progress',
          description: 'Active tasks',
          color: 'orange',
          position: 1,
          is_completion_column: false
        },
        {
          id: 'review',
          board_id: 'welcome',
          name: '👀 Review',
          description: 'Tasks ready for review',
          color: 'purple',
          position: 2,
          is_completion_column: false
        },
        {
          id: 'completed',
          board_id: 'welcome',
          name: '✨ Completed',
          description: 'Finished tasks',
          color: 'green',
          position: 3,
          is_completion_column: true
        }
      ],
      tasks: [
        {
          id: 'welcome-task-1',
          board_id: 'welcome',
          column_id: 'getting-started',
          user_id: user.id,
          title: '🎯 Explore Template Gallery',
          description: 'Browse our collection of pre-built templates for different use cases like SAVERS, Wellness, Scrum, and more.',
          priority: 'high',
          energy_level: 's',
          business_value: 70,
          personal_value: 90,
          estimated_duration: 15,
          position: 0,
          tags: ['onboarding', 'templates'],
          sub_tasks: [],
          dependencies: [],
          goal_connections: [],
          attachments: [],
          time_tracking: [],
          comments: [],
          ai_insights: {
            completion_probability: 95,
            estimated_effort_accuracy: 90,
            similar_tasks: [],
            optimization_suggestions: ['Start with a template that matches your primary goal'],
            potential_blockers: [],
            best_time_to_work: {
              preferred_time_slots: ['morning'],
              energy_requirements: 'low',
              focus_requirements: 'medium'
            }
          },
          progress_percentage: 0,
          status: 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'welcome-task-2',
          board_id: 'welcome',
          column_id: 'getting-started',
          user_id: user.id,
          title: '🤖 Try AI Template Customization',
          description: 'Use our AI chat to customize a template based on your specific needs and goals.',
          priority: 'medium',
          energy_level: 'm',
          business_value: 60,
          personal_value: 85,
          estimated_duration: 20,
          position: 1,
          tags: ['onboarding', 'AI'],
          sub_tasks: [],
          dependencies: [],
          goal_connections: [],
          attachments: [],
          time_tracking: [],
          comments: [],
          ai_insights: {
            completion_probability: 85,
            estimated_effort_accuracy: 80,
            similar_tasks: [],
            optimization_suggestions: ['Be specific about your context and goals for better AI suggestions'],
            potential_blockers: [],
            best_time_to_work: {
              preferred_time_slots: ['morning', 'afternoon'],
              energy_requirements: 'medium',
              focus_requirements: 'medium'
            }
          },
          progress_percentage: 0,
          status: 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'welcome-task-3',
          board_id: 'welcome',
          column_id: 'getting-started',
          user_id: user.id,
          title: '🎨 Customize Your First Board',
          description: 'Personalize your board with custom columns, colors, and settings to match your workflow.',
          priority: 'low',
          energy_level: 's',
          business_value: 40,
          personal_value: 75,
          estimated_duration: 25,
          position: 2,
          tags: ['onboarding', 'customization'],
          sub_tasks: [
            {
              id: 'subtask-1',
              parent_task_id: 'welcome-task-3',
              title: 'Add custom columns',
              is_completed: false,
              position: 0,
              created_at: new Date().toISOString()
            },
            {
              id: 'subtask-2',
              parent_task_id: 'welcome-task-3',
              title: 'Choose color scheme',
              is_completed: false,
              position: 1,
              created_at: new Date().toISOString()
            }
          ],
          dependencies: [],
          goal_connections: [],
          attachments: [],
          time_tracking: [],
          comments: [],
          ai_insights: {
            completion_probability: 90,
            estimated_effort_accuracy: 85,
            similar_tasks: [],
            optimization_suggestions: ['Start with simple customizations and iterate'],
            potential_blockers: [],
            best_time_to_work: {
              preferred_time_slots: ['afternoon', 'evening'],
              energy_requirements: 'low',
              focus_requirements: 'low'
            }
          },
          progress_percentage: 0,
          status: 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      goals_connected: [],
      ai_insights: {
        productivity_score: 0,
        bottlenecks: [],
        progress_prediction: {
          estimated_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          confidence_level: 85,
          key_risks: []
        },
        optimization_suggestions: [
          {
            type: 'workflow',
            title: 'Start with Template Gallery',
            description: 'Explore pre-built templates to jumpstart your productivity',
            potential_impact: 'Save 2-3 hours of setup time',
            effort_required: 'low'
          }
        ],
        workload_analysis: {
          current_capacity_usage: 20,
          energy_distribution: { xs: 10, s: 40, m: 30, l: 15, xl: 5 },
          peak_productivity_times: ['09:00-11:00', '14:00-16:00'],
          suggested_task_scheduling: []
        }
      },
      settings: {
        auto_archive_completed: true,
        auto_archive_days: 30,
        enable_ai_suggestions: true,
        enable_time_tracking: true,
        enable_goal_integration: true,
        notification_preferences: {
          due_date_reminders: true,
          progress_updates: true,
          ai_insights: true,
          collaboration_updates: false
        },
        view_preferences: {
          default_view: 'kanban',
          show_sub_tasks: true,
          show_dependencies: true,
          show_ai_insights: true,
          compact_mode: false
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    setBoards([welcomeBoard]);
    setCurrentBoard(welcomeBoard);
  }, [user]);

  const createBoardFromTemplate = useCallback((templateId: string, customizations?: any) => {
    if (!user) return;

    const template = BOARD_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newBoard: TaskBoard = {
      id: `board_${Date.now()}`,
      user_id: user.id,
      name: template.name,
      description: template.description,
      template_id: templateId,
      color_scheme: template.color_scheme,
      is_archived: false,
      is_favorite: false,
      progress_percentage: 0,
      columns: template.columns.map(col => ({
        ...col,
        id: `col_${Date.now()}_${col.position}`,
        board_id: `board_${Date.now()}`
      })),
      tasks: template.default_tasks.map((taskTemplate, index) => ({
        id: `task_${Date.now()}_${index}`,
        board_id: `board_${Date.now()}`,
        column_id: `col_${Date.now()}_${template.columns.findIndex(c => c.name === taskTemplate.column_name)}`,
        user_id: user.id,
        title: taskTemplate.title,
        description: taskTemplate.description,
        priority: taskTemplate.priority,
        energy_level: taskTemplate.energy_level,
        business_value: 50,
        personal_value: 75,
        estimated_duration: taskTemplate.estimated_duration,
        position: taskTemplate.position,
        tags: taskTemplate.tags,
        sub_tasks: taskTemplate.sub_task_templates.map((subTemplate, subIndex) => ({
          id: `subtask_${Date.now()}_${subIndex}`,
          parent_task_id: `task_${Date.now()}_${index}`,
          title: subTemplate.title,
          description: subTemplate.description,
          is_completed: false,
          position: subTemplate.position,
          estimated_duration: subTemplate.estimated_duration,
          created_at: new Date().toISOString()
        })),
        dependencies: [],
        goal_connections: [],
        attachments: [],
        time_tracking: [],
        comments: [],
        ai_insights: {
          completion_probability: 80,
          estimated_effort_accuracy: 75,
          similar_tasks: [],
          optimization_suggestions: [],
          potential_blockers: [],
          best_time_to_work: {
            preferred_time_slots: [],
            energy_requirements: taskTemplate.energy_level,
            focus_requirements: 'medium'
          }
        },
        progress_percentage: 0,
        status: 'not_started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      goals_connected: [],
      ai_insights: {
        productivity_score: 0,
        bottlenecks: [],
        progress_prediction: {
          estimated_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          confidence_level: 75,
          key_risks: []
        },
        optimization_suggestions: [],
        workload_analysis: {
          current_capacity_usage: 0,
          energy_distribution: { xs: 20, s: 30, m: 30, l: 15, xl: 5 },
          peak_productivity_times: [],
          suggested_task_scheduling: []
        }
      },
      settings: {
        auto_archive_completed: true,
        auto_archive_days: 30,
        enable_ai_suggestions: true,
        enable_time_tracking: true,
        enable_goal_integration: true,
        notification_preferences: {
          due_date_reminders: true,
          progress_updates: true,
          ai_insights: true,
          collaboration_updates: false
        },
        view_preferences: {
          default_view: 'kanban',
          show_sub_tasks: true,
          show_dependencies: true,
          show_ai_insights: true,
          compact_mode: false
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    setBoards(prev => [...prev, newBoard]);
    setCurrentBoard(newBoard);
    setShowTemplateGallery(false);
  }, [user]);

  // Create empty board without template
  const createEmptyBoard = useCallback(() => {
    if (!user) return;

    const newBoard: TaskBoard = {
      id: `board_${Date.now()}`,
      user_id: user.id,
      name: 'New Board',
      description: 'A blank board ready for your tasks',
      color_scheme: 'bg-gradient-to-r from-gray-500 to-gray-600',
      is_archived: false,
      is_favorite: false,
      is_template: false,
      progress_percentage: 0,
      columns: [
        {
          id: `column_todo_${Date.now()}`,
          board_id: `board_${Date.now()}`,
          name: 'To Do',
          description: 'Tasks to be done',
          color: 'blue',
          position: 0,
          is_completion_column: false,
          is_collapsible: false,
          max_tasks: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `column_progress_${Date.now()}`,
          board_id: `board_${Date.now()}`,
          name: 'In Progress',
          description: 'Tasks being worked on',
          color: 'yellow',
          position: 1,
          is_completion_column: false,
          is_collapsible: false,
          max_tasks: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `column_done_${Date.now()}`,
          board_id: `board_${Date.now()}`,
          name: 'Done',
          description: 'Completed tasks',
          color: 'green',
          position: 2,
          is_completion_column: true,
          is_collapsible: false,
          max_tasks: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      tasks: [],
      goals_connected: [],
      ai_insights: {
        productivity_score: 0,
        bottlenecks: [],
        progress_prediction: {
          estimated_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          confidence_level: 0,
          key_risks: []
        },
        optimization_suggestions: [],
        workload_analysis: {
          current_capacity_usage: 0,
          energy_distribution: { xs: 20, s: 30, m: 30, l: 15, xl: 5 },
          peak_productivity_times: [],
          suggested_task_scheduling: []
        }
      },
      settings: {
        auto_archive_completed: false,
        auto_archive_days: 30,
        enable_ai_suggestions: true,
        enable_time_tracking: true,
        enable_goal_integration: true,
        notification_preferences: {
          due_date_reminders: true,
          progress_updates: true,
          ai_insights: true,
          collaboration_updates: false
        },
        view_preferences: {
          default_view: 'kanban',
          show_sub_tasks: true,
          show_dependencies: true,
          show_ai_insights: true,
          compact_mode: false
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    setBoards(prev => [...prev, newBoard]);
    setCurrentBoard(newBoard);
    setShowTemplateGallery(false);
    
    // Auto-open board settings for the new empty board
    setTimeout(() => setShowBoardSettings(true), 100);
  }, [user]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    if (!currentBoard) return [];
    
    let tasks = [...currentBoard.tasks];
    
    // Apply search filter
    if (searchQuery) {
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply other filters
    if (view.filters.priority?.length) {
      tasks = tasks.filter(task => view.filters.priority!.includes(task.priority));
    }
    
    if (view.filters.energy_level?.length) {
      tasks = tasks.filter(task => view.filters.energy_level!.includes(task.energy_level));
    }
    
    if (view.filters.status?.length) {
      tasks = tasks.filter(task => view.filters.status!.includes(task.status));
    }
    
    // Apply sorting
    tasks.sort((a, b) => {
      const field = view.sort.field;
      const direction = view.sort.direction === 'asc' ? 1 : -1;
      
      if (field === 'priority') {
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * direction;
      }
      
      if (field === 'due_date') {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return (aDate - bDate) * direction;
      }
      
      return ((a as any)[field] - (b as any)[field]) * direction;
    });
    
    return tasks;
  }, [currentBoard, searchQuery, view.filters, view.sort]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  }, []);

  const handleTaskCardSettingsChange = useCallback((newSettings: TaskCardDisplaySettings) => {
    setTaskCardSettings(newSettings);
    localStorage.setItem('taskCardDisplaySettings', JSON.stringify(newSettings));
  }, []);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    if (!currentBoard) return;
    
    const updatedBoard = {
      ...currentBoard,
      tasks: currentBoard.tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ),
      updated_at: new Date().toISOString()
    };
    
    setCurrentBoard(updatedBoard);
    setBoards(prev => prev.map(board => 
      board.id === updatedBoard.id ? updatedBoard : board
    ));
  }, [currentBoard]);

  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleColumnDrop = useCallback((columnId: string) => {
    if (!draggedTask || !currentBoard) return;
    
    const updatedTask = {
      ...draggedTask,
      column_id: columnId,
      updated_at: new Date().toISOString()
    };
    
    handleTaskUpdate(updatedTask);
    setDraggedTask(null);
  }, [draggedTask, currentBoard, handleTaskUpdate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your task boards...</p>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your First Board</h2>
          <p className="text-gray-600 mb-6">
            Start your productivity journey with our AI-powered task management system.
          </p>
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Browse Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Board Selector */}
            <BoardSelector
              boards={boards}
              currentBoard={currentBoard}
              onBoardSelect={setCurrentBoard}
              onCreateBoard={() => setShowTemplateGallery(true)}
              onShowArchived={() => setShowArchivedBoards(true)}
              onShowSettings={() => setShowBoardSettings(true)}
            />

            {/* Search and Actions */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView(prev => ({ ...prev, type: 'kanban' }))}
                  className={`p-2 rounded-md transition-colors ${
                    view.type === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView(prev => ({ ...prev, type: 'list' }))}
                  className={`p-2 rounded-md transition-colors ${
                    view.type === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView(prev => ({ ...prev, type: 'dashboard' }))}
                  className={`p-2 rounded-md transition-colors ${
                    view.type === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>

              <button
                onClick={() => setShowTaskCardSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Task Card Display Settings"
              >
                <Eye className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowBoardSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Board Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* AI Insights Banner */}
        {currentBoard.ai_insights.optimization_suggestions.length > 0 && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Bot className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-purple-900 mb-1">AI Optimization Suggestion</h3>
                <p className="text-sm text-purple-800">
                  {currentBoard.ai_insights.optimization_suggestions[0].description}
                </p>
                <span className="inline-block text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded-full mt-2">
                  {currentBoard.ai_insights.optimization_suggestions[0].potential_impact}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board View */}
        {view.type === 'kanban' && (
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {currentBoard.columns.map(column => (
              <div
                key={column.id}
                className="flex-shrink-0 w-80"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleColumnDrop(column.id)}
              >
                {/* Column Header */}
                <div className="bg-white rounded-t-xl border-l-4 border-l-blue-500 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      {column.name}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {filteredTasks.filter(task => task.column_id === column.id).length}
                    </span>
                  </div>
                  {column.description && (
                    <p className="text-sm text-gray-600">{column.description}</p>
                  )}
                </div>

                {/* Tasks */}
                <div className="bg-gray-50 min-h-96 p-2 space-y-3 rounded-b-xl">
                  {filteredTasks
                    .filter(task => task.column_id === column.id)
                    .map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        showAIInsights={taskCardSettings.showAIInsights}
                        compact={taskCardSettings.compactMode}
                        displaySettings={taskCardSettings}
                      />
                    ))
                  }
                  
                  {/* Add Task Button */}
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="h-4 w-4 mx-auto mb-1" />
                    <span className="text-sm">Add task</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view.type === 'list' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        PRIORITY_LEVELS[task.priority].color === 'red' ? 'bg-red-500' :
                        PRIORITY_LEVELS[task.priority].color === 'orange' ? 'bg-orange-500' :
                        PRIORITY_LEVELS[task.priority].color === 'blue' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        {ENERGY_LEVELS[task.energy_level].icon} {ENERGY_LEVELS[task.energy_level].name}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {task.estimated_duration}m
                      </span>
                      {task.attachments.length > 0 && (
                        <span className="flex items-center">
                          <Paperclip className="h-4 w-4 mr-1" />
                          {task.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {view.type === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Overview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
                <div className="space-y-4">
                  {currentBoard.columns.map(column => {
                    const columnTasks = filteredTasks.filter(task => task.column_id === column.id);
                    const percentage = currentBoard.tasks.length > 0 ? (columnTasks.length / currentBoard.tasks.length) * 100 : 0;
                    
                    return (
                      <div key={column.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">{column.name}</span>
                          <span className="text-sm text-gray-500">{columnTasks.length} tasks</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Insights Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-5 w-5 text-purple-600 mr-2" />
                  AI Insights
                </h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {currentBoard.ai_insights.productivity_score}%
                    </div>
                    <div className="text-sm text-green-600">Productivity Score</div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {currentBoard.ai_insights.optimization_suggestions.map((suggestion, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <div className="font-medium text-gray-900">{suggestion.title}</div>
                          <div>{suggestion.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action FAB */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <button
          onClick={() => setShowTemplateGallery(true)}
          className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          title="Browse Templates"
        >
          <Sparkles className="h-5 w-5" />
        </button>
        <button
          onClick={() => setShowCreateTask(true)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Modals */}
      {showTemplateGallery && (
        <AccessibleTemplateGallery
          onClose={() => setShowTemplateGallery(false)}
          onSelectTemplate={(templateId) => {
            setSelectedTemplateId(templateId);
            setShowTemplateGallery(false);
            setShowAICustomization(true);
          }}
          onCreateBoard={createBoardFromTemplate}
          onCreateEmptyBoard={createEmptyBoard}
        />
      )}

      {showAICustomization && selectedTemplateId && (
        <AITemplateChatModal
          templateId={selectedTemplateId}
          onClose={() => {
            setShowAICustomization(false);
            setSelectedTemplateId('');
          }}
          onCreateBoard={(templateId, customizations) => {
            createBoardFromTemplate(templateId, customizations);
            setShowAICustomization(false);
            setSelectedTemplateId('');
          }}
        />
      )}

      {showCreateTask && currentBoard && (
        <CreateTaskModal
          board={currentBoard}
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={(task) => {
            const updatedBoard = {
              ...currentBoard,
              tasks: [...currentBoard.tasks, task],
              updated_at: new Date().toISOString()
            };
            setCurrentBoard(updatedBoard);
            setBoards(prev => prev.map(board => 
              board.id === updatedBoard.id ? updatedBoard : board
            ));
            setShowCreateTask(false);
          }}
        />
      )}

      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          board={currentBoard}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={handleTaskUpdate}
          onTaskDeleted={(taskId) => {
            if (currentBoard) {
              const updatedBoard = {
                ...currentBoard,
                tasks: currentBoard.tasks.filter(task => task.id !== taskId),
                updated_at: new Date().toISOString()
              };
              setCurrentBoard(updatedBoard);
              setBoards(prev => prev.map(board => 
                board.id === updatedBoard.id ? updatedBoard : board
              ));
            }
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
        />
      )}

      {showBoardSettings && currentBoard && (
        <BoardSettingsModal
          board={currentBoard}
          onClose={() => setShowBoardSettings(false)}
          onBoardUpdated={(updatedBoard) => {
            setCurrentBoard(updatedBoard);
            setBoards(prev => prev.map(board => 
              board.id === updatedBoard.id ? updatedBoard : board
            ));
          }}
          onBoardDeleted={(boardId) => {
            setBoards(prev => prev.filter(board => board.id !== boardId));
            const remainingBoards = boards.filter(board => board.id !== boardId);
            if (remainingBoards.length > 0) {
              setCurrentBoard(remainingBoards[0]);
            } else {
              setCurrentBoard(null);
            }
            setShowBoardSettings(false);
          }}
        />
      )}

      {showTaskCardSettings && (
        <TaskCardSettings
          settings={taskCardSettings}
          onSettingsChange={handleTaskCardSettingsChange}
          onClose={() => setShowTaskCardSettings(false)}
        />
      )}
    </div>
  );
}