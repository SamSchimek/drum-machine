import { vi } from 'vitest';

// Types for Supabase responses
export interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

export interface MockSession {
  user: MockUser;
  access_token: string;
  refresh_token: string;
}

// Helper to create mock user
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create mock session
export function createMockSession(user?: MockUser): MockSession {
  return {
    user: user || createMockUser(),
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  };
}

// Chainable query builder mock
export function createQueryBuilder() {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(),
  };

  // Make the builder thenable (can be awaited directly)
  builder.then = (resolve: (value: { data: unknown; error: unknown }) => void) => {
    return Promise.resolve({ data: [], error: null }).then(resolve);
  };

  return builder;
}

// Create the mock Supabase client
export function createMockSupabaseClient() {
  const queryBuilder = createQueryBuilder();

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: 'https://oauth.example.com', provider: 'google' },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn((callback) => {
        // Store callback for manual triggering in tests
        (createMockSupabaseClient as { authCallback?: typeof callback }).authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
    },
    from: vi.fn(() => queryBuilder),
    // Expose query builder for test assertions
    _queryBuilder: queryBuilder,
  };
}

// Singleton mock instance for tests
export const mockSupabase = createMockSupabaseClient();

// Helper to reset all mocks
export function resetSupabaseMocks() {
  const newMock = createMockSupabaseClient();
  Object.assign(mockSupabase, newMock);
}

// Helper to simulate auth state change
export function simulateAuthStateChange(
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED',
  session: MockSession | null
) {
  const callback = (mockSupabase.auth.onAuthStateChange as { authCallback?: (event: string, session: MockSession | null) => void }).authCallback;
  if (callback) {
    callback(event, session);
  }
}
