import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseStorage } from '../../src/storage/SupabaseStorage';
import { supabase } from '../../src/lib/supabase';
import type { GridState } from '../../src/types';
import type { SupabasePatternRow } from '../../src/storage/types';

// Get the mocked supabase
const mockSupabase = vi.mocked(supabase);

// Helper to create a mock grid
function createMockGrid(): GridState {
  return {
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    closedHH: new Array(16).fill(false),
    openHH: new Array(16).fill(false),
    clap: new Array(16).fill(false),
    tomLow: new Array(16).fill(false),
    tomMid: new Array(16).fill(false),
    tomHigh: new Array(16).fill(false),
    rimshot: new Array(16).fill(false),
    cowbell: new Array(16).fill(false),
    clave: new Array(16).fill(false),
    maracas: new Array(16).fill(false),
  };
}

// Helper to create a mock Supabase row
function createMockSupabaseRow(overrides: Partial<SupabasePatternRow> = {}): SupabasePatternRow {
  return {
    id: 'test-pattern-id',
    user_id: 'test-user-id',
    name: 'Test Pattern',
    grid: createMockGrid(),
    tempo: 120,
    is_public: false,
    share_slug: null,
    created_at: '2024-01-15T10:30:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z',
    ...overrides,
  };
}

describe('SupabaseStorage', () => {
  let storage: SupabaseStorage;
  const userId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new SupabaseStorage(userId);

    // Reset query builder mocks
    const queryBuilder = (mockSupabase as { _queryBuilder: ReturnType<typeof vi.fn> })._queryBuilder;
    queryBuilder.select.mockReturnThis();
    queryBuilder.insert.mockReturnThis();
    queryBuilder.update.mockReturnThis();
    queryBuilder.delete.mockReturnThis();
    queryBuilder.eq.mockReturnThis();
    queryBuilder.neq.mockReturnThis();
    queryBuilder.or.mockReturnThis();
    queryBuilder.order.mockReturnThis();
    queryBuilder.limit.mockReturnThis();
    queryBuilder.single.mockResolvedValue({ data: null, error: null });
    queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('savePattern', () => {
    it('creates a new pattern record in Supabase', async () => {
      const mockRow = createMockSupabaseRow();
      const queryBuilder = (mockSupabase as { _queryBuilder: ReturnType<typeof vi.fn> })._queryBuilder;

      queryBuilder.single.mockResolvedValueOnce({
        data: mockRow,
        error: null,
      });

      const result = await storage.savePattern({
        name: 'Test Pattern',
        grid: createMockGrid(),
        tempo: 120,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('patterns');
      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          name: 'Test Pattern',
          tempo: 120,
        })
      );
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Pattern');
    });

    it('converts Supabase timestamp to number', async () => {
      const mockRow = createMockSupabaseRow({
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T11:45:00.000Z',
      });
      const queryBuilder = (mockSupabase as { _queryBuilder: ReturnType<typeof vi.fn> })._queryBuilder;

      queryBuilder.single.mockResolvedValueOnce({
        data: mockRow,
        error: null,
      });

      const result = await storage.savePattern({
        name: 'Test Pattern',
        grid: createMockGrid(),
        tempo: 120,
      });

      expect(typeof result.createdAt).toBe('number');
      expect(typeof result.updatedAt).toBe('number');
      expect(result.createdAt).toBe(new Date('2024-01-15T10:30:00.000Z').getTime());
      expect(result.updatedAt).toBe(new Date('2024-01-15T11:45:00.000Z').getTime());
    });

    it('throws error on Supabase failure', async () => {
      const queryBuilder = (mockSupabase as { _queryBuilder: ReturnType<typeof vi.fn> })._queryBuilder;

      queryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(storage.savePattern({
        name: 'Test Pattern',
        grid: createMockGrid(),
        tempo: 120,
      })).rejects.toThrow('Database error');
    });
  });

  describe('loadPattern', () => {
    it('fetches pattern by ID', async () => {
      const mockRow = createMockSupabaseRow();
      const queryBuilder = (mockSupabase as { _queryBuilder: ReturnType<typeof vi.fn> })._queryBuilder;

      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: mockRow,
        error: null,
      });

      const result = await storage.loadPattern('test-pattern-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('patterns');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'test-pattern-id');
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-pattern-id');
    });

    it('returns null for non-existent pattern', async () => {
      const queryBuilder = (mockSupabase as { _queryBuilder: ReturnType<typeof vi.fn> })._queryBuilder;

      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await storage.loadPattern('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllPatterns', () => {
    it('returns all patterns for user ordered by updated_at desc', async () => {
      const mockRows = [
        createMockSupabaseRow({ id: 'pattern-1', name: 'Pattern 1' }),
        createMockSupabaseRow({ id: 'pattern-2', name: 'Pattern 2' }),
      ];

      // Mock the thenable behavior for getAllPatterns
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRows,
              error: null,
            }),
          }),
        }),
      } as never);

      const results = await storage.getAllPatterns();

      expect(mockSupabase.from).toHaveBeenCalledWith('patterns');
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Pattern 1');
      expect(results[1].name).toBe('Pattern 2');
    });

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Network error' },
            }),
          }),
        }),
      } as never);

      const results = await storage.getAllPatterns();

      expect(results).toEqual([]);
    });
  });

  describe('deletePattern', () => {
    it('deletes pattern by ID', async () => {
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as never);

      const result = await storage.deletePattern('test-pattern-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('patterns');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      } as never);

      const result = await storage.deletePattern('test-pattern-id');

      expect(result).toBe(false);
    });
  });

  describe('updatePattern', () => {
    it('updates pattern fields', async () => {
      const mockRow = createMockSupabaseRow({ name: 'Updated Name' });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRow,
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      const result = await storage.updatePattern('test-pattern-id', { name: 'Updated Name' });

      expect(mockSupabase.from).toHaveBeenCalledWith('patterns');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
    });

    it('returns null on error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          }),
        }),
      } as never);

      const result = await storage.updatePattern('test-pattern-id', { name: 'Updated Name' });

      expect(result).toBeNull();
    });
  });

  describe('makePublic', () => {
    it('generates share_slug and sets is_public to true', async () => {
      const mockRow = createMockSupabaseRow({
        is_public: true,
        share_slug: 'abc123xyz',
      });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRow,
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      const result = await storage.makePublic('test-pattern-id');

      expect(result).toBe('abc123xyz');
    });

    it('retries with new slug on collision', async () => {
      const mockRow = createMockSupabaseRow({
        is_public: true,
        share_slug: 'newslug123',
      });

      // First call fails with unique constraint violation
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key' },
              }),
            }),
          }),
        }),
      } as never);

      // Second call succeeds
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRow,
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      const result = await storage.makePublic('test-pattern-id');

      expect(result).toBe('newslug123');
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });

    it('returns null on non-collision error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Some other error' },
              }),
            }),
          }),
        }),
      } as never);

      const result = await storage.makePublic('test-pattern-id');

      expect(result).toBeNull();
    });
  });

  describe('makePrivate', () => {
    it('clears share_slug and sets is_public to false', async () => {
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as never);

      const result = await storage.makePrivate('test-pattern-id');

      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      } as never);

      const result = await storage.makePrivate('test-pattern-id');

      expect(result).toBe(false);
    });
  });

  describe('getByShareSlug', () => {
    it('fetches public pattern by share_slug', async () => {
      const mockRow = createMockSupabaseRow({
        is_public: true,
        share_slug: 'abc123xyz',
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockRow,
              error: null,
            }),
          }),
        }),
      } as never);

      const result = await storage.getByShareSlug('abc123xyz');

      expect(mockSupabase.from).toHaveBeenCalledWith('patterns');
      expect(result).toBeDefined();
      expect(result?.shareSlug).toBe('abc123xyz');
    });

    it('returns null for non-existent slug', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as never);

      const result = await storage.getByShareSlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('timestamp conversion', () => {
    it('correctly converts ISO string timestamps to milliseconds', async () => {
      const isoDate = '2024-06-15T14:30:45.123Z';
      const expectedMs = new Date(isoDate).getTime();

      const mockRow = createMockSupabaseRow({
        created_at: isoDate,
        updated_at: isoDate,
      });
      const queryBuilder = (mockSupabase as { _queryBuilder: ReturnType<typeof vi.fn> })._queryBuilder;

      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: mockRow,
        error: null,
      });

      const result = await storage.loadPattern('test-pattern-id');

      expect(result?.createdAt).toBe(expectedMs);
      expect(result?.updatedAt).toBe(expectedMs);
    });
  });
});
