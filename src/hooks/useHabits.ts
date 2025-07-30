import { useState, useEffect } from 'react';
import { database, Habit, HabitCompletion } from '@lib/database';
import { useAuth } from '@contexts/AuthContext';

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userHabits = await database.getUserHabits(user.id);
      setHabits(userHabits);
      setError(null);
    } catch (err) {
      setError('Failed to fetch habits');
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (habitData: {
    name: string;
    category: string;
    target_value: number;
    target_unit: string;
    color: string;
    icon: string;
  }) => {
    if (!user) return null;

    try {
      const newHabit = await database.createHabit({
        ...habitData,
        user_id: user.id,
        is_active: true
      });
      
      if (newHabit) {
        setHabits(prev => [newHabit, ...prev]);
      }
      
      return newHabit;
    } catch (err) {
      setError('Failed to create habit');
      console.error('Error creating habit:', err);
      return null;
    }
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      const success = await database.updateHabit(habitId, updates);
      
      if (success) {
        setHabits(prev => 
          prev.map(habit => 
            habit.id === habitId ? { ...habit, ...updates } : habit
          )
        );
      }
      
      return success;
    } catch (err) {
      setError('Failed to update habit');
      console.error('Error updating habit:', err);
      return false;
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const success = await database.deleteHabit(habitId);
      
      if (success) {
        setHabits(prev => prev.filter(habit => habit.id !== habitId));
      }
      
      return success;
    } catch (err) {
      setError('Failed to delete habit');
      console.error('Error deleting habit:', err);
      return false;
    }
  };

  const recordCompletion = async (habitId: string, value: number, notes?: string) => {
    if (!user) return null;

    try {
      const completion = await database.recordHabitCompletion({
        habit_id: habitId,
        user_id: user.id,
        completed_at: new Date().toISOString().split('T')[0],
        value_completed: value,
        notes: notes || null
      });
      
      return completion;
    } catch (err) {
      setError('Failed to record completion');
      console.error('Error recording completion:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user]);

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    recordCompletion,
    refetch: fetchHabits
  };
}

export function useHabitCompletions(habitId?: string, days?: number) {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await database.getHabitCompletions(user.id, habitId, days);
      setCompletions(data);
    } catch (err) {
      console.error('Error fetching completions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletions();
  }, [user, habitId, days]);

  return {
    completions,
    loading,
    refetch: fetchCompletions
  };
}

export function useHabitStreaks() {
  const { user } = useAuth();
  const [streaks, setStreaks] = useState<{ [habitId: string]: number }>({});
  const [loading, setLoading] = useState(true);

  const fetchStreaks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await database.getHabitStreaks(user.id);
      setStreaks(data);
    } catch (err) {
      console.error('Error fetching streaks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreaks();
  }, [user]);

  return {
    streaks,
    loading,
    refetch: fetchStreaks
  };
}