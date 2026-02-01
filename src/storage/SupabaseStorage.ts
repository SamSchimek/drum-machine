import { supabase } from '../lib/supabase';
import type { Pattern } from '../types';
import type { SupabasePatternStorageInterface, SupabasePatternRow, SupabasePatternInput } from './types';

// Generate a random share slug
function generateShareSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert Supabase row (snake_case) to Pattern (camelCase)
function toPattern(row: SupabasePatternRow): Pattern {
  return {
    id: row.id,
    name: row.name,
    grid: row.grid,
    tempo: row.tempo,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    userId: row.user_id,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
  };
}

export class SupabaseStorage implements SupabasePatternStorageInterface {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async savePattern(patternData: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pattern> {
    const input: SupabasePatternInput = {
      user_id: this.userId,
      name: patternData.name,
      grid: patternData.grid,
      tempo: patternData.tempo,
      is_public: patternData.isPublic ?? false,
      share_slug: patternData.shareSlug ?? null,
    };

    const { data, error } = await supabase
      .from('patterns')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toPattern(data as SupabasePatternRow);
  }

  async loadPattern(id: string): Promise<Pattern | null> {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error loading pattern:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return toPattern(data as SupabasePatternRow);
  }

  async getAllPatterns(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading patterns:', error.message);
      return [];
    }

    return (data as SupabasePatternRow[]).map(toPattern);
  }

  async deletePattern(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('patterns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pattern:', error.message);
      return false;
    }

    return true;
  }

  async updatePattern(
    id: string,
    updates: Partial<Omit<Pattern, 'id' | 'createdAt'>>
  ): Promise<Pattern | null> {
    // Convert camelCase to snake_case for Supabase
    const supabaseUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.grid !== undefined) supabaseUpdates.grid = updates.grid;
    if (updates.tempo !== undefined) supabaseUpdates.tempo = updates.tempo;
    if (updates.isPublic !== undefined) supabaseUpdates.is_public = updates.isPublic;
    if (updates.shareSlug !== undefined) supabaseUpdates.share_slug = updates.shareSlug;

    const { data, error } = await supabase
      .from('patterns')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pattern:', error.message);
      return null;
    }

    return toPattern(data as SupabasePatternRow);
  }

  async makePublic(id: string, maxRetries = 3): Promise<string | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const shareSlug = generateShareSlug();

      const { data, error } = await supabase
        .from('patterns')
        .update({
          is_public: true,
          share_slug: shareSlug,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation (slug collision)
        if (error.code === '23505') {
          // Retry with a new slug
          continue;
        }
        console.error('Error making pattern public:', error.message);
        return null;
      }

      return (data as SupabasePatternRow).share_slug;
    }

    console.error('Failed to generate unique share slug after max retries');
    return null;
  }

  async makePrivate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('patterns')
      .update({
        is_public: false,
        share_slug: null,
      })
      .eq('id', id);

    if (error) {
      console.error('Error making pattern private:', error.message);
      return false;
    }

    return true;
  }

  async getByShareSlug(slug: string): Promise<Pattern | null> {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('share_slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error loading shared pattern:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return toPattern(data as SupabasePatternRow);
  }
}
