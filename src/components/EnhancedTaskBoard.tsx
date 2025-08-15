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
  Move3D,
  MessageSquare,
  History,
  GripVertical,
  FolderOpen,
  ChevronRight,
  User,
  CheckSquare,
  Send,
  X
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useUser } from '../contexts/userContext';
import { TaskBoard, Task, TaskColumn, BoardView, TaskFilters, ENERGY_LEVELS, PRIORITY_LEVELS } from '../types/TaskBoard';
import { BOARD_TEMPLATES } from '../data/boardTemplates';
import { EnhancedTaskService, type EnhancedTaskUI } from '../lib/enhanced-task-service';
import { validateTasks } from '../utils/dataValidation';
import { ErrorBoundary } from './ErrorBoundary';
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

interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface TaskAuditEntry {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  action: string;
  field_changed?: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

interface SubTask {
  id: string;
  parent_task_id: string;
  title: string;
  description?: string;
  completed: boolean;
  position: number;
  created_at: string;
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
  
  // Enhanced features state
  const [projects, setProjects] = useState<Project[]>([
    { id: 'personal', name: 'Personal', color: 'blue', description: 'Personal tasks and goals' },
    { id: 'work', name: 'Work', color: 'green', description: 'Professional tasks and projects' },
    { id: 'health', name: 'Health & Fitness', color: 'red', description: 'Health, fitness, and wellness' },
    { id: 'learning', name: 'Learning', color: 'purple', description: 'Educational and skill development' }
  ]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [taskComments, setTaskComments] = useState<Map<string, TaskComment[]>>(new Map());
  const [taskAuditHistory, setTaskAuditHistory] = useState<Map<string, TaskAuditEntry[]>>(new Map());
  const [taskSubTasks, setTaskSubTasks] = useState<Map<string, SubTask[]>>(new Map());
  const [showCommentsPanel, setShowCommentsPanel] = useState<string | null>(null);
  const [showAuditPanel, setShowAuditPanel] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newSubTask, setNewSubTask] = useState('');

  // Load tasks from database and create a virtual board
  useEffect(() => {
    if (!user) {
      // Show demo content when user is not authenticated
      createDemoBoard();
      return;
    }
    
    const loadTasksFromDatabase = async () => {
      try {
        setIsLoading(true);
        const result = await EnhancedTaskService.getUserTasks();
        
        if (result.error) {
          console.error('Error loading tasks:', result.error);
          createWelcomeBoard(); // Fallback to welcome board
          return;
        }

        // Convert database tasks to TaskBoard format with validation
        const dbTasks = result.data || [];
        const convertedTasks: Task[] = validateTasks(dbTasks.map(dbTask => ({
          id: dbTask.id,
          task_number: (dbTask as any).task_number,
          board_id: 'main-board',
          column_id: dbTask.status || 'backlog',
          user_id: dbTask.user_id,
          title: dbTask.title,
          description: dbTask.description,
          priority: dbTask.priority,
          energy_level: dbTask.energy_level,
          business_value: dbTask.business_value,
          personal_value: dbTask.personal_value,
          estimated_duration: dbTask.estimated_time,
          due_date: dbTask.due_date,
          position: dbTask.position,
          tags: dbTask.tags,
          parent_id: (dbTask as any).parent_id,
          has_children: (dbTask as any).has_children,
          dependency_status: (dbTask as any).dependency_status,
          status: dbTask.status,
          created_at: dbTask.createdAt.toISOString(),
          updated_at: dbTask.updatedAt.toISOString()
        })));

        // Create a virtual board with database tasks
        const virtualBoard: TaskBoard = {
          id: 'main-board',
          user_id: user.id,
          name: '🚀 Your Tasks',
          description: 'Enhanced task management with projects, comments, and drag & drop',
          color_scheme: 'gradient-to-r from-blue-500 to-purple-600',
          is_archived: false,
          is_favorite: true,
          progress_percentage: 0,
          columns: [
            { id: 'backlog', board_id: 'main-board', name: '📋 Backlog', color: 'gray', position: 0, is_completion_column: false },
            { id: 'todo', board_id: 'main-board', name: '📝 To Do', color: 'blue', position: 1, is_completion_column: false },
            { id: 'in_progress', board_id: 'main-board', name: '⚡ In Progress', color: 'orange', position: 2, is_completion_column: false },
            { id: 'done', board_id: 'main-board', name: '✅ Done', color: 'green', position: 3, is_completion_column: true }
          ],
          tasks: convertedTasks,
          goals_connected: [],
          ai_insights: {
            productivity_score: 80,
            bottlenecks: [],
            progress_prediction: {
              estimated_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              confidence_level: 75,
              key_risks: []
            },
            optimization_suggestions: [],
            workload_analysis: {
              current_capacity_usage: 70,
              energy_distribution: { medium: 80, high: 20 },
              peak_productivity_times: ['morning'],
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

        setBoards([virtualBoard]);
        setCurrentBoard(virtualBoard);
      } catch (error) {
        console.error('Error loading tasks from database:', error);
        createWelcomeBoard(); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadTasksFromDatabase();
  }, [user, boardId]);

  const createDemoBoard = useCallback(() => {
    const demoBoard: TaskBoard = {
      id: 'demo-board',
      user_id: 'demo-user',
      name: '🚀 Enhanced TaskBoard Demo',
      description: 'Experience all features: drag & drop, projects, comments, and more!',
      color_scheme: 'gradient-to-r from-blue-500 to-purple-600',
      is_archived: false,
      is_favorite: true,
      progress_percentage: 25,
      columns: [
        { id: 'backlog', board_id: 'demo-board', name: '📋 Backlog', color: 'gray', position: 0, is_completion_column: false },
        { id: 'todo', board_id: 'demo-board', name: '📝 To Do', color: 'blue', position: 1, is_completion_column: false },
        { id: 'in_progress', board_id: 'demo-board', name: '⚡ In Progress', color: 'orange', position: 2, is_completion_column: false },
        { id: 'done', board_id: 'demo-board', name: '✅ Done', color: 'green', position: 3, is_completion_column: true }
      ],
      tasks: [
        {
          id: 'demo-task-1',
          task_number: 1,
          board_id: 'demo-board',
          column_id: 'backlog',
          user_id: 'demo-user',
          title: 'Design new landing page',
          description: 'Create wireframes and mockups for the new product landing page with improved conversion rates',
          priority: 'high',
          energy_level: 'medium',
          business_value: 85,
          personal_value: 70,
          estimated_duration: 240,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          position: 0,
          tags: ['design', 'marketing', 'high-impact', 'work'],
          parent_id: null,
          has_children: false,
          dependency_status: 'none',
          status: 'backlog',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-task-2',
          task_number: 2,
          board_id: 'demo-board',
          column_id: 'todo',
          user_id: 'demo-user',
          title: 'Implement user authentication',
          description: 'Set up secure login/logout functionality with password reset and 2FA support',
          priority: 'urgent',
          energy_level: 'high',
          business_value: 95,
          personal_value: 80,
          estimated_duration: 480,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          position: 0,
          tags: ['security', 'backend', 'authentication', 'work'],
          parent_id: null,
          has_children: true,
          dependency_status: 'blocked',
          status: 'todo',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-task-3',
          task_number: 3,
          board_id: 'demo-board',
          column_id: 'in_progress',
          user_id: 'demo-user',
          title: 'Write API documentation',
          description: 'Create comprehensive API docs with examples, authentication details, and integration guides',
          priority: 'medium',
          energy_level: 'low',
          business_value: 60,
          personal_value: 40,
          estimated_duration: 180,
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          position: 0,
          tags: ['documentation', 'api', 'developer-experience', 'learning'],
          parent_id: null,
          has_children: false,
          dependency_status: 'ready',
          status: 'in_progress',
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-task-4',
          task_number: 4,
          board_id: 'demo-board',
          column_id: 'done',
          user_id: 'demo-user',
          title: 'Set up CI/CD pipeline',
          description: 'Configure automated testing, building, and deployment pipeline with proper staging environments',
          priority: 'medium',
          energy_level: 'medium',
          business_value: 75,
          personal_value: 85,
          estimated_duration: 360,
          due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          position: 0,
          tags: ['devops', 'automation', 'infrastructure', 'personal'],
          parent_id: null,
          has_children: false,
          dependency_status: 'ready',
          status: 'done',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      goals_connected: [],
      ai_insights: {
        productivity_score: 78,
        bottlenecks: ['Authentication blocking other features'],
        progress_prediction: {
          estimated_completion_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          confidence_level: 82,
          key_risks: ['Scope creep on authentication features']
        },
        optimization_suggestions: ['Consider breaking down authentication task', 'Prioritize landing page for marketing campaign'],
        workload_analysis: {
          current_capacity_usage: 75,
          energy_distribution: { low: 30, medium: 50, high: 20 },
          peak_productivity_times: ['morning', 'late-afternoon'],
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
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    setBoards([demoBoard]);
    setCurrentBoard(demoBoard);
    setIsLoading(false);
  }, []);

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
        { id: 'getting-started', board_id: 'welcome', name: '🌟 Getting Started', color: 'blue', position: 0, is_completion_column: false },
        { id: 'in-progress', board_id: 'welcome', name: '⚡ In Progress', color: 'orange', position: 1, is_completion_column: false },
        { id: 'completed', board_id: 'welcome', name: '✨ Completed', color: 'green', position: 2, is_completion_column: true }
      ],
      tasks: [],
      goals_connected: [],
      ai_insights: {
        productivity_score: 0,
        bottlenecks: [],
        progress_prediction: {
          estimated_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          confidence_level: 85,
          key_risks: []
        },
        optimization_suggestions: [],
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

  // Enhanced drag and drop handler
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination || !currentBoard) return;

    const { source, destination, draggableId } = result;
    
    // Moving within the same column (reordering)
    if (source.droppableId === destination.droppableId) {
      const columnTasks = filteredTasks
        .filter(task => task.column_id === source.droppableId)
        .sort((a, b) => a.position - b.position);
      
      const [removed] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, removed);
      
      // Update positions
      const updatedTasks = columnTasks.map((task, index) => ({
        ...task,
        position: index,
        updated_at: new Date().toISOString()
      }));
      
      // Update board
      const updatedBoard = {
        ...currentBoard,
        tasks: currentBoard.tasks.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        }),
        updated_at: new Date().toISOString()
      };
      
      setCurrentBoard(updatedBoard);
      setBoards(prev => prev.map(board => 
        board.id === updatedBoard.id ? updatedBoard : board
      ));
      
      // Log audit entry
      logAuditEntry(draggableId, 'reordered', 'position', source.index, destination.index);
    }
    // Moving between columns
    else {
      const updatedTask = currentBoard.tasks.find(task => task.id === draggableId);
      if (!updatedTask) return;
      
      const newTask = {
        ...updatedTask,
        column_id: destination.droppableId,
        position: destination.index,
        updated_at: new Date().toISOString()
      };
      
      handleTaskUpdate(newTask);
      logAuditEntry(draggableId, 'moved', 'column', source.droppableId, destination.droppableId);
    }
  }, [currentBoard]);

  // Comments and audit functionality
  const logAuditEntry = useCallback((taskId: string, action: string, field?: string, oldValue?: any, newValue?: any) => {
    // Skip audit logging for demo mode when user is null
    if (!user) return;
    
    const auditEntry: TaskAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      task_id: taskId,
      user_id: user.id,
      user_name: user.email || 'User',
      action,
      field_changed: field,
      old_value: oldValue,
      new_value: newValue,
      created_at: new Date().toISOString()
    };
    
    setTaskAuditHistory(prev => {
      const currentHistory = prev.get(taskId) || [];
      const newHistory = [auditEntry, ...currentHistory];
      const newMap = new Map(prev);
      newMap.set(taskId, newHistory);
      return newMap;
    });
  }, [user]);
  
  const addComment = useCallback((taskId: string) => {
    if (!newComment.trim()) return;
    
    // For demo mode, create a dummy user when user is null
    const userName = user?.email || 'Demo User';
    
    const comment: TaskComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      task_id: taskId,
      user_id: user?.id || 'demo-user',
      user_name: userName,
      content: newComment.trim(),
      created_at: new Date().toISOString()
    };
    
    setTaskComments(prev => {
      const currentComments = prev.get(taskId) || [];
      const newComments = [...currentComments, comment];
      const newMap = new Map(prev);
      newMap.set(taskId, newComments);
      return newMap;
    });
    
    setNewComment('');
    logAuditEntry(taskId, 'comment_added');
  }, [newComment, user, logAuditEntry]);
  
  const addSubTask = useCallback((taskId: string) => {
    if (!newSubTask.trim()) return;
    
    const subTask: SubTask = {
      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parent_task_id: taskId,
      title: newSubTask.trim(),
      completed: false,
      position: (taskSubTasks.get(taskId) || []).length,
      created_at: new Date().toISOString()
    };
    
    setTaskSubTasks(prev => {
      const currentSubTasks = prev.get(taskId) || [];
      const newSubTasks = [...currentSubTasks, subTask];
      const newMap = new Map(prev);
      newMap.set(taskId, newSubTasks);
      return newMap;
    });
    
    setNewSubTask('');
    logAuditEntry(taskId, 'subtask_added');
  }, [newSubTask, taskSubTasks, logAuditEntry]);
  
  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    setTaskSubTasks(prev => {
      const currentSubTasks = prev.get(taskId) || [];
      const updatedSubTasks = currentSubTasks.map(st => 
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      );
      const newMap = new Map(prev);
      newMap.set(taskId, updatedSubTasks);
      return newMap;
    });
    
    logAuditEntry(taskId, 'subtask_toggled');
  }, [logAuditEntry]);

  // Filter and sort tasks with project filtering
  const filteredTasks = useMemo(() => {
    if (!currentBoard) return [];
    
    let tasks = [...currentBoard.tasks];
    
    // Apply project filter using tags
    if (selectedProject) {
      tasks = tasks.filter(task => task.tags.includes(selectedProject));
    }
    
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
  }, [currentBoard, searchQuery, view.filters, view.sort, selectedProject]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading enhanced task boards...</p>
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
            Start your productivity journey with our enhanced task management system.
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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

            {/* Project Filter */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
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

              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Kanban Board View with Drag & Drop */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {currentBoard.columns.map(column => {
              const columnTasks = filteredTasks
                .filter(task => task.column_id === column.id)
                .sort((a, b) => a.position - b.position);
              
              return (
                <div key={column.id} className="flex-shrink-0 w-80">
                  {/* Column Header */}
                  <div className="bg-white rounded-t-xl border-l-4 border-l-blue-500 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                        {column.name}
                      </h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Droppable Column */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-gray-50 min-h-96 p-2 space-y-3 rounded-b-xl transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
                        }`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`transition-transform ${
                                  snapshot.isDragging ? 'rotate-3 scale-105 shadow-lg' : ''
                                }`}
                              >
                                <div className="relative group">
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
                                  >
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                  
                                  {/* Enhanced Task Card */}
                                  <div
                                    className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer ml-6"
                                    onClick={() => handleTaskClick(task)}
                                  >
                                    <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                                    {task.description && (
                                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                                    )}
                                    
                                    {/* Task metadata */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full ${
                                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                          task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {task.priority}
                                        </span>
                                        <span className="flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {task.estimated_duration}m
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center space-x-1">
                                        {/* Quick actions */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCommentsPanel(showCommentsPanel === task.id ? null : task.id);
                                          }}
                                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                                          title="Comments"
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                        </button>
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAuditPanel(showAuditPanel === task.id ? null : task.id);
                                          }}
                                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                                          title="History"
                                        >
                                          <History className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Add Task Button */}
                        <button
                          onClick={() => setShowCreateTask(true)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Plus className="h-4 w-4 mx-auto mb-1" />
                          <span className="text-sm">Add task</span>
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
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
    </main>
  );
}