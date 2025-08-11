// Google Calendar integration provider
import type { CalendarProvider, CalendarEvent, CalendarAttendee } from './calendar-service';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  location?: string;
  attendees?: GoogleCalendarAttendee[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  recurrence?: string[];
  status: string;
}

export interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus: string;
  organizer?: boolean;
  optional?: boolean;
}

export class GoogleCalendarProvider implements CalendarProvider {
  public readonly name = 'Google Calendar';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {}

  public async authenticate(): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string }> {
    // In a real implementation, this would handle OAuth 2.0 flow with Google
    // For now, return mock authentication
    const mockAuth = {
      accessToken: 'mock-google-access-token',
      refreshToken: 'mock-google-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };

    this.accessToken = mockAuth.accessToken;
    this.refreshToken = mockAuth.refreshToken;

    return mockAuth;
  }

  public async getCalendars(): Promise<{ id: string; name: string; primary: boolean }[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    // Mock Google Calendar API call
    return [
      { id: 'primary', name: 'Primary Calendar', primary: true },
      { id: 'work-calendar', name: 'Work Calendar', primary: false },
      { id: 'personal-calendar', name: 'Personal Calendar', primary: false }
    ];
  }

  public async createEvent(calendarId: string, event: CalendarEvent): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    const googleEvent: Partial<GoogleCalendarEvent> = {
      summary: event.title,
      description: event.description,
      start: this.formatDateTime(event.start),
      end: this.formatDateTime(event.end),
      location: event.location,
      attendees: event.attendees?.map(this.mapAttendee),
      reminders: event.reminders ? {
        useDefault: false,
        overrides: event.reminders.map(reminder => ({
          method: reminder.method === 'popup' ? 'popup' : 'email',
          minutes: reminder.minutes
        }))
      } : { useDefault: true },
      status: this.mapStatus(event.status)
    };

    if (event.recurrence) {
      googleEvent.recurrence = this.formatRecurrence(event.recurrence);
    }

    console.log(`Creating Google Calendar event: ${event.title} in calendar ${calendarId}`);
    
    // Mock API call - would use fetch to Google Calendar API
    const eventId = `google-event-${Date.now()}`;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return eventId;
  }

  public async updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    console.log(`Updating Google Calendar event ${eventId} in calendar ${calendarId}`);
    
    const updateData: Partial<GoogleCalendarEvent> = {};
    
    if (event.title) updateData.summary = event.title;
    if (event.description !== undefined) updateData.description = event.description;
    if (event.start) updateData.start = this.formatDateTime(event.start);
    if (event.end) updateData.end = this.formatDateTime(event.end);
    if (event.location !== undefined) updateData.location = event.location;
    if (event.status) updateData.status = this.mapStatus(event.status);

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  public async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    console.log(`Deleting Google Calendar event ${eventId} from calendar ${calendarId}`);
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  public async getEvents(calendarId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    console.log(`Fetching Google Calendar events from ${startDate} to ${endDate}`);

    // Mock events for testing
    const mockEvents: CalendarEvent[] = [
      {
        id: 'google-interview-1',
        title: 'Interview: Senior Developer at TechCorp',
        description: 'Technical interview for Senior Developer position',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        location: 'Video call',
        status: 'confirmed',
        category: 'interview',
        reminders: [{ method: 'popup', minutes: 15 }],
        metadata: {
          companyName: 'TechCorp',
          interviewType: 'technical',
          priority: 'critical',
          source: 'google'
        }
      },
      {
        id: 'google-deadline-1',
        title: 'Application Deadline: Product Manager at StartupXYZ',
        description: 'Submit application for Product Manager role',
        start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        category: 'job-application',
        reminders: [{ method: 'email', minutes: 1440 }], // 1 day before
        metadata: {
          companyName: 'StartupXYZ',
          priority: 'high',
          source: 'google'
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
      throw new Error('Not authenticated with Google Calendar');
    }

    console.log(`Setting up Google Calendar webhook for calendar ${calendarId} to ${webhookUrl}`);
    
    // Mock webhook setup
    return {
      id: `google-watch-${Date.now()}`,
      expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };
  }

  private formatDateTime(dateTime: string): { dateTime: string; timeZone?: string } {
    return {
      dateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private mapAttendee(attendee: CalendarAttendee): GoogleCalendarAttendee {
    return {
      email: attendee.email,
      displayName: attendee.name,
      responseStatus: this.mapAttendeeStatus(attendee.status),
      organizer: attendee.role === 'organizer',
      optional: attendee.role === 'optional'
    };
  }

  private mapAttendeeStatus(status: CalendarAttendee['status']): string {
    const statusMap = {
      'accepted': 'accepted',
      'declined': 'declined',
      'tentative': 'tentative',
      'needs-action': 'needsAction'
    };
    return statusMap[status] || 'needsAction';
  }

  private mapStatus(status: CalendarEvent['status']): string {
    const statusMap = {
      'confirmed': 'confirmed',
      'tentative': 'tentative',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'confirmed';
  }

  private formatRecurrence(recurrence: CalendarEvent['recurrence']): string[] {
    if (!recurrence) return [];

    const { frequency, interval = 1, until, count } = recurrence;
    
    let rrule = `FREQ=${frequency.toUpperCase()};INTERVAL=${interval}`;
    
    if (until) {
      rrule += `;UNTIL=${until.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`;
    } else if (count) {
      rrule += `;COUNT=${count}`;
    }

    return [`RRULE:${rrule}`];
  }

  public async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('Refreshing Google Calendar access token');
    
    // Mock token refresh
    this.accessToken = 'new-mock-google-access-token';
    return this.accessToken;
  }
}

export default GoogleCalendarProvider;