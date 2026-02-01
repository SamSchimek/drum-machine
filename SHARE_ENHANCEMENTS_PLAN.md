# Share Page Enhancements Plan

## Overview
Two improvements to the sharing experience:
1. **Playable Share Page**: Add a Play button to SharedPatternView so visitors can hear patterns
2. **Better Share UX**: Clicking "Shared" opens modal to re-copy link; "Make Private" moved inside modal with warning

---

## Feature 1: Playable Share Page

### Goal
Enable visitors to play shared patterns with one click, reducing friction for viral sharing.

### Critical Design Decision: Standalone Playback
The existing `Sequencer` and `AudioEngine` are **singletons** designed for the main app. Creating "local instances" won't work cleanly.

**Solution**: Create a **SimplePatternPlayer** class that:
- Creates its own AudioEngine instance (not the singleton)
- Uses a simple `setInterval` loop (no lookahead scheduling needed for playback-only)
- Works with immutable grid data (no refs needed)

### Implementation

#### 1.1 Create `SimplePatternPlayer` class
**File**: `src/audio/SimplePatternPlayer.ts`

A lightweight class for standalone pattern playback:

```typescript
class SimplePatternPlayer {
  private audioEngine: AudioEngine;
  private intervalId: number | null = null;
  private currentStep = 0;
  private onStepCallback: ((step: number) => void) | null = null;

  constructor() {
    this.audioEngine = new AudioEngine(); // Own instance, not singleton
  }

  async play(grid: GridState, tempo: number): Promise<void>;
  stop(): void;
  onStep(callback: (step: number) => void): void;
  dispose(): void;
}
```

**Key differences from Sequencer**:
- Creates its own AudioEngine (no singleton conflict)
- Simple `setInterval` at `(60 / tempo / 4) * 1000` ms
- No lookahead scheduling (acceptable for playback-only use case)
- Grid passed directly to `play()`, not via refs

#### 1.2 Create `usePatternPlayer` hook
**File**: `src/hooks/usePatternPlayer.ts`

```typescript
interface UsePatternPlayerReturn {
  isPlaying: boolean;
  currentStep: number;
  isLoading: boolean;        // For initial audio init
  error: string | null;      // For audio failures
  play: () => Promise<void>;
  stop: () => void;
}

function usePatternPlayer(grid: GridState, tempo: number): UsePatternPlayerReturn
```

**Responsibilities**:
- Manage SimplePatternPlayer lifecycle
- Handle loading state during audio initialization
- Handle errors gracefully (AudioContext failures, etc.)
- **Critical**: Cleanup on unmount (stop playback, dispose AudioEngine)

#### 1.2 Update `SharedPatternView.tsx`
**File**: `src/components/Share/SharedPatternView.tsx`

Add:
- Play/Stop button in header (prominent, uses orange accent color)
- Current step indicator on grid cells (highlight current column during playback)
- Use the `usePatternPlayer` hook

**UI Changes**:
```
┌─────────────────────────────────────┐
│         Pattern Name                │
│         120 BPM                     │
│      [ ▶ Play Pattern ]             │  ← New play button
├─────────────────────────────────────┤
│  kick   [■][·][·][·][■][·]...       │  ← Step indicator during play
│  snare  [·][·][·][·][■][·]...       │
│  ...                                │
└─────────────────────────────────────┘
```

#### 1.3 Update `SharedPatternView.css`
**File**: `src/components/Share/SharedPatternView.css`

Add styles for:
- `.shared-play-button` - Large, prominent play button
- `.shared-grid-cell.current` - Highlight for current step during playback
- Animation/pulse effect on current step

---

#### 1.3 Mobile Audio Considerations
- Play button must trigger from real user gesture (click/tap)
- Add loading state while `AudioContext` initializes
- Handle `AudioContext.state === 'suspended'` and `'interrupted'` (iOS)
- Show error message if audio fails to initialize

#### 1.4 Cleanup Requirements
The `usePatternPlayer` hook **must** cleanup on unmount:
```typescript
useEffect(() => {
  return () => {
    player.current?.stop();
    player.current?.dispose(); // Disposes AudioEngine and clears interval
  };
}, []);
```

#### 1.5 Design Decision: Muted Tracks
SharedPatternView has no muted tracks data (not stored in DB). **All tracks will play**. This is the intended behavior - visitors hear the full pattern as the creator intended when sharing.

---

## Feature 2: Better ShareButton UX

### Goal
- Clicking "Shared" shows modal to re-copy link (not toggle off)
- "Make Private" is inside the modal with a warning about breaking existing links

### Critical Fix: State Sync Issue
Current code initializes local state from prop **once**:
```typescript
const [currentShareSlug, setCurrentShareSlug] = useState<string | null>(pattern.shareSlug ?? null);
```

**Problem**: If `pattern.shareSlug` changes externally (e.g., from context refresh), local state won't update.

**Solution**: Add `useEffect` to sync state when prop changes:
```typescript
useEffect(() => {
  setCurrentShareSlug(pattern.shareSlug ?? null);
}, [pattern.shareSlug]);
```

### Implementation

#### 2.1 Update `ShareButton.tsx`
**File**: `src/components/Share/ShareButton.tsx`

**New behavior**:

| State | Click Action |
|-------|--------------|
| Not shared | Call `makePatternPublic()`, show modal on success |
| Shared | Show modal immediately (no API call) |

**Modal changes**:
- Add "Make Private" button at bottom of modal
- Warning text: "This will prevent anyone with the link from accessing the pattern"
- Red/muted styling to indicate destructive action

#### 2.2 Update `ShareButton.css`
**File**: `src/components/Share/ShareButton.css`

Add styles for:
- `.share-modal-make-private` - Destructive action styling (red/muted)
- `.share-modal-warning` - Warning text styling

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/audio/SimplePatternPlayer.ts` | **NEW** - Lightweight playback class (own AudioEngine) |
| `src/hooks/usePatternPlayer.ts` | **NEW** - React hook wrapping SimplePatternPlayer |
| `src/components/Share/SharedPatternView.tsx` | Add play button, step indicator, loading/error states |
| `src/components/Share/SharedPatternView.css` | Play button & step indicator styles |
| `src/components/Share/ShareButton.tsx` | Change click behavior, add Make Private to modal, fix state sync |
| `src/components/Share/ShareButton.css` | Warning/destructive button styles |

---

## Implementation Order

1. **Create `SimplePatternPlayer` class** - Standalone audio playback (own AudioEngine)
2. **Create `usePatternPlayer` hook** - React wrapper with lifecycle management
3. **Update SharedPatternView** - Integrate play button and step indicator
4. **Update ShareButton** - New modal behavior with Make Private

---

## Verification

### Share Page Playback
1. Open a share link in incognito: `http://localhost:5176/p/{slug}`
2. Click "Play Pattern" button
3. Verify:
   - Audio plays the pattern
   - Current step is highlighted on the grid
   - Stop button stops playback
   - Can play/stop multiple times

### ShareButton UX
1. Create a pattern, click "Share" → modal appears, copy link works
2. Close modal, click "Shared" button again → modal reappears (not unshared)
3. In modal, click "Make Private" → warning shown, pattern becomes private
4. Verify share link no longer works

### Tests
- Run `npm test` - existing tests should pass
- Optional: Add tests for usePatternPlayer hook
