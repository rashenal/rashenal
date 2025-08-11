// components/TaskBoard.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';

interface Task {
  id: string;
  title: string;
  status: string;
  taskboard_id: string;
}

interface TaskBoardProps {
  taskboardId?: string;
}

export default function TaskBoard({ taskboardId }: TaskBoardProps) {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && taskboardId) {
      loadTasks();
    }
  }, [user?.id, taskboardId]);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user?.id)
      .eq('taskboard_id', taskboardId)
      .order('created_at');

    if (error) {
      console.error('Failed to load tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  if (!taskboardId) {
    return (
      <div className="text-gray-500">Select a taskboard to view tasks.</div>
    );
  }

  if (loading) {
    return <div className="text-gray-500">Loading tasks...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white"
        >
          <h4 className="text-lg font-semibold text-gray-800">{task.title}</h4>
          <p className="text-sm text-gray-500">Status: {task.status}</p>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="col-span-full text-center text-gray-500">
          No tasks found for this board.
        </div>
      )}
    </div>
  );
}
