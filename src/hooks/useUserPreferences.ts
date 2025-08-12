import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';
import { debounce } from '../lib/utils';

export interface TaskBoardPreferences {
  showCardDetails: boolean;
  compactView: boolean;
  showAIInsights: boolean;
  columnVisibility: {
    backlog: boolean;
    todo: boolean;
    in_progress: boolean;
    blocked: boolean;
    done: boolean;
  };
  sortOrder: 'position' | 'priority' | 'dueDate' | 'created';
  filterTags: string[];
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  autoFocusInput: boolean;
  enableAnimations: boolean;
}

export interface AIPreferences {
  coachingStyle: 'encouraging' | 'direct' | 'analytical' | 'balanced';
  autoSuggest: boolean;
  showInsights: boolean;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  taskReminders: boolean;
  habitReminders: boolean;
}

export interface UserPreferences {
  taskBoard: TaskBoardPreferences;
  ui: UIPreferences;
  ai: AIPreferences;
  notifications: NotificationPreferences;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  taskBoard: {
    showCardDetails: true,
    compactView: false,
    showAIInsights: true,
    columnVisibility: {
      backlog: true,
      todo: true,
      in_progress: true,
      blocked: true,
      done: true,
    },
    sortOrder: 'position',
    filterTags: [],
  },
  ui: {
    theme: 'system',
    sidebarCollapsed: false,
    autoFocusInput: true,
    enableAnimations: true,
  },
  ai: {
    coachingStyle: 'encouraging',
    autoSuggest: true,
    showInsights: true,
  },
  notifications: {
    emailEnabled: false,
    pushEnabled: false,
    taskReminders: true,
    habitReminders: true,
  },
};

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreference: <T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T],
    value: any
  ) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  getPreference: <T extends keyof UserPreferences>(
    category: T,
    key?: keyof UserPreferences[T]
  ) => UserPreferences[T] | any;
}

export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track if we have unsaved changes
  const pendingUpdates = useRef<Partial<UserPreferences>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load preferences from database
  const loadPreferences = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data?.preferences) {
        // Merge with defaults to ensure all keys exist
        const mergedPreferences = deepMerge(DEFAULT_PREFERENCES, data.preferences);
        setPreferences(mergedPreferences);
        
        // Store in localStorage as backup
        localStorage.setItem(`preferences_${user.id}`, JSON.stringify(mergedPreferences));
      } else {
        // Check localStorage for backup
        const localPrefs = localStorage.getItem(`preferences_${user.id}`);
        if (localPrefs) {
          try {
            const parsed = JSON.parse(localPrefs);
            setPreferences(deepMerge(DEFAULT_PREFERENCES, parsed));
          } catch {
            setPreferences(DEFAULT_PREFERENCES);
          }
        }
      }
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
      
      // Fallback to localStorage
      const localPrefs = localStorage.getItem(`preferences_${user?.id}`);
      if (localPrefs) {
        try {
          setPreferences(JSON.parse(localPrefs));
        } catch {
          setPreferences(DEFAULT_PREFERENCES);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Save preferences to database (debounced)
  const savePreferences = useCallback(
    debounce(async (prefs: UserPreferences) => {
      if (!user?.id || !isInitialized) return;

      try {
        // Save to localStorage immediately as backup
        localStorage.setItem(`preferences_${user.id}`, JSON.stringify(prefs));

        // Save to database
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            preferences: prefs,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error saving preferences:', updateError);
          setError('Failed to save preferences');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Error saving preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to save preferences');
      }
    }, 500),
    [user?.id, isInitialized]
  );

  // Update a single preference
  const updatePreference = async <T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T],
    value: any
  ) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value,
      },
    };

    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  // Update multiple preferences at once
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const newPreferences = deepMerge(preferences, updates);
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  // Reset to default preferences
  const resetPreferences = async () => {
    setPreferences(DEFAULT_PREFERENCES);
    await savePreferences(DEFAULT_PREFERENCES);
  };

  // Get a specific preference value
  const getPreference = <T extends keyof UserPreferences>(
    category: T,
    key?: keyof UserPreferences[T]
  ) => {
    if (key) {
      return preferences[category][key];
    }
    return preferences[category];
  };

  // Set up real-time subscription for preference changes (multi-device sync)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`preferences_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.preferences) {
            const newPrefs = deepMerge(DEFAULT_PREFERENCES, payload.new.preferences);
            setPreferences(newPrefs);
            localStorage.setItem(`preferences_${user.id}`, JSON.stringify(newPrefs));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Load preferences when user changes
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      setIsInitialized(false);
    }
  }, [user?.id]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updatePreferences,
    resetPreferences,
    getPreference,
  };
};

// Deep merge utility function
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Debounce utility if not already in utils
function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}