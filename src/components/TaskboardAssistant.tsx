import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Loader, 
  MessageSquare, 
  X,
  Lightbulb,
  CheckCircle2,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface TaskboardAssistantProps {
  tasks: any[];
  onTaskAction?: (action: string, taskId?: string) => void;
}

export default function TaskboardAssistant({ tasks, onTaskAction }: TaskboardAssistantProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: '👋 Hello! I\'m your Taskboard Assistant. I can help you organize tasks, suggest priorities, estimate time, and optimize your workflow. What would you like to work on?',
      timestamp: new Date(),
      suggestions: [
        'Analyze my current tasks',
        'Suggest task priorities', 
        'Help me break down a large task',
        'Optimize my workflow'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateTaskAnalysis = () => {
    const totalTasks = tasks.length;
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date()
    ).length;

    return {
      totalTasks,
      statusCounts,
      priorityCounts,
      overdueTasks,
      recommendations: generateRecommendations(statusCounts, priorityCounts, overdueTasks)
    };
  };

  const generateRecommendations = (statusCounts: any, priorityCounts: any, overdueTasks: number) => {
    const recommendations = [];

    if (overdueTasks > 0) {
      recommendations.push(`You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Consider reviewing and updating deadlines or prioritizing completion.`);
    }

    if (statusCounts['IN_PROGRESS'] > 3) {
      recommendations.push('You have many tasks in progress. Consider focusing on completing some before starting new ones.');
    }

    if (priorityCounts['HIGH'] > 5) {
      recommendations.push('You have many high-priority tasks. Consider if all are truly urgent or if some can be reprioritized.');
    }

    if (statusCounts['BACKLOG'] > 10) {
      recommendations.push('Your backlog is growing. Consider breaking down large tasks or archiving items that are no longer relevant.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your task organization looks good! Keep up the great work with staying organized.');
    }

    return recommendations;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response - in production, this would call Claude API
      const response = await generateAssistantResponse(inputMessage.trim(), tasks);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I\'m sorry, I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAssistantResponse = async (message: string, tasks: any[]) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analyze') || lowerMessage.includes('current tasks')) {
      const analysis = generateTaskAnalysis();
      return {
        content: `📊 **Task Analysis:**\n\n• Total tasks: ${analysis.totalTasks}\n• Status breakdown: ${Object.entries(analysis.statusCounts).map(([status, count]) => `${status}: ${count}`).join(', ')}\n• Priority breakdown: ${Object.entries(analysis.priorityCounts).map(([priority, count]) => `${priority}: ${count}`).join(', ')}\n\n**Recommendations:**\n${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}`,
        suggestions: ['Help me prioritize', 'Suggest task breakdown', 'Time estimation help']
      };
    }

    if (lowerMessage.includes('priorities') || lowerMessage.includes('prioritize')) {
      return {
        content: '🎯 **Priority Suggestions:**\n\n1. **Focus on overdue items first** - Complete any overdue tasks to get back on track\n2. **High-priority + Due soon** - Tackle high-priority tasks with approaching deadlines\n3. **Quick wins** - Complete small tasks to build momentum\n4. **Block out focus time** - Dedicate uninterrupted time for complex tasks\n\nWould you like me to suggest specific tasks to focus on based on your current workload?',
        suggestions: ['Show me top 3 priorities', 'Help with time blocking', 'Break down complex tasks']
      };
    }

    if (lowerMessage.includes('break down') || lowerMessage.includes('large task')) {
      return {
        content: '🔨 **Task Breakdown Strategy:**\n\n1. **Identify the main outcome** - What does "done" look like?\n2. **List all major steps** - What are the key milestones?\n3. **Break steps into actions** - Make each item actionable (starts with a verb)\n4. **Estimate time** - Assign realistic time estimates\n5. **Set dependencies** - Order tasks by what needs to happen first\n\nTell me about a specific task you\'d like to break down, and I\'ll help you create actionable sub-tasks!',
        suggestions: ['I have a specific task to break down', 'Help with time estimation', 'Show me examples']
      };
    }

    if (lowerMessage.includes('workflow') || lowerMessage.includes('optimize')) {
      return {
        content: '⚡ **Workflow Optimization Tips:**\n\n• **Batch similar tasks** - Group similar activities together\n• **Use time blocking** - Dedicate specific times for different types of work\n• **Limit WIP** - Try to keep "In Progress" items to 3 or fewer\n• **Review regularly** - Weekly review to adjust priorities and clean up\n• **Automate recurring tasks** - Look for patterns that can be templated\n\nBased on your current tasks, I can suggest specific optimizations. What area would you like to focus on?',
        suggestions: ['Analyze my workflow patterns', 'Suggest time blocks', 'Help with recurring tasks']
      };
    }

    if (lowerMessage.includes('time') || lowerMessage.includes('estimate')) {
      return {
        content: '⏱️ **Time Estimation Tips:**\n\n• **Use the "3-point estimation"**: Best case + Worst case + Most likely, divided by 3\n• **Add buffer time**: Multiply estimates by 1.5 for realistic planning\n• **Track actual time**: Learn from experience to improve future estimates\n• **Break down large tasks**: Easier to estimate smaller pieces\n\nFor your current tasks, I\'d recommend starting with rough estimates and refining as you work. Would you like help estimating specific tasks?',
        suggestions: ['Help estimate my tasks', 'Show estimation techniques', 'Track time spent']
      };
    }

    // Default response
    return {
      content: 'I\'m here to help you manage your tasks more effectively! I can assist with:\n\n• 📊 Analyzing your current task load\n• 🎯 Suggesting task priorities\n• 🔨 Breaking down complex tasks\n• ⚡ Optimizing your workflow\n• ⏱️ Time estimation and planning\n\nWhat would you like to work on? Just ask me anything about task management!',
      suggestions: ['Analyze my current tasks', 'Help me prioritize', 'Optimize my workflow', 'Break down a large task']
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 flex items-center gap-2"
          aria-label="Open Taskboard Assistant"
        >
          <Bot size={24} />
          <span className="hidden sm:inline">Taskboard Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl border w-96 h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <h3 className="font-semibold">Taskboard Assistant</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-blue-200 transition-colors"
            aria-label="Close assistant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                
                {message.suggestions && (
                  <div className="mt-3 space-y-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left p-2 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                      >
                        💡 {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader className="animate-spin" size={16} />
                  <span className="text-sm">Assistant is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your tasks..."
              className="flex-1 resize-none p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}