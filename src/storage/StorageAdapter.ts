import type { Pattern } from '../types';
import type { PatternStorage } from './PatternStorage';
import type { SupabaseStorage } from './SupabaseStorage';
import type { AsyncPatternStorageInterface, MigrationResult } from './types';

// Generate a hash for pattern deduplication
function getPatternHash(pattern: Pattern): string {
  return `${pattern.name}-${JSON.stringify(pattern.grid)}`;
}

// Check if an error is a network-related error
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('offline')
    );
  }
  return false;
}

export interface SaveResult {
  pattern: Pattern;
  savedToCloud: boolean;
  fallbackUsed: boolean;
}

export class StorageAdapter implements AsyncPatternStorageInterface {
  private localStorage: PatternStorage;
  private supabaseStorage: SupabaseStorage | null;
  private _lastFallbackError: string | null = null;

  constructor(localStorage: PatternStorage, supabaseStorage: SupabaseStorage | null) {
    this.localStorage = localStorage;
    this.supabaseStorage = supabaseStorage;
  }

  setSupabaseStorage(storage: SupabaseStorage | null): void {
    this.supabaseStorage = storage;
  }

  private isAuthenticated(): boolean {
    return this.supabaseStorage !== null;
  }

  // Get the last fallback error (for UI notification)
  get lastFallbackError(): string | null {
    return this._lastFallbackError;
  }

  clearFallbackError(): void {
    this._lastFallbackError = null;
  }

  async savePattern(patternData: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pattern> {
    this._lastFallbackError = null;

    if (this.isAuthenticated()) {
      try {
        return await this.supabaseStorage!.savePattern(patternData);
      } catch (error) {
        // On network error, fall back to localStorage
        if (isNetworkError(error)) {
          console.warn('Network error saving to cloud, falling back to localStorage:', error);
          this._lastFallbackError = "Couldn't connect to cloud. Pattern saved locally.";
          return this.localStorage.savePattern(patternData);
        }
        // Re-throw non-network errors
        throw error;
      }
    }
    return this.localStorage.savePattern(patternData);
  }

  // Extended save that returns more info about where it was saved
  async savePatternWithInfo(patternData: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<SaveResult> {
    this._lastFallbackError = null;

    if (this.isAuthenticated()) {
      try {
        const pattern = await this.supabaseStorage!.savePattern(patternData);
        return { pattern, savedToCloud: true, fallbackUsed: false };
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('Network error saving to cloud, falling back to localStorage:', error);
          this._lastFallbackError = "Couldn't connect to cloud. Pattern saved locally.";
          const pattern = this.localStorage.savePattern(patternData);
          return { pattern, savedToCloud: false, fallbackUsed: true };
        }
        throw error;
      }
    }

    const pattern = this.localStorage.savePattern(patternData);
    return { pattern, savedToCloud: false, fallbackUsed: false };
  }

  async loadPattern(id: string): Promise<Pattern | null> {
    if (this.isAuthenticated()) {
      try {
        return await this.supabaseStorage!.loadPattern(id);
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('Network error loading from cloud, trying localStorage:', error);
          // Try localStorage as fallback (pattern might have been saved during offline)
          return this.localStorage.loadPattern(id);
        }
        throw error;
      }
    }
    return this.localStorage.loadPattern(id);
  }

  async getAllPatterns(): Promise<Pattern[]> {
    if (this.isAuthenticated()) {
      try {
        return await this.supabaseStorage!.getAllPatterns();
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('Network error loading from cloud, falling back to localStorage:', error);
          this._lastFallbackError = "Couldn't connect to cloud. Showing local patterns.";
          return this.localStorage.getAllPatterns();
        }
        throw error;
      }
    }
    return this.localStorage.getAllPatterns();
  }

  async deletePattern(id: string): Promise<boolean> {
    if (this.isAuthenticated()) {
      try {
        return await this.supabaseStorage!.deletePattern(id);
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('Network error deleting from cloud:', error);
          this._lastFallbackError = "Couldn't connect to cloud. Please try again.";
          return false;
        }
        throw error;
      }
    }
    return this.localStorage.deletePattern(id);
  }

  async updatePattern(
    id: string,
    updates: Partial<Omit<Pattern, 'id' | 'createdAt'>>
  ): Promise<Pattern | null> {
    if (this.isAuthenticated()) {
      try {
        return await this.supabaseStorage!.updatePattern(id, updates);
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('Network error updating in cloud:', error);
          this._lastFallbackError = "Couldn't connect to cloud. Please try again.";
          return null;
        }
        throw error;
      }
    }
    return this.localStorage.updatePattern(id, updates);
  }

  hasLocalPatterns(): boolean {
    return this.localStorage.getAllPatterns().length > 0;
  }

  async migrateToCloud(): Promise<MigrationResult> {
    const result: MigrationResult = {
      uploaded: [],
      failed: [],
      skipped: [],
    };

    if (!this.supabaseStorage) {
      return result;
    }

    const localPatterns = this.localStorage.getAllPatterns();

    if (localPatterns.length === 0) {
      return result;
    }

    // Get existing cloud patterns to detect duplicates
    const cloudPatterns = await this.supabaseStorage.getAllPatterns();
    const cloudHashes = new Set(cloudPatterns.map(getPatternHash));

    for (const pattern of localPatterns) {
      const hash = getPatternHash(pattern);

      // Skip if already exists in cloud
      if (cloudHashes.has(hash)) {
        result.skipped.push(pattern.name);
        continue;
      }

      try {
        await this.supabaseStorage.savePattern({
          name: pattern.name,
          grid: pattern.grid,
          tempo: pattern.tempo,
        });
        result.uploaded.push(pattern.name);
      } catch (error) {
        result.failed.push({
          name: pattern.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Only clear localStorage if all patterns were successfully migrated (or skipped)
    if (result.failed.length === 0) {
      this.localStorage.clearAll();
    }

    return result;
  }
}
