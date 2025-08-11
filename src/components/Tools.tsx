import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  Zap,
  Target,
  Brain,
  Clock,
  Coffee,
  CheckCircle2,
  BarChart3,
  Calendar,
  Lightbulb,
  Focus,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'productivity' | 'focus' | 'analysis' | 'planning';
  enabled: boolean;
}

interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  cycle: number;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

const defaultTools: Tool[] = [
  {
    id: 'pomodoro-timer',
    name: '15-Minute Focus Timer',
    description: 'Pomodoro-style timer with customizable intervals for focused work sessions',
    icon: <Timer size={20} />,
    category: 'focus',
    enabled: true
  },
  {
    id: 'energy-tracker',
    name: 'Energy Level Tracker',
    description: 'Track your energy levels throughout the day to optimize scheduling',
    icon: <Zap size={20} />,
    category: 'analysis',
    enabled: true
  },
  {
    id: 'goal-setter',
    name: 'Daily Goal Setter',
    description: 'Set and track daily goals with progress visualization',
    icon: <Target size={20} />,
    category: 'planning',
    enabled: true
  },
  {
    id: 'habit-chains',
    name: 'Habit Chain Builder',
    description: 'Build positive habit chains by linking related activities',
    icon: <Brain size={20} />,
    category: 'productivity',
    enabled: false
  },
  {
    id: 'time-blocker',
    name: 'Smart Time Blocker',
    description: 'Intelligently block time for tasks based on energy and availability',
    icon: <Calendar size={20} />,
    category: 'planning',
    enabled: false
  },
  {
    id: 'distraction-blocker',
    name: 'Distraction Blocker',
    description: 'Track and minimize distractions during focused work periods',
    icon: <Focus size={20} />,
    category: 'focus',
    enabled: false
  },
  {
    id: 'productivity-insights',
    name: 'Productivity Analytics',
    description: 'Analyze your productivity patterns and identify optimization opportunities',
    icon: <BarChart3 size={20} />,
    category: 'analysis',
    enabled: false
  },
  {
    id: 'break-reminder',
    name: 'Smart Break Reminder',
    description: 'Intelligent reminders for breaks based on activity and energy levels',
    icon: <Coffee size={20} />,
    category: 'focus',
    enabled: false
  }
];

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>(defaultTools);
  const [activeTab, setActiveTab] = useState<'productivity' | 'focus' | 'analysis' | 'planning'>('focus');
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    timeLeft: 15 * 60, // 15 minutes in seconds
    isRunning: false,
    isBreak: false,
    cycle: 1,
    workMinutes: 15,
    shortBreakMinutes: 5,
    longBreakMinutes: 15
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyGoals, setDailyGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());

  // Pomodoro timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (pomodoro.isRunning && pomodoro.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoro(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (pomodoro.timeLeft === 0) {
      // Timer finished
      if (soundEnabled) {
        // Play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAS...');
        audio.play().catch(() => {});
      }
      
      // Switch between work and break
      setPomodoro(prev => {
        const nextIsBreak = !prev.isBreak;
        const nextTimeLeft = nextIsBreak 
          ? (prev.cycle % 4 === 0 ? prev.longBreakMinutes : prev.shortBreakMinutes) * 60
          : prev.workMinutes * 60;
        
        return {
          ...prev,
          timeLeft: nextTimeLeft,
          isBreak: nextIsBreak,
          cycle: nextIsBreak ? prev.cycle : prev.cycle + 1,
          isRunning: false
        };
      });
      
      // Show notification
      if (Notification.permission === 'granted') {
        new Notification(
          pomodoro.isBreak ? 'Break time over!' : 'Focus session complete!',
          {
            body: pomodoro.isBreak 
              ? 'Time to get back to work!' 
              : 'Time for a well-deserved break!',
            icon: '/favicon.ico'
          }
        );
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoro.isRunning, pomodoro.timeLeft, pomodoro.isBreak, soundEnabled]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleTool = (toolId: string) => {
    setTools(prev => 
      prev.map(tool => 
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      )
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startPauseTimer = () => {
    setPomodoro(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    setPomodoro(prev => ({
      ...prev,
      timeLeft: prev.isBreak 
        ? (prev.cycle % 4 === 0 ? prev.longBreakMinutes : prev.shortBreakMinutes) * 60
        : prev.workMinutes * 60,
      isRunning: false
    }));
  };

  const skipSession = () => {
    setPomodoro(prev => ({
      ...prev,
      timeLeft: 0,
      isRunning: false
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !dailyGoals.includes(newGoal.trim())) {
      setDailyGoals(prev => [...prev, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const toggleGoalCompletion = (goal: string) => {
    setCompletedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goal)) {
        newSet.delete(goal);
      } else {
        newSet.add(goal);
      }
      return newSet;
    });
  };

  const removeGoal = (goal: string) => {
    setDailyGoals(prev => prev.filter(g => g !== goal));
    setCompletedGoals(prev => {
      const newSet = new Set(prev);
      newSet.delete(goal);
      return newSet;
    });
  };

  const filteredTools = tools.filter(tool => tool.category === activeTab);
  const enabledTools = tools.filter(tool => tool.enabled);

  const categories = [
    { id: 'focus', name: 'Focus', icon: <Focus size={16} /> },
    { id: 'productivity', name: 'Productivity', icon: <Zap size={16} /> },
    { id: 'planning', name: 'Planning', icon: <Target size={16} /> },
    { id: 'analysis', name: 'Analysis', icon: <BarChart3 size={16} /> }
  ] as const;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Productivity Tools</h1>
        <p className="text-gray-600">
          A library of agents and tools to optimize your workflow and productivity
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Enabled Tools Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pomodoro Timer */}
          {tools.find(t => t.id === 'pomodoro-timer')?.enabled && (
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Focus Timer</h3>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className={`text-4xl font-mono font-bold mb-2 ${
                  pomodoro.isBreak ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {formatTime(pomodoro.timeLeft)}
                </div>
                <div className="text-sm text-gray-500">
                  {pomodoro.isBreak ? 'Break Time' : 'Focus Time'} • Cycle {pomodoro.cycle}
                </div>
              </div>
              
              <div className="flex justify-center gap-3 mb-4">
                <button
                  onClick={startPauseTimer}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    pomodoro.isRunning
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {pomodoro.isRunning ? <Pause size={16} /> : <Play size={16} />}
                  {pomodoro.isRunning ? 'Pause' : 'Start'}
                </button>
                
                <button
                  onClick={resetTimer}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                
                <button
                  onClick={skipSession}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                >
                  <Square size={16} />
                  Skip
                </button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                {pomodoro.isBreak 
                  ? `Break: ${pomodoro.cycle % 4 === 0 ? pomodoro.longBreakMinutes : pomodoro.shortBreakMinutes} min`
                  : `Work: ${pomodoro.workMinutes} min`
                }
              </div>
            </div>
          )}

          {/* Daily Goals */}
          {tools.find(t => t.id === 'goal-setter')?.enabled && (
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Goals</h3>
              
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a goal for today..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                  />
                  <button
                    onClick={addGoal}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {dailyGoals.map((goal, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded ${
                      completedGoals.has(goal) ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => toggleGoalCompletion(goal)}
                      className={`flex-shrink-0 ${
                        completedGoals.has(goal) 
                          ? 'text-green-600' 
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <span className={`flex-1 text-sm ${
                      completedGoals.has(goal) 
                        ? 'line-through text-gray-500' 
                        : 'text-gray-900'
                    }`}>
                      {goal}
                    </span>
                    <button
                      onClick={() => removeGoal(goal)}
                      className="text-gray-400 hover:text-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {dailyGoals.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  {completedGoals.size} of {dailyGoals.length} goals completed
                </div>
              )}
            </div>
          )}

          {/* Energy Tracker */}
          {tools.find(t => t.id === 'energy-tracker')?.enabled && (
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h3 className="font-semibold text-gray-900 mb-4">Energy Level</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-2">⚡ 75%</div>
                <div className="text-sm text-gray-500 mb-4">Currently: High Energy</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-green-500 h-3 rounded-full"
                    style={{ width: '75%' }}
                  ></div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Great time for challenging tasks!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Tools */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available {categories.find(c => c.id === activeTab)?.name} Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map(tool => (
            <div
              key={tool.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                tool.enabled
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => toggleTool(tool.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tool.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{tool.name}</h3>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded border-2 ${
                  tool.enabled ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {tool.enabled && <CheckCircle2 size={12} className="text-white" />}
                </div>
              </div>
              <p className="text-sm text-gray-600">{tool.description}</p>
              {tool.enabled && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  ✓ Active
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Active Tools: {enabledTools.length}</span>
          <span>Focus Sessions Today: {Math.floor(pomodoro.cycle / 2)}</span>
          <span>Goals Completed: {completedGoals.size}</span>
        </div>
      </div>
    </div>
  );
}