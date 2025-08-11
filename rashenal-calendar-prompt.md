You are a distinguished professor of UX design and system architecture with 20+ years creating interfaces that define categories. You're about to architect the **Rashenal Calendar** - not just another calendar, but a revolutionary life orchestration system that makes Calendly look like a flip phone in the smartphone era.

## 🎯 CORE MISSION
Create a calendar system so intuitive, powerful, and transformative that users will say: "How did I ever manage my life without this?" It should feel like having a brilliant executive assistant who knows you better than you know yourself.

## 🏗️ ARCHITECTURE REQUIREMENTS

### 1. **Dual-Layer Architecture**
```
├── UX Layer (React/TypeScript)
│   ├── Voice-First Interface
│   ├── Multi-View System (Week/Gantt/Dependency)
│   ├── Gesture Controls
│   └── Accessibility-First Design
│
└── Service Layer (Edge Functions)
    ├── Event Orchestrator
    ├── Habit-Goal Aligner
    ├── Conflict Resolver
    └── Intelligence Engine
```

### 2. **SECURITY SPECIFICATIONS**
- **Voice Biometric Lock**: Calendar responds ONLY to authorized user's voice
- **Local Encryption Vault**: AES-256 for all personal data
- **Zero-Knowledge Architecture**: Even Rashenal servers can't read your data
- **Secure Endpoints**: OAuth2 + JWT with rotating keys
- **Local LLM Option**: Ollama integration for complete privacy

### 3. **CALENDAR VIEWS TO IMPLEMENT**

#### A. **Smart Week View** (Primary)
- Habits auto-scheduled around fixed events
- Energy-level optimization (schedule deep work when user is sharpest)
- Color-coded by life domains (work/health/relationships/growth)
- Drag-to-reschedule with AI conflict resolution

#### B. **Gantt Chart View** (Projects)
- Dependency chains visible
- Critical path highlighting
- Resource allocation (time/energy/attention)
- Milestone celebrations

#### C. **Dependency Map** (Network View)
- Show how events connect to goals
- Visualize blocking dependencies
- Suggest optimal sequencing
- Highlight bottlenecks

### 4. **VOICE INTERFACE REQUIREMENTS**
```typescript
// Natural language examples that MUST work:
"Schedule coffee with Sarah next week when we're both free"
"Move my morning routine 30 minutes earlier for the next month"
"Find me 2 hours for deep work on the AI project this week"
"Remind me to call mom when I'm walking home"
"Block focus time daily until this goal is complete"
```

### 5. **INTELLIGENT FEATURES**

#### **Contextual Auto-Reminders**
- Location-aware: "You're near the pharmacy, pick up vitamins"
- Energy-aware: "Low energy detected, suggesting 15-min walk"
- Goal-aware: "This meeting supports your promotion goal"
- Relationship-aware: "It's been 2 weeks since you called Dad"

#### **Habit-Goal Integration**
- Auto-schedule habits at optimal times
- Adjust calendar when habits are missed
- Suggest habit stacking opportunities
- Celebrate streaks visually in calendar

#### **Learning Behavior Engine**
- Track what meeting types drain vs energize
- Learn optimal work patterns
- Suggest social connections based on mood
- Identify and protect flow states

### 6. **SOCIAL & COLLABORATION**

#### **Shared Calendars**
- Public learning sessions
- Accountability partnerships
- Team synchronization
- Family coordination mode

#### **Privacy Levels**
1. **Private**: Only you see details
2. **Busy/Free**: Others see availability
3. **Domain**: Show category (e.g., "Health")
4. **Public**: Full transparency for learning groups

### 7. **INTEGRATIONS**

```typescript
interface CalendarIntegrations {
  storage: {
    googleDrive: boolean;  // Store backups
    localVault: boolean;   // Encrypted local storage
    supabase: boolean;     // Cloud sync
  };
  
  external: {
    googleCalendar: boolean;  // Import/sync
    outlook: boolean;         // Corporate sync
    zoom: boolean;           // Auto-add meeting links
    calendly: boolean;        // Migration tool 😉
  };
  
  rashenal: {
    habits: boolean;          // Auto-schedule
    tasks: boolean;           // Time-block tasks
    goals: boolean;           // Align with objectives
    aiCoach: boolean;         // Get scheduling advice
  };
}
```

### 8. **UX REQUIREMENTS**

#### **Accessibility Mandates**
- WCAG AAA compliance
- Screen reader optimized
- Keyboard navigation complete
- High contrast mode
- Reduced motion option
- Dyslexia-friendly fonts
- ADHD-friendly focus modes

#### **Neurodiversity Features**
- **ADHD Mode**: Time-blindness helpers, visual timers
- **Autism Mode**: Routine protection, change warnings
- **Anxiety Mode**: Gentle reminders, prep time buffers
- **Depression Mode**: Low-energy scheduling, celebration boosts

### 9. **PERFORMANCE SPECS**
- Calendar loads in <500ms
- Voice commands process in <1 second
- Sync across devices in <3 seconds
- Offline-first with smart sync
- Handle 10,000+ events smoothly

### 10. **FILE STRUCTURE**
```
src/features/calendar/
├── components/
│   ├── CalendarCore.tsx           // Main calendar component
│   ├── WeekView.tsx               // Default view
│   ├── GanttView.tsx              // Project timeline
│   ├── DependencyMap.tsx          // Network visualization
│   ├── VoiceCommander.tsx         // Voice interface
│   └── CalendarSettings.tsx       // Configuration
│
├── services/
│   ├── CalendarOrchestrator.ts    // Main service layer
│   ├── EventIntelligence.ts       // AI scheduling
│   ├── ConflictResolver.ts        // Smart conflicts
│   ├── ReminderEngine.ts          // Contextual reminders
│   └── VoiceBiometric.ts          // Voice security
│
├── hooks/
│   ├── useCalendarSync.ts
│   ├── useVoiceControl.ts
│   └── useSmartScheduling.ts
│
└── types/
    └── calendar.types.ts
```

## 🎨 **DESIGN PHILOSOPHY**

### Visual Hierarchy
1. **Today** is always the hero - biggest, boldest
2. **Habits** subtly integrated, not overwhelming
3. **Free time** celebrated and protected
4. **Conflicts** resolved before they happen

### Interaction Principles
- **One-tap** for common actions
- **Drag anywhere** to reschedule
- **Long-press** for options
- **Swipe** for quick actions
- **Pinch** to zoom time scale

### Emotional Design
- Morning message: "Your day is designed for success"
- Completion celebrations: Subtle particle effects
- Streak recognition: Visual flourishes
- Goal alignment: Green highlights when on track

## 🚀 **IMPLEMENTATION PRIORITIES**

### Phase 1: Core Calendar (Week 1)
1. Basic week view with drag-drop
2. Event creation/editing
3. Supabase integration
4. Basic habit scheduling

### Phase 2: Intelligence (Week 2)
1. Conflict detection
2. Smart suggestions
3. Energy-based scheduling
4. Auto-reminders

### Phase 3: Voice & Views (Week 3)
1. Voice command system
2. Gantt chart view
3. Dependency mapping
4. Voice biometric security

### Phase 4: Integrations (Week 4)
1. Google Calendar sync
2. Google Drive backup
3. External calendar import
4. Share functionality

## 💡 **INNOVATION REQUIREMENTS**

### Must-Have Innovations
1. **Time Texture**: Visual/haptic feedback for different event types
2. **Energy Mapping**: Schedule matches your circadian rhythm
3. **Relationship Radar**: Nudge connections that need attention
4. **Goal Proximity**: Show how each event moves you toward goals
5. **Flow Protection**: AI guards your deep work time

### Delight Features
- **Serendipity Slots**: AI suggests random good things
- **Energy Harvesting**: Find hidden pockets of time
- **Social Synchrony**: Find optimal meeting times instantly
- **Life Balance Score**: Real-time feedback on life domains
- **Future Self**: See where this schedule leads in 6 months

## 📊 **SUCCESS METRICS**

The calendar succeeds when:
- Users check it eagerly each morning
- Scheduling takes 80% less time
- Habits completion increases 40%
- Users feel in control, not controlled
- People share it evangelically

## 🎯 **THE CHALLENGE**

Create a calendar so powerful that it becomes the user's most trusted advisor, so intuitive that grandparents use it easily, so smart that it prevents problems before they occur, and so delightful that checking it sparks joy.

Remember: You're not building a calendar. You're building a life orchestration system that happens to use time as its canvas.

Make Calendly users wonder why they're paying $15/month for basic scheduling when Rashenal Calendar does 100x more for free.

## 🔧 **TECHNICAL IMPLEMENTATION NOTES**

### Project Location
Work directly in: `C:\Users\rharv\Documents\rashenal`

### Database Schema Extensions
```sql
-- Calendar tables to add to Supabase
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT, -- 'habit', 'task', 'meeting', 'personal', 'focus'
  energy_level TEXT, -- 'high', 'medium', 'low'
  location TEXT,
  recurring_pattern JSONB,
  dependencies JSONB,
  reminder_settings JSONB,
  voice_note_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calendar_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  work_hours JSONB,
  energy_patterns JSONB,
  notification_preferences JSONB,
  voice_profile JSONB,
  theme_settings JSONB,
  integration_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shared_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT, -- 'view', 'edit', 'admin'
  calendar_filter JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Component Creation Order
1. Start with `CalendarCore.tsx` - the main container
2. Build `WeekView.tsx` with drag-and-drop
3. Add `CalendarOrchestrator.ts` service layer
4. Implement `VoiceCommander.tsx` for voice control
5. Create `GanttView.tsx` and `DependencyMap.tsx`
6. Add intelligence features progressively

### Key React Hooks to Create
```typescript
// useCalendarState.ts
export const useCalendarState = () => {
  // Manages all calendar state, events, and views
};

// useVoiceCommands.ts
export const useVoiceCommands = () => {
  // Handles voice input and natural language processing
};

// useSmartScheduling.ts
export const useSmartScheduling = () => {
  // AI-powered scheduling suggestions and conflict resolution
};

// useCalendarSync.ts
export const useCalendarSync = () => {
  // Real-time sync with Supabase and external calendars
};
```

### Edge Functions to Create
```typescript
// supabase/functions/calendar-intelligence/index.ts
// Handles AI scheduling, conflict resolution, and smart suggestions

// supabase/functions/voice-processor/index.ts
// Processes voice commands and converts to calendar actions

// supabase/functions/calendar-sync/index.ts
// Manages external calendar integrations
```

### Styling Approach
Use Tailwind CSS with custom design tokens:
```css
/* Calendar-specific design tokens */
--calendar-today: theme('colors.blue.500');
--calendar-habit: theme('colors.green.400');
--calendar-work: theme('colors.purple.400');
--calendar-personal: theme('colors.pink.400');
--calendar-focus: theme('colors.orange.400');
```

## START BUILDING

Begin with `CalendarCore.tsx`. Make it sing. Make it revolutionary. Make it something you personally would use every single day for the rest of your life.

Remember the Rashenal mission: "Help me manage my life to make the very most out of my remaining years."

This calendar is the beating heart of that mission.

Now go create something magnificent.