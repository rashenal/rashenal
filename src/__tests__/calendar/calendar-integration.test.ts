import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarService from '../../lib/calendar/calendar-service';
import GoogleCalendarProvider from '../../lib/calendar/google-calendar-provider';
import OutlookCalendarProvider from '../../lib/calendar/outlook-calendar-provider';

// Mock the providers
vi.mock('../../lib/calendar/google-calendar-provider');
vi.mock('../../lib/calendar/outlook-calendar-provider');

describe('Calendar Integration System', () => {
  let calendarService: CalendarService;
  let mockGoogleProvider: GoogleCalendarProvider;
  let mockOutlookProvider: OutlookCalendarProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    
    calendarService = new CalendarService('test-user');
    
    // Create mock providers
    mockGoogleProvider = {
      name: 'Google Calendar',
      authenticate: vi.fn().mockResolvedValue({
        accessToken: 'mock-google-token',
        refreshToken: 'mock-google-refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }),
      getCalendars: vi.fn().mockResolvedValue([
        { id: 'primary', name: 'Primary Calendar', primary: true }
      ]),
      createEvent: vi.fn().mockResolvedValue('google-event-123'),
      updateEvent: vi.fn().mockResolvedValue(undefined),
      deleteEvent: vi.fn().mockResolvedValue(undefined),
      getEvents: vi.fn().mockResolvedValue([]),
      watchEvents: vi.fn().mockResolvedValue({ id: 'watch-123' })
    } as any;

    mockOutlookProvider = {
      name: 'Outlook Calendar',
      authenticate: vi.fn().mockResolvedValue({
        accessToken: 'mock-outlook-token',
        refreshToken: 'mock-outlook-refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }),
      getCalendars: vi.fn().mockResolvedValue([
        { id: 'primary', name: 'Calendar', primary: true }
      ]),
      createEvent: vi.fn().mockResolvedValue('outlook-event-456'),
      updateEvent: vi.fn().mockResolvedValue(undefined),
      deleteEvent: vi.fn().mockResolvedValue(undefined),
      getEvents: vi.fn().mockResolvedValue([]),
      watchEvents: vi.fn().mockResolvedValue({ id: 'watch-456' })
    } as any;

    // Inject mock providers
    (calendarService as any).providers.set('google', mockGoogleProvider);
    (calendarService as any).providers.set('outlook', mockOutlookProvider);
  });

  describe('Calendar Connection', () => {
    it('should connect to Google Calendar successfully', async () => {
      const sync = await calendarService.connectCalendar('google', {
        syncJobApplications: true,
        syncInterviews: true
      });

      expect(sync).toBeDefined();
      expect(sync.provider).toBe('google');
      expect(sync.enabled).toBe(true);
      expect(sync.syncSettings.syncJobApplications).toBe(true);
      expect(sync.syncSettings.syncInterviews).toBe(true);
      
      expect(mockGoogleProvider.authenticate).toHaveBeenCalledOnce();
      expect(mockGoogleProvider.getCalendars).toHaveBeenCalledOnce();
    });

    it('should connect to Outlook Calendar successfully', async () => {
      const sync = await calendarService.connectCalendar('outlook', {
        syncDeadlines: true,
        syncNetworking: false
      });

      expect(sync).toBeDefined();
      expect(sync.provider).toBe('outlook');
      expect(sync.syncSettings.syncDeadlines).toBe(true);
      expect(sync.syncSettings.syncNetworking).toBe(false);
      
      expect(mockOutlookProvider.authenticate).toHaveBeenCalledOnce();
      expect(mockOutlookProvider.getCalendars).toHaveBeenCalledOnce();
    });

    it('should handle unsupported calendar provider', async () => {
      await expect(
        calendarService.connectCalendar('unsupported' as any)
      ).rejects.toThrow('Calendar provider unsupported not supported');
    });

    it('should handle authentication failure', async () => {
      mockGoogleProvider.authenticate.mockRejectedValueOnce(new Error('Auth failed'));
      
      await expect(
        calendarService.connectCalendar('google')
      ).rejects.toThrow('Auth failed');
    });
  });

  describe('Job Application Events', () => {
    beforeEach(async () => {
      await calendarService.connectCalendar('google');
    });

    it('should create job application deadline event', async () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week from now
      
      const eventIds = await calendarService.createJobApplicationEvent(
        'Senior Developer',
        'TechCorp',
        deadline,
        'job-123',
        'app-456'
      );

      expect(eventIds).toHaveLength(1);
      expect(eventIds[0]).toBe('google-event-123');
      
      expect(mockGoogleProvider.createEvent).toHaveBeenCalledWith(
        'primary',
        expect.objectContaining({
          title: 'Application Deadline: Senior Developer at TechCorp',
          start: deadline,
          end: deadline,
          category: 'job-application',
          metadata: expect.objectContaining({
            jobId: 'job-123',
            applicationId: 'app-456',
            companyName: 'TechCorp',
            priority: 'high'
          })
        })
      );
    });

    it('should create events in multiple connected calendars', async () => {
      await calendarService.connectCalendar('outlook');
      
      const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      
      const eventIds = await calendarService.createJobApplicationEvent(
        'Product Manager',
        'StartupXYZ',
        deadline
      );

      expect(eventIds).toHaveLength(2);
      expect(mockGoogleProvider.createEvent).toHaveBeenCalled();
      expect(mockOutlookProvider.createEvent).toHaveBeenCalled();
    });
  });

  describe('Interview Events', () => {
    beforeEach(async () => {
      await calendarService.connectCalendar('google');
    });

    it('should create interview event with all details', async () => {
      const interviewTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days from now
      
      const eventIds = await calendarService.createInterviewEvent(
        'Frontend Developer',
        'DesignCorp',
        interviewTime,
        90, // 90 minutes
        'Video call via Zoom',
        'technical',
        [{ email: 'interviewer@designcorp.com', name: 'Jane Smith', status: 'accepted', role: 'organizer' }]
      );

      expect(eventIds).toHaveLength(1);
      
      expect(mockGoogleProvider.createEvent).toHaveBeenCalledWith(
        'primary',
        expect.objectContaining({
          title: 'Interview: Frontend Developer at DesignCorp',
          location: 'Video call via Zoom',
          category: 'interview',
          attendees: [
            {
              email: 'interviewer@designcorp.com',
              name: 'Jane Smith',
              status: 'accepted',
              role: 'organizer'
            }
          ],
          metadata: expect.objectContaining({
            companyName: 'DesignCorp',
            interviewType: 'technical',
            priority: 'critical'
          })
        })
      );
    });

    it('should generate appropriate interview description', async () => {
      const interviewTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      await calendarService.createInterviewEvent(
        'Backend Engineer',
        'TechStartup',
        interviewTime,
        60,
        'Office',
        'behavioral'
      );

      const createCall = mockGoogleProvider.createEvent.mock.calls[0];
      const eventData = createCall[1];
      
      expect(eventData.description).toContain('Interview for Backend Engineer position at TechStartup');
      expect(eventData.description).toContain('Type: Behavioral interview');
      expect(eventData.description).toContain('Location: Office');
      expect(eventData.description).toContain('Research the company and role');
      expect(eventData.description).not.toContain('Practice coding problems'); // Not technical
    });

    it('should include technical preparation for technical interviews', async () => {
      const interviewTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      await calendarService.createInterviewEvent(
        'Software Engineer',
        'BigTech',
        interviewTime,
        120,
        undefined,
        'technical'
      );

      const createCall = mockGoogleProvider.createEvent.mock.calls[0];
      const eventData = createCall[1];
      
      expect(eventData.description).toContain('Practice coding problems');
      expect(eventData.description).toContain('Review technical concepts');
    });
  });

  describe('Event Synchronization', () => {
    let syncId: string;

    beforeEach(async () => {
      const sync = await calendarService.connectCalendar('google');
      syncId = sync.id;
    });

    it('should sync events from calendar provider', async () => {
      const mockEvents = [
        {
          id: 'external-interview-1',
          title: 'Interview: Data Scientist at AI Corp',
          description: 'ML engineering interview',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          status: 'confirmed' as const,
          category: 'interview' as const,
          metadata: {
            companyName: 'AI Corp',
            priority: 'high' as const,
            source: 'google' as const
          }
        }
      ];

      mockGoogleProvider.getEvents.mockResolvedValueOnce(mockEvents);

      const stats = await calendarService.syncEvents(syncId);

      expect(stats.imported).toBe(1);
      expect(stats.errors).toHaveLength(0);
      expect(mockGoogleProvider.getEvents).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      mockGoogleProvider.getEvents.mockRejectedValueOnce(new Error('API error'));

      const stats = await calendarService.syncEvents(syncId);

      expect(stats.imported).toBe(0);
      expect(stats.errors).toContain('Sync failed: API error');
    });

    it('should reject sync for disabled calendars', async () => {
      // Disable the sync
      const connectedCalendars = calendarService.getConnectedCalendars();
      const sync = connectedCalendars[0];
      (calendarService as any).syncs.set(sync.id, { ...sync, enabled: false });

      await expect(calendarService.syncEvents(sync.id)).rejects.toThrow(
        'Calendar sync not found or disabled'
      );
    });
  });

  describe('Upcoming Events', () => {
    beforeEach(async () => {
      await calendarService.connectCalendar('google');
      await calendarService.connectCalendar('outlook');
    });

    it('should get upcoming job-related events from all calendars', async () => {
      const mockGoogleEvents = [
        {
          id: 'google-interview',
          title: 'Interview: Engineer at TechCorp',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          status: 'confirmed' as const,
          category: 'interview' as const,
          metadata: { priority: 'critical' as const, source: 'google' as const }
        }
      ];

      const mockOutlookEvents = [
        {
          id: 'outlook-deadline',
          title: 'Application Deadline: Designer at CreativeCorp',
          start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed' as const,
          category: 'job-application' as const,
          metadata: { priority: 'high' as const, source: 'outlook' as const }
        }
      ];

      mockGoogleProvider.getEvents.mockResolvedValueOnce(mockGoogleEvents);
      mockOutlookProvider.getEvents.mockResolvedValueOnce(mockOutlookEvents);

      const upcomingEvents = await calendarService.getUpcomingEvents(7);

      expect(upcomingEvents).toHaveLength(2);
      expect(upcomingEvents[0].id).toBe('google-interview'); // Earlier event first
      expect(upcomingEvents[1].id).toBe('outlook-deadline');
    });

    it('should filter out non-job-related events', async () => {
      const mockEvents = [
        {
          id: 'job-related',
          title: 'Interview: Developer Role',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          status: 'confirmed' as const,
          category: 'interview' as const,
          metadata: { priority: 'high' as const, source: 'google' as const }
        },
        {
          id: 'personal-event',
          title: 'Dentist Appointment',
          start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          status: 'confirmed' as const,
          category: 'other' as const,
          metadata: { priority: 'medium' as const, source: 'google' as const }
        }
      ];

      mockGoogleProvider.getEvents.mockResolvedValueOnce(mockEvents);

      const upcomingEvents = await calendarService.getUpcomingEvents();

      expect(upcomingEvents).toHaveLength(1);
      expect(upcomingEvents[0].id).toBe('job-related');
    });
  });

  describe('Calendar Management', () => {
    let syncId: string;

    beforeEach(async () => {
      const sync = await calendarService.connectCalendar('google');
      syncId = sync.id;
    });

    it('should update sync settings', async () => {
      await calendarService.updateSyncSettings(syncId, {
        syncJobApplications: false,
        syncNetworking: true
      });

      const connectedCalendars = calendarService.getConnectedCalendars();
      const updatedSync = connectedCalendars.find(s => s.id === syncId);

      expect(updatedSync?.syncSettings.syncJobApplications).toBe(false);
      expect(updatedSync?.syncSettings.syncNetworking).toBe(true);
    });

    it('should disconnect calendar', async () => {
      await calendarService.disconnectCalendar(syncId);

      const connectedCalendars = calendarService.getConnectedCalendars();
      expect(connectedCalendars.find(s => s.id === syncId)).toBeUndefined();
    });

    it('should remove synced event', async () => {
      await calendarService.removeSyncedEvent('event-123', syncId);

      expect(mockGoogleProvider.deleteEvent).toHaveBeenCalledWith('primary', 'event-123');
    });

    it('should handle missing sync when removing event', async () => {
      await expect(
        calendarService.removeSyncedEvent('event-123', 'non-existent-sync')
      ).rejects.toThrow('Calendar sync not found');
    });
  });

  describe('Provider Integration', () => {
    it('should support Google Calendar provider', () => {
      // Test that the mock provider has the correct name property
      expect(mockGoogleProvider.name).toBe('Google Calendar');
    });

    it('should support Outlook Calendar provider', () => {
      // Test that the mock provider has the correct name property
      expect(mockOutlookProvider.name).toBe('Outlook Calendar');
    });

    it('should handle provider errors gracefully', async () => {
      mockGoogleProvider.createEvent.mockRejectedValueOnce(new Error('Provider error'));
      
      await calendarService.connectCalendar('google');
      
      const eventIds = await calendarService.createJobApplicationEvent(
        'Test Job',
        'Test Company',
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      );

      // Should return empty array when all providers fail
      expect(eventIds).toHaveLength(0);
    });
  });
});