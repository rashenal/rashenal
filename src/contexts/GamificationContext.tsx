import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './userContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: Date;
  category: 'habit' | 'task' | 'community' | 'streak' | 'milestone';
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  level: number;
  avatar?: string;
  rank?: number;
}

interface GamificationContextType {
  points: number;
  level: number;
  streak: number;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  addPoints: (amount: number, reason: string) => Promise<void>;
  checkAchievements: () => Promise<void>;
  getLeaderboard: (scope: 'global' | 'pod' | 'friends') => Promise<void>;
  shareProgress: (platform: 'pod' | 'public' | 'friend', data: unknown) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// Points configuration
const POINT_VALUES = {
  COMPLETE_TASK: 10,
  COMPLETE_HABIT: 15,
  MAINTAIN_STREAK: 5,
  HELP_COMMUNITY: 20,
  ACHIEVE_GOAL: 50,
  DAILY_LOGIN: 5,
  WEEKLY_REVIEW: 25,
  SHARE_PROGRESS: 10,
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
  13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000
];

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (user) {
      loadUserProgress();
      loadAchievements();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;

    try {
      // Load user points and level from database
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user progress:', error);
        return;
      }

      if (data) {
        setPoints(data.points || 0);
        setLevel(calculateLevel(data.points || 0));
        setStreak(data.current_streak || 0);
      } else {
        // Create initial progress record
        await supabase.from('user_progress').insert({
          user_id: user.id,
          points: 0,
          level: 1,
          current_streak: 0,
        });
      }
    } catch (error) {
      console.error('Error in loadUserProgress:', error);
    }
  };

  const loadAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading achievements:', error);
        return;
      }

      const userAchievements = data?.map(item => ({
        ...item.achievements,
        unlockedAt: new Date(item.unlocked_at),
      })) || [];

      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error in loadAchievements:', error);
    }
  };

  const calculateLevel = (totalPoints: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalPoints >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  };

  const addPoints = async (amount: number, reason: string) => {
    if (!user) return;

    const newPoints = points + amount;
    const newLevel = calculateLevel(newPoints);

    try {
      // Update points in database
      await supabase
        .from('user_progress')
        .update({ 
          points: newPoints,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Log points transaction
      await supabase.from('points_history').insert({
        user_id: user.id,
        points: amount,
        reason,
        created_at: new Date().toISOString(),
      });

      setPoints(newPoints);
      
      if (newLevel > level) {
        setLevel(newLevel);
        // Trigger level up celebration
        await checkAchievements();
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const checkAchievements = async () => {
    if (!user) return;

    // Check for new achievements based on current progress
    // This would be more complex in a real implementation
    try {
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      if (!allAchievements) return;

      for (const achievement of allAchievements) {
        // Check if user already has this achievement
        const hasAchievement = achievements.some(a => a.id === achievement.id);
        if (hasAchievement) continue;

        // Check achievement criteria (simplified)
        let earned = false;
        
        switch (achievement.criteria_type) {
          case 'points':
            earned = points >= achievement.criteria_value;
            break;
          case 'streak':
            earned = streak >= achievement.criteria_value;
            break;
          case 'level':
            earned = level >= achievement.criteria_value;
            break;
        }

        if (earned) {
          // Award achievement
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString(),
          });

          // Add achievement points
          await addPoints(achievement.points, `Achievement: ${achievement.name}`);
        }
      }

      // Reload achievements
      await loadAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getLeaderboard = async (scope: 'global' | 'pod' | 'friends') => {
    if (!user) return;

    try {
      let query = supabase
        .from('user_progress')
        .select('*, profiles:user_id(username, avatar_url)')
        .order('points', { ascending: false })
        .limit(100);

      // Add scope-specific filters
      if (scope === 'pod' && user.pod_id) {
        query = query.eq('pod_id', user.pod_id);
      } else if (scope === 'friends') {
        // Get friends list first
        const { data: friends } = await supabase
          .from('user_connections')
          .select('friend_id')
          .eq('user_id', user.id);
        
        if (friends) {
          const friendIds = friends.map(f => f.friend_id);
          query = query.in('user_id', [...friendIds, user.id]);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }

      const entries: LeaderboardEntry[] = data?.map((item, index) => ({
        userId: item.user_id,
        username: item.profiles?.username || 'Anonymous',
        points: item.points,
        level: item.level,
        avatar: item.profiles?.avatar_url,
        rank: index + 1,
      })) || [];

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
    }
  };

  const shareProgress = async (platform: 'pod' | 'public' | 'friend', data: unknown) => {
    if (!user) return;

    try {
      await supabase.from('shared_progress').insert({
        user_id: user.id,
        platform,
        data: JSON.stringify(data),
        created_at: new Date().toISOString(),
      });

      // Award points for sharing
      await addPoints(POINT_VALUES.SHARE_PROGRESS, 'Shared progress');
    } catch (error) {
      console.error('Error sharing progress:', error);
    }
  };

  return (
    <GamificationContext.Provider
      value={{
        points,
        level,
        streak,
        achievements,
        leaderboard,
        addPoints,
        checkAchievements,
        getLeaderboard,
        shareProgress,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}

export { POINT_VALUES, LEVEL_THRESHOLDS };