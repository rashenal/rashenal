import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DarkModeToggleProps {
  className?: string;
}

export default function DarkModeToggle({ className = '' }: DarkModeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 
        hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 
        focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      <div className="relative w-6 h-6">
        <Sun
          className={`absolute inset-0 h-6 w-6 text-yellow-500 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          aria-hidden="true"
        />
        <Moon
          className={`absolute inset-0 h-6 w-6 text-purple-600 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </button>
  );
}

// Compact version for use in navigation bars
export function DarkModeToggleCompact() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="group relative inline-flex h-9 w-16 items-center rounded-full 
        bg-gray-200 dark:bg-gray-700 transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
        dark:focus:ring-offset-gray-900"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode toggle"
    >
      <span className="sr-only">
        {isDark ? 'Disable dark mode' : 'Enable dark mode'}
      </span>
      <span
        className={`${
          isDark ? 'translate-x-8' : 'translate-x-1'
        } inline-block h-7 w-7 transform rounded-full bg-white dark:bg-gray-900 
        transition-transform duration-200 ease-in-out shadow-md`}
      >
        <span className="flex h-full w-full items-center justify-center">
          {isDark ? (
            <Moon className="h-4 w-4 text-purple-600" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          )}
        </span>
      </span>
    </button>
  );
}