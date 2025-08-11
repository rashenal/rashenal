// Microsoft Outlook Calendar integration provider
import type { CalendarProvider, CalendarEvent, CalendarAttendee } from './calendar-service';

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  body?: { content: string; contentType: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  attendees?: OutlookCalendarAttendee[];
  reminderMinutesBeforeStart?: number;
  recurrence?: OutlookRecurrencePattern;
  showAs: string;
  importance: string;
}

export interface OutlookCalendarAttendee {
  emailAddress: { address: string; name?: string };
  status: { response: string; time?: string };
  type: string;
}

export interface OutlookRecurrencePattern {
  pattern: {
    type: string;
    interval: number;
    daysOfWeek?: string[];
  };
  range: {
    type: string;
    startDate: string;
    endDate?: string;
    numberOfOccurrences?: number;
  };
}

export class OutlookCalendarProvider implements CalendarProvider {
  public readonly name = 'Outlook Calendar';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {}

  public async authenticate(): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string }> {
    // In a real implementation, this would handle OAuth 2.0 flow with Microsoft Graph
    const mockAuth = {
      accessToken: 'mock-outlook-access-token',
      refreshToken: 'mock-outlook-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };

    this.accessToken = mockAuth.accessToken;
    this.refreshToken = mockAuth.refreshToken;

    return mockAuth;
  }

  public async getCalendars(): Promise<{ id: string; name: string; primary: boolean }[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Outlook Calendar');
    }

    // Mock Microsoft Graph API call
    return [
      { id: 'primary', name: 'Calendar', primary: true },
      { id: 'work-calendar', name: 'Work Calendar', primary: false },
      { id: 'shared-calendar', name: 'Shared Calendar', primary: false }
    ];
  }

  public async createEvent(calendarId: string, event: CalendarEvent): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Outlook Calendar');
    }

    const outlookEvent: Partial<OutlookCalendarEvent> = {
      subject: event.title,
      body: event.description ? {
        content: event.description,
        contentType: 'text'
      } : undefined,
      start: this.formatDateTime(event.start),
      end: this.formatDateTime(event.end),
      location: event.location ? { displayName: event.location } : undefined,
      attendees: event.attendees?.map(this.mapAttendee),
      reminderMinutesBeforeStart: this.getDefaultReminderMinutes(event.reminders),
      showAs: this.mapStatus(event.status),
      importance: this.mapPriority(event.metadata.priority)
    };

    if (event.recurrence) {
      outlookEvent.recurrence = this.formatRecurrence(event.recurrence);
    }

    console.log(`Creating Outlook Calendar event: ${event.title} in calendar ${calendarId}`);
    
    // Mock API call - would use fetch to Microsoft Graph API
    const eventId = `outlook-event-${Date.now()}`;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return eventId;
  }

  public async updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Outlook Calendar');
    }

    console.log(`Updating Outlook Calendar event ${eventId} in calendar ${calendarId}`);
    
    const updateData: Partial<OutlookCalendarEvent> = {};
    
    if (event.title) updateData.subject = event.title;
    if (event.description !== undefined) {
      updateData.body = event.description ? {
        content: event.description,
        contentType: 'text'
      } : undefined;
    }
    if (event.start) updateData.start = this.formatDateTime(event.start);
    if (event.end) updateData.end = this.formatDateTime(event.end);
    if (event.location !== undefined) {
      updateData.location = event.location ? { displayName: event.location } : undefined;
    }
    if (event.status) updateData.showAs = this.mapStatus(event.status);

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  public async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Outlook Calendar');
    }

    console.log(`Deleting Outlook Calendar event ${eventId} from calendar ${calendarId}`);
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  public async getEvents(calendarId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Outlook Calendar');
    }

    console.log(`Fetching Outlook Calendar events from ${startDate} to ${endDate}`);

    // Mock events for testing
    const mockEvents: CalendarEvent[] = [
      {
        id: 'outlook-interview-1',
        title: 'Phone Interview: Frontend Developer at DesignCorp',
        description: 'Initial phone screening for Frontend Developer position',
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // +30 minutes
        location: 'Phone call',
        status: 'confirmed',
        category: 'interview',
        reminders: [{ method: 'popup', minutes: 10 }],
        attendees: [{
          email: 'recruiter@designcorp.com',
          name: 'Sarah Johnson',
          status: 'accepted',
          role: 'organizer'
        }],
        metadata: {
          companyName: 'DesignCorp',
          interviewType: 'phone',
          priority: 'high',
          source: 'outlook'
        }
      },
      {
        id: 'outlook-networking-1',
        title: 'Tech Meetup: React Developers Network',
        description: 'Monthly meetup for React developers in the city',
        start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
        location: 'Tech Hub Downtown',
        status: 'confirmed',
        category: 'networking',
        reminders: [{ method: 'email', minutes: 60 }],
        metadata: {
          priority: 'medium',
          source: 'outlook'
        }
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return mockEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
    });
  }

  public async watchEvents(calendarId: string, webhookUrl: string): Promise<{ id: string; expiration?: string }> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Outlook Calendar');
    }

    console.log(`Setting up Outlook Calendar webhook for calendar ${calendarId} to ${webhookUrl}`);
    
    // Mock webhook setup using Microsoft Graph subscriptions
    return {
      id: `outlook-watch-${Date.now()}`,
      expiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now (Graph API limit)
    };
  }

  private formatDateTime(dateTime: string): { dateTime: string; timeZone: string } {
    return {
      dateTime: dateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private mapAttendee(attendee: CalendarAttendee): OutlookCalendarAttendee {
    return {
      emailAddress: {
        address: attendee.email,
        name: attendee.name
      },
      status: {
        response: this.mapAttendeeStatus(attendee.status)
      },
      type: this.mapAttendeeType(attendee.role)
    };
  }

  private mapAttendeeStatus(status: CalendarAttendee['status']): string {
    const statusMap = {
      'accepted': 'accepted',
      'declined': 'declined',
      'tentative': 'tentativelyAccepted',
      'needs-action': 'notResponded'
    };
    return statusMap[status] || 'notResponded';
  }

  private mapAttendeeType(role: CalendarAttendee['role']): string {
    const roleMap = {
      'organizer': 'organizer',
      'attendee': 'required',
      'optional': 'optional'
    };
    return roleMap[role] || 'required';
  }

  private mapStatus(status: CalendarEvent['status']): string {
    const statusMap = {
      'confirmed': 'busy',
      'tentative': 'tentative',
      'cancelled': 'free'
    };
    return statusMap[status] || 'busy';
  }

  private mapPriority(priority: string): string {
    const priorityMap = {
      'low': 'low',
      'medium': 'normal',
      'high': 'high',
      'critical': 'high'
    };
    return priorityMap[priority] || 'normal';
  }

  private getDefaultReminderMinutes(reminders?: CalendarEvent['reminders']): number {
    if (!reminders || reminders.length === 0) return 15;
    
    // Use the shortest reminder time
    return Math.min(...reminders.map(r => r.minutes));
  }

  private formatRecurrence(recurrence: CalendarEvent['recurrence']): OutlookRecurrencePattern {
    if (!recurrence) {
      throw new Error('Recurrence pattern is required');
    }

    const pattern: OutlookRecurrencePattern = {
      pattern: {
        type: this.mapRecurrenceType(recurrence.frequency),
        interval: recurrence.interval
      },
      range: {
        type: recurrence.until ? 'endDate' : recurrence.count ? 'numbered' : 'noEnd',
        startDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
      }
    };

    if (recurrence.until) {
      pattern.range.endDate = new Date(recurrence.until).toISOString().split('T')[0];
    } else if (recurrence.count) {
      pattern.range.numberOfOccurrences = recurrence.count;
    }

    return pattern;
  }

  private mapRecurrenceType(frequency: string): string {
    const frequencyMap = {
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'absoluteMonthly',
      'yearly': 'absoluteYearly'
    };
    return frequencyMap[frequency.toLowerCase()] || 'daily';
  }

  public async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('Refreshing Outlook Calendar access token');
    
    // Mock token refresh
    this.accessToken = 'new-mock-outlook-access-token';
    return this.accessToken;
  }
}

export default OutlookCalendarProvider;