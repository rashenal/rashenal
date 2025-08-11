// Email client for Gmail, Outlook, and Yahoo integration
import { OAuthManager, OAuthToken, EmailAccount } from './oauth-config';
import { supabase } from '../supabase';

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  receivedAt: string;
  sentAt?: string;
  attachments?: EmailAttachment[];
  labels?: string[];
  isRead: boolean;
  isStarred: boolean;
  jobRelated?: {
    company?: string;
    position?: string;
    confidence: number;
    keywords: string[];
  };
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  downloadUrl?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  category: 'job-application' | 'follow-up' | 'thank-you' | 'networking' | 'cold-outreach';
  variables: string[]; // Available template variables like {company}, {position}
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  recipients: Array<{
    email: string;
    variables: Record<string, string>;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: string;
    errorMessage?: string;
  }>;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  scheduledAt?: string;
  createdAt: string;
  completedAt?: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}

export class EmailClient {
  private oauthManager: OAuthManager;
  private account: EmailAccount;

  constructor(account: EmailAccount) {
    this.oauthManager = OAuthManager.getInstance();
    this.account = account;
  }

  // Generic API request with token refresh
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.account.token) {
      throw new Error('No authentication token available');
    }

    let token = this.account.token;
    
    if (this.oauthManager.isTokenExpired(token)) {
      token = await this.oauthManager.getValidToken(token);
      // Update token in database
      await this.updateTokenInDatabase(token);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `${token.tokenType} ${token.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token might be invalid, try refreshing
      token = await this.oauthManager.refreshToken(token);
      await this.updateTokenInDatabase(token);
      
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `${token.tokenType} ${token.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return response;
  }

  private async updateTokenInDatabase(token: OAuthToken): Promise<void> {
    const { error } = await supabase
      .from('email_accounts')
      .update({ 
        token: token,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', this.account.id);

    if (error) {
      console.error('Failed to update token in database:', error);
    }
  }

  // Gmail-specific methods
  private async fetchGmailMessages(query?: string, maxResults = 50): Promise<EmailMessage[]> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      ...(query && { q: query })
    });

    const response = await this.makeRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Gmail messages: ${response.statusText}`);
    }

    const data = await response.json();
    const messages: EmailMessage[] = [];

    // Fetch details for each message
    for (const messageRef of data.messages || []) {
      const messageResponse = await this.makeRequest(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageRef.id}`
      );

      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        messages.push(this.parseGmailMessage(messageData));
      }
    }

    return messages;
  }

  private parseGmailMessage(data: any): EmailMessage {
    const headers = data.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';

    let body = '';
    let bodyType: 'text' | 'html' = 'text';

    // Extract body content
    if (data.payload.body?.data) {
      body = atob(data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (data.payload.parts) {
      const textPart = data.payload.parts.find((p: any) => p.mimeType === 'text/plain');
      const htmlPart = data.payload.parts.find((p: any) => p.mimeType === 'text/html');
      
      if (htmlPart?.body?.data) {
        body = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        bodyType = 'html';
      } else if (textPart?.body?.data) {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }

    return {
      id: data.id,
      threadId: data.threadId,
      from: getHeader('From'),
      to: [getHeader('To')],
      cc: getHeader('Cc') ? [getHeader('Cc')] : [],
      subject: getHeader('Subject'),
      body,
      bodyType,
      receivedAt: new Date(parseInt(data.internalDate)).toISOString(),
      isRead: !data.labelIds?.includes('UNREAD'),
      isStarred: data.labelIds?.includes('STARRED') || false,
      labels: data.labelIds || [],
      attachments: this.parseGmailAttachments(data.payload.parts || [])
    };
  }

  private parseGmailAttachments(parts: any[]): EmailAttachment[] {
    const attachments: EmailAttachment[] = [];
    
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
        });
      }
      
      if (part.parts) {
        attachments.push(...this.parseGmailAttachments(part.parts));
      }
    }
    
    return attachments;
  }

  // Outlook-specific methods
  private async fetchOutlookMessages(filter?: string, top = 50): Promise<EmailMessage[]> {
    const params = new URLSearchParams({
      $top: top.toString(),
      $orderby: 'receivedDateTime desc',
      ...(filter && { $filter: filter })
    });

    const response = await this.makeRequest(
      `https://graph.microsoft.com/v1.0/me/messages?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Outlook messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value?.map((msg: any) => this.parseOutlookMessage(msg)) || [];
  }

  private parseOutlookMessage(data: any): EmailMessage {
    return {
      id: data.id,
      threadId: data.conversationId,
      from: data.from?.emailAddress?.address || '',
      to: data.toRecipients?.map((r: any) => r.emailAddress?.address) || [],
      cc: data.ccRecipients?.map((r: any) => r.emailAddress?.address) || [],
      subject: data.subject || '',
      body: data.body?.content || '',
      bodyType: data.body?.contentType === 'html' ? 'html' : 'text',
      receivedAt: data.receivedDateTime,
      isRead: data.isRead,
      isStarred: data.flag?.flagStatus === 'flagged',
      attachments: data.attachments?.map((att: any) => ({
        id: att.id,
        filename: att.name,
        mimeType: att.contentType,
        size: att.size,
      })) || []
    };
  }

  // Universal methods
  public async fetchMessages(query?: string, limit = 50): Promise<EmailMessage[]> {
    switch (this.account.provider) {
      case 'gmail':
        return this.fetchGmailMessages(query, limit);
      case 'outlook':
        return this.fetchOutlookMessages(query, limit);
      default:
        throw new Error(`Unsupported provider: ${this.account.provider}`);
    }
  }

  public async sendEmail(
    to: string[],
    subject: string,
    body: string,
    bodyType: 'text' | 'html' = 'text',
    attachments?: EmailAttachment[]
  ): Promise<string> {
    switch (this.account.provider) {
      case 'gmail':
        return this.sendGmailMessage(to, subject, body, bodyType, attachments);
      case 'outlook':
        return this.sendOutlookMessage(to, subject, body, bodyType, attachments);
      default:
        throw new Error(`Unsupported provider: ${this.account.provider}`);
    }
  }

  private async sendGmailMessage(
    to: string[],
    subject: string,
    body: string,
    bodyType: 'text' | 'html',
    attachments?: EmailAttachment[]
  ): Promise<string> {
    const message = this.createGmailRawMessage(to, subject, body, bodyType);
    
    const response = await this.makeRequest(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        body: JSON.stringify({
          raw: message
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send Gmail message: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  private createGmailRawMessage(
    to: string[],
    subject: string,
    body: string,
    bodyType: 'text' | 'html'
  ): string {
    const signature = this.account.settings.emailSignature ? 
      `\n\n${this.account.settings.emailSignature}` : '';
    
    const messageLines = [
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      `Content-Type: ${bodyType === 'html' ? 'text/html' : 'text/plain'}; charset=utf-8`,
      '',
      body + signature
    ];

    const rawMessage = messageLines.join('\r\n');
    return btoa(rawMessage).replace(/\+/g, '-').replace(/\//g, '_');
  }

  private async sendOutlookMessage(
    to: string[],
    subject: string,
    body: string,
    bodyType: 'text' | 'html',
    attachments?: EmailAttachment[]
  ): Promise<string> {
    const signature = this.account.settings.emailSignature ? 
      `<br><br>${this.account.settings.emailSignature}` : '';

    const message = {
      subject,
      body: {
        contentType: bodyType,
        content: body + signature
      },
      toRecipients: to.map(email => ({
        emailAddress: { address: email }
      }))
    };

    const response = await this.makeRequest(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      {
        method: 'POST',
        body: JSON.stringify({ message })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send Outlook message: ${response.statusText}`);
    }

    return 'sent'; // Outlook doesn't return message ID for sent messages
  }

  // Job-related email analysis
  public async analyzeJobRelatedEmails(): Promise<EmailMessage[]> {
    const messages = await this.fetchMessages('job OR hiring OR interview OR application', 100);
    
    return messages.map(message => ({
      ...message,
      jobRelated: this.analyzeJobContent(message)
    })).filter(message => message.jobRelated && message.jobRelated.confidence > 0.6);
  }

  private analyzeJobContent(message: EmailMessage): { company?: string; position?: string; confidence: number; keywords: string[] } | undefined {
    const text = `${message.subject} ${message.body}`.toLowerCase();
    
    const jobKeywords = [
      'job', 'position', 'role', 'opportunity', 'hiring', 'interview', 'application',
      'candidate', 'resume', 'cv', 'cover letter', 'salary', 'benefits', 'employment',
      'career', 'apply', 'recruiter', 'hr', 'human resources', 'onsite', 'remote',
      'full-time', 'part-time', 'contract', 'freelance', 'internship'
    ];

    const companyIndicators = [
      'company', 'corporation', 'inc', 'llc', 'ltd', 'co', 'tech', 'software',
      'solutions', 'systems', 'group', 'consulting', 'services'
    ];

    const foundKeywords = jobKeywords.filter(keyword => text.includes(keyword));
    const foundCompanyIndicators = companyIndicators.filter(indicator => text.includes(indicator));
    
    if (foundKeywords.length === 0) return undefined;

    const confidence = Math.min(
      (foundKeywords.length / jobKeywords.length) + 
      (foundCompanyIndicators.length / companyIndicators.length) * 0.3,
      1
    );

    return {
      confidence,
      keywords: foundKeywords,
      company: this.extractCompanyName(message),
      position: this.extractPosition(message)
    };
  }

  private extractCompanyName(message: EmailMessage): string | undefined {
    // Simple extraction - could be enhanced with NLP
    const fromDomain = message.from.split('@')[1];
    if (fromDomain && !fromDomain.includes('gmail') && !fromDomain.includes('yahoo') && !fromDomain.includes('outlook')) {
      return fromDomain.split('.')[0];
    }
    return undefined;
  }

  private extractPosition(message: EmailMessage): string | undefined {
    const text = `${message.subject} ${message.body}`;
    const positionRegex = /(senior|junior|lead|principal)?\s*(software|web|mobile|data|devops|frontend|backend|fullstack|full-stack)?\s*(engineer|developer|architect|analyst|manager|designer|specialist)/gi;
    const match = text.match(positionRegex);
    return match ? match[0].trim() : undefined;
  }
}

export default EmailClient;