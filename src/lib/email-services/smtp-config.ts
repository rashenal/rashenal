// SMTP configuration and email sending service
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: string;
}

export interface EmailNotification {
  id: string;
  userId: string;
  type: 'job_alert' | 'application_reminder' | 'interview_reminder' | 'follow_up_reminder' | 'system_notification';
  recipient: string;
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  scheduledFor?: string;
  sentAt?: string;
  status: 'pending' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
  retryCount: number;
  metadata: {
    jobId?: string;
    applicationId?: string;
    interviewId?: string;
    campaignId?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export const SMTP_PROVIDERS: Record<string, Omit<SMTPConfig, 'auth'>> = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
  },
  mailgun: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
  },
  ses: {
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
  }
};

export class SMTPService {
  private config: SMTPConfig;
  private provider: string;

  constructor(provider: string, username: string, password: string) {
    const providerConfig = SMTP_PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported SMTP provider: ${provider}`);
    }

    this.provider = provider;
    this.config = {
      ...providerConfig,
      auth: {
        user: username,
        pass: password
      }
    };
  }

  // Simulate email sending (in real implementation, would use nodemailer or similar)
  async sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    bodyType: 'text' | 'html' = 'text',
    attachments?: Array<{
      filename: string;
      content: string;
      encoding?: string;
    }>
  ): Promise<EmailSendResult> {
    try {
      // In a real implementation, this would use a proper SMTP library
      // For now, we'll simulate the email sending process
      
      const recipients = Array.isArray(to) ? to : [to];
      
      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        return {
          success: false,
          error: `Invalid email addresses: ${invalidEmails.join(', ')}`,
          provider: this.provider,
          timestamp: new Date().toISOString()
        };
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate occasional failures (5% failure rate)
      if (Math.random() < 0.05) {
        throw new Error('SMTP server temporarily unavailable');
      }

      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${this.config.host}`;

      console.log(`[${this.provider.toUpperCase()}] Email sent:`, {
        to: recipients,
        subject,
        messageId,
        bodyType,
        attachments: attachments?.length || 0
      });

      return {
        success: true,
        messageId,
        provider: this.provider,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[${this.provider.toUpperCase()}] Email send failed:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.provider,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate occasional connection failures
      if (Math.random() < 0.1) {
        throw new Error('Authentication failed');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

export class EmailNotificationService {
  private smtpService: SMTPService;
  private userId: string;

  constructor(userId: string, smtpService: SMTPService) {
    this.userId = userId;
    this.smtpService = smtpService;
  }

  async sendJobAlert(
    recipient: string,
    jobTitle: string,
    company: string,
    jobUrl: string,
    matchScore: number
  ): Promise<EmailSendResult> {
    const subject = `New Job Match: ${jobTitle} at ${company} (${matchScore}% match)`;
    
    const body = `
Hi there!

We found a new job opportunity that matches your profile:

🏢 Company: ${company}
💼 Position: ${jobTitle}  
📊 Match Score: ${matchScore}%
🔗 Apply: ${jobUrl}

This position was selected based on your job search preferences and profile. 

Good luck with your application!

Best regards,
The Rashenal Team

---
Manage your job alerts: ${window.location.origin}/settings/job-alerts
Unsubscribe: ${window.location.origin}/unsubscribe?token=xxx
    `.trim();

    return await this.smtpService.sendEmail(recipient, subject, body, 'text');
  }

  async sendApplicationReminder(
    recipient: string,
    jobTitle: string,
    company: string,
    daysUntilDeadline: number
  ): Promise<EmailSendResult> {
    const subject = `Reminder: Application deadline approaching for ${jobTitle}`;
    
    const body = `
Hi there!

This is a friendly reminder about an application deadline:

🏢 Company: ${company}
💼 Position: ${jobTitle}
⏰ Deadline: ${daysUntilDeadline} days remaining

Don't forget to submit your application before the deadline!

Best regards,
The Rashenal Team

---
View your applications: ${window.location.origin}/applications
    `.trim();

    return await this.smtpService.sendEmail(recipient, subject, body, 'text');
  }

  async sendInterviewReminder(
    recipient: string,
    jobTitle: string,
    company: string,
    interviewDate: string,
    interviewType: string
  ): Promise<EmailSendResult> {
    const subject = `Interview Reminder: ${jobTitle} at ${company}`;
    
    const body = `
Hi there!

You have an upcoming interview:

🏢 Company: ${company}
💼 Position: ${jobTitle}
📅 Date: ${interviewDate}
📹 Type: ${interviewType}

Good luck with your interview! Remember to:
✅ Research the company and role
✅ Prepare questions to ask
✅ Test your tech setup (for virtual interviews)
✅ Plan your route (for in-person interviews)

You've got this! 💪

Best regards,
The Rashenal Team

---
View interview details: ${window.location.origin}/interviews
    `.trim();

    return await this.smtpService.sendEmail(recipient, subject, body, 'text');
  }

  async sendFollowUpReminder(
    recipient: string,
    jobTitle: string,
    company: string,
    daysSinceApplication: number
  ): Promise<EmailSendResult> {
    const subject = `Follow-up suggestion for ${jobTitle} application`;
    
    const body = `
Hi there!

It's been ${daysSinceApplication} days since you applied for:

🏢 Company: ${company}
💼 Position: ${jobTitle}

Consider sending a polite follow-up email to check on your application status. This shows continued interest and professionalism.

We've prepared some follow-up templates for you to use:

📝 View templates: ${window.location.origin}/templates?category=follow-up

Best regards,
The Rashenal Team
    `.trim();

    return await this.smtpService.sendEmail(recipient, subject, body, 'text');
  }

  async sendWeeklyDigest(
    recipient: string,
    stats: {
      newJobs: number;
      applications: number;
      interviews: number;
      responses: number;
    }
  ): Promise<EmailSendResult> {
    const subject = 'Your weekly job search update';
    
    const body = `
Hi there!

Here's your job search activity for this week:

📊 This Week's Summary:
• ${stats.newJobs} new job matches found
• ${stats.applications} applications submitted  
• ${stats.interviews} interviews scheduled
• ${stats.responses} responses received

${stats.newJobs > 0 ? `🎯 View your latest job matches: ${window.location.origin}/jobs` : ''}
${stats.applications > 0 ? `📋 Track your applications: ${window.location.origin}/applications` : ''}

Keep up the great work on your job search journey!

Best regards,
The Rashenal Team

---
Update preferences: ${window.location.origin}/settings/notifications
    `.trim();

    return await this.smtpService.sendEmail(recipient, subject, body, 'text');
  }

  // Queue notification for later sending
  async queueNotification(notification: Omit<EmailNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullNotification: EmailNotification = {
      ...notification,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, this would save to a database queue
    console.log('Notification queued:', fullNotification);
    
    // If scheduled for immediate sending
    if (!notification.scheduledFor || new Date(notification.scheduledFor) <= new Date()) {
      await this.processNotification(fullNotification);
    }

    return id;
  }

  private async processNotification(notification: EmailNotification): Promise<void> {
    try {
      const result = await this.smtpService.sendEmail(
        notification.recipient,
        notification.subject,
        notification.body,
        notification.bodyType
      );

      if (result.success) {
        console.log(`Notification ${notification.id} sent successfully`);
        // Update notification status to 'sent'
      } else {
        console.error(`Notification ${notification.id} failed:`, result.error);
        // Update notification status to 'failed' and potentially retry
      }
    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error);
      // Handle retry logic
    }
  }

  // Process scheduled notifications (would be called by a cron job)
  async processScheduledNotifications(): Promise<void> {
    console.log('Processing scheduled notifications...');
    
    // In a real implementation, this would:
    // 1. Query database for notifications where scheduled_for <= now and status = 'scheduled'
    // 2. Process each notification
    // 3. Update status based on results
    // 4. Handle retries for failed notifications
  }
}

export default SMTPService;