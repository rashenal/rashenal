import { EmailJob } from './types';

export class GmailJobService {
  private accessToken: string;
  private refreshToken: string;
  private apiEndpoint = 'https://gmail.googleapis.com/gmail/v1';

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async fetchJobEmails(since?: Date): Promise<EmailJob[]> {
    try {
      // Build query
      const queryParts: string[] = [];
      
      // Add job-related search terms
      const jobTerms = [
        'job alert',
        'new position',
        'job opportunity',
        'hiring',
        'vacancy',
        'career'
      ];
      
      const jobQuery = jobTerms.map(term => `"${term}"`).join(' OR ');
      queryParts.push(`(${jobQuery})`);
      
      // Add sender filters
      const jobBoards = [
        'linkedin.com',
        'indeed.com',
        'glassdoor.com',
        'monster.com',
        'dice.com',
        'ziprecruiter.com'
      ];
      
      const senderQuery = jobBoards.map(board => `from:${board}`).join(' OR ');
      queryParts.push(`(${senderQuery})`);
      
      // Add date filter
      if (since) {
        const dateStr = Math.floor(since.getTime() / 1000);
        queryParts.push(`after:${dateStr}`);
      }
      
      const query = queryParts.join(' ');
      
      // Fetch message IDs
      const listResponse = await this.makeGmailRequest('/users/me/messages', {
        q: query,
        maxResults: '100'
      });
      
      if (!listResponse.messages || listResponse.messages.length === 0) {
        return [];
      }
      
      // Fetch full messages
      const emails: EmailJob[] = [];
      
      // Use batch request for efficiency
      const batchSize = 10;
      for (let i = 0; i < listResponse.messages.length; i += batchSize) {
        const batch = listResponse.messages.slice(i, i + batchSize);
        const batchEmails = await Promise.all(
          batch.map(msg => this.fetchEmailDetails(msg.id))
        );
        emails.push(...batchEmails.filter(email => email !== null));
      }
      
      return emails;
    } catch (error) {
      console.error('Error fetching Gmail emails:', error);
      throw new Error(`Failed to fetch Gmail emails: ${error.message}`);
    }
  }

  async fetchEmailDetails(messageId: string): Promise<EmailJob | null> {
    try {
      const message = await this.makeGmailRequest(`/users/me/messages/${messageId}`, {
        format: 'full'
      });
      
      return this.transformGmailMessage(message);
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      return null;
    }
  }

  async searchJobEmails(searchQuery: string): Promise<EmailJob[]> {
    try {
      const response = await this.makeGmailRequest('/users/me/messages', {
        q: searchQuery,
        maxResults: '50'
      });
      
      if (!response.messages) {
        return [];
      }
      
      const emails = await Promise.all(
        response.messages.map(msg => this.fetchEmailDetails(msg.id))
      );
      
      return emails.filter(email => email !== null);
    } catch (error) {
      console.error('Error searching Gmail:', error);
      throw new Error(`Failed to search Gmail: ${error.message}`);
    }
  }

  private async makeGmailRequest(path: string, params?: any): Promise<any> {
    const url = new URL(`${this.apiEndpoint}${path}`);
    
    if (params) {
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshAccessToken();
      
      // Retry request
      const retryResponse = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!retryResponse.ok) {
        throw new Error(`Gmail API error: ${retryResponse.statusText}`);
      }
      
      return retryResponse.json();
    }
    
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  private transformGmailMessage(gmailMessage: any): EmailJob {
    const headers = this.parseHeaders(gmailMessage.payload.headers);
    const body = this.extractBody(gmailMessage.payload);
    const attachments = this.extractAttachments(gmailMessage.payload);
    
    return {
      id: `gmail_${gmailMessage.id}`,
      provider: 'gmail',
      messageId: gmailMessage.id,
      subject: headers.subject || '',
      sender: {
        email: this.extractEmail(headers.from) || '',
        name: this.extractName(headers.from)
      },
      receivedDate: new Date(parseInt(gmailMessage.internalDate)),
      body: {
        text: body.text,
        html: body.html
      },
      attachments,
      labels: gmailMessage.labelIds || [],
      isProcessed: gmailMessage.labelIds?.includes('PROCESSED') || false,
      extractedData: undefined
    };
  }

  private parseHeaders(headers: any[]): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    
    headers.forEach(header => {
      result[header.name.toLowerCase()] = header.value;
    });
    
    return result;
  }

  private extractBody(payload: any): { text?: string; html?: string } {
    const result: { text?: string; html?: string } = {};
    
    const extractParts = (parts: any[]) => {
      if (!parts) return;
      
      parts.forEach(part => {
        if (part.mimeType === 'text/plain' && part.body.data) {
          result.text = this.decodeBase64(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body.data) {
          result.html = this.decodeBase64(part.body.data);
        } else if (part.parts) {
          extractParts(part.parts);
        }
      });
    };
    
    if (payload.parts) {
      extractParts(payload.parts);
    } else if (payload.body?.data) {
      const decoded = this.decodeBase64(payload.body.data);
      if (payload.mimeType === 'text/html') {
        result.html = decoded;
      } else {
        result.text = decoded;
      }
    }
    
    return result;
  }

  private extractAttachments(payload: any): any[] {
    const attachments: any[] = [];
    
    const extractFromParts = (parts: any[]) => {
      if (!parts) return;
      
      parts.forEach(part => {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            contentType: part.mimeType,
            size: part.body.size
          });
        }
        
        if (part.parts) {
          extractFromParts(part.parts);
        }
      });
    };
    
    if (payload.parts) {
      extractFromParts(payload.parts);
    }
    
    return attachments;
  }

  private decodeBase64(data: string): string {
    // Gmail uses URL-safe base64
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  private extractEmail(fromHeader: string): string {
    const match = fromHeader?.match(/<(.+)>/);
    return match ? match[1] : fromHeader?.trim() || '';
  }

  private extractName(fromHeader: string): string | undefined {
    const match = fromHeader?.match(/^(.+?)\s*</);
    return match ? match[1].replace(/"/g, '').trim() : undefined;
  }

  async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET!,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
    } catch (error) {
      console.error('Error refreshing Gmail token:', error);
      throw error;
    }
  }

  async markAsProcessed(messageId: string): Promise<void> {
    try {
      await this.makeGmailRequest(`/users/me/messages/${messageId}/modify`, {
        method: 'POST',
        body: JSON.stringify({
          addLabelIds: ['PROCESSED']
        })
      });
    } catch (error) {
      console.error('Error marking email as processed:', error);
    }
  }
}