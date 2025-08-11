// Content Generation Engine - AI-powered social media content creation
import { supabase } from '../lib/supabase';

export interface ContentTemplate {
  id: string;
  name: string;
  category: 'transformation' | 'habits' | 'motivation' | 'education';
  template: string;
  variables: string[];
  platforms: string[];
  optimal_times: string[];
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  suggested_times: string[];
  engagement_score: number;
  tone: 'professional' | 'casual' | 'inspirational' | 'educational';
  content_type: 'motivational' | 'educational' | 'milestone' | 'story' | 'tips' | 'celebration';
}

export interface UserHabitData {
  habit_name: string;
  current_streak: number;
  best_streak: number;
  completion_rate: number;
  category: string;
}

export interface UserGoalData {
  title: string;
  progress: number;
  target_date: Date;
  category: string;
  milestones: string[];
}

class ContentGenerationService {
  private userId: string | null = null;
  private userVoiceProfile: any = null;
  private habitData: UserHabitData[] = [];
  private goalData: UserGoalData[] = [];

  async initialize(userId: string) {
    this.userId = userId;
    await this.loadUserData();
    await this.loadVoiceProfile();
  }

  private async loadUserData() {
    if (!this.userId) return;

    try {
      // Load user's habits
      const { data: habits } = await supabase
        .from('habits')
        .select(`
          name,
          category,
          habit_completions!inner(*)
        `)
        .eq('user_id', this.userId)
        .eq('is_active', true);

      if (habits) {
        this.habitData = habits.map(habit => this.calculateHabitStats(habit));
      }

      // Load user's goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', 'active');

      if (goals) {
        this.goalData = goals.map(goal => ({
          title: goal.title,
          progress: goal.progress,
          target_date: new Date(goal.target_date),
          category: goal.category,
          milestones: []
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  private calculateHabitStats(habitData: any): UserHabitData {
    const completions = habitData.habit_completions || [];
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentCompletions = completions.filter((completion: any) => 
      new Date(completion.completed_at) >= thirtyDaysAgo
    );

    const currentStreak = this.calculateCurrentStreak(completions);
    const bestStreak = this.calculateBestStreak(completions);
    const completionRate = recentCompletions.length / 30;

    return {
      habit_name: habitData.name,
      current_streak: currentStreak,
      best_streak: bestStreak,
      completion_rate: Math.round(completionRate * 100),
      category: habitData.category
    };
  }

  private calculateCurrentStreak(completions: any[]): number {
    if (!completions.length) return 0;

    const sortedCompletions = completions
      .map(c => new Date(c.completed_at))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    const currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);

    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion);
      completionDate.setHours(0, 0, 0, 0);

      if (completionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (completionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  private calculateBestStreak(completions: any[]): number {
    if (!completions.length) return 0;

    const sortedCompletions = completions
      .map(c => new Date(c.completed_at))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion);
      completionDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        currentStreak = 1;
      } else {
        const daysDiff = (completionDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000);
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }

      lastDate = completionDate;
    }

    return Math.max(maxStreak, currentStreak);
  }

  private async loadVoiceProfile() {
    if (!this.userId) return;

    try {
      // Load user's previous posts to learn their voice
      const { data: posts } = await supabase
        .from('social_posts')
        .select('content, engagement_metrics')
        .eq('user_id', this.userId)
        .eq('generated_by_ai', false)
        .limit(50);

      if (posts && posts.length > 0) {
        this.userVoiceProfile = this.analyzeVoicePattern(posts);
      }
    } catch (error) {
      console.error('Error loading voice profile:', error);
    }
  }

  private analyzeVoicePattern(posts: any[]) {
    // Analyze user's writing patterns
    const totalPosts = posts.length;
    const avgLength = posts.reduce((sum, post) => sum + post.content.length, 0) / totalPosts;
    
    const emojiUsage = posts.filter(post => /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u.test(post.content)).length / totalPosts;
    const questionUsage = posts.filter(post => post.content.includes('?')).length / totalPosts;
    const hashtagUsage = posts.filter(post => post.content.includes('#')).length / totalPosts;
    
    const topPerformingPosts = posts
      .filter(post => post.engagement_metrics?.likes > 0)
      .sort((a, b) => (b.engagement_metrics?.likes || 0) - (a.engagement_metrics?.likes || 0))
      .slice(0, 5);

    return {
      avgLength,
      emojiUsage,
      questionUsage,
      hashtagUsage,
      tone: avgLength > 200 ? 'professional' : 'casual',
      topPerformingStyles: topPerformingPosts.map(post => ({
        content: post.content,
        engagement: post.engagement_metrics
      }))
    };
  }

  async generateFromTemplate(template: ContentTemplate, customInputs: Record<string, string> = {}): Promise<GeneratedContent> {
    if (!this.userId) {
      throw new Error('User not initialized');
    }

    try {
      // Fill template with user data or custom inputs
      let content = template.template;
      
      // Replace variables with actual data
      for (const variable of template.variables) {
        const value = customInputs[variable] || this.getVariableValue(variable);
        content = content.replace(`{${variable}}`, value);
      }

      // Generate contextual hashtags
      const hashtags = this.generateHashtags(template.category, content);
      
      // Apply user's voice profile if available
      if (this.userVoiceProfile) {
        content = this.applyVoiceProfile(content);
      }

      // Replace hashtags placeholder
      const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
      content = content.replace('{hashtags}', hashtagString);

      return {
        content,
        hashtags,
        suggested_times: template.optimal_times,
        engagement_score: this.calculateEngagementScore(content, template.category),
        tone: this.userVoiceProfile?.tone || 'inspirational',
        content_type: this.mapCategoryToContentType(template.category)
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  private getVariableValue(variable: string): string {
    switch (variable) {
      case 'message':
        return this.getMotivationalMessage();
      case 'focus_area':
        return this.getCurrentFocusArea();
      case 'milestone':
        return this.getLatestMilestone();
      case 'reflection':
        return this.getPersonalReflection();
      case 'insight':
        return this.getWisdomInsight();
      case 'lesson':
        return this.getKeyLesson();
      case 'action_step':
        return this.getActionableStep();
      case 'streak_count':
        return this.getBestStreak().toString();
      case 'habit_name':
        return this.getTopHabit();
      case 'achievement_message':
        return this.getAchievementMessage();
      default:
        return `[${variable}]`;
    }
  }

  private getMotivationalMessage(): string {
    const messages = [
      'Every small step counts toward your bigger vision.',
      'Progress isn\'t always linear, but it\'s always valuable.',
      'Your consistency today shapes your success tomorrow.',
      'Embrace the process, not just the outcome.',
      'Growth happens in the moments you choose to keep going.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private getCurrentFocusArea(): string {
    if (this.habitData.length > 0) {
      const topHabit = this.habitData.sort((a, b) => b.current_streak - a.current_streak)[0];
      return `maintaining my ${topHabit.habit_name} habit`;
    }
    
    if (this.goalData.length > 0) {
      const nearestGoal = this.goalData.sort((a, b) => 
        a.target_date.getTime() - b.target_date.getTime()
      )[0];
      return `achieving my ${nearestGoal.title} goal`;
    }
    
    return 'building better daily habits';
  }

  private getLatestMilestone(): string {
    if (this.habitData.length > 0) {
      const bestHabit = this.habitData.sort((a, b) => b.current_streak - a.current_streak)[0];
      return `${bestHabit.current_streak} days of consistent ${bestHabit.habit_name}`;
    }
    
    if (this.goalData.length > 0) {
      const progressGoal = this.goalData.sort((a, b) => b.progress - a.progress)[0];
      return `${progressGoal.progress}% progress on ${progressGoal.title}`;
    }
    
    return 'taking consistent action toward my goals';
  }

  private getPersonalReflection(): string {
    const reflections = [
      'The hardest part was starting, but now momentum carries me forward.',
      'I\'ve learned that small, consistent actions create massive results.',
      'Every setback taught me something valuable about resilience.',
      'The person I\'m becoming is worth every effort I\'m putting in.',
      'Celebrating small wins keeps me motivated for the bigger challenges.'
    ];
    return reflections[Math.floor(Math.random() * reflections.length)];
  }

  private getWisdomInsight(): string {
    const insights = [
      'Systems beat goals every time',
      'Progress compounds when you\'re not watching',
      'Consistency matters more than perfection',
      'Your environment shapes your behavior',
      'Identity change drives lasting transformation'
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }

  private getKeyLesson(): string {
    const lessons = [
      'Start before you feel ready - readiness is a myth',
      'Focus on the process, not just the outcome',
      'Your worst day is still better than not showing up',
      'Motivation gets you started, habits keep you going',
      'Progress is progress, no matter how small'
    ];
    return lessons[Math.floor(Math.random() * lessons.length)];
  }

  private getActionableStep(): string {
    const steps = [
      'Write down your top 3 priorities for tomorrow',
      'Set a 15-minute timer and work on your most important task',
      'Identify one habit you can start with just 2 minutes a day',
      'Schedule time for what matters most to you this week',
      'Ask yourself: \'What would someone I admire do in this situation?\''
    ];
    return steps[Math.floor(Math.random() * steps.length)];
  }

  private getBestStreak(): number {
    if (this.habitData.length > 0) {
      return Math.max(...this.habitData.map(h => h.current_streak));
    }
    return Math.floor(Math.random() * 30) + 1; // Fallback
  }

  private getTopHabit(): string {
    if (this.habitData.length > 0) {
      const topHabit = this.habitData.sort((a, b) => b.current_streak - a.current_streak)[0];
      return topHabit.habit_name;
    }
    return 'daily reflection';
  }

  private getAchievementMessage(): string {
    const messages = [
      'What started as a commitment has become a cornerstone of my daily routine.',
      'The compound effect is real - small actions, big results.',
      'Proof that consistency beats perfection every single time.',
      'Each day builds on the last. This is how transformation happens.',
      'From intention to action to habit - the journey continues.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private generateHashtags(category: string, content: string): string[] {
    const baseHashtags = {
      transformation: ['Transformation', 'PersonalGrowth', 'Progress', 'Journey', 'Change'],
      habits: ['Habits', 'HabitStacking', 'DailyRoutine', 'Consistency', 'SmallWins'],
      motivation: ['Motivation', 'Inspiration', 'Mindset', 'Goals', 'Success'],
      education: ['Learning', 'Growth', 'Wisdom', 'Development', 'Knowledge']
    };

    const categoryTags = baseHashtags[category] || baseHashtags.motivation;
    const selectedTags = categoryTags.slice(0, 3);

    // Add contextual tags based on content
    const contextualTags = [];
    
    if (content.toLowerCase().includes('morning')) contextualTags.push('MorningRoutine');
    if (content.toLowerCase().includes('meditation')) contextualTags.push('Mindfulness', 'Meditation');
    if (content.toLowerCase().includes('exercise') || content.toLowerCase().includes('workout')) {
      contextualTags.push('Fitness', 'Health');
    }
    if (content.toLowerCase().includes('productivity')) contextualTags.push('Productivity');
    if (content.toLowerCase().includes('mindset')) contextualTags.push('MindsetMatters');

    // Add day-specific hashtags
    const today = new Date().getDay();
    const dayTags = {
      0: ['SundayReflection', 'SelfCare'],
      1: ['MondayMotivation', 'NewWeek'],
      2: ['TransformationTuesday', 'GrowthMindset'],
      3: ['WisdomWednesday', 'Learning'],
      4: ['ThursdayThoughts', 'Progress'],
      5: ['FeatureFriday', 'Celebration'],
      6: ['SaturdaySuccess', 'Achievement']
    };

    const todayTags = dayTags[today] || [];
    
    return [...selectedTags, ...contextualTags.slice(0, 2), ...todayTags.slice(0, 1)]
      .slice(0, 6)
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
  }

  private applyVoiceProfile(content: string): string {
    if (!this.userVoiceProfile) return content;

    let adjustedContent = content;

    // Adjust emoji usage based on user's pattern
    if (this.userVoiceProfile.emojiUsage > 0.5 && !/[\u{1F600}-\u{1F64F}]/u.test(content)) {
      // Add emojis if user typically uses them
      adjustedContent = this.addContextualEmojis(adjustedContent);
    }

    // Adjust length based on user's typical post length
    if (this.userVoiceProfile.avgLength < 150 && adjustedContent.length > 200) {
      // Make more concise for users who typically write shorter posts
      adjustedContent = this.makeMoreConcise(adjustedContent);
    }

    // Add question if user frequently asks questions
    if (this.userVoiceProfile.questionUsage > 0.3 && !adjustedContent.includes('?')) {
      adjustedContent = this.addEngagementQuestion(adjustedContent);
    }

    return adjustedContent;
  }

  private addContextualEmojis(content: string): string {
    const emojiMap = {
      'motivation': '💪',
      'success': '🎉',
      'learning': '📚',
      'growth': '🌱',
      'habits': '🎯',
      'progress': '📈',
      'journey': '🚀',
      'transformation': '✨'
    };

    let emojiContent = content;
    Object.entries(emojiMap).forEach(([keyword, emoji]) => {
      if (content.toLowerCase().includes(keyword) && !content.includes(emoji)) {
        emojiContent = emojiContent.replace(
          new RegExp(`\\b${keyword}\\b`, 'gi'),
          `${keyword} ${emoji}`
        );
      }
    });

    return emojiContent;
  }

  private makeMoreConcise(content: string): string {
    const sentences = content.split('\n\n');
    if (sentences.length > 2) {
      return sentences.slice(0, 2).join('\n\n');
    }
    return content;
  }

  private addEngagementQuestion(content: string): string {
    const questions = [
      '\n\nWhat\'s your experience with this?',
      '\n\nHow do you stay consistent?',
      '\n\nWhat\'s working for you?',
      '\n\nWhat would you add to this?',
      '\n\nAny tips to share?'
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    return content + randomQuestion;
  }

  private calculateEngagementScore(content: string, category: string): number {
    let score = 50; // Base score

    // Length optimization
    if (content.length >= 100 && content.length <= 280) score += 15;
    else if (content.length > 280 && content.length <= 500) score += 10;
    else if (content.length > 500) score -= 10;

    // Emoji presence
    if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/u.test(content)) score += 10;

    // Question presence (encourages engagement)
    if (content.includes('?')) score += 15;

    // Call to action presence
    const callToActionWords = ['share', 'comment', 'try', 'join', 'follow', 'tag'];
    if (callToActionWords.some(word => content.toLowerCase().includes(word))) score += 10;

    // Hashtag presence
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (hashtagCount >= 3 && hashtagCount <= 7) score += 10;
    else if (hashtagCount > 7) score -= 5;

    // Category-specific adjustments
    if (category === 'motivation' && content.includes('!')) score += 5;
    if (category === 'education' && content.includes(':')) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }

  private mapCategoryToContentType(category: string): 'motivational' | 'educational' | 'milestone' | 'story' | 'tips' | 'celebration' {
    const mapping = {
      transformation: 'milestone',
      habits: 'celebration',
      motivation: 'motivational',
      education: 'educational'
    };
    return mapping[category] || 'motivational';
  }

  // Batch content generation
  async generateBatchContent(
    templates: ContentTemplate[],
    customInputs: Record<string, any> = {},
    count: number = 7
  ): Promise<GeneratedContent[]> {
    const generatedContent = [];

    for (let i = 0; i < count && i < templates.length; i++) {
      try {
        const content = await this.generateFromTemplate(templates[i], customInputs);
        generatedContent.push(content);
      } catch (error) {
        console.error(`Error generating content for template ${templates[i].id}:`, error);
      }
    }

    return generatedContent;
  }

  // Content performance prediction
  predictPerformance(content: GeneratedContent, platform: string): {
    expectedViews: number;
    expectedLikes: number;
    expectedComments: number;
    bestTimeToPost: string;
  } {
    const baseMetrics = {
      linkedin: { views: 500, likes: 25, comments: 3 },
      twitter: { views: 200, likes: 10, comments: 1 },
      instagram: { views: 300, likes: 40, comments: 5 },
      facebook: { views: 150, likes: 8, comments: 2 },
      youtube: { views: 100, likes: 5, comments: 1 }
    };

    const platformBase = baseMetrics[platform] || baseMetrics.linkedin;
    const multiplier = content.engagement_score / 100;

    return {
      expectedViews: Math.round(platformBase.views * multiplier),
      expectedLikes: Math.round(platformBase.likes * multiplier),
      expectedComments: Math.round(platformBase.comments * multiplier),
      bestTimeToPost: this.getOptimalPostTime(platform, content.content_type)
    };
  }

  private getOptimalPostTime(platform: string, contentType: string): string {
    const optimalTimes = {
      linkedin: {
        motivational: '08:00',
        educational: '10:00',
        milestone: '17:00',
        story: '12:00',
        tips: '14:00',
        celebration: '18:00'
      },
      twitter: {
        motivational: '07:00',
        educational: '11:00',
        milestone: '19:00',
        story: '20:00',
        tips: '15:00',
        celebration: '21:00'
      },
      instagram: {
        motivational: '06:00',
        educational: '13:00',
        milestone: '18:00',
        story: '19:00',
        tips: '16:00',
        celebration: '20:00'
      },
      facebook: {
        motivational: '09:00',
        educational: '14:00',
        milestone: '18:00',
        story: '19:00',
        tips: '15:00',
        celebration: '20:00'
      },
      youtube: {
        motivational: '14:00',
        educational: '16:00',
        milestone: '18:00',
        story: '19:00',
        tips: '17:00',
        celebration: '20:00'
      }
    };

    return optimalTimes[platform]?.[contentType] || '12:00';
  }
}

// Export singleton instance
export const ContentGenerator = new ContentGenerationService();