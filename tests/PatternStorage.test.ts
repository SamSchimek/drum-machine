import { describe, it, expect, beforeEach } from 'vitest';
import { PatternStorage } from '../src/storage/PatternStorage';
import { createEmptyGrid } from '../src/types';

describe('PatternStorage', () => {
  let storage: PatternStorage;
  const grid = createEmptyGrid();

  beforeEach(() => {
    localStorage.clear();
    storage = new PatternStorage();
  });

  it('saves and loads pattern correctly', () => {
    const saved = storage.savePattern({ name: 'Test', grid, tempo: 120 });

    expect(saved.id).toBeDefined();
    expect(saved.name).toBe('Test');
    expect(saved.tempo).toBe(120);
    expect(saved.createdAt).toBeDefined();

    const loaded = storage.loadPattern(saved.id);
    expect(loaded).toEqual(saved);
  });

  it('returns null for non-existent pattern', () => {
    const loaded = storage.loadPattern('non-existent-id');
    expect(loaded).toBeNull();
  });

  it('gets all patterns', () => {
    storage.savePattern({ name: 'Pattern 1', grid, tempo: 120 });
    storage.savePattern({ name: 'Pattern 2', grid, tempo: 140 });
    storage.savePattern({ name: 'Pattern 3', grid, tempo: 100 });

    const patterns = storage.getAllPatterns();
    expect(patterns.length).toBe(3);
  });

  it('deletes pattern', () => {
    const saved = storage.savePattern({ name: 'Test', grid, tempo: 120 });

    expect(storage.deletePattern(saved.id)).toBe(true);
    expect(storage.loadPattern(saved.id)).toBeNull();
    expect(storage.deletePattern(saved.id)).toBe(false);
  });

  it('updates pattern', () => {
    const saved = storage.savePattern({ name: 'Test', grid, tempo: 120 });

    const updated = storage.updatePattern(saved.id, { name: 'Updated', tempo: 150 });

    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('Updated');
    expect(updated!.tempo).toBe(150);
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(saved.updatedAt);
  });

  it('clears all patterns', () => {
    storage.savePattern({ name: 'Pattern 1', grid, tempo: 120 });
    storage.savePattern({ name: 'Pattern 2', grid, tempo: 140 });

    storage.clearAll();

    expect(storage.getAllPatterns().length).toBe(0);
  });

  it('preserves grid data correctly', () => {
    const testGrid = createEmptyGrid();
    testGrid.kick[0] = true;
    testGrid.kick[4] = true;
    testGrid.snare[4] = true;
    testGrid.snare[12] = true;

    const saved = storage.savePattern({ name: 'Test', grid: testGrid, tempo: 120 });
    const loaded = storage.loadPattern(saved.id);

    expect(loaded!.grid.kick[0]).toBe(true);
    expect(loaded!.grid.kick[4]).toBe(true);
    expect(loaded!.grid.kick[8]).toBe(false);
    expect(loaded!.grid.snare[4]).toBe(true);
    expect(loaded!.grid.snare[12]).toBe(true);
  });
});
