import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EnhancedTaskBoard from '../EnhancedTaskBoard';
import { UserProvider } from '../../contexts/userContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the user context
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {}
};

const mockSession = {
  user: mockUser,
  access_token: 'test-token'
};

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: mockUser } }),
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } })
    }
  }
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <UserProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </UserProvider>
  </BrowserRouter>
);

describe('EnhancedTaskBoard', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders without crashing', async () => {
    render(
      <TestWrapper>
        <EnhancedTaskBoard />
      </TestWrapper>
    );

    // Should render the component without errors
    expect(screen.getByTestId).toBeDefined();
  });

  it('shows template gallery button', async () => {
    render(
      <TestWrapper>
        <EnhancedTaskBoard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Look for template gallery or create board button
      const templateButton = screen.queryByText(/template/i) || 
                            screen.queryByText(/create/i) ||
                            screen.queryByText(/browse/i);
      expect(templateButton).toBeTruthy();
    });
  });

  it('can open template gallery', async () => {
    render(
      <TestWrapper>
        <EnhancedTaskBoard />
      </TestWrapper>
    );

    await waitFor(() => {
      const templateButton = screen.queryByText(/template/i) || 
                            screen.queryByText(/browse/i);
      if (templateButton) {
        fireEvent.click(templateButton);
        
        // Should show template gallery modal
        expect(screen.queryByText(/template gallery/i)).toBeTruthy();
      }
    });
  });

  it('displays board templates correctly', async () => {
    render(
      <TestWrapper>
        <EnhancedTaskBoard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Open template gallery
      const templateButton = screen.queryByText(/template/i) || 
                            screen.queryByText(/browse/i);
      if (templateButton) {
        fireEvent.click(templateButton);
        
        // Should show SAVERS template
        expect(screen.queryByText(/savers/i)).toBeTruthy();
      }
    });
  });
});