// components/AICoachChat.tsx
// AI-powered coaching chat with mock responses for StackBlitz demo

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, RefreshCcw, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

interface UserContext {
  name: string;
  habits: {
    name: string;
    progress: number;
    streak: number;
    target: number;
    unit: string;
  }[];
  weeklyStats: {
    goalsCompleted: string;
    streakDays: number;
    aiSessions: number;
    improvement: string;
  };
}

interface AICoachChatProps {
  userContext?: UserContext;
  className?: string;
}

export default function AICoachChat({ userContext, className = "" }: AICoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      message: "Good morning! I noticed you've been consistent with meditation. How are you feeling today?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default user context for demo
  const defaultContext: UserContext = {
    name: "there",
    habits: [
      { name: 'Daily Meditation', progress: 85, streak: 12, target: 15, unit: 'min' },
      { name: 'Morning Exercise', progress: 72, streak: 8, target: 30, unit: 'min' },
      { name: 'Read 30 Minutes', progress: 94, streak: 15, target: 30, unit: 'min' },
      { name: 'Drink 8 Glasses Water', progress: 60, streak: 5, target: 8, unit: 'glasses' }
    ],
    weeklyStats: {
      goalsCompleted: "18/21",
      streakDays: 12,
      aiSessions: 8,
      improvement: "+23%"
    }
  };

  const context = userContext || defaultContext;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mock AI responses based on user input
  const generateMockResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const completedHabits = context.habits.filter(h => h.progress >= 100);
    const strugglingHabits = context.habits.filter(h => h.progress < 50);
    const topStreak = Math.max(...context.habits.map(h => h.streak));

    // Contextual responses based on user habits
    if (message.includes('motivated') || message.includes('motivation')) {
      return `I see you've maintained a ${topStreak}-day streak - that's incredible! When motivation dips, remember that ${completedHabits.length > 0 ? completedHabits[0].name : 'your habits'} are already on autopilot. What's one small thing you can do right now to feel accomplished?`;
    }
    
    if (message.includes('struggling') || message.includes('difficult') || message.includes('hard')) {
      const focusHabit = strugglingHabits.length > 0 ? strugglingHabits[0].name : 'your routines';
      return `I understand ${focusHabit} feels challenging right now. Your ${context.weeklyStats.streakDays}-day streak shows you have the resilience! Let's break it down - what's the smallest possible step you could take with ${focusHabit} today?`;
    }
    
    if (message.includes('focus') || message.includes('today') || message.includes('priority')) {
      const needsAttention = strugglingHabits.length > 0 ? strugglingHabits[0] : null;
      if (needsAttention) {
        return `Looking at your progress, I'd suggest focusing on ${needsAttention.name} today. You're at ${needsAttention.progress}% - just a little push could make a big difference! What's preventing you from hitting your ${needsAttention.target} ${needsAttention.unit} target?`;
      }
      return `You're doing amazingly well! Your consistency with ${completedHabits[0]?.name || 'your habits'} is inspiring. Today, maybe celebrate your progress and plan how to maintain this momentum through the weekend?`;
    }
    
    if (message.includes('celebrate') || message.includes('progress') || message.includes('good') || message.includes('great')) {
      return `Yes! Let's celebrate! 🎉 Your ${context.weeklyStats.improvement} improvement this week is fantastic. You've completed ${context.weeklyStats.goalsCompleted} goals - that's the kind of consistency that creates lasting transformation. What victory feels biggest to you right now?`;
    }

    if (message.includes('water') || message.includes('hydration')) {
      const waterHabit = context.habits.find(h => h.name.toLowerCase().includes('water'));
      if (waterHabit) {
        return `I notice you're at ${waterHabit.progress}% with water intake. Hydration affects everything - energy, focus, even mood! Try setting phone reminders every 2 hours. What's your biggest barrier to drinking more water?`;
      }
    }

    if (message.includes('meditation') || message.includes('mindfulness')) {
      const meditationHabit = context.habits.find(h => h.name.toLowerCase().includes('meditation'));
      if (meditationHabit) {
        return `Your ${meditationHabit.streak}-day meditation streak is impressive! Mindfulness is the foundation of transformation. How has your mental clarity changed since starting? Consider adding 2-3 minutes to feel the deepening benefits.`;
      }
    }

    if (message.includes('exercise') || message.includes('workout') || message.includes('fitness')) {
      const exerciseHabit = context.habits.find(h => h.name.toLowerCase().includes('exercise'));
      if (exerciseHabit) {
        return `Movement is medicine! Your ${exerciseHabit.progress}% completion rate shows commitment. ${exerciseHabit.streak > 5 ? "That streak is building serious momentum!" : "Every workout is an investment in your future self."} What type of movement feels most energizing for you?`;
      }
    }

    // Generic encouraging responses
    const genericResponses = [
      `Your ${topStreak}-day streak proves you're capable of amazing consistency! What habit feels like it's becoming effortless now?`,
      `I love seeing your ${context.weeklyStats.improvement} improvement! You're proving that small daily actions create massive results. What's feeling different in your life?`,
      `You're ${context.weeklyStats.goalsCompleted} goals completed this week - that's transformation in action! Which habit is surprising you most with how natural it's becoming?`,
      `The data shows you're building real momentum. Your future self will thank you for today's consistency. What would you like to explore or improve next?`
    ];

    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: currentMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Simulate API delay for realism
    setTimeout(() => {
      const aiResponse = generateMockResponse(userMessage.message);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'ai',
        message: "Hi! I'm your AI transformation coach. I can see your habit data and I'm here to help you build habits and replace self-doubt with self-belief. How can I support you today?",
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Coach</h2>
            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-semibold">DEMO</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Reconnecting...'}
              </span>
            </div>
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* User Context Summary */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">AI Coach has access to your data:</div>
          <div className="text-xs text-blue-700">
            {context.habits.length} habits tracked, {context.weeklyStats.streakDays} day streak, {context.weeklyStats.improvement} improvement
          </div>
        </div>

        {/* Messages Container */}
        <div className="space-y-4 mb-6 h-80 overflow-y-auto border border-gray-100 rounded-lg p-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'ai' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {msg.type === 'ai' ? (
                    <Bot className="h-4 w-4 text-blue-600" />
                  ) : (
                    <User className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`p-4 rounded-lg ${
                    msg.type === 'ai' 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'bg-purple-50 text-purple-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-xs">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-900">Analyzing your progress...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          {/* Input Bar */}
          <div className="flex space-x-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your AI coach..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !currentMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Quick coaching prompts */}
          <div className="flex flex-wrap gap-2">
            {[
              "How can I stay motivated?",
              "I'm struggling with consistency",
              "What should I focus on today?",
              "Celebrate my progress!"
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => setCurrentMessage(prompt)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}