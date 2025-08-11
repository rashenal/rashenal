import { describe, it, expect } from 'vitest';
import HabitsAPI from '../../api/v1/habits';
import TasksAPI from '../../api/v1/tasks';
import GoalsAPI from '../../api/v1/goals';
import JobsAPI from '../../api/v1/jobs';
import CoachAPI from '../../api/v1/coach';
import { HabitAgent } from '../../agents/HabitAgent';
import { TaskAgent } from '../../agents/TaskAgent';

describe('API Layer Structure', () => {
  it('should have all required API endpoints', () => {
    // Habits API
    expect(typeof HabitsAPI.getAllHabits).toBe('function');
    expect(typeof HabitsAPI.getHabit).toBe('function');
    expect(typeof HabitsAPI.createHabit).toBe('function');
    expect(typeof HabitsAPI.updateHabit).toBe('function');
    expect(typeof HabitsAPI.deleteHabit).toBe('function');
    expect(typeof HabitsAPI.completeHabit).toBe('function');
    expect(typeof HabitsAPI.getHabitAnalytics).toBe('function');

    // Tasks API
    expect(typeof TasksAPI.getAllTasks).toBe('function');
    expect(typeof TasksAPI.getTask).toBe('function');
    expect(typeof TasksAPI.createTask).toBe('function');
    expect(typeof TasksAPI.updateTask).toBe('function');
    expect(typeof TasksAPI.deleteTask).toBe('function');
    expect(typeof TasksAPI.getAISuggestions).toBe('function');
    expect(typeof TasksAPI.batchOperations).toBe('function');

    // Goals API
    expect(typeof GoalsAPI.getAllGoals).toBe('function');
    expect(typeof GoalsAPI.getGoal).toBe('function');
    expect(typeof GoalsAPI.createGoal).toBe('function');
    expect(typeof GoalsAPI.updateGoal).toBe('function');
    expect(typeof GoalsAPI.deleteGoal).toBe('function');
    expect(typeof GoalsAPI.updateProgress).toBe('function');
    expect(typeof GoalsAPI.getGoalProgress).toBe('function');
    expect(typeof GoalsAPI.addMilestone).toBe('function');

    // Jobs API
    expect(typeof JobsAPI.getAllJobs).toBe('function');
    expect(typeof JobsAPI.getJob).toBe('function');
    expect(typeof JobsAPI.updateJobStatus).toBe('function');

    // Coach API
    expect(typeof CoachAPI.getChatHistory).toBe('function');
    expect(typeof CoachAPI.sendMessage).toBe('function');
    expect(typeof CoachAPI.getInsights).toBe('function');
  });

  it('should have agent classes available', () => {
    expect(HabitAgent).toBeDefined();
    expect(TaskAgent).toBeDefined();
    
    // Test agent instantiation
    const habitAgent = new HabitAgent('test-user');
    const taskAgent = new TaskAgent('test-user');
    
    expect(typeof habitAgent.analyzeHabits).toBe('function');
    expect(typeof habitAgent.monitorAndSuggest).toBe('function');
    expect(typeof habitAgent.predictSuccess).toBe('function');
    
    expect(typeof taskAgent.analyzeTasks).toBe('function');
    expect(typeof taskAgent.scheduleTask).toBe('function');
  });

  it('should export proper interfaces', () => {
    expect(HabitsAPI).toBeDefined();
    expect(TasksAPI).toBeDefined();
    expect(GoalsAPI).toBeDefined();
    expect(JobsAPI).toBeDefined();
    expect(CoachAPI).toBeDefined();
  });
});