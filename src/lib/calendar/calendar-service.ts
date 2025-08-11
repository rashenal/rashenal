// Calendar integration service for syncing events with external calendars
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  location?: string;
  attendees?: CalendarAttendee[];
  reminders?: CalendarReminder[];
  recurrence?: CalendarRecurrence;
  status: 'confirmed' | 'tentative' | 'cancelled';
  category: 'job-application' | 'interview' | 'networking' | 'deadline' | 'other';
  metadata: {
    jobId?: string;
    applicationId?: string;
    companyName?: string;
    interviewType?: 'phone' | 'video' | 'in-person' | 'technical' | 'behavioral';
    priority: 'low' | 'medium' | 'high' | 'critical';
    source: 'rashenal' | 'google' | 'outlook' | 'apple' | 'manual';
  };
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  role: 'organizer' | 'attendee' | 'optional';
}

export interface CalendarReminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number; // Minutes before event
}

export interface CalendarRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: string; // ISO 8601
  count?: number;
}

export interface CalendarSync {
  id: string;
  userId: string;
  provider: 'google' | 'outlook' | 'apple' | 'caldav';
  calendarId: string;
  calendarName: string;
  enabled: boolean;
  syncDirection: 'read-only' | 'write-only' | 'bidirectional';
  lastSync?: string;
  syncSettings: {
    syncJobApplications: boolean;
    syncInterviews: boolean;
    syncDeadlines: boolean;
    syncNetworking: boolean;
    reminderDefaults: CalendarReminder[];
    categoryMapping: { [key: string]: string };
  };
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface CalendarProvider {
  name: string;
  authenticate(): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string }>;
  getCalendars(): Promise<{ id: string; name: string; primary: boolean }[]>;
  createEvent(calendarId: string, event: CalendarEvent): Promise<string>;
  updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
  getEvents(calendarId: string, startDate: string, endDate: string): Promise<CalendarEvent[]>;
  watchEvents(calendarId: string, webhookUrl: string): Promise<{ id: string; expiration?: string }>;
}

export class CalendarService {
  private providers: Map<string, CalendarProvider> = new Map();
  private syncs: Map<string, CalendarSync> = new Map();

  constructor(private userId: string) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers here - would be implemented with actual provider classes
    console.log('Initializing calendar providers for user:', this.userId);
  }

  public async connectCalendar(
    provider: CalendarSync['provider'], 
    settings: Partial<CalendarSync['syncSettings']> = {}
  ): Promise<CalendarSync> {
    const calendarProvider = this.providers.get(provider);
    if (!calendarProvider) {
      throw new Error(`Calendar provider ${provider} not supported`);
    }

    // Authenticate with provider
    const auth = await calendarProvider.authenticate();
    const calendars = await calendarProvider.getCalendars();
    
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];
    if (!primaryCalendar) {
      throw new Error('No calendars found for this account');
    }

    const sync: CalendarSync = {
      id: `sync-${Date.now()}`,
      userId: this.userId,
      provider,
      calendarId: primaryCalendar.id,
      calendarName: primaryCalendar.name,
      enabled: true,
      syncDirection: 'bidirectional',
      syncSettings: {
        syncJobApplications: true,
        syncInterviews: true,
        syncDeadlines: true,
        syncNetworking: false,
        reminderDefaults: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 }
        ],
        categoryMapping: {
          'job-application': 'Job Search',
          'interview': 'Interviews',
          'deadline': 'Deadlines',
          'networking': 'Networking'
        },
        ...settings
      },
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresAt: auth.expiresAt,
      lastSync: new Date().toISOString()
    };

    this.syncs.set(sync.id, sync);
    await this.saveSyncToDatabase(sync);

    return sync;
  }

  public async createJobApplicationEvent(
    jobTitle: string,
    companyName: string,
    deadline: string,
    jobId?: string,
    applicationId?: string
  ): Promise<string[]> {
    const eventIds: string[] = [];
    const enabledSyncs = Array.from(this.syncs.values()).filter(
      sync => sync.enabled && sync.syncSettings.syncJobApplications
    );

    const event: CalendarEvent = {
      id: `job-app-${Date.now()}`,
      title: `Application Deadline: ${jobTitle} at ${companyName}`,
      description: `Application deadline for ${jobTitle} position at ${companyName}. Remember to submit your application before this date.`,
      start: deadline,
      end: deadline,
      status: 'confirmed',
      category: 'job-application',
      reminders: [
        { method: 'popup', minutes: 60 }, // 1 hour before
        { method: 'email', minutes: 1440 } // 1 day before
      ],
      metadata: {
        jobId,
        applicationId,
        companyName,
        priority: 'high',
        source: 'rashenal'
      }
    };

    for (const sync of enabledSyncs) {
      try {
        const provider = this.providers.get(sync.provider);
        if (provider) {
          const eventId = await provider.createEvent(sync.calendarId, event);
          eventIds.push(eventId);
        }
      } catch (error) {
        console.error(`Failed to create event in ${sync.provider}:`, error);
      }
    }

    return eventIds;
  }

  public async createInterviewEvent(
    jobTitle: string,
    companyName: string,
    interviewTime: string,
    duration: number = 60,
    location?: string,
    interviewType: 'phone' | 'video' | 'in-person' | 'technical' | 'behavioral' = 'video',
    attendees: CalendarAttendee[] = []
  ): Promise<string[]> {
    const eventIds: string[] = [];
    const enabledSyncs = Array.from(this.syncs.values()).filter(
      sync => sync.enabled && sync.syncSettings.syncInterviews
    );

    const startTime = new Date(interviewTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const event: CalendarEvent = {
      id: `interview-${Date.now()}`,
      title: `Interview: ${jobTitle} at ${companyName}`,
      description: this.generateInterviewDescription(jobTitle, companyName, interviewType, location),
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      location,
      attendees,
      status: 'confirmed',
      category: 'interview',
      reminders: [
        { method: 'popup', minutes: 15 }, // 15 minutes before
        { method: 'email', minutes: 60 } // 1 hour before
      ],
      metadata: {
        companyName,
        interviewType,
        priority: 'critical',
        source: 'rashenal'
      }
    };

    for (const sync of enabledSyncs) {
      try {
        const provider = this.providers.get(sync.provider);
        if (provider) {
          const eventId = await provider.createEvent(sync.calendarId, event);
          eventIds.push(eventId);
        }
      } catch (error) {
        console.error(`Failed to create interview event in ${sync.provider}:`, error);
      }
    }

    return eventIds;
  }

  public async syncEvents(syncId: string): Promise<{ imported: number; updated: number; errors: string[] }> {
    const sync = this.syncs.get(syncId);
    if (!sync || !sync.enabled) {
      throw new Error('Calendar sync not found or disabled');
    }

    const provider = this.providers.get(sync.provider);
    if (!provider) {
      throw new Error(`Provider ${sync.provider} not available`);
    }

    const stats = { imported: 0, updated: 0, errors: [] };

    try {
      // Get events from last week to next month
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const events = await provider.getEvents(sync.calendarId, startDate, endDate);
      
      // Process and categorize events
      for (const event of events) {
        try {
          if (this.isJobRelatedEvent(event)) {
            await this.processJobRelatedEvent(event, sync);
            stats.imported++;
          }
        } catch (error) {
          stats.errors.push(`Failed to process event ${event.title}: ${error.message}`);
        }
      }

      // Update last sync time
      sync.lastSync = new Date().toISOString();
      await this.saveSyncToDatabase(sync);

    } catch (error) {
      stats.errors.push(`Sync failed: ${error.message}`);
    }

    return stats;
  }

  public async getUpcomingEvents(days: number = 30): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const startDate = new Date().toISOString();

    for (const sync of this.syncs.values()) {
      if (!sync.enabled) continue;

      try {
        const provider = this.providers.get(sync.provider);
        if (provider) {
          const syncEvents = await provider.getEvents(sync.calendarId, startDate, endDate);
          events.push(...syncEvents.filter(event => this.isJobRelatedEvent(event)));
        }
      } catch (error) {
        console.error(`Failed to get events from ${sync.provider}:`, error);
      }
    }

    // Sort by start time
    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  private generateInterviewDescription(
    jobTitle: string,
    companyName: string,
    interviewType: string,
    location?: string
  ): string {
    let description = `Interview for ${jobTitle} position at ${companyName}.\n\n`;
    description += `Type: ${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} interview\n`;
    
    if (location) {
      description += `Location: ${location}\n`;
    }

    description += '\nPreparation reminders:\n';
    description += '• Research the company and role\n';
    description += '• Prepare answers for common questions\n';
    description += '• Review your resume and portfolio\n';
    description += '• Prepare questions to ask the interviewer\n';
    
    if (interviewType === 'technical') {
      description += '• Practice coding problems\n';
      description += '• Review technical concepts relevant to the role\n';
    }

    return description;
  }

  private isJobRelatedEvent(event: CalendarEvent): boolean {
    const keywords = [
      'interview', 'job', 'application', 'career', 'hiring',
      'recruiter', 'hr', 'phone screen', 'technical'
    ];
    
    const text = `${event.title} ${event.description || ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword)) || 
           ['job-application', 'interview', 'networking'].includes(event.category);
  }

  private async processJobRelatedEvent(event: CalendarEvent, sync: CalendarSync): Promise<void> {
    // This would integrate with the job application tracking system
    // For now, just log the event
    console.log(`Processing job-related event: ${event.title} from ${sync.provider}`);
    
    // Could create tasks, update application status, etc.
    // await this.createTaskFromEvent(event);
    // await this.updateApplicationFromEvent(event);
  }

  private async saveSyncToDatabase(sync: CalendarSync): Promise<void> {
    // In a real implementation, this would save to Supabase
    console.log(`Saving calendar sync ${sync.id} to database`);
    
    // Mock database operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  public async removeSyncedEvent(eventId: string, syncId: string): Promise<void> {
    const sync = this.syncs.get(syncId);
    if (!sync) {
      throw new Error('Calendar sync not found');
    }

    const provider = this.providers.get(sync.provider);
    if (!provider) {
      throw new Error(`Provider ${sync.provider} not available`);
    }

    await provider.deleteEvent(sync.calendarId, eventId);
  }

  public async disconnectCalendar(syncId: string): Promise<void> {
    this.syncs.delete(syncId);
    // Would also remove from database
    console.log(`Disconnected calendar sync ${syncId}`);
  }

  public getConnectedCalendars(): CalendarSync[] {
    return Array.from(this.syncs.values());
  }

  public async updateSyncSettings(syncId: string, settings: Partial<CalendarSync['syncSettings']>): Promise<void> {
    const sync = this.syncs.get(syncId);
    if (!sync) {
      throw new Error('Calendar sync not found');
    }

    sync.syncSettings = { ...sync.syncSettings, ...settings };
    await this.saveSyncToDatabase(sync);
  }
}

export default CalendarService;