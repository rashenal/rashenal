import React, { useState, useCallback, useRef } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Paperclip,
  Users,
  Target,
  RotateCcw,
  X,
  Save
} from 'lucide-react';

// Types
interface WorkItem {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  subStatus?: 'DRAFT' | 'READY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  owner?: string;
  predecessors: string[];
  dependents: string[];
  parentId?: string;
  childIds: string[];
  estimatedEffortHours?: number;
  estimatedEnergy?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  actualEffortHours?: number;
  actualEnergy?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  aiSuggestedEffort?: number;
  aiSuggestedEnergy?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  aiInsights?: string;
  attachments: string[];
  comments: Comment[];
  valueStatement?: string;
  resources?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  order: number;
}

interface Comment {
  id: string;
  text: string;
  commenter: string;
  createdAt: Date;
}

const KanbanBoard: React.FC = () => {
  // Sample data
  const [workItems, setWorkItems] = useState<WorkItem[]>([
    {
      id: 'item-1',
      title: 'Design AI Coaching Dashboard',
      description: 'Create wireframes and mockups for the main AI coaching interface with user personas and journey mapping.',
      projectId: 'Rashenal.com',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      owner: 'Design Team',
      predecessors: ['item-2'],
      dependents: [],
      parentId: 'item-1',
      childIds: ['item-1'],
      estimatedEffortHours: 16,
      estimatedEnergy: 'L',
      aiInsights: 'Consider using progressive disclosure for complex features. Focus on emotional engagement in the UI.',
      attachments: ['wireframes.fig', 'personas.pdf'],
      comments: [
        {
          id: 'comment-1',
          text: 'Initial wireframes completed, moving to high-fidelity mockups',
          commenter: 'Sarah Designer',
          createdAt: new Date('2025-01-15')
        }
      ],
      valueStatement: 'Enable users to have intuitive interactions with AI coaching, reducing learning curve and increasing engagement.',
      resources: 'Figma Pro subscription, user research data, competitor analysis',
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-15'),
      order: 0
    },
    {
      id: 'item-2',
      title: 'User Research for AI Preferences',
      description: 'Conduct interviews and surveys to understand user preferences for AI coaching interaction styles.',
      projectId: 'Rashenal.com',
      status: 'DONE',
      priority: 'HIGH',
      owner: 'Research Team',
      predecessors: [],
      dependents: ['item-1'],
      parentId: 'item-2',
      childIds: ['item-2'],
      estimatedEffortHours: 24,
      estimatedEnergy: 'XL',
      actualEffortHours: 28,
      actualEnergy: 'XL',
      aiInsights: 'Research shows users prefer empathetic AI responses over purely analytical ones.',
      attachments: ['research-report.pdf', 'interview-transcripts.doc'],
      comments: [],
      valueStatement: 'Understand user needs to build more effective AI coaching experiences.',
      resources: 'Survey platform, interview participants, analysis tools',
      createdAt: new Date('2025-01-05'),
      updatedAt: new Date('2025-01-12'),
      order: 0
    },
    {
      id: 'item-3',
      title: 'ElevenLabs Voice Integration',
      description: 'Integrate ElevenLabs API for voice-cloned AI coaching partners.',
      projectId: 'Rashenal.com',
      status: 'BACKLOG',
      subStatus: 'READY',
      priority: 'MEDIUM',
      owner: 'Dev Team',
      predecessors: [],
      dependents: [],
      parentId: 'item-3',
      childIds: ['item-3'],
      estimatedEffortHours: 32,
      estimatedEnergy: 'XL',
      aiSuggestedEffort: 28,
      aiSuggestedEnergy: 'L',
      aiInsights: 'Break this into smaller tasks: API setup, voice model training, real-time synthesis.',
      attachments: [],
      comments: [],
      valueStatement: 'Provide personalized voice interactions that feel natural and supportive.',
      resources: 'ElevenLabs API key, voice samples, development environment',
      createdAt: new Date('2025-01-08'),
      updatedAt: new Date('2025-01-08'),
      order: 0
    }
  ]);

  const [recycledItems, setRecycledItems] = useState<WorkItem[]>([]);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState<WorkItem | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<WorkItem>>({});

  const columns = [
    { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-100' },
    { id: 'TODO', title: 'To Do', color: 'bg-blue-100' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-100' },
    { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-100' },
    { id: 'DONE', title: 'Done', color: 'bg-green-100' }
  ];

  // Utility functions
  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getItemsByStatus = (status: string) => {
    return workItems
      .filter(item => item.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const canMoveToStatus = (item: WorkItem, targetStatus: string): { canMove: boolean; reason?: string } => {
    const statusOrder = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
    const currentIndex = statusOrder.indexOf(item.status);
    const targetIndex = statusOrder.indexOf(targetStatus);

    // Check if adjacent
    if (Math.abs(currentIndex - targetIndex) !== 1) {
      return { canMove: false, reason: 'Items can only move to adjacent columns' };
    }

    // Check if moving to TODO requires READY status
    if (targetStatus === 'TODO' && item.subStatus !== 'READY') {
      return { canMove: false, reason: 'Items must be READY to move to TODO' };
    }

    // Check dependencies for IN_PROGRESS
    if (targetStatus === 'IN_PROGRESS') {
      const blockedDependencies = item.predecessors.filter(depId => {
        const dependency = workItems.find(w => w.id === depId);
        return dependency && dependency.status !== 'DONE';
      });

      if (blockedDependencies.length > 0) {
        return { canMove: false, reason: 'Cannot start work. Dependencies not complete.' };
      }
    }

    return { canMove: true };
  };

  // CRUD operations
  const createWorkItem = (data: Partial<WorkItem>) => {
    const newItem: WorkItem = {
      id: generateId(),
      title: data.title || '',
      description: data.description || '',
      projectId: 'Rashenal.com',
      status: 'BACKLOG',
      subStatus: 'DRAFT',
      priority: data.priority || 'MEDIUM',
      owner: data.owner || '',
      predecessors: data.predecessors || [],
      dependents: data.dependents || [],
      parentId: data.parentId || '',
      childIds: data.childIds || [],
      estimatedEffortHours: data.estimatedEffortHours,
      estimatedEnergy: data.estimatedEnergy,
      aiInsights: data.aiInsights,
      attachments: data.attachments || [],
      comments: data.comments || [],
      valueStatement: data.valueStatement,
      resources: data.resources,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: getItemsByStatus('BACKLOG').length
    };

    setWorkItems(prev => [...prev, newItem]);
    setShowNewItemForm(false);
    setFormData({});
  };

  const updateWorkItem = (id: string, updates: Partial<WorkItem>) => {
    setWorkItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date() }
        : item
    ));
    setEditingItem(null);
    setFormData({});
  };

  const deleteWorkItem = (id: string) => {
    const item = workItems.find(w => w.id === id);
    if (item) {
      setRecycledItems(prev => [...prev, { ...item, deletedAt: new Date() }]);
      setWorkItems(prev => prev.filter(w => w.id !== id));
    }
  };

  const restoreWorkItem = (id: string) => {
    const item = recycledItems.find(w => w.id === id);
    if (item) {
      const restoredItem = { ...item };
      delete restoredItem.deletedAt;
      setWorkItems(prev => [...prev, restoredItem]);
      setRecycledItems(prev => prev.filter(w => w.id !== id));
    }
  };

  const moveWorkItem = (id: string, newStatus: string, completionData?: any) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === id) {
        const updates: Partial<WorkItem> = {
          status: newStatus as any,
          updatedAt: new Date()
        };

        if (completionData) {
          updates.actualEffortHours = completionData.actualEffortHours;
          updates.actualEnergy = completionData.actualEnergy;
        }

        return { ...item, ...updates };
      }
      return item;
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const item = workItems.find(w => w.id === draggedItem);
    if (!item) return;

    const moveCheck = canMoveToStatus(item, targetStatus);
    if (!moveCheck.canMove) {
      alert(moveCheck.reason);
      setDraggedItem(null);
      return;
    }

    if (targetStatus === 'DONE') {
      setShowCompletionDialog(item);
    } else {
      moveWorkItem(draggedItem, targetStatus);
    }

    setDraggedItem(null);
  };

  // Form state for completion dialog
  const [completionData, setCompletionData] = useState({
    actualEffortHours: 0,
    actualEnergy: '' as any
  });

  // Form handlers
  const handleFormSubmit = () => {
    if (!formData.title || !formData.description) {
      alert('Title and description are required');
      return;
    }

    if (editingItem) {
      updateWorkItem(editingItem.id, formData);
    } else {
      createWorkItem(formData);
    }
  };

  const handleCompletionSubmit = () => {
    if (!showCompletionDialog || !completionData.actualEffortHours || !completionData.actualEnergy) {
      alert('Please fill in all required fields');
      return;
    }

    moveWorkItem(showCompletionDialog.id, 'DONE', completionData);
    setShowCompletionDialog(null);
    setCompletionData({ actualEffortHours: 0, actualEnergy: '' });
  };

  const startEdit = (item: WorkItem) => {
    setEditingItem(item);
    setFormData(item);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEnergyIcon = (energy?: string) => {
    const icons = { XS: '⚡', S: '⚡⚡', M: '⚡⚡⚡', L: '⚡⚡⚡⚡', XL: '⚡⚡⚡⚡⚡' };
    return icons[energy as keyof typeof icons] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Rashenal.com Project Board
              </h1>
              <p className="text-gray-600 mt-2">AI-Powered Coaching Platform Development</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRecycleBin(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Recycle Bin ({recycledItems.length})</span>
              </button>
              <button
                onClick={() => setShowNewItemForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Work Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-5 gap-6">
          {columns.map(column => (
            <div
              key={column.id}
              className={`${column.color} rounded-xl p-4 min-h-96`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">{column.title}</h2>
                <span className="bg-white px-2 py-1 rounded-full text-sm text-gray-600">
                  {getItemsByStatus(column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {getItemsByStatus(column.id).map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDoubleClick={() => startEdit(item)}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">{item.title}</h3>
                      <div className="flex space-x-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <button
                          onClick={() => deleteWorkItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-xs mb-3 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.description}
                    </p>

                    {item.subStatus && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                        item.subStatus === 'READY' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.subStatus}
                      </span>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {item.estimatedEffortHours && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.estimatedEffortHours}h</span>
                          </span>
                        )}
                        {item.estimatedEnergy && (
                          <span title={`Energy: ${item.estimatedEnergy}`}>
                            {getEnergyIcon(item.estimatedEnergy)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {item.predecessors.length > 0 && (
                          <span className="flex items-center space-x-1" title="Dependencies">
                            <AlertCircle className="w-3 h-3" />
                            <span>{item.predecessors.length}</span>
                          </span>
                        )}
                        {item.comments.length > 0 && (
                          <span className="flex items-center space-x-1" title="Comments">
                            <MessageSquare className="w-3 h-3" />
                            <span>{item.comments.length}</span>
                          </span>
                        )}
                        {item.attachments.length > 0 && (
                          <span className="flex items-center space-x-1" title="Attachments">
                            <Paperclip className="w-3 h-3" />
                            <span>{item.attachments.length}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {item.owner && (
                      <div className="mt-2 flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{item.owner}</span>
                      </div>
                    )}

                    {item.aiInsights && (
                      <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                        🤖 AI: {item.aiInsights.slice(0, 60)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* New/Edit Work Item Modal */}
        {(showNewItemForm || editingItem) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingItem ? 'Edit Work Item' : 'Create New Work Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowNewItemForm(false);
                    setEditingItem(null);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority || 'MEDIUM'}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                    <input
                      type="text"
                      value={formData.owner || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimatedEffortHours || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedEffortHours: Number(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Energy Level</label>
                    <select
                      value={formData.estimatedEnergy || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedEnergy: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="XS">XS - Very Low</option>
                      <option value="S">S - Low</option>
                      <option value="M">M - Medium</option>
                      <option value="L">L - High</option>
                      <option value="XL">XL - Very High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value Statement</label>
                  <textarea
                    value={formData.valueStatement || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, valueStatement: e.target.value }))}
                    placeholder="What will you be able to do after completing this? What's the cost of not completing it?"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resources Needed</label>
                  <textarea
                    value={formData.resources || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, resources: e.target.value }))}
                    placeholder="Raw materials, subscriptions, access to people, documentation, etc."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowNewItemForm(false);
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Dialog */}
        {showCompletionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Complete Work Item</h2>
              <p className="text-gray-600 mb-4">
                Record actual effort for: <strong>{showCompletionDialog.title}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Hours *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={completionData.actualEffortHours}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, actualEffortHours: Number(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Energy *</label>
                  <select
                    value={completionData.actualEnergy}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, actualEnergy: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="XS">XS - Very Low</option>
                    <option value="S">S - Low</option>
                    <option value="M">M - Medium</option>
                    <option value="L">L - High</option>
                    <option value="XL">XL - Very High</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCompletionDialog(null);
                      setCompletionData({ actualEffortHours: 0, actualEnergy: '' });
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompletionSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    Mark Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recycle Bin */}
        {showRecycleBin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recycle Bin</h2>
                <button
                  onClick={() => setShowRecycleBin(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {recycledItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No deleted items</p>
              ) : (
                <div className="space-y-3">
                  {recycledItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500">
                          Deleted: {item.deletedAt?.toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreWorkItem(item.id)}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;