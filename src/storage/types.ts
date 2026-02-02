import type { Pattern, GridState } from '../types';

// Async pattern storage interface (for cloud storage)
export interface AsyncPatternStorageInterface {
  savePattern(pattern: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pattern>;
  loadPattern(id: string): Promise<Pattern | null>;
  getAllPatterns(): Promise<Pattern[]>;
  deletePattern(id: string): Promise<boolean>;
  updatePattern(id: string, updates: Partial<Omit<Pattern, 'id' | 'createdAt'>>): Promise<Pattern | null>;
}

// Extended interface for Supabase storage with sharing features
export interface SupabasePatternStorageInterface extends AsyncPatternStorageInterface {
  makePublic(id: string): Promise<string | null>; // Returns share slug
  makePrivate(id: string): Promise<boolean>;
  getByShareSlug(slug: string): Promise<Pattern | null>;
}

// Supabase row type (snake_case from database)
export interface SupabasePatternRow {
  id: string;
  user_id: string;
  name: string;
  grid: GridState;
  tempo: number;
  is_public: boolean;
  share_slug: string | null;
  show_creator_name: boolean;
  created_at: string; // ISO string from Supabase
  updated_at: string; // ISO string from Supabase
}

// Profile row type
export interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

// Pattern upvote row type
export interface PatternUpvoteRow {
  id: string;
  pattern_id: string;
  user_id: string | null;
  anonymous_id: string | null;
  ip_hash: string | null;
  created_at: string;
}

// Extended pattern with creator info and upvote count
export interface SharedPatternWithCreator extends SupabasePatternRow {
  profiles: ProfileRow | null;
  upvote_count: number;
}

// Input for creating a pattern in Supabase
export interface SupabasePatternInput {
  user_id: string;
  name: string;
  grid: GridState;
  tempo: number;
  is_public?: boolean;
  share_slug?: string | null;
  show_creator_name?: boolean;
}

// Migration result type
export interface MigrationResult {
  uploaded: string[];
  failed: Array<{ name: string; error: string }>;
  skipped: string[]; // Already existed in cloud
}
