// pages/DemoPage.tsx
// Extracted from App.tsx to reduce the massive file size

import React, { useState } from 'react';
import {
  Bot,
  BarChart3,
  Kanban,
  Database,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import TaskBoardDemo from '../components/TaskBoard';
import DatabaseTestNoAuth from '../components/DatabaseTest'; // Your working database test
// Import your other demo components
// import DemoAICoaching from '../components/DemoAICoaching';
// import DemoHabitTracker from '../components/DemoHabitTracker';
// import EnhancedSmartTasksDemo from '../components/EnhancedSmartTasksDemo';

// Demo Components (you can extract these to separate files later)
function DemoAICoaching() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-700 font-medium">
            🎭 Demo Mode - This shows realistic mock data to demonstrate our AI
            coaching features
          </p>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI Coaching Demo
        </h2>
        <p className="text-gray-600 mb-6">
          Experience how our AI coaching system works with sample data
        </p>
      </div>

      {/* Mock AI Coaching Dashboard with demo data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Current Goals
            </h3>
            <Bot className="h-6 w-6 text-purple-600" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Launch Online Business</span>
              <span className="text-purple-600 font-semibold">75%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Morning Routine</span>
              <span className="text-blue-600 font-semibold">92%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Fitness Goals</span>
              <span className="text-green-600 font-semibold">68%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-700">
                🎯 You're most productive on Tuesday mornings. Consider
                scheduling important tasks then.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-700">
                💪 Great consistency with morning workouts! You've hit 15 days
                in a row.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Daily Motivation
            </h3>
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">47</div>
            <p className="text-gray-600">Day Transformation Streak</p>
            <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Watch Today's Vision
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-2">
          Ready to start your real transformation?
        </h3>
        <p className="mb-4">
          This demo shows just a glimpse of what's possible with personalized AI
          coaching.
        </p>
        <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Get Started Now
        </button>
      </div>
    </div>
  );
}

function DemoHabitTracker() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-700 font-medium">
            🎭 Demo Mode - Sample habit tracking data
          </p>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Habit Tracker Demo
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            habit: 'Morning Meditation',
            streak: 23,
            completion: 92,
            color: 'purple',
          },
          { habit: 'Exercise', streak: 15, completion: 78, color: 'blue' },
          { habit: 'Reading', streak: 31, completion: 89, color: 'green' },
          { habit: 'Journaling', streak: 12, completion: 67, color: 'yellow' },
          { habit: 'Healthy Eating', streak: 8, completion: 73, color: 'red' },
          {
            habit: 'Skill Learning',
            streak: 19,
            completion: 84,
            color: 'indigo',
          },
        ].map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {item.habit}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Streak</span>
                <span className={`font-bold text-${item.color}-600`}>
                  {item.streak} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className={`font-bold text-${item.color}-600`}>
                  {item.completion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-${item.color}-600 h-2 rounded-full`}
                  style={{ width: `${item.completion}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main DemoPage Component
export default function DemoPage() {
  const [currentDemo, setCurrentDemo] = useState('overview');

  const renderDemoContent = () => {
    switch (currentDemo) {
      case 'coaching':
        return <DemoAICoaching />;
      case 'habits':
        return <DemoHabitTracker />;
      case 'tasks':
        return <TaskBoardDemo />; // Your new database-connected TaskBoard!
      case 'database':
        return <DatabaseTestNoAuth />;
      case 'legacy-tasks':
        // You can import your EnhancedSmartTasksDemo here if you want to keep it
        return <div>Legacy task demo (EnhancedSmartTasksDemo)</div>;
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Experience Rashenal Demo
              </h2>
              <p className="text-xl text-gray-600">
                Try our AI-powered coaching platform with realistic sample data
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  AI Coaching Demo
                </h3>
                <p className="text-gray-600 mb-6">
                  Experience personalized AI coaching with sample goals and
                  insights
                </p>
                <button
                  onClick={() => setCurrentDemo('coaching')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full"
                >
                  Try AI Coaching
                </button>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Habit Tracker Demo
                </h3>
                <p className="text-gray-600 mb-6">
                  See how our intelligent habit tracking adapts to your
                  lifestyle
                </p>
                <button
                  onClick={() => setCurrentDemo('habits')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors w-full"
                >
                  Try Habit Tracker
                </button>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Kanban className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Real Task Management
                </h3>
                <p className="text-gray-600 mb-6">
                  Database-connected task board with real CRUD operations
                </p>
                <button
                  onClick={() => setCurrentDemo('tasks')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
                >
                  Try Real Tasks
                </button>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Database className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Database Test
                </h3>
                <p className="text-gray-600 mb-6">
                  Test Supabase connection and database operations
                </p>
                <button
                  onClick={() => setCurrentDemo('database')}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors w-full"
                >
                  Test Database
                </button>
              </div>
            </div>

            {currentDemo === 'overview' && (
              <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-xl text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Ready for Your Real Transformation?
                </h3>
                <p className="text-lg mb-6">
                  These demos show just a glimpse of what's possible with
                  personalized AI coaching.
                </p>
                <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Start Your Free Trial
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Navigation */}
      {currentDemo !== 'overview' && (
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => setCurrentDemo('overview')}
                className="flex items-center text-purple-600 hover:text-purple-700"
              >
                ← Back to Demo Overview
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentDemo('coaching')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentDemo === 'coaching'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  AI Coaching
                </button>
                <button
                  onClick={() => setCurrentDemo('habits')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentDemo === 'habits'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Habits
                </button>
                <button
                  onClick={() => setCurrentDemo('tasks')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentDemo === 'tasks'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Real Tasks
                </button>
                <button
                  onClick={() => setCurrentDemo('database')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentDemo === 'database'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderDemoContent()}
    </div>
  );
}
