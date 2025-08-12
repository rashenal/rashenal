import React, { useState, useEffect } from 'react';
import {
  X,
  Link,
  Unlink,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';
import { Task } from '../../types/TaskBoard';
import { EnhancedTaskService } from '../../lib/enhanced-task-service';

interface TaskDependenciesModalProps {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
}

export default function TaskDependenciesModal({
  task,
  allTasks,
  onClose,
  onTaskUpdated
}: TaskDependenciesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [childTasks, setChildTasks] = useState<any[]>([]);
  const [availableParentTasks, setAvailableParentTasks] = useState<Task[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  useEffect(() => {
    loadDependencies();
    loadAvailableParents();
  }, [task.id]);

  const loadDependencies = async () => {
    setIsLoading(true);
    
    try {
      // Load parent task
      if (task.parent_id && task.parent_id !== task.id) {
        const parent = allTasks.find(t => t.id === task.parent_id);
        setParentTask(parent || null);
      } else {
        setParentTask(null);
      }

      // Load child tasks
      const { data: children, error } = await EnhancedTaskService.getTaskChildren(task.id);
      if (!error) {
        setChildTasks(children || []);
      }
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableParents = () => {
    // Filter tasks that can be parents (exclude self and current children)
    const childIds = new Set(childTasks.map(c => c.id));
    const available = allTasks.filter(t => 
      t.id !== task.id && // Not self
      !childIds.has(t.id) && // Not a child
      t.parent_id !== task.id // Not already a child
    );
    setAvailableParentTasks(available);
  };

  const handleSetParent = async () => {
    if (!selectedParentId || isLoading) return;

    setIsLoading(true);
    
    try {
      const { error } = await EnhancedTaskService.setTaskDependency(task.id, selectedParentId);
      
      if (!error) {
        const updatedTask = {
          ...task,
          parent_id: selectedParentId,
          dependency_status: 'blocked'
        };
        onTaskUpdated(updatedTask);
        loadDependencies();
      }
    } catch (error) {
      console.error('Error setting parent:', error);
    } finally {
      setIsLoading(false);
      setSelectedParentId('');
    }
  };

  const handleRemoveParent = async () => {
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      const { error } = await EnhancedTaskService.removeDependency(task.id);
      
      if (!error) {
        const updatedTask = {
          ...task,
          parent_id: task.id,
          dependency_status: 'independent'
        };
        onTaskUpdated(updatedTask);
        loadDependencies();
      }
    } catch (error) {
      console.error('Error removing parent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDependencyStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'ready':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'independent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDependencyStatusColor = (status: string) => {
    switch (status) {
      case 'blocked':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'ready':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'independent':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Link className="h-5 w-5 text-blue-600" />
                Task Dependencies
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {task.task_number && `${task.task_number}: `}{task.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          
          {/* Current Status */}
          <div className={`p-4 rounded-lg border ${getDependencyStatusColor(task.dependency_status || 'independent')}`}>
            <div className="flex items-center gap-2 mb-2">
              {getDependencyStatusIcon(task.dependency_status || 'independent')}
              <span className="font-medium">
                Current Status: {task.dependency_status || 'independent'}
              </span>
            </div>
            <p className="text-sm opacity-75">
              {task.dependency_status === 'blocked' && 'This task is waiting for its parent task to be completed.'}
              {task.dependency_status === 'ready' && 'This task is ready to start - parent task is completed.'}
              {task.dependency_status === 'independent' && 'This task has no dependencies and can be started anytime.'}
            </p>
          </div>

          {/* Parent Task */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Depends On (Parent Task)
            </h3>
            
            {parentTask ? (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {parentTask.task_number && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {parentTask.task_number}
                        </span>
                      )}
                      <span className="font-medium">{parentTask.title}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parentTask.status === 'done' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {parentTask.status}
                      </span>
                    </div>
                    {parentTask.description && (
                      <p className="text-sm text-gray-600 mt-1">{parentTask.description}</p>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveParent}
                    disabled={isLoading}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove dependency"
                  >
                    <Unlink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                <p className="text-gray-500 text-center mb-3">This task has no parent dependency</p>
                
                {availableParentTasks.length > 0 && (
                  <div className="flex gap-2">
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select a parent task...</option>
                      {availableParentTasks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.task_number ? `${t.task_number}: ` : ''}{t.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSetParent}
                      disabled={!selectedParentId || isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Child Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Dependent Tasks ({childTasks.length})
            </h3>
            
            {childTasks.length > 0 ? (
              <div className="space-y-2">
                {childTasks.map((child) => (
                  <div key={child.id} className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3">
                    {getDependencyStatusIcon(child.dependency_status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {child.task_number && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {child.task_number}
                          </span>
                        )}
                        <span className="font-medium">{child.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          child.status === 'done' 
                            ? 'bg-green-100 text-green-800'
                            : child.dependency_status === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {child.dependency_status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No tasks depend on this one</p>
                <p className="text-sm text-gray-400 mt-1">
                  Other tasks can be set to depend on this task from their dependency settings
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Tip:</span> Complete parent tasks to unblock dependent tasks
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}