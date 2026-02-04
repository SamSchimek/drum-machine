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
// Also truncates grid to 16 steps for backwards compatibility with old 32-step patterns
function toPattern(row: SupabasePatternRow): Pattern {
  // Truncate each track to 16 steps for backwards compatibility
  const grid = row.grid;
  for (const track of Object.keys(grid) as (keyof typeof grid)[]) {
    if (grid[track].length > 16) {
      grid[track] = grid[track].slice(0, 16);
    }
  }

  return {
    id: row.id,
    name: row.name,
    grid: grid,
    tempo: row.tempo,
    swing: row.swing,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    userId: row.user_id,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
    showCreatorName: row.show_creator_name,
  };
}

// Extended pattern with creator info
export interface PatternWithCreator extends Pattern {
  creatorDisplayName: string | null;
  upvoteCount: number;
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
      swing: patternData.swing,
      is_public: patternData.isPublic ?? false,
      share_slug: patternData.shareSlug ?? null,
      show_creator_name: patternData.showCreatorName ?? true,
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
    if (updates.swing !== undefined) supabaseUpdates.swing = updates.swing;
    if (updates.isPublic !== undefined) supabaseUpdates.is_public = updates.isPublic;
    if (updates.shareSlug !== undefined) supabaseUpdates.share_slug = updates.shareSlug;
    if (updates.showCreatorName !== undefined) supabaseUpdates.show_creator_name = updates.showCreatorName;

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
        .eq('user_id', this.userId)
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
      .eq('id', id)
      .eq('user_id', this.userId);

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

  async updateShowCreatorName(id: string, showCreatorName: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('patterns')
      .update({ show_creator_name: showCreatorName })
      .eq('id', id);

    if (error) {
      console.error('Error updating show_creator_name:', error.message);
      return false;
    }

    return true;
  }
}

// Static methods for shared pattern operations (don't require authentication)
export async function getSharedPatternWithCreator(slug: string): Promise<PatternWithCreator | null> {
  // Fetch pattern
  const { data: patternData, error: patternError } = await supabase
    .from('patterns')
    .select('*')
    .eq('share_slug', slug)
    .maybeSingle();

  if (patternError) {
    console.error('Error loading shared pattern:', patternError.message);
    return null;
  }

  if (!patternData) {
    return null;
  }

  const row = patternData as SupabasePatternRow;
  const pattern = toPattern(row);

  // Fetch creator profile separately if pattern has a user_id
  let creatorDisplayName: string | null = null;
  if (row.user_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', row.user_id)
      .maybeSingle();

    creatorDisplayName = profileData?.display_name ?? null;
  }

  // Get upvote count
  const { count, error: countError } = await supabase
    .from('pattern_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('pattern_id', patternData.id);

  if (countError) {
    console.error('Error getting upvote count:', countError.message);
  }

  return {
    ...pattern,
    creatorDisplayName,
    upvoteCount: count ?? 0,
  };
}

export async function hasUpvoted(
  patternId: string,
  userId: string | null,
  anonymousId: string | null
): Promise<boolean> {
  if (userId) {
    const { data, error } = await supabase
      .from('pattern_upvotes')
      .select('id')
      .eq('pattern_id', patternId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking upvote:', error.message);
      return false;
    }

    return data !== null;
  }

  if (anonymousId) {
    const { data, error } = await supabase
      .from('pattern_upvotes')
      .select('id')
      .eq('pattern_id', patternId)
      .eq('anonymous_id', anonymousId)
      .maybeSingle();

    if (error) {
      console.error('Error checking upvote:', error.message);
      return false;
    }

    return data !== null;
  }

  return false;
}

export async function addUpvote(
  patternId: string,
  userId: string | null,
  anonymousId: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('pattern_upvotes')
    .insert({
      pattern_id: patternId,
      user_id: userId,
      anonymous_id: userId ? null : anonymousId,
    });

  if (error) {
    // Unique constraint violation means already upvoted
    if (error.code === '23505') {
      return true;
    }
    console.error('Error adding upvote:', error.message);
    return false;
  }

  return true;
}

export async function removeUpvote(
  patternId: string,
  userId: string | null
): Promise<boolean> {
  // Only authenticated users can remove upvotes
  if (!userId) {
    console.error('Anonymous users cannot remove upvotes');
    return false;
  }

  const { error } = await supabase
    .from('pattern_upvotes')
    .delete()
    .eq('pattern_id', patternId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing upvote:', error.message);
    return false;
  }

  return true;
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string }
): Promise<boolean> {
  const displayName = updates.display_name?.trim() || null;

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error updating profile:', error.message);
    return false;
  }

  return true;
}

export async function getProfile(
  userId: string
): Promise<{ display_name: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }

  return data;
}
