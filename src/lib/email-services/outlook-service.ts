import { Client } from '@microsoft/microsoft-graph-client';
import { EmailJob, ExtractedJobData } from './types';

export class OutlookJobService {
  private graphClient: Client;
  private accessToken: string;
  private refreshToken: string;

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    // Initialize Microsoft Graph client
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, this.accessToken);
      }
    });
  }

  async fetchJobEmails(since?: Date, folderId?: string): Promise<EmailJob[]> {
    try {
      let query = '/me/messages';
      
      // Build filter query
      const filters: string[] = [];
      
      // Add date filter if provided
      if (since) {
        filters.push(`receivedDateTime ge ${since.toISOString()}`);
      }
      
      // Add job-related subject filters
      const jobKeywords = [
        'job alert',
        'new position',
        'job opportunity',
        'hiring',
        'vacancy',
        'career opportunity',
        'we\'re hiring'
      ];
      
      const subjectFilters = jobKeywords
        .map(keyword => `contains(subject, '${keyword}')`)
        .join(' or ');
      
      filters.push(`(${subjectFilters})`);
      
      // Add sender filters for known job boards
      const jobBoardDomains = [
        'linkedin.com',
        'indeed.com',
        'glassdoor.com',
        'monster.com',
        'dice.com',
        'ziprecruiter.com',
        'angellist.com',
        'hired.com'
      ];
      
      const senderFilters = jobBoardDomains
        .map(domain => `contains(sender/emailAddress/address, '${domain}')`)
        .join(' or ');
      
      filters.push(`(${senderFilters})`);
      
      // Combine all filters
      if (filters.length > 0) {
        query += `?$filter=${filters.join(' and ')}`;
      }
      
      // Add select fields to reduce payload
      query += '&$select=id,subject,sender,receivedDateTime,body,hasAttachments';
      
      // Add order by
      query += '&$orderby=receivedDateTime desc';
      
      // Add top limit
      query += '&$top=100';
      
      const response = await this.graphClient.api(query).get();
      
      return this.transformOutlookEmails(response.value);
    } catch (error) {
      console.error('Error fetching Outlook emails:', error);
      throw new Error(`Failed to fetch Outlook emails: ${error.message}`);
    }
  }

  async fetchEmailsBatch(
    batchSize: number = 50, 
    skipToken?: string
  ): Promise<{
    emails: EmailJob[];
    nextToken?: string;
    totalCount: number;
  }> {
    try {
      let query = '/me/messages';
      
      // Build job-related filters
      const jobFilters = this.buildJobFilters();
      query += `?$filter=${jobFilters}`;
      
      // Add pagination
      query += `&$top=${batchSize}`;
      
      if (skipToken) {
        query += `&$skiptoken=${skipToken}`;
      }
      
      // Select specific fields
      query += '&$select=id,subject,sender,receivedDateTime,body,hasAttachments';
      query += '&$orderby=receivedDateTime desc';
      
      const response = await this.graphClient.api(query).get();
      
      return {
        emails: this.transformOutlookEmails(response.value),
        nextToken: response['@odata.nextLink'] ? this.extractSkipToken(response['@odata.nextLink']) : undefined,
        totalCount: response['@odata.count'] || response.value.length
      };
    } catch (error) {
      console.error('Error fetching Outlook batch:', error);
      throw new Error(`Failed to fetch Outlook batch: ${error.message}`);
    }
  }

  async searchJobEmails(searchQuery: string): Promise<EmailJob[]> {
    try {
      const query = `/me/messages?$search="${searchQuery}"&$filter=receivedDateTime ge ${this.getDateMonthsAgo(3).toISOString()}&$top=50`;
      
      const response = await this.graphClient.api(query).get();
      
      return this.transformOutlookEmails(response.value);
    } catch (error) {
      console.error('Error searching Outlook emails:', error);
      throw new Error(`Failed to search Outlook emails: ${error.message}`);
    }
  }

  async getEmailDetails(emailId: string): Promise<EmailJob> {
    try {
      const email = await this.graphClient
        .api(`/me/messages/${emailId}`)
        .select('id,subject,sender,receivedDateTime,body,attachments')
        .expand('attachments')
        .get();
      
      return this.transformOutlookEmail(email);
    } catch (error) {
      console.error('Error fetching email details:', error);
      throw new Error(`Failed to fetch email details: ${error.message}`);
    }
  }

  async markAsProcessed(emailId: string): Promise<void> {
    try {
      await this.graphClient
        .api(`/me/messages/${emailId}`)
        .update({
          categories: ['Processed by Rashenal']
        });
    } catch (error) {
      console.error('Error marking email as processed:', error);
    }
  }

  private transformOutlookEmails(outlookEmails: any[]): EmailJob[] {
    return outlookEmails.map(email => this.transformOutlookEmail(email));
  }

  private transformOutlookEmail(outlookEmail: any): EmailJob {
    return {
      id: `outlook_${outlookEmail.id}`,
      provider: 'outlook',
      messageId: outlookEmail.id,
      subject: outlookEmail.subject,
      sender: {
        email: outlookEmail.sender?.emailAddress?.address || '',
        name: outlookEmail.sender?.emailAddress?.name
      },
      receivedDate: new Date(outlookEmail.receivedDateTime),
      body: {
        text: outlookEmail.body?.contentType === 'text' ? outlookEmail.body.content : undefined,
        html: outlookEmail.body?.contentType === 'html' ? outlookEmail.body.content : undefined
      },
      attachments: outlookEmail.attachments?.map((att: any) => ({
        id: att.id,
        filename: att.name,
        contentType: att.contentType,
        size: att.size
      })),
      labels: outlookEmail.categories || [],
      isProcessed: outlookEmail.categories?.includes('Processed by Rashenal') || false,
      extractedData: undefined // Will be populated by AI processing
    };
  }

  private buildJobFilters(): string {
    const filters: string[] = [];
    
    // Date filter - last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filters.push(`receivedDateTime ge ${thirtyDaysAgo.toISOString()}`);
    
    // Job-related keywords in subject or body
    const jobKeywords = [
      'job',
      'career',
      'hiring',
      'opportunity',
      'position',
      'vacancy',
      'opening',
      'recruitment'
    ];
    
    const keywordFilters = jobKeywords
      .map(keyword => `(contains(subject, '${keyword}') or contains(body/content, '${keyword}'))`)
      .join(' or ');
    
    filters.push(`(${keywordFilters})`);
    
    return filters.join(' and ');
  }

  private extractSkipToken(nextLink: string): string | undefined {
    const match = nextLink.match(/\$skiptoken=([^&]+)/);
    return match ? match[1] : undefined;
  }

  private getDateMonthsAgo(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  }

  async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_MICROSOFT_CLIENT_ID!,
          client_secret: process.env.REACT_APP_MICROSOFT_CLIENT_SECRET!,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
          scope: 'Mail.Read offline_access'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Update the graph client with new token
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, this.accessToken);
        }
      });
    } catch (error) {
      console.error('Error refreshing Outlook token:', error);
      throw error;
    }
  }
}