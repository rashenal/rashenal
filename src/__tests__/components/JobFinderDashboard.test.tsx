import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@tests/helpers/test-utils';
import JobFinderDashboard from '../../components/JobFinderDashboard';
import { mockJobMatches, mockUser } from '@tests/helpers/mock-data';

// Mock the job finder service
const mockJobFinderService = {
  testConnection: vi.fn(() => Promise.resolve({ success: true, userId: 'test-user' })),
  getDashboardStats: vi.fn(() => Promise.resolve({
    totalProfiles: 2,
    activeSearches: 3,
    totalMatches: 15,
    savedMatches: 8,
    totalApplications: 5,
    pendingApplications: 2,
    avgMatchScore: 85
  })),
  getMatches: vi.fn(() => Promise.resolve(mockJobMatches))
};

vi.mock('../../lib/job-finder-service', () => ({
  JobFinderService: mockJobFinderService
}));

// Mock the settings
vi.mock('../../components/shared/SettingsModal', () => ({
  getLocalSettings: () => ({
    showCompany: true,
    showSalary: true,
    showLocation: true,
    showMatchScore: true,
    showDatePosted: true,
    defaultSortOrder: 'match_score',
    minMatchScore: 70
  })
}));

// Mock sub-components
vi.mock('../../components/JobProfileManager', () => ({
  default: () => <div data-testid="job-profile-manager">Job Profile Manager</div>
}));

vi.mock('../../components/JobSearchCreator', () => ({
  default: () => <div data-testid="job-search-creator">Job Search Creator</div>
}));

vi.mock('../../components/JobDiscoveryFeed', () => ({
  default: () => <div data-testid="job-discovery-feed">Job Discovery Feed</div>
}));

vi.mock('../../components/JobApplicationTracker', () => ({
  default: () => <div data-testid="job-application-tracker">Job Application Tracker</div>
}));

vi.mock('../../components/SearchMonitorDashboard', () => ({
  default: () => <div data-testid="search-monitor-dashboard">Search Monitor Dashboard</div>
}));

vi.mock('../../components/LinkedInScrapingSettings', () => ({
  default: () => <div data-testid="linkedin-settings">LinkedIn Settings</div>
}));

vi.mock('../../components/settings/JobFinderSettings', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="job-finder-settings">
        <button onClick={onClose}>Close Job Finder Settings</button>
      </div>
    ) : null,
  defaultJobFinderSettings: {
    showCompany: true,
    showSalary: true,
    showLocation: true,
    showMatchScore: true,
    showDatePosted: true,
    showJobType: true,
    defaultSortOrder: 'match_score',
    minMatchScore: 70,
    enableAutoRefresh: true,
    refreshInterval: 60,
    enableNotifications: true,
    exportFormat: 'json'
  }
}));

describe('JobFinderDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  it('displays dashboard stats correctly', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total profiles
      expect(screen.getByText('3')).toBeInTheDocument(); // Active searches  
      expect(screen.getByText('15')).toBeInTheDocument(); // Total matches
    });
  });

  it('switches between tabs correctly', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      // Switch to profiles tab
      fireEvent.click(screen.getByText('Profiles'));
      expect(screen.getByTestId('job-profile-manager')).toBeInTheDocument();
      
      // Switch to searches tab
      fireEvent.click(screen.getByText('Searches'));
      expect(screen.getByTestId('job-search-creator')).toBeInTheDocument();
      
      // Switch to feed tab
      fireEvent.click(screen.getByText('Feed'));
      expect(screen.getByTestId('job-discovery-feed')).toBeInTheDocument();
    });
  });

  it('displays job matches in overview', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      // Should be in overview by default and show recent matches
      expect(mockJobFinderService.getMatches).toHaveBeenCalled();
    });
  });

  it('handles loading states', async () => {
    // Mock slow loading
    mockJobFinderService.testConnection.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, userId: 'test-user' }), 1000))
    );
    
    render(<JobFinderDashboard />);
    
    // Should show loading state initially
    expect(screen.getByText(/loading/i) || screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('handles connection errors', async () => {
    mockJobFinderService.testConnection.mockResolvedValue({ 
      success: false, 
      error: 'Database connection failed' 
    });
    
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
    });
  });

  it('opens settings when settings tab is clicked', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Settings'));
      expect(screen.getByTestId('linkedin-settings')).toBeInTheDocument();
    });
  });

  it('opens job finder settings modal', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      // Switch to settings tab first
      fireEvent.click(screen.getByText('Settings'));
      
      // Find and click the configure button for Job Finder settings
      const configureButton = screen.getByText('Configure');
      fireEvent.click(configureButton);
      
      expect(screen.getByTestId('job-finder-settings')).toBeInTheDocument();
    });
  });

  it('closes settings modal correctly', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      // Open settings
      fireEvent.click(screen.getByText('Settings'));
      const configureButton = screen.getByText('Configure');
      fireEvent.click(configureButton);
      
      expect(screen.getByTestId('job-finder-settings')).toBeInTheDocument();
      
      // Close settings
      const closeButton = screen.getByText('Close Job Finder Settings');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('job-finder-settings')).not.toBeInTheDocument();
    });
  });

  describe('Applications Tab', () => {
    it('displays application tracker when applications tab is selected', async () => {
      render(<JobFinderDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Applications'));
        expect(screen.getByTestId('job-application-tracker')).toBeInTheDocument();
      });
    });
  });

  describe('Monitor Tab', () => {
    it('displays search monitor when monitor tab is selected', async () => {
      render(<JobFinderDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Monitor'));
        expect(screen.getByTestId('search-monitor-dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error messages when API calls fail', async () => {
      mockJobFinderService.getDashboardStats.mockRejectedValue(new Error('API Error'));
      
      render(<JobFinderDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    it('recovers from errors when retrying', async () => {
      // First call fails, second succeeds
      mockJobFinderService.testConnection
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue({ success: true, userId: 'test-user' });
      
      render(<JobFinderDashboard />);
      
      await waitFor(() => {
        // Should eventually show content after retry
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Integration', () => {
    it('applies settings to job display', async () => {
      render(<JobFinderDashboard />);
      
      await waitFor(() => {
        // Settings should affect how job matches are displayed
        // This would be tested through the actual job match components
        expect(mockJobFinderService.getMatches).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            minScore: expect.any(Number)
          })
        );
      });
    });
  });
});

describe('JobFinderDashboard Integration', () => {
  it('integrates with all major components', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      // Test that all tabs can be navigated
      const tabs = ['Overview', 'Profiles', 'Searches', 'Feed', 'Applications', 'Monitor', 'Settings'];
      
      tabs.forEach(tab => {
        expect(screen.getByText(tab)).toBeInTheDocument();
      });
    });
  });

  it('maintains state between tab switches', async () => {
    render(<JobFinderDashboard />);
    
    await waitFor(() => {
      // Switch tabs and verify state is maintained
      fireEvent.click(screen.getByText('Profiles'));
      fireEvent.click(screen.getByText('Overview'));
      
      // Dashboard stats should still be visible
      expect(screen.getByText('2')).toBeInTheDocument(); // Total profiles from stats
    });
  });
});