# Starter Beat Feature Plan

**Status: COMPLETED**

## Summary
Add a "Starter Beat" button that randomly loads a foundational beat from a preset library, helping beginner users get started. Clicking again loads a different beat (never the same one twice in a row).

## UI Placement
Button in `Transport.tsx` next to the Clear button.

## Preset Library (5 beats)
Full 2-bar patterns (32 steps) - Common foundational patterns users can build on:

1. **Four-on-Floor** - Electronic/dance foundation
   - Kick: steps 0, 8, 16, 24
   - Closed HH: every even step (0, 2, 4, ... 30)

2. **Basic Rock** - Standard rock beat
   - Kick: steps 0, 16
   - Snare: steps 8, 24
   - Closed HH: every 4 steps (0, 4, 8, 12, 16, 20, 24, 28)

3. **Funk Groove** - Syncopated funk
   - Kick: steps 0, 10, 16, 26
   - Snare: steps 8, 24
   - Closed HH: steps 0, 4, 8, 16, 20, 24, 28
   - Open HH: step 12

4. **Hip-Hop** - Boom bap foundation
   - Kick: steps 0, 6, 16, 22
   - Snare: steps 8, 24
   - Closed HH: every even step

5. **Disco** - Classic disco pattern
   - Kick: steps 0, 8, 16, 24
   - Snare: steps 8, 24
   - Open HH: every 4 steps (0, 4, 8, 12, 16, 20, 24, 28)

## Files Modified/Created

### 1. `src/presets/starterBeats.ts` (NEW)
```typescript
import type { GridState } from '../types';
import { createEmptyGrid } from '../types';

export interface StarterBeat {
  name: string;
  grid: GridState;
}

function createBeatGrid(patterns: Partial<Record<keyof GridState, number[]>>): GridState {
  const grid = createEmptyGrid();
  for (const [track, steps] of Object.entries(patterns)) {
    for (const step of steps) {
      if (step >= 0 && step < 32) {
        grid[track as keyof GridState][step] = true;
      }
    }
  }
  return grid;
}

export const STARTER_BEATS: StarterBeat[] = [
  { name: 'Four-on-Floor', grid: createBeatGrid({...}) },
  // ... 5 beats total
];

export function getRandomStarterBeat(lastBeatName?: string | null): StarterBeat {
  const available = lastBeatName
    ? STARTER_BEATS.filter((b) => b.name !== lastBeatName)
    : STARTER_BEATS;
  return available[Math.floor(Math.random() * available.length)];
}
```

### 2. `src/context/DrumMachineContext.tsx`
- Added `lastStarterBeat: string | null` to `DrumMachineState`
- Added `LOAD_STARTER_BEAT` action type
- Added `loadStarterBeat()` function to context that:
  - Calls `getRandomStarterBeat(state.lastStarterBeat)`
  - Dispatches action to set grid and update `lastStarterBeat`
- Exported `loadStarterBeat` in context value

### 3. `src/components/Transport/Transport.tsx`
- Import `loadStarterBeat` from context
- Added "Starter Beat" button with `onClick={loadStarterBeat}`

### 4. `src/components/Transport/Transport.css`
- Added `.starter-beat-button` styles (orange accent, matches app theme)
- Updated responsive styles for mobile breakpoints

### 5. `tests/starterBeats.test.ts` (NEW)
- 8 tests covering preset validation and random selection logic

## Implementation Notes

### Deviations from Original Plan
1. **Full patterns vs partial**: Implementation uses full 32-step patterns instead of 16-step partial patterns. This provides complete, playable beats immediately.
2. **State management**: `lastStarterBeat` is stored in context state rather than local component state, allowing for better state management and potential future features (e.g., showing current beat name).
3. **5 beats instead of 6**: Removed "Syncopated" beat, keeping 5 well-known genre patterns.

### Error Handling
- `createBeatGrid` validates step indices (0-31) before setting
- `getRandomStarterBeat` handles `null` and `undefined` for `lastBeatName`

## Verification (All Passed)
1. ✅ Click "Starter Beat" - grid populates with a pattern
2. ✅ Click again - different pattern loads (never same twice in a row)
3. ✅ Play the beat - sounds musically coherent
4. ✅ User can modify the loaded pattern
5. ✅ `npm test` - 102 tests pass (94 existing + 8 new)
6. ✅ `npm run build` - no TypeScript errors
