// components/CalendarView.tsx
// Intelligent task scheduling calendar view

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  AlertCircle,
  Settings,
  Play,
  BarChart3,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import type { TaskUI } from '../lib/database-types';

interface ScheduledTask {
  task: TaskUI;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  taskboardColor: string;
  taskboardName: string;
}

interface SchedulingPreferences {
  workHoursPerDay: number;
  workDaysPerWeek: number;
  workStartTime: string;
  workEndTime: string;
  bufferTimePercentage: number;
}

const DEFAULT_PREFERENCES: SchedulingPreferences = {
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  workStartTime: '09:00',
  workEndTime: '17:00',
  bufferTimePercentage: 0.2, // 20% buffer
};

export default function CalendarView() {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [allTasks, setAllTasks] = useState<TaskUI[]>([]);
  const [taskboards, setTaskboards] = useState<any[]>([]);
  const [preferences, setPreferences] =
    useState<SchedulingPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTaskboards(),
        loadAllTasks(),
        loadSchedulingPreferences(),
      ]);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskboards = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('taskboards')
      .select('id, name, color')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error loading taskboards:', error);
    } else {
      setTaskboards(data || []);
    }
  };

  const loadAllTasks = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        taskboards!inner(name, color)
      `
      )
      .eq('user_id', user.id)
      .neq('status', 'done')
      .is('completed_at', null)
      .order('due_date', { ascending: true, nullsLast: true })
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      const convertedTasks = (data || []).map((dbTask) => ({
        ...dbTask,
        createdAt: new Date(dbTask.created_at),
        updatedAt: new Date(dbTask.updated_at),
        dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
        targetDate: dbTask.target_date
          ? new Date(dbTask.target_date)
          : undefined,
      }));
      setAllTasks(convertedTasks);
    }
  };

  const loadSchedulingPreferences = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_scheduling_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Not found error
      console.error('Error loading preferences:', error);
    } else if (data) {
      setPreferences({
        workHoursPerDay: data.work_hours_per_day || 8,
        workDaysPerWeek: data.work_days_per_week || 5,
        workStartTime: data.work_start_time || '09:00',
        workEndTime: data.work_end_time || '17:00',
        bufferTimePercentage: data.buffer_time_percentage || 0.2,
      });
    }
  };

  const saveSchedulingPreferences = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('user_scheduling_preferences')
      .upsert({
        user_id: user.id,
        work_hours_per_day: preferences.workHoursPerDay,
        work_days_per_week: preferences.workDaysPerWeek,
        work_start_time: preferences.workStartTime,
        work_end_time: preferences.workEndTime,
        buffer_time_percentage: preferences.bufferTimePercentage,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } else {
      alert('Preferences saved successfully!');
      setShowPreferences(false);
    }
  };

  const autoScheduleTasks = () => {
    setAutoScheduling(true);

    try {
      // Filter tasks that need scheduling (have estimated time)
      const tasksToSchedule = allTasks.filter(
        (task) =>
          task.estimated_time &&
          task.estimated_time > 0 &&
          task.status !== 'done' &&
          task.status !== 'completed'
      );

      // Sort by priority and due date
      const sortedTasks = tasksToSchedule.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

        if (aPriority !== bPriority) return bPriority - aPriority;

        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        } else if (a.dueDate) {
          return -1;
        } else if (b.dueDate) {
          return 1;
        }
        return 0;
      });

      const scheduled: ScheduledTask[] = [];
      let currentDate = new Date();
      let currentHour = parseFloat(preferences.workStartTime.split(':')[0]);
      let dailyHoursUsed = 0;

      for (const task of sortedTasks) {
        const taskboard = taskboards.find((tb) => tb.id === task.taskboard_id);
        const estimatedHours = task.estimated_time || 1;
        const bufferedHours =
          estimatedHours * (1 + preferences.bufferTimePercentage);

        // Skip weekends if work days per week < 7
        while (
          preferences.workDaysPerWeek < 7 &&
          (currentDate.getDay() === 0 || currentDate.getDay() === 6)
        ) {
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          currentHour = parseFloat(preferences.workStartTime.split(':')[0]);
          dailyHoursUsed = 0;
        }

        // Check if task fits in current day
        if (dailyHoursUsed + bufferedHours > preferences.workHoursPerDay) {
          // Move to next day
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          currentHour = parseFloat(preferences.workStartTime.split(':')[0]);
          dailyHoursUsed = 0;

          // Skip weekends again
          while (
            preferences.workDaysPerWeek < 7 &&
            (currentDate.getDay() === 0 || currentDate.getDay() === 6)
          ) {
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          }
        }

        // Schedule the task
        const startTime = `${Math.floor(currentHour)
          .toString()
          .padStart(2, '0')}:${Math.floor((currentHour % 1) * 60)
          .toString()
          .padStart(2, '0')}`;
        const endHour = currentHour + bufferedHours;
        const endTime = `${Math.floor(endHour)
          .toString()
          .padStart(2, '0')}:${Math.floor((endHour % 1) * 60)
          .toString()
          .padStart(2, '0')}`;

        scheduled.push({
          task,
          scheduledDate: new Date(currentDate),
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          taskboardColor: taskboard?.color || '#6B7280',
          taskboardName: taskboard?.name || 'Unknown Board',
        });

        currentHour = endHour;
        dailyHoursUsed += bufferedHours;
      }

      setScheduledTasks(scheduled);
    } catch (err) {
      console.error('Error auto-scheduling tasks:', err);
      alert('Failed to auto-schedule tasks');
    } finally {
      setAutoScheduling(false);
    }
  };

  const getTasksForDate = (date: Date) => {
    return scheduledTasks.filter(
      (st) => st.scheduledDate.toDateString() === date.toDateString()
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getTotalScheduledHours = () => {
    return scheduledTasks.reduce(
      (total, st) => total + (st.task.estimated_time || 0),
      0
    );
  };

  const getSchedulingStats = () => {
    const totalTasks = allTasks.filter(
      (t) => t.estimated_time && t.estimated_time > 0
    ).length;
    const scheduledCount = scheduledTasks.length;
    const totalHours = getTotalScheduledHours();
    const daysNeeded = Math.ceil(totalHours / preferences.workHoursPerDay);

    return { totalTasks, scheduledCount, totalHours, daysNeeded };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  const stats = getSchedulingStats();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Calendar & Auto-Scheduler
          </h2>
          <p className="text-gray-600">
            Intelligent task scheduling based on time estimates and priorities
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </button>
          <button
            onClick={autoScheduleTasks}
            disabled={autoScheduling}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {autoScheduling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{autoScheduling ? 'Scheduling...' : 'Auto-Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalTasks}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.scheduledCount}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalHours.toFixed(1)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Days Needed</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.daysNeeded}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentDate).map((date, index) => {
              if (!date) {
                return <div key={index} className="h-24"></div>;
              }

              const dayTasks = getTasksForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = date < new Date() && !isToday;

              return (
                <div
                  key={index}
                  className={`h-24 p-1 border border-gray-200 rounded-lg ${
                    isToday
                      ? 'bg-blue-50 border-blue-300'
                      : isPast
                      ? 'bg-gray-50'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday
                        ? 'text-blue-600'
                        : isPast
                        ? 'text-gray-400'
                        : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((scheduledTask, taskIndex) => (
                      <div
                        key={taskIndex}
                        className="text-xs p-1 rounded truncate text-white"
                        style={{
                          backgroundColor: scheduledTask.taskboardColor,
                        }}
                        title={`${scheduledTask.task.title} (${scheduledTask.scheduledStartTime}-${scheduledTask.scheduledEndTime})`}
                      >
                        {scheduledTask.task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scheduling Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Scheduling Preferences
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Hours/Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    step="0.5"
                    value={preferences.workHoursPerDay}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        workHoursPerDay: parseFloat(e.target.value) || 8,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Days/Week
                  </label>
                  <select
                    value={preferences.workDaysPerWeek}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        workDaysPerWeek: parseInt(e.target.value),
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5 Days (Mon-Fri)</option>
                    <option value={6}>6 Days (Mon-Sat)</option>
                    <option value={7}>7 Days (All Week)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.workStartTime}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        workStartTime: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.workEndTime}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        workEndTime: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer Time (
                  {Math.round(preferences.bufferTimePercentage * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={preferences.bufferTimePercentage}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      bufferTimePercentage: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSchedulingPreferences}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No tasks message */}
      {allTasks.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tasks to schedule
          </h3>
          <p className="text-gray-600">
            Create some tasks with time estimates to use the auto-scheduler.
          </p>
        </div>
      )}
    </div>
  );
}
