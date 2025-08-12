# Data Persistence Implementation Guide

## Overview
This guide covers the complete implementation of robust data persistence for the Rashenal application, fixing issues with user preferences, task data integrity, and UI state management.

## Files Created/Modified

### 1. Database Migration
**File:** `supabase/migrations/20250811_add_user_preferences.sql`
- Adds `preferences` JSONB column to `user_profiles` table
- Creates GIN index for performance
- Sets default preferences for existing users

### 2. Core Hooks
**File:** `src/hooks/useUserPreferences.ts`
- Manages all user preferences with automatic persistence
- Provides real-time synchronization across sessions
- Includes localStorage backup for offline resilience
- Debounced saves to optimize database writes

**File:** `src/lib/utils.ts`
- Utility functions for debouncing, throttling, and data manipulation

### 3. Enhanced Components
**File:** `src/components/TaskBoardEnhanced.tsx`
- Replaces basic TaskBoard with preference-aware version
- Persistent view toggles (card details, compact view, AI insights)
- Column visibility management
- Real-time task synchronization
- Immediate drag-and-drop persistence

**File:** `src/components/AICoachChatFixed.tsx`
- Fixed input focus restoration
- Proper focus management with refs
- Prevents focus fighting between operations
- Respects user's autoFocusInput preference

### 4. Testing
**File:** `src/tests/PersistenceTestScenarios.tsx`
- Comprehensive test suite for all persistence features
- Tests preference saving/loading
- Validates task data integrity
- Verifies real-time synchronization
- Checks error recovery mechanisms

## Implementation Steps

### Step 1: Apply Database Migration
```bash
# Run the migration to add preferences column
supabase db push
```

### Step 2: Update Imports
Replace existing component imports in your main app files:

```typescript
// In your main dashboard or app component
import TaskBoardEnhanced from './components/TaskBoardEnhanced';
import AICoachChatFixed from './components/AICoachChatFixed';
```

### Step 3: Use the Preferences Hook
In any component that needs user preferences:

```typescript
import { useUserPreferences } from '../hooks/useUserPreferences';

function MyComponent() {
  const { preferences, updatePreference } = useUserPreferences();
  
  // Use preferences
  const showDetails = preferences.taskBoard.showCardDetails;
  
  // Update a preference
  const toggleDetails = () => {
    updatePreference('taskBoard', 'showCardDetails', !showDetails);
  };
}
```

### Step 4: Run Tests
Add the test component to a route for verification:

```typescript
import PersistenceTestScenarios from './tests/PersistenceTestScenarios';

// Add to your routes
<Route path="/tests" element={<PersistenceTestScenarios />} />
```

## Key Features Implemented

### 1. Preference Persistence
- ✅ User preferences saved to JSONB column in database
- ✅ Automatic synchronization across browser sessions
- ✅ LocalStorage fallback for offline support
- ✅ Real-time updates via Supabase subscriptions

### 2. Task Board Preferences
- ✅ Show/hide card details toggle
- ✅ Compact/expanded view mode
- ✅ AI insights visibility
- ✅ Column visibility management
- ✅ Sort order preferences
- ✅ Filter tag selections

### 3. Task Data Integrity
- ✅ All task attributes properly saved
- ✅ Immediate persistence on drag-and-drop
- ✅ Real-time synchronization across users
- ✅ Optimistic updates with error recovery
- ✅ Position tracking for proper ordering

### 4. Input Focus Management
- ✅ Auto-focus preference respected
- ✅ Focus restoration after async operations
- ✅ Prevention of focus fighting
- ✅ Proper blur/focus event handling

### 5. Error Recovery
- ✅ LocalStorage backup when database fails
- ✅ Graceful degradation
- ✅ Automatic retry mechanisms
- ✅ User-friendly error messages

## Usage Examples

### Toggle a Preference
```typescript
// Toggle card details view
await updatePreference('taskBoard', 'showCardDetails', true);

// Change AI coaching style
await updatePreference('ai', 'coachingStyle', 'analytical');

// Update multiple preferences at once
await updatePreferences({
  taskBoard: { compactView: true, showAIInsights: false },
  ui: { theme: 'dark' }
});
```

### Access Current Preferences
```typescript
// Get all task board preferences
const boardPrefs = getPreference('taskBoard');

// Get specific preference
const showDetails = getPreference('taskBoard', 'showCardDetails');
```

### Reset to Defaults
```typescript
// Reset all preferences to defaults
await resetPreferences();
```

## Troubleshooting

### Preferences Not Saving
1. Check Supabase connection
2. Verify user is authenticated
3. Check browser console for errors
4. Ensure migration was applied

### Real-time Updates Not Working
1. Check Supabase real-time is enabled
2. Verify RLS policies allow updates
3. Check network connectivity
4. Review subscription setup

### Focus Issues
1. Verify `autoFocusInput` preference is true
2. Check for conflicting focus handlers
3. Ensure component is properly mounted
4. Review browser console for errors

## Performance Considerations

1. **Debounced Saves**: Preferences are debounced (500ms) to prevent excessive database writes
2. **LocalStorage Cache**: Reduces database reads on app initialization
3. **Optimistic Updates**: UI updates immediately while saves happen in background
4. **Selective Subscriptions**: Only subscribe to relevant real-time channels

## Security Notes

1. All preferences are user-scoped via RLS policies
2. No sensitive data stored in preferences
3. JSONB validation prevents injection attacks
4. LocalStorage cleared on logout

## Next Steps

1. Consider adding preference profiles (work/personal)
2. Implement preference import/export
3. Add preference versioning for migrations
4. Create preference templates for new users
5. Add analytics for preference usage patterns

## Support

For issues or questions:
1. Check the test suite at `/tests`
2. Review browser console for detailed errors
3. Verify database migration status
4. Check Supabase logs for backend errors