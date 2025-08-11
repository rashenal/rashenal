// lib/use-tasks.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';

export function useTasks() {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTaskStats = async () => {
    if (!user?.id) return defaultStats;

    const { data, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to fetch task stats:', error.message);
      return defaultStats;
    }

    return {
      total: data.length,
      completed: data.filter(t => ['done', 'completed'].includes(t.status)).length,
      inProgress: data.filter(t => t.status === 'in_progress').length,
      todo: data.filter(t => t.status === 'todo').length,
      backlog: data.filter(t => t.status === 'backlog').length,
      blocked: data.filter(t => t.status === 'blocked').length,
    };
  };

  const getTasks = async () => {
    if (!user?.id) return [];

    setLoading(true);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error.message);
      setLoading(false);
      return [];
    }

    setTasks(data);
    setLoading(false);
    return data;
  };

  useEffect(() => {
    if (user?.id) getTasks();
  }, [user?.id]);

  return {
    tasks,
    loading,
    getTasks,
    getTaskStats,
  };
}

const defaultStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  todo: 0,
  backlog: 0,
  blocked: 0,
};
