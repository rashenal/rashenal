import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component to verify theme context
const TestComponent = () => {
  const { theme, accessibilitySettings, getContrastRatio, isWCAGAACompliant } = useTheme();
  
  return React.createElement('div', { 'data-testid': 'theme-test' }, 
    React.createElement('span', { 'data-testid': 'current-theme' }, theme),
    React.createElement('span', { 'data-testid': 'font-size' }, accessibilitySettings.fontSize),
    React.createElement('span', { 'data-testid': 'high-contrast' }, accessibilitySettings.highContrast.toString()),
    React.createElement('span', { 'data-testid': 'motion-reduced' }, accessibilitySettings.motionReduced.toString()),
    React.createElement('span', { 'data-testid': 'contrast-ratio' }, getContrastRatio('#000000', '#ffffff').toFixed(2)),
    React.createElement('span', { 'data-testid': 'wcag-compliant' }, isWCAGAACompliant('#000000', '#ffffff').toString())
  );
};

describe('ThemeContext', () => {
  it('should provide default theme and accessibility settings', () => {
    const { getByTestId } = render(
      React.createElement(ThemeProvider, {}, React.createElement(TestComponent))
    );
    
    expect(getByTestId('current-theme').textContent).toBe('light');
    expect(getByTestId('font-size').textContent).toBe('medium');
    expect(getByTestId('high-contrast').textContent).toBe('false');
  });

  it('should calculate correct contrast ratios', () => {
    const { getByTestId } = render(
      React.createElement(ThemeProvider, {}, React.createElement(TestComponent))
    );
    
    // Black on white should have 21:1 ratio
    expect(getByTestId('contrast-ratio').textContent).toBe('21.00');
    expect(getByTestId('wcag-compliant').textContent).toBe('true');
  });

  it('should detect system preferences', () => {
    // Mock prefers-reduced-motion
    window.matchMedia = vi.fn().mockImplementation(query => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return {
          matches: true,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      }
      return {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    });

    const { getByTestId } = render(
      React.createElement(ThemeProvider, {}, React.createElement(TestComponent))
    );
    
    expect(getByTestId('motion-reduced').textContent).toBe('true');
  });

  it('should store theme preferences in localStorage', () => {
    render(
      React.createElement(ThemeProvider, {}, React.createElement(TestComponent))
    );
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rashenal-theme', 'light');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rashenal-accessibility', expect.any(String));
  });

  it('should apply CSS classes to document element', () => {
    render(
      React.createElement(ThemeProvider, {}, React.createElement(TestComponent))
    );
    
    // Check that light theme class is applied
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});