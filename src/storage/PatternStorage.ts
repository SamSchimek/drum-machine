import type { Pattern, GridState, PatternStorageInterface } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'drum-machine-patterns';

export class PatternStorage implements PatternStorageInterface {
  private getPatterns(): Pattern[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setPatterns(patterns: Pattern[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  }

  savePattern(patternData: { name: string; grid: GridState; tempo: number }): Pattern {
    const patterns = this.getPatterns();
    const now = Date.now();

    const pattern: Pattern = {
      id: uuidv4(),
      name: patternData.name,
      grid: patternData.grid,
      tempo: patternData.tempo,
      createdAt: now,
      updatedAt: now,
    };

    patterns.push(pattern);
    this.setPatterns(patterns);

    return pattern;
  }

  loadPattern(id: string): Pattern | null {
    const patterns = this.getPatterns();
    return patterns.find((p) => p.id === id) ?? null;
  }

  getAllPatterns(): Pattern[] {
    return this.getPatterns();
  }

  deletePattern(id: string): boolean {
    const patterns = this.getPatterns();
    const index = patterns.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    patterns.splice(index, 1);
    this.setPatterns(patterns);
    return true;
  }

  updatePattern(
    id: string,
    updates: Partial<Omit<Pattern, 'id' | 'createdAt'>>
  ): Pattern | null {
    const patterns = this.getPatterns();
    const index = patterns.findIndex((p) => p.id === id);

    if (index === -1) {
      return null;
    }

    patterns[index] = {
      ...patterns[index],
      ...updates,
      updatedAt: Date.now(),
    };

    this.setPatterns(patterns);
    return patterns[index];
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Singleton instance
export const patternStorage = new PatternStorage();
