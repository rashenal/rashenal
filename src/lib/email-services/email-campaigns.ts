// Email campaign management for job search automation
import { supabase } from '../supabase';
import { EmailTemplate, EmailTemplateManager } from './email-templates';
import { SMTPService, EmailSendResult } from './smtp-config';

export interface EmailCampaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  templateId: string;
  recipients: CampaignRecipient[];
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: string;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // Every N days/weeks/months
    endDate?: string;
    maxSends?: number;
  };
  sendingConfig: {
    batchSize: number; // Emails per batch
    batchDelay: number; // Minutes between batches
    respectTimeZone: boolean;
    sendingHours: {
      start: number; // 9 for 9 AM
      end: number;   // 17 for 5 PM
    };
    sendingDays: number[]; // 1=Monday, 2=Tuesday, etc. 0=Sunday
  };
  stats: {
    total: number;
    sent: number;
    failed: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata: {
    tags?: string[];
    category?: 'job-application' | 'follow-up' | 'networking' | 'outreach';
    source?: string;
  };
}

export interface CampaignRecipient {
  email: string;
  variables: Record<string, string>;
  status: 'pending' | 'scheduled' | 'sent' | 'failed' | 'bounced' | 'unsubscribed';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  errorMessage?: string;
  retryCount: number;
  metadata: {
    jobId?: string;
    companyId?: string;
    contactName?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface CampaignTemplate {
  campaign: Omit<EmailCampaign, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  template: EmailTemplate;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    campaign: {
      name: 'Job Application Blast',
      description: 'Send applications to multiple companies at once',
      templateId: 'job-application-template',
      recipients: [],
      status: 'draft',
      scheduleType: 'immediate',
      sendingConfig: {
        batchSize: 5,
        batchDelay: 30,
        respectTimeZone: true,
        sendingHours: { start: 9, end: 17 },
        sendingDays: [1, 2, 3, 4, 5] // Monday to Friday
      },
      stats: { total: 0, sent: 0, failed: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      metadata: {
        category: 'job-application',
        tags: ['bulk-application', 'job-search']
      }
    },
    template: {
      id: 'job-application-template',
      name: 'Bulk Job Application',
      subject: 'Application for {position} - {fullName}',
      body: `Dear Hiring Team,

I am writing to express my strong interest in the {position} role at {company}. With my background in {skills} and {experience} years of experience, I am confident I would be a valuable addition to your team.

Key qualifications:
• {experience}+ years of experience in {skills}
• Proven track record in {currentRole} at {currentCompany}
• Strong technical expertise and problem-solving abilities

I would welcome the opportunity to discuss how my background aligns with {company}'s needs. Please find my resume attached for your review.

Thank you for your consideration.

Best regards,
{fullName}
{email} | {phone}
Portfolio: {websiteUrl}`,
      bodyType: 'text',
      category: 'job-application',
      variables: ['fullName', 'email', 'phone', 'company', 'position', 'skills', 'experience', 'currentRole', 'currentCompany', 'websiteUrl'],
      isDefault: false,
      userId: '',
      createdAt: '',
      updatedAt: '',
      metadata: {
        description: 'Template for bulk job applications',
        tags: ['bulk', 'application']
      }
    }
  },
  {
    campaign: {
      name: 'Follow-up Sequence',
      description: 'Automated follow-up sequence for job applications',
      templateId: 'follow-up-template',
      recipients: [],
      status: 'draft',
      scheduleType: 'recurring',
      recurringConfig: {
        frequency: 'weekly',
        interval: 1,
        maxSends: 3
      },
      sendingConfig: {
        batchSize: 10,
        batchDelay: 15,
        respectTimeZone: true,
        sendingHours: { start: 10, end: 16 },
        sendingDays: [2, 4] // Tuesday and Thursday
      },
      stats: { total: 0, sent: 0, failed: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      metadata: {
        category: 'follow-up',
        tags: ['automated', 'follow-up', 'sequence']
      }
    },
    template: {
      id: 'follow-up-template',
      name: 'Application Follow-up',
      subject: 'Following up on my {position} application',
      body: `Dear {hiringManager},

I hope this message finds you well. I wanted to follow up on my application for the {position} role at {company} that I submitted [time period] ago.

I remain very interested in this opportunity and would welcome the chance to discuss how my {experience} years of experience in {skills} can contribute to your team's success.

If you need any additional information or would like to schedule a conversation, please don't hesitate to reach out.

Thank you for your time and consideration.

Best regards,
{fullName}
{email} | {phone}`,
      bodyType: 'text',
      category: 'follow-up',
      variables: ['fullName', 'email', 'phone', 'company', 'position', 'hiringManager', 'skills', 'experience'],
      isDefault: false,
      userId: '',
      createdAt: '',
      updatedAt: '',
      metadata: {
        description: 'Follow-up template for applications',
        tags: ['follow-up', 'sequence']
      }
    }
  }
];

export class EmailCampaignManager {
  private userId: string;
  private templateManager: EmailTemplateManager;
  private smtpService: SMTPService;

  constructor(userId: string, smtpService: SMTPService) {
    this.userId = userId;
    this.templateManager = new EmailTemplateManager(userId);
    this.smtpService = smtpService;
  }

  async getCampaigns(status?: EmailCampaign['status']): Promise<EmailCampaign[]> {
    let query = supabase
      .from('email_campaigns')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return data || [];
  }

  async getCampaign(id: string): Promise<EmailCampaign | null> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return data;
  }

  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<EmailCampaign> {
    const now = new Date().toISOString();
    
    // Validate template exists
    const template = await this.templateManager.getTemplate(campaign.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Initialize stats
    const stats = {
      total: campaign.recipients.length,
      sent: 0,
      failed: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0
    };

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        ...campaign,
        user_id: this.userId,
        stats,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return data;
  }

  async updateCampaign(id: string, updates: Partial<Omit<EmailCampaign, 'id' | 'userId' | 'createdAt'>>): Promise<EmailCampaign> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return data;
  }

  async startCampaign(id: string): Promise<void> {
    const campaign = await this.getCampaign(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new Error('Campaign cannot be started from current status');
    }

    // Update campaign status
    await this.updateCampaign(id, {
      status: 'running',
      startedAt: new Date().toISOString()
    });

    // Start processing recipients
    if (campaign.scheduleType === 'immediate') {
      this.processCampaignImmediate(campaign);
    } else {
      this.scheduleCampaign(campaign);
    }
  }

  async pauseCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, { status: 'paused' });
  }

  async cancelCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, { 
      status: 'cancelled',
      completedAt: new Date().toISOString()
    });
  }

  private async processCampaignImmediate(campaign: EmailCampaign): Promise<void> {
    console.log(`Starting immediate campaign: ${campaign.name}`);
    
    const template = await this.templateManager.getTemplate(campaign.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const { batchSize, batchDelay } = campaign.sendingConfig;
    const recipients = campaign.recipients.filter(r => r.status === 'pending');
    
    // Process recipients in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Check if we're within sending hours
      if (!this.isWithinSendingHours(campaign.sendingConfig)) {
        console.log('Outside sending hours, pausing campaign');
        await this.updateCampaign(campaign.id, { status: 'paused' });
        return;
      }

      await this.processBatch(campaign, template, batch);
      
      // Delay between batches (except for the last batch)
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay * 60 * 1000));
      }
    }

    // Mark campaign as completed
    await this.updateCampaign(campaign.id, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  }

  private async processBatch(campaign: EmailCampaign, template: EmailTemplate, recipients: CampaignRecipient[]): Promise<void> {
    const results = await Promise.allSettled(
      recipients.map(recipient => this.sendCampaignEmail(campaign, template, recipient))
    );

    let sent = 0;
    let failed = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
        recipients[index].status = 'sent';
        recipients[index].sentAt = new Date().toISOString();
      } else {
        failed++;
        recipients[index].status = 'failed';
        recipients[index].errorMessage = result.status === 'rejected' ? 
          result.reason : (result.value as EmailSendResult).error;
        recipients[index].retryCount++;
      }
    });

    // Update campaign stats
    const currentStats = campaign.stats;
    await this.updateCampaign(campaign.id, {
      recipients: campaign.recipients,
      stats: {
        ...currentStats,
        sent: currentStats.sent + sent,
        failed: currentStats.failed + failed
      }
    });
  }

  private async sendCampaignEmail(campaign: EmailCampaign, template: EmailTemplate, recipient: CampaignRecipient): Promise<EmailSendResult> {
    const { subject, body } = await this.templateManager.renderTemplate(template.id, recipient.variables);
    
    return await this.smtpService.sendEmail(
      recipient.email,
      subject,
      body,
      template.bodyType
    );
  }

  private isWithinSendingHours(config: EmailCampaign['sendingConfig']): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const withinDays = config.sendingDays.includes(currentDay);
    const withinHours = currentHour >= config.sendingHours.start && currentHour < config.sendingHours.end;

    return withinDays && withinHours;
  }

  private scheduleCampaign(campaign: EmailCampaign): void {
    console.log(`Scheduling campaign: ${campaign.name}`);
    // In a real implementation, this would register the campaign with a job scheduler
    // For now, we'll just log the scheduling
  }

  async duplicateCampaign(id: string, newName: string): Promise<EmailCampaign> {
    const originalCampaign = await this.getCampaign(id);
    if (!originalCampaign) {
      throw new Error('Campaign not found');
    }

    const duplicatedCampaign: Omit<EmailCampaign, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      ...originalCampaign,
      name: newName,
      status: 'draft',
      stats: { total: 0, sent: 0, failed: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      recipients: originalCampaign.recipients.map(r => ({ ...r, status: 'pending', retryCount: 0 })),
      startedAt: undefined,
      completedAt: undefined
    };

    return await this.createCampaign(duplicatedCampaign);
  }

  async getCampaignAnalytics(id: string): Promise<{
    performance: {
      openRate: number;
      clickRate: number;
      bounceRate: number;
      unsubscribeRate: number;
    };
    timeline: Array<{
      date: string;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
    }>;
    topPerformingVariations: Array<{
      variable: string;
      value: string;
      openRate: number;
      clickRate: number;
      count: number;
    }>;
  }> {
    const campaign = await this.getCampaign(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const stats = campaign.stats;
    const performance = {
      openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
      clickRate: stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0,
      bounceRate: stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0,
      unsubscribeRate: stats.sent > 0 ? (stats.unsubscribed / stats.sent) * 100 : 0
    };

    // For now, return mock data for timeline and variations
    const timeline = [
      { date: new Date().toISOString().split('T')[0], sent: stats.sent, delivered: stats.delivered, opened: stats.opened, clicked: stats.clicked }
    ];

    const topPerformingVariations = [
      { variable: 'company', value: 'Tech Corp', openRate: 85, clickRate: 15, count: 10 },
      { variable: 'position', value: 'Senior Developer', openRate: 78, clickRate: 12, count: 15 }
    ];

    return {
      performance,
      timeline,
      topPerformingVariations
    };
  }

  async importRecipientsFromCSV(csvData: string, variableMapping: Record<string, string>): Promise<CampaignRecipient[]> {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const recipients: CampaignRecipient[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const variables: Record<string, string> = {};
      headers.forEach((header, index) => {
        const mappedVariable = variableMapping[header];
        if (mappedVariable && values[index]) {
          variables[mappedVariable] = values[index];
        }
      });

      if (variables.email && this.isValidEmail(variables.email)) {
        recipients.push({
          email: variables.email,
          variables,
          status: 'pending',
          retryCount: 0,
          metadata: {}
        });
      }
    }

    return recipients;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default EmailCampaignManager;