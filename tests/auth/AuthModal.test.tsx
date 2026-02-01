import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '../../src/components/Auth/AuthModal';
import { AuthProvider } from '../../src/auth/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { createMockUser, createMockSession } from '../mocks/supabase';

// Get the mocked supabase
const mockSupabase = vi.mocked(supabase);

// Wrapper component that provides auth context
function renderWithAuth(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
}

describe('AuthModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockClear();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  describe('modal behavior', () => {
    it('renders when isOpen is true', async () => {
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('does not render when isOpen is false', () => {
      renderWithAuth(<AuthModal isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const backdrop = screen.getByTestId('auth-modal-backdrop');
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('sign in form', () => {
    it('shows sign in form by default', async () => {
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('has email and password fields', async () => {
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it('submits sign in form with email and password', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser as never, session: mockSession as never },
        error: null,
      });

      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
      });

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // HTML5 validation should prevent submission
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('shows error message on failed sign in', async () => {
      const user = userEvent.setup();

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' } as never,
      });

      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('sign up form', () => {
    it('switches to sign up form', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      await user.click(screen.getByText(/create an account/i));

      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    });

    it('has email and password fields on sign up form', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      await user.click(screen.getByText(/create an account/i));

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('submits sign up form', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'new@example.com' });
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser as never, session: mockSession as never },
        error: null,
      });

      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      await user.click(screen.getByText(/create an account/i));

      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
        });
      });
    });

    it('shows error for existing email', async () => {
      const user = userEvent.setup();

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered' } as never,
      });

      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      await user.click(screen.getByText(/create an account/i));

      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(screen.getByText(/account with this email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Google OAuth', () => {
    it('has Google sign in button', async () => {
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      });
    });

    it('initiates Google OAuth on button click', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

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

  describe('loading states', () => {
    it('shows loading state during sign in', async () => {
      const user = userEvent.setup();

      // Make sign in take some time
      mockSupabase.auth.signInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { user: null, session: null },
          error: null,
        }), 100))
      );

      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Button should show loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });

  describe('form switching', () => {
    it('can switch from sign up back to sign in', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Sign In', { selector: 'h2' })).toBeInTheDocument();
      });

      // Switch to sign up
      const createAccountButton = screen.getByRole('button', { name: /create an account/i });
      await user.click(createAccountButton);

      await waitFor(() => {
        expect(screen.getByText('Sign Up', { selector: 'h2' })).toBeInTheDocument();
      });

      // Switch back to sign in - use the button within the switch-mode paragraph
      const signInLink = screen.getByRole('button', { name: /^sign in$/i });
      await user.click(signInLink);

      await waitFor(() => {
        expect(screen.getByText('Sign In', { selector: 'h2' })).toBeInTheDocument();
      });
    });
  });
});
