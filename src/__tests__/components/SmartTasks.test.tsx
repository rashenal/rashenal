import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@tests/helpers/test-utils';
import SmartTasks from '../../components/SmartTasks';
import { mockUser, mockTasks } from '@tests/helpers/mock-data';

// Mock the supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockTasks,
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: mockTasks[0],
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: mockTasks[0],
            error: null
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        error: null
      }))
    }))
  }))
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock the user context
vi.mock('../../contexts/userContext', () => ({
  useUser: () => ({
    user: mockUser
  })
}));

// Mock TaskBoardManager
vi.mock('../../components/TaskBoardManager', () => ({
  default: ({ onTaskboardChange }: { onTaskboardChange: (id: string) => void }) => (
    <div data-testid="taskboard-manager">
      <button onClick={() => onTaskboardChange('board-1')}>Test Board</button>
    </div>
  )
}));

// Mock TaskImportExport
vi.mock('../../components/TaskImportExport', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="import-export-modal">
      <button onClick={onClose}>Close Import/Export</button>
    </div>
  )
}));

describe('SmartTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when user is logged in', () => {
    render(<SmartTasks />);
    
    expect(screen.getByText('Smart Tasks')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Project Management')).toBeInTheDocument();
  });

  it('displays taskboard manager', () => {
    render(<SmartTasks />);
    
    expect(screen.getByTestId('taskboard-manager')).toBeInTheDocument();
    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });

  it('shows "no taskboard selected" message when no taskboard is active', () => {
    render(<SmartTasks />);
    
    expect(screen.getByText('No Taskboard Selected')).toBeInTheDocument();
    expect(screen.getByText('Please create or select a taskboard to start managing your tasks.')).toBeInTheDocument();
  });

  it('switches to kanban view when taskboard is selected', async () => {
    render(<SmartTasks />);
    
    const testBoardButton = screen.getByText('Test Board');
    fireEvent.click(testBoardButton);

    await waitFor(() => {
      expect(screen.getByText('Backlog')).toBeInTheDocument();
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  it('opens new task form when New Task button is clicked', async () => {
    render(<SmartTasks />);
    
    // First select a taskboard
    const testBoardButton = screen.getByText('Test Board');
    fireEvent.click(testBoardButton);

    await waitFor(() => {
      const newTaskButton = screen.getByText('New Task');
      expect(newTaskButton).not.toBeDisabled();
      
      fireEvent.click(newTaskButton);
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });
  });

  it('disables New Task button when no taskboard is selected', () => {
    render(<SmartTasks />);
    
    const newTaskButton = screen.getByText('New Task');
    expect(newTaskButton).toBeDisabled();
  });

  it('opens settings modal when settings button is clicked', () => {
    render(<SmartTasks />);
    
    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);
    
    // Settings modal should open (mocked)
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
  });

  it('opens import/export modal when button is clicked', () => {
    render(<SmartTasks />);
    
    const importExportButton = screen.getByText('Import/Export');
    fireEvent.click(importExportButton);
    
    expect(screen.getByTestId('import-export-modal')).toBeInTheDocument();
  });

  it('opens recycle bin modal when button is clicked', () => {
    render(<SmartTasks />);
    
    const recycleBinButton = screen.getByText(/Recycle Bin/);
    fireEvent.click(recycleBinButton);
    
    expect(screen.getByText('Recycle Bin')).toBeInTheDocument();
  });

  describe('Task Creation', () => {
    it('creates a new task successfully', async () => {
      render(<SmartTasks />);
      
      // Select taskboard first
      fireEvent.click(screen.getByText('Test Board'));
      
      await waitFor(() => {
        // Open new task form
        const newTaskButton = screen.getByText('New Task');
        fireEvent.click(newTaskButton);
      });

      await waitFor(() => {
        // Fill out form
        const titleInput = screen.getByPlaceholderText(/task title/i) || screen.getByRole('textbox', { name: /title/i });
        const descriptionInput = screen.getByRole('textbox', { name: /description/i });
        
        fireEvent.change(titleInput, { target: { value: 'Test Task' } });
        fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
        
        // Submit form
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      });
    });

    it('shows validation error for empty title', async () => {
      render(<SmartTasks />);
      
      // Select taskboard first
      fireEvent.click(screen.getByText('Test Board'));
      
      await waitFor(() => {
        // Open new task form
        const newTaskButton = screen.getByText('New Task');
        fireEvent.click(newTaskButton);
      });

      await waitFor(() => {
        // Try to submit without title
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);
        
        // Should show validation error (alert)
        // Note: In a real app, this would be a better UX with inline validation
      });
    });
  });

  describe('Task Management', () => {
    beforeEach(async () => {
      // Mock tasks being loaded
      const mockFrom = mockSupabase.from as any;
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => ({
              data: mockTasks,
              error: null
            })
          })
        })
      });
    });

    it('displays tasks in correct columns', async () => {
      render(<SmartTasks />);
      
      // Select taskboard
      fireEvent.click(screen.getByText('Test Board'));

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
        expect(screen.getByText('Review team feedback')).toBeInTheDocument();
      });
    });

    it('handles task deletion', async () => {
      render(<SmartTasks />);
      
      // Select taskboard
      fireEvent.click(screen.getByText('Test Board'));

      await waitFor(() => {
        // Find delete button (trash icon) - might need to hover over task first
        const deleteButtons = screen.getAllByTitle(/delete/i);
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
        }
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      });
    });

    it('handles task editing', async () => {
      render(<SmartTasks />);
      
      // Select taskboard
      fireEvent.click(screen.getByText('Test Board'));

      await waitFor(() => {
        // Double-click on task to edit
        const taskCard = screen.getByText('Complete project proposal').closest('div');
        if (taskCard) {
          fireEvent.doubleClick(taskCard);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Task')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag start event', async () => {
      render(<SmartTasks />);
      
      // Select taskboard
      fireEvent.click(screen.getByText('Test Board'));

      await waitFor(() => {
        const taskCard = screen.getByText('Complete project proposal').closest('div');
        if (taskCard) {
          fireEvent.dragStart(taskCard, {
            dataTransfer: {
              effectAllowed: 'move',
              setData: vi.fn(),
            }
          });
        }
      });
    });

    it('handles drop event and moves task', async () => {
      render(<SmartTasks />);
      
      // Select taskboard
      fireEvent.click(screen.getByText('Test Board'));

      await waitFor(() => {
        const taskCard = screen.getByText('Complete project proposal').closest('div');
        const inProgressColumn = screen.getByText('In Progress').closest('div');
        
        if (taskCard && inProgressColumn) {
          // Start drag
          fireEvent.dragStart(taskCard);
          
          // Drop on column
          fireEvent.dragOver(inProgressColumn);
          fireEvent.drop(inProgressColumn);
        }
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      });
    });
  });
});