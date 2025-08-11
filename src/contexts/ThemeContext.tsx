import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'high-contrast-light' | 'high-contrast-dark';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type MotionPreference = 'full' | 'reduced' | 'no-preference';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: FontSize;
  motionReduced: boolean;
  screenReader: boolean;
  focusVisible: boolean;
  keyboardNavigation: boolean;
}

interface ThemeContextType {
  theme: ThemeMode;
  accessibilitySettings: AccessibilitySettings;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleHighContrast: () => void;
  setFontSize: (size: FontSize) => void;
  toggleMotionReduction: () => void;
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  getContrastRatio: (foreground: string, background: string) => number;
  isWCAGAACompliant: (foreground: string, background: string) => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function for default accessibility settings
function getDefaultAccessibilitySettings(): AccessibilitySettings {
  return {
    highContrast: false,
    fontSize: 'medium',
    motionReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    screenReader: detectScreenReader(),
    focusVisible: true,
    keyboardNavigation: true
  };
}

// Detect screen reader usage
function detectScreenReader(): boolean {
  // Check for common screen reader user agents or accessibility features
  return !!(
    window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ChromeVox/i) ||
    window.speechSynthesis ||
    document.documentElement.getAttribute('data-whatinput') === 'keyboard'
  );
}

// WCAG contrast ratio calculation
function calculateContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const luminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) return 1;

  const fgLum = luminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = luminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('rashenal-theme') as ThemeMode;
    if (stored && ['light', 'dark', 'high-contrast-light', 'high-contrast-dark'].includes(stored)) {
      return stored;
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Initialize accessibility settings
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    const stored = localStorage.getItem('rashenal-accessibility');
    if (stored) {
      try {
        return { ...getDefaultAccessibilitySettings(), ...JSON.parse(stored) };
      } catch {
        return getDefaultAccessibilitySettings();
      }
    }
    return getDefaultAccessibilitySettings();
  });

  // Update document class and localStorage when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'high-contrast-light', 'high-contrast-dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Store in localStorage
    localStorage.setItem('rashenal-theme', theme);
  }, [theme]);

  // Update accessibility settings in DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--base-font-size', getFontSizeValue(accessibilitySettings.fontSize));
    
    // Motion preference
    if (accessibilitySettings.motionReduced) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (accessibilitySettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Focus visible
    if (accessibilitySettings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
    
    // Store in localStorage
    localStorage.setItem('rashenal-accessibility', JSON.stringify(accessibilitySettings));
  }, [accessibilitySettings]);

  // Listen for system preference changes
  useEffect(() => {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('rashenal-theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setAccessibilitySettings(prev => ({
        ...prev,
        motionReduced: e.matches
      }));
    };

    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);
    motionQuery.addEventListener('change', handleMotionChange);
    
    return () => {
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Helper function to get font size CSS value
  const getFontSizeValue = (size: FontSize): string => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '22px'
    };
    return sizes[size];
  };

  // Theme functions
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleHighContrast = () => {
    const isCurrentlyHighContrast = theme.includes('high-contrast');
    
    if (isCurrentlyHighContrast) {
      // Switch to regular theme
      const baseTheme = theme.includes('dark') ? 'dark' : 'light';
      setThemeState(baseTheme);
    } else {
      // Switch to high contrast version
      const highContrastTheme = theme === 'dark' ? 'high-contrast-dark' : 'high-contrast-light';
      setThemeState(highContrastTheme);
    }
    
    setAccessibilitySettings(prev => ({
      ...prev,
      highContrast: !isCurrentlyHighContrast
    }));
  };

  const setFontSize = (size: FontSize) => {
    setAccessibilitySettings(prev => ({
      ...prev,
      fontSize: size
    }));
  };

  const toggleMotionReduction = () => {
    setAccessibilitySettings(prev => ({
      ...prev,
      motionReduced: !prev.motionReduced
    }));
  };

  const updateAccessibilitySettings = (newSettings: Partial<AccessibilitySettings>) => {
    setAccessibilitySettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const getContrastRatio = (foreground: string, background: string): number => {
    return calculateContrastRatio(foreground, background);
  };

  const isWCAGAACompliant = (foreground: string, background: string): boolean => {
    const ratio = calculateContrastRatio(foreground, background);
    return ratio >= 7.0; // WCAG AAA standard
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      accessibilitySettings,
      toggleTheme,
      setTheme,
      toggleHighContrast,
      setFontSize,
      toggleMotionReduction,
      updateAccessibilitySettings,
      getContrastRatio,
      isWCAGAACompliant
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}