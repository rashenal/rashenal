import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@tests/helpers/test-utils';
import SmartTasksSettings, { defaultSmartTasksSettings } from '../../components/settings/SmartTasksSettings';

describe('SmartTasksSettings', () => {
  const mockOnClose = vi.fn();
  const mockOnSettingsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders all tabs correctly', () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Behavior')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('loads default settings when localStorage is empty', () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Check that default settings are applied
    expect(screen.getByText('Show Title')).toBeInTheDocument();
    expect(screen.getByText('Show Description')).toBeInTheDocument();
  });

  it('applies display settings correctly', async () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Find the toggle for "Show Title" and toggle it
    const titleToggle = screen.getByLabelText(/Show Title/i);
    fireEvent.click(titleToggle);

    // Save the settings
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          showTitle: expect.any(Boolean)
        })
      );
    });
  });

  it('handles view settings correctly', async () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Switch to View tab
    fireEvent.click(screen.getByText('View'));

    // Find and change default view
    const viewSelect = screen.getByDisplayValue('Kanban Board');
    fireEvent.change(viewSelect, { target: { value: 'list' } });

    // Save the settings
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultView: 'list'
        })
      );
    });
  });

  it('handles behavior settings correctly', async () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Switch to Behavior tab
    fireEvent.click(screen.getByText('Behavior'));

    // Find autosave interval input
    const autosaveInput = screen.getByDisplayValue('30');
    fireEvent.change(autosaveInput, { target: { value: '60' } });

    // Save the settings
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          autosaveInterval: 60
        })
      );
    });
  });

  it('handles theme settings correctly', async () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Switch to Theme tab
    fireEvent.click(screen.getByText('Theme'));

    // Find and change card style
    const cardStyleSelect = screen.getByDisplayValue('Detailed');
    fireEvent.change(cardStyleSelect, { target: { value: 'minimal' } });

    // Save the settings
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cardStyle: 'minimal'
        })
      );
    });
  });

  it('resets settings correctly', async () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Make a change
    const titleToggle = screen.getByRole('switch', { name: /Show Title/i });
    fireEvent.click(titleToggle);

    // Reset settings
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    // The toggle should be back to its original state
    expect(titleToggle).toHaveAttribute('aria-checked', 'true'); // Default is true
  });

  it('cancels changes correctly', () => {
    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSettingsChange).not.toHaveBeenCalled();
  });

  it('persists settings to localStorage', async () => {
    const mockSetItem = vi.fn();
    (window.localStorage.setItem as any) = mockSetItem;

    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Save settings
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(
        'settings_smart-tasks',
        expect.any(String)
      );
    });
  });

  it('loads settings from localStorage', () => {
    const savedSettings = {
      ...defaultSmartTasksSettings,
      showTitle: false,
      defaultView: 'list'
    };

    (window.localStorage.getItem as any).mockReturnValue(
      JSON.stringify(savedSettings)
    );

    render(
      <SmartTasksSettings
        isOpen={true}
        onClose={mockOnClose}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Should load the saved setting
    const titleToggle = screen.getByRole('switch', { name: /Show Title/i });
    expect(titleToggle).toHaveAttribute('aria-checked', 'false');
  });
});