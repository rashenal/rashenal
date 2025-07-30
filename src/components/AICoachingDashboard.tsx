import React, { useState } from 'react';
import { 
  Bot, 
  MessageCircle, 
  Target, 
  TrendingUp, 
  Calendar, 
  Award,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Bell,
  User,
  BarChart3,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

export default function AICoachingDashboard() {
  const [activeChat, setActiveChat] = useState(false);
  const [currentGoal, setCurrentGoal] = useState('meditation');
  const [timerActive, setTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);

  const goals = [
    { id: 'meditation', name: 'Daily Meditation', progress: 85, streak: 12, target: 15 },
    { id: 'exercise', name: 'Morning Exercise', progress: 72, streak: 8, target: 30 },
    { id: 'reading', name: 'Read 30 Minutes', progress: 94, streak: 15, target: 30 },
    { id: 'water', name: 'Drink 8 Glasses Water', progress: 60, streak: 5, target: 8 }
  ];

  const aiMessages = [
    { type: 'ai', message: "Good morning! I noticed you've been consistent with meditation. How are you feeling today?" },
    { type: 'user', message: "Feeling great! Ready for today's session." },
    { type: 'ai', message: "Excellent! Your 12-day streak is impressive. Let's aim for 15 minutes today. I'll guide you through a focus-building session." }
  ];

  const achievements = [
    { title: "Meditation Master", description: "10-day meditation streak", icon: "🧘", earned: true },
    { title: "Early Bird", description: "7 days of 6 AM workouts", icon: "🌅", earned: true },
    { title: "Bookworm", description: "Read 5 hours this week", icon: "📚", earned: false },
    { title: "Hydration Hero", description: "Perfect water intake for 3 days", icon: "💧", earned: false }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Goals & Timer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Target className="h-6 w-6 text-purple-600 mr-2" />
                  Today's Goals
                </h2>
                <span className="text-sm text-gray-500">3 of 4 completed</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <div 
                    key={goal.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      currentGoal === goal.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => setCurrentGoal(goal.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                      <span className="text-sm text-purple-600 font-semibold">{goal.streak} day streak</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500" 
                          style={{width: `${goal.progress}%`}}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Target: {goal.target} min</span>
                      {goal.progress >= 100 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Timer */}
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
                    {timerActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  <button
                    onClick={() => {setTimerActive(false); setTimerMinutes(15);}}
                    className="p-4 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-all"
                  >
                    <RotateCcw className="h-6 w-6" />
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

          {/* Right Column - AI Chat & Stats */}
          <div className="space-y-6">
            {/* AI Chat */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="h-6 w-6 text-green-600 mr-2" />
                  AI Coach
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {aiMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.type === 'ai' 
                        ? 'bg-blue-50 text-blue-900' 
                        : 'bg-purple-50 text-purple-900 ml-8'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ask your AI coach..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all">
                  Send
                </button>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-6 w-6 text-yellow-600 mr-2" />
                This Week
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Goals Completed</span>
                  <span className="font-bold text-green-600">18/21</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Streak Days</span>
                  <span className="font-bold text-purple-600">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Sessions</span>
                  <span className="font-bold text-blue-600">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Improvement</span>
                  <span className="font-bold text-green-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +23%
                  </span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Award className="h-6 w-6 text-yellow-600 mr-2" />
                Achievements
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