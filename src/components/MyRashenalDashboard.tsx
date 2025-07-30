// components/MyRashenalDashboard.tsx
// Final version with calendar tab, default dashboard view, and enhanced AI Coach Chat

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Plus,
  Kanban,
  Calendar,
  Users,
  Zap,
  Bot,
  MessageCircle
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import TaskBoardKanban from './TaskBoardKanban';
import TaskBoardManager from './TaskBoardManager';
import CalendarView from './CalendarView';
import AICoachChat from './AICoachChat'; // Import our new AI Coach Chat
import { useTasks } from '../lib/use-tasks';
import { supabase } from '../supabase/supabaseClient';

// Dashboard Overview Component
function DashboardOverview() {
  const { user } = useUser();
  const [timerActive, setTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [currentGoal, setCurrentGoal] = useState('meditation');

  // Mock data for habits - later this will come from the database
  const habits = [
    { 
      id: 'meditation', 
      name: 'Daily Meditation', 
      progress: 85, 
      streak: 12, 
      target: 15, 
      unit: 'min',
      color: 'purple' 
    },
    { 
      id: 'exercise', 
      name: 'Morning Exercise', 
      progress: 72, 
      streak: 8, 
      target: 30, 
      unit: 'min',
      color: 'blue' 
    },
    { 
      id: 'reading', 
      name: 'Read 30 Minutes', 
      progress: 94, 
      streak: 15, 
      target: 30, 
      unit: 'min',
      color: 'green' 
    },
    { 
      id: 'water', 
      name: 'Drink 8 Glasses Water', 
      progress: 60, 
      streak: 5, 
      target: 8, 
      unit: 'glasses',
      color: 'cyan' 
    }
  ];

  const completedHabits = habits.filter(h => h.progress >= 100).length;

  // Mock achievements
  const achievements = [
    { title: "Meditation Master", description: "10-day meditation streak", icon: "🧘", earned: true },
    { title: "Early Bird", description: "7 days of 6 AM workouts", icon: "🌅", earned: true },
    { title: "Bookworm", description: "Read 5 hours this week", icon: "📚", earned: false },
    { title: "Hydration Hero", description: "Perfect water intake for 3 days", icon: "💧", earned: false }
  ];

  const getProgressColor = (color: string) => {
    const colors = {
      purple: 'from-purple-500 to-purple-600',
      blue: 'from-blue-500 to-blue-600', 
      green: 'from-green-500 to-green-600',
      cyan: 'from-cyan-500 to-cyan-600'
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  // Create user context for AI Coach
  const userContext = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there',
    habits: habits.map(h => ({
      name: h.name,
      progress: h.progress,
      streak: h.streak,
      target: h.target,
      unit: h.unit
    })),
    weeklyStats: {
      goalsCompleted: `${completedHabits}/4`,
      streakDays: Math.max(...habits.map(h => h.streak)),
      aiSessions: 8,
      improvement: "+23%"
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Goals */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Target className="h-6 w-6 text-purple-600 mr-2" />
                  Today's Goals
                </h2>
                <span className="text-sm text-gray-500">{completedHabits} of {habits.length} completed</span>
              </div>
              
              <div className="space-y-4">
                {habits.map((habit) => (
                  <div 
                    key={habit.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      currentGoal === habit.id 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                    onClick={() => setCurrentGoal(habit.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                      <span className="text-sm text-purple-600 font-semibold">{habit.streak} day streak</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{habit.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getProgressColor(habit.color)} h-2 rounded-full transition-all duration-500`}
                          style={{width: `${habit.progress}%`}}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Target: {habit.target} {habit.unit}</span>
                      {habit.progress >= 100 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - AI Timer */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="h-6 w-6 text-blue-600 mr-2" />
                AI-Guided Session Timer
              </h2>
              
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-6 relative">
                  <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">{timerMinutes}:00</span>
                    </div>
                  </div>
                  {timerActive && (
                    <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className={`p-4 rounded-full transition-all ${
                      timerActive 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {timerActive ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => {setTimerActive(false); setTimerMinutes(15);}}
                    className="p-4 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-all"
                  >
                    🔄
                  </button>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  {[5, 10, 15, 20, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setTimerMinutes(minutes)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        timerMinutes === minutes
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Enhanced AI Chat & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Enhanced AI Chat - Replace the static version with interactive */}
            <AICoachChat userContext={userContext} className="h-64" />

            {/* Weekly Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                📊 This Week
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Goals Completed</span>
                  <span className="font-bold text-green-600">{userContext.weeklyStats.goalsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Streak Days</span>
                  <span className="font-bold text-purple-600">{userContext.weeklyStats.streakDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Sessions</span>
                  <span className="font-bold text-blue-600">{userContext.weeklyStats.aiSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Improvement</span>
                  <span className="font-bold text-green-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {userContext.weeklyStats.improvement}
                  </span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                🏆 Achievements
              </h2>
              
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${
                      achievement.earned 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${achievement.earned ? 'text-yellow-800' : 'text-gray-600'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${achievement.earned ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Smart Tasks Component
function SmartTasksSection() {
  const [currentTaskboardId, setCurrentTaskboardId] = useState<string | undefined>();
  const [currentTaskboard, setCurrentTaskboard] = useState<any>(null);

  // Get taskboard details when ID changes
  useEffect(() => {
    if (currentTaskboardId) {
      loadTaskboardDetails();
    }
  }, [currentTaskboardId]);

  const loadTaskboardDetails = async () => {
    if (!currentTaskboardId) return;

    try {
      const { data, error } = await supabase
        .from('taskboards')
        .select('*')
        .eq('id', currentTaskboardId)
        .single();

      if (error) {
        console.error('Error loading taskboard details:', error);
      } else {
        setCurrentTaskboard(data);
      }
    } catch (err) {
      console.error('Error loading taskboard details:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Task Management</h2>
          <p className="text-gray-600">Organize and track your transformation journey</p>
        </div>
      </div>

      <TaskBoardManager 
        currentTaskboardId={currentTaskboardId}
        onTaskboardChange={setCurrentTaskboardId}
      />

      <TaskBoardKanban 
        taskboardId={currentTaskboardId}
        taskboardColor={currentTaskboard?.color}
      />
    </div>
  );
}

// Enhanced AI Coach Section (new dedicated section)
function AICoachSection() {
  const { user } = useUser();
  const { tasks, getTaskStats } = useTasks();
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    const buildUserContext = async () => {
      try {
        const taskStats = await getTaskStats();
        const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
        
        // Create comprehensive user context for AI coach
        const context = {
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there',
          habits: [
            { 
              name: 'Task Completion', 
              progress: completionRate, 
              streak: Math.floor(Math.random() * 15) + 5,
              target: 100, 
              unit: '%' 
            },
            { 
              name: 'Daily Planning', 
              progress: taskStats.todo > 0 ? 80 : 20, 
              streak: Math.floor(Math.random() * 10) + 3,
              target: 1, 
              unit: 'session' 
            },
            { 
              name: 'Productivity Focus', 
              progress: taskStats.inProgress > 0 ? 90 : 30, 
              streak: Math.floor(Math.random() * 12) + 2,
              target: 2, 
              unit: 'hours' 
            },
            { 
              name: 'Goal Achievement', 
              progress: taskStats.completed > 0 ? 85 : 10, 
              streak: Math.floor(Math.random() * 8) + 1,
              target: 3, 
              unit: 'goals' 
            }
          ],
          weeklyStats: {
            goalsCompleted: `${taskStats.completed}/${taskStats.total}`,
            streakDays: Math.floor(Math.random() * 20) + 5,
            aiSessions: Math.floor(Math.random() * 10) + 3,
            improvement: `+${Math.floor(Math.random() * 30) + 10}%`
          }
        };
        
        setUserContext(context);
      } catch (error) {
        console.error('Error building user context:', error);
      }
    };

    if (user) {
      buildUserContext();
    }
  }, [user, tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">AI Transformation Coach</h2>
            <p className="text-gray-600 mt-2">Get personalized coaching and support based on your real progress</p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg">
            <Bot className="h-4 w-4" />
            <span className="text-sm font-medium">AI Powered</span>
          </div>
        </div>

        {/* Main AI Coach Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* AI Chat - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <AICoachChat userContext={userContext} />
          </div>

          {/* Stats & Insights - 1 column */}
          <div className="space-y-6">
            {/* This Week Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                📊 This Week
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Goals Completed</span>
                  <span className="font-bold text-green-600">{userContext?.weeklyStats.goalsCompleted || '0/4'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Streak Days</span>
                  <span className="font-bold text-purple-600">{userContext?.weeklyStats.streakDays || '15'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Sessions</span>
                  <span className="font-bold text-blue-600">{userContext?.weeklyStats.aiSessions || '8'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Improvement</span>
                  <span className="font-bold text-green-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {userContext?.weeklyStats.improvement || '+23%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Today's Focus */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 text-purple-600 mr-2" />
                Today's Focus
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700 text-sm">Complete 3 tasks</span>
                  <span className="text-purple-600 font-semibold">2/3</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700 text-sm">AI coaching session</span>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700 text-sm">Review goals</span>
                  <span className="text-green-600 font-semibold">Pending</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                AI Insights
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    🎯 You're most productive when you start with small tasks. Try breaking down larger goals.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    💪 Great progress this week! You've completed {userContext?.weeklyStats.goalsCompleted || '0'} tasks.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    🧠 Consider scheduling your most challenging tasks for morning when your energy is highest.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🤖 AI Coaching Impact</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {userContext?.weeklyStats.aiSessions || '0'}
              </div>
              <div className="text-sm text-gray-600">AI Sessions This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {userContext?.weeklyStats.improvement || '+0%'}
              </div>
              <div className="text-sm text-gray-600">Productivity Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {userContext?.weeklyStats.streakDays || '0'}
              </div>
              <div className="text-sm text-gray-600">Day Transformation Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">97%</div>
              <div className="text-sm text-gray-600">User Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main MyRashenal Dashboard Component
export default function MyRashenalDashboard() {
  const { user } = useUser();
  // ✅ KEPT: Default to 'dashboard' as in current version
  const [currentView, setCurrentView] = useState('dashboard');

  // ✅ KEPT: Auto-select dashboard when user logs in
  useEffect(() => {
    if (user && currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to myRashenal</h2>
          <p className="text-gray-600 mb-6">Please log in to access your personalized AI-assisted life management dashboard.</p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            Log In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Navigation */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentView === 'dashboard' 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </button>

        {/* ✅ ADDED: AI Coach as a separate tab */}
        <button 
          onClick={() => setCurrentView('ai-coach')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentView === 'ai-coach' 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>AI Coach</span>
          </div>
        </button>
        
        <button 
          onClick={() => setCurrentView('tasks')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentView === 'tasks' 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Kanban className="h-4 w-4" />
            <span>Smart Tasks</span>
          </div>
        </button>

        {/* ✅ KEPT: Calendar tab from current version */}
        <button 
          onClick={() => setCurrentView('calendar')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentView === 'calendar' 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
          </div>
        </button>
        
        <button 
          onClick={() => setCurrentView('habits')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentView === 'habits' 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Habits</span>
          </div>
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="min-h-96">
        {currentView === 'dashboard' && <DashboardOverview />}
        {/* ✅ ADDED: New AI Coach section with full interactive chat */}
        {currentView === 'ai-coach' && <AICoachSection />}
        {currentView === 'tasks' && <SmartTasksSection />}
        {/* ✅ KEPT: Calendar view from current version */}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'habits' && (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Habit Tracking Coming Soon</h3>
            <p className="text-gray-600">Smart habit tracking with AI insights and progress analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
}