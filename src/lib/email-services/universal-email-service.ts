import { supabase } from '../../lib/supabase';
import { GmailJobService } from './gmail-service';
import { OutlookJobService } from './outlook-service';
import { 
  EmailProvider, 
  EmailJob, 
  SyncReport, 
  ProcessingStats,
  SyncError 
} from './types';

export class UniversalEmailService {
  private gmailService: GmailJobService | null = null;
  private outlookService: OutlookJobService | null = null;
  private userId: string;
  private processingQueue: EmailJob[] = [];
  private isProcessing = false;

  constructor(userId: string) {
    this.userId = userId;
  }

  async initialize() {
    // Load existing connections from database
    const { data: connections } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', this.userId);

    if (connections) {
      for (const conn of connections) {
        if (conn.provider === 'gmail' && conn.is_active) {
          this.gmailService = new GmailJobService(conn.access_token, conn.refresh_token);
        }
        if (conn.provider === 'outlook' && conn.is_active) {
          this.outlookService = new OutlookJobService(conn.access_token, conn.refresh_token);
        }
      }
    }
  }

  async connectProvider(provider: 'gmail' | 'outlook'): Promise<void> {
    if (provider === 'gmail') {
      // Initiate OAuth flow for Gmail
      const authUrl = await this.getGmailAuthUrl();
      window.location.href = authUrl;
    } else if (provider === 'outlook') {
      // Initiate OAuth flow for Outlook
      const authUrl = await this.getOutlookAuthUrl();
      window.location.href = authUrl;
    }
  }

  async disconnectProvider(provider: 'gmail' | 'outlook'): Promise<void> {
    await supabase
      .from('email_connections')
      .update({ is_active: false })
      .eq('user_id', this.userId)
      .eq('provider', provider);

    if (provider === 'gmail') {
      this.gmailService = null;
    } else {
      this.outlookService = null;
    }
  }

  async getProviderStatus(): Promise<EmailProvider[]> {
    const providers: EmailProvider[] = [];

    // Get Gmail status
    const gmailStatus = await this.getProviderInfo('gmail');
    providers.push(gmailStatus);

    // Get Outlook status  
    const outlookStatus = await this.getProviderInfo('outlook');
    providers.push(outlookStatus);

    return providers;
  }

  private async getProviderInfo(provider: 'gmail' | 'outlook'): Promise<EmailProvider> {
    const { data } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', this.userId)
      .eq('provider', provider)
      .single();

    if (!data || !data.is_active) {
      return {
        name: provider,
        isConnected: false,
        lastSync: null,
        totalEmails: 0,
        processedEmails: 0
      };
    }

    const { data: stats } = await supabase
      .from('email_sync_stats')
      .select('*')
      .eq('user_id', this.userId)
      .eq('provider', provider)
      .order('last_sync', { ascending: false })
      .limit(1)
      .single();

    return {
      name: provider,
      isConnected: true,
      lastSync: stats?.last_sync ? new Date(stats.last_sync) : null,
      totalEmails: stats?.total_emails || 0,
      processedEmails: stats?.processed_emails || 0,
      accountEmail: data.account_email
    };
  }

  async fetchJobEmailsFromAll(since?: Date): Promise<EmailJob[]> {
    const allEmails: EmailJob[] = [];
    const errors: SyncError[] = [];

    // Fetch from Gmail
    if (this.gmailService) {
      try {
        const gmailEmails = await this.gmailService.fetchJobEmails(since);
        allEmails.push(...gmailEmails);
      } catch (error) {
        errors.push({
          timestamp: new Date(),
          provider: 'gmail',
          errorType: 'fetch_error',
          message: error.message
        });
      }
    }

    // Fetch from Outlook
    if (this.outlookService) {
      try {
        const outlookEmails = await this.outlookService.fetchJobEmails(since);
        allEmails.push(...outlookEmails);
      } catch (error) {
        errors.push({
          timestamp: new Date(),
          provider: 'outlook', 
          errorType: 'fetch_error',
          message: error.message
        });
      }
    }

    // Log any errors
    if (errors.length > 0) {
      await this.logSyncErrors(errors);
    }

    return allEmails;
  }

  async syncAllProviders(): Promise<SyncReport[]> {
    const reports: SyncReport[] = [];

    // Sync Gmail
    if (this.gmailService) {
      const gmailReport = await this.syncProvider('gmail');
      reports.push(gmailReport);
    }

    // Sync Outlook
    if (this.outlookService) {
      const outlookReport = await this.syncProvider('outlook');
      reports.push(outlookReport);
    }

    return reports;
  }

  private async syncProvider(provider: 'gmail' | 'outlook'): Promise<SyncReport> {
    const startTime = new Date();
    const errors: SyncError[] = [];
    let emailsFetched = 0;
    let emailsProcessed = 0;
    let jobsExtracted = 0;

    try {
      // Get last sync time
      const { data: lastSync } = await supabase
        .from('email_sync_stats')
        .select('last_sync')
        .eq('user_id', this.userId)
        .eq('provider', provider)
        .order('last_sync', { ascending: false })
        .limit(1)
        .single();

      const since = lastSync?.last_sync ? new Date(lastSync.last_sync) : undefined;

      // Fetch emails
      const emails = provider === 'gmail' 
        ? await this.gmailService!.fetchJobEmails(since)
        : await this.outlookService!.fetchJobEmails(since);

      emailsFetched = emails.length;

      // Process emails in batches
      const batchSize = 50;
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const processedBatch = await this.processBatch(batch);
        emailsProcessed += processedBatch.processed;
        jobsExtracted += processedBatch.jobsFound;
      }

      // Update sync stats
      await this.updateSyncStats(provider, {
        emailsFetched,
        emailsProcessed,
        jobsExtracted
      });

      return {
        provider,
        startTime,
        endTime: new Date(),
        emailsFetched,
        emailsProcessed,
        jobsExtracted,
        errors,
        status: 'success'
      };
    } catch (error) {
      errors.push({
        timestamp: new Date(),
        provider,
        errorType: 'sync_error',
        message: error.message
      });

      return {
        provider,
        startTime,
        endTime: new Date(),
        emailsFetched,
        emailsProcessed,
        jobsExtracted,
        errors,
        status: 'failed'
      };
    }
  }

  async bulkProcessEmails(batchSize: number = 50): Promise<ProcessingStats> {
    if (this.isProcessing) {
      throw new Error('Bulk processing already in progress');
    }

    this.isProcessing = true;
    const stats: ProcessingStats = {
      totalProcessed: 0,
      successfullyParsed: 0,
      failedToParse: 0,
      duplicatesSkipped: 0,
      averageProcessingTime: 0,
      providersStats: {
        gmail: { processed: 0, parsed: 0, failed: 0 },
        outlook: { processed: 0, parsed: 0, failed: 0 }
      }
    };

    try {
      // Get all unprocessed emails
      const unprocessedEmails = await this.fetchUnprocessedEmails();
      
      // Sort by date (newest first) and provider reputation
      const prioritizedEmails = this.prioritizeEmails(unprocessedEmails);
      
      // Process in batches
      const totalBatches = Math.ceil(prioritizedEmails.length / batchSize);
      let totalTime = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batchStart = Date.now();
        const batch = prioritizedEmails.slice(i * batchSize, (i + 1) * batchSize);
        
        const batchResult = await this.processBatch(batch);
        
        // Update stats
        stats.totalProcessed += batchResult.processed;
        stats.successfullyParsed += batchResult.parsed;
        stats.failedToParse += batchResult.failed;
        stats.duplicatesSkipped += batchResult.duplicates;
        
        // Update provider stats
        for (const email of batch) {
          const provider = email.provider;
          stats.providersStats[provider].processed++;
          if (email.extractedData) {
            stats.providersStats[provider].parsed++;
          } else if (email.isProcessed) {
            stats.providersStats[provider].failed++;
          }
        }
        
        totalTime += Date.now() - batchStart;
        
        // Progress callback
        await this.reportProgress(i + 1, totalBatches, stats);
        
        // Rate limiting pause
        if (i < totalBatches - 1) {
          await this.sleep(1000); // 1 second between batches
        }
      }
      
      stats.averageProcessingTime = totalTime / stats.totalProcessed;
      
    } finally {
      this.isProcessing = false;
    }

    return stats;
  }

  private prioritizeEmails(emails: EmailJob[]): EmailJob[] {
    // Priority scoring system
    const scoredEmails = emails.map(email => {
      let score = 0;
      
      // Recency score (0-40 points)
      const ageInDays = (Date.now() - email.receivedDate.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 40 - ageInDays * 2);
      
      // Known job board score (0-30 points)
      const knownJobBoards = [
        'linkedin.com',
        'indeed.com',
        'glassdoor.com',
        'angellist.com',
        'hired.com',
        'dice.com',
        'monster.com'
      ];
      if (knownJobBoards.some(board => email.sender.email.includes(board))) {
        score += 30;
      }
      
      // Subject line indicators (0-20 points)
      const jobKeywords = [
        'job alert',
        'new position',
        'opportunity',
        'hiring',
        'vacancy',
        'opening'
      ];
      const subjectLower = email.subject.toLowerCase();
      if (jobKeywords.some(keyword => subjectLower.includes(keyword))) {
        score += 20;
      }
      
      // Provider reliability (0-10 points)
      score += email.provider === 'gmail' ? 10 : 5;
      
      return { email, score };
    });
    
    // Sort by score descending
    return scoredEmails
      .sort((a, b) => b.score - a.score)
      .map(item => item.email);
  }

  private async processBatch(emails: EmailJob[]): Promise<{
    processed: number;
    parsed: number;
    failed: number;
    duplicates: number;
    jobsFound: number;
  }> {
    const result = {
      processed: 0,
      parsed: 0,
      failed: 0,
      duplicates: 0,
      jobsFound: 0
    };

    for (const email of emails) {
      try {
        // Check if already processed
        const { data: existing } = await supabase
          .from('processed_emails')
          .select('id')
          .eq('message_id', email.messageId)
          .single();

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Extract job data using AI
        const extractedData = await this.extractJobData(email);
        
        if (extractedData && extractedData.confidence > 0.7) {
          email.extractedData = extractedData;
          result.parsed++;
          result.jobsFound++;
          
          // Save to job search results
          await this.saveJobResult(email);
        }

        // Mark as processed
        await this.markEmailProcessed(email);
        result.processed++;

      } catch (error) {
        console.error(`Failed to process email ${email.id}:`, error);
        result.failed++;
      }
    }

    return result;
  }

  private async extractJobData(email: EmailJob): Promise<ExtractedJobData | null> {
    // This would integrate with Claude API for intelligent extraction
    // For now, return mock data
    return {
      jobTitle: 'Software Engineer',
      company: 'Tech Corp',
      location: 'Remote',
      salary: { min: 80000, max: 120000, currency: 'USD' },
      jobType: 'full-time',
      remote: 'remote',
      confidence: 0.85
    };
  }

  private async fetchUnprocessedEmails(): Promise<EmailJob[]> {
    // Implementation to fetch unprocessed emails from database
    return [];
  }

  private async markEmailProcessed(email: EmailJob): Promise<void> {
    await supabase.from('processed_emails').insert({
      user_id: this.userId,
      provider: email.provider,
      message_id: email.messageId,
      processed_at: new Date().toISOString(),
      extracted_data: email.extractedData
    });
  }

  private async saveJobResult(email: EmailJob): Promise<void> {
    // Save extracted job to job_search_results table
    await supabase.from('job_search_results').insert({
      user_id: this.userId,
      source: email.provider,
      job_title: email.extractedData?.jobTitle,
      company: email.extractedData?.company,
      location: email.extractedData?.location,
      job_data: email.extractedData,
      email_id: email.messageId,
      created_at: new Date().toISOString()
    });
  }

  private async updateSyncStats(provider: string, stats: any): Promise<void> {
    await supabase.from('email_sync_stats').upsert({
      user_id: this.userId,
      provider,
      last_sync: new Date().toISOString(),
      total_emails: stats.emailsFetched,
      processed_emails: stats.emailsProcessed,
      jobs_extracted: stats.jobsExtracted
    });
  }

  private async reportProgress(current: number, total: number, stats: ProcessingStats): Promise<void> {
    const progress = (current / total) * 100;
    
    await supabase.from('bulk_processing_status').upsert({
      user_id: this.userId,
      progress,
      current_batch: current,
      total_batches: total,
      stats,
      updated_at: new Date().toISOString()
    });
  }

  private async logSyncErrors(errors: SyncError[]): Promise<void> {
    await supabase.from('email_sync_errors').insert(
      errors.map(error => ({
        user_id: this.userId,
        ...error,
        timestamp: error.timestamp.toISOString()
      }))
    );
  }

  private async getGmailAuthUrl(): Promise<string> {
    // Implementation for Gmail OAuth URL
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/gmail/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly`;
  }

  private async getOutlookAuthUrl(): Promise<string> {
    // Implementation for Outlook OAuth URL
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.REACT_APP_MICROSOFT_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/outlook/callback&response_type=code&scope=Mail.Read`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}