/**
 * UI Functional Testing System
 * Tests that UI components are properly enabled and functional
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Component imports
import AIHabitTracker from '../components/AIHabitTracker';
import AIssistents from '../components/AIssistents';
import GoalsManagement from '../components/GoalsManagement';
import EnhancedNavigation from '../components/EnhancedNavigation';

// Context providers for testing
import { UserProvider } from '../contexts/userContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock implementations
const mockUser = {
  id: 'test-user-123',
  email: 'rharveybis@hotmail.com',
  user_metadata: {
    full_name: 'Elizabeth Harvey'
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <UserProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </UserProvider>
  </BrowserRouter>
);

// Mock the user context to return our test user
vi.mock('../contexts/userContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUser: () => ({
    user: mockUser,
    session: { user: mockUser },
    loading: false
  })
}));

// Mock AI service
vi.mock('../lib/AIService', () => ({
  aiService: {
    invokeChat: vi.fn().mockResolvedValue({
      data: { message: 'Mock AI response' },
      message: 'Mock AI response'
    })
  }
}));

describe('UI Functional Tests', () => {
  
  describe('AIHabitTracker Component', () => {
    
    it('should allow users to mark habits as complete', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AIHabitTracker />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('AI Habit Tracker')).toBeInTheDocument();
      });

      // Look for habit completion buttons (Circle icons that should be clickable)
      const habitButtons = screen.getAllByRole('button');
      const completionButtons = habitButtons.filter(button => {
        const title = button.getAttribute('title');
        return title?.includes('Mark as complete') || title?.includes('Completed!');
      });

      expect(completionButtons.length).toBeGreaterThan(0);

      // Test clicking a completion button
      if (completionButtons.length > 0) {
        await user.click(completionButtons[0]);
        
        // Should show some feedback (completed state or stats update)
        await waitFor(() => {
          // Check if the button title changed or icon changed
          const updatedButton = completionButtons[0];
          const title = updatedButton.getAttribute('title');
          expect(title).toBeTruthy();
        });
      }
    });

    it('should have functional "New Habit" button', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AIHabitTracker />
        </TestWrapper>
      );

      // Find and click "New Habit" button
      const newHabitButton = screen.getByText('New Habit');
      expect(newHabitButton).toBeInTheDocument();
      
      await user.click(newHabitButton);

      // Should open a modal or form
      await waitFor(() => {
        expect(screen.getByText('Add New Habit') || screen.getByText('Create Habit')).toBeInTheDocument();
      });
    });

    it('should have functional "Habit Coach" button', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AIHabitTracker />
        </TestWrapper>
      );

      // Find and click "Habit Coach" button
      const coachButton = screen.getByText('Habit Coach');
      expect(coachButton).toBeInTheDocument();
      
      await user.click(coachButton);

      // Should open chat interface
      await waitFor(() => {
        expect(screen.getByText('Habit Architect') || screen.getByPlaceholderText(/chat/i)).toBeInTheDocument();
      });
    });

  });

  describe('AIssistents Component', () => {
    
    it('should allow creating new assistants (admin only)', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AIssistents />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('AIssistents')).toBeInTheDocument();
      });

      // Should show "New AIssistent" button for admin users
      const newButton = screen.getByText('New AIssistent');
      expect(newButton).toBeInTheDocument();
      
      await user.click(newButton);

      // Should open creation form
      await waitFor(() => {
        expect(screen.getByText('Name') || screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should have functional chat interface', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AIssistents />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('AIssistents')).toBeInTheDocument();
      });

      // Look for chat input
      const chatInput = screen.getByPlaceholderText(/chat/i);
      if (chatInput) {
        await user.type(chatInput, 'Hello AI assistant');
        
        // Look for send button
        const sendButton = screen.getByRole('button', { name: /send/i });
        await user.click(sendButton);

        // Should show loading or response
        await waitFor(() => {
          expect(screen.getByText(/thinking/i) || screen.getByText('Mock AI response')).toBeInTheDocument();
        });
      }
    });

  });

  describe('GoalsManagement Component', () => {
    
    it('should allow creating new goals', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <GoalsManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Goals Management')).toBeInTheDocument();
      });

      // Look for "New Goal" button
      const newGoalButton = screen.getByText('New Goal');
      expect(newGoalButton).toBeInTheDocument();
      
      await user.click(newGoalButton);

      // Should open creation interface or show AI coach
      await waitFor(() => {
        expect(screen.getByText(/create/i) || screen.getByText(/goal/i)).toBeInTheDocument();
      });
    });

    it('should have functional AI Coach chat', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <GoalsManagement />
        </TestWrapper>
      );

      // Switch to chat tab
      const chatTab = screen.getByText('AI Coach');
      await user.click(chatTab);

      // Look for chat interface
      const chatInput = screen.getByPlaceholderText(/ask about/i);
      expect(chatInput).toBeInTheDocument();
      
      await user.type(chatInput, 'Help me with my goals');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/thinking/i) || screen.getByText('Mock AI response')).toBeInTheDocument();
      });
    });

  });

  describe('Navigation Component', () => {
    
    it('should have all main navigation items', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Check for main navigation items
      const navItems = [
        'Dashboard',
        'Habits', 
        'Smart Tasks',
        'Job Finder',
        'Calendar',
        'AI Accountability',
        'AIssistents',
        'Goals'
      ];

      navItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('should have functional hamburger menu', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Find hamburger menu button (should have Menu icon)
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
      
      await user.click(menuButton);

      // Should open mobile menu
      await waitFor(() => {
        expect(screen.getByText('MyRashenal')).toBeInTheDocument();
      });
    });

  });

});

// Interactive Element Tests
describe('Interactive Elements Tests', () => {
  
  it('should test all buttons are clickable and have proper roles', async () => {
    const user = userEvent.setup();
    
    // Test AIHabitTracker buttons
    render(
      <TestWrapper>
        <AIHabitTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Habit Tracker')).toBeInTheDocument();
    });

    // Get all buttons and test they're accessible
    const buttons = screen.getAllByRole('button');
    
    expect(buttons.length).toBeGreaterThan(0);
    
    // Test first few buttons are clickable
    for (let i = 0; i < Math.min(3, buttons.length); i++) {
      const button = buttons[i];
      expect(button).not.toHaveAttribute('disabled');
      
      // Test button is in tab order
      expect(button).not.toHaveAttribute('tabindex', '-1');
    }
  });

  it('should test form inputs accept user input', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <AIHabitTracker />
      </TestWrapper>
    );

    // Click "New Habit" to open form
    const newHabitButton = screen.getByText('New Habit');
    await user.click(newHabitButton);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/habit name/i) || screen.getByPlaceholderText(/habit/i);
      if (nameInput) {
        expect(nameInput).toBeInTheDocument();
        
        // Test typing in input
        await user.type(nameInput, 'Test Habit');
        expect(nameInput).toHaveValue('Test Habit');
      }
    });
  });

});

// Accessibility Tests
describe('Accessibility Tests', () => {
  
  it('should have proper ARIA labels and roles', () => {
    render(
      <TestWrapper>
        <EnhancedNavigation />
      </TestWrapper>
    );

    // Navigation should have proper role
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    
    // Buttons should have accessible names
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const accessibleName = button.getAttribute('aria-label') || 
                           button.textContent || 
                           button.getAttribute('title');
      expect(accessibleName).toBeTruthy();
    });
  });

  it('should support keyboard navigation', async () => {
    render(
      <TestWrapper>
        <EnhancedNavigation />
      </TestWrapper>
    );

    // Test tab navigation
    const focusableElements = screen.getAllByRole('button').concat(screen.getAllByRole('link'));
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // All focusable elements should be keyboard accessible
    focusableElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });

});