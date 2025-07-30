// components/TaskCard.tsx
// Compact task card component for better board visibility

import React from 'react';
import { 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Zap,
  Link
} from 'lucide-react';
import type { TaskUI } from '../lib/database-types';

interface TaskCardProps {
  task: TaskUI;
  onEdit: (task: TaskUI) => void;
  onDelete: (taskId: string) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDoubleClick?: (task: TaskUI) => void; // Added for task editor
}

export default function TaskCard({ task, onEdit, onDelete, onDragStart, onDoubleClick }: TaskCardProps) {
  // Priority colors (more subtle for compact view)
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-400';
      case 'high': return 'border-l-orange-400';
      case 'medium': return 'border-l-yellow-400';
      case 'low': return 'border-l-green-400';
      default: return 'border-l-gray-400';
    }
  };

  // Status colors for the small status indicator
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': 
      case 'completed': 
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'blocked': 
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: 
        return null;
    }
  };

  // Format time estimate compactly
  const formatTimeEstimate = (hours: number | null) => {
    if (!hours) return null;
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours}h`;
  };

  // Check if task is overdue
  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'done' && task.status !== 'completed';

  // Check if task has dependencies
  const hasDependencies = task.predecessor_task_ids?.length > 0 || task.successor_task_ids?.length > 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDoubleClick={() => onDoubleClick?.(task)}
      className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${getPriorityColor(task.priority)} border-r border-t border-b border-gray-200 cursor-move hover:shadow-md transition-all duration-200 group min-h-[80px] max-h-[120px]`}
    >
      {/* Header with title and quick actions */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2 line-clamp-2">
          {task.title}
        </h4>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit task"
          >
            <Edit3 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Compact metadata row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {/* Status icon */}
          {getStatusIcon(task.status)}
          
          {/* Time estimate */}
          {task.estimated_time && (
            <div className="flex items-center space-x-1 text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{formatTimeEstimate(task.estimated_time)}</span>
            </div>
          )}

          {/* AI suggested indicator */}
          {task.ai_suggested && (
            <Zap className="h-3 w-3 text-purple-500" title="AI Suggested" />
          )}

          {/* Dependencies indicator */}
          {hasDependencies && (
            <Link className="h-3 w-3 text-blue-500" title="Has Dependencies" />
          )}
        </div>

        {/* Due date - only show if soon or overdue */}
        {task.dueDate && (
          <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
            <Calendar className="h-3 w-3" />
            <span>
              {isOverdue ? 'Overdue' : 
               task.dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? 
               'Due soon' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Tags - show max 2 */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag.length > 8 ? tag.substring(0, 8) + '...' : tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Sub-task indicator */}
      {task.parent_task_id && (
        <div className="mt-1 text-xs text-gray-400">
          ↳ Sub-task
        </div>
      )}
    </div>
  );
}