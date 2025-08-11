// EventIntelligence - AI-powered scheduling and conflict resolution service
// Handles intelligent scheduling, natural language processing, and optimization

import { CalendarEvent, EnergyPattern } from '../components/CalendarCore';

export interface VoiceCommandResult {
  action: 'create_event' | 'update_event' | 'delete_event' | 'reschedule_event' | 'find_time' | 'query_schedule' | 'set_reminder' | 'unknown';
  confidence: number;
  eventData?: Partial<CalendarEvent>;
  eventId?: string;
  updates?: Partial<CalendarEvent>;
  requirements?: TimeRequirements;
  query?: ScheduleQuery;
  response?: string;
  suggestions?: SchedulingSuggestion[];
}

export interface TimeRequirements {
  duration: number; // minutes
  energyLevel?: 'high' | 'medium' | 'low';
  eventType?: string;
  beforeDate?: Date;
  afterDate?: Date;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  tags?: string[];
  requiresFocus?: boolean;
  location?: string;
  attendees?: string[];
}

export interface ScheduleQuery {
  type: 'availability' | 'conflicts' | 'energy_level' | 'event_details' | 'habit_streak' | 'goal_progress';
  timeframe?: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'this_month';
  filters?: {
    eventTypes?: string[];
    tags?: string[];
    location?: string;
  };
}

export interface SchedulingSuggestion {
  id: string;
  type: 'optimal_time' | 'energy_match' | 'habit_stack' | 'goal_alignment' | 'conflict_resolution';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  confidence: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  energyAlignment: number; // 0-100
  goalAlignment: number; // 0-100
  conflictLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface OptimizationResult {
  originalScore: number;
  optimizedScore: number;
  changes: ScheduleChange[];
  improvement: number; // percentage
  reasoning: string;
}

export interface ScheduleChange {
  eventId: string;
  originalTime: Date;
  suggestedTime: Date;
  reason: string;
  impact: 'positive' | 'neutral' | 'negative';
}

export class EventIntelligence {
  private userId: string | null = null;
  private userContext: UserContext | null = null;
  private nlpProcessor: NLPProcessor;
  private optimizer: ScheduleOptimizer;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.optimizer = new ScheduleOptimizer();
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadUserContext();
    await this.nlpProcessor.initialize();
    await this.optimizer.initialize(userId);
  }

  // =======================
  // Voice Command Processing
  // =======================

  async processVoiceCommand(command: string): Promise<VoiceCommandResult> {
    try {
      console.log('Processing voice command:', command);
      
      // Parse the natural language command
      const parsedCommand = await this.nlpProcessor.parseCommand(command);
      
      // Determine the action and extract relevant information
      const result = await this.interpretCommand(parsedCommand);
      
      // Add context-aware suggestions if applicable
      if (result.action === 'create_event' && result.eventData) {
        result.suggestions = await this.generateSmartSuggestions(result.eventData as CalendarEvent);
      }
      
      return result;
    } catch (error) {
      console.error('Voice command processing failed:', error);
      return {
        action: 'unknown',
        confidence: 0,
        response: `Sorry, I couldn't understand that command: "${command}". Try rephrasing it.`
      };
    }
  }

  // =======================
  // Intelligent Scheduling
  // =======================

  async findOptimalTime(requirements: TimeRequirements): Promise<SchedulingSuggestion[]> {
    const suggestions: SchedulingSuggestion[] = [];
    
    try {
      // Get user's energy patterns and existing events
      const energyPatterns = await this.getUserEnergyPatterns();
      const existingEvents = await this.getExistingEvents(requirements);
      
      // Find available time slots
      const timeSlots = this.findAvailableSlots(requirements, existingEvents);
      
      // Score each slot based on various factors
      for (const slot of timeSlots) {
        const suggestion = await this.evaluateTimeSlot(slot, requirements, energyPatterns);
        if (suggestion.confidence > 0.5) {
          suggestions.push(suggestion);
        }
      }
      
      // Sort by confidence and return top suggestions
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
        
    } catch (error) {
      console.error('Failed to find optimal time:', error);
      return [];
    }
  }

  async optimizeSchedule(events: CalendarEvent[], timeframe: 'day' | 'week' | 'month'): Promise<OptimizationResult> {
    try {
      const originalScore = this.calculateScheduleScore(events);
      const optimizedEvents = await this.optimizer.optimizeEvents(events, timeframe);
      const optimizedScore = this.calculateScheduleScore(optimizedEvents);
      
      const changes = this.identifyChanges(events, optimizedEvents);
      const improvement = ((optimizedScore - originalScore) / originalScore) * 100;
      
      return {
        originalScore,
        optimizedScore,
        changes,
        improvement,
        reasoning: this.generateOptimizationReasoning(changes)
      };
    } catch (error) {
      console.error('Schedule optimization failed:', error);
      throw error;
    }
  }

  async generateSmartSuggestions(event: CalendarEvent): Promise<SchedulingSuggestion[]> {
    const suggestions: SchedulingSuggestion[] = [];
    
    try {
      // Energy-based suggestions
      if (event.energyLevel === 'high') {
        const energySuggestions = await this.suggestHighEnergyTimes(event);
        suggestions.push(...energySuggestions);
      }
      
      // Habit stacking suggestions
      const habitSuggestions = await this.suggestHabitStackingOpportunities(event);
      suggestions.push(...habitSuggestions);
      
      // Goal alignment suggestions
      const goalSuggestions = await this.suggestGoalAlignedTimes(event);
      suggestions.push(...goalSuggestions);
      
      // Conflict resolution suggestions
      const conflicts = await this.detectPotentialConflicts(event);
      if (conflicts.length > 0) {
        const conflictSuggestions = await this.suggestConflictResolutions(event, conflicts);
        suggestions.push(...conflictSuggestions);
      }
      
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
        
    } catch (error) {
      console.error('Failed to generate smart suggestions:', error);
      return [];
    }
  }

  // =======================
  // Context Understanding
  // =======================

  async analyzeUserBehavior(): Promise<UserBehaviorInsights> {
    if (!this.userContext) throw new Error('User context not loaded');
    
    // Analyze user's scheduling patterns
    const patterns = await this.identifySchedulingPatterns();
    const preferences = await this.extractUserPreferences();
    const energyProfile = await this.buildEnergyProfile();
    
    return {
      patterns,
      preferences,
      energyProfile,
      updatedAt: new Date()
    };
  }

  async predictEventDuration(eventTitle: string, eventType: string): Promise<number> {
    // Use historical data and ML to predict event duration
    try {
      const similarEvents = await this.findSimilarEvents(eventTitle, eventType);
      
      if (similarEvents.length === 0) {
        // Use default durations based on event type
        return this.getDefaultDuration(eventType);
      }
      
      // Calculate average duration with recent events weighted more heavily
      const totalWeight = similarEvents.reduce((sum, event, index) => {
        const recencyWeight = Math.pow(0.9, index); // More recent events have higher weight
        return sum + recencyWeight;
      }, 0);
      
      const weightedDuration = similarEvents.reduce((sum, event, index) => {
        const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
        const recencyWeight = Math.pow(0.9, index);
        return sum + (duration * recencyWeight);
      }, 0);
      
      return Math.round(weightedDuration / totalWeight);
    } catch (error) {
      console.error('Duration prediction failed:', error);
      return this.getDefaultDuration(eventType);
    }
  }

  // =======================
  // Private Methods
  // =======================

  private async loadUserContext(): Promise<void> {
    if (!this.userId) return;
    
    // Load user context from storage (goals, habits, preferences, etc.)
    try {
      const contextData = localStorage.getItem(`user_context_${this.userId}`);
      if (contextData) {
        this.userContext = JSON.parse(contextData);
      } else {
        // Initialize default context
        this.userContext = {
          goals: [],
          habits: [],
          workingHours: { start: 9, end: 17 },
          preferences: {
            timeBlocking: true,
            focusTimeProtection: true,
            habitReminders: true,
            energyOptimization: true
          },
          energyPatterns: []
        };
      }
    } catch (error) {
      console.error('Failed to load user context:', error);
    }
  }

  private async interpretCommand(parsedCommand: ParsedCommand): Promise<VoiceCommandResult> {
    const { intent, entities, confidence } = parsedCommand;
    
    switch (intent) {
      case 'create_event':
        return this.handleCreateEventCommand(entities, confidence);
        
      case 'reschedule_event':
        return this.handleRescheduleCommand(entities, confidence);
        
      case 'find_time':
        return this.handleFindTimeCommand(entities, confidence);
        
      case 'query_schedule':
        return this.handleScheduleQuery(entities, confidence);
        
      case 'delete_event':
        return this.handleDeleteCommand(entities, confidence);
        
      default:
        return {
          action: 'unknown',
          confidence: 0,
          response: 'I didn\'t understand that command. Could you try rephrasing it?'
        };
    }
  }

  private async handleCreateEventCommand(entities: CommandEntities, confidence: number): Promise<VoiceCommandResult> {
    const eventData: Partial<CalendarEvent> = {
      title: entities.title || 'New Event',
      eventType: entities.eventType || 'task',
      energyLevel: entities.energyLevel || 'medium',
      priority: entities.priority || 'medium',
      tags: entities.tags || [],
      privacyLevel: 'private',
      isRecurring: false
    };
    
    // Parse time information
    if (entities.timeExpression) {
      const parsedTime = await this.parseTimeExpression(entities.timeExpression);
      eventData.startTime = parsedTime.startTime;
      eventData.endTime = parsedTime.endTime;
    }
    
    // Predict duration if not specified
    if (!eventData.endTime && eventData.startTime) {
      const duration = await this.predictEventDuration(eventData.title!, eventData.eventType!);
      eventData.endTime = new Date(eventData.startTime.getTime() + duration * 60000);
    }
    
    return {
      action: 'create_event',
      confidence,
      eventData,
      response: `I'll create "${eventData.title}" for you.`
    };
  }

  private async handleRescheduleCommand(entities: CommandEntities, confidence: number): Promise<VoiceCommandResult> {
    const eventId = entities.eventId || await this.findEventByDescription(entities.eventDescription);
    
    if (!eventId) {
      return {
        action: 'unknown',
        confidence: 0,
        response: 'I couldn\'t find the event you want to reschedule. Could you be more specific?'
      };
    }
    
    const updates: Partial<CalendarEvent> = {};
    
    if (entities.timeExpression) {
      const parsedTime = await this.parseTimeExpression(entities.timeExpression);
      updates.startTime = parsedTime.startTime;
      updates.endTime = parsedTime.endTime;
    }
    
    return {
      action: 'reschedule_event',
      confidence,
      eventId,
      updates,
      response: 'I\'ll reschedule that event for you.'
    };
  }

  private async handleFindTimeCommand(entities: CommandEntities, confidence: number): Promise<VoiceCommandResult> {
    const requirements: TimeRequirements = {
      duration: entities.duration || 60,
      eventType: entities.eventType,
      energyLevel: entities.energyLevel,
      priority: entities.priority || 'medium',
      timeOfDay: entities.timeOfDay,
      requiresFocus: entities.requiresFocus || false
    };
    
    if (entities.timeExpression) {
      const constraints = await this.parseTimeConstraints(entities.timeExpression);
      requirements.beforeDate = constraints.beforeDate;
      requirements.afterDate = constraints.afterDate;
    }
    
    return {
      action: 'find_time',
      confidence,
      requirements,
      response: 'Let me find the best time for that.'
    };
  }

  private async handleScheduleQuery(entities: CommandEntities, confidence: number): Promise<VoiceCommandResult> {
    const query: ScheduleQuery = {
      type: entities.queryType || 'availability',
      timeframe: entities.timeframe || 'today'
    };
    
    return {
      action: 'query_schedule',
      confidence,
      query,
      response: 'Let me check your schedule.'
    };
  }

  private async handleDeleteCommand(entities: CommandEntities, confidence: number): Promise<VoiceCommandResult> {
    const eventId = entities.eventId || await this.findEventByDescription(entities.eventDescription);
    
    if (!eventId) {
      return {
        action: 'unknown',
        confidence: 0,
        response: 'I couldn\'t find the event you want to delete. Could you be more specific?'
      };
    }
    
    return {
      action: 'delete_event',
      confidence,
      eventId,
      response: 'I\'ll delete that event for you.'
    };
  }

  private calculateScheduleScore(events: CalendarEvent[]): number {
    let score = 0;
    let totalEvents = events.length;
    
    if (totalEvents === 0) return 100;
    
    for (const event of events) {
      // Energy alignment score
      const energyScore = this.calculateEnergyAlignment(event);
      
      // Goal alignment score  
      const goalScore = event.goalAlignment || 50;
      
      // Time slot optimality score
      const timeScore = this.calculateTimeOptimality(event);
      
      // Combine scores
      score += (energyScore * 0.4 + goalScore * 0.3 + timeScore * 0.3);
    }
    
    return score / totalEvents;
  }

  private calculateEnergyAlignment(event: CalendarEvent): number {
    // Calculate how well the event's energy requirement matches the time slot
    const hour = event.startTime.getHours();
    
    // High energy times: 9-11 AM, 2-4 PM
    // Medium energy times: 8-9 AM, 11 AM-2 PM, 4-6 PM  
    // Low energy times: 6-8 AM, 6-10 PM
    
    let slotEnergyLevel: 'high' | 'medium' | 'low';
    
    if ((hour >= 9 && hour < 11) || (hour >= 14 && hour < 16)) {
      slotEnergyLevel = 'high';
    } else if ((hour >= 8 && hour < 9) || (hour >= 11 && hour < 14) || (hour >= 16 && hour < 18)) {
      slotEnergyLevel = 'medium';
    } else {
      slotEnergyLevel = 'low';
    }
    
    // Perfect match gets 100, mismatch gets lower scores
    if (event.energyLevel === slotEnergyLevel) return 100;
    if (event.energyLevel === 'medium' && slotEnergyLevel !== 'low') return 80;
    if (event.energyLevel === 'low' && slotEnergyLevel === 'low') return 100;
    
    return 40; // Significant mismatch
  }

  private calculateTimeOptimality(event: CalendarEvent): number {
    const hour = event.startTime.getHours();
    
    // Optimal working hours get higher scores
    if (hour >= 9 && hour <= 17) return 100;
    if (hour >= 8 && hour <= 18) return 80;
    if (hour >= 7 && hour <= 19) return 60;
    
    return 30; // Outside normal hours
  }

  private async getUserEnergyPatterns(): Promise<EnergyPattern[]> {
    // Return default energy patterns if no user-specific data
    return [
      { hour: 9, day: 1, energyLevel: 90, focusLevel: 85, creativityLevel: 75 },
      { hour: 10, day: 1, energyLevel: 95, focusLevel: 90, creativityLevel: 80 },
      { hour: 14, day: 1, energyLevel: 80, focusLevel: 85, creativityLevel: 90 },
      { hour: 15, day: 1, energyLevel: 85, focusLevel: 80, creativityLevel: 85 }
    ];
  }

  private async getExistingEvents(requirements: TimeRequirements): Promise<CalendarEvent[]> {
    // In a real implementation, this would fetch from the calendar service
    return [];
  }

  private findAvailableSlots(requirements: TimeRequirements, existingEvents: CalendarEvent[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const now = new Date();
    
    // Generate potential time slots for the next 2 weeks
    for (let day = 0; day < 14; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      
      // Check each hour from 8 AM to 8 PM
      for (let hour = 8; hour <= 20; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + requirements.duration);
        
        // Check if slot is available
        const hasConflict = existingEvents.some(event => 
          (event.startTime <= slotStart && event.endTime > slotStart) ||
          (event.startTime < slotEnd && event.endTime >= slotEnd) ||
          (event.startTime >= slotStart && event.endTime <= slotEnd)
        );
        
        if (!hasConflict) {
          slots.push({ start: slotStart, end: slotEnd });
        }
      }
    }
    
    return slots;
  }

  private async evaluateTimeSlot(
    slot: TimeSlot, 
    requirements: TimeRequirements, 
    energyPatterns: EnergyPattern[]
  ): Promise<SchedulingSuggestion> {
    const hour = slot.start.getHours();
    const day = slot.start.getDay();
    
    // Find matching energy pattern
    const energyPattern = energyPatterns.find(p => p.hour === hour && p.day === day);
    const energyLevel = energyPattern?.energyLevel || 50;
    const focusLevel = energyPattern?.focusLevel || 50;
    
    // Calculate various alignment scores
    let energyAlignment = 50;
    if (requirements.energyLevel) {
      const requiredEnergy = requirements.energyLevel === 'high' ? 80 : 
                           requirements.energyLevel === 'medium' ? 50 : 20;
      energyAlignment = Math.max(0, 100 - Math.abs(energyLevel - requiredEnergy));
    }
    
    let goalAlignment = 70; // Default goal alignment
    
    // Time preference alignment
    let timeAlignment = 80;
    if (requirements.timeOfDay) {
      const preferredHours = this.getPreferredHours(requirements.timeOfDay);
      timeAlignment = preferredHours.includes(hour) ? 100 : 30;
    }
    
    // Calculate overall confidence
    const confidence = (energyAlignment * 0.4 + goalAlignment * 0.3 + timeAlignment * 0.3) / 100;
    
    // Generate reasoning
    const reasoning = this.generateSlotReasoning(slot, energyAlignment, goalAlignment, timeAlignment);
    
    return {
      id: `suggestion-${slot.start.getTime()}`,
      type: 'optimal_time',
      title: `${this.formatTime(slot.start)} - ${this.formatTime(slot.end)}`,
      description: `${requirements.duration} minute ${requirements.eventType || 'event'}`,
      startTime: slot.start,
      endTime: slot.end,
      confidence,
      reasoning,
      pros: this.generatePros(energyAlignment, goalAlignment, timeAlignment),
      cons: this.generateCons(energyAlignment, goalAlignment, timeAlignment),
      energyAlignment,
      goalAlignment,
      conflictLevel: 'none'
    };
  }

  private getPreferredHours(timeOfDay: string): number[] {
    switch (timeOfDay) {
      case 'morning': return [7, 8, 9, 10, 11];
      case 'afternoon': return [12, 13, 14, 15, 16, 17];
      case 'evening': return [18, 19, 20, 21];
      default: return Array.from({ length: 14 }, (_, i) => i + 7);
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  }

  private generateSlotReasoning(
    slot: TimeSlot, 
    energyAlignment: number, 
    goalAlignment: number, 
    timeAlignment: number
  ): string {
    const reasons = [];
    
    if (energyAlignment > 80) {
      reasons.push('matches your energy levels well');
    } else if (energyAlignment < 40) {
      reasons.push('may not align with your natural energy');
    }
    
    if (goalAlignment > 80) {
      reasons.push('supports your current goals');
    }
    
    if (timeAlignment > 80) {
      reasons.push('fits your preferred time of day');
    }
    
    const day = slot.start.toLocaleDateString('en-US', { weekday: 'long' });
    const time = this.formatTime(slot.start);
    
    return `${day} at ${time} ${reasons.length > 0 ? reasons.join(' and ') : 'is available'}`;
  }

  private generatePros(energyAlignment: number, goalAlignment: number, timeAlignment: number): string[] {
    const pros = [];
    
    if (energyAlignment > 70) pros.push('Good energy alignment');
    if (goalAlignment > 70) pros.push('Supports your goals');
    if (timeAlignment > 70) pros.push('Preferred time slot');
    
    return pros;
  }

  private generateCons(energyAlignment: number, goalAlignment: number, timeAlignment: number): string[] {
    const cons = [];
    
    if (energyAlignment < 50) cons.push('Low energy time');
    if (goalAlignment < 50) cons.push('Limited goal alignment');
    if (timeAlignment < 50) cons.push('Outside preferred hours');
    
    return cons;
  }

  private getDefaultDuration(eventType: string): number {
    const durations = {
      meeting: 30,
      task: 60,
      habit: 15,
      focus: 120,
      personal: 30,
      goal: 90
    };
    
    return durations[eventType as keyof typeof durations] || 60;
  }

  // Additional helper methods would be implemented here...
  private async suggestHighEnergyTimes(event: CalendarEvent): Promise<SchedulingSuggestion[]> { return []; }
  private async suggestHabitStackingOpportunities(event: CalendarEvent): Promise<SchedulingSuggestion[]> { return []; }
  private async suggestGoalAlignedTimes(event: CalendarEvent): Promise<SchedulingSuggestion[]> { return []; }
  private async detectPotentialConflicts(event: CalendarEvent): Promise<CalendarEvent[]> { return []; }
  private async suggestConflictResolutions(event: CalendarEvent, conflicts: CalendarEvent[]): Promise<SchedulingSuggestion[]> { return []; }
  private async identifySchedulingPatterns(): Promise<any> { return {}; }
  private async extractUserPreferences(): Promise<any> { return {}; }
  private async buildEnergyProfile(): Promise<any> { return {}; }
  private async findSimilarEvents(title: string, type: string): Promise<CalendarEvent[]> { return []; }
  private identifyChanges(original: CalendarEvent[], optimized: CalendarEvent[]): ScheduleChange[] { return []; }
  private generateOptimizationReasoning(changes: ScheduleChange[]): string { return ''; }
  private async findEventByDescription(description?: string): Promise<string | null> { return null; }
  private async parseTimeExpression(expression: string): Promise<{ startTime: Date; endTime: Date }> { 
    return { startTime: new Date(), endTime: new Date() }; 
  }
  private async parseTimeConstraints(expression: string): Promise<{ beforeDate?: Date; afterDate?: Date }> { 
    return {}; 
  }
}

// Helper classes
class NLPProcessor {
  async initialize(): Promise<void> {
    // Initialize NLP models and resources
  }
  
  async parseCommand(command: string): Promise<ParsedCommand> {
    // This would use actual NLP libraries like spaCy, NLTK, or cloud APIs
    // For now, return a simplified parse
    return {
      intent: this.extractIntent(command),
      entities: this.extractEntities(command),
      confidence: 0.8
    };
  }
  
  private extractIntent(command: string): string {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('schedule') || lowerCommand.includes('create')) return 'create_event';
    if (lowerCommand.includes('move') || lowerCommand.includes('reschedule')) return 'reschedule_event';
    if (lowerCommand.includes('find time') || lowerCommand.includes('when')) return 'find_time';
    if (lowerCommand.includes('cancel') || lowerCommand.includes('delete')) return 'delete_event';
    if (lowerCommand.includes('what') || lowerCommand.includes('show')) return 'query_schedule';
    
    return 'unknown';
  }
  
  private extractEntities(command: string): CommandEntities {
    // Simplified entity extraction
    return {
      title: this.extractTitle(command),
      duration: this.extractDuration(command),
      timeExpression: this.extractTimeExpression(command)
    };
  }
  
  private extractTitle(command: string): string | undefined {
    // Extract event title from command
    const matches = command.match(/"([^"]+)"/);
    return matches?.[1];
  }
  
  private extractDuration(command: string): number | undefined {
    const matches = command.match(/(\d+)\s*(hour|minute|hr|min)s?/i);
    if (!matches) return undefined;
    
    const number = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    
    if (unit.startsWith('hour') || unit === 'hr') {
      return number * 60;
    }
    return number;
  }
  
  private extractTimeExpression(command: string): string | undefined {
    // Extract time expressions like "tomorrow at 3pm", "next week"
    const timeExpressions = [
      /tomorrow\s+at\s+\d{1,2}:\d{2}(\s*[ap]m)?/i,
      /next\s+week/i,
      /\d{1,2}:\d{2}(\s*[ap]m)?/i
    ];
    
    for (const regex of timeExpressions) {
      const match = command.match(regex);
      if (match) return match[0];
    }
    
    return undefined;
  }
}

class ScheduleOptimizer {
  async initialize(userId: string): Promise<void> {
    // Initialize optimization algorithms and user data
  }
  
  async optimizeEvents(events: CalendarEvent[], timeframe: string): Promise<CalendarEvent[]> {
    // Implement schedule optimization logic
    // This would use algorithms like genetic algorithms, simulated annealing, etc.
    return events; // Return optimized events
  }
}

// Type definitions
interface UserContext {
  goals: any[];
  habits: any[];
  workingHours: { start: number; end: number };
  preferences: {
    timeBlocking: boolean;
    focusTimeProtection: boolean;
    habitReminders: boolean;
    energyOptimization: boolean;
  };
  energyPatterns: EnergyPattern[];
}

interface ParsedCommand {
  intent: string;
  entities: CommandEntities;
  confidence: number;
}

interface CommandEntities {
  title?: string;
  duration?: number;
  timeExpression?: string;
  eventType?: string;
  energyLevel?: 'high' | 'medium' | 'low';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  tags?: string[];
  eventId?: string;
  eventDescription?: string;
  queryType?: string;
  timeframe?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  requiresFocus?: boolean;
}

interface TimeSlot {
  start: Date;
  end: Date;
}

interface UserBehaviorInsights {
  patterns: any;
  preferences: any;
  energyProfile: any;
  updatedAt: Date;
}