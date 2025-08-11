import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  TrendingUp, 
  Calendar, 
  Target, 
  Zap,
  CheckCircle,
  Circle,
  BarChart3,
  Award,
  Clock,
  Flame,
  Brain,
  Settings,
  Trash2,
  Bot,
  MessageSquare,
  Send,
  User,
  Lightbulb
} from 'lucide-react';
import HabitsSettings, { HabitsSettings as HabitSettingsType, defaultHabitsSettings } from './settings/HabitsSettings';
import { getLocalSettings } from './shared/SettingsModal';
import { useUser } from '../contexts/userContext';
import { useRealStats } from '../hooks/useRealStats';
import { aiService } from '../lib/AIService';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

interface HabitCompletion {
  id: string;
  timestamp: Date;
  note?: string;
}

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  timesPerDay: number; // New: How many times per day this habit should be done
  target: number;
  current: number;
  weekData: boolean[];
  completionsToday: HabitCompletion[]; // New: Track individual completions
  completedDays: { [date: string]: HabitCompletion[] }; // New: Historical completions by date
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
}

export default function AIHabitTracker() {
  const { user } = useUser();
  const { stats, incrementHabitsCompleted } = useRealStats();
  
  const [selectedHabit, setSelectedHabit] = useState('meditation');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHabitChat, setShowHabitChat] = useState(false);
  const [newHabit, setNewHabit] = useState({ 
    name: '', 
    category: 'health', 
    target: 1, 
    timesPerDay: 1, // New: Default to once per day
    icon: '⭐',
    color: 'purple'
  });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [settings, setSettings] = useState<HabitSettingsType>(
    () => getLocalSettings('habits', defaultHabitsSettings)
  );

  // Initialize with sample habits if empty (for demo)
  React.useEffect(() => {
    if (habits.length === 0 && user) {
      const initialHabits: Habit[] = [
        {
          id: 'meditation',
          name: 'Morning Meditation',
          category: 'mindfulness',
          streak: 0,
          timesPerDay: 1, // Once per day
          target: 15,
          current: 0,
          weekData: [false, false, false, false, false, false, false],
          completionsToday: [], // New: Empty completions array
          completedDays: {}, // New: Empty historical completions
          color: 'purple',
          icon: '🧘',
          user_id: user.id,
          created_at: new Date().toISOString()
        }
      ];
      setHabits(initialHabits);
      setSelectedHabit('meditation');
      initializeHabitChat();
    }
  }, [user, habits.length]);

  const initializeHabitChat = () => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      message: `Hello Elizabeth! I'm your Habit Architect - your personal companion for building sustainable, life-changing habits. 

I understand that as a neurodivergent leader, you need habits that work with your unique brain, not against it. Let's create routines that honor your energy patterns and support your growth.

What habit would you like to work on today? I can help you:
• Design micro-habits that stick
• Work through obstacles with compassion
• Celebrate your progress, no matter how small
• Adapt habits to your changing needs

How can I support your habit journey today?`,
      timestamp: new Date()
    };

    setChatMessages([welcomeMessage]);
  };

  const categories = {
    health: { name: 'Health', color: 'green', icon: '🏥' },
    fitness: { name: 'Fitness', color: 'blue', icon: '💪' },
    mindfulness: { name: 'Mindfulness', color: 'purple', icon: '🧘' },
    learning: { name: 'Learning', color: 'yellow', icon: '📚' },
    productivity: { name: 'Productivity', color: 'red', icon: '⚡' }
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentHabit = habits.find(h => h.id === selectedHabit);

  // Habit management functions
  const createHabit = useCallback(() => {
    if (!newHabit.name.trim() || !user) return;

    const habit: Habit = {
      id: `habit_${Date.now()}`,
      name: newHabit.name,
      category: newHabit.category,
      streak: 0,
      timesPerDay: newHabit.timesPerDay,
      target: newHabit.target,
      current: 0,
      weekData: [false, false, false, false, false, false, false],
      completionsToday: [],
      completedDays: {},
      color: newHabit.color,
      icon: newHabit.icon,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    setHabits(prev => [...prev, habit]);
    setSelectedHabit(habit.id);
    setShowAddHabit(false);
    setNewHabit({ name: '', category: 'health', target: 1, timesPerDay: 1, icon: '⭐', color: 'purple' });
    
    // Add chat message about new habit
    const newHabitMessage: ChatMessage = {
      id: `habit_created_${Date.now()}`,
      type: 'ai',
      message: `🎉 Wonderful! I love that you're starting "${habit.name}". This is a powerful step toward your goals.

Let me share some neurodivergent-friendly tips for this habit:
• Start with just 2-3 minutes to build the neural pathway
• Use visual or audio cues that work with your sensory preferences  
• Celebrate every single completion - your brain needs that dopamine!
• Be flexible with timing - consistency matters more than perfect scheduling

Would you like me to help you design the perfect routine around this habit?`,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newHabitMessage]);
    console.log('✅ New habit created:', habit.name);
  }, [newHabit, user]);

  const completeHabit = useCallback((habitId: string) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const now = new Date();
    
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        // Check if we can add another completion today
        if (habit.completionsToday.length >= habit.timesPerDay) {
          return habit; // Already completed max times for today
        }
        
        const newCompletion: HabitCompletion = {
          id: `completion_${Date.now()}`,
          timestamp: now
        };
        
        const updatedCompletionsToday = [...habit.completionsToday, newCompletion];
        const isFullyCompletedToday = updatedCompletionsToday.length === habit.timesPerDay;
        
        // Update historical completions
        const updatedCompletedDays = { ...habit.completedDays };
        if (!updatedCompletedDays[today]) {
          updatedCompletedDays[today] = [];
        }
        updatedCompletedDays[today] = [...updatedCompletedDays[today], newCompletion];
        
        // Update week data for current day
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0 format
        const updatedWeekData = [...habit.weekData];
        if (isFullyCompletedToday) {
          updatedWeekData[mondayIndex] = true;
        }
        
        const updatedHabit = {
          ...habit,
          completionsToday: updatedCompletionsToday,
          completedDays: updatedCompletedDays,
          weekData: updatedWeekData,
          current: Math.min(habit.current + 1, habit.target),
          streak: isFullyCompletedToday ? habit.streak + 1 : habit.streak
        };
        
        // Update real stats
        incrementHabitsCompleted();
        
        return updatedHabit;
      }
      return habit;
    }));
  }, [incrementHabitsCompleted]);

  // Parse AI commands for habit creation
  const parseHabitCommand = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Check if it's a habit creation command
    if (lowerMessage.includes('create habit') || lowerMessage.includes('add habit') || 
        lowerMessage.includes('new habit') || lowerMessage.includes('start habit')) {
      
      // Extract habit details using simple pattern matching
      const nameMatch = message.match(/"([^"]+)"|'([^']+)'|(\b\w+(?:\s+\w+){0,3}\b)(?=\s*(?:habit|routine))/i);
      const timesMatch = message.match(/(\d+)\s*(?:times?|x)\s*(?:per\s*day|daily|a\s*day)/i);
      const categoryMatch = message.match(/(?:category|type)\s*:?\s*(health|fitness|mindfulness|learning|productivity)/i);
      
      if (nameMatch) {
        const habitName = nameMatch[1] || nameMatch[2] || nameMatch[3] || 'New Habit';
        const timesPerDay = timesMatch ? parseInt(timesMatch[1]) : 1;
        const category = categoryMatch ? categoryMatch[1] : 'health';
        
        return {
          action: 'create_habit',
          habitName: habitName.trim(),
          timesPerDay: Math.min(Math.max(timesPerDay, 1), 10), // Clamp between 1-10
          category
        };
      }
    }
    
    return null;
  };
  
  const createHabitFromAI = (habitName: string, timesPerDay: number, category: string) => {
    if (!user) return;
    
    const categoryData = categories[category as keyof typeof categories] || categories.health;
    
    const habit: Habit = {
      id: `ai_habit_${Date.now()}`,
      name: habitName,
      category,
      streak: 0,
      timesPerDay,
      target: 15, // Default target
      current: 0,
      weekData: [false, false, false, false, false, false, false],
      completionsToday: [],
      completedDays: {},
      color: categoryData.color,
      icon: categoryData.icon,
      user_id: user.id,
      created_at: new Date().toISOString()
    };
    
    setHabits(prev => [...prev, habit]);
    setSelectedHabit(habit.id);
    
    return habit;
  };

  const sendMessage = useCallback(async () => {
    if (!currentMessage.trim() || isLoadingAI) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      message: currentMessage.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageCopy = currentMessage.trim();
    setCurrentMessage('');
    setIsLoadingAI(true);

    try {
      // Check if this is a habit creation command
      const habitCommand = parseHabitCommand(messageCopy);
      
      if (habitCommand?.action === 'create_habit') {
        const newHabit = createHabitFromAI(
          habitCommand.habitName,
          habitCommand.timesPerDay,
          habitCommand.category
        );
        
        if (newHabit) {
          const confirmationMessage: ChatMessage = {
            id: `ai_confirm_${Date.now()}`,
            type: 'ai',
            message: `🎉 Perfect! I've created "${newHabit.name}" for you!

Here's what I set up:
• **Frequency**: ${newHabit.timesPerDay}x per day
• **Category**: ${newHabit.category}
• **Icon**: ${newHabit.icon}

This habit is designed to work with your neurodivergent brain:
✨ Start small - even 1-2 minutes counts as a win
✨ Be flexible with timing - consistency matters more than perfection
✨ Celebrate every completion - your brain needs that dopamine boost!

Would you like me to help you set up a routine around this habit or adjust any of the settings?`,
            timestamp: new Date()
          };
          
          setChatMessages(prev => [...prev, confirmationMessage]);
          setIsLoadingAI(false);
          return;
        }
      }
      
      // Regular AI chat
      const context = {
        user_name: 'Elizabeth',
        current_habits: habits.map(h => ({
          name: h.name,
          streak: h.streak,
          completionsToday: h.completionsToday.length,
          timesPerDay: h.timesPerDay,
          category: h.category
        })),
        user_stats: {
          total_habits: stats.habitsActive,
          completed_today: stats.habitsCompleted
        },
        coaching_style: 'empowering, neurodivergent-friendly, compassionate',
        available_commands: [
          'Create habit: "habit name" 3x per day category: fitness',
          'Add habit: morning yoga 2 times daily',
          'New habit: "drink water" 8x per day'
        ]
      };

      const response = await aiService.invokeChat(
        messageCopy,
        context,
        {
          operation: 'habit_coaching',
          priority: 'high',
          category: 'critical'
        }
      );

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        message: response.data?.message || response.message || 'I apologize, but I encountered an issue. Let me help you with your habits in another way.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error chatting with Habit Architect:', error);
      
      const errorMessage: ChatMessage = {
        id: `ai_error_${Date.now()}`,
        type: 'ai',
        message: `I apologize, but I'm having trouble connecting right now. However, I can still help you build amazing habits!

**Voice Commands I understand:**
• "Create habit: meditation 2x per day"
• "Add habit: drink water 8 times daily category: health"
• "New habit: pushups 1x per day"

What specific habit would you like to work on?`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingAI(false);
    }
  }, [currentMessage, isLoadingAI, habits, stats, user]);

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colors = {
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' },
      green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' },
      cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500' },
      yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
      red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' }
    };
    return colors[color as keyof typeof colors]?.[variant] || colors.purple[variant];
  };

  // Get today's completed habits for the completed section
  const getTodaysCompletedHabits = () => {
    const today = new Date().toISOString().split('T')[0];
    const completedHabits: Array<{habit: Habit, completions: HabitCompletion[]}> = [];
    
    habits.forEach(habit => {
      const todaysCompletions = habit.completedDays[today] || [];
      if (todaysCompletions.length > 0) {
        completedHabits.push({ habit, completions: todaysCompletions });
      }
    });
    
    return completedHabits;
  };
  
  // Get remaining instances for a habit today
  const getRemainingInstances = (habit: Habit) => {
    return Math.max(0, habit.timesPerDay - habit.completionsToday.length);
  };
  
  const addHabit = () => {
    if (newHabit.name.trim()) {
      // In a real app, this would add to the habits array
      setShowAddHabit(false);
      setNewHabit({ name: '', category: 'health', target: 1, timesPerDay: 1 });
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Habit Tracker</h1>
            <p className="text-gray-600 mt-2">Build sustainable habits with neurodivergent-friendly coaching</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowHabitChat(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Bot className="h-5 w-5 mr-2" />
              <MessageSquare className="h-4 w-4 mr-2" />
              Habit Coach
            </button>
            <button
              onClick={() => setShowAddHabit(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Habit
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center px-3 py-2 text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Habits List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-6 w-6 text-green-600 mr-2" />
                Your Habits
              </h2>
              
              <div className="space-y-3">
                {habits.map((habit) => {
                  const remainingInstances = getRemainingInstances(habit);
                  const isFullyCompleted = remainingInstances === 0;
                  
                  return (
                    <div key={habit.id}>
                      <div
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedHabit === habit.id 
                            ? `${getColorClasses(habit.color, 'border')} bg-${habit.color}-50` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedHabit(habit.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {settings.showIcon && (
                              <span className="text-2xl">{habit.icon}</span>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                              {settings.showCategory && (
                                <p className="text-sm text-gray-600 capitalize">{habit.category}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 mr-2">
                              {habit.completionsToday.length}/{habit.timesPerDay}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                completeHabit(habit.id);
                              }}
                              disabled={isFullyCompleted}
                              className={`p-1 rounded-full transition-colors ${
                                isFullyCompleted
                                  ? `${getColorClasses(habit.color, 'text')} hover:opacity-80` 
                                  : 'text-gray-400 hover:text-gray-600'
                              } disabled:opacity-50`}
                              title={isFullyCompleted ? 'All instances completed for today!' : `Mark as complete (${remainingInstances} remaining)`}
                            >
                              {isFullyCompleted ? (
                                <CheckCircle className="h-6 w-6" />
                              ) : (
                                <Circle className="h-6 w-6" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Individual instances display */}
                        {habit.timesPerDay > 1 && (
                          <div className="mb-2">
                            <div className="flex space-x-1">
                              {Array.from({ length: habit.timesPerDay }, (_, index) => {
                                const isCompleted = index < habit.completionsToday.length;
                                return (
                                  <button
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isCompleted) {
                                        completeHabit(habit.id);
                                      }
                                    }}
                                    disabled={isCompleted}
                                    className={`w-6 h-6 rounded-full text-xs border-2 transition-colors ${
                                      isCompleted
                                        ? `${getColorClasses(habit.color, 'bg')} ${getColorClasses(habit.color, 'border')} text-white`
                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                    } disabled:opacity-100`}
                                    title={`Instance ${index + 1} ${isCompleted ? '(completed)' : '(pending)'}`}
                                  >
                                    {isCompleted ? '✓' : (index + 1)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {settings.showStreak && (
                              <>
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-semibold text-orange-600">{habit.streak} day streak</span>
                              </>
                            )}
                          </div>
                          {settings.showTarget && (
                            <span className="text-sm text-gray-600">{habit.current}/{habit.target}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Today's Completed Habits */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  Completed Today
                </h3>
                
                <div className="space-y-2">
                  {getTodaysCompletedHabits().length === 0 ? (
                    <p className="text-gray-500 text-sm italic text-center py-4">
                      No habits completed yet today. You've got this! 💪
                    </p>
                  ) : (
                    getTodaysCompletedHabits().map(({ habit, completions }) => (
                      <div key={habit.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{habit.icon}</span>
                          <div>
                            <h4 className="font-medium text-green-900">{habit.name}</h4>
                            <p className="text-sm text-green-700">
                              {completions.length} of {habit.timesPerDay} completed
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {completions.map((completion, index) => (
                            <div 
                              key={completion.id}
                              className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs"
                              title={`Completed at ${completion.timestamp.toLocaleTimeString()}`}
                            >
                              ✓
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Habit Details */}
          <div className="lg:col-span-2 space-y-6">
            {currentHabit && (
              <>
                {/* Habit Overview */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl">{currentHabit.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{currentHabit.name}</h2>
                        <p className="text-gray-600 capitalize">{currentHabit.category} • {currentHabit.streak} day streak</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                        title="Settings"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Circle */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <div className={`w-full h-full ${getColorClasses(currentHabit.color)} rounded-full flex items-center justify-center`}>
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-900">
                            {Math.round((currentHabit.current / currentHabit.target) * 100)}%
                          </span>
                        </div>
                      </div>
                      {currentHabit.completed && (
                        <div className="absolute inset-0 border-4 border-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {currentHabit.current} / {currentHabit.target} {currentHabit.name.includes('Water') ? 'glasses' : 'minutes'}
                    </p>
                    <p className="text-gray-600">
                      {currentHabit.completed ? 'Completed for today! 🎉' : `${currentHabit.target - currentHabit.current} more to go`}
                    </p>
                  </div>
                </div>

                {/* Weekly Progress */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                    This Week
                  </h3>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, index) => {
                      // Calculate date for this day of the week
                      const today = new Date();
                      const mondayOfThisWeek = new Date(today);
                      mondayOfThisWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
                      const dayDate = new Date(mondayOfThisWeek);
                      dayDate.setDate(mondayOfThisWeek.getDate() + index);
                      const dayKey = dayDate.toISOString().split('T')[0];
                      
                      const dayCompletions = currentHabit.completedDays[dayKey] || [];
                      const isFullyCompleted = dayCompletions.length >= currentHabit.timesPerDay;
                      const isToday = dayKey === today.toISOString().split('T')[0];
                      const isFuture = dayDate > today;
                      
                      return (
                        <div key={day} className="text-center">
                          <p className={`text-sm mb-2 ${
                            isToday ? 'font-bold text-blue-600' : 'text-gray-600'
                          }`}>{day}</p>
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center relative ${
                              isFullyCompleted
                                ? `${getColorClasses(currentHabit.color)} text-white`
                                : isFuture
                                ? 'bg-gray-100 text-gray-300'
                                : 'bg-gray-200 text-gray-400'
                            } ${
                              isToday ? 'ring-2 ring-blue-500' : ''
                            }`}
                          >
                            {isFullyCompleted ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <Circle className="h-6 w-6" />
                            )}
                            
                            {/* Show completion count if habit has multiple instances per day */}
                            {currentHabit.timesPerDay > 1 && dayCompletions.length > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                {dayCompletions.length}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Weekly summary */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">
                        This Week: {Object.keys(currentHabit.completedDays).filter(date => {
                          const completions = currentHabit.completedDays[date];
                          const dateObj = new Date(date);
                          const today = new Date();
                          const startOfWeek = new Date(today);
                          startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(startOfWeek.getDate() + 6);
                          
                          return dateObj >= startOfWeek && dateObj <= endOfWeek && 
                                 completions.length >= currentHabit.timesPerDay;
                        }).length} / 7 days completed
                      </span>
                      <span className="text-blue-600">
                        {currentHabit.timesPerDay > 1 ? `${currentHabit.timesPerDay}x daily` : 'Daily'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                {settings.showInsights && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Brain className="h-6 w-6 text-purple-600 mr-2" />
                    AI Insights
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-blue-900">Streak Analysis</h4>
                          <p className="text-blue-800 text-sm">
                            Your {currentHabit.streak}-day streak is 40% above average! You're most consistent on weekdays.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Zap className="h-5 w-5 text-green-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-green-900">Optimization Tip</h4>
                          <p className="text-green-800 text-sm">
                            Try doing {currentHabit.name.toLowerCase()} right after your morning coffee for better consistency.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Award className="h-5 w-5 text-purple-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-purple-900">Next Milestone</h4>
                          <p className="text-purple-800 text-sm">
                            You're 3 days away from earning the "Habit Master" badge for a 15-day streak!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Habit Modal */}
        {showAddHabit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Habit</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Habit Name</label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Morning Yoga"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newHabit.category}
                    onChange={(e) => setNewHabit({...newHabit, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(categories).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Target</label>
                  <input
                    type="number"
                    value={newHabit.target}
                    onChange={(e) => setNewHabit({...newHabit, target: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Times Per Day</label>
                  <input
                    type="number"
                    value={newHabit.timesPerDay}
                    onChange={(e) => setNewHabit({...newHabit, timesPerDay: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many times should this habit be done each day?</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createHabit}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Add Habit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Habit Assistant Chat Modal */}
        {showHabitChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Habit Architect</h3>
                    <p className="text-sm text-gray-600">Your neurodivergent-friendly habit coach</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHabitChat(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {message.type === 'ai' && <Bot className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />}
                        {message.type === 'user' && <User className="h-4 w-4 text-purple-100 mt-1 flex-shrink-0" />}
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoadingAI && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-purple-600" />
                        <div className="animate-pulse">Thinking...</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-6 border-t">
                <div className="mb-3">
                  <p className="text-xs text-gray-500">
                    💬 <strong>Try voice commands:</strong> "Create habit: morning yoga 2x per day category: fitness" or "Add habit: drink water 8 times daily"
                  </p>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Ask about habits, share challenges, or create new habits..."
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentMessage('Create habit: meditation 1x per day category: mindfulness')}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                    disabled={isLoadingAI}
                  >
                    Create Meditation
                  </button>
                  <button
                    onClick={() => setCurrentMessage('Add habit: drink water 8x per day category: health')}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    disabled={isLoadingAI}
                  >
                    Add Water Habit
                  </button>
                  <button
                    onClick={() => setCurrentMessage('New habit: exercise 1x per day category: fitness')}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    disabled={isLoadingAI}
                  >
                    Add Exercise
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        <HabitsSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSettingsChange={(newSettings) => {
            setSettings(newSettings);
            localStorage.setItem('settings_habits', JSON.stringify(newSettings));
          }}
        />
      </div>
    </div>
  );
}