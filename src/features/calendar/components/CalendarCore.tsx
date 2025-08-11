import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Settings,
  Mic,
  MicOff,
  Eye,
  EyeOff,
  Zap,
  Target,
  Brain,
  Heart,
  Briefcase,
  Home,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Share2,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  MapPin,
  Users,
  Link2,
  Sparkles,
  Volume2,
  VolumeX,
  Shield,
  Save,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { useUser } from '../../../contexts/userContext';
import WeekView from './WeekView';
import GanttView from './GanttView';
import DependencyMap from './DependencyMap';
import VoiceCommander from './VoiceCommander';
import CalendarSettings from './CalendarSettings';
import { CalendarOrchestrator } from '../services/CalendarOrchestrator';
import { EventIntelligence } from '../services/EventIntelligence';
import { VoiceBiometric } from '../services/VoiceBiometric';

// Core Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  eventType: 'habit' | 'task' | 'meeting' | 'personal' | 'focus' | 'goal' | 'serendipity';
  energyLevel: 'high' | 'medium' | 'low' | 'recovery';
  location?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  dependencies?: string[]; // Event IDs this depends on
  tags: string[];
  color: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'someday';
  userId: string;
  
  // Intelligence features
  aiGenerated: boolean;
  aiConfidence?: number;
  goalAlignment?: number; // 0-100 how much this supports user's goals
  habitStreak?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  energyDrain?: number; // -100 to +100
  
  // Collaboration
  sharedWith?: string[];
  privacyLevel: 'private' | 'busy' | 'domain' | 'public';
  attendees?: EventAttendee[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  voiceNoteUrl?: string;
  attachments?: string[];
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  endDate?: Date;
  exceptions?: Date[]; // Dates to skip
}

export interface EventAttendee {
  userId: string;
  email: string;
  name: string;
  response: 'pending' | 'accepted' | 'declined' | 'tentative';
  required: boolean;
}

export interface CalendarView {
  type: 'week' | 'gantt' | 'dependency';
  date: Date;
  timeScale: 'hour' | 'day' | 'week' | 'month';
  filters: CalendarFilter;
}

export interface CalendarFilter {
  eventTypes: string[];
  energyLevels: string[];
  tags: string[];
  priorities: string[];
  showCompleted: boolean;
  showAiGenerated: boolean;
}

export interface LifeBalance {
  work: number; // 0-100%
  health: number;
  relationships: number;
  growth: number;
  recreation: number;
}

export interface EnergyPattern {
  hour: number;
  day: number;
  energyLevel: number; // 0-100
  focusLevel: number; // 0-100
  creativityLevel: number; // 0-100
}

// Domain colors for life areas
const DOMAIN_COLORS = {
  work: '#8B5CF6', // Purple
  health: '#10B981', // Green
  relationships: '#F59E0B', // Amber
  growth: '#3B82F6', // Blue
  recreation: '#EF4444', // Red
  personal: '#6B7280' // Gray
};

const ENERGY_COLORS = {
  high: '#10B981', // Green
  medium: '#F59E0B', // Amber
  low: '#EF4444', // Red
  recovery: '#8B5CF6' // Purple
};

export default function CalendarCore() {
  const { user } = useUser();
  
  // Core state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<CalendarView>({
    type: 'week',
    date: new Date(),
    timeScale: 'hour',
    filters: {
      eventTypes: [],
      energyLevels: [],
      tags: [],
      priorities: [],
      showCompleted: true,
      showAiGenerated: true
    }
  });
  
  // UI state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceAuthenticated, setIsVoiceAuthenticated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  // Intelligence state
  const [lifeBalance, setLifeBalance] = useState<LifeBalance>({
    work: 40,
    health: 20,
    relationships: 15,
    growth: 15,
    recreation: 10
  });
  const [energyPatterns, setEnergyPatterns] = useState<EnergyPattern[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  
  // Services
  const [orchestrator, setOrchestrator] = useState<CalendarOrchestrator | null>(null);
  const [intelligence, setIntelligence] = useState<EventIntelligence | null>(null);
  const [voiceBiometric, setVoiceBiometric] = useState<VoiceBiometric | null>(null);

  // Initialize services and load data
  useEffect(() => {
    if (user) {
      initializeServices();
      loadCalendarData();
    }
  }, [user]);

  const initializeServices = async () => {
    try {
      const orchestratorInstance = new CalendarOrchestrator();
      await orchestratorInstance.initialize(user!.id);
      setOrchestrator(orchestratorInstance);

      const intelligenceInstance = new EventIntelligence();
      await intelligenceInstance.initialize(user!.id);
      setIntelligence(intelligenceInstance);

      const voiceInstance = new VoiceBiometric();
      await voiceInstance.initialize(user!.id);
      setVoiceBiometric(voiceInstance);
      
      // Check voice authentication status
      const isVoiceAuth = await voiceInstance.isAuthenticated();
      setIsVoiceAuthenticated(isVoiceAuth);
      
    } catch (error) {
      console.error('Failed to initialize calendar services:', error);
    }
  };

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      if (orchestrator) {
        const calendarEvents = await orchestrator.getEvents(
          currentView.date,
          currentView.timeScale
        );
        setEvents(calendarEvents);
        
        // Load energy patterns and life balance
        const patterns = await orchestrator.getEnergyPatterns();
        setEnergyPatterns(patterns);
        
        const balance = await orchestrator.getLifeBalance();
        setLifeBalance(balance);
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice command handling
  const handleVoiceCommand = useCallback(async (command: string) => {
    if (!intelligence || !isVoiceAuthenticated) return;
    
    try {
      const result = await intelligence.processVoiceCommand(command);
      
      if (result.action === 'create_event') {
        const newEvent = await orchestrator?.createEvent(result.eventData);
        if (newEvent) {
          setEvents(prev => [...prev, newEvent]);
        }
      } else if (result.action === 'reschedule_event') {
        const updatedEvent = await orchestrator?.updateEvent(result.eventId, result.updates);
        if (updatedEvent) {
          setEvents(prev => prev.map(e => e.id === result.eventId ? updatedEvent : e));
        }
      } else if (result.action === 'find_time') {
        const suggestions = await intelligence.findOptimalTime(result.requirements);
        setAiSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Voice command failed:', error);
    }
  }, [intelligence, orchestrator, isVoiceAuthenticated]);

  // Event handlers
  const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!orchestrator) return;
    
    try {
      const newEvent = await orchestrator.createEvent({
        ...eventData,
        userId: user!.id,
        id: `event-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiGenerated: false
      } as CalendarEvent);
      
      setEvents(prev => [...prev, newEvent]);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!orchestrator) return;
    
    try {
      const updatedEvent = await orchestrator.updateEvent(eventId, updates);
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!orchestrator) return;
    
    try {
      await orchestrator.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Calculate current life balance status
  const balanceScore = useMemo(() => {
    const total = Object.values(lifeBalance).reduce((sum, val) => sum + val, 0);
    const ideal = { work: 30, health: 25, relationships: 20, growth: 15, recreation: 10 };
    const deviation = Object.entries(lifeBalance).reduce((dev, [key, val]) => {
      return dev + Math.abs(val - ideal[key as keyof LifeBalance]);
    }, 0);
    return Math.max(0, 100 - (deviation / 2));
  }, [lifeBalance]);

  // Get morning message
  const getMorningMessage = () => {
    const hour = new Date().getHours();
    const todayEvents = events.filter(e => 
      e.startTime.toDateString() === new Date().toDateString()
    );
    
    const workEvents = todayEvents.filter(e => e.eventType === 'task' || e.eventType === 'meeting').length;
    const healthEvents = todayEvents.filter(e => e.tags.includes('health')).length;
    
    if (hour < 12) {
      if (healthEvents > 0 && workEvents <= 3) {
        return "🌟 Your day is designed for success! You've balanced wellness with productivity.";
      } else if (workEvents > 5) {
        return "⚡ Ambitious agenda today! Remember to protect your energy and take breaks.";
      } else {
        return "🎯 Today looks perfectly balanced. You're in control of your time.";
      }
    }
    return "Good day! Your calendar is your pathway to success.";
  };

  // Render different views
  const renderCalendarView = () => {
    const viewProps = {
      events: events.filter(e => {
        // Apply current filters
        const { filters } = currentView;
        if (filters.eventTypes.length && !filters.eventTypes.includes(e.eventType)) return false;
        if (filters.energyLevels.length && !filters.energyLevels.includes(e.energyLevel)) return false;
        if (!filters.showCompleted && e.completedAt) return false;
        if (!filters.showAiGenerated && e.aiGenerated) return false;
        return true;
      }),
      currentDate: currentView.date,
      timeScale: currentView.timeScale,
      onEventCreate: handleCreateEvent,
      onEventUpdate: handleUpdateEvent,
      onEventDelete: handleDeleteEvent,
      onEventSelect: setSelectedEvent,
      energyPatterns,
      lifeBalance,
      focusMode
    };

    switch (currentView.type) {
      case 'week':
        return <WeekView {...viewProps} />;
      case 'gantt':
        return <GanttView {...viewProps} />;
      case 'dependency':
        return <DependencyMap {...viewProps} />;
      default:
        return <WeekView {...viewProps} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <Calendar className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Rashenal Calendar</h1>
          <p className="text-gray-600 mb-8">
            Your revolutionary life orchestration system awaits.
          </p>
          <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rashenal Calendar</h1>
                <p className="text-sm text-gray-600">Life Orchestration System</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{events.length}</div>
                <div className="text-xs text-gray-600">Events Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round(balanceScore)}</div>
                <div className="text-xs text-gray-600">Balance Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {energyPatterns.find(p => p.hour === new Date().getHours())?.energyLevel || 75}
                </div>
                <div className="text-xs text-gray-600">Energy Level</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2 rounded-lg transition-all ${
                  focusMode 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Focus Mode"
              >
                <Zap className="h-5 w-5" />
              </button>

              <button
                onClick={() => setIsVoiceActive(!isVoiceActive)}
                className={`p-2 rounded-lg transition-all ${
                  isVoiceActive 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={isVoiceAuthenticated ? "Voice Commands" : "Voice Authentication Required"}
              >
                {isVoiceActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Morning Message */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">{getMorningMessage()}</h2>
              <p className="text-indigo-100">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-indigo-200">
                {syncStatus === 'syncing' && (
                  <div className="flex items-center space-x-1">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Syncing...</span>
                  </div>
                )}
                {syncStatus === 'synced' && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">All synced</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* View Type Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
              {[
                { type: 'week', label: 'Week View', icon: Calendar },
                { type: 'gantt', label: 'Projects', icon: Target },
                { type: 'dependency', label: 'Network', icon: Brain }
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setCurrentView(prev => ({ ...prev, type: type as any }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    currentView.type === type
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView(prev => ({
                  ...prev,
                  date: new Date(prev.date.getTime() - 7 * 24 * 60 * 60 * 1000)
                }))}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h3 className="text-lg font-semibold text-gray-900 min-w-48 text-center">
                {currentView.date.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
              </h3>
              
              <button
                onClick={() => setCurrentView(prev => ({
                  ...prev,
                  date: new Date(prev.date.getTime() + 7 * 24 * 60 * 60 * 1000)
                }))}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCreateEvent({})}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Event</span>
              </button>
              
              <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Sparkles className="h-4 w-4" />
                <span>AI Suggest</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your life orchestration system...</p>
          </div>
        ) : (
          renderCalendarView()
        )}
      </div>

      {/* Voice Commander */}
      {isVoiceActive && (
        <VoiceCommander
          isActive={isVoiceActive}
          isAuthenticated={isVoiceAuthenticated}
          onCommand={handleVoiceCommand}
          onClose={() => setIsVoiceActive(false)}
          onAuthComplete={() => setIsVoiceAuthenticated(true)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <CalendarSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentView={currentView}
          onViewChange={setCurrentView}
          lifeBalance={lifeBalance}
          onLifeBalanceChange={setLifeBalance}
        />
      )}
    </div>
  );
}