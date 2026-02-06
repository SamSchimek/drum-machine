# Drum Machine Roadmap

## Current Sprint

### 1. Quick Cleanup
- [x] Remove dead `isBarStart` code from Grid.tsx, GridCell.tsx, SharedPatternView.tsx
- [x] Add focus trapping to AuthModal and ProfileSettingsModal (using focus-trap-react)
- [x] Create logger utility for dev-only logging (src/utils/logger.ts)
- [x] Add `prefers-reduced-motion` support to animations

### 2. Theme System (Login-Gated)
- [x] Create ThemeContext with theme definitions
- [x] Add theme CSS variables for each palette
- [x] Create theme selector UI component
- [ ] Add `theme` column to Supabase profiles table (run migration)
- [x] Gate theme selection behind login (show preview, require auth to apply)
- [x] Persist theme choice to user profile

**Themes:**
| Theme | Primary | Secondary | Vibe |
|-------|---------|-----------|------|
| Bloom (default) | `#c4b0e0` | `#e0b0c8` | Retro synth |
| Sunset | `#e8a87c` | `#d4798a` | Warm analog |
| Midnight | `#6bb5ff` | `#a78bfa` | Cool digital |
| Forest | `#86d9a0` | `#c9e4a8` | Organic/nature |
| Neon | `#ff6b9d` | `#c084fc` | 80s arcade |
| Monochrome | `#a0a0a0` | `#d0d0d0` | Classic hardware |

### 3. Remix Button
- [ ] Add "Remix" button to transport or grid area
- [ ] Use existing PatternGenerator ML to create variation of current beat
- [ ] Preserve some elements (e.g., kick pattern) while varying others
- [ ] Option to keep or discard remix result
- [ ] Animate transition between original and remix

---

## Backlog

### Core Functionality
- [ ] Undo/redo for grid changes
- [ ] Copy/paste patterns
- [ ] Pattern chaining (A→B→A→C sequence)
- [ ] Per-track volume controls
- [ ] Export audio to WAV/MP3
- [ ] Grid zoom (8/16/32 step toggle)

### UI/UX
- [ ] Keyboard shortcuts (space=play, numbers=patterns)
- [ ] Mobile touch gestures
- [ ] Beat markers (visual 1-2-3-4)
- [ ] Light mode theme option

### Social Features
- [ ] Browse/discover public patterns
- [ ] Pattern remix/fork from shared
- [ ] User profile pages
- [ ] Pattern comments

### Audio Enhancements
- [ ] Sound kit selector (808, 909, acoustic, electronic)
- [ ] Effects (reverb, delay per track)
- [ ] Sidechain compression
- [ ] Tempo tap

### Technical Debt
- [ ] Split TutorialContext (630 lines) into smaller modules
- [ ] Split DrumMachineContext (492 lines)
- [ ] Add integration tests for save→load→share flow
- [ ] Debounce ML training after pattern operations
- [ ] Handle localStorage quota exceeded
- [ ] Centralize error logging utility

### Auth Improvements
- [ ] Password reset flow
- [ ] Email verification
- [ ] Feature unlock tiers (limit anonymous saves)

---

## Completed
- [x] Tutorial fade-in animations
- [x] Display font consistency in user menu
- [x] Change "Welcome back" to "Sign In"
