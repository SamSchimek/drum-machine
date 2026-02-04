# Share Screen UI Improvements & Display Name Feature

## Overview
Improve the shared pattern view UI (centering, larger pattern) and add the ability for logged-in users to set their display name.

## Files to Modify

### 1. `src/components/Share/SharedPatternView.css`
**Goal:** Center content and enlarge pattern grid

**Changes:**
- `.shared-pattern-grid`: Add `margin: 0 auto` to center the grid
- `.shared-grid-cell`: Increase from `18px` to `28px`
- `.shared-grid-cells` gap: Increase from `2px` to `3px`
- `.shared-track-label`: Increase width from `80px` to `100px`, font-size from `0.75rem` to `0.85rem`
- Update media queries proportionally

### 2. `src/components/Share/SharedPatternView.tsx`
**Goal:** Improve title/creator display format

**Changes:**
- Update header to show: `"Title" by Creator` on one line when creator exists
- Show just `"Title"` when no creator or showCreatorName is false
- Move BPM below the title line

**New header format:**
```tsx
<h1>"{pattern.name}"</h1>
{creatorDisplay && <span className="shared-pattern-byline">by {creatorDisplay}</span>}
```

### 3. `src/storage/SupabaseStorage.ts`
**Goal:** Add profile update function

**Add function:**
```typescript
export async function updateProfile(
  userId: string,
  updates: { display_name?: string }
): Promise<boolean>
```

### 4. `src/components/Auth/UserMenu.tsx`
**Goal:** Add profile settings button and modal

**Changes:**
- Add "Settings" button to dropdown menu
- Import and use new ProfileSettingsModal component
- Add state for modal open/close

### 5. `src/components/Auth/ProfileSettingsModal.tsx` (new file)
**Goal:** Modal for editing display name

**Features:**
- Input field for display name
- Save/Cancel buttons
- Loading state during save
- Success/error feedback

### 6. `src/components/Auth/ProfileSettingsModal.css` (new file)
**Goal:** Styles for profile settings modal

### 7. `src/components/Auth/index.ts`
**Goal:** Export new component

**Add:** Export ProfileSettingsModal

## Implementation Order

1. **CSS improvements** - SharedPatternView.css (center grid, larger cells)
2. **Header format** - SharedPatternView.tsx (title by creator format)
3. **Profile update function** - SupabaseStorage.ts
4. **Profile modal** - New ProfileSettingsModal component
5. **UserMenu integration** - Add settings button

## Size Changes Summary

| Element | Current | New |
|---------|---------|-----|
| Grid cell (base) | 18×18px | 28×28px |
| Grid cell (900px) | 14×14px | 20×20px |
| Grid cell (600px) | 10×10px | 14×14px |
| Track label width | 80px | 100px |
| Grid cells gap | 2px | 3px |

## Review Notes & Issues to Address

### 1. Database: Use Upsert Instead of Update
Profile row may not exist for existing users. Use `upsert` instead of `update`:
```typescript
export async function updateProfile(
  userId: string,
  updates: { display_name?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      display_name: updates.display_name?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  return !error;
}
```

### 2. Validation Requirements
- Max display name length: 50 characters
- Trim whitespace before saving
- Allow empty string to clear display name

### 3. Fetch Current Display Name
ProfileSettingsModal must fetch current display name on open:
```typescript
useEffect(() => {
  if (isOpen && userId) {
    supabase.from('profiles').select('display_name').eq('id', userId).single()
      .then(({ data }) => setDisplayName(data?.display_name ?? ''));
  }
}, [isOpen, userId]);
```

### 4. Accessibility Requirements
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Input: Associated `<label>` with `htmlFor`
- Error messages: `role="alert"`
- Focus trap and Escape key to close

---

## TDD Test Plan

### Test Files to Create

| File | Purpose |
|------|---------|
| `tests/auth/ProfileSettingsModal.test.tsx` | Modal component tests |
| `tests/share/SharedPatternView.test.tsx` | Display logic tests |

### Test Cases for ProfileSettingsModal

1. **Modal behavior**: renders when open, closes on backdrop click, closes on Escape
2. **Display name field**: shows input, pre-fills current value, allows editing
3. **Save**: calls updateProfile, shows loading state, shows success/error feedback
4. **Cancel**: closes without saving
5. **Validation**: trims whitespace, allows empty (to clear)

### Test Cases for SharedPatternView

1. **Loading state**: shows spinner initially
2. **Error state**: shows message when pattern not found
3. **Title display**: shows `"Name"` in quotes
4. **Creator display**: shows `by Creator` when showCreatorName=true and displayName exists
5. **No creator**: hides byline when showCreatorName=false or displayName=null

### Test Cases for updateProfile

1. **Success**: upserts profile, returns true
2. **Error**: returns false on database error
3. **Empty name**: allows null/empty to clear display name
4. **Filters by userId**: only updates the specified user's profile

---

## Verification
1. `npm run build` - no errors
2. `npm test` - all tests pass
3. Open a share link - grid should be centered and larger
4. Title should show `"Name" by Creator` format when creator opted in
5. Log in and open user menu - should see Settings option
6. Click Settings - modal should open with display name field
7. Save display name - should persist and appear on shared patterns
8. Test with user that has no profile row (should create via upsert)
