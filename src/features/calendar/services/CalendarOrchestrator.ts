// CalendarOrchestrator - Main service layer for calendar operations
// Handles all calendar CRUD operations, sync, and data orchestration

import { supabase } from '../../../lib/supabase';
import { CalendarEvent, EnergyPattern, LifeBalance } from '../components/CalendarCore';

export interface SyncStatus {
  status: 'synced' | 'syncing' | 'error';
  lastSync: Date;
  pendingOperations: number;
  conflicts: ConflictEvent[];
}

export interface ConflictEvent {
  id: string;
  type: 'time_overlap' | 'resource_conflict' | 'energy_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEvents: string[];
  suggestedResolution: string;
  autoResolvable: boolean;
}

export interface CalendarIntegration {
  type: 'google' | 'outlook' | 'apple' | 'zoom';
  isActive: boolean;
  lastSync: Date;
  syncFrequency: 'realtime' | '5min' | '15min' | 'hourly' | 'daily';
  authToken?: string;
  errorCount: number;
}

export interface CalendarPreferences {
  workHours: { start: number; end: number; days: number[] };
  energyPatterns: EnergyPattern[];
  notificationSettings: NotificationSettings;
  voiceProfile: VoiceProfile;
  themeSettings: ThemeSettings;
  integrationSettings: CalendarIntegration[];
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  voice: boolean;
  reminders: {
    events: number; // minutes before
    habits: number;
    goals: number;
  };
  smartNotifications: boolean; // AI-powered contextual notifications
}

export interface VoiceProfile {
  isEnabled: boolean;
  voicePrint: string; // Biometric voice signature
  commandsEnabled: string[];
  sensitivity: number; // 0-100
  noiseReduction: boolean;
}

export interface ThemeSettings {
  darkMode: boolean;
  highContrast: boolean;
  colorScheme: 'default' | 'colorblind' | 'custom';
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  animations: boolean;
}

export class CalendarOrchestrator {
  private userId: string | null = null;
  private syncStatus: SyncStatus = {
    status: 'synced',
    lastSync: new Date(),
    pendingOperations: 0,
    conflicts: []
  };
  private integrations: Map<string, CalendarIntegration> = new Map();
  private eventCache: Map<string, CalendarEvent> = new Map();
  private preferences: CalendarPreferences | null = null;

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadPreferences();
    await this.loadIntegrations();
    await this.syncCalendarData();
  }

  // =======================
  // Event CRUD Operations
  // =======================

  async createEvent(eventData: CalendarEvent): Promise<CalendarEvent> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      // Run conflict detection before creating
      const conflicts = await this.detectConflicts(eventData);
      if (conflicts.some(c => c.severity === 'critical')) {
        throw new Error(`Cannot create event due to critical conflicts: ${conflicts[0].description}`);
      }

      // Create in database
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          ...eventData,
          user_id: this.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const createdEvent = this.mapDbEventToCalendarEvent(data);
      this.eventCache.set(createdEvent.id, createdEvent);

      // Sync with external calendars if needed
      await this.syncEventToExternalCalendars(createdEvent);

      // Update life balance if this affects it
      await this.updateLifeBalance();

      return createdEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      const existingEvent = await this.getEvent(eventId);
      if (!existingEvent) throw new Error('Event not found');

      const updatedEventData = { ...existingEvent, ...updates };
      
      // Check for conflicts with the updated event
      const conflicts = await this.detectConflicts(updatedEventData);
      if (conflicts.some(c => c.severity === 'critical')) {
        throw new Error(`Cannot update event due to conflicts: ${conflicts[0].description}`);
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) throw error;

      const updatedEvent = this.mapDbEventToCalendarEvent(data);
      this.eventCache.set(updatedEvent.id, updatedEvent);

      // Sync with external calendars
      await this.syncEventToExternalCalendars(updatedEvent);

      return updatedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', this.userId);

      if (error) throw error;

      this.eventCache.delete(eventId);

      // Remove from external calendars
      await this.removeEventFromExternalCalendars(eventId);

      // Update life balance
      await this.updateLifeBalance();

      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    // Check cache first
    if (this.eventCache.has(eventId)) {
      return this.eventCache.get(eventId)!;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .eq('user_id', this.userId)
        .single();

      if (error || !data) return null;

      const event = this.mapDbEventToCalendarEvent(data);
      this.eventCache.set(event.id, event);
      return event;
    } catch (error) {
      console.error('Failed to get event:', error);
      return null;
    }
  }

  async getEvents(
    date: Date, 
    timeScale: 'hour' | 'day' | 'week' | 'month' = 'week'
  ): Promise<CalendarEvent[]> {
    if (!this.userId) return [];

    try {
      let startDate: Date, endDate: Date;

      switch (timeScale) {
        case 'hour':
          startDate = new Date(date);
          startDate.setMinutes(0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(startDate.getHours() + 1);
          break;
        case 'day':
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'week':
          startDate = new Date(date);
          startDate.setDate(date.getDate() - date.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'month':
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          break;
        default:
          throw new Error('Invalid time scale');
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', this.userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time');

      if (error) throw error;

      const events = data.map(this.mapDbEventToCalendarEvent);
      
      // Update cache
      events.forEach(event => this.eventCache.set(event.id, event));

      return events;
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  // =======================
  // Conflict Detection & Resolution
  // =======================

  async detectConflicts(event: CalendarEvent): Promise<ConflictEvent[]> {
    const conflicts: ConflictEvent[] = [];
    
    // Get overlapping events
    const overlappingEvents = await this.getOverlappingEvents(event);
    
    for (const overlapping of overlappingEvents) {
      // Time overlap conflict
      conflicts.push({
        id: `conflict-${Date.now()}`,
        type: 'time_overlap',
        severity: 'high',
        description: `Time conflict with "${overlapping.title}"`,
        affectedEvents: [event.id, overlapping.id],
        suggestedResolution: `Move "${event.title}" to next available slot`,
        autoResolvable: true
      });
    }

    // Energy level mismatch
    if (event.energyLevel === 'high') {
      const energyPattern = await this.getEnergyPatternForTime(event.startTime);
      if (energyPattern && energyPattern.energyLevel < 50) {
        conflicts.push({
          id: `energy-${Date.now()}`,
          type: 'energy_mismatch',
          severity: 'medium',
          description: 'High-energy task scheduled during low-energy time',
          affectedEvents: [event.id],
          suggestedResolution: 'Reschedule to peak energy hours (9-11 AM or 2-4 PM)',
          autoResolvable: true
        });
      }
    }

    return conflicts;
  }

  async resolveConflict(conflictId: string, resolution: 'auto' | 'manual', data?: any): Promise<boolean> {
    const conflict = this.syncStatus.conflicts.find(c => c.id === conflictId);
    if (!conflict) return false;

    try {
      if (resolution === 'auto' && conflict.autoResolvable) {
        // Auto-resolve based on conflict type
        switch (conflict.type) {
          case 'time_overlap':
            await this.autoResolveTimeOverlap(conflict);
            break;
          case 'energy_mismatch':
            await this.autoResolveEnergyMismatch(conflict);
            break;
        }
      } else if (resolution === 'manual' && data) {
        // Apply manual resolution
        await this.applyManualResolution(conflict, data);
      }

      // Remove resolved conflict
      this.syncStatus.conflicts = this.syncStatus.conflicts.filter(c => c.id !== conflictId);
      return true;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }
  }

  // =======================
  // Energy & Life Balance
  // =======================

  async getEnergyPatterns(): Promise<EnergyPattern[]> {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('energy_patterns')
        .select('*')
        .eq('user_id', this.userId)
        .order('hour');

      if (error) throw error;

      return data.map(row => ({
        hour: row.hour,
        day: row.day_of_week,
        energyLevel: row.energy_level,
        focusLevel: row.focus_level,
        creativityLevel: row.creativity_level
      }));
    } catch (error) {
      console.error('Failed to get energy patterns:', error);
      // Return default patterns if DB fails
      return this.getDefaultEnergyPatterns();
    }
  }

  async updateEnergyPattern(pattern: EnergyPattern): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('energy_patterns')
        .upsert({
          user_id: this.userId,
          hour: pattern.hour,
          day_of_week: pattern.day,
          energy_level: pattern.energyLevel,
          focus_level: pattern.focusLevel,
          creativity_level: pattern.creativityLevel,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Failed to update energy pattern:', error);
      return false;
    }
  }

  async getLifeBalance(): Promise<LifeBalance> {
    if (!this.userId) return { work: 40, health: 20, relationships: 15, growth: 15, recreation: 10 };

    try {
      // Calculate based on recent events
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const events = await this.getEvents(weekStart, 'week');
      const totalHours = events.reduce((sum, e) => {
        const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);

      if (totalHours === 0) {
        return { work: 40, health: 20, relationships: 15, growth: 15, recreation: 10 };
      }

      const balance: LifeBalance = {
        work: 0,
        health: 0,
        relationships: 0,
        growth: 0,
        recreation: 0
      };

      events.forEach(event => {
        const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
        const percentage = (duration / totalHours) * 100;

        // Categorize based on event type and tags
        if (event.eventType === 'meeting' || event.eventType === 'task' || event.tags.includes('work')) {
          balance.work += percentage;
        } else if (event.tags.includes('health') || event.tags.includes('exercise') || event.tags.includes('wellness')) {
          balance.health += percentage;
        } else if (event.tags.includes('family') || event.tags.includes('friends') || event.tags.includes('social')) {
          balance.relationships += percentage;
        } else if (event.tags.includes('learning') || event.tags.includes('skill') || event.eventType === 'goal') {
          balance.growth += percentage;
        } else {
          balance.recreation += percentage;
        }
      });

      return balance;
    } catch (error) {
      console.error('Failed to calculate life balance:', error);
      return { work: 40, health: 20, relationships: 15, growth: 15, recreation: 10 };
    }
  }

  // =======================
  // Calendar Synchronization
  // =======================

  async syncCalendarData(): Promise<SyncStatus> {
    if (!this.userId) return this.syncStatus;

    this.syncStatus.status = 'syncing';
    this.syncStatus.lastSync = new Date();

    try {
      // Sync with each active integration
      for (const [type, integration] of this.integrations) {
        if (integration.isActive) {
          await this.syncWithExternalCalendar(type, integration);
        }
      }

      this.syncStatus.status = 'synced';
      this.syncStatus.pendingOperations = 0;
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncStatus.status = 'error';
    }

    return this.syncStatus;
  }

  // =======================
  // Private Helper Methods
  // =======================

  private mapDbEventToCalendarEvent(dbEvent: any): CalendarEvent {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      startTime: new Date(dbEvent.start_time),
      endTime: new Date(dbEvent.end_time),
      eventType: dbEvent.event_type,
      energyLevel: dbEvent.energy_level,
      location: dbEvent.location,
      isRecurring: dbEvent.recurring_pattern !== null,
      recurringPattern: dbEvent.recurring_pattern,
      dependencies: dbEvent.dependencies || [],
      tags: dbEvent.tags || [],
      color: dbEvent.color || '#8B5CF6',
      priority: dbEvent.priority || 'medium',
      userId: dbEvent.user_id,
      aiGenerated: dbEvent.ai_generated || false,
      aiConfidence: dbEvent.ai_confidence,
      goalAlignment: dbEvent.goal_alignment,
      habitStreak: dbEvent.habit_streak,
      estimatedDuration: dbEvent.estimated_duration,
      actualDuration: dbEvent.actual_duration,
      energyDrain: dbEvent.energy_drain,
      sharedWith: dbEvent.shared_with || [],
      privacyLevel: dbEvent.privacy_level || 'private',
      attendees: dbEvent.attendees || [],
      createdAt: new Date(dbEvent.created_at),
      updatedAt: new Date(dbEvent.updated_at),
      completedAt: dbEvent.completed_at ? new Date(dbEvent.completed_at) : undefined,
      voiceNoteUrl: dbEvent.voice_note_url,
      attachments: dbEvent.attachments || []
    };
  }

  private async getOverlappingEvents(event: CalendarEvent): Promise<CalendarEvent[]> {
    const events = await this.getEvents(event.startTime, 'day');
    return events.filter(e => 
      e.id !== event.id &&
      ((e.startTime <= event.startTime && e.endTime > event.startTime) ||
       (e.startTime < event.endTime && e.endTime >= event.endTime) ||
       (e.startTime >= event.startTime && e.endTime <= event.endTime))
    );
  }

  private async getEnergyPatternForTime(time: Date): Promise<EnergyPattern | null> {
    const patterns = await this.getEnergyPatterns();
    return patterns.find(p => p.hour === time.getHours() && p.day === time.getDay()) || null;
  }

  private getDefaultEnergyPatterns(): EnergyPattern[] {
    const patterns: EnergyPattern[] = [];
    // Generate default energy patterns based on typical circadian rhythms
    for (let hour = 0; hour < 24; hour++) {
      let energyLevel = 50;
      let focusLevel = 50;
      let creativityLevel = 50;

      // Morning peak (9-11 AM)
      if (hour >= 9 && hour <= 11) {
        energyLevel = 85;
        focusLevel = 90;
        creativityLevel = 75;
      }
      // Afternoon peak (2-4 PM)
      else if (hour >= 14 && hour <= 16) {
        energyLevel = 75;
        focusLevel = 80;
        creativityLevel = 85;
      }
      // Evening creativity (7-9 PM)
      else if (hour >= 19 && hour <= 21) {
        energyLevel = 60;
        focusLevel = 65;
        creativityLevel = 90;
      }
      // Low energy periods
      else if (hour >= 0 && hour <= 6) {
        energyLevel = 20;
        focusLevel = 25;
        creativityLevel = 30;
      }
      else if (hour >= 22 && hour <= 23) {
        energyLevel = 30;
        focusLevel = 35;
        creativityLevel = 40;
      }

      patterns.push({
        hour,
        day: 1, // Monday as default
        energyLevel,
        focusLevel,
        creativityLevel
      });
    }
    return patterns;
  }

  private async loadPreferences(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('calendar_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (data && !error) {
        this.preferences = {
          workHours: data.work_hours || { start: 9, end: 17, days: [1,2,3,4,5] },
          energyPatterns: data.energy_patterns || [],
          notificationSettings: data.notification_preferences || {
            email: true,
            push: true,
            sms: false,
            voice: false,
            reminders: { events: 15, habits: 5, goals: 30 },
            smartNotifications: true
          },
          voiceProfile: data.voice_profile || {
            isEnabled: false,
            voicePrint: '',
            commandsEnabled: [],
            sensitivity: 70,
            noiseReduction: true
          },
          themeSettings: data.theme_settings || {
            darkMode: false,
            highContrast: false,
            colorScheme: 'default',
            fontSize: 'medium',
            animations: true
          },
          integrationSettings: data.integration_settings || []
        };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  private async loadIntegrations(): Promise<void> {
    // Load integration settings and populate integrations map
    if (this.preferences?.integrationSettings) {
      this.preferences.integrationSettings.forEach(integration => {
        this.integrations.set(integration.type, integration);
      });
    }
  }

  private async syncWithExternalCalendar(type: string, integration: CalendarIntegration): Promise<void> {
    // Implementation for syncing with specific calendar providers
    console.log(`Syncing with ${type} calendar...`);
    // TODO: Implement actual sync logic for each provider
  }

  private async syncEventToExternalCalendars(event: CalendarEvent): Promise<void> {
    // Sync event to all active external calendars
    for (const [type, integration] of this.integrations) {
      if (integration.isActive) {
        // TODO: Implement external calendar sync
        console.log(`Syncing event to ${type}:`, event.title);
      }
    }
  }

  private async removeEventFromExternalCalendars(eventId: string): Promise<void> {
    // Remove event from all active external calendars
    for (const [type, integration] of this.integrations) {
      if (integration.isActive) {
        // TODO: Implement external calendar removal
        console.log(`Removing event from ${type}:`, eventId);
      }
    }
  }

  private async updateLifeBalance(): Promise<void> {
    // Recalculate and cache life balance
    await this.getLifeBalance();
  }

  private async autoResolveTimeOverlap(conflict: ConflictEvent): Promise<void> {
    // Auto-resolve time conflicts by finding next available slot
    const eventIds = conflict.affectedEvents;
    // TODO: Implement auto-resolution logic
  }

  private async autoResolveEnergyMismatch(conflict: ConflictEvent): Promise<void> {
    // Auto-resolve energy mismatches by suggesting better times
    // TODO: Implement energy-based rescheduling
  }

  private async applyManualResolution(conflict: ConflictEvent, data: any): Promise<void> {
    // Apply user-provided manual resolution
    // TODO: Implement manual resolution application
  }
}