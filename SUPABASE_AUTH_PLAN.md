# Supabase Authentication & Deployment Plan

## Overview
Add Supabase authentication (email + Google OAuth) with cloud pattern storage, localStorage migration, shareable pattern links, and deploy to Vercel. Uses TDD approach.

## Supabase Credentials
Store in `.env` (gitignored):
```
VITE_SUPABASE_URL=https://stqczmqmtlguzgssjjqw.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```
Note: Anon key is public (client-side), but keep in env for flexibility.

---

## Phase 1: Supabase Database Setup

Run in Supabase SQL Editor:

```sql
-- Patterns table
CREATE TABLE public.patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (name != ''),
  grid JSONB NOT NULL,
  tempo INTEGER NOT NULL DEFAULT 120 CHECK (tempo >= 40 AND tempo <= 300),
  is_public BOOLEAN DEFAULT FALSE,
  share_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patterns_user_id ON public.patterns(user_id);
CREATE INDEX idx_patterns_share_slug ON public.patterns(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX idx_patterns_user_updated ON public.patterns(user_id, updated_at DESC);

-- Enable RLS
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies (separate for clarity)
CREATE POLICY "Users can select own patterns"
  ON public.patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
  ON public.patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON public.patterns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns"
  ON public.patterns FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared patterns"
  ON public.patterns FOR SELECT
  USING (is_public = TRUE OR share_slug IS NOT NULL);
```

**Supabase Dashboard config:**
1. Authentication > Providers > Enable Email (disable "Confirm email" for easier testing)
2. Authentication > Providers > Enable Google (requires Google Cloud OAuth credentials)

---

## Phase 2: Infrastructure Setup

### Install dependencies
```bash
npm install @supabase/supabase-js
```

### Create files
| File | Purpose |
|------|---------|
| `.env` | Supabase credentials (gitignored) |
| `.env.example` | Template for credentials |
| `src/lib/supabase.ts` | Supabase client with validation |
| `tests/mocks/supabase.ts` | Mock client for tests |

### Environment validation in `src/lib/supabase.ts`:
```typescript
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase env vars. Copy .env.example to .env');
}

export const supabase = createClient(url, key);
```

### Supabase mock structure (`tests/mocks/supabase.ts`):
```typescript
export const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};
```

---

## Phase 3: Auth Context (TDD)

### 3.1 Write tests first: `tests/auth/AuthContext.test.tsx`
- Initial state: user null, loading true
- signInWithEmail calls Supabase auth
- signInWithGoogle initiates OAuth
- signUp creates account
- signOut clears state
- Error handling for failed auth

### 3.2 Run tests - confirm they fail

### 3.3 Implement
| File | Purpose |
|------|---------|
| `src/auth/types.ts` | AuthState, AuthContextValue interfaces |
| `src/auth/AuthContext.tsx` | Provider with Supabase auth subscription |
| `src/auth/useAuth.ts` | Hook to consume auth context |

---

## Phase 4: Supabase Storage (TDD)

### 4.1 Write tests first: `tests/storage/SupabaseStorage.test.ts`
- savePattern creates record
- loadPattern fetches by ID
- getAllPatterns returns user's patterns
- deletePattern removes record
- makePublic generates share_slug
- getByShareSlug fetches public pattern
- Error handling for network failures
- Handles Supabase TIMESTAMPTZ → number conversion

### 4.2 Run tests - confirm they fail

### 4.3 Implement
| File | Purpose |
|------|---------|
| `src/storage/types.ts` | Async PatternStorageInterface |
| `src/storage/SupabaseStorage.ts` | Supabase implementation |

### 4.4 Type Compatibility Strategy

**Problem:** Current Pattern uses `createdAt: number` (ms), Supabase returns ISO strings.

**Solution:** Normalize in SupabaseStorage:
```typescript
// Convert Supabase row to local Pattern
function toPattern(row: SupabasePattern): Pattern {
  return {
    ...row,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}
```

**Extended Pattern type** (add to `src/types/index.ts`):
```typescript
export interface Pattern {
  id: string;
  name: string;
  grid: GridState;
  tempo: number;
  createdAt: number;
  updatedAt: number;
  // Optional cloud fields
  userId?: string;
  isPublic?: boolean;
  shareSlug?: string | null;
}
```

---

## Phase 5: Storage Adapter (TDD)

### 5.1 Write tests first: `tests/storage/StorageAdapter.test.ts`
- Uses localStorage when not authenticated
- Uses Supabase when authenticated
- migrateToCloud moves localStorage patterns to Supabase

### 5.2 Run tests - confirm they fail

### 5.3 Implement: `src/storage/StorageAdapter.ts`

---

## Phase 6: Auth UI Components (TDD)

### 6.1 Write tests first: `tests/auth/AuthModal.test.tsx`
- Modal opens/closes
- Sign in form with email/password
- Sign up form with confirmation
- Google OAuth button
- Form validation
- Loading/error states

### 6.2 Run tests - confirm they fail

### 6.3 Implement
| File | Purpose |
|------|---------|
| `src/components/Auth/AuthModal.tsx` | Login/signup modal |
| `src/components/Auth/AuthModal.css` | Modal styles (dark theme) |
| `src/components/Auth/UserMenu.tsx` | Header user dropdown |
| `src/components/Auth/UserMenu.css` | Menu styles |

---

## Phase 7: Integration

### Modify existing files

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add optional `userId`, `isPublic`, `shareSlug` to Pattern |
| `src/context/DrumMachineContext.tsx` | Make storage async, add loading states (see below) |
| `src/components/App/App.tsx` | Wrap with AuthProvider, add UserMenu to header |
| `src/components/App/App.css` | Header layout for user menu |
| `src/components/PatternBank/PatternBank.tsx` | Add share button, handle async loading |

### Critical: Async Context Refactor

**Current (sync):**
```typescript
const savePattern = useCallback((name: string) => {
  const pattern = patternStorage.savePattern({...});
  return pattern;
}, []);
```

**New (async with loading state):**
```typescript
// Add to state
patternsLoading: boolean;
patternError: string | null;

// Refactor callbacks
const savePattern = useCallback(async (name: string) => {
  dispatch({ type: 'SET_PATTERNS_LOADING', loading: true });
  try {
    const pattern = await storage.savePattern({...});
    const patterns = await storage.getAllPatterns();
    dispatch({ type: 'LOAD_PATTERNS', patterns });
    return pattern;
  } catch (error) {
    dispatch({ type: 'SET_PATTERN_ERROR', error: error.message });
    throw error;
  } finally {
    dispatch({ type: 'SET_PATTERNS_LOADING', loading: false });
  }
}, [storage]);
```

### Create share components
| File | Purpose |
|------|---------|
| `src/components/Share/ShareButton.tsx` | Toggle pattern public |
| `src/components/Share/ShareModal.tsx` | Copy link modal |

---

## Phase 8: Vercel Deployment

### 8.1 Supabase config
1. Dashboard > Authentication > URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app`

2. Google OAuth (Dashboard > Authentication > Providers)
   - Create Google Cloud OAuth credentials
   - Add redirect: `https://stqczmqmtlguzgssjjqw.supabase.co/auth/v1/callback`

### 8.2 Vercel setup
1. Connect GitHub repo
2. Build settings: `npm run build` → `dist`
3. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 8.3 Deploy
```bash
vercel --prod
```

---

## Migration Strategy

On user login/signup:
1. Check localStorage for patterns
2. Check Supabase for existing patterns (avoid duplicates by name)
3. Upload new patterns to Supabase with user_id
4. Track migration progress: `{ uploaded: string[], failed: string[] }`
5. On complete success: clear localStorage
6. On partial failure: keep failed patterns in localStorage, show toast with count

**Idempotency:** Use pattern name + grid hash to detect duplicates:
```typescript
const getPatternHash = (p: Pattern) =>
  `${p.name}-${JSON.stringify(p.grid)}`;
```

**User feedback:**
- "Migrating X patterns..." (loading)
- "Migrated X patterns to cloud" (success)
- "Migrated X patterns. Y failed - still saved locally" (partial)

---

## New File Structure

```
src/
├── lib/
│   └── supabase.ts
├── auth/
│   ├── AuthContext.tsx
│   ├── useAuth.ts
│   └── types.ts
├── storage/
│   ├── PatternStorage.ts      (existing - unchanged)
│   ├── SupabaseStorage.ts     (new)
│   ├── StorageAdapter.ts      (new)
│   └── types.ts               (new)
├── components/
│   ├── Auth/
│   │   ├── AuthModal.tsx
│   │   ├── AuthModal.css
│   │   ├── UserMenu.tsx
│   │   └── UserMenu.css
│   └── Share/
│       ├── ShareButton.tsx
│       └── ShareModal.tsx
tests/
├── mocks/
│   └── supabase.ts
├── auth/
│   ├── AuthContext.test.tsx
│   └── AuthModal.test.tsx
└── storage/
    ├── SupabaseStorage.test.ts
    └── StorageAdapter.test.ts
```

---

## Error Handling

Display user-friendly messages for:
| Error | Message |
|-------|---------|
| Network failure | "Couldn't connect. Patterns saved locally." |
| Email already exists | "Account exists. Try signing in." |
| Wrong password | "Incorrect password. Try again." |
| Permission denied | "Please sign in to save patterns." |
| Share slug collision | (Retry with new slug automatically) |

---

## Verification Checklist

1. **Unit tests**: `npm test` - all tests pass (including new auth/storage tests)
2. **Auth flow**:
   - Sign up with email → account created (check Supabase dashboard)
   - Sign in with Google → redirects and logs in
   - Sign out → clears session, reverts to localStorage
3. **Pattern sync**:
   - Save pattern while logged in → check Supabase table
   - Refresh page → pattern loads from cloud
   - Sign out → patterns hidden (still in cloud)
4. **Migration**:
   - Create 3 patterns while logged out
   - Sign up → toast shows "Migrated 3 patterns"
   - Check localStorage empty, Supabase has 3 patterns
5. **Sharing**:
   - Click share → modal shows link
   - Copy link, open in incognito → pattern loads
   - Original user clicks "Make Private" → incognito can't access
6. **Error handling**:
   - Disconnect network, try to save → shows error, saves to localStorage
   - Try to sign up with existing email → shows error message
7. **Production**: Full flow works on Vercel

---

## Critical Files to Modify

1. `src/context/DrumMachineContext.tsx` - Async storage, auth integration
2. `src/types/index.ts` - Extended Pattern type
3. `src/components/App/App.tsx` - AuthProvider wrapper, UserMenu
4. `src/components/PatternBank/PatternBank.tsx` - Share button
5. `tests/setup.ts` - Supabase mocks

---

## Implementation Status

All phases have been implemented:
- ✅ Phase 2: Infrastructure Setup
- ✅ Phase 3: Auth Context (TDD)
- ✅ Phase 4: Supabase Storage (TDD)
- ✅ Phase 5: Storage Adapter (TDD)
- ✅ Phase 6: Auth UI Components (TDD)
- ✅ Phase 7: Integration
- ⏳ Phase 1: Database Setup (requires manual SQL execution in Supabase)
- ⏳ Phase 8: Vercel Deployment (requires manual setup)

### Remaining Manual Steps:
1. Run the SQL from Phase 1 in Supabase SQL Editor
2. Add your Supabase anon key to `.env`
3. Enable Email and Google auth providers in Supabase dashboard
4. Configure Google OAuth credentials
5. Deploy to Vercel with environment variables
