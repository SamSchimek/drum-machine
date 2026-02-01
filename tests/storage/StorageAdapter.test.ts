import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageAdapter } from '../../src/storage/StorageAdapter';
import { PatternStorage } from '../../src/storage/PatternStorage';
import { SupabaseStorage } from '../../src/storage/SupabaseStorage';
import type { Pattern, GridState } from '../../src/types';

// Mock the storage modules
vi.mock('../../src/storage/PatternStorage');
vi.mock('../../src/storage/SupabaseStorage');

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

// Helper to create a mock pattern
function createMockPattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: 'test-pattern-id',
    name: 'Test Pattern',
    grid: createMockGrid(),
    tempo: 120,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('StorageAdapter', () => {
  let mockLocalStorage: PatternStorage;
  let mockSupabaseStorage: SupabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock instances
    mockLocalStorage = new PatternStorage();
    mockSupabaseStorage = new SupabaseStorage('test-user-id');

    // Reset mock implementations
    vi.mocked(mockLocalStorage.savePattern).mockReturnValue(createMockPattern());
    vi.mocked(mockLocalStorage.loadPattern).mockReturnValue(createMockPattern());
    vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue([createMockPattern()]);
    vi.mocked(mockLocalStorage.deletePattern).mockReturnValue(true);
    vi.mocked(mockLocalStorage.updatePattern).mockReturnValue(createMockPattern());

    vi.mocked(mockSupabaseStorage.savePattern).mockResolvedValue(createMockPattern());
    vi.mocked(mockSupabaseStorage.loadPattern).mockResolvedValue(createMockPattern());
    vi.mocked(mockSupabaseStorage.getAllPatterns).mockResolvedValue([createMockPattern()]);
    vi.mocked(mockSupabaseStorage.deletePattern).mockResolvedValue(true);
    vi.mocked(mockSupabaseStorage.updatePattern).mockResolvedValue(createMockPattern());
  });

  describe('when not authenticated', () => {
    it('uses localStorage for savePattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, null);
      const pattern = createMockPattern();

      await adapter.savePattern({ name: pattern.name, grid: pattern.grid, tempo: pattern.tempo });

      expect(mockLocalStorage.savePattern).toHaveBeenCalled();
    });

    it('uses localStorage for loadPattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, null);

      await adapter.loadPattern('test-id');

      expect(mockLocalStorage.loadPattern).toHaveBeenCalledWith('test-id');
    });

    it('uses localStorage for getAllPatterns', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, null);

      await adapter.getAllPatterns();

      expect(mockLocalStorage.getAllPatterns).toHaveBeenCalled();
    });

    it('uses localStorage for deletePattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, null);

      await adapter.deletePattern('test-id');

      expect(mockLocalStorage.deletePattern).toHaveBeenCalledWith('test-id');
    });

    it('uses localStorage for updatePattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, null);

      await adapter.updatePattern('test-id', { name: 'Updated' });

      expect(mockLocalStorage.updatePattern).toHaveBeenCalledWith('test-id', { name: 'Updated' });
    });
  });

  describe('when authenticated', () => {
    it('uses Supabase for savePattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);
      const pattern = createMockPattern();

      await adapter.savePattern({ name: pattern.name, grid: pattern.grid, tempo: pattern.tempo });

      expect(mockSupabaseStorage.savePattern).toHaveBeenCalled();
      expect(mockLocalStorage.savePattern).not.toHaveBeenCalled();
    });

    it('uses Supabase for loadPattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);

      await adapter.loadPattern('test-id');

      expect(mockSupabaseStorage.loadPattern).toHaveBeenCalledWith('test-id');
      expect(mockLocalStorage.loadPattern).not.toHaveBeenCalled();
    });

    it('uses Supabase for getAllPatterns', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);

      await adapter.getAllPatterns();

      expect(mockSupabaseStorage.getAllPatterns).toHaveBeenCalled();
      expect(mockLocalStorage.getAllPatterns).not.toHaveBeenCalled();
    });

    it('uses Supabase for deletePattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);

      await adapter.deletePattern('test-id');

      expect(mockSupabaseStorage.deletePattern).toHaveBeenCalledWith('test-id');
      expect(mockLocalStorage.deletePattern).not.toHaveBeenCalled();
    });

    it('uses Supabase for updatePattern', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);

      await adapter.updatePattern('test-id', { name: 'Updated' });

      expect(mockSupabaseStorage.updatePattern).toHaveBeenCalledWith('test-id', { name: 'Updated' });
      expect(mockLocalStorage.updatePattern).not.toHaveBeenCalled();
    });
  });

  describe('migrateToCloud', () => {
    it('uploads localStorage patterns to Supabase', async () => {
      const localPatterns = [
        createMockPattern({ id: 'local-1', name: 'Pattern 1' }),
        createMockPattern({ id: 'local-2', name: 'Pattern 2' }),
      ];

      vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue(localPatterns);
      vi.mocked(mockSupabaseStorage.getAllPatterns).mockResolvedValue([]);

      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);
      const result = await adapter.migrateToCloud();

      expect(mockSupabaseStorage.savePattern).toHaveBeenCalledTimes(2);
      expect(result.uploaded).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('skips patterns that already exist in cloud (by name + grid hash)', async () => {
      const existingPattern = createMockPattern({ id: 'cloud-1', name: 'Pattern 1' });
      const localPatterns = [
        createMockPattern({ id: 'local-1', name: 'Pattern 1' }), // Same name and grid
        createMockPattern({ id: 'local-2', name: 'Pattern 2' }),
      ];

      vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue(localPatterns);
      vi.mocked(mockSupabaseStorage.getAllPatterns).mockResolvedValue([existingPattern]);

      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);
      const result = await adapter.migrateToCloud();

      expect(mockSupabaseStorage.savePattern).toHaveBeenCalledTimes(1); // Only Pattern 2
      expect(result.uploaded).toHaveLength(1);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]).toBe('Pattern 1');
    });

    it('tracks failed uploads', async () => {
      const localPatterns = [
        createMockPattern({ id: 'local-1', name: 'Pattern 1' }),
        createMockPattern({ id: 'local-2', name: 'Pattern 2' }),
      ];

      vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue(localPatterns);
      vi.mocked(mockSupabaseStorage.getAllPatterns).mockResolvedValue([]);

      // First save succeeds, second fails
      vi.mocked(mockSupabaseStorage.savePattern)
        .mockResolvedValueOnce(createMockPattern())
        .mockRejectedValueOnce(new Error('Network error'));

      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);
      const result = await adapter.migrateToCloud();

      expect(result.uploaded).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].name).toBe('Pattern 2');
      expect(result.failed[0].error).toBe('Network error');
    });

    it('clears localStorage on successful full migration', async () => {
      const localPatterns = [createMockPattern({ id: 'local-1', name: 'Pattern 1' })];

      vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue(localPatterns);
      vi.mocked(mockSupabaseStorage.getAllPatterns).mockResolvedValue([]);
      vi.mocked(mockLocalStorage.clearAll).mockImplementation(() => {});

      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);
      const result = await adapter.migrateToCloud();

      expect(result.uploaded).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      expect(mockLocalStorage.clearAll).toHaveBeenCalled();
    });

    it('keeps localStorage on partial failure', async () => {
      const localPatterns = [
        createMockPattern({ id: 'local-1', name: 'Pattern 1' }),
        createMockPattern({ id: 'local-2', name: 'Pattern 2' }),
      ];

      vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue(localPatterns);
      vi.mocked(mockSupabaseStorage.getAllPatterns).mockResolvedValue([]);

      vi.mocked(mockSupabaseStorage.savePattern)
        .mockResolvedValueOnce(createMockPattern())
        .mockRejectedValueOnce(new Error('Network error'));

      vi.mocked(mockLocalStorage.clearAll).mockImplementation(() => {});

      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);
      await adapter.migrateToCloud();

      // Should NOT clear localStorage since one pattern failed
      expect(mockLocalStorage.clearAll).not.toHaveBeenCalled();
    });

    it('returns empty result when no supabase storage', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, null);
      const result = await adapter.migrateToCloud();

      expect(result.uploaded).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
    });
  });

  describe('hasLocalPatterns', () => {
    it('returns true when localStorage has patterns', () => {
      vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue([createMockPattern()]);

      const adapter = new StorageAdapter(mockLocalStorage, null);

      expect(adapter.hasLocalPatterns()).toBe(true);
    });

    it('returns false when localStorage is empty', () => {
      vi.mocked(mockLocalStorage.getAllPatterns).mockReturnValue([]);

      const adapter = new StorageAdapter(mockLocalStorage, null);

      expect(adapter.hasLocalPatterns()).toBe(false);
    });
  });

  describe('setSupabaseStorage', () => {
    it('switches to Supabase storage when set', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, null);

      // Initially uses localStorage
      await adapter.getAllPatterns();
      expect(mockLocalStorage.getAllPatterns).toHaveBeenCalled();

      vi.clearAllMocks();

      // Set Supabase storage
      adapter.setSupabaseStorage(mockSupabaseStorage);

      // Now uses Supabase
      await adapter.getAllPatterns();
      expect(mockSupabaseStorage.getAllPatterns).toHaveBeenCalled();
      expect(mockLocalStorage.getAllPatterns).not.toHaveBeenCalled();
    });

    it('reverts to localStorage when cleared', async () => {
      const adapter = new StorageAdapter(mockLocalStorage, mockSupabaseStorage);

      // Initially uses Supabase
      await adapter.getAllPatterns();
      expect(mockSupabaseStorage.getAllPatterns).toHaveBeenCalled();

      vi.clearAllMocks();

      // Clear Supabase storage
      adapter.setSupabaseStorage(null);

      // Now uses localStorage
      await adapter.getAllPatterns();
      expect(mockLocalStorage.getAllPatterns).toHaveBeenCalled();
      expect(mockSupabaseStorage.getAllPatterns).not.toHaveBeenCalled();
    });
  });
});
