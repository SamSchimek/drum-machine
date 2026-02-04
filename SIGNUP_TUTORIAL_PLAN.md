# Tutorial Sign Up Step Implementation Plan

## Summary
After saving their beat, non-logged-in users see a highlighted "Sign Up" button to maximize conversion. If they sign up, tutorial auto-advances to Share step. If they skip, they see a locked share button prompting signup.

## Flow

### Not Logged In:
```
Step 10: Save ("My First Beat")
    ↓
Step 11: Sign Up (highlighted button, top-right)
    - Caption: "Sign up to save your beats, unlock sharing mode, and earn upvotes from friends"
    - Click Sign Up → Modal opens (signup mode) → Auth completes → Auto-advance to Share (Step 12)
    - Click Next → Advance to Locked Share (Step 12)
    ↓
Step 12: Locked Share (if skipped signup)
    - Shows locked share button on first pattern
    - Click shows: "Sign up to unlock sharing mode"
    ↓
Step 13: AI Generator
```

### Logged In:
```
Step 10: Save
    ↓
(Auto-skip Step 11 - already logged in)
    ↓
Step 12: Share (normal functionality)
    ↓
Step 13: AI Generator
```

## Files to Modify

### 1. `src/context/TutorialContext.tsx`

**Constants:**
```typescript
const SAVE_STEP_INDEX = 10;
const SIGNUP_STEP_INDEX = 11;
const SHARE_STEP_INDEX = 12;
const AI_GENERATOR_STEP_INDEX = 13;
```

**Interface additions:**
```typescript
isSignupStep: boolean;
onAuthComplete: () => void;
```

**TUTORIAL_STEPS changes:**
- Insert new step at index 11:
```typescript
{
  target: '.user-menu-signin-button',
  content: 'Sign up to save your beats, unlock sharing mode, and earn upvotes from friends',
  position: 'left',
}
```
- Current share step becomes index 12
- Current AI generator step becomes index 13

**Logic additions:**
- `isSignupStep = isActive && currentStep === SIGNUP_STEP_INDEX && !user`
- Auto-skip signup step if user is logged in (in nextStep and auto-advance)
- `onAuthComplete` callback: advances from signup step to share step

**Import needed:**
- Import `useAuth` to check if user is logged in

### 2. `src/components/Auth/UserMenu.tsx`

**Changes:**
- Import `useTutorial` context
- Get `isSignupStep` and `onAuthComplete` from tutorial context
- Change button text: `{isSignupStep ? 'Sign Up' : 'Sign In'}`
- Add highlight class: `className={`user-menu-signin-button ${isSignupStep ? 'tutorial-highlight' : ''}`}`
- Pass `initialMode="signup"` to AuthModal when `isSignupStep` is true
- On successful auth (user changes from null to logged in during signup step), call `onAuthComplete()`

### 3. `src/components/Auth/AuthModal.tsx`

**Interface changes:**
```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode; // NEW
}
```

**Changes:**
- Accept `initialMode` prop, default to 'signin'
- Initialize mode state with `initialMode`: `useState<AuthMode>(initialMode ?? 'signin')`
- Reset mode when modal opens with new initialMode
- Ensure z-index is higher than tutorial overlay (currently 1000, tutorial is ~1000-1001)

**CSS (AuthModal.css):**
```css
.auth-modal-backdrop {
  z-index: 2000; /* Higher than tutorial overlay */
}
```

### 4. `src/components/Share/ShareButton.tsx`

**Changes for non-logged-in users:**
- Instead of returning `null` when `!user`, return a locked button during tutorial
- Get `isShareStep` from tutorial context
- If `!user && isShareStep`: show locked share button
- If `!user && !isShareStep`: return null (current behavior)

**Locked button behavior:**
```tsx
if (!user) {
  if (isShareStep) {
    return (
      <button
        className="share-button locked"
        onClick={() => alert('Sign up to unlock sharing mode')}
        title="Sign up to share"
      >
        Share
      </button>
    );
  }
  return null;
}
```

**CSS (ShareButton.css):**
```css
.share-button.locked {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 5. `src/components/Auth/UserMenu.css`

**Add tutorial highlight:**
```css
.user-menu-signin-button.tutorial-highlight {
  animation: signup-pulse 1.2s ease-in-out infinite;
}

@keyframes signup-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.8); }
  50% { box-shadow: 0 0 15px 5px rgba(255, 87, 34, 0.5); }
}
```

## Edge Cases

1. **User signs up via Google OAuth**: Should work the same - `onAuthComplete` triggers when user state changes
2. **User closes modal without signing up**: Tutorial stays on signup step, user can click Next to skip
3. **User is already logged in when reaching step 11**: Auto-skip to step 12
4. **User logs out during tutorial**: Not handled (edge case, low priority)
5. **Resuming tutorial at step 11 while logged in**: Should auto-skip to step 12

## Testing Checklist

- [ ] Non-logged-in user sees "Sign Up" button highlighted at step 11
- [ ] Clicking Sign Up opens modal in signup mode
- [ ] Auth modal is fully visible (not obscured by tutorial)
- [ ] After signup completes, tutorial auto-advances to Share step
- [ ] Clicking Next skips to locked share step
- [ ] Locked share button shows message when clicked
- [ ] Logged-in user auto-skips step 11
- [ ] All existing tutorial tests still pass
