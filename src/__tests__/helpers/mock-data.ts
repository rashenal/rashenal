// Mock data for testing

export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
};

export const mockHabits = [
  {
    id: 'meditation',
    name: 'Daily Meditation',
    category: 'mindfulness',
    streak: 12,
    completed: true,
    target: 15,
    current: 15,
    weekData: [true, true, false, true, true, true, true],
    color: 'purple',
    icon: '🧘'
  },
  {
    id: 'exercise',
    name: 'Daily Exercise',
    category: 'fitness',
    streak: 8,
    completed: false,
    target: 30,
    current: 0,
    weekData: [true, true, true, false, true, true, false],
    color: 'blue',
    icon: '💪'
  }
];

export const mockTasks = [
  {
    id: 'task-1',
    title: 'Complete project proposal',
    description: 'Write and submit the Q1 project proposal',
    status: 'TODO',
    priority: 'HIGH',
    owner: 'Test User',
    estimatedHours: 4,
    attachments: [],
    comments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    order: 0
  },
  {
    id: 'task-2',
    title: 'Review team feedback',
    description: 'Go through all team feedback from last sprint',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    owner: 'Test User',
    estimatedHours: 2,
    attachments: [],
    comments: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    order: 1
  }
];

export const mockJobMatches = [
  {
    id: 'job-1',
    title: 'Senior React Developer',
    company: 'Tech Corp',
    location: 'Remote',
    salary: '$90k - $120k',
    match_score: 95,
    date_posted: '2024-01-01',
    job_type: 'Full-time',
    experience_level: 'Senior',
    description: 'Looking for an experienced React developer...'
  },
  {
    id: 'job-2',
    title: 'Frontend Engineer',
    company: 'Startup Inc',
    location: 'San Francisco, CA',
    salary: '$80k - $100k',
    match_score: 87,
    date_posted: '2024-01-02',
    job_type: 'Full-time',
    experience_level: 'Mid-level',
    description: 'Join our growing frontend team...'
  }
];

export const mockGoals = [
  {
    id: 'goal-1',
    name: 'Learn TypeScript',
    progress: 75,
    streak: 5,
    target: 100,
    category: 'learning'
  },
  {
    id: 'goal-2',
    name: 'Exercise regularly',
    progress: 60,
    streak: 3,
    target: 100,
    category: 'health'
  }
];

export const mockSettings = {
  smartTasks: {
    showTitle: true,
    showDescription: true,
    showPriority: true,
    showOwner: true,
    showEstimatedHours: true,
    showComments: true,
    showAttachments: true,
    defaultView: 'kanban' as const,
    enableDragDrop: true,
    confirmDelete: true
  },
  habits: {
    showStreak: true,
    showTarget: true,
    showProgress: true,
    showIcon: true,
    showCategory: true,
    defaultView: 'circles' as const,
    weekStartDay: 'monday' as const
  },
  jobFinder: {
    showCompany: true,
    showSalary: true,
    showLocation: true,
    showMatchScore: true,
    showDatePosted: true,
    defaultSortOrder: 'match_score' as const,
    minMatchScore: 70
  },
  dashboard: {
    showHabitsWidget: true,
    showTasksWidget: true,
    showAchievementsWidget: true,
    layoutStyle: 'grid' as const,
    autoRefresh: true
  },
  goals: {
    showProgress: true,
    showStreaks: true,
    showTargets: true,
    progressStyle: 'bar' as const,
    enableGoalReminders: true
  }
};