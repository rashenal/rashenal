import React, { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface FocusManagerProps {
  children: React.ReactNode;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  trapFocus = false,
  restoreFocus = true,
  autoFocus = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const { accessibilitySettings } = useTheme();

  // Store the previously focused element
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement;
    }

    return () => {
      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  // Auto-focus the first focusable element
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = getFocusableElements(containerRef.current)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [autoFocus]);

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((element) => {
        return element instanceof HTMLElement && 
               element.offsetParent !== null && // Element is visible
               !element.hasAttribute('aria-hidden');
      }) as HTMLElement[];
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trapFocus || !containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab - go backward
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab - go forward
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    // Escape key to close/exit focus trap
    if (event.key === 'Escape') {
      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }
  }, [trapFocus, restoreFocus, getFocusableElements]);

  // Add keyboard event listeners
  useEffect(() => {
    if (trapFocus) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [trapFocus, handleKeyDown]);

  return (
    <div 
      ref={containerRef}
      className={`
        ${accessibilitySettings.keyboardNavigation ? 'keyboard-navigation' : ''}
        ${accessibilitySettings.focusVisible ? 'focus-visible' : ''}
      `}
    >
      {children}
    </div>
  );
};

// Hook for managing focus announcements for screen readers
export const useFocusAnnouncement = () => {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Clear the message after a short delay to allow re-announcement of the same message
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const AnnouncementRegion = useCallback(() => (
    <div
      ref={announceRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  ), []);

  return { announce, AnnouncementRegion };
};

// Hook for managing skip links
export const useSkipLinks = (links: Array<{ id: string; label: string; href: string }>) => {
  const SkipLinks = useCallback(() => (
    <div className="skip-links">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target instanceof HTMLElement) {
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  ), [links]);

  return { SkipLinks };
};

// Custom hook for accessible form validation
export const useAccessibleValidation = () => {
  const { announce } = useFocusAnnouncement();

  const validateField = useCallback((
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    rules: Array<{
      test: (value: string) => boolean;
      message: string;
    }>
  ) => {
    const errors: string[] = [];
    
    for (const rule of rules) {
      if (!rule.test(element.value)) {
        errors.push(rule.message);
      }
    }

    // Update ARIA attributes
    if (errors.length > 0) {
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', `${element.id}-error`);
      
      // Create or update error message element
      let errorElement = document.getElementById(`${element.id}-error`);
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${element.id}-error`;
        errorElement.className = 'text-red-600 text-sm mt-1';
        errorElement.setAttribute('aria-live', 'polite');
        element.parentNode?.insertBefore(errorElement, element.nextSibling);
      }
      
      errorElement.textContent = errors[0]; // Show first error
      announce(`Validation error: ${errors[0]}`, 'assertive');
    } else {
      element.setAttribute('aria-invalid', 'false');
      element.removeAttribute('aria-describedby');
      
      // Remove error message element
      const errorElement = document.getElementById(`${element.id}-error`);
      if (errorElement) {
        errorElement.remove();
      }
    }

    return errors.length === 0;
  }, [announce]);

  return { validateField };
};

export default FocusManager;