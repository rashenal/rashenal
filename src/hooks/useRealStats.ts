// Real-time user statistics hook
// Starts with zero data and builds as user interacts with the system

import { useState, useEffect } from 'react';
import { useUser } from '../contexts/userContext';

interface UserStats {
  tasksCompleted: number;
  tasksActive: number;
  streak: number;
  habitsCompleted: number;
  habitsActive: number;
  goalsActive: number;
  goalsCompleted: number;
  level: string;
  xp: number;
  lastActivity: string | null;
}

interface DailyActivity {
  date: string;
  tasks_completed: number;
  habits_completed: number;
  goals_progress: number;
}

export function useRealStats() {
  const { user } = useUser();
  const [stats, setStats] = useState<UserStats>({
    tasksCompleted: 0,
    tasksActive: 0,
    streak: 0,
    habitsCompleted: 0,
    habitsActive: 0,
    goalsActive: 0,
    goalsCompleted: 0,
    level: 'Beginner',
    xp: 0,
    lastActivity: null
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would fetch from Supabase
      // For now, we'll load from localStorage to persist basic data
      const savedStats = localStorage.getItem(`user_stats_${user?.id}`);
      
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setStats(parsed);
      } else {
        // Initialize with zero stats for new users
        const initialStats: UserStats = {
          tasksCompleted: 0,
          tasksActive: 0,
          streak: 0,
          habitsCompleted: 0,
          habitsActive: 0,
          goalsActive: 0,
          goalsCompleted: 0,
          level: 'Beginner',
          xp: 0,
          lastActivity: null
        };
        
        setStats(initialStats);
        saveStats(initialStats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStats = (updatedStats: UserStats) => {
    if (!user?.id) return;
    
    try {
      localStorage.setItem(`user_stats_${user.id}`, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Failed to save user stats:', error);
    }
  };

  const updateStats = (updates: Partial<UserStats>) => {
    const updatedStats = { 
      ...stats, 
      ...updates,
      lastActivity: new Date().toISOString()
    };
    
    // Calculate level based on XP
    if (updatedStats.xp !== stats.xp) {
      updatedStats.level = calculateLevel(updatedStats.xp);
    }
    
    setStats(updatedStats);
    saveStats(updatedStats);
  };

  const incrementTasksCompleted = () => {
    updateStats({ 
      tasksCompleted: stats.tasksCompleted + 1,
      xp: stats.xp + 10 // 10 XP per completed task
    });
  };

  const incrementHabitsCompleted = () => {
    updateStats({ 
      habitsCompleted: stats.habitsCompleted + 1,
      xp: stats.xp + 5 // 5 XP per completed habit
    });
  };

  const updateStreak = (newStreak: number) => {
    updateStats({ 
      streak: newStreak,
      xp: stats.xp + (newStreak > stats.streak ? 20 : 0) // Bonus XP for streak increases
    });
  };

  const recordDailyActivity = () => {
    const today = new Date().toISOString().split('T')[0];
    const activity: DailyActivity = {
      date: today,
      tasks_completed: stats.tasksCompleted,
      habits_completed: stats.habitsCompleted,
      goals_progress: 0 // This would be calculated based on actual goal progress
    };

    // Save daily activity (in real implementation, this would go to Supabase)
    const existingActivities = JSON.parse(
      localStorage.getItem(`daily_activities_${user?.id}`) || '[]'
    );
    
    const updatedActivities = [
      ...existingActivities.filter((a: DailyActivity) => a.date !== today),
      activity
    ];
    
    localStorage.setItem(
      `daily_activities_${user?.id}`, 
      JSON.stringify(updatedActivities)
    );

    // Update streak calculation
    calculateStreakFromActivities(updatedActivities);
  };

  const calculateStreakFromActivities = (activities: DailyActivity[]) => {
    if (activities.length === 0) {
      updateStats({ streak: 0 });
      return;
    }

    // Sort activities by date
    const sorted = activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sorted.length; i++) {
      const activityDate = new Date(sorted[i].date);
      const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        // Check if there was meaningful activity
        if (sorted[i].tasks_completed > 0 || sorted[i].habits_completed > 0) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    if (streak !== stats.streak) {
      updateStats({ streak });
    }
  };

  const calculateLevel = (xp: number): string => {
    if (xp === 0) return 'Beginner';
    if (xp < 100) return 'Getting Started';
    if (xp < 300) return 'Building Momentum';
    if (xp < 600) return 'Consistent';
    if (xp < 1000) return 'Dedicated';
    if (xp < 1500) return 'Advanced';
    if (xp < 2500) return 'Expert';
    if (xp < 4000) return 'Master';
    return 'Legendary';
  };

  const resetStats = () => {
    const freshStats: UserStats = {
      tasksCompleted: 0,
      tasksActive: 0,
      streak: 0,
      habitsCompleted: 0,
      habitsActive: 0,
      goalsActive: 0,
      goalsCompleted: 0,
      level: 'Beginner',
      xp: 0,
      lastActivity: null
    };
    
    setStats(freshStats);
    saveStats(freshStats);
  };

  return {
    stats,
    isLoading,
    updateStats,
    incrementTasksCompleted,
    incrementHabitsCompleted,
    updateStreak,
    recordDailyActivity,
    resetStats
  };
}