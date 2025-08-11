/**
 * Pre-built Board Templates
 * Comprehensive collection of templates for various use cases
 */

import { TaskBoardTemplate, TaskTemplate, TaskColumn } from '../types/TaskBoard';

export const TEMPLATE_CATEGORIES = {
  personal: { name: 'Personal Development', icon: '🌱' },
  professional: { name: 'Professional', icon: '💼' },
  wellness: { name: 'Health & Wellness', icon: '💪' },
  education: { name: 'Education', icon: '🎓' },
  project_management: { name: 'Project Management', icon: '📊' }
};

export const BOARD_TEMPLATES: TaskBoardTemplate[] = [
  {
    id: 'savers-morning-miracle',
    name: 'SAVERS Morning Miracle',
    description: 'Transform your mornings with the life-changing SAVERS routine: Silence, Affirmations, Visualization, Exercise, Reading, and Scribing.',
    category: 'personal',
    icon: '🌅',
    color_scheme: 'gradient-to-r from-orange-400 to-pink-400',
    difficulty_level: 'beginner',
    estimated_completion_time: '6-8 weeks to establish routine',
    created_by: 'system',
    is_public: true,
    usage_count: 0,
    rating: 4.9,
    tags: ['morning routine', 'personal development', 'habits', 'miracle morning', 'self-improvement'],
    columns: [
      {
        id: 'savers-setup',
        board_id: 'savers-morning-miracle',
        name: 'Setup & Planning',
        description: 'Prepare your SAVERS routine foundation',
        color: 'blue',
        position: 0,
        is_completion_column: false
      },
      {
        id: 'savers-daily',
        board_id: 'savers-morning-miracle',
        name: 'Daily Practice',
        description: 'Your daily SAVERS activities',
        color: 'yellow',
        position: 1,
        is_completion_column: false
      },
      {
        id: 'savers-weekly',
        board_id: 'savers-morning-miracle',
        name: 'Weekly Reflection',
        description: 'Weekly review and optimization',
        color: 'purple',
        position: 2,
        is_completion_column: false
      },
      {
        id: 'savers-mastered',
        board_id: 'savers-morning-miracle',
        name: 'Mastered',
        description: 'Fully integrated habits',
        color: 'green',
        position: 3,
        is_completion_column: true
      }
    ],
    default_tasks: [
      {
        id: 'silence-setup',
        template_id: 'savers-morning-miracle',
        title: '🧘 Set up Silence Practice Space',
        description: 'Create a peaceful area for meditation, prayer, or quiet reflection. Include comfortable seating, minimal distractions, and any spiritual items that resonate with you.',
        column_name: 'Setup & Planning',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 30,
        tags: ['silence', 'meditation', 'setup'],
        position: 0,
        sub_task_templates: [
          { title: 'Choose quiet location in home', position: 0, estimated_duration: 10 },
          { title: 'Gather meditation cushion/chair', position: 1, estimated_duration: 10 },
          { title: 'Remove distractions (phone, clutter)', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'affirmations-create',
        template_id: 'savers-morning-miracle',
        title: '💪 Create Personal Affirmations',
        description: 'Write 5-10 powerful affirmations that align with your goals, values, and desired identity. Make them specific, positive, and in present tense.',
        column_name: 'Setup & Planning',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['affirmations', 'mindset', 'goals'],
        position: 1,
        sub_task_templates: [
          { title: 'Identify top 3 life goals', position: 0, estimated_duration: 15 },
          { title: 'Write affirmations for each goal', position: 1, estimated_duration: 20 },
          { title: 'Record affirmations audio (optional)', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'visualization-board',
        template_id: 'savers-morning-miracle',
        title: '🎯 Create Visualization Vision Board',
        description: 'Design a compelling vision board with images, words, and symbols that represent your ideal future. Use digital tools or physical materials.',
        column_name: 'Setup & Planning',
        priority: 'medium',
        energy_level: 'l',
        estimated_duration: 60,
        tags: ['visualization', 'vision board', 'goals'],
        position: 2,
        sub_task_templates: [
          { title: 'Collect inspiring images and quotes', position: 0, estimated_duration: 30 },
          { title: 'Arrange and design vision board', position: 1, estimated_duration: 20 },
          { title: 'Place in visible morning location', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'daily-silence',
        template_id: 'savers-morning-miracle',
        title: '🧘 Daily Silence (5-20 minutes)',
        description: 'Practice daily silence through meditation, prayer, deep breathing, or mindful reflection. Start with 5 minutes and gradually increase.',
        column_name: 'Daily Practice',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 15,
        tags: ['silence', 'meditation', 'daily'],
        position: 0,
        sub_task_templates: []
      },
      {
        id: 'daily-affirmations',
        template_id: 'savers-morning-miracle',
        title: '💪 Daily Affirmations (5-10 minutes)',
        description: 'Read, recite, or listen to your personal affirmations with conviction and emotion. Visualize yourself embodying these qualities.',
        column_name: 'Daily Practice',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 10,
        tags: ['affirmations', 'mindset', 'daily'],
        position: 1,
        sub_task_templates: []
      },
      {
        id: 'daily-visualization',
        template_id: 'savers-morning-miracle',
        title: '🎯 Daily Visualization (5-10 minutes)',
        description: 'Visualize your ideal day, goals achieved, and desired outcomes. Use all senses to make the experience vivid and emotionally engaging.',
        column_name: 'Daily Practice',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 10,
        tags: ['visualization', 'goals', 'daily'],
        position: 2,
        sub_task_templates: []
      },
      {
        id: 'daily-exercise',
        template_id: 'savers-morning-miracle',
        title: '🏃 Daily Exercise (10-30 minutes)',
        description: 'Engage in physical activity to energize your body and mind. Can be yoga, stretching, calisthenics, or brief cardio.',
        column_name: 'Daily Practice',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 20,
        tags: ['exercise', 'fitness', 'daily'],
        position: 3,
        sub_task_templates: []
      },
      {
        id: 'daily-reading',
        template_id: 'savers-morning-miracle',
        title: '📚 Daily Reading (10-30 minutes)',
        description: 'Read personal development, spiritual, or educational content that inspires and educates you. Focus on growth-oriented material.',
        column_name: 'Daily Practice',
        priority: 'medium',
        energy_level: 's',
        estimated_duration: 20,
        tags: ['reading', 'learning', 'daily'],
        position: 4,
        sub_task_templates: []
      },
      {
        id: 'daily-scribing',
        template_id: 'savers-morning-miracle',
        title: '✍️ Daily Scribing (5-15 minutes)',
        description: 'Write in a journal, capturing thoughts, gratitude, goals, or insights. Use prompts or free-form writing as preferred.',
        column_name: 'Daily Practice',
        priority: 'medium',
        energy_level: 's',
        estimated_duration: 15,
        tags: ['scribing', 'journaling', 'daily'],
        position: 5,
        sub_task_templates: []
      }
    ],
    ai_customization_prompts: {
      context_questions: [
        'What time do you typically wake up, and how much time can you dedicate to your morning routine?',
        'Do you have any spiritual or religious practices you\'d like to incorporate?',
        'What are your top 3 life goals that your affirmations should focus on?',
        'Do you prefer physical exercise, gentle movement, or stretching in the morning?',
        'What type of reading material most inspires you (business, spiritual, self-help, etc.)?'
      ],
      customization_areas: [
        'Adjust timing based on available morning time',
        'Incorporate specific spiritual/religious practices',
        'Customize affirmations for user goals',
        'Tailor exercise recommendations to fitness level',
        'Suggest relevant reading materials'
      ],
      success_metrics: [
        'Consistency in daily practice',
        'Increased morning energy and motivation',
        'Progress toward stated goals',
        'Improved overall well-being metrics'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'wellness-weight-loss',
    name: 'Wellness & Weight Loss Journey',
    description: 'A holistic approach to sustainable weight loss focusing on nutrition, exercise, mindset, and lifestyle changes for long-term success.',
    category: 'wellness',
    icon: '💪',
    color_scheme: 'gradient-to-r from-green-400 to-emerald-500',
    difficulty_level: 'intermediate',
    estimated_completion_time: '12-16 weeks for initial goals',
    created_by: 'system',
    is_public: true,
    usage_count: 0,
    rating: 4.8,
    tags: ['weight loss', 'fitness', 'nutrition', 'wellness', 'health'],
    columns: [
      {
        id: 'wellness-foundation',
        board_id: 'wellness-weight-loss',
        name: 'Foundation Setup',
        description: 'Establish baseline and essential tools',
        color: 'blue',
        position: 0,
        is_completion_column: false
      },
      {
        id: 'wellness-planning',
        board_id: 'wellness-weight-loss',
        name: 'Weekly Planning',
        description: 'Plan meals, workouts, and wellness activities',
        color: 'yellow',
        position: 1,
        is_completion_column: false
      },
      {
        id: 'wellness-action',
        board_id: 'wellness-weight-loss',
        name: 'Daily Actions',
        description: 'Daily nutrition and fitness activities',
        color: 'orange',
        position: 2,
        is_completion_column: false
      },
      {
        id: 'wellness-achieved',
        board_id: 'wellness-weight-loss',
        name: 'Achieved',
        description: 'Completed milestones and habits',
        color: 'green',
        position: 3,
        is_completion_column: true
      }
    ],
    default_tasks: [
      {
        id: 'baseline-measurements',
        template_id: 'wellness-weight-loss',
        title: '📏 Take Baseline Measurements',
        description: 'Record starting weight, body measurements, progress photos, and fitness baseline. This data will help track progress objectively.',
        column_name: 'Foundation Setup',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 30,
        tags: ['measurements', 'baseline', 'tracking'],
        position: 0,
        sub_task_templates: [
          { title: 'Weigh yourself at same time of day', position: 0, estimated_duration: 5 },
          { title: 'Measure waist, hips, arms, thighs', position: 1, estimated_duration: 10 },
          { title: 'Take progress photos (front, side, back)', position: 2, estimated_duration: 10 },
          { title: 'Record fitness baseline (push-ups, walk time)', position: 3, estimated_duration: 15 }
        ]
      },
      {
        id: 'nutrition-plan',
        template_id: 'wellness-weight-loss',
        title: '🥗 Create Personalized Nutrition Plan',
        description: 'Develop a sustainable eating plan based on your preferences, dietary needs, and weight loss goals. Focus on whole foods and balanced macros.',
        column_name: 'Foundation Setup',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 90,
        tags: ['nutrition', 'meal planning', 'diet'],
        position: 1,
        sub_task_templates: [
          { title: 'Calculate daily calorie needs', position: 0, estimated_duration: 15 },
          { title: 'Plan macro distribution (protein/carbs/fat)', position: 1, estimated_duration: 20 },
          { title: 'Create meal templates for breakfast/lunch/dinner', position: 2, estimated_duration: 45 },
          { title: 'Identify healthy snack options', position: 3, estimated_duration: 10 }
        ]
      },
      {
        id: 'workout-routine',
        template_id: 'wellness-weight-loss',
        title: '🏋️ Design Workout Routine',
        description: 'Create a balanced exercise program combining cardio and strength training. Start with 3-4 sessions per week and gradually increase intensity.',
        column_name: 'Foundation Setup',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 60,
        tags: ['exercise', 'workout plan', 'fitness'],
        position: 2,
        sub_task_templates: [
          { title: 'Choose preferred cardio activities', position: 0, estimated_duration: 15 },
          { title: 'Design strength training routine', position: 1, estimated_duration: 30 },
          { title: 'Schedule workout days and times', position: 2, estimated_duration: 15 }
        ]
      },
      {
        id: 'meal-prep-sunday',
        template_id: 'wellness-weight-loss',
        title: '🍽️ Weekly Meal Prep',
        description: 'Prepare meals and snacks for the week ahead. Batch cook proteins, chop vegetables, and portion out meals to save time and ensure healthy choices.',
        column_name: 'Weekly Planning',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 120,
        tags: ['meal prep', 'planning', 'nutrition'],
        position: 0,
        sub_task_templates: [
          { title: 'Plan weekly menu based on nutrition goals', position: 0, estimated_duration: 20 },
          { title: 'Create shopping list', position: 1, estimated_duration: 10 },
          { title: 'Batch cook proteins and grains', position: 2, estimated_duration: 60 },
          { title: 'Portion and store meals', position: 3, estimated_duration: 30 }
        ]
      },
      {
        id: 'weekly-weigh-in',
        template_id: 'wellness-weight-loss',
        title: '⚖️ Weekly Progress Check',
        description: 'Track progress with measurements, photos, and reflection on the past week. Adjust plan if needed based on results and energy levels.',
        column_name: 'Weekly Planning',
        priority: 'medium',
        energy_level: 's',
        estimated_duration: 20,
        tags: ['progress tracking', 'measurements', 'reflection'],
        position: 1,
        sub_task_templates: [
          { title: 'Record weight at consistent time', position: 0, estimated_duration: 5 },
          { title: 'Take progress photos', position: 1, estimated_duration: 5 },
          { title: 'Reflect on week\'s challenges and wins', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'daily-nutrition-log',
        template_id: 'wellness-weight-loss',
        title: '📝 Daily Food Logging',
        description: 'Track daily food intake, water consumption, and energy levels. Use an app or journal to maintain awareness of eating patterns.',
        column_name: 'Daily Actions',
        priority: 'high',
        energy_level: 'xs',
        estimated_duration: 10,
        tags: ['nutrition tracking', 'daily', 'awareness'],
        position: 0,
        sub_task_templates: []
      },
      {
        id: 'daily-workout',
        template_id: 'wellness-weight-loss',
        title: '💪 Daily Movement/Workout',
        description: 'Complete scheduled workout or engage in at least 30 minutes of purposeful movement. Listen to your body and adjust intensity as needed.',
        column_name: 'Daily Actions',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['exercise', 'daily', 'movement'],
        position: 1,
        sub_task_templates: []
      },
      {
        id: 'hydration-goal',
        template_id: 'wellness-weight-loss',
        title: '💧 Daily Hydration Goal',
        description: 'Drink adequate water throughout the day (aim for 8-10 glasses or half your body weight in ounces). Track intake to build consistent habits.',
        column_name: 'Daily Actions',
        priority: 'medium',
        energy_level: 'xs',
        estimated_duration: 5,
        tags: ['hydration', 'daily', 'health'],
        position: 2,
        sub_task_templates: []
      }
    ],
    ai_customization_prompts: {
      context_questions: [
        'What is your current weight and target weight goal?',
        'Do you have any dietary restrictions or food preferences?',
        'What is your current activity level and available workout time?',
        'Do you have access to a gym, or do you prefer home workouts?',
        'What has been your biggest challenge with weight loss in the past?'
      ],
      customization_areas: [
        'Adjust calorie goals based on current weight and targets',
        'Customize meal plans for dietary restrictions',
        'Tailor workout routines to available equipment and time',
        'Address past challenges with specific strategies',
        'Set realistic timeline expectations'
      ],
      success_metrics: [
        'Consistent weight loss (1-2 lbs per week)',
        'Improved energy levels and fitness',
        'Adherence to nutrition and exercise plan',
        'Positive changes in body composition'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'scrum-master-board',
    name: 'Scrum Master Excellence',
    description: 'Complete Scrum Master workflow covering sprint planning, facilitation, team coaching, and continuous improvement. Perfect for new and experienced Scrum Masters.',
    category: 'project_management',
    icon: '🏃‍♂️',
    color_scheme: 'gradient-to-r from-blue-500 to-indigo-600',
    difficulty_level: 'intermediate',
    estimated_completion_time: 'Ongoing sprint cycles',
    created_by: 'system',
    is_public: true,
    usage_count: 0,
    rating: 4.9,
    tags: ['scrum', 'agile', 'project management', 'sprint', 'team facilitation'],
    columns: [
      {
        id: 'sprint-planning',
        board_id: 'scrum-master-board',
        name: 'Sprint Planning',
        description: 'Prepare for upcoming sprint',
        color: 'blue',
        position: 0,
        is_completion_column: false
      },
      {
        id: 'sprint-execution',
        board_id: 'scrum-master-board',
        name: 'Sprint Execution',
        description: 'Daily sprint activities and facilitation',
        color: 'orange',
        position: 1,
        is_completion_column: false
      },
      {
        id: 'sprint-review',
        board_id: 'scrum-master-board',
        name: 'Sprint Review & Retro',
        description: 'End of sprint ceremonies and reflection',
        color: 'purple',
        position: 2,
        is_completion_column: false
      },
      {
        id: 'continuous-improvement',
        board_id: 'scrum-master-board',
        name: 'Continuous Improvement',
        description: 'Team coaching and process optimization',
        color: 'green',
        position: 3,
        is_completion_column: true
      }
    ],
    default_tasks: [
      {
        id: 'sprint-goal-definition',
        template_id: 'scrum-master-board',
        title: '🎯 Define Sprint Goal',
        description: 'Work with Product Owner to create a clear, achievable sprint goal that provides focus and direction for the team during the upcoming sprint.',
        column_name: 'Sprint Planning',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 30,
        tags: ['sprint goal', 'planning', 'product owner'],
        position: 0,
        sub_task_templates: [
          { title: 'Review product backlog priorities', position: 0, estimated_duration: 10 },
          { title: 'Discuss business objectives with PO', position: 1, estimated_duration: 15 },
          { title: 'Craft clear, measurable sprint goal', position: 2, estimated_duration: 5 }
        ]
      },
      {
        id: 'capacity-planning',
        template_id: 'scrum-master-board',
        title: '📊 Team Capacity Planning',
        description: 'Calculate team capacity for the sprint considering holidays, planned absences, and historical velocity data.',
        column_name: 'Sprint Planning',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 20,
        tags: ['capacity', 'velocity', 'planning'],
        position: 1,
        sub_task_templates: [
          { title: 'Check team member availability', position: 0, estimated_duration: 5 },
          { title: 'Review previous sprint velocity', position: 1, estimated_duration: 10 },
          { title: 'Calculate adjusted capacity', position: 2, estimated_duration: 5 }
        ]
      },
      {
        id: 'daily-standup',
        template_id: 'scrum-master-board',
        title: '🗣️ Facilitate Daily Standup',
        description: 'Lead daily standup meetings focusing on progress, blockers, and team coordination. Keep it focused and time-boxed to 15 minutes.',
        column_name: 'Sprint Execution',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 15,
        tags: ['daily standup', 'facilitation', 'blockers'],
        position: 0,
        sub_task_templates: [
          { title: 'Review sprint board before meeting', position: 0, estimated_duration: 5 },
          { title: 'Facilitate standup discussion', position: 1, estimated_duration: 15 },
          { title: 'Follow up on identified blockers', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'impediment-removal',
        template_id: 'scrum-master-board',
        title: '🚧 Remove Team Impediments',
        description: 'Actively identify and remove blockers that prevent the team from achieving their sprint goal. Coach team members on self-organization.',
        column_name: 'Sprint Execution',
        priority: 'urgent',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['impediments', 'blockers', 'problem solving'],
        position: 1,
        sub_task_templates: [
          { title: 'Document current impediments', position: 0, estimated_duration: 10 },
          { title: 'Prioritize by impact on sprint goal', position: 1, estimated_duration: 10 },
          { title: 'Take action to resolve top impediments', position: 2, estimated_duration: 25 }
        ]
      },
      {
        id: 'sprint-review-prep',
        template_id: 'scrum-master-board',
        title: '📋 Prepare Sprint Review',
        description: 'Organize sprint review meeting with stakeholders to demonstrate completed work and gather feedback on the product increment.',
        column_name: 'Sprint Review & Retro',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 40,
        tags: ['sprint review', 'stakeholders', 'demo'],
        position: 0,
        sub_task_templates: [
          { title: 'Confirm completed stories for demo', position: 0, estimated_duration: 10 },
          { title: 'Invite stakeholders and prepare agenda', position: 1, estimated_duration: 15 },
          { title: 'Set up demo environment', position: 2, estimated_duration: 15 }
        ]
      },
      {
        id: 'retrospective-facilitation',
        template_id: 'scrum-master-board',
        title: '🔄 Facilitate Sprint Retrospective',
        description: 'Lead team retrospective to identify what went well, what could be improved, and create actionable items for the next sprint.',
        column_name: 'Sprint Review & Retro',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 90,
        tags: ['retrospective', 'continuous improvement', 'team building'],
        position: 1,
        sub_task_templates: [
          { title: 'Choose retrospective format/technique', position: 0, estimated_duration: 10 },
          { title: 'Facilitate retrospective discussion', position: 1, estimated_duration: 60 },
          { title: 'Document action items and owners', position: 2, estimated_duration: 20 }
        ]
      }
    ],
    ai_customization_prompts: {
      context_questions: [
        'How experienced is your development team with Scrum practices?',
        'What is your typical sprint length (1-4 weeks)?',
        'What are the biggest challenges your team currently faces?',
        'Do you work with distributed/remote team members?',
        'What tools does your team use for sprint management (Jira, Azure DevOps, etc.)?'
      ],
      customization_areas: [
        'Adjust ceremony durations based on team size',
        'Add specific coaching activities for team maturity level',
        'Include remote team collaboration best practices',
        'Customize tool-specific workflows',
        'Address specific team challenges with targeted activities'
      ],
      success_metrics: [
        'Sprint goal achievement rate',
        'Team velocity consistency',
        'Reduced impediment resolution time',
        'Improved team satisfaction scores'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'product-owner-board',
    name: 'Product Owner Mastery',
    description: 'Comprehensive Product Owner workflow covering stakeholder management, backlog refinement, user story creation, and product strategy execution.',
    category: 'project_management',
    icon: '🎯',
    color_scheme: 'gradient-to-r from-purple-500 to-pink-500',
    difficulty_level: 'advanced',
    estimated_completion_time: 'Ongoing product cycles',
    created_by: 'system',
    is_public: true,
    usage_count: 0,
    rating: 4.8,
    tags: ['product owner', 'backlog', 'user stories', 'stakeholders', 'product strategy'],
    columns: [
      {
        id: 'strategy-planning',
        board_id: 'product-owner-board',
        name: 'Strategy & Planning',
        description: 'Product vision and roadmap activities',
        color: 'purple',
        position: 0,
        is_completion_column: false
      },
      {
        id: 'backlog-management',
        board_id: 'product-owner-board',
        name: 'Backlog Management',
        description: 'Backlog refinement and prioritization',
        color: 'blue',
        position: 1,
        is_completion_column: false
      },
      {
        id: 'stakeholder-engagement',
        board_id: 'product-owner-board',
        name: 'Stakeholder Engagement',
        description: 'Communication and feedback collection',
        color: 'orange',
        position: 2,
        is_completion_column: false
      },
      {
        id: 'delivered-value',
        board_id: 'product-owner-board',
        name: 'Delivered Value',
        description: 'Completed features and user value',
        color: 'green',
        position: 3,
        is_completion_column: true
      }
    ],
    default_tasks: [
      {
        id: 'product-vision-review',
        template_id: 'product-owner-board',
        title: '🔮 Review Product Vision & Strategy',
        description: 'Regularly review and refine the product vision, ensuring alignment with business objectives and market needs. Update product roadmap accordingly.',
        column_name: 'Strategy & Planning',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 120,
        tags: ['product vision', 'strategy', 'roadmap'],
        position: 0,
        sub_task_templates: [
          { title: 'Analyze current market conditions', position: 0, estimated_duration: 30 },
          { title: 'Review business objectives alignment', position: 1, estimated_duration: 30 },
          { title: 'Update product vision statement', position: 2, estimated_duration: 30 },
          { title: 'Refresh product roadmap priorities', position: 3, estimated_duration: 30 }
        ]
      },
      {
        id: 'user-story-creation',
        template_id: 'product-owner-board',
        title: '📝 Create and Refine User Stories',
        description: 'Write clear, testable user stories with well-defined acceptance criteria. Follow INVEST principles to ensure stories are ready for development.',
        column_name: 'Backlog Management',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 90,
        tags: ['user stories', 'acceptance criteria', 'INVEST'],
        position: 0,
        sub_task_templates: [
          { title: 'Identify user personas and needs', position: 0, estimated_duration: 20 },
          { title: 'Write user stories in proper format', position: 1, estimated_duration: 40 },
          { title: 'Define clear acceptance criteria', position: 2, estimated_duration: 20 },
          { title: 'Validate stories meet INVEST criteria', position: 3, estimated_duration: 10 }
        ]
      },
      {
        id: 'backlog-prioritization',
        template_id: 'product-owner-board',
        title: '📊 Prioritize Product Backlog',
        description: 'Regularly prioritize backlog items based on business value, user impact, technical dependencies, and strategic alignment.',
        column_name: 'Backlog Management',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 60,
        tags: ['prioritization', 'business value', 'backlog'],
        position: 1,
        sub_task_templates: [
          { title: 'Score items by business value', position: 0, estimated_duration: 20 },
          { title: 'Consider technical dependencies', position: 1, estimated_duration: 15 },
          { title: 'Review with stakeholders', position: 2, estimated_duration: 15 },
          { title: 'Reorder backlog based on priority', position: 3, estimated_duration: 10 }
        ]
      },
      {
        id: 'stakeholder-feedback',
        template_id: 'product-owner-board',
        title: '🤝 Collect Stakeholder Feedback',
        description: 'Regular communication with stakeholders to gather feedback, validate assumptions, and ensure product direction meets business needs.',
        column_name: 'Stakeholder Engagement',
        priority: 'medium',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['stakeholders', 'feedback', 'communication'],
        position: 0,
        sub_task_templates: [
          { title: 'Schedule stakeholder check-ins', position: 0, estimated_duration: 10 },
          { title: 'Conduct feedback sessions', position: 1, estimated_duration: 25 },
          { title: 'Document and analyze feedback', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'acceptance-testing',
        template_id: 'product-owner-board',
        title: '✅ Review and Accept Completed Work',
        description: 'Review completed user stories against acceptance criteria, test functionality, and provide feedback to development team.',
        column_name: 'Stakeholder Engagement',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 60,
        tags: ['acceptance testing', 'quality assurance', 'review'],
        position: 1,
        sub_task_templates: [
          { title: 'Test against acceptance criteria', position: 0, estimated_duration: 30 },
          { title: 'Verify user experience flow', position: 1, estimated_duration: 20 },
          { title: 'Provide feedback to development team', position: 2, estimated_duration: 10 }
        ]
      }
    ],
    ai_customization_prompts: {
      context_questions: [
        'What type of product are you managing (B2B, B2C, internal tool, etc.)?',
        'Who are your primary stakeholders and what are their main concerns?',
        'What is your product development methodology (Scrum, Kanban, etc.)?',
        'How mature is your product (startup MVP, established product, legacy system)?',
        'What are your biggest product management challenges currently?'
      ],
      customization_areas: [
        'Tailor user story templates to product type',
        'Customize stakeholder management approach',
        'Adjust backlog management practices to methodology',
        'Scale activities based on product maturity',
        'Address specific product management challenges'
      ],
      success_metrics: [
        'Feature adoption rates',
        'Stakeholder satisfaction scores',
        'Sprint goal achievement',
        'Time to market for new features'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'workshop-planning',
    name: 'Workshop Planning & Execution',
    description: 'Complete workshop facilitation workflow from initial planning through follow-up. Perfect for trainers, consultants, and team leaders running engaging workshops.',
    category: 'professional',
    icon: '🎪',
    color_scheme: 'gradient-to-r from-yellow-400 to-orange-500',
    difficulty_level: 'intermediate',
    estimated_completion_time: '2-4 weeks per workshop',
    created_by: 'system',
    is_public: true,
    usage_count: 0,
    rating: 4.7,
    tags: ['workshop', 'facilitation', 'training', 'planning', 'engagement'],
    columns: [
      {
        id: 'workshop-design',
        board_id: 'workshop-planning',
        name: 'Design & Preparation',
        description: 'Workshop content and logistics planning',
        color: 'blue',
        position: 0,
        is_completion_column: false
      },
      {
        id: 'workshop-delivery',
        board_id: 'workshop-planning',
        name: 'Delivery & Execution',
        description: 'Running the workshop sessions',
        color: 'orange',
        position: 1,
        is_completion_column: false
      },
      {
        id: 'workshop-followup',
        board_id: 'workshop-planning',
        name: 'Follow-up & Evaluation',
        description: 'Post-workshop activities and improvement',
        color: 'purple',
        position: 2,
        is_completion_column: false
      },
      {
        id: 'workshop-completed',
        board_id: 'workshop-planning',
        name: 'Completed',
        description: 'Successfully delivered workshops',
        color: 'green',
        position: 3,
        is_completion_column: true
      }
    ],
    default_tasks: [
      {
        id: 'workshop-objectives',
        template_id: 'workshop-planning',
        title: '🎯 Define Learning Objectives',
        description: 'Clearly define what participants will learn and be able to do after the workshop. Create SMART learning objectives that align with participant needs.',
        column_name: 'Design & Preparation',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['objectives', 'learning outcomes', 'SMART goals'],
        position: 0,
        sub_task_templates: [
          { title: 'Identify participant skill levels', position: 0, estimated_duration: 15 },
          { title: 'Define primary learning objectives', position: 1, estimated_duration: 20 },
          { title: 'Create measurable success criteria', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'workshop-agenda',
        template_id: 'workshop-planning',
        title: '📋 Create Detailed Agenda',
        description: 'Design a comprehensive agenda with timing, activities, breaks, and transitions. Balance content delivery with interactive exercises.',
        column_name: 'Design & Preparation',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 90,
        tags: ['agenda', 'timing', 'activities'],
        position: 1,
        sub_task_templates: [
          { title: 'Outline main content blocks', position: 0, estimated_duration: 30 },
          { title: 'Design interactive activities', position: 1, estimated_duration: 40 },
          { title: 'Plan breaks and transitions', position: 2, estimated_duration: 20 }
        ]
      },
      {
        id: 'materials-preparation',
        template_id: 'workshop-planning',
        title: '📚 Prepare Materials & Resources',
        description: 'Create all necessary materials including slides, handouts, workbooks, and digital resources. Test all technology and equipment.',
        column_name: 'Design & Preparation',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 120,
        tags: ['materials', 'resources', 'technology'],
        position: 2,
        sub_task_templates: [
          { title: 'Create presentation slides', position: 0, estimated_duration: 60 },
          { title: 'Design participant handouts', position: 1, estimated_duration: 30 },
          { title: 'Test technology and equipment', position: 2, estimated_duration: 30 }
        ]
      },
      {
        id: 'workshop-facilitation',
        template_id: 'workshop-planning',
        title: '🎤 Facilitate Workshop Session',
        description: 'Deliver engaging workshop content while managing group dynamics, timing, and participant engagement. Adapt to group needs in real-time.',
        column_name: 'Delivery & Execution',
        priority: 'urgent',
        energy_level: 'xl',
        estimated_duration: 480,
        tags: ['facilitation', 'delivery', 'engagement'],
        position: 0,
        sub_task_templates: [
          { title: 'Open with energizer and introductions', position: 0, estimated_duration: 30 },
          { title: 'Deliver core content with activities', position: 1, estimated_duration: 360 },
          { title: 'Close with action planning', position: 2, estimated_duration: 30 }
        ]
      },
      {
        id: 'participant-feedback',
        template_id: 'workshop-planning',
        title: '📝 Collect Participant Feedback',
        description: 'Gather comprehensive feedback on workshop content, delivery, and outcomes. Use multiple feedback methods for thorough evaluation.',
        column_name: 'Follow-up & Evaluation',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 30,
        tags: ['feedback', 'evaluation', 'improvement'],
        position: 0,
        sub_task_templates: [
          { title: 'Send feedback survey to participants', position: 0, estimated_duration: 10 },
          { title: 'Analyze feedback responses', position: 1, estimated_duration: 15 },
          { title: 'Document improvement suggestions', position: 2, estimated_duration: 5 }
        ]
      },
      {
        id: 'follow-up-resources',
        template_id: 'workshop-planning',
        title: '📤 Send Follow-up Resources',
        description: 'Provide participants with additional resources, action plan templates, and ongoing support materials to reinforce learning.',
        column_name: 'Follow-up & Evaluation',
        priority: 'medium',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['resources', 'follow-up', 'support'],
        position: 1,
        sub_task_templates: [
          { title: 'Compile additional reading materials', position: 0, estimated_duration: 20 },
          { title: 'Create action plan templates', position: 1, estimated_duration: 15 },
          { title: 'Send follow-up email package', position: 2, estimated_duration: 10 }
        ]
      }
    ],
    ai_customization_prompts: {
      context_questions: [
        'What is the main topic or skill area for your workshop?',
        'Who is your target audience (experience level, role, industry)?',
        'How long is your workshop (half-day, full-day, multi-day)?',
        'Is this an in-person, virtual, or hybrid workshop?',
        'What are the main challenges or goals your participants have?'
      ],
      customization_areas: [
        'Customize content to specific topic and industry',
        'Adjust activities for audience experience level',
        'Modify timing and breaks for workshop duration',
        'Adapt delivery methods for format (in-person/virtual)',
        'Include relevant examples and case studies'
      ],
      success_metrics: [
        'Participant satisfaction scores',
        'Learning objective achievement',
        'Action plan completion rates',
        'Post-workshop implementation success'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'ai-educator-course',
    name: 'AI Educator Course Creation',
    description: 'Comprehensive course development workflow for creating engaging, AI-enhanced educational content. Perfect for educators, trainers, and course creators.',
    category: 'education',
    icon: '🎓',
    color_scheme: 'gradient-to-r from-indigo-500 to-purple-600',
    difficulty_level: 'advanced',
    estimated_completion_time: '6-12 weeks per course',
    created_by: 'system',
    is_public: true,
    usage_count: 0,
    rating: 4.9,
    tags: ['education', 'course creation', 'AI', 'curriculum', 'learning design'],
    columns: [
      {
        id: 'course-design',
        board_id: 'ai-educator-course',
        name: 'Instructional Design',
        description: 'Course structure and learning design',
        color: 'purple',
        position: 0,
        is_completion_column: false
      },
      {
        id: 'content-creation',
        board_id: 'ai-educator-course',
        name: 'Content Development',
        description: 'Creating lessons, activities, and assessments',
        color: 'blue',
        position: 1,
        is_completion_column: false
      },
      {
        id: 'ai-enhancement',
        board_id: 'ai-educator-course',
        name: 'AI Enhancement',
        description: 'Adding AI-powered features and personalization',
        color: 'emerald',
        position: 2,
        is_completion_column: false
      },
      {
        id: 'course-launched',
        board_id: 'ai-educator-course',
        name: 'Launched',
        description: 'Published and actively running courses',
        color: 'green',
        position: 3,
        is_completion_column: true
      }
    ],
    default_tasks: [
      {
        id: 'learning-objectives-design',
        template_id: 'ai-educator-course',
        title: '🎯 Design Learning Objectives & Outcomes',
        description: 'Create clear, measurable learning objectives using Bloom\'s taxonomy. Define what learners will know, understand, and be able to do.',
        column_name: 'Instructional Design',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 90,
        tags: ['learning objectives', 'Blooms taxonomy', 'outcomes'],
        position: 0,
        sub_task_templates: [
          { title: 'Analyze learner needs and prerequisites', position: 0, estimated_duration: 30 },
          { title: 'Write primary learning objectives', position: 1, estimated_duration: 40 },
          { title: 'Create assessment alignment matrix', position: 2, estimated_duration: 20 }
        ]
      },
      {
        id: 'curriculum-mapping',
        template_id: 'ai-educator-course',
        title: '🗺️ Create Curriculum Map',
        description: 'Design the overall course structure with modules, lessons, and learning pathways. Plan progression from basic to advanced concepts.',
        column_name: 'Instructional Design',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 120,
        tags: ['curriculum', 'course structure', 'learning pathways'],
        position: 1,
        sub_task_templates: [
          { title: 'Outline major course modules', position: 0, estimated_duration: 40 },
          { title: 'Design lesson sequence within modules', position: 1, estimated_duration: 50 },
          { title: 'Create prerequisite and dependency map', position: 2, estimated_duration: 30 }
        ]
      },
      {
        id: 'interactive-content',
        template_id: 'ai-educator-course',
        title: '🎮 Develop Interactive Content',
        description: 'Create engaging multimedia content including videos, interactive exercises, simulations, and hands-on activities that promote active learning.',
        column_name: 'Content Development',
        priority: 'high',
        energy_level: 'xl',
        estimated_duration: 240,
        tags: ['interactive content', 'multimedia', 'engagement'],
        position: 0,
        sub_task_templates: [
          { title: 'Script and record video lessons', position: 0, estimated_duration: 120 },
          { title: 'Create interactive exercises and quizzes', position: 1, estimated_duration: 60 },
          { title: 'Develop practical assignments', position: 2, estimated_duration: 60 }
        ]
      },
      {
        id: 'assessment-design',
        template_id: 'ai-educator-course',
        title: '✅ Design Assessments & Rubrics',
        description: 'Create formative and summative assessments that accurately measure learning objectives. Develop detailed rubrics for consistent grading.',
        column_name: 'Content Development',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 90,
        tags: ['assessment', 'rubrics', 'evaluation'],
        position: 1,
        sub_task_templates: [
          { title: 'Design formative check-ins', position: 0, estimated_duration: 30 },
          { title: 'Create summative assessments', position: 1, estimated_duration: 40 },
          { title: 'Develop detailed grading rubrics', position: 2, estimated_duration: 20 }
        ]
      },
      {
        id: 'ai-personalization',
        template_id: 'ai-educator-course',
        title: '🤖 Implement AI Personalization',
        description: 'Add AI-powered features for personalized learning paths, adaptive content recommendations, and intelligent tutoring support.',
        column_name: 'AI Enhancement',
        priority: 'medium',
        energy_level: 'xl',
        estimated_duration: 180,
        tags: ['AI personalization', 'adaptive learning', 'intelligent tutoring'],
        position: 0,
        sub_task_templates: [
          { title: 'Design learner profile system', position: 0, estimated_duration: 60 },
          { title: 'Implement adaptive content delivery', position: 1, estimated_duration: 80 },
          { title: 'Create AI coaching prompts', position: 2, estimated_duration: 40 }
        ]
      },
      {
        id: 'ai-analytics',
        template_id: 'ai-educator-course',
        title: '📊 Setup AI Learning Analytics',
        description: 'Implement learning analytics to track student progress, identify at-risk learners, and provide data-driven insights for course improvement.',
        column_name: 'AI Enhancement',
        priority: 'medium',
        energy_level: 'l',
        estimated_duration: 120,
        tags: ['learning analytics', 'progress tracking', 'data insights'],
        position: 1,
        sub_task_templates: [
          { title: 'Define key learning metrics', position: 0, estimated_duration: 30 },
          { title: 'Setup progress tracking systems', position: 1, estimated_duration: 60 },
          { title: 'Create instructor dashboards', position: 2, estimated_duration: 30 }
        ]
      }
    ],
    ai_customization_prompts: {
      context_questions: [
        'What subject area or skill will your course teach?',
        'Who is your target audience (beginners, professionals, students)?',
        'What is the intended course duration and format (online, blended, in-person)?',
        'Do you have experience with AI tools in education?',
        'What are the main learning challenges your students typically face?'
      ],
      customization_areas: [
        'Customize content structure for subject area',
        'Adjust complexity and pace for audience level',
        'Adapt delivery methods for course format',
        'Recommend appropriate AI tools and integration',
        'Address specific learning challenges with targeted solutions'
      ],
      success_metrics: [
        'Course completion rates',
        'Learning objective achievement scores',
        'Student satisfaction and engagement',
        'Knowledge retention in follow-up assessments'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'personal-development',
    name: 'Personal Development Journey',
    description: 'Comprehensive personal growth framework covering goal setting, skill building, habit formation, and mindset development for lifelong transformation.',
    category: 'personal',
    icon: '🌱',
    color_scheme: 'gradient-to-r from-emerald-400 to-teal-500',
    difficulty_level: 'beginner',
    estimated_completion_time: '3-6 months per major goal',
    created_by: 'system',
    is_public: true,
    usage_count: 0,
    rating: 4.8,
    tags: ['personal development', 'goals', 'habits', 'growth mindset', 'self-improvement'],
    columns: [
      {
        id: 'self-assessment',
        board_id: 'personal-development',
        name: 'Self-Assessment',
        description: 'Understanding your current state',
        color: 'blue',
        position: 0,
        is_completion_column: false
      },
      {
        id: 'goal-planning',
        board_id: 'personal-development',
        name: 'Goal Planning',
        description: 'Setting and structuring goals',
        color: 'purple',
        position: 1,
        is_completion_column: false
      },
      {
        id: 'active-development',
        board_id: 'personal-development',
        name: 'Active Development',
        description: 'Daily actions and skill building',
        color: 'orange',
        position: 2,
        is_completion_column: false
      },
      {
        id: 'achieved-growth',
        board_id: 'personal-development',
        name: 'Achieved',
        description: 'Completed goals and integrated habits',
        color: 'green',
        position: 3,
        is_completion_column: true
      }
    ],
    default_tasks: [
      {
        id: 'values-assessment',
        template_id: 'personal-development',
        title: '🎯 Identify Core Values & Priorities',
        description: 'Discover your fundamental values and life priorities. This foundation will guide all future development decisions and goal setting.',
        column_name: 'Self-Assessment',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 60,
        tags: ['values', 'priorities', 'self-awareness'],
        position: 0,
        sub_task_templates: [
          { title: 'Complete values assessment exercise', position: 0, estimated_duration: 30 },
          { title: 'Rank top 5 core values', position: 1, estimated_duration: 15 },
          { title: 'Write values-based mission statement', position: 2, estimated_duration: 15 }
        ]
      },
      {
        id: 'strengths-weaknesses',
        template_id: 'personal-development',
        title: '💪 Assess Strengths & Growth Areas',
        description: 'Identify your natural strengths to leverage and areas for improvement. Use tools like StrengthsFinder or seek feedback from others.',
        column_name: 'Self-Assessment',
        priority: 'high',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['strengths', 'weaknesses', 'self-awareness'],
        position: 1,
        sub_task_templates: [
          { title: 'Take strengths assessment', position: 0, estimated_duration: 20 },
          { title: 'Gather feedback from trusted friends/colleagues', position: 1, estimated_duration: 15 },
          { title: 'Identify top 3 areas for development', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'smart-goal-setting',
        template_id: 'personal-development',
        title: '🎯 Create SMART Goals',
        description: 'Set specific, measurable, achievable, relevant, and time-bound goals across different life areas (career, health, relationships, etc.).',
        column_name: 'Goal Planning',
        priority: 'high',
        energy_level: 'l',
        estimated_duration: 90,
        tags: ['SMART goals', 'goal setting', 'planning'],
        position: 0,
        sub_task_templates: [
          { title: 'Brainstorm goals across life areas', position: 0, estimated_duration: 30 },
          { title: 'Apply SMART criteria to each goal', position: 1, estimated_duration: 40 },
          { title: 'Create action plans for top 3 goals', position: 2, estimated_duration: 20 }
        ]
      },
      {
        id: 'habit-stacking',
        template_id: 'personal-development',
        title: '🔗 Design Habit Stack System',
        description: 'Create a system of linked habits that support your goals. Use existing habits as anchors for new ones to increase success rates.',
        column_name: 'Goal Planning',
        priority: 'medium',
        energy_level: 'm',
        estimated_duration: 45,
        tags: ['habits', 'habit stacking', 'systems'],
        position: 1,
        sub_task_templates: [
          { title: 'List current daily habits', position: 0, estimated_duration: 15 },
          { title: 'Identify new habits needed for goals', position: 1, estimated_duration: 20 },
          { title: 'Create habit stack sequences', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'daily-development',
        template_id: 'personal-development',
        title: '📚 Daily Learning & Development',
        description: 'Commit to daily learning through reading, podcasts, courses, or skill practice. Consistency in small actions leads to compound growth.',
        column_name: 'Active Development',
        priority: 'high',
        energy_level: 's',
        estimated_duration: 30,
        tags: ['learning', 'daily habits', 'skill building'],
        position: 0,
        sub_task_templates: [
          { title: 'Choose learning format (books, podcasts, courses)', position: 0, estimated_duration: 10 },
          { title: 'Schedule dedicated learning time', position: 1, estimated_duration: 10 },
          { title: 'Track and reflect on learning', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'weekly-reflection',
        template_id: 'personal-development',
        title: '🔄 Weekly Progress Review',
        description: 'Regular reflection on progress, challenges, and adjustments needed. This helps maintain momentum and course-correct when necessary.',
        column_name: 'Active Development',
        priority: 'medium',
        energy_level: 's',
        estimated_duration: 30,
        tags: ['reflection', 'progress review', 'adjustment'],
        position: 1,
        sub_task_templates: [
          { title: 'Review week\'s goal progress', position: 0, estimated_duration: 10 },
          { title: 'Identify challenges and successes', position: 1, estimated_duration: 10 },
          { title: 'Plan adjustments for coming week', position: 2, estimated_duration: 10 }
        ]
      },
      {
        id: 'network-building',
        template_id: 'personal-development',
        title: '🤝 Build Growth-Oriented Network',
        description: 'Connect with like-minded individuals who support your growth. Join communities, find mentors, and build relationships that inspire development.',
        column_name: 'Active Development',
        priority: 'medium',
        energy_level: 'm',
        estimated_duration: 60,
        tags: ['networking', 'community', 'mentorship'],
        position: 2,
        sub_task_templates: [
          { title: 'Identify relevant communities/groups', position: 0, estimated_duration: 20 },
          { title: 'Reach out to potential mentors', position: 1, estimated_duration: 30 },
          { title: 'Schedule regular connection activities', position: 2, estimated_duration: 10 }
        ]
      }
    ],
    ai_customization_prompts: {
      context_questions: [
        'What areas of your life do you most want to improve (career, health, relationships, skills)?',
        'What is your biggest personal development challenge or obstacle?',
        'How much time can you realistically dedicate to personal development daily?',
        'Do you prefer structured programs or flexible, self-directed approaches?',
        'What has worked well for you in previous growth efforts?'
      ],
      customization_areas: [
        'Focus on specific life areas of highest priority',
        'Address particular challenges with targeted strategies',
        'Adjust time commitments to realistic availability',
        'Match approach style to personal preferences',
        'Build on past successes and avoid previous pitfalls'
      ],
      success_metrics: [
        'Progress toward specific life goals',
        'Consistency in daily development habits',
        'Improved self-awareness and confidence',
        'Positive changes in targeted life areas'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper function to get template by ID
export const getTemplateById = (id: string): TaskBoardTemplate | undefined => {
  return BOARD_TEMPLATES.find(template => template.id === id);
};

// Helper function to get templates by category
export const getTemplatesByCategory = (category: string): TaskBoardTemplate[] => {
  return BOARD_TEMPLATES.filter(template => template.category === category);
};

// Helper function to search templates
export const searchTemplates = (query: string): TaskBoardTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return BOARD_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};