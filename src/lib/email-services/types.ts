// Email service type definitions

export interface EmailProvider {
  name: 'gmail' | 'outlook';
  isConnected: boolean;
  lastSync: Date | null;
  totalEmails: number;
  processedEmails: number;
  accountEmail?: string;
}

export interface EmailJob {
  id: string;
  provider: 'gmail' | 'outlook';
  messageId: string;
  subject: string;
  sender: {
    email: string;
    name?: string;
  };
  receivedDate: Date;
  body: {
    text?: string;
    html?: string;
  };
  attachments?: EmailAttachment[];
  labels?: string[];
  isProcessed: boolean;
  extractedData?: ExtractedJobData;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface ExtractedJobData {
  jobTitle?: string;
  company?: string;
  location?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote?: 'onsite' | 'remote' | 'hybrid';
  applyUrl?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  postedDate?: Date;
  deadline?: Date;
  source?: string;
  confidence: number; // 0-1 confidence in extraction
}

export interface SyncReport {
  provider: 'gmail' | 'outlook';
  startTime: Date;
  endTime: Date;
  emailsFetched: number;
  emailsProcessed: number;
  jobsExtracted: number;
  errors: SyncError[];
  status: 'success' | 'partial' | 'failed';
}

export interface SyncError {
  timestamp: Date;
  provider: 'gmail' | 'outlook';
  errorType: string;
  message: string;
  emailId?: string;
}

export interface ProcessingStats {
  totalProcessed: number;
  successfullyParsed: number;
  failedToParse: number;
  duplicatesSkipped: number;
  averageProcessingTime: number;
  providersStats: {
    [provider: string]: {
      processed: number;
      parsed: number;
      failed: number;
    };
  };
}