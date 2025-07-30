import { useState, useEffect } from 'react';
import { database, Goal } from '@lib/database';
import { useAuth } from '@contexts/AuthContext';

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userGoals = await database.getUserGoals(user.id);
      setGoals(userGoals);
      setError(null);
    } catch (err) {
      setError('Failed to fetch goals');
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: {
    title: string;
    description?: string;
    category: string;
    target_date?: string;
    progress?: number;
  }) => {
    if (!user) return null;

    try {
      const newGoal = await database.createGoal({
        ...goalData,
        user_id: user.id,
        progress: goalData.progress || 0,
        status: 'active'
      });
      
      if (newGoal) {
        setGoals(prev => [newGoal, ...prev]);
      }
      
      return newGoal;
    } catch (err) {
      setError('Failed to create goal');
      console.error('Error creating goal:', err);
      return null;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const success = await database.updateGoal(goalId, updates);
      
      if (success) {
        setGoals(prev => 
          prev.map(goal => 
            goal.id === goalId ? { ...goal, ...updates } : goal
          )
        );
      }
      
      return success;
    } catch (err) {
      setError('Failed to update goal');
      console.error('Error updating goal:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    refetch: fetchGoals
  };
}