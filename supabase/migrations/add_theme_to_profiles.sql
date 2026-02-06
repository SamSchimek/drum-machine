-- Add theme column to profiles table
-- Run this migration in your Supabase dashboard SQL editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'bloom';

-- Optional: Add a check constraint to validate theme values
ALTER TABLE profiles
ADD CONSTRAINT valid_theme CHECK (
  theme IN ('bloom', 'sunset', 'midnight', 'forest', 'neon', 'monochrome')
);
