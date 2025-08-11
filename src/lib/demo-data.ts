// Demo Data Generator for Charts and Dashboards
// Pre-populated data to make the platform look engaging and functional

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  activeHabits: number;
  streakDays: number;
  jobApplications: number;
  points: number;
  level: number;
  achievements: number;
}

// Generate realistic habit completion data for the last 30 days
export const generateHabitCompletionData = (habitName: string = 'Exercise'): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Simulate realistic habit completion patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Higher completion rate on weekdays, some variation
    let baseRate = isWeekend ? 0.6 : 0.8;
    
    // Add some randomness and weekly patterns
    const randomFactor = Math.random() * 0.4 - 0.2; // -0.2 to +0.2
    baseRate += randomFactor;
    
    // Clamp between 0 and 1
    const completionRate = Math.max(0, Math.min(1, baseRate));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: completionRate,
      label: habitName,
      category: 'habit'
    });
  }
  
  return data;
};

// Generate task completion trends
export const generateTaskCompletionData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  // Generate weekly data for last 12 weeks
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - (i * 7));
    
    // Simulate task completion trend
    const baseCompletions = 15 + Math.random() * 10; // 15-25 tasks per week
    const trend = (11 - i) * 0.5; // Slight upward trend
    const completions = Math.round(baseCompletions + trend + (Math.random() * 5 - 2.5));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: completions,
      label: `Week ${i + 1}`,
      category: 'tasks'
    });
  }
  
  return data;
};

// Generate job application activity
export const generateJobApplicationData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  
  // Generate last 8 weeks of job activity
  for (let i = 7; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - (i * 7));
    
    statuses.forEach(status => {
      let count = 0;
      switch (status) {
        case 'Applied':
          count = Math.floor(Math.random() * 5) + 2; // 2-6 applications per week
          break;
        case 'Interview':
          count = Math.floor(Math.random() * 3); // 0-2 interviews per week
          break;
        case 'Offer':
          count = Math.random() > 0.8 ? 1 : 0; // 20% chance of offer
          break;
        case 'Rejected':
          count = Math.floor(Math.random() * 2); // 0-1 rejections per week
          break;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: count,
        label: status,
        category: 'job_search'
      });
    });
  }
  
  return data;
};

// Generate points and level progression
export const generatePointsData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  let cumulativePoints = 0;
  
  // Generate daily points for last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Simulate daily points earned
    const dailyPoints = Math.floor(Math.random() * 50) + 10; // 10-60 points per day
    cumulativePoints += dailyPoints;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: cumulativePoints,
      label: `+${dailyPoints} points`,
      category: 'gamification'
    });
  }
  
  return data;
};

// Generate comprehensive dashboard stats
export const generateDashboardStats = (): DashboardStats => {
  const completedTasks = Math.floor(Math.random() * 150) + 200; // 200-349
  const totalTasks = completedTasks + Math.floor(Math.random() * 50) + 25; // Add 25-74 pending tasks
  
  return {
    totalTasks,
    completedTasks,
    activeHabits: Math.floor(Math.random() * 8) + 5, // 5-12 active habits
    streakDays: Math.floor(Math.random() * 45) + 7, // 7-51 day streak
    jobApplications: Math.floor(Math.random() * 25) + 15, // 15-39 applications
    points: Math.floor(Math.random() * 2000) + 3500, // 3500-5499 points
    level: Math.floor(Math.random() * 8) + 12, // Level 12-19
    achievements: Math.floor(Math.random() * 15) + 8 // 8-22 achievements
  };
};

// Generate habit streak data for multiple habits
export const generateHabitsOverview = () => {
  const habits = [
    { name: 'Exercise', icon: '💪', color: 'blue' },
    { name: 'Meditation', icon: '🧘', color: 'purple' },
    { name: 'Reading', icon: '📚', color: 'green' },
    { name: 'Water Intake', icon: '💧', color: 'cyan' },
    { name: 'Sleep 8hrs', icon: '😴', color: 'indigo' },
    { name: 'Healthy Eating', icon: '🥗', color: 'emerald' }
  ];
  
  return habits.map(habit => ({
    ...habit,
    currentStreak: Math.floor(Math.random() * 30) + 1,
    completionRate: Math.round((Math.random() * 30 + 70) * 100) / 100, // 70-100%
    weeklyData: generateHabitCompletionData(habit.name).slice(-7) // Last 7 days
  }));
};

// Generate task completion by category
export const generateTasksByCategory = () => {
  const categories = [
    { name: 'Work/Career', color: 'blue' },
    { name: 'Health/Fitness', color: 'green' },
    { name: 'Personal Development', color: 'purple' },
    { name: 'Relationships', color: 'pink' },
    { name: 'Finance', color: 'yellow' },
    { name: 'Home/Organization', color: 'orange' }
  ];
  
  return categories.map(category => ({
    ...category,
    completed: Math.floor(Math.random() * 25) + 10, // 10-34 completed
    total: Math.floor(Math.random() * 15) + 35, // 35-49 total
    percentage: Math.round((Math.random() * 30 + 60) * 100) / 100 // 60-90%
  }));
};

// Generate recent achievements
export const generateRecentAchievements = () => {
  const achievements = [
    { 
      name: 'Streak Master', 
      description: 'Maintained a 30-day habit streak', 
      icon: '🔥', 
      earnedDate: '2025-01-07',
      points: 500
    },
    { 
      name: 'Task Crusher', 
      description: 'Completed 100 tasks', 
      icon: '⚡', 
      earnedDate: '2025-01-05',
      points: 250
    },
    { 
      name: 'Early Bird', 
      description: 'Completed morning routine 7 days in a row', 
      icon: '🌅', 
      earnedDate: '2025-01-03',
      points: 150
    },
    { 
      name: 'Goal Achiever', 
      description: 'Completed your first major goal', 
      icon: '🎯', 
      earnedDate: '2024-12-28',
      points: 300
    },
    { 
      name: 'Social Butterfly', 
      description: 'Helped 10 community members', 
      icon: '🤝', 
      earnedDate: '2024-12-25',
      points: 200
    }
  ];
  
  return achievements;
};

// Generate job search analytics
export const generateJobSearchAnalytics = () => {
  return {
    applications: {
      total: Math.floor(Math.random() * 40) + 30, // 30-69
      thisWeek: Math.floor(Math.random() * 8) + 3, // 3-10
      responseRate: Math.round((Math.random() * 20 + 15) * 100) / 100 // 15-35%
    },
    interviews: {
      scheduled: Math.floor(Math.random() * 5) + 2, // 2-6
      completed: Math.floor(Math.random() * 8) + 5, // 5-12
      successRate: Math.round((Math.random() * 30 + 60) * 100) / 100 // 60-90%
    },
    offers: {
      received: Math.floor(Math.random() * 3) + 1, // 1-3
      pending: Math.random() > 0.5 ? 1 : 0, // 50% chance
      avgSalary: Math.floor(Math.random() * 40000) + 80000 // $80k-120k
    },
    topCompanies: [
      { name: 'TechCorp Inc.', applications: 3, responses: 1 },
      { name: 'Innovation Labs', applications: 2, responses: 2 },
      { name: 'Future Systems', applications: 4, responses: 1 },
      { name: 'Digital Solutions', applications: 2, responses: 0 },
      { name: 'NextGen Tech', applications: 1, responses: 1 }
    ]
  };
};

// Generate community leaderboard
export const generateCommunityLeaderboard = () => {
  const users = [
    'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emily Davis', 
    'David Kim', 'Jessica Brown', 'Ryan Wilson', 'Lisa Anderson'
  ];
  
  return users.map((name, index) => ({
    rank: index + 1,
    name: name,
    points: Math.floor(Math.random() * 1000) + (8 - index) * 500, // Decreasing points
    level: Math.floor(Math.random() * 5) + (8 - index) + 10, // Level 10-22
    achievements: Math.floor(Math.random() * 10) + (8 - index) * 2, // More achievements for higher ranks
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
  })).sort((a, b) => b.points - a.points);
};

// Main function to generate all demo data
export const generateAllDemoData = () => {
  return {
    dashboardStats: generateDashboardStats(),
    habitCompletion: generateHabitCompletionData(),
    taskCompletion: generateTaskCompletionData(),
    jobApplications: generateJobApplicationData(),
    pointsProgression: generatePointsData(),
    habitsOverview: generateHabitsOverview(),
    tasksByCategory: generateTasksByCategory(),
    recentAchievements: generateRecentAchievements(),
    jobSearchAnalytics: generateJobSearchAnalytics(),
    communityLeaderboard: generateCommunityLeaderboard()
  };
};

// Export individual generators for specific use cases
export {
  generateHabitCompletionData,
  generateTaskCompletionData,
  generateJobApplicationData,
  generatePointsData,
  generateDashboardStats,
  generateHabitsOverview,
  generateTasksByCategory,
  generateRecentAchievements,
  generateJobSearchAnalytics,
  generateCommunityLeaderboard
};