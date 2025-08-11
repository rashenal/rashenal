import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-blue-600 text-white px-4 py-2 rounded-lg font-medium z-50
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      "
    >
      {children}
    </a>
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

export function FocusTrap({ children, isActive, className = '' }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const focusableArray = Array.from(focusableElements) as HTMLElement[];
    
    if (focusableArray.length === 0) return;

    firstFocusableRef.current = focusableArray[0];
    lastFocusableRef.current = focusableArray[focusableArray.length - 1];

    // Focus the first element
    firstFocusableRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({ children, as: Component = 'span' }: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We've encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ message, priority = 'polite', className = '' }: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}

interface AccessibilityPreferencesProps {
  onPreferencesChange?: (preferences: AccessibilityPreferences) => void;
  className?: string;
}

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

export function AccessibilityPreferences({ onPreferencesChange, className = '' }: AccessibilityPreferencesProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    // Load from localStorage or system preferences
    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      return JSON.parse(saved);
    }

    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    return {
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
      largeText: false,
      screenReaderMode: false,
      keyboardNavigation: true
    };
  });

  useEffect(() => {
    // Apply preferences to document
    document.body.classList.toggle('reduce-motion', preferences.reducedMotion);
    document.body.classList.toggle('high-contrast', preferences.highContrast);
    document.body.classList.toggle('large-text', preferences.largeText);
    document.body.classList.toggle('keyboard-navigation', preferences.keyboardNavigation);

    // Save preferences
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
    
    // Notify parent
    onPreferencesChange?.(preferences);
  }, [preferences, onPreferencesChange]);

  const updatePreference = (key: keyof AccessibilityPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const preferencesOptions = [
    {
      key: 'reducedMotion' as const,
      label: 'Reduce motion and animations',
      description: 'Minimizes moving elements for users who prefer less motion',
      icon: EyeOff
    },
    {
      key: 'highContrast' as const,
      label: 'High contrast mode',
      description: 'Increases color contrast for better visibility',
      icon: Eye
    },
    {
      key: 'largeText' as const,
      label: 'Larger text size',
      description: 'Increases font size throughout the application',
      icon: Volume2
    },
    {
      key: 'keyboardNavigation' as const,
      label: 'Enhanced keyboard navigation',
      description: 'Shows focus indicators and improves keyboard navigation',
      icon: Volume2
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Accessibility Preferences
        </h3>
        <p className="text-gray-600 text-sm">
          Customize the interface to work better for you
        </p>
      </div>

      <div className="space-y-4">
        {preferencesOptions.map((option) => {
          const Icon = option.icon;
          return (
            <label
              key={option.key}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={preferences[option.key]}
                onChange={(e) => updatePreference(option.key, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {option.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// Hook for managing accessibility preferences
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to defaults if parsing fails
      }
    }

    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: false,
      screenReaderMode: false,
      keyboardNavigation: true
    };
  });

  const updatePreferences = (newPreferences: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  useEffect(() => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  }, [preferences]);

  return {
    preferences,
    updatePreferences
  };
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('keyboard-user', isKeyboardUser);
  }, [isKeyboardUser]);

  return isKeyboardUser;
}