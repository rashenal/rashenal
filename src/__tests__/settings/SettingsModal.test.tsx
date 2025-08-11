import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@tests/helpers/test-utils';
import SettingsModal, { SettingsSection, SettingsItem, ToggleSwitch } from '../../components/shared/SettingsModal';
import { mockSettings } from '@tests/helpers/mock-data';

describe('SettingsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  
  const mockTabs = [
    { id: 'general', label: 'General' },
    { id: 'advanced', label: 'Advanced' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders when open', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Settings"
        tabs={mockTabs}
        onSave={mockOnSave}
        settings={mockSettings.smartTasks}
        sectionId="test"
      >
        <div>Test content</div>
      </SettingsModal>
    );

    expect(screen.getByText('Test Settings Settings')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <SettingsModal
        isOpen={false}
        onClose={mockOnClose}
        title="Test Settings"
        tabs={mockTabs}
        onSave={mockOnSave}
        settings={mockSettings.smartTasks}
        sectionId="test"
      >
        <div>Test content</div>
      </SettingsModal>
    );

    expect(screen.queryByText('Test Settings Settings')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Settings"
        tabs={mockTabs}
        onSave={mockOnSave}
        settings={mockSettings.smartTasks}
        sectionId="test"
      >
        <div>Test content</div>
      </SettingsModal>
    );

    const closeButton = screen.getByLabelText('Close settings');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('switches between tabs', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Settings"
        tabs={mockTabs}
        onSave={mockOnSave}
        settings={mockSettings.smartTasks}
        sectionId="test"
      >
        <SettingsSection tabId="general">General Content</SettingsSection>
        <SettingsSection tabId="advanced">Advanced Content</SettingsSection>
      </SettingsModal>
    );

    // Should show first tab by default
    expect(screen.getByText('General Content')).toBeInTheDocument();

    // Click advanced tab
    fireEvent.click(screen.getByText('Advanced'));
    expect(screen.getByText('Advanced Content')).toBeInTheDocument();
  });

  it('saves settings and calls onSave', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Settings"
        tabs={mockTabs}
        onSave={mockOnSave}
        settings={mockSettings.smartTasks}
        sectionId="test"
      >
        <div>Test content</div>
      </SettingsModal>
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(mockSettings.smartTasks);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('persists settings to localStorage on save', async () => {
    const mockSetItem = vi.fn();
    (window.localStorage.setItem as any) = mockSetItem;

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Settings"
        tabs={mockTabs}
        onSave={mockOnSave}
        settings={mockSettings.smartTasks}
        sectionId="test"
      >
        <div>Test content</div>
      </SettingsModal>
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(
        'settings_test',
        JSON.stringify(mockSettings.smartTasks)
      );
    });
  });
});

describe('SettingsSection', () => {
  it('renders section with title', () => {
    render(
      <SettingsSection title="Test Section">
        <div>Section content</div>
      </SettingsSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('renders without title', () => {
    render(
      <SettingsSection>
        <div>Section content</div>
      </SettingsSection>
    );

    expect(screen.getByText('Section content')).toBeInTheDocument();
  });
});

describe('SettingsItem', () => {
  it('renders with label and description', () => {
    render(
      <SettingsItem
        label="Test Setting"
        description="This is a test setting"
      >
        <input type="text" />
      </SettingsItem>
    );

    expect(screen.getByText('Test Setting')).toBeInTheDocument();
    expect(screen.getByText('This is a test setting')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders without description', () => {
    render(
      <SettingsItem label="Test Setting">
        <input type="text" />
      </SettingsItem>
    );

    expect(screen.getByText('Test Setting')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

describe('ToggleSwitch', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checked state correctly', () => {
    render(<ToggleSwitch checked={true} onChange={mockOnChange} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders unchecked state correctly', () => {
    render(<ToggleSwitch checked={false} onChange={mockOnChange} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when clicked', () => {
    render(<ToggleSwitch checked={false} onChange={mockOnChange} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    render(<ToggleSwitch checked={false} onChange={mockOnChange} disabled={true} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('applies disabled styles when disabled', () => {
    render(<ToggleSwitch checked={false} onChange={mockOnChange} disabled={true} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('opacity-50', 'cursor-not-allowed');
  });
});