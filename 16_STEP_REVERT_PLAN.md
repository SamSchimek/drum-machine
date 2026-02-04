# Revert to 16-Step Pattern Length

## Summary
Revert the drum machine from 32-step patterns back to 16-step patterns for better accessibility and casual beat-making virality.

---

## REVIEW FINDINGS (Added 2026-02-02)

### Issues Found

#### 1. CRITICAL: Missing Test File Update - PatternGenerator.test.ts
The plan omits `tests/PatternGenerator.test.ts` which contains multiple hardcoded references:
- Line 11-14: `grid.kick[0]`, `grid.kick[8]`, `grid.snare[4]`, `grid.snare[12]` - These are OK for 16-step
- Lines 17-18, 48-49, 55-56: Loop using `STEPS_PER_PATTERN` - OK (uses constant)
- **However**, the test creates patterns that work for both 16 and 32 steps, but the scoring expectations may need adjustment

#### 2. INCORRECT: Starter Beat Pattern Values
The plan's proposed 16-step starter beat patterns have musical errors:
- **Four-on-Floor**: Plan says `kick [0,4,8,12]` but this is 16th note four-on-floor (every beat). Original 32-step version `[0,8,16,24]` = quarter notes. For 16-step it should be `[0,4,8,12]` - this is correct
- **Basic Rock**: Plan says `kick [0,8]` but original `[0,16]` means kick on beats 1 & 3. For 16-step: `[0,8]` is correct
- **Funk Groove**: Plan says `kick [0,5,8,13]` but original `[0,10,16,26]` translates to `[0,5,8,13]` - this is correct
- **Hip-Hop**: Plan says `kick [0,3,8,11]` but original `[0,6,16,22]` translates to `[0,3,8,11]` - this is correct

**VERIFIED: The proposed patterns are musically correct translations.**

#### 3. MISSING: ML Pattern Scoring Constants Update
In `PatternGenerator.ts`, the `scorePattern()` method (lines 110-144) has additional hardcoded values:
- Line 118: `kickHits >= 4 && kickHits <= 12` - For 16 steps, should be `kickHits >= 2 && kickHits <= 6`
- Line 119: `snareHits >= 2 && snareHits <= 8` - For 16 steps, should be `snareHits >= 1 && snareHits <= 4`
- Line 131: `closedHHHits >= 8 && closedHHHits <= 24` - For 16 steps, should be `closedHHHits >= 4 && closedHHHits <= 12`
- Comments on lines 117, 121, 125, 129 reference "32-step" and need updating

#### 4. MISSING: Local Storage Migration
The plan addresses Supabase storage migration but NOT local storage:
- `src/storage/PatternStorage.ts` may contain patterns with 32 steps
- Need to add truncation logic in local storage `loadPattern()` and `getAllPatterns()`

#### 5. EDGE CASE: Empty/Short Grid Arrays
The migration strategy assumes grids have at least 16 elements. Need defensive code:
```typescript
grid[track] = grid[track]?.slice(0, 16) || new Array(16).fill(false);
```

#### 6. MISSING: Grid CSS May Need Adjustment
If there are any CSS grid-template-columns or width calculations based on 32 steps, they should be checked. Review showed Grid.css uses dynamic generation, so this is likely OK.

#### 7. INCORRECT: MusicalRules Backbeat Values
The plan says to change snare backbeat from `step === 8 || step === 24` to `step === 4 || step === 12`.
- In a 32-step grid: steps 8 and 24 are beats 2 and 4 (backbeats)
- In a 16-step grid: steps 4 and 12 are beats 2 and 4 (backbeats)
- **This is CORRECT**

The plan says to change kick downbeat from `step === 0 || step === 16` to `step === 0 || step === 8`.
- In 32-step: 0 and 16 are beats 1 and 3
- In 16-step: 0 and 8 are beats 1 and 3
- **This is CORRECT**

---

### TDD Test Plan

Write/update tests BEFORE implementing changes, in this order:

#### Phase 1: Core Type & Constant Tests

1. **Create `tests/constants.test.ts`** (NEW)
   ```typescript
   import { STEPS_PER_PATTERN } from '../src/constants';

   describe('Constants', () => {
     it('should have 16 steps per pattern', () => {
       expect(STEPS_PER_PATTERN).toBe(16);
     });
   });
   ```

2. **Update `tests/Grid.test.tsx`**
   - Change assertion from 32 to 16 steps
   - Add test for bar marker classes (no bar-start class at step 16 since it doesn't exist)

#### Phase 2: Starter Beat Tests

3. **Update `tests/starterBeats.test.ts`**
   - Change `toHaveLength(32)` to `toHaveLength(16)` on line 24
   - Add tests verifying no steps > 15 are active:
   ```typescript
   it('should not have any active steps beyond step 15', () => {
     for (const beat of STARTER_BEATS) {
       for (const trackId of TRACK_IDS) {
         const activeSteps = beat.grid[trackId]
           .map((active, idx) => active ? idx : -1)
           .filter(idx => idx >= 0);
         expect(activeSteps.every(step => step < 16)).toBe(true);
       }
     }
   });
   ```

#### Phase 3: ML/Pattern Generation Tests

4. **Create `tests/MusicalRules.test.ts`** (NEW)
   ```typescript
   import { MusicalRules } from '../src/ml/MusicalRules';
   import { createEmptyGrid } from '../src/types';

   describe('MusicalRules', () => {
     let rules: MusicalRules;

     beforeEach(() => {
       rules = new MusicalRules();
     });

     describe('snare backbeat', () => {
       it('should boost probability on steps 4 and 12 (beats 2 and 4)', () => {
         const grid = createEmptyGrid();
         const result4 = rules.evaluateHit(grid, 'snare', 4);
         const result12 = rules.evaluateHit(grid, 'snare', 12);
         expect(result4.probability).toBeGreaterThan(1);
         expect(result12.probability).toBeGreaterThan(1);
       });
     });

     describe('kick downbeat', () => {
       it('should boost probability on steps 0 and 8 (beats 1 and 3)', () => {
         const grid = createEmptyGrid();
         const result0 = rules.evaluateHit(grid, 'kick', 0);
         const result8 = rules.evaluateHit(grid, 'kick', 8);
         expect(result0.probability).toBeGreaterThan(1);
         expect(result8.probability).toBeGreaterThan(1);
       });
     });
   });
   ```

5. **Update `tests/PatternGenerator.test.ts`**
   - Verify generated patterns have correct length (uses STEPS_PER_PATTERN constant)
   - Add test for scoring preferences at 16-step backbeat positions

#### Phase 4: Storage Migration Tests

6. **Update `tests/storage/SupabaseStorage.test.ts`**
   - Change all `new Array(32)` to `new Array(16)`
   - Add test for migration of 32-step patterns:
   ```typescript
   it('should truncate 32-step grids to 16 steps on load', async () => {
     const mockRow = createMockSupabaseRow({
       grid: create32StepMockGrid(), // Helper that creates 32-step grid
     });
     // ... setup mock
     const result = await storage.loadPattern('test-id');
     expect(result?.grid.kick).toHaveLength(16);
   });
   ```

7. **Create `tests/storage/PatternStorage.test.ts`** (NEW or update existing)
   - Test local storage migration from 32 to 16 steps

#### Phase 5: UI Component Tests

8. **Update Grid component tests**
   - Verify only 16 cells render per track
   - Verify no `bar-start` class is applied (only exists at step 16)
   - Verify `bar-end` class only on step 15

---

### Recommended Changes to Plan

#### Add to Section 5 (ML/Pattern Generation):

**`src/ml/PatternGenerator.ts`** - `scorePattern()` method (lines 110-144):
- Line 117: Update comment to reference 16 steps
- Line 118: Change `kickHits >= 4 && kickHits <= 12` to `kickHits >= 2 && kickHits <= 6`
- Line 119: Change `snareHits >= 2 && snareHits <= 8` to `snareHits >= 1 && snareHits <= 4`
- Lines 121-123: Update comments from "32-step grid" to "16-step grid"
- Lines 125-127: Backbeat positions already handled (steps 8,24 -> 4,12)
- Line 131: Change `closedHHHits >= 8 && closedHHHits <= 24` to `closedHHHits >= 4 && closedHHHits <= 12`

#### Add New Section 7: Local Storage Migration

**`src/storage/PatternStorage.ts`**
In the `loadPattern()` method and `getAllPatterns()` method, add truncation logic:
```typescript
// After loading pattern from localStorage
if (pattern) {
  for (const trackId of TRACK_IDS) {
    pattern.grid[trackId] = pattern.grid[trackId]?.slice(0, 16) || new Array(16).fill(false);
  }
}
```

#### Update Data Migration Section

Change the Supabase migration from:
```typescript
grid[track] = grid[track].slice(0, 16)
```

To defensive version:
```typescript
for (const trackId of TRACK_IDS) {
  grid[trackId] = grid[trackId]?.slice(0, 16) || new Array(16).fill(false);
}
```

---

## Files to Modify

### 1. Constants
**`src/constants/index.ts`** (line 4)
- Change `STEPS_PER_PATTERN = 32` to `16`

### 2. Type Definitions
**`src/types/index.ts`**
- Line 48: Update comment `12 tracks x 32 steps` to `12 tracks x 16 steps`
- Line 54: Change `new Array(32)` to `new Array(16)`

### 3. Starter Beat Presets
**`src/presets/starterBeats.ts`**
- Line 13: Change `step < 32` to `step < 16`
- Update all beat patterns to use steps 0-15 only:
  - Four-on-Floor: kick [0,4,8,12], closedHH every even step (0,2,4,6,8,10,12,14)
  - Basic Rock: kick [0,8], snare [4,12], closedHH [0,4,8,12]
  - Funk Groove: kick [0,5,8,13], snare [4,12], closedHH [0,4,8,10,12,14], openHH [6]
  - Hip-Hop: kick [0,3,8,11], snare [4,12], closedHH every even step
  - Disco: kick [0,4,8,12], snare [4,12], openHH [0,4,8,12]

### 4. Grid Components (bar markers)
Update hardcoded step indices for bar/beat markers:

**`src/components/Grid/Grid.tsx`** (lines 26-27)
- `step === 15 || step === 31` to `step === 15` (end of pattern)
- `step === 16` to remove (no second bar)

**`src/components/Grid/GridCell.tsx`** (lines 17-18)
- Same changes as above

**`src/components/Share/SharedPatternView.tsx`** (lines 25-26)
- Same changes as above

### 5. ML/Pattern Generation (scoring logic)
**`src/ml/PatternGenerator.ts`** (lines 121-127)
- Update snare backbeat scoring: steps 8,24 to step 4,12
- Update kick downbeat scoring: steps 0,16 to steps 0,8
- Update `scorePattern()` density thresholds (see Recommended Changes above)

**`src/ml/MusicalRules.ts`** (lines 43-45, 77-78)
- Update snare backbeat check: `step === 8 || step === 24` to `step === 4 || step === 12`
- Update kick downbeat check: `step === 0 || step === 16` to `step === 0 || step === 8`

### 6. Tests
**`tests/Grid.test.tsx`** (line 41)
- Change `i < 32` to `i < 16`

**`tests/storage/SupabaseStorage.test.ts`** (lines 10-24)
- Update comment and all `new Array(32)` to `new Array(16)`

**`tests/starterBeats.test.ts`** (line 24)
- Change `toHaveLength(32)` to `toHaveLength(16)`

**`tests/PatternGenerator.test.ts`**
- Verify patterns generate with correct length (already uses STEPS_PER_PATTERN)

## Data Migration
**Approach**: Truncate to 16 steps on load.

**`src/storage/SupabaseStorage.ts`** - in `toPattern()` function:
- After loading grid from Supabase, truncate each track array to 16 steps
- Use defensive code: `grid[trackId] = grid[trackId]?.slice(0, 16) || new Array(16).fill(false)`

**`src/storage/PatternStorage.ts`** - in load methods:
- Same truncation logic for local storage patterns

This ensures old 32-step patterns display/play correctly with the new 16-step grid.

## Verification
1. `npm run build` - no TypeScript errors
2. `npm test` - all tests pass
3. UI shows 16 steps in grid
4. Starter beats load correctly (steps 0-15)
5. Pattern preview in sidebar fits properly with Share button visible
6. Shared pattern view displays 16 steps
7. Audio plays correct 16-step loop
8. Old 32-step patterns load and truncate correctly
9. ML pattern generation produces musically sensible 16-step patterns
10. Backbeats (snare) land on beats 2 and 4 (steps 4 and 12)
11. Downbeats (kick) encouraged on beats 1 and 3 (steps 0 and 8)
