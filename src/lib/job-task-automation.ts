// Job Finder Task Auto-Creation Workflow
// Automatically creates tasks when job matches are found above threshold

import { supabase } from './supabase';

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_range?: string;
  match_score: number;
  url?: string;
  source: string;
  job_profile_id: string;
  discovered_at: string;
  deadline?: string;
  requirements: string[];
  benefits: string[];
  ai_analysis?: {
    pros: string[];
    cons: string[];
    fit_score: number;
    estimated_effort: string;
    recommended_action: string;
  };
}

export interface AutoTaskConfig {
  enabled: boolean;
  min_match_score: number;
  task_board_id?: string;
  create_subtasks: boolean;
  set_deadlines: boolean;
  default_priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notify_user: boolean;
  templates: {
    research_task: boolean;
    application_task: boolean;
    follow_up_tasks: boolean;
    interview_prep: boolean;
  };
}

export class JobTaskAutomation {
  private defaultConfig: AutoTaskConfig = {
    enabled: true,
    min_match_score: 75,
    create_subtasks: true,
    set_deadlines: true,
    default_priority: 'MEDIUM',
    notify_user: true,
    templates: {
      research_task: true,
      application_task: true,
      follow_up_tasks: true,
      interview_prep: true
    }
  };

  async processJobMatch(jobMatch: JobMatch, userId: string, config?: Partial<AutoTaskConfig>): Promise<string[]> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const createdTaskIds: string[] = [];

    // Check if auto-creation is enabled and match score meets threshold
    if (!finalConfig.enabled || jobMatch.match_score < finalConfig.min_match_score) {
      console.log(`Skipping task creation for ${jobMatch.title} - below threshold or disabled`);
      return createdTaskIds;
    }

    try {
      // Main task: Job Application
      const mainTask = await this.createMainApplicationTask(jobMatch, userId, finalConfig);
      if (mainTask) {
        createdTaskIds.push(mainTask.id);

        // Create subtasks if enabled
        if (finalConfig.create_subtasks) {
          const subtasks = await this.createSubtasks(jobMatch, userId, mainTask.id, finalConfig);
          createdTaskIds.push(...subtasks);
        }
      }

      // Send notification if enabled
      if (finalConfig.notify_user && createdTaskIds.length > 0) {
        await this.notifyUser(userId, jobMatch, createdTaskIds.length);
      }

      console.log(`Created ${createdTaskIds.length} tasks for job: ${jobMatch.title}`);
      return createdTaskIds;

    } catch (error) {
      console.error('Error in job task automation:', error);
      throw error;
    }
  }

  private async createMainApplicationTask(
    jobMatch: JobMatch, 
    userId: string, 
    config: AutoTaskConfig
  ): Promise<any> {
    const deadline = config.set_deadlines ? this.calculateDeadline(jobMatch.deadline) : null;
    
    const taskData = {
      title: `Apply to ${jobMatch.title} at ${jobMatch.company}`,
      description: this.generateMainTaskDescription(jobMatch),
      status: 'BACKLOG',
      priority: config.default_priority,
      user_id: userId,
      taskboard_id: config.task_board_id,
      estimated_hours: this.estimateApplicationTime(jobMatch),
      due_date: deadline,
      tags: ['job-application', 'auto-created', jobMatch.source],
      metadata: {
        job_match_id: jobMatch.id,
        match_score: jobMatch.match_score,
        company: jobMatch.company,
        job_url: jobMatch.url,
        auto_created: true,
        created_by: 'job-finder-agent'
      }
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async createSubtasks(
    jobMatch: JobMatch,
    userId: string,
    parentTaskId: string,
    config: AutoTaskConfig
  ): Promise<string[]> {
    const subtasks: any[] = [];
    const subtaskIds: string[] = [];

    // Research Task
    if (config.templates.research_task) {
      subtasks.push({
        title: `Research ${jobMatch.company} and role requirements`,
        description: this.generateResearchTaskDescription(jobMatch),
        status: 'BACKLOG',
        priority: 'MEDIUM',
        user_id: userId,
        taskboard_id: config.task_board_id,
        parent_task_id: parentTaskId,
        estimated_hours: 1,
        tags: ['research', 'job-application'],
        order: 1
      });
    }

    // Application Task
    if (config.templates.application_task) {
      subtasks.push({
        title: `Submit application for ${jobMatch.title}`,
        description: this.generateApplicationTaskDescription(jobMatch),
        status: 'BACKLOG',
        priority: 'HIGH',
        user_id: userId,
        taskboard_id: config.task_board_id,
        parent_task_id: parentTaskId,
        estimated_hours: 2,
        due_date: config.set_deadlines ? this.calculateDeadline(jobMatch.deadline, -2) : null,
        tags: ['application', 'job-application'],
        order: 2
      });
    }

    // Follow-up Tasks
    if (config.templates.follow_up_tasks) {
      subtasks.push({
        title: `Follow up on application - ${jobMatch.company}`,
        description: 'Check application status and send follow-up email if needed',
        status: 'BACKLOG',
        priority: 'LOW',
        user_id: userId,
        taskboard_id: config.task_board_id,
        parent_task_id: parentTaskId,
        estimated_hours: 0.5,
        due_date: config.set_deadlines ? this.calculateDeadline(null, 7) : null,
        tags: ['follow-up', 'job-application'],
        order: 3
      });
    }

    // Interview Prep Task (if high match score)
    if (config.templates.interview_prep && jobMatch.match_score >= 85) {
      subtasks.push({
        title: `Prepare for potential interview - ${jobMatch.company}`,
        description: this.generateInterviewPrepDescription(jobMatch),
        status: 'BACKLOG',
        priority: 'MEDIUM',
        user_id: userId,
        taskboard_id: config.task_board_id,
        parent_task_id: parentTaskId,
        estimated_hours: 3,
        tags: ['interview-prep', 'job-application'],
        order: 4
      });
    }

    // Create all subtasks
    if (subtasks.length > 0) {
      const { data, error } = await supabase
        .from('tasks')
        .insert(subtasks)
        .select('id');

      if (error) throw error;
      return data.map(task => task.id);
    }

    return subtaskIds;
  }

  private generateMainTaskDescription(jobMatch: JobMatch): string {
    let description = `## Job Application: ${jobMatch.title} at ${jobMatch.company}\n\n`;
    
    description += `**Match Score:** ${jobMatch.match_score}% 🎯\n`;
    description += `**Location:** ${jobMatch.location}\n`;
    
    if (jobMatch.salary_range) {
      description += `**Salary:** ${jobMatch.salary_range}\n`;
    }
    
    description += `**Source:** ${jobMatch.source}\n`;
    
    if (jobMatch.url) {
      description += `**Job Posting:** [View Job](${jobMatch.url})\n`;
    }
    
    description += '\n### Key Requirements:\n';
    jobMatch.requirements.slice(0, 5).forEach(req => {
      description += `- ${req}\n`;
    });

    if (jobMatch.ai_analysis) {
      description += '\n### AI Analysis:\n';
      description += `**Recommended Action:** ${jobMatch.ai_analysis.recommended_action}\n`;
      description += `**Estimated Effort:** ${jobMatch.ai_analysis.estimated_effort}\n`;
      
      if (jobMatch.ai_analysis.pros.length > 0) {
        description += '\n**Pros:**\n';
        jobMatch.ai_analysis.pros.forEach(pro => {
          description += `- ✅ ${pro}\n`;
        });
      }
      
      if (jobMatch.ai_analysis.cons.length > 0) {
        description += '\n**Considerations:**\n';
        jobMatch.ai_analysis.cons.forEach(con => {
          description += `- ⚠️ ${con}\n`;
        });
      }
    }

    description += '\n### Next Steps:\n';
    description += '1. Research company and role in detail\n';
    description += '2. Tailor resume and cover letter\n';
    description += '3. Submit application\n';
    description += '4. Set up follow-up reminders\n';

    return description;
  }

  private generateResearchTaskDescription(jobMatch: JobMatch): string {
    return `Research ${jobMatch.company} and the ${jobMatch.title} position:

### Research Checklist:
- [ ] Company background, mission, and values
- [ ] Recent company news and developments
- [ ] Team structure and potential colleagues
- [ ] Company culture and work environment
- [ ] Interview process and typical questions
- [ ] Salary benchmarking for this role
- [ ] Required skills alignment with job posting

### Questions to Answer:
- What are the main challenges this role would solve?
- How does this position fit into their team structure?
- What would success look like in this role?
- What are the growth opportunities?

**Job URL:** ${jobMatch.url || 'N/A'}`;
  }

  private generateApplicationTaskDescription(jobMatch: JobMatch): string {
    return `Submit application for ${jobMatch.title} at ${jobMatch.company}:

### Application Checklist:
- [ ] Review and tailor resume for this specific role
- [ ] Write compelling cover letter addressing key requirements
- [ ] Gather required documents and portfolio samples  
- [ ] Complete online application form thoroughly
- [ ] Submit application before deadline
- [ ] Save confirmation/reference numbers
- [ ] Add application to tracking spreadsheet
- [ ] Set follow-up reminder for 1 week

### Key Requirements to Address:
${jobMatch.requirements.slice(0, 3).map(req => `- ${req}`).join('\n')}

**Application URL:** ${jobMatch.url || 'Check company careers page'}
**Deadline:** ${jobMatch.deadline || 'Not specified - apply ASAP'}`;
  }

  private generateInterviewPrepDescription(jobMatch: JobMatch): string {
    return `Prepare for potential interview at ${jobMatch.company}:

### Interview Preparation:
- [ ] Practice common interview questions for ${jobMatch.title} role
- [ ] Prepare STAR format examples for key competencies
- [ ] Research interviewer backgrounds (LinkedIn)
- [ ] Prepare thoughtful questions about the role and company
- [ ] Review technical requirements and prepare demos
- [ ] Plan interview outfit and logistics
- [ ] Practice salary negotiation strategies

### Key Topics to Cover:
${jobMatch.requirements.slice(0, 4).map(req => `- ${req}`).join('\n')}

### Questions to Ask:
- What are the biggest challenges facing the team right now?
- How do you measure success in this role?
- What opportunities exist for professional development?
- Can you describe the team I'd be working with?`;
  }

  private calculateDeadline(jobDeadline?: string, offsetDays: number = 0): string | null {
    let baseDate: Date;
    
    if (jobDeadline) {
      baseDate = new Date(jobDeadline);
    } else {
      // Default: 2 weeks from now if no deadline specified
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 14);
    }
    
    // Add offset (can be negative for earlier deadline)
    baseDate.setDate(baseDate.getDate() + offsetDays);
    
    return baseDate.toISOString();
  }

  private estimateApplicationTime(jobMatch: JobMatch): number {
    // Base application time
    let hours = 2;
    
    // Add time based on match score (higher score = more time investment)
    if (jobMatch.match_score >= 90) hours += 2;
    else if (jobMatch.match_score >= 80) hours += 1;
    
    // Add time for complex applications
    const complexKeywords = ['senior', 'lead', 'director', 'manager', 'principal'];
    if (complexKeywords.some(keyword => jobMatch.title.toLowerCase().includes(keyword))) {
      hours += 1;
    }
    
    return hours;
  }

  private async notifyUser(userId: string, jobMatch: JobMatch, taskCount: number): Promise<void> {
    // This would integrate with your notification system
    // For now, we'll create a notification record in the database
    
    try {
      await supabase.from('user_notifications').insert([{
        user_id: userId,
        type: 'job_tasks_created',
        title: `${taskCount} tasks created for job opportunity`,
        message: `Found high-match job: ${jobMatch.title} at ${jobMatch.company} (${jobMatch.match_score}% match). Created ${taskCount} tasks to help you apply.`,
        data: {
          job_match_id: jobMatch.id,
          task_count: taskCount,
          match_score: jobMatch.match_score,
          company: jobMatch.company,
          title: jobMatch.title
        },
        read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't throw - notification failure shouldn't break task creation
    }
  }

  // Helper method to get user's task automation config
  async getUserConfig(userId: string): Promise<AutoTaskConfig> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('job_task_automation')
        .eq('user_id', userId)
        .single();

      if (error || !data?.job_task_automation) {
        return this.defaultConfig;
      }

      return { ...this.defaultConfig, ...data.job_task_automation };
    } catch (error) {
      console.error('Error fetching user config:', error);
      return this.defaultConfig;
    }
  }

  // Method to update user's task automation config
  async updateUserConfig(userId: string, config: Partial<AutoTaskConfig>): Promise<void> {
    const currentConfig = await this.getUserConfig(userId);
    const newConfig = { ...currentConfig, ...config };

    const { error } = await supabase
      .from('user_settings')
      .upsert([{
        user_id: userId,
        job_task_automation: newConfig,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }
}

// Export singleton instance
export const jobTaskAutomation = new JobTaskAutomation();