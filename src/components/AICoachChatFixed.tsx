import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Loader, AlertCircle, Target, TrendingUp, Heart, Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { useAIChat } from '../hooks/useAIChat';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface QuickPrompt {
  text: string;
  category: 'motivation' | 'habits' | 'goals' | 'reflection';
}

const quickPrompts: QuickPrompt[] = [
  { text: "What should I focus on today?", category: 'goals' },
  { text: "Help me build a new habit", category: 'habits' },
  { text: "I need motivation", category: 'motivation' },
  { text: "Review my progress", category: 'reflection' },
];

interface UserContext {
  name: string;
  habits: any[];
  goals: any[];
  recentCompletions: any[];
  preferences: any;
  weeklyStats: {
    totalHabits: number;
    completedGoals: number;
    totalGoals: number;
    recentActivity: number;
  };
}

export default function AICoachChatFixed() {
  const { user } = useUser();
  const { preferences, updatePreference } = useUserPreferences();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(true);
  
  // Refs for focus management
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFocusTimeRef = useRef<number>(0);
  const shouldRestoreFocusRef = useRef<boolean>(true);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on mount and after sending messages
  useEffect(() => {
    if (preferences.ui.autoFocusInput && inputRef.current && !isLoading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (shouldRestoreFocusRef.current) {
          inputRef.current?.focus();
          lastFocusTimeRef.current = Date.now();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [preferences.ui.autoFocusInput, isLoading]);

  // Restore focus after message send completes
  const restoreFocus = useCallback(() => {
    if (preferences.ui.autoFocusInput && inputRef.current && !isLoading) {
      // Prevent focus fighting by checking time since last focus
      const timeSinceLastFocus = Date.now() - lastFocusTimeRef.current;
      if (timeSinceLastFocus > 200) {
        inputRef.current.focus();
        lastFocusTimeRef.current = Date.now();
      }
    }
  }, [preferences.ui.autoFocusInput, isLoading]);

  // Load user context for personalized responses
  useEffect(() => {
    if (user) {
      loadUserContext();
      loadChatHistory();
    }
  }, [user]);

  const loadUserContext = async () => {
    if (!user) return;

    try {
      setIsContextLoading(true);
      
      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
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

      // Calculate basic stats
      const context: UserContext = {
        name: profile?.full_name || user.email?.split('@')[0] || 'there',
        habits: habits || [],
        goals: goals || [],
        recentCompletions: completions || [],
        preferences: preferences.ai,
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
    } finally {
      setIsContextLoading(false);
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
        .limit(20);

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
    shouldRestoreFocusRef.current = true;

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

      // Save user message to database
      await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        sender: 'user',
        message: userMessage.message,
        created_at: userMessage.timestamp.toISOString()
      });

      // Make API call to AI chat edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: userMessage.message,
          context: userContext,
          coachingStyle: preferences.ai.coachingStyle,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.message
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: data.message,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        sender: 'ai',
        message: aiMessage.message,
        created_at: aiMessage.timestamp.toISOString()
      });

    } catch (err) {
      console.error('Error sending message:', err);
      
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
      ));
      
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      // Restore focus after operation completes
      setTimeout(restoreFocus, 100);
    }
  }, [currentMessage, isLoading, user, userContext, messages, preferences.ai.coachingStyle, restoreFocus]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
    shouldRestoreFocusRef.current = true;
  };

  const handleQuickPromptClick = (prompt: string) => {
    setCurrentMessage(prompt);
    shouldRestoreFocusRef.current = true;
    // Focus input after setting message
    setTimeout(() => {
      inputRef.current?.focus();
      // Move cursor to end of text
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.value.length;
        inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 50);
  };

  const retryMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.type === 'user') {
      setCurrentMessage(message.message);
      // Remove the failed message
      setMessages(prev => prev.filter(m => m.id !== messageId));
      // Send it again
      await sendMessage();
    }
  };

  const handleInputBlur = () => {
    // Track that we might need to restore focus
    shouldRestoreFocusRef.current = true;
  };

  const handleInputFocus = () => {
    lastFocusTimeRef.current = Date.now();
    shouldRestoreFocusRef.current = false;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Please sign in to use the AI Coach
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              AI Coach
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your personal transformation assistant
            </p>
          </div>
        </div>

        {/* Context Loading Indicator */}
        {isContextLoading && (
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <Loader className="h-3 w-3 animate-spin mr-2" />
            Loading your profile...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[400px] max-h-[600px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-lg ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.type === 'ai' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
              }`}>
                {msg.type === 'ai' ? (
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              
              {/* Message Content */}
              <div className="flex-1">
                <div className={`p-3 rounded-lg ${
                  msg.type === 'ai' 
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700' 
                    : 'bg-purple-600 text-white'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  
                  {msg.status === 'error' && (
                    <div className="mt-2 flex items-center space-x-2">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <button
                        onClick={() => retryMessage(msg.id)}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Timestamp */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-xs">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPromptClick(prompt.text)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              {prompt.text}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={currentMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
            maxLength={500}
          />
          
          <button
            onClick={sendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        {/* Character Count */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {currentMessage.length}/500
        </div>
      </div>
    </div>
  );
}