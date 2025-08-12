import React, { useState, useEffect } from 'react';
import {
  Play,
  Target,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Battery,
  Zap,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  energyLevel: 'XS' | 'S' | 'M' | 'L' | 'XL';
  estimatedTime: number; // in minutes
  deadline?: Date;
  project: string;
  dependencies: string[];
  progress: number;
}

interface Recommendation {
  id: string;
  task: Task;
  score: number;
  reasoning: string[];
  timeSlot: 'morning' | 'afternoon' | 'evening';
  energyMatch: boolean;
  urgencyScore: number;
}

export default function StartWithThisPlugin() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userEnergyLevel, setUserEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [availableTime, setAvailableTime] = useState<number>(60); // minutes
  const [currentTimeSlot, setCurrentTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [loading, setLoading] = useState(true);

  // Mock tasks data - in real implementation, this would come from your task system
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Review quarterly budget report',
      priority: 'high',
      energyLevel: 'L',
      estimatedTime: 45,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      project: 'Finance Review',
      dependencies: [],
      progress: 0
    },
    {
      id: '2',
      title: 'Update team on project status',
      priority: 'medium',
      energyLevel: 'M',
      estimatedTime: 20,
      project: 'Team Management',
      dependencies: ['1'],
      progress: 0
    },
    {
      id: '3',
      title: 'Respond to client emails',
      priority: 'medium',
      energyLevel: 'S',
      estimatedTime: 30,
      project: 'Client Relations',
      dependencies: [],
      progress: 25
    },
    {
      id: '4',
      title: 'Plan innovation labs demo',
      priority: 'urgent',
      energyLevel: 'XL',
      estimatedTime: 90,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      project: 'aisista.ai Development',
      dependencies: [],
      progress: 10
    }
  ];

  useEffect(() => {
    // Simulate loading and AI analysis
    setLoading(true);
    
    setTimeout(() => {
      const analyzed = analyzeOptimalStartingPoint(mockTasks);
      setRecommendations(analyzed);
      setLoading(false);
    }, 1500);
    
    // Set current time slot
    const hour = new Date().getHours();
    if (hour < 12) setCurrentTimeSlot('morning');
    else if (hour < 17) setCurrentTimeSlot('afternoon');
    else setCurrentTimeSlot('evening');
  }, [userEnergyLevel, availableTime]);

  const analyzeOptimalStartingPoint = (tasks: Task[]): Recommendation[] => {
    return tasks
      .filter(task => task.progress < 100)
      .map(task => {
        let score = 0;
        const reasoning: string[] = [];

        // Priority scoring
        const priorityScores = { low: 1, medium: 2, high: 3, urgent: 4 };
        const priorityScore = priorityScores[task.priority] * 25;
        score += priorityScore;
        reasoning.push(`${task.priority} priority (+${priorityScore})`);

        // Deadline urgency
        if (task.deadline) {
          const daysUntilDeadline = Math.ceil((task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilDeadline <= 1) {
            score += 30;
            reasoning.push('Due within 24 hours (+30)');
          } else if (daysUntilDeadline <= 3) {
            score += 20;
            reasoning.push('Due within 3 days (+20)');
          }
        }

        // Energy level matching
        const energyScores = { XS: 1, S: 2, M: 3, L: 4, XL: 5 };
        const userEnergyScores = { low: 2, medium: 3, high: 5 };
        const energyMatch = energyScores[task.energyLevel] <= userEnergyScores[userEnergyLevel];
        if (energyMatch) {
          score += 15;
          reasoning.push('Matches current energy level (+15)');
        } else {
          score -= 10;
          reasoning.push('Energy level mismatch (-10)');
        }

        // Time availability
        if (task.estimatedTime <= availableTime) {
          score += 10;
          reasoning.push('Fits in available time (+10)');
        } else {
          score -= 15;
          reasoning.push('Exceeds available time (-15)');
        }

        // Dependency readiness
        const dependenciesReady = task.dependencies.every(depId => 
          mockTasks.find(t => t.id === depId)?.progress === 100
        );
        if (dependenciesReady || task.dependencies.length === 0) {
          score += 10;
          reasoning.push('No blocking dependencies (+10)');
        } else {
          score -= 20;
          reasoning.push('Has blocking dependencies (-20)');
        }

        // Progress momentum
        if (task.progress > 0 && task.progress < 80) {
          score += 5;
          reasoning.push('In progress - maintain momentum (+5)');
        }

        return {
          id: task.id,
          task,
          score: Math.max(0, score),
          reasoning,
          timeSlot: currentTimeSlot,
          energyMatch,
          urgencyScore: task.deadline ? Math.max(0, 100 - Math.ceil((task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) * 10) : 0
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const getEnergyColor = (level: string) => {
    const colors = {
      XS: 'bg-green-100 text-green-800',
      S: 'bg-blue-100 text-blue-800',
      M: 'bg-yellow-100 text-yellow-800',
      L: 'bg-orange-100 text-orange-800',
      XL: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Optimal Starting Point</h2>
            <p className="text-gray-600">AI is reviewing your tasks, energy, and priorities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Play className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Start With This
              </h1>
              <p className="text-gray-600">AI-powered optimal starting point for maximum productivity</p>
            </div>
          </div>
        </div>

        {/* Context Settings */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Energy Level</label>
            <select
              value={userEnergyLevel}
              onChange={(e) => setUserEnergyLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="low">Low Energy</option>
              <option value="medium">Medium Energy</option>
              <option value="high">High Energy</option>
            </select>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Time (minutes)</label>
            <input
              type="number"
              value={availableTime}
              onChange={(e) => setAvailableTime(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              min="15"
              max="480"
              step="15"
            />
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="capitalize font-medium">{currentTimeSlot}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-6">
          {recommendations.map((rec, index) => (
            <div
              key={rec.id}
              className={`bg-white rounded-xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${
                index === 0 
                  ? 'border-green-300 bg-gradient-to-r from-green-50 to-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {index === 0 && (
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{rec.task.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">{rec.task.project}</span>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getEnergyColor(rec.task.energyLevel)}`}>
                        {rec.task.energyLevel} Energy
                      </div>
                      <span className={`text-sm font-medium ${getPriorityColor(rec.task.priority)}`}>
                        {rec.task.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-1">{rec.score}</div>
                  <div className="text-xs text-gray-500">AI Score</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Task Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated Time:</span>
                    <span className="font-medium">{rec.task.estimatedTime} minutes</span>
                  </div>
                  
                  {rec.task.deadline && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Deadline:</span>
                      <span className="font-medium">
                        {rec.task.deadline.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{width: `${rec.task.progress}%`}}
                        ></div>
                      </div>
                      <span className="font-medium text-xs">{rec.task.progress}%</span>
                    </div>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Why This Task?</h4>
                  <ul className="space-y-1">
                    {rec.reasoning.slice(0, 3).map((reason, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-gray-600">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {index === 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Start This Task Now</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{mockTasks.length}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Battery className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 capitalize">{userEnergyLevel}</div>
            <div className="text-sm text-gray-600">Energy Level</div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{availableTime}m</div>
            <div className="text-sm text-gray-600">Available Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}