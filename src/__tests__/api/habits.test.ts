import { describe, it, expect, vi } from 'vitest';
import HabitsAPI from '../../api/v1/habits';

// Mock Request and Response
const mockReq = {
  user: { id: 'test-user-id' },
  params: {},
  query: {},
  body: {}
} as any;

const mockRes = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis()
} as any;

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(() => ({ data: { id: 'test-habit' }, error: null })),
      then: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

describe('HabitsAPI', () => {
  it('should handle getAllHabits request', async () => {
    await HabitsAPI.getAllHabits(mockReq, mockRes);
    
    expect(mockRes.json).toHaveBeenCalled();
  }, 10000); // Increased timeout

  it('should require user authentication', async () => {
    const unauthenticatedReq = { ...mockReq, user: undefined };
    await HabitsAPI.getAllHabits(unauthenticatedReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should validate API structure exists', () => {
    expect(typeof HabitsAPI.getAllHabits).toBe('function');
    expect(typeof HabitsAPI.createHabit).toBe('function');
    expect(typeof HabitsAPI.updateHabit).toBe('function');
    expect(typeof HabitsAPI.deleteHabit).toBe('function');
  });
});