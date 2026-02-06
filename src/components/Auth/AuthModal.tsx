import { useState, FormEvent, useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { useAuth } from '../../auth/AuthContext';
import './AuthModal.css';

type AuthMode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuthSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin', onAuthSuccess }: AuthModalProps) {
  const { signInWithEmail, signInWithGoogle, signUp, error, loading, clearError, user } = useAuth();
  const wasOpen = useRef(false);
  const prevUser = useRef(user);

  // Close modal when user successfully authenticates
  useEffect(() => {
    if (isOpen && user && wasOpen.current) {
      // Call onAuthSuccess if user just authenticated (was null, now logged in)
      if (!prevUser.current && user && onAuthSuccess) {
        onAuthSuccess();
      }
      onClose();
    }
    wasOpen.current = isOpen;
    prevUser.current = user;
  }, [user, isOpen, onClose, onAuthSuccess]);

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Reset mode when modal opens with new initialMode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUp(email, password);
      }

      // Close modal on success (if no error was set)
      // Note: error state is set by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setEmail('');
    setPassword('');
    clearError();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <FocusTrap focusTrapOptions={{
      allowOutsideClick: true,
      fallbackFocus: '.auth-modal',
    }}>
      <div
        className="auth-modal-backdrop"
        data-testid="auth-modal-backdrop"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="auth-modal" tabIndex={-1}>
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h2 id="auth-modal-title" className="auth-modal-title">
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h2>

        {error && (
          <div className="auth-modal-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading
              ? mode === 'signin' ? 'Signing in...' : 'Signing up...'
              : mode === 'signin' ? 'Sign In' : 'Sign Up'
            }
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="auth-google-button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="auth-switch-mode">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={switchMode}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={switchMode}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
    </FocusTrap>
  );
}
