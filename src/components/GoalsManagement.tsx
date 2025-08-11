// Goals Management - AI-powered goal setting and tracking system
// Designed for empowered neurodiverse female leadership development

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Star,
  Edit,
  Trash2,
  Bot,
  User,
  Send
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { aiService } from '../lib/AIService';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'professional' | 'health' | 'financial' | 'relationships' | 'learning';
  target_date: string | null;
  progress: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  ai_insights?: string[];
  milestones: Milestone[];
  user_id: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  due_date?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  goal_id?: string;
}

export default function GoalsManagement() {
  const { user } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'insights'>('overview');

  // Load goals when component mounts
  useEffect(() => {
    loadGoals();
    initializeGoalsChat();
  }, [user]);

  const loadGoals = () => {
    // Mock goals data for Elizabeth Harvey - demonstrating the concept
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: 'Complete Leadership Development Program',
        description: 'Enhance executive leadership skills through structured learning and coaching',
        category: 'professional',
        target_date: '2025-12-31',
        progress: 35,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-08-09T00:00:00Z',
        ai_insights: [
          'Consider breaking this into monthly learning modules',
          'Your communication style suggests you\'d benefit from peer mentorship',
          'Track specific leadership metrics weekly'
        ],
        milestones: [
          { id: '1a', title: 'Complete Module 1: Self-Assessment', completed: true, completed_at: '2025-01-15T00:00:00Z' },
          { id: '1b', title: 'Complete Module 2: Communication Skills', completed: true, completed_at: '2025-02-28T00:00:00Z' },
          { id: '1c', title: 'Complete Module 3: Team Leadership', completed: false, due_date: '2025-09-30T00:00:00Z' },
          { id: '1d', title: 'Final Capstone Project', completed: false, due_date: '2025-11-30T00:00:00Z' }
        ],
        user_id: user?.id || ''
      },
      {
        id: '2',
        title: 'Establish Daily Wellness Routine',
        description: 'Create sustainable health habits honoring Mom\'s memory',
        category: 'health',
        target_date: '2025-09-30',
        progress: 65,
        status: 'active',
        created_at: '2025-07-01T00:00:00Z',
        updated_at: '2025-08-09T00:00:00Z',
        ai_insights: [
          'Your consistency has improved 40% this month',
          'Morning meditation shows strongest correlation with daily success',
          'Consider adding gentle movement on low-energy days'
        ],
        milestones: [
          { id: '2a', title: 'Morning meditation practice', completed: true },
          { id: '2b', title: 'Daily health tracking', completed: true },
          { id: '2c', title: 'Weekly meal prep routine', completed: false },
          { id: '2d', title: 'Evening reflection practice', completed: false }
        ],
        user_id: user?.id || ''
      },
      {
        id: '3',
        title: 'Build Rashenal Platform MVP',
        description: 'Create AI-powered personal transformation platform',
        category: 'professional',
        target_date: '2025-10-15',
        progress: 80,
        status: 'active',
        created_at: '2025-06-01T00:00:00Z',
        updated_at: '2025-08-09T00:00:00Z',
        ai_insights: [
          'Token optimization system implementation shows excellent progress',
          'User experience testing should begin soon',
          'Consider beta user recruitment strategy'
        ],
        milestones: [
          { id: '3a', title: 'Core architecture complete', completed: true },
          { id: '3b', title: 'AI optimization system', completed: true },
          { id: '3c', title: 'User testing & feedback', completed: false },
          { id: '3d', title: 'Production deployment', completed: false }
        ],
        user_id: user?.id || ''
      }
    ];

    setGoals(mockGoals);
  };

  const initializeGoalsChat = () => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      message: `Hello Elizabeth! I'm your Goals AI Coach. I'm here to help you achieve your aspirations with strategies tailored to your leadership style and neurodivergent strengths. 

I notice you have some inspiring goals set up. Would you like to:
• Review your current progress
• Set a new goal together
• Break down a goal into actionable steps
• Discuss any challenges you're facing

What would you like to focus on today?`,
      timestamp: new Date()
    };

    setChatMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoadingAI) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      message: currentMessage.trim(),
      timestamp: new Date(),
      goal_id: selectedGoal?.id
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoadingAI(true);

    try {
      // Prepare context for the AI coach
      const context = {
        user_name: 'Elizabeth',
        current_goals: goals.map(g => ({
          title: g.title,
          progress: g.progress,
          status: g.status,
          category: g.category
        })),
        selected_goal: selectedGoal ? {
          title: selectedGoal.title,
          description: selectedGoal.description,
          progress: selectedGoal.progress,
          milestones: selectedGoal.milestones
        } : null,
        coaching_style: 'empowering, direct, supportive of neurodivergent strengths'
      };

      const response = await aiService.invokeChat(
        userMessage.message,
        context,
        {
          operation: 'goals_coaching',
          priority: 'high',
          category: 'critical'
        }
      );

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        message: response.data?.message || response.message || 'I apologize, but I encountered an issue. Let me help you with your goals in another way.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Check if AI suggested any goal updates
      await analyzeMessageForGoalUpdates(userMessage.message, aiMessage.message);

    } catch (error) {
      console.error('Error sending message to Goals AI Coach:', error);
      
      const errorMessage: ChatMessage = {
        id: `ai_error_${Date.now()}`,
        type: 'ai',
        message: 'I apologize, but I\'m having trouble connecting right now. However, I can still help you structure your goals and provide guidance. What specific aspect of your goals would you like to work on?',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const analyzeMessageForGoalUpdates = async (userMessage: string, aiResponse: string) => {
    // Simple analysis to detect goal-related actions
    const lowerUserMsg = userMessage.toLowerCase();
    const lowerAiMsg = aiResponse.toLowerCase();

    // If user mentioned completing something or making progress
    if (lowerUserMsg.includes('completed') || lowerUserMsg.includes('finished') || 
        lowerUserMsg.includes('done') || lowerAiMsg.includes('congratulations')) {
      
      // This would trigger goal progress updates in a real implementation
      console.log('Goal progress detected - would update goals here');
    }

    // If AI suggested a new milestone or sub-goal
    if (lowerAiMsg.includes('milestone') || lowerAiMsg.includes('step') || 
        lowerAiMsg.includes('action')) {
      
      console.log('New milestone suggested - would create milestone here');
    }
  };

  const createNewGoal = () => {
    setIsCreating(true);
    setSelectedGoal({
      id: `new_${Date.now()}`,
      title: '',
      description: '',
      category: 'personal',
      target_date: null,
      progress: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      milestones: [],
      user_id: user?.id || ''
    });
    setActiveTab('chat');
    
    // Add a message to help create the goal
    const helpMessage: ChatMessage = {
      id: `ai_create_${Date.now()}`,
      type: 'ai',
      message: `Let's create a meaningful goal together, Elizabeth! 

Tell me about something you'd like to achieve. It could be:
• A professional milestone or skill you want to develop
• A personal growth area you want to focus on
• A health or wellness goal
• Something that honors your values and aspirations

What's been on your mind lately that you'd like to work toward?`,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, helpMessage]);
  };

  const GoalCard = ({ goal }: { goal: Goal }) => (
    <div 
      className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
        selectedGoal?.id === goal.id 
          ? 'border-purple-500 bg-purple-50' 
          : 'border-gray-200 bg-white hover:border-purple-300'
      }`}
      onClick={() => setSelectedGoal(goal)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{goal.title}</h3>
          <p className="text-gray-600 text-sm">{goal.description}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            goal.category === 'professional' ? 'bg-blue-100 text-blue-800' :
            goal.category === 'health' ? 'bg-green-100 text-green-800' :
            goal.category === 'personal' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {goal.category}
          </span>
          {goal.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">{goal.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'No deadline'}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
          </span>
        </div>
      </div>

      {goal.ai_insights && goal.ai_insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 mb-1">Latest AI Insight:</p>
              <p className="text-sm text-gray-700">{goal.ai_insights[0]}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const MilestonesList = ({ goal }: { goal: Goal }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Milestones</h4>
      {goal.milestones.map((milestone) => (
        <div key={milestone.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0 mt-1">
            {milestone.completed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <h5 className={`font-medium ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {milestone.title}
            </h5>
            {milestone.description && (
              <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
            )}
            {milestone.due_date && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Due: {new Date(milestone.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const ChatInterface = () => (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
        {chatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && <Bot className="h-4 w-4 mt-1 text-purple-600 flex-shrink-0" />}
                {message.type === 'user' && <User className="h-4 w-4 mt-1 text-purple-100 flex-shrink-0" />}
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>
          </div>
        ))}
        {isLoadingAI && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask about your goals, share progress, or get coaching..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoadingAI}
          />
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoadingAI}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals Management</h1>
          <p className="text-gray-600 mt-2">AI-powered goal setting and achievement for empowered leadership</p>
        </div>
        <button
          onClick={createNewGoal}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Goals</h2>
          {goals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-600 mb-4">Let's create your first goal together with AI coaching</p>
              <button
                onClick={createNewGoal}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>

        {/* Goal Details & AI Coach */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 p-1">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'chat', label: 'AI Coach', icon: MessageSquare },
                { id: 'insights', label: 'Insights', icon: Lightbulb }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {activeTab === 'overview' && selectedGoal && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedGoal.title}</h3>
                  <p className="text-gray-600">{selectedGoal.description}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{selectedGoal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedGoal.progress}%` }}
                      />
                    </div>
                  </div>

                  <MilestonesList goal={selectedGoal} />
                </div>
              </div>
            )}

            {activeTab === 'chat' && <ChatInterface />}

            {activeTab === 'insights' && selectedGoal && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                {selectedGoal.ai_insights && selectedGoal.ai_insights.length > 0 ? (
                  <div className="space-y-3">
                    {selectedGoal.ai_insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No insights available yet. Chat with your AI coach to get personalized recommendations!</p>
                )}
              </div>
            )}

            {!selectedGoal && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Goal</h3>
                <p className="text-gray-600">Choose a goal from the list to see details and get AI coaching</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}