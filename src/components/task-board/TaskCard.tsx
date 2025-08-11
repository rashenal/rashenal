import React, { useState } from 'react';
import {
  Clock,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  User,
  Target,
  Zap,
  Brain,
  Star,
  Heart,
  DollarSign,
  TrendingUp,
  Flame,
  ArrowRight,
  MoreVertical,
  Play,
  Pause,
  Eye
} from 'lucide-react';
import { Task, ENERGY_LEVELS, PRIORITY_LEVELS } from '../../types/TaskBoard';
import { TaskCardDisplaySettings } from './TaskCardSettings';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  showAIInsights?: boolean;
  compact?: boolean;
  displaySettings?: TaskCardDisplaySettings;
}

export default function TaskCard({ 
  task, 
  onClick, 
  onDragStart, 
  onDragEnd, 
  showAIInsights = true,
  compact = false,
  displaySettings
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart();
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  const priorityConfig = PRIORITY_LEVELS[task.priority];
  const energyConfig = ENERGY_LEVELS[task.energy_level];
  
  const completedSubtasks = task.sub_tasks.filter(st => st.is_completed).length;
  const totalSubtasks = task.sub_tasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIndicator = () => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[task.priority];
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-600' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: 'text-blue-600' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-600' };
    }
  };

  const dueDateInfo = formatDueDate(task.due_date);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
      className={`group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${
        isDragging ? 'opacity-50 rotate-2 scale-95' : 'hover:scale-[1.02]'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Priority Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${getPriorityIndicator()}`} />
      
      {/* Quick Actions */}
      {showQuickActions && !compact && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Start timer
            }}
            className="p-1 bg-white/80 backdrop-blur-sm rounded-md text-green-600 hover:bg-green-100 transition-colors shadow-sm"
            title="Start timer"
          >
            <Play className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Quick view
            }}
            className="p-1 bg-white/80 backdrop-blur-sm rounded-md text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
            title="Quick view"
          >
            <Eye className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: More actions
            }}
            className="p-1 bg-white/80 backdrop-blur-sm rounded-md text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
            title="More actions"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Task Status Badge */}
      {task.status !== 'not_started' && (
        <div className={`absolute -top-1 -right-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-3">
        {/* Title and Description */}
        <div>
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'} leading-tight`}>
            {task.title}
          </h3>
          {!compact && task.description && displaySettings?.showDescription !== false && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && displaySettings?.showProgress !== false && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Subtasks</span>
              <span className="text-gray-700 font-medium">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Value Indicators */}
        {!compact && (
          (task.business_value > 0 && displaySettings?.showBusinessValue !== false) || 
          (task.personal_value > 0 && displaySettings?.showPersonalValue !== false)
        ) && (
          <div className="flex space-x-3">
            {task.business_value > 0 && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <div className="flex space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-3 rounded-full ${
                        i < Math.round(task.business_value / 20) ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {task.personal_value > 0 && (
              <div className="flex items-center space-x-1">
                <Heart className="h-3 w-3 text-pink-600" />
                <div className="flex space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-3 rounded-full ${
                        i < Math.round(task.personal_value / 20) ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {/* Energy Level */}
            <span className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
              <span>{energyConfig.icon}</span>
              {!compact && <span>{energyConfig.name}</span>}
            </span>

            {/* Estimated Duration */}
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{task.estimated_duration}m</span>
            </span>

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <span className="flex items-center space-x-1">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments.length}</span>
              </span>
            )}

            {/* Comments */}
            {task.comments.length > 0 && (
              <span className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.comments.length}</span>
              </span>
            )}
          </div>

          {/* Priority Indicator */}
          <div className={`text-xs px-2 py-1 rounded-full border ${
            task.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' :
            task.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
            'bg-green-100 text-green-700 border-green-200'
          }`}>
            {priorityConfig.icon} {!compact && priorityConfig.name}
          </div>
        </div>

        {/* Due Date */}
        {dueDateInfo && (
          <div className={`flex items-center space-x-1 text-xs ${dueDateInfo.color}`}>
            <Calendar className="h-3 w-3" />
            <span>{dueDateInfo.text}</span>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, compact ? 2 : 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > (compact ? 2 : 3) && (
              <span className="text-xs text-gray-500">+{task.tags.length - (compact ? 2 : 3)}</span>
            )}
          </div>
        )}

        {/* AI Insights */}
        {showAIInsights && !compact && task.ai_insights.completion_probability > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-xs">
                <Brain className="h-3 w-3 text-purple-600" />
                <span className="text-purple-700 font-medium">
                  {task.ai_insights.completion_probability}% likely to complete
                </span>
              </div>
              {task.ai_estimated_completion && (
                <div className="text-xs text-purple-600">
                  Est: {new Date(task.ai_estimated_completion.date).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {task.ai_insights.optimization_suggestions.length > 0 && (
              <div className="mt-2 text-xs text-purple-600">
                💡 {task.ai_insights.optimization_suggestions[0]}
              </div>
            )}
          </div>
        )}

        {/* Goal Connections */}
        {task.goal_connections.length > 0 && (
          <div className="flex items-center space-x-1 text-xs">
            <Target className="h-3 w-3 text-indigo-500" />
            <span className="text-indigo-600">Connected to {task.goal_connections.length} goal(s)</span>
          </div>
        )}

        {/* Dependencies */}
        {task.dependencies.length > 0 && (
          <div className="flex items-center space-x-1 text-xs">
            <ArrowRight className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Depends on {task.dependencies.length} task(s)</span>
          </div>
        )}
      </div>

      {/* Hover Effects */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-200 pointer-events-none" />
      
      {/* Completion Celebration */}
      {task.status === 'completed' && (
        <div className="absolute inset-0 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        </div>
      )}
    </div>
  );
}