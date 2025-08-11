import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Move,
  Zap,
  Heart,
  Brain,
  Briefcase,
  Home,
  Circle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  MapPin,
  Users,
  Link2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Target,
  Timer
} from 'lucide-react';
import { CalendarEvent, EnergyPattern, LifeBalance } from './CalendarCore';

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  timeScale: 'hour' | 'day' | 'week' | 'month';
  onEventCreate: (event: Partial<CalendarEvent>) => void;
  onEventUpdate: (id: string, updates: Partial<CalendarEvent>) => void;
  onEventDelete: (id: string) => void;
  onEventSelect: (event: CalendarEvent | null) => void;
  energyPatterns: EnergyPattern[];
  lifeBalance: LifeBalance;
  focusMode: boolean;
}

interface DragState {
  isDragging: boolean;
  draggedEvent: CalendarEvent | null;
  dragStart: { x: number; y: number; time: Date } | null;
  ghostPosition: { x: number; y: number } | null;
}

interface TimeSlot {
  hour: number;
  energyLevel: number;
  focusLevel: number;
  isOptimal: boolean;
  events: CalendarEvent[];
}

const DOMAIN_COLORS = {
  work: 'bg-purple-500 border-purple-600 text-white',
  health: 'bg-green-500 border-green-600 text-white',
  relationships: 'bg-amber-500 border-amber-600 text-white',
  growth: 'bg-blue-500 border-blue-600 text-white',
  personal: 'bg-gray-500 border-gray-600 text-white'
};

const ENERGY_COLORS = {
  high: 'bg-green-100 border-l-4 border-green-500',
  medium: 'bg-amber-100 border-l-4 border-amber-500',
  low: 'bg-red-100 border-l-4 border-red-500',
  recovery: 'bg-purple-100 border-l-4 border-purple-500'
};

const EVENT_TYPE_ICONS = {
  habit: Heart,
  task: CheckCircle2,
  meeting: Users,
  personal: Home,
  focus: Zap,
  goal: Target,
  serendipity: Sparkles
};

export default function WeekView({
  events,
  currentDate,
  timeScale,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventSelect,
  energyPatterns,
  lifeBalance,
  focusMode
}: WeekViewProps) {
  const weekViewRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedEvent: null,
    dragStart: null,
    ghostPosition: null
  });
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalPosition, setCreateModalPosition] = useState<{ x: number; y: number; time: Date } | null>(null);
  const [hoveredTimeSlot, setHoveredTimeSlot] = useState<{ day: number; hour: number } | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  // Generate week days starting from the current date
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, [currentDate]);

  // Generate time slots for the day (6 AM to 11 PM)
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 23; hour++) {
      const energyPattern = energyPatterns.find(p => p.hour === hour);
      const dayEvents = events.filter(e => {
        const eventHour = e.startTime.getHours();
        return eventHour === hour;
      });

      slots.push({
        hour,
        energyLevel: energyPattern?.energyLevel || 50,
        focusLevel: energyPattern?.focusLevel || 50,
        isOptimal: (energyPattern?.energyLevel || 50) > 70,
        events: dayEvents
      });
    }
    return slots;
  }, [energyPatterns, events]);

  // Get events for a specific day and hour
  const getEventsForTimeSlot = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.toDateString() === day.toDateString() &&
        eventDate.getHours() === hour
      );
    });
  };

  // Calculate optimal time slots
  const getOptimalHours = () => {
    return timeSlots
      .filter(slot => slot.energyLevel > 70 && slot.focusLevel > 60)
      .map(slot => slot.hour);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const startTime = new Date(event.startTime);
    
    setDragState({
      isDragging: true,
      draggedEvent: event,
      dragStart: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        time: startTime
      },
      ghostPosition: null
    });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.isDragging && weekViewRef.current) {
      const rect = weekViewRef.current.getBoundingClientRect();
      setDragState(prev => ({
        ...prev,
        ghostPosition: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      }));
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetDay: Date, targetHour: number) => {
    e.preventDefault();
    
    if (dragState.draggedEvent) {
      const newStartTime = new Date(targetDay);
      newStartTime.setHours(targetHour, 0, 0, 0);
      
      const duration = dragState.draggedEvent.endTime.getTime() - dragState.draggedEvent.startTime.getTime();
      const newEndTime = new Date(newStartTime.getTime() + duration);
      
      onEventUpdate(dragState.draggedEvent.id, {
        startTime: newStartTime,
        endTime: newEndTime
      });
    }
    
    setDragState({
      isDragging: false,
      draggedEvent: null,
      dragStart: null,
      ghostPosition: null
    });
  };

  // Handle time slot click for creating events
  const handleTimeSlotClick = (e: React.MouseEvent, day: Date, hour: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickTime = new Date(day);
    clickTime.setHours(hour, 0, 0, 0);
    
    setCreateModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
      time: clickTime
    });
    setShowCreateModal(true);
  };

  // Get energy level indicator
  const getEnergyIndicator = (hour: number) => {
    const slot = timeSlots.find(s => s.hour === hour);
    if (!slot) return null;
    
    const level = slot.energyLevel;
    if (level > 80) return { color: 'bg-green-400', label: 'Peak Energy' };
    if (level > 60) return { color: 'bg-yellow-400', label: 'Good Energy' };
    if (level > 40) return { color: 'bg-orange-400', label: 'Low Energy' };
    return { color: 'bg-red-400', label: 'Recovery Time' };
  };

  // Format time display
  const formatTime = (hour: number) => {
    const time = new Date();
    time.setHours(hour, 0, 0, 0);
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Get current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHour < 6 || currentHour > 23) return null;
    
    const hourIndex = currentHour - 6;
    const minutePercent = currentMinutes / 60;
    const position = (hourIndex + minutePercent) * 60; // 60px per hour
    
    return position;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Week Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="grid grid-cols-8 gap-4">
          {/* Time column header */}
          <div className="flex items-center justify-center">
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* Day headers */}
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = events.filter(e => 
              e.startTime.toDateString() === day.toDateString()
            );
            const isCollapsed = collapsedDays.has(index);
            
            return (
              <div 
                key={index}
                className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
                  isToday 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setCollapsedDays(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(index)) {
                      newSet.delete(index);
                    } else {
                      newSet.add(index);
                    }
                    return newSet;
                  });
                }}
              >
                <div className="font-semibold">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
                <div className={`text-xs ${isToday ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {dayEvents.length} events
                </div>
                {isCollapsed && (
                  <ChevronDown className={`h-4 w-4 mx-auto mt-1 ${isToday ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid */}
      <div 
        ref={weekViewRef}
        className="relative overflow-y-auto max-h-screen"
        onDragOver={handleDragOver}
      >
        {/* Current time line */}
        {currentTimePosition && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ top: currentTimePosition + 64 }} // Offset for header
          >
            <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
            <div className="absolute right-4 -top-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Now
            </div>
          </div>
        )}

        {timeSlots.map((slot, slotIndex) => {
          const energyIndicator = getEnergyIndicator(slot.hour);
          
          return (
            <div key={slot.hour} className="grid grid-cols-8 border-b border-gray-100 min-h-16">
              {/* Time label */}
              <div className="flex flex-col items-center justify-center p-2 bg-gray-50 border-r border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {formatTime(slot.hour)}
                </div>
                {energyIndicator && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${energyIndicator.color}`}></div>
                    <span className="text-xs text-gray-500">
                      {slot.energyLevel}%
                    </span>
                  </div>
                )}
                {slot.isOptimal && !focusMode && (
                  <div className="text-xs text-green-600 font-medium">
                    <Zap className="h-3 w-3 inline mr-1" />
                    Peak
                  </div>
                )}
              </div>
              
              {/* Day columns */}
              {weekDays.map((day, dayIndex) => {
                const isCollapsed = collapsedDays.has(dayIndex);
                if (isCollapsed) {
                  return <div key={dayIndex} className="hidden"></div>;
                }
                
                const slotEvents = getEventsForTimeSlot(day, slot.hour);
                const isHovered = hoveredTimeSlot?.day === dayIndex && hoveredTimeSlot?.hour === slot.hour;
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={dayIndex}
                    className={`relative p-1 border-r border-gray-100 transition-all cursor-pointer ${
                      isToday ? 'bg-indigo-25' : 'hover:bg-gray-50'
                    } ${slot.isOptimal ? 'bg-green-25' : ''} ${
                      isHovered ? 'bg-blue-50' : ''
                    }`}
                    onMouseEnter={() => setHoveredTimeSlot({ day: dayIndex, hour: slot.hour })}
                    onMouseLeave={() => setHoveredTimeSlot(null)}
                    onClick={(e) => handleTimeSlotClick(e, day, slot.hour)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, slot.hour)}
                  >
                    {/* Flow protection indicator */}
                    {slot.isOptimal && focusMode && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-400"></div>
                    )}
                    
                    {/* Events in this slot */}
                    <div className="space-y-1">
                      {slotEvents.map((event) => {
                        const EventIcon = EVENT_TYPE_ICONS[event.eventType] || Circle;
                        const domain = event.tags.find(tag => Object.keys(DOMAIN_COLORS).includes(tag)) || 'personal';
                        const colorClass = DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS];
                        
                        return (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              onEventSelect(event);
                            }}
                            className={`relative group cursor-move rounded-lg p-2 border-2 transition-all hover:shadow-md ${colorClass} ${
                              selectedEvent?.id === event.id ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
                            } ${
                              dragState.draggedEvent?.id === event.id ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Event content */}
                            <div className="flex items-center space-x-2 mb-1">
                              <EventIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs font-medium truncate">
                                {event.title}
                              </span>
                              {event.aiGenerated && (
                                <Sparkles className="h-3 w-3 opacity-75" />
                              )}
                            </div>
                            
                            {/* Event details */}
                            <div className="text-xs opacity-90">
                              <div className="flex items-center justify-between">
                                <span>
                                  {formatTime(event.startTime.getHours())} - {formatTime(event.endTime.getHours())}
                                </span>
                                {event.habitStreak && (
                                  <span className="bg-white/20 px-1 rounded text-xs">
                                    {event.habitStreak}🔥
                                  </span>
                                )}
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <MapPin className="h-2 w-2" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                              
                              {event.goalAlignment && event.goalAlignment > 70 && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Target className="h-2 w-2" />
                                  <span>{event.goalAlignment}% aligned</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Quick actions */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Show context menu
                                }}
                                className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            </div>
                            
                            {/* Completion indicator */}
                            {event.completedAt && (
                              <div className="absolute -top-1 -right-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Add event hover state */}
                    {isHovered && slotEvents.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/50 rounded-lg border-2 border-dashed border-indigo-300">
                        <div className="flex items-center space-x-1 text-indigo-600">
                          <Plus className="h-4 w-4" />
                          <span className="text-xs font-medium">Add Event</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Optimal time indicator */}
                    {slot.isOptimal && !focusMode && slotEvents.length === 0 && (
                      <div className="absolute bottom-0 right-0 m-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Drag ghost */}
      {dragState.isDragging && dragState.ghostPosition && dragState.draggedEvent && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: dragState.ghostPosition.x,
            top: dragState.ghostPosition.y
          }}
        >
          <div className="bg-indigo-500 text-white p-2 rounded-lg shadow-lg border-2 border-indigo-600 opacity-75">
            <div className="text-xs font-medium">{dragState.draggedEvent.title}</div>
            <div className="text-xs opacity-90">Moving...</div>
          </div>
        </div>
      )}
      
      {/* Life balance indicator */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Life Balance</h4>
          <div className="text-xs text-gray-500">
            Today's focus distribution
          </div>
        </div>
        
        <div className="flex space-x-2">
          {Object.entries(lifeBalance).map(([domain, percentage]) => {
            const colorClass = DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS];
            return (
              <div 
                key={domain}
                className="flex-1"
                title={`${domain}: ${percentage}%`}
              >
                <div className={`h-2 rounded-full ${colorClass.split(' ')[0]}`} 
                     style={{ width: `${percentage}%` }}></div>
                <div className="text-xs text-center mt-1 capitalize">{domain}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && createModalPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Event</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get('title') as string;
              const duration = parseInt(formData.get('duration') as string) || 60;
              
              const startTime = createModalPosition.time;
              const endTime = new Date(startTime.getTime() + duration * 60000);
              
              onEventCreate({
                title,
                startTime,
                endTime,
                eventType: 'task',
                energyLevel: 'medium',
                privacyLevel: 'private',
                tags: [],
                priority: 'medium',
                isRecurring: false
              });
              
              setShowCreateModal(false);
              setCreateModalPosition(null);
            }}>
              <div className="space-y-4">
                <input
                  name="title"
                  type="text"
                  placeholder="Event title"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
                
                <select
                  name="duration"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateModalPosition(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}