// components/AICoachChat.tsx
// AI-powered coaching chat with Claude integration and accessibility focus

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader, RefreshCcw, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { aiService } from '../lib/AIService';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface UserContext {
  name: string;
  habits: any[];
  goals: any[];
  weeklyStats: any;
  recentCompletions: any[];
  preferences?: any;
}

interface AICoachChatProps {
  className?: string;
}

export default function AICoachChat({ className = '' }: AICoachChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial data when user is available
  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input after loading
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const initializeChat = async () => {
    try {
      await loadUserContext();
      await loadChatHistory();
      
      // Add welcome message if no chat history
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-1',
          type: 'ai',
          message: 'Hi! I\'m your AI transformation coach. I can see your progress and I\'m here to help you replace self-doubt with self-belief. How are you feeling about your journey today?',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Unable to load your coaching data. Please try again.');
    }
  };

  const loadUserContext = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Load user's active habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Load user's active goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed');

      // Get recent completions for context
      const { data: completions } = await supabase
        .from('habit_completions')
        .select(`
          *,
          habits!inner(name, target_value, target_unit)
        `)
        .eq('user_id', user.id)
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('completed_at', { ascending: false });

      // Get user preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Calculate basic stats
      const context: UserContext = {
        name: profile?.full_name || user.email?.split('@')[0] || 'there',
        habits: habits || [],
        goals: goals || [],
        recentCompletions: completions || [],
        preferences: preferences || { ai_coaching_style: 'encouraging' },
        weeklyStats: {
          totalHabits: habits?.length || 0,
          completedGoals: goals?.filter(g => g.progress >= 100).length || 0,
          totalGoals: goals?.length || 0,
          recentActivity: completions?.length || 0
        }
      };

      setUserContext(context);
    } catch (error) {
      console.error('Error loading user context:', error);
      throw error;
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const { data: chatHistory } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20); // Last 20 messages

      if (chatHistory && chatHistory.length > 0) {
        const formattedMessages: ChatMessage[] = chatHistory.map(msg => ({
          id: msg.id,
          type: msg.sender,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          status: 'sent'
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Don't throw - chat can work without history
    }
  };

  const sendMessage = useCallback(async () => {
    if (!currentMessage.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: currentMessage.trim(),
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Update message status to sent
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));

      // Call optimized AI service
      const response = await aiService.invokeChat(
        userMessage.message,
        userContext,
        {
          priority: 'medium',
          category: 'routine',
          max_response_time_ms: 10000
        }
      );

      const data = response.data;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: data.message,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update user context if returned
      if (data.context) {
        setUserContext(data.context);
      }

      setIsOnline(true);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Connection issue. Your coach is temporarily unavailable.');
      setIsOnline(false);
      
      // Update message status to error
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
      ));

      // Provide helpful fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: 'I\'m having trouble connecting right now, but I\'m still here to support you! While I reconnect, remember that consistency beats perfection. What habit would you like to focus on today?',
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentMessage, isLoading, user, userContext]);

  const retryMessage = async (messageId: string) => {
    const messageToRetry = messages.find(msg => msg.id === messageId);
    if (!messageToRetry) return;

    setCurrentMessage(messageToRetry.message);
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
  }, []);

  const clearChat = async () => {
    if (!user) return;

    try {
      await supabase
        .from('ai_chat_messages')
        .delete()
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }

    setMessages([
      {
        id: 'new-start',
        type: 'ai',
        message: 'Fresh start! I\'m here to support your transformation journey. What would you like to focus on today?',
        timestamp: new Date(),
        status: 'sent'
      }
    ]);
    setError(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Accessibility-focused quick prompts for neurodiverse users
  const quickPrompts = [
    { text: 'How can I stay motivated?', category: 'motivation' },
    { text: 'I\'m struggling with consistency', category: 'challenge' },
    { text: 'What should I focus on today?', category: 'planning' },
    { text: 'Celebrate my progress!', category: 'celebration' }
  ];

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className={`bg-primary rounded-2xl shadow-lg p-6 text-center theme-transition ${className}`}>
        <Bot className="h-12 w-12 text-tertiary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">AI Transformation Coach</h3>
        <p className="text-secondary mb-4">
          Your personal coach that understands your habits and goals. 
          Sign in to start your coaching conversation.
        </p>
        <button 
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label="Sign in to start AI coaching"
        >
          Sign In to Start Coaching
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-primary rounded-2xl shadow-lg overflow-hidden theme-transition ${className}`}>
      <div className="p-6">
        {/* Header with clear status indicators */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-primary">AI Transformation Coach</h2>
            </div>
            {userContext && (
              <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 theme-transition">
                <CheckCircle className="h-3 w-3" />
                <span>Connected to Your Data</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection status with clear visual feedback */}
            <div className="flex items-center space-x-2" aria-live="polite">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isOnline ? 'Online' : 'Reconnecting...'}
              </span>
            </div>
            
            <button
              onClick={clearChat}
              className="p-2 text-tertiary hover:text-secondary hover:bg-tertiary rounded-lg transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              title="Clear chat history"
              aria-label="Clear chat history"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error banner with clear messaging */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2 theme-transition" role="alert">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">Connection Issue</p>
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* User Context Summary - Clear data transparency */}
        {userContext && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg theme-transition">
            <div className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
              🤖 Your coach can see:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
              <div>📊 {userContext.habits.length} habits tracked</div>
              <div>🎯 {userContext.goals.length} active goals</div>
              <div>✅ {userContext.recentCompletions.length} recent completions</div>
              <div>🔥 Personal coaching style: {userContext.preferences?.ai_coaching_style || 'encouraging'}</div>
            </div>
          </div>
        )}

        {/* Messages Container with improved accessibility */}
        <div 
          className="space-y-4 mb-6 h-80 overflow-y-auto border border-primary rounded-lg p-4 bg-secondary focus-within:ring-2 focus-within:ring-purple-500 theme-transition"
          role="log"
          aria-label="Chat conversation"
          aria-live="polite"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-sm lg:max-w-md ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar with clear visual identity */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'ai' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                } theme-transition`}>
                  {msg.type === 'ai' ? (
                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  ) : (
                    <User className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  )}
                </div>
                
                <div className="flex-1">
                  {/* Message bubble with status indicators */}
                  <div className={`p-4 rounded-lg theme-transition ${
                    msg.type === 'ai' 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-100 dark:border-blue-800' 
                      : 'bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border border-purple-100 dark:border-purple-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">
                      {msg.message}
                    </p>
                    
                    {/* Message status indicators */}
                    {msg.status === 'error' && (
                      <div className="mt-2 flex items-center space-x-2">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <button
                          onClick={() => retryMessage(msg.id)}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Retry message
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <p className="text-xs text-tertiary mt-1 px-1">
                    <span className="sr-only">
                      Message from {msg.type === 'ai' ? 'AI coach' : 'you'} at{' '}
                    </span>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator with clear messaging */}
          {isLoading && (
            <div className="flex justify-start" aria-live="assertive">
              <div className="flex items-start space-x-3 max-w-xs">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center theme-transition">
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800 theme-transition">
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" aria-hidden="true" />
                    <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                      Your coach is analyzing your progress...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section with enhanced accessibility */}
        <div className="space-y-4">
          {/* Input Bar */}
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <label htmlFor="coach-message" className="sr-only">
                Type your message to the AI coach
              </label>
              <input
                id="coach-message"
                ref={inputRef}
                type="text"
                value={currentMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask your AI coach anything..."
                className="w-full px-4 py-3 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm theme-transition"
                disabled={isLoading}
                aria-describedby="message-help"
                maxLength={500}
              />
              <div id="message-help" className="sr-only">
                Type your message and press Enter to send, or use the quick prompts below
              </div>
            </div>
            
            <button
              onClick={sendMessage}
              disabled={isLoading || !currentMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              aria-label={isLoading ? 'Sending message' : 'Send message'}
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{isLoading ? 'Sending...' : 'Send'}</span>
            </button>
          </div>

          {/* Quick coaching prompts with clear categorization */}
          <div className="space-y-2">
            <p className="text-xs text-secondary font-medium">Quick coaching topics:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMessage(prompt.text)}
                  className="px-3 py-2 text-sm bg-tertiary text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900 theme-transition"
                  disabled={isLoading}
                  aria-label={`Quick prompt: ${prompt.text}`}
                >
                  <span className="block font-medium">{prompt.text}</span>
                  <span className="text-xs text-tertiary capitalize">{prompt.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Character count for accessibility */}
          <div className="text-xs text-tertiary text-right">
            {currentMessage.length}/500 characters
          </div>
        </div>
      </div>
    </div>
  );
}