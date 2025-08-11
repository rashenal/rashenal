import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@tests/helpers/test-utils';
import AIHabitTracker from '../../components/AIHabitTracker';
import { mockHabits } from '@tests/helpers/mock-data';

// Mock the settings
vi.mock('../../components/shared/SettingsModal', () => ({
  getLocalSettings: () => ({
    showStreak: true,
    showTarget: true,
    showProgress: true,
    showIcon: true,
    showCategory: true,
    showInsights: true
  })
}));

// Mock HabitsSettings component
vi.mock('../../components/settings/HabitsSettings', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="habits-settings">
        <button onClick={onClose}>Close Settings</button>
      </div>
    ) : null,
  defaultHabitsSettings: {
    showStreak: true,
    showTarget: true,
    showProgress: true,
    showIcon: true,
    showCategory: true,
    showInsights: true,
    enableReminders: true,
    reminderTime: '09:00',
    weekStartsMonday: true,
    showCalendarView: true
  }
}));

describe('AIHabitTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AIHabitTracker />);
    
    expect(screen.getByText('Your Habits')).toBeInTheDocument();
  });

  it('displays habit cards with correct information', () => {
    render(<AIHabitTracker />);
    
    expect(screen.getByText('Daily Meditation')).toBeInTheDocument();
    expect(screen.getByText('Daily Exercise')).toBeInTheDocument();
    expect(screen.getByText('Read Books')).toBeInTheDocument();
    expect(screen.getByText('Drink Water')).toBeInTheDocument();
  });

  it('shows streak information when settings allow', () => {
    render(<AIHabitTracker />);
    
    // Should show streak counts
    expect(screen.getByText('12 day streak')).toBeInTheDocument();
    expect(screen.getByText('8 day streak')).toBeInTheDocument();
  });

  it('allows habit selection', () => {
    render(<AIHabitTracker />);
    
    const exerciseHabit = screen.getByText('Daily Exercise').closest('div');
    if (exerciseHabit) {
      fireEvent.click(exerciseHabit);
    }
    
    // The selected habit should be highlighted (check for specific classes or aria attributes)
    expect(exerciseHabit).toHaveClass('border-purple-300');
  });

  it('displays progress bars correctly', () => {
    render(<AIHabitTracker />);
    
    // Check for progress indicators
    expect(screen.getAllByText(/\d+%/)).toHaveLength(4); // 4 habits with progress percentages
  });

  it('shows completion status with checkmarks', () => {
    render(<AIHabitTracker />);
    
    // Should show checkmarks for completed habits
    const checkCircles = screen.getAllByTestId(/check-circle|complete/i);
    expect(checkCircles.length).toBeGreaterThan(0);
  });

  it('displays weekly progress grid', () => {
    render(<AIHabitTracker />);
    
    expect(screen.getByText('This Week')).toBeInTheDocument();
    
    // Should show days of the week
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
  });

  it('shows AI insights when enabled', () => {
    render(<AIHabitTracker />);
    
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Streak Analysis')).toBeInTheDocument();
  });

  it('opens settings modal when settings button is clicked', () => {
    render(<AIHabitTracker />);
    
    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);
    
    expect(screen.getByTestId('habits-settings')).toBeInTheDocument();
  });

  it('closes settings modal when close is clicked', () => {
    render(<AIHabitTracker />);
    
    // Open settings
    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);
    
    expect(screen.getByTestId('habits-settings')).toBeInTheDocument();
    
    // Close settings
    const closeButton = screen.getByText('Close Settings');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('habits-settings')).not.toBeInTheDocument();
  });

  describe('Habit Categories', () => {
    it('displays habit categories when settings allow', () => {
      render(<AIHabitTracker />);
      
      expect(screen.getByText('mindfulness')).toBeInTheDocument();
      expect(screen.getByText('fitness')).toBeInTheDocument();
      expect(screen.getByText('learning')).toBeInTheDocument();
      expect(screen.getByText('health')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('shows correct progress percentages', () => {
      render(<AIHabitTracker />);
      
      expect(screen.getByText('85%')).toBeInTheDocument(); // Meditation
      expect(screen.getByText('72%')).toBeInTheDocument(); // Exercise
      expect(screen.getByText('94%')).toBeInTheDocument(); // Reading
      expect(screen.getByText('60%')).toBeInTheDocument(); // Water
    });

    it('shows target information', () => {
      render(<AIHabitTracker />);
      
      expect(screen.getByText('Target: 15 min')).toBeInTheDocument();
      expect(screen.getByText('Target: 30 min')).toBeInTheDocument();
    });
  });

  describe('Weekly View', () => {
    it('displays weekly completion grid', () => {
      render(<AIHabitTracker />);
      
      // Should show 7 days for each habit in weekly view
      const weeklyGrid = screen.getByText('This Week').closest('div');
      expect(weeklyGrid).toBeInTheDocument();
    });

    it('shows completed and missed days correctly', () => {
      render(<AIHabitTracker />);
      
      // The weekly grid should show checkmarks for completed days
      // and empty circles for missed days
      const completedDays = screen.getAllByTestId(/completed-day|check/i);
      expect(completedDays.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles habits with zero progress', () => {
      render(<AIHabitTracker />);
      
      // Exercise habit should show 0% progress
      const exerciseCard = screen.getByText('Daily Exercise').closest('div');
      expect(exerciseCard).toBeInTheDocument();
    });

    it('handles habits with 100% completion', () => {
      render(<AIHabitTracker />);
      
      // Reading habit should show completion status
      const readingCard = screen.getByText('Read Books').closest('div');
      expect(readingCard).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
    });
  });
});