// Motivation Plugin - First official Asista.AI plugin
// Demonstrates integration with existing Rashenal features

import { Plugin, PluginContext, PluginManifest } from '../../core/types';

export default class MotivationPlugin implements Plugin {
  manifest: PluginManifest = {
    id: 'ai.asista.motivation',
    name: 'Motivation Booster',
    version: '1.0.0',
    description: 'AI-powered motivational support that adapts to your energy and goals',
    author: {
      name: 'Asista.AI',
      email: 'plugins@asista.ai',
      website: 'https://asista.ai'
    },
    category: 'wellness',
    tags: ['motivation', 'wellness', 'ai', 'energy-aware'],
    permissions: [
      'tasks:read',
      'habits:read', 
      'goals:read',
      'ai:chat',
      'notifications:send'
    ],
    entry: '@/plugins/official/motivation/index.ts'
  };
  
  private context!: PluginContext;
  private checkInterval?: NodeJS.Timeout;
  
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    
    // Set up dashboard widget
    await this.registerWidget();
    
    // Set up voice commands if voice system is available
    await this.registerVoiceCommands();
    
    // Start energy monitoring
    await this.startEnergyMonitoring();
    
    console.log('Motivation Plugin initialized');
  }
  
  async activate(): Promise<void> {
    // Called when plugin is activated
    await this.sendWelcomeMessage();
  }
  
  async deactivate(): Promise<void> {
    // Clean up when plugin is deactivated
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
  
  private async registerWidget(): Promise<void> {
    await this.context.ui.registerWidget({
      id: 'motivation-daily',
      type: 'card',
      position: 'dashboard-top',
      component: 'MotivationWidget',
      props: {
        refreshInterval: 3600000, // 1 hour
        interactive: true
      }
    });
  }
  
  private async registerVoiceCommands(): Promise<void> {
    try {
      // Connect to existing voice system
      await this.context.api.voice.registerCommand(
        'motivate me',
        async () => {
          const motivation = await this.getPersonalizedMotivation();
          await this.context.api.voice.speak(motivation);
          return motivation;
        }
      );
      
      await this.context.api.voice.registerCommand(
        'how am I doing',
        async () => {
          const progress = await this.getProgressSummary();
          await this.context.api.voice.speak(progress);
          return progress;
        }
      );
    } catch (error) {
      console.log('Voice commands not available:', error);
    }
  }
  
  private async startEnergyMonitoring(): Promise<void> {
    // Check energy levels periodically
    this.checkInterval = setInterval(async () => {
      try {
        const shouldMotivate = await this.shouldSendMotivation();
        if (shouldMotivate) {
          const motivation = await this.getPersonalizedMotivation();
          this.context.ui.showNotification({
            title: '💜 Gentle Reminder',
            message: motivation,
            type: 'info',
            duration: 10000
          });
        }
      } catch (error) {
        console.error('Error in energy monitoring:', error);
      }
    }, 1800000); // Check every 30 minutes
  }
  
  private async shouldSendMotivation(): Promise<boolean> {
    try {
      // Check user's recent activity
      const tasks = await this.context.api.tasks.list();
      const recentTasks = tasks.filter(t => {
        const updated = new Date(t.updated_at);
        const hoursSince = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
        return hoursSince < 2;
      });
      
      // If no recent activity and it's working hours, send motivation
      const hour = new Date().getHours();
      const isWorkingHours = hour >= 9 && hour <= 17;
      
      return recentTasks.length === 0 && isWorkingHours;
    } catch (error) {
      console.error('Error checking motivation conditions:', error);
      return false;
    }
  }
  
  async getPersonalizedMotivation(): Promise<string> {
    try {
      // Get user context
      const [tasks, habits, goals] = await Promise.all([
        this.context.api.tasks.list().catch(() => []),
        this.context.api.habits.getActive().catch(() => []),
        this.context.api.goals.list().catch(() => [])
      ]);
      
      // Determine energy level from task patterns
      const lowEnergyTasks = tasks.filter(t => 
        t.energy_level === 'xs' || t.energy_level === 's'
      ).length;
      const totalTasks = tasks.length;
      const energyLevel = lowEnergyTasks > totalTasks / 2 ? 'low' : 'normal';
      
      // Build context for AI
      const context = {
        activeGoals: goals.filter(g => g.status === 'active').map(g => g.title),
        currentHabits: habits.map(h => h.name),
        energyLevel,
        taskCount: tasks.filter(t => t.status !== 'completed').length
      };
      
      // Get AI-generated motivation
      const prompt = `Generate a brief, warm, encouraging motivation message for someone with:
      - Energy level: ${context.energyLevel}
      - Active goals: ${context.activeGoals.join(', ') || 'none set'}
      - Pending tasks: ${context.taskCount}
      
      Keep it under 2 sentences. Be genuine, not overly positive. 
      If energy is low, validate rest. Focus on progress, not perfection.`;
      
      const motivation = await this.context.api.ai.chat(prompt);
      
      // Store in history
      const history = await this.context.storage.get('motivation_history') || [];
      history.push({
        text: motivation,
        timestamp: Date.now(),
        context
      });
      await this.context.storage.set('motivation_history', history.slice(-50));
      
      return motivation;
    } catch (error) {
      console.error('Error generating personalized motivation:', error);
      return 'You\'re doing great. Keep going! 💜';
    }
  }
  
  private async getProgressSummary(): Promise<string> {
    try {
      const [tasks, habits] = await Promise.all([
        this.context.api.tasks.list().catch(() => []),
        this.context.api.habits.getActive().catch(() => [])
      ]);
      
      const completedToday = tasks.filter(t => {
        const completed = t.status === 'completed' && t.completed_at;
        if (!completed) return false;
        const today = new Date().toDateString();
        return new Date(t.completed_at).toDateString() === today;
      }).length;
      
      return `You've completed ${completedToday} tasks today. ${
        completedToday > 0 
          ? 'That\'s wonderful progress!' 
          : 'It\'s okay to start small. You\'re exactly where you need to be.'
      }`;
    } catch (error) {
      console.error('Error getting progress summary:', error);
      return 'You\'re making progress in your own way. That\'s what matters.';
    }
  }
  
  private async sendWelcomeMessage(): Promise<void> {
    this.context.ui.showNotification({
      title: '✨ Motivation Booster Activated',
      message: 'I\'m here to support your journey with gentle encouragement.',
      type: 'success',
      duration: 5000
    });
  }
  
  // Public methods for external API calls
  async getMotivationStats(): Promise<any> {
    try {
      const history = await this.context.storage.get('motivation_history') || [];
      const saved = await this.context.storage.get('saved_motivations') || [];
      
      return {
        streak: this.calculateStreak(history),
        saved: saved.length,
        energy: await this.getCurrentEnergyLevel()
      };
    } catch (error) {
      console.error('Error getting motivation stats:', error);
      return { streak: 0, saved: 0, energy: 'unknown' };
    }
  }
  
  async saveMotivation(text: string, author: string): Promise<void> {
    try {
      const saved = await this.context.storage.get('saved_motivations') || [];
      saved.push({
        text,
        author,
        timestamp: Date.now()
      });
      await this.context.storage.set('saved_motivations', saved);
    } catch (error) {
      console.error('Error saving motivation:', error);
    }
  }
  
  private calculateStreak(history: any[]): number {
    if (history.length === 0) return 0;
    
    // Calculate consecutive days with motivation interactions
    const days = new Set();
    history.forEach(h => {
      const date = new Date(h.timestamp).toDateString();
      days.add(date);
    });
    
    return Math.min(days.size, 30); // Cap at 30 days
  }
  
  private async getCurrentEnergyLevel(): Promise<string> {
    try {
      const tasks = await this.context.api.tasks.list();
      const recentTasks = tasks.filter(t => {
        const updated = new Date(t.updated_at);
        const hoursAgo = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
        return hoursAgo < 24;
      });
      
      const avgEnergyMap = { xs: 1, s: 2, m: 3, l: 4, xl: 5 };
      const energySum = recentTasks.reduce((sum, task) => {
        return sum + (avgEnergyMap[task.energy_level as keyof typeof avgEnergyMap] || 3);
      }, 0);
      
      const avgEnergy = energySum / Math.max(recentTasks.length, 1);
      
      if (avgEnergy <= 2) return 'low';
      if (avgEnergy >= 4) return 'high';
      return 'medium';
    } catch (error) {
      return 'medium';
    }
  }
}