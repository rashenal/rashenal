// Board Templates for Smart Tasks
// Pre-configured task boards for common life areas

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lifestyle' | 'career' | 'personal' | 'business' | 'education';
  icon: string;
  color: string;
  tasks: TemplateTask[];
  customColumns?: string[];
}

export interface TemplateTask {
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedHours?: number;
  tags?: string[];
  subtasks?: Omit<TemplateTask, 'subtasks'>[];
  order: number;
}

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'healthy-lifestyle',
    name: 'Healthy Lifestyle',
    description: 'Build sustainable healthy habits for physical and mental wellbeing',
    category: 'lifestyle',
    icon: '🌱',
    color: 'green',
    tasks: [
      {
        title: 'Create Weekly Meal Plan',
        description: 'Plan nutritious meals for the week including grocery list',
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedHours: 1,
        tags: ['nutrition', 'planning'],
        order: 1
      },
      {
        title: 'Establish Morning Routine',
        description: 'Design and implement a consistent morning routine (30-60 minutes)',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 2,
        tags: ['routine', 'self-care'],
        subtasks: [
          {
            title: 'Define wake-up time',
            description: 'Choose consistent time to wake up every day',
            status: 'BACKLOG',
            priority: 'MEDIUM',
            order: 1
          },
          {
            title: 'Plan morning activities',
            description: 'Choose 3-5 activities for morning routine',
            status: 'BACKLOG',
            priority: 'MEDIUM',
            order: 2
          },
          {
            title: 'Test routine for 1 week',
            description: 'Try new routine and adjust as needed',
            status: 'BACKLOG',
            priority: 'MEDIUM',
            order: 3
          }
        ],
        order: 2
      },
      {
        title: 'Start Regular Exercise Schedule',
        description: 'Plan and begin 3-4 exercise sessions per week',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 3,
        tags: ['fitness', 'routine'],
        order: 3
      },
      {
        title: 'Schedule Health Check-ups',
        description: 'Book annual physical, dental cleaning, and eye exam',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 2,
        tags: ['health', 'appointments'],
        order: 4
      },
      {
        title: 'Improve Sleep Hygiene',
        description: 'Optimize bedroom environment and bedtime routine for better sleep',
        status: 'BACKLOG',
        priority: 'HIGH',
        estimatedHours: 1,
        tags: ['sleep', 'environment'],
        order: 5
      },
      {
        title: 'Practice Daily Mindfulness',
        description: 'Incorporate 10-15 minutes of meditation or mindfulness practice',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 1,
        tags: ['mindfulness', 'mental-health'],
        order: 6
      }
    ]
  },

  {
    id: 'job-search',
    name: 'Job Search Campaign',
    description: 'Systematic approach to finding and landing your next role',
    category: 'career',
    icon: '🎯',
    color: 'blue',
    tasks: [
      {
        title: 'Update Resume and LinkedIn Profile',
        description: 'Refresh resume with latest experience and optimize LinkedIn',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 4,
        tags: ['resume', 'linkedin', 'branding'],
        subtasks: [
          {
            title: 'Update resume content',
            description: 'Add recent experience and achievements',
            status: 'BACKLOG',
            priority: 'HIGH',
            order: 1
          },
          {
            title: 'Optimize for ATS',
            description: 'Ensure resume passes applicant tracking systems',
            status: 'BACKLOG',
            priority: 'MEDIUM',
            order: 2
          },
          {
            title: 'Update LinkedIn profile',
            description: 'Sync LinkedIn with resume and add recent projects',
            status: 'BACKLOG',
            priority: 'MEDIUM',
            order: 3
          }
        ],
        order: 1
      },
      {
        title: 'Define Target Companies and Roles',
        description: 'Research and list 20-30 companies and specific positions',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 3,
        tags: ['research', 'targeting'],
        order: 2
      },
      {
        title: 'Set Up Job Alerts and Automation',
        description: 'Configure job boards and Rashenal to find relevant opportunities',
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedHours: 1,
        tags: ['automation', 'job-boards'],
        order: 3
      },
      {
        title: 'Prepare Interview Materials',
        description: 'Create portfolio, prepare answers, and practice scenarios',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 6,
        tags: ['interviews', 'preparation'],
        order: 4
      },
      {
        title: 'Network and Reach Out',
        description: 'Connect with professionals in target companies and industry',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 4,
        tags: ['networking', 'outreach'],
        order: 5
      },
      {
        title: 'Apply to 5 Jobs This Week',
        description: 'Submit tailored applications to 5 target positions',
        status: 'BACKLOG',
        priority: 'HIGH',
        estimatedHours: 8,
        tags: ['applications', 'weekly-goal'],
        order: 6
      }
    ]
  },

  {
    id: 'home-organization',
    name: 'Home Organization',
    description: 'Declutter and organize your living space for better productivity',
    category: 'lifestyle',
    icon: '🏠',
    color: 'orange',
    tasks: [
      {
        title: 'Declutter Main Living Areas',
        description: 'Remove unnecessary items from living room, kitchen, and bedroom',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 6,
        tags: ['declutter', 'cleaning'],
        order: 1
      },
      {
        title: 'Organize Home Office/Workspace',
        description: 'Create an efficient and inspiring work environment',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 3,
        tags: ['office', 'productivity'],
        order: 2
      },
      {
        title: 'Set Up Storage Systems',
        description: 'Install shelves, organizers, and storage solutions',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 4,
        tags: ['storage', 'organization'],
        order: 3
      },
      {
        title: 'Create Cleaning Schedule',
        description: 'Plan regular cleaning tasks and maintenance routines',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 1,
        tags: ['cleaning', 'schedule'],
        order: 4
      },
      {
        title: 'Digitize Important Documents',
        description: 'Scan and organize important papers and documents',
        status: 'BACKLOG',
        priority: 'LOW',
        estimatedHours: 2,
        tags: ['documents', 'digital'],
        order: 5
      }
    ]
  },

  {
    id: 'learning-development',
    name: 'Learning & Development',
    description: 'Continuous learning plan for personal and professional growth',
    category: 'education',
    icon: '📚',
    color: 'purple',
    tasks: [
      {
        title: 'Choose Learning Goal for This Quarter',
        description: 'Select one main skill or knowledge area to focus on',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 1,
        tags: ['planning', 'goals'],
        order: 1
      },
      {
        title: 'Create Study Schedule',
        description: 'Plan regular study sessions and learning activities',
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedHours: 1,
        tags: ['schedule', 'planning'],
        order: 2
      },
      {
        title: 'Gather Learning Resources',
        description: 'Find books, courses, videos, and other materials',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 2,
        tags: ['resources', 'research'],
        order: 3
      },
      {
        title: 'Join Relevant Community or Group',
        description: 'Connect with others learning the same skills',
        status: 'BACKLOG',
        priority: 'LOW',
        estimatedHours: 1,
        tags: ['community', 'networking'],
        order: 4
      },
      {
        title: 'Practice Through Projects',
        description: 'Apply new knowledge through hands-on projects',
        status: 'BACKLOG',
        priority: 'HIGH',
        estimatedHours: 8,
        tags: ['practice', 'projects'],
        order: 5
      }
    ]
  },

  {
    id: 'side-business',
    name: 'Side Business Launch',
    description: 'Start and grow a side business or freelance venture',
    category: 'business',
    icon: '💼',
    color: 'indigo',
    tasks: [
      {
        title: 'Validate Business Idea',
        description: 'Research market demand and competition for your idea',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 4,
        tags: ['research', 'validation'],
        order: 1
      },
      {
        title: 'Create Business Plan',
        description: 'Write simple business plan with goals and strategy',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 6,
        tags: ['planning', 'strategy'],
        order: 2
      },
      {
        title: 'Set Up Legal Structure',
        description: 'Register business, get licenses, set up accounting',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 4,
        tags: ['legal', 'admin'],
        order: 3
      },
      {
        title: 'Build Minimum Viable Product',
        description: 'Create simple version of your product or service',
        status: 'BACKLOG',
        priority: 'HIGH',
        estimatedHours: 20,
        tags: ['product', 'development'],
        order: 4
      },
      {
        title: 'Launch Marketing Campaign',
        description: 'Create website, social media, and marketing materials',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 8,
        tags: ['marketing', 'promotion'],
        order: 5
      }
    ]
  },

  {
    id: 'financial-wellness',
    name: 'Financial Wellness',
    description: 'Improve your financial health and build wealth',
    category: 'personal',
    icon: '💰',
    color: 'emerald',
    tasks: [
      {
        title: 'Create Monthly Budget',
        description: 'Track income and expenses, set spending limits',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 2,
        tags: ['budget', 'planning'],
        order: 1
      },
      {
        title: 'Build Emergency Fund',
        description: 'Save 3-6 months of expenses for emergencies',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 1,
        tags: ['savings', 'emergency'],
        order: 2
      },
      {
        title: 'Review and Optimize Investments',
        description: 'Analyze current investments and retirement accounts',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 3,
        tags: ['investments', 'retirement'],
        order: 3
      },
      {
        title: 'Improve Credit Score',
        description: 'Check credit report and take steps to improve score',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 2,
        tags: ['credit', 'improvement'],
        order: 4
      },
      {
        title: 'Plan Major Financial Goals',
        description: 'Set targets for home purchase, education, or other big goals',
        status: 'BACKLOG',
        priority: 'LOW',
        estimatedHours: 2,
        tags: ['goals', 'planning'],
        order: 5
      }
    ]
  },

  {
    id: 'relationship-building',
    name: 'Relationship Building',
    description: 'Strengthen personal and professional relationships',
    category: 'personal',
    icon: '🤝',
    color: 'pink',
    tasks: [
      {
        title: 'Schedule Quality Time with Family',
        description: 'Plan regular activities and meaningful conversations',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 2,
        tags: ['family', 'quality-time'],
        order: 1
      },
      {
        title: 'Reconnect with Old Friends',
        description: 'Reach out to friends you haven\'t spoken to in a while',
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedHours: 2,
        tags: ['friends', 'reconnection'],
        order: 2
      },
      {
        title: 'Join Social Group or Club',
        description: 'Find and participate in activities to meet new people',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 3,
        tags: ['social', 'networking'],
        order: 3
      },
      {
        title: 'Improve Communication Skills',
        description: 'Practice active listening and assertive communication',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        estimatedHours: 4,
        tags: ['communication', 'skills'],
        order: 4
      },
      {
        title: 'Express Gratitude Regularly',
        description: 'Thank and appreciate people in your life more often',
        status: 'BACKLOG',
        priority: 'LOW',
        estimatedHours: 1,
        tags: ['gratitude', 'appreciation'],
        order: 5
      }
    ]
  }
];

export const getBoardTemplateById = (id: string): BoardTemplate | undefined => {
  return boardTemplates.find(template => template.id === id);
};

export const getBoardTemplatesByCategory = (category: BoardTemplate['category']): BoardTemplate[] => {
  return boardTemplates.filter(template => template.category === category);
};

export const createBoardFromTemplate = (template: BoardTemplate, userId: string, customName?: string) => {
  return {
    name: customName || template.name,
    description: template.description,
    user_id: userId,
    color: template.color,
    icon: template.icon,
    template_id: template.id,
    settings: {
      template_used: template.name,
      created_from_template: true
    }
  };
};

export const createTasksFromTemplate = (template: BoardTemplate, boardId: string, userId: string) => {
  return template.tasks.map(task => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    user_id: userId,
    taskboard_id: boardId,
    estimated_hours: task.estimatedHours,
    tags: task.tags || [],
    position: task.order,
    template_task: true,
    subtasks: task.subtasks?.map(subtask => ({
      title: subtask.title,
      description: subtask.description,
      status: subtask.status,
      priority: subtask.priority,
      user_id: userId,
      taskboard_id: boardId,
      tags: subtask.tags || [],
      position: subtask.order
    })) || []
  }));
};