import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';

export default function AIHabitTracker() {
  const [selectedHabit, setSelectedHabit] = useState('meditation');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', category: 'health', target: 1 });

  const habits = [
    {
      id: 'meditation',
      name: 'Morning Meditation',
      category: 'mindfulness',
      streak: 12,
      completed: true,
      target: 15,
      current: 15,
      weekData: [true, true, false, true, true, true, true],
      color: 'purple',
      icon: '🧘'
    },
    {
      id: 'exercise',
      name: 'Daily Exercise',
      category: 'fitness',
      streak: 8,
      completed: false,
      target: 30,
      current: 0,
      weekData: [true, true, true, false, true, true, false],
      color: 'blue',
      icon: '💪'
    },
    {
      id: 'reading',
      name: 'Read Books',
      category: 'learning',
      streak: 15,
      completed: true,
      target: 30,
      current: 45,
      weekData: [true, true, true, true, true, true, true],
      color: 'green',
      icon: '📚'
    },
    {
      id: 'water',
      name: 'Drink Water',
      category: 'health',
      streak: 5,
      completed: false,
      target: 8,
      current: 5,
      weekData: [true, false, true, true, true, false, true],
      color: 'cyan',
      icon: '💧'
    }
  ];

  const categories = {
    health: { name: 'Health', color: 'green', icon: '🏥' },
    fitness: { name: 'Fitness', color: 'blue', icon: '💪' },
    mindfulness: { name: 'Mindfulness', color: 'purple', icon: '🧘' },
    learning: { name: 'Learning', color: 'yellow', icon: '📚' },
    productivity: { name: 'Productivity', color: 'red', icon: '⚡' }
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentHabit = habits.find(h => h.id === selectedHabit);

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

  const addHabit = () => {
    if (newHabit.name.trim()) {
      // In a real app, this would add to the habits array
      setShowAddHabit(false);
      setNewHabit({ name: '', category: 'health', target: 1 });
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Habits List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-6 w-6 text-green-600 mr-2" />
                Your Habits
              </h2>
              
              <div className="space-y-3">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedHabit === habit.id 
                        ? `${getColorClasses(habit.color, 'border')} bg-${habit.color}-50` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedHabit(habit.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{habit.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{habit.category}</p>
                        </div>
                      </div>
                      {habit.completed ? (
                        <CheckCircle className={`h-6 w-6 ${getColorClasses(habit.color, 'text')}`} />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-600">{habit.streak} day streak</span>
                      </div>
                      <span className="text-sm text-gray-600">{habit.current}/{habit.target}</span>
                    </div>
                  </div>
                ))}
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
                      <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all">
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
                    {weekDays.map((day, index) => (
                      <div key={day} className="text-center">
                        <p className="text-sm text-gray-600 mb-2">{day}</p>
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            currentHabit.weekData[index]
                              ? `${getColorClasses(currentHabit.color)} text-white`
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {currentHabit.weekData[index] ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <Circle className="h-6 w-6" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
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
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addHabit}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Add Habit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}