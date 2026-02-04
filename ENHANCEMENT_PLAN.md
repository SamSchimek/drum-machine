# Drum Machine Enhancement Plan

## Summary
1. Switch from 16 to 32 steps for improved musicality
2. Add upvote system for shared patterns (anonymous allowed)
3. Display creator name on shared patterns with per-pattern toggle

---

## Critical Issues Identified (Review)

### Must Fix
1. **Migration 4 SQL bug**: UNION ALL doesn't preserve ordering - arrays could be scrambled
2. **RLS DELETE policy hole**: Anonymous users can delete ANY anonymous upvote
3. **Missing rate limiting**: Anonymous upvotes can be spammed by clearing localStorage

### Should Fix
4. Missing `user_id` index on pattern_upvotes
5. Missing `updated_at` trigger on profiles table
6. No profile creation flow defined
7. Handle localStorage clear edge case in UI
8. Update ALL hardcoded step numbers in MusicalRules.ts (0, 4, 8, 12)

### Consider
9. Add denormalized `upvote_count` column for performance
10. Mobile UX: 12px cells may be too small - consider horizontal scroll
11. Existing shared patterns default to showing creator name (consent issue)

---

## Test-Driven Development Approach

For each phase, write tests BEFORE implementing the feature.

### TDD: 32-Step Grid Tests
```typescript
// tests/grid-32-steps.test.ts
describe('32-Step Grid', () => {
  it('creates empty grid with 32 steps per track', () => {
    const grid = createEmptyGrid();
    TRACK_IDS.forEach(trackId => {
      expect(grid[trackId]).toHaveLength(32);
    });
  });

  it('renders 32 grid cells per row', () => {
    render(<GridRow trackId="kick" steps={createEmptyGrid().kick} />);
    expect(screen.getAllByRole('button')).toHaveLength(32);
  });

  it('applies bar-end class at steps 15 and 31', () => {
    render(<GridCell trackId="kick" step={15} active={false} />);
    expect(screen.getByRole('button')).toHaveClass('bar-end');
  });

  it('sequencer cycles through all 32 steps', async () => {
    const steps: number[] = [];
    sequencer.onStep(step => steps.push(step));
    sequencer.start();
    await waitFor(() => expect(steps).toContain(31));
    sequencer.stop();
    expect(Math.max(...steps)).toBe(31);
  });
});
```

### TDD: Musical Rules Tests
```typescript
// tests/musical-rules-32.test.ts
describe('Musical Rules for 32 Steps', () => {
  it('encourages snare on backbeats (steps 8 and 24)', () => {
    const rules = new MusicalRules();
    expect(rules.evaluate('snare', 8).probability).toBeGreaterThan(1);
    expect(rules.evaluate('snare', 24).probability).toBeGreaterThan(1);
  });

  it('encourages kick on downbeats (steps 0 and 16)', () => {
    const rules = new MusicalRules();
    expect(rules.evaluate('kick', 0).probability).toBeGreaterThan(1);
    expect(rules.evaluate('kick', 16).probability).toBeGreaterThan(1);
  });

  it('discourages snare on beat 1 (step 0)', () => {
    const rules = new MusicalRules();
    expect(rules.evaluate('snare', 0).probability).toBeLessThan(1);
  });
});
```

### TDD: Upvote System Tests
```typescript
// tests/upvotes.test.ts
describe('Upvote System', () => {
  it('displays upvote count on shared pattern', async () => {
    render(<SharedPatternView />);
    await waitFor(() => {
      expect(screen.getByText(/\d+/)).toBeInTheDocument(); // upvote count
    });
  });

  it('toggles upvote state when clicked', async () => {
    render(<SharedPatternView />);
    const upvoteBtn = await screen.findByRole('button', { name: /upvote/i });

    expect(upvoteBtn).not.toHaveClass('upvoted');
    fireEvent.click(upvoteBtn);
    await waitFor(() => expect(upvoteBtn).toHaveClass('upvoted'));
  });

  it('persists anonymous upvotes via localStorage ID', () => {
    const id1 = getAnonymousId();
    const id2 = getAnonymousId();
    expect(id1).toBe(id2); // Same ID returned
    expect(id1).toHaveLength(32); // 16 bytes as hex
  });

  it('prevents duplicate upvotes from same user', async () => {
    // Attempt double upvote should fail gracefully
  });
});
```

### TDD: Creator Name Tests
```typescript
// tests/creator-name.test.ts
describe('Creator Name Display', () => {
  it('shows creator display name when available', async () => {
    // Mock pattern with creator who has display_name
    render(<SharedPatternView />);
    await waitFor(() => {
      expect(screen.getByText(/by TestUser/)).toBeInTheDocument();
    });
  });

  it('shows email prefix when no display name set', async () => {
    // Mock pattern with creator email john@example.com, no display_name
    render(<SharedPatternView />);
    await waitFor(() => {
      expect(screen.getByText(/by john/)).toBeInTheDocument();
    });
  });

  it('hides creator name when show_creator_name is false', async () => {
    // Mock pattern with show_creator_name: false
    render(<SharedPatternView />);
    await waitFor(() => {
      expect(screen.queryByText(/by /)).not.toBeInTheDocument();
    });
  });

  it('toggles show_creator_name in share modal', async () => {
    render(<ShareButton pattern={mockPattern} />);
    fireEvent.click(screen.getByText('Share'));

    const toggle = screen.getByRole('checkbox', { name: /show my name/i });
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).not.toBeChecked());
  });
});
```

### TDD: Migration Tests
```typescript
// tests/migration.test.ts
describe('Pattern Migration 16 to 32 Steps', () => {
  it('duplicates 16-step pattern to 32 steps', () => {
    const original16 = [true, false, false, false, true, false, false, false,
                        false, false, false, false, true, false, false, false];
    const expected32 = [...original16, ...original16];

    const migrated = duplicatePattern(original16);
    expect(migrated).toEqual(expected32);
    expect(migrated).toHaveLength(32);
  });

  it('preserves pattern rhythm after migration', () => {
    const original = { kick: Array(16).fill(false) };
    original.kick[0] = true;
    original.kick[8] = true;

    const migrated = migrateGridTo32Steps(original);

    // Original beats preserved
    expect(migrated.kick[0]).toBe(true);
    expect(migrated.kick[8]).toBe(true);
    // Duplicated in second half
    expect(migrated.kick[16]).toBe(true);
    expect(migrated.kick[24]).toBe(true);
  });
});
```

---

## Phase 1: Database Migrations

### Migration 1: Add `show_creator_name` to patterns
```sql
ALTER TABLE public.patterns ADD COLUMN show_creator_name BOOLEAN NOT NULL DEFAULT true;
```

### Migration 2: Create profiles table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly viewable" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE INDEX idx_profiles_id ON public.profiles(id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on first pattern share (via trigger on patterns)
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.user_id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patterns_ensure_profile
  BEFORE INSERT ON public.patterns
  FOR EACH ROW EXECUTE FUNCTION ensure_profile_exists();
```

### Migration 3: Create pattern_upvotes table
```sql
CREATE TABLE public.pattern_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES public.patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  ip_hash TEXT, -- For rate limiting
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_vote UNIQUE (pattern_id, user_id),
  CONSTRAINT unique_anonymous_vote UNIQUE (pattern_id, anonymous_id),
  CONSTRAINT must_have_identifier CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

ALTER TABLE public.pattern_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upvotes viewable" ON public.pattern_upvotes FOR SELECT USING (true);
CREATE POLICY "Anyone can upvote" ON public.pattern_upvotes FOR INSERT WITH CHECK (true);
-- NOTE: Anonymous upvotes cannot be deleted (no way to verify ownership)
-- Only authenticated users can remove their own upvotes
CREATE POLICY "Users can remove own upvotes" ON public.pattern_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_upvotes_pattern ON public.pattern_upvotes(pattern_id);
CREATE INDEX idx_upvotes_anonymous ON public.pattern_upvotes(anonymous_id);
CREATE INDEX idx_upvotes_user ON public.pattern_upvotes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_upvotes_pattern_user ON public.pattern_upvotes(pattern_id, user_id);
CREATE INDEX idx_upvotes_pattern_anon ON public.pattern_upvotes(pattern_id, anonymous_id);
```

### Migration 4: Migrate existing patterns to 32 steps
```sql
-- Duplicate each track array from 16 to 32 steps
-- CRITICAL: Use ORDER BY to preserve array element ordering (UNION ALL doesn't guarantee order)
UPDATE public.patterns
SET grid = (
  SELECT jsonb_object_agg(key, doubled_array)
  FROM (
    SELECT
      key,
      (
        SELECT jsonb_agg(elem ORDER BY idx)
        FROM (
          SELECT elem, row_number() OVER () AS idx
          FROM jsonb_array_elements(value) AS elem
          UNION ALL
          SELECT elem, row_number() OVER () + 16 AS idx
          FROM jsonb_array_elements(value) AS elem
        ) AS ordered
      ) AS doubled_array
    FROM jsonb_each(grid)
  ) AS tracks
)
WHERE jsonb_array_length(grid -> 'kick') = 16;

-- Verify migration (run after to check)
-- SELECT id, jsonb_array_length(grid -> 'kick') as kick_steps FROM patterns;
```

---

## Phase 2: Frontend Constants & Types

### Files to modify:
| File | Change |
|------|--------|
| `src/constants/index.ts` | `STEPS_PER_PATTERN = 16` → `32` |
| `src/types/index.ts` | Update `createEmptyGrid()`, add `showCreatorName?: boolean` to Pattern |
| `src/storage/types.ts` | Add `show_creator_name` to SupabasePatternRow, add ProfileRow, PatternUpvoteRow |

---

## Phase 3: Musical Rules Update

### File: `src/ml/MusicalRules.ts`
| Old Position | Musical Beat | New Position (32 steps) |
|--------------|--------------|------------------------|
| step 4 | Beat 2 (backbeat) | step 8 |
| step 12 | Beat 4 (backbeat) | step 24 |
| step 0 | Beat 1 (downbeat) | step 0 |
| step 8 | Beat 3 | step 16 |

### File: `src/ml/PatternGenerator.ts`
- Double scoring thresholds (e.g., kickHits 2-6 → 4-12)
- Update preferred step positions

---

## Phase 4: CSS Updates

### File: `src/components/Grid/Grid.css`
| Breakpoint | Old Cell Size | New Cell Size |
|------------|---------------|---------------|
| Desktop | 30px | 20px |
| ≤1200px | - | 18px |
| ≤900px | 26px | 16px |
| ≤600px | 22px | 12px |

Add `.bar-end { margin-right: 10px; }` for visual bar separation.

### File: `src/components/Share/SharedPatternView.css`
- Cell sizes: 32px → 18px (with responsive scaling)
- Container max-width: 800px → 1000px
- Add upvote button and creator name styles

---

## Phase 5: New Utility

### New file: `src/utils/anonymousId.ts`
```typescript
const ANONYMOUS_ID_KEY = 'drum-machine-anonymous-id';

export function getAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    id = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}
```

---

## Phase 6: Storage Layer

### File: `src/storage/SupabaseStorage.ts`
New methods:
- `getSharedPatternWithCreator(slug)` - Fetch with JOIN to profiles + upvote count
- `hasUpvoted(patternId, userId, anonymousId)` - Check upvote status
- `addUpvote(patternId, userId, anonymousId)` - Insert upvote
- `removeUpvote(patternId, userId, anonymousId)` - Delete upvote
- `updateShowCreatorName(patternId, show)` - Toggle visibility

Update `toPattern()` to include `showCreatorName` field.

---

## Phase 7: Component Updates

### File: `src/components/Share/SharedPatternView.tsx`
- Query pattern with creator via Supabase join: `profiles:user_id (display_name)`
- Display creator: `by {displayName || emailPrefix}`
- Upvote button: heart icon + count, toggle on click
- Grid: add `bar-start` class at step 16

### File: `src/components/Share/ShareButton.tsx`
- Add checkbox: "Show my name on shared pattern"
- Persist toggle to `show_creator_name` column

### Files: `src/components/Grid/Grid.tsx`, `GridCell.tsx`
- Add `bar-end` class at steps 15 and 31

---

## Phase 8: Tests Update

### File: `tests/Grid.test.tsx`
- Update hardcoded `16` → `32` in step iteration

---

## Implementation Order

1. **Write tests first** (TDD)
2. **Database migrations** (run via Supabase)
3. **Constants and types**
4. **Musical rules**
5. **CSS updates**
6. **Anonymous ID utility**
7. **Storage layer**
8. **Components**
9. **Run all tests, verify**

---

## Verification Checklist

### 32 Steps
- [ ] Grid shows 32 columns
- [ ] Pattern plays all 32 steps
- [ ] Responsive layout works on mobile
- [ ] Bar separation visible at step 16
- [ ] Existing patterns migrated (play correctly with doubled content)

### Upvotes
- [ ] Upvote count displays on shared pattern
- [ ] Click upvote increments count
- [ ] Click again decrements (un-upvote)
- [ ] Refresh preserves upvote state (logged in)
- [ ] Anonymous upvote works in incognito
- [ ] Same anonymous user can't upvote twice

### Creator Name
- [ ] Display name shows if set
- [ ] Email prefix shows if no display name
- [ ] Name hidden when toggle is off
- [ ] Toggle persists to database
- [ ] Toggle state shown in share modal
