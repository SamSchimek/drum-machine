import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { createMockUser, createMockSession } from '../mocks/supabase';

// Get the mocked supabase
const mockSupabase = vi.mocked(supabase);

// Test component to access auth context
function TestConsumer() {
  const { user, loading, error, signInWithEmail, signInWithGoogle, signUp, signOut } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => signInWithEmail('test@example.com', 'password123')}>
        Sign In Email
      </button>
      <button onClick={() => signInWithGoogle()}>Sign In Google</button>
      <button onClick={() => signUp('new@example.com', 'password123')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  describe('initial state', () => {
    it('starts with loading true and user null', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('checks existing session on mount', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      });
    });

    it('loads existing session if present', async () => {
      const mockUser = createMockUser({ email: 'existing@example.com' });
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession as never },
        error: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('existing@example.com');
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });
  });

  describe('signInWithEmail', () => {
    it('calls Supabase auth signInWithPassword', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser as never, session: mockSession as never },
        error: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Sign In Email'));

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('updates user state on successful sign in', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'test@example.com' });
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser as never, session: mockSession as never },
        error: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Sign In Email'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });

    it('sets error on failed sign in', async () => {
      const user = userEvent.setup();

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' } as never,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Sign In Email'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('initiates OAuth flow', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Sign In Google'));

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.any(String),
          },
        });
      });
    });
  });

  describe('signUp', () => {
    it('calls Supabase auth signUp', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'new@example.com' });
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser as never, session: mockSession as never },
        error: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
        });
      });
    });

    it('sets error on sign up failure', async () => {
      const user = userEvent.setup();

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email already registered' } as never,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already registered');
      });
    });
  });

  describe('signOut', () => {
    it('calls Supabase auth signOut', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession as never },
        error: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });
    });

    it('clears user state on sign out', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession as never },
        error: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });
  });

  describe('auth state change subscription', () => {
    it('subscribes to auth state changes on mount', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
