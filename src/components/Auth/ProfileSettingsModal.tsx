import { useState, useEffect, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import { useAuth } from '../../auth/AuthContext';
import { updateProfile, getProfile } from '../../storage/SupabaseStorage';
import './ProfileSettingsModal.css';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_DISPLAY_NAME_LENGTH = 50;

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load profile when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setLoadingProfile(true);
      setLoadError(false);
      setMessage(null);

      getProfile(user.id)
        .then((profile) => {
          if (profile === null) {
            // Profile doesn't exist yet, that's ok - start with empty
            setDisplayName('');
          } else {
            setDisplayName(profile.display_name ?? '');
          }
          setLoadingProfile(false);
        })
        .catch((err) => {
          console.error('Failed to load profile:', err);
          setLoadError(true);
          setLoadingProfile(false);
        });
    }
  }, [isOpen, user]);

  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      onClose();
    }
  }, [loading, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    const success = await updateProfile(user.id, {
      display_name: displayName,
    });

    setLoading(false);

    if (success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleRetry = () => {
    if (user) {
      setLoadingProfile(true);
      setLoadError(false);
      getProfile(user.id)
        .then((profile) => {
          setDisplayName(profile?.display_name ?? '');
          setLoadingProfile(false);
        })
        .catch(() => {
          setLoadError(true);
          setLoadingProfile(false);
        });
    }
  };

  const charactersRemaining = MAX_DISPLAY_NAME_LENGTH - displayName.length;

  return (
    <FocusTrap focusTrapOptions={{
      allowOutsideClick: true,
      fallbackFocus: '.profile-settings-modal',
    }}>
      <div className="profile-settings-overlay" onClick={handleOverlayClick}>
        <div
          className="profile-settings-modal"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-settings-title"
        >
        <h2 id="profile-settings-title">Profile Settings</h2>

        {message && (
          <div
            className={`profile-settings-message ${message.type}`}
            role={message.type === 'error' ? 'alert' : 'status'}
          >
            {message.text}
          </div>
        )}

        {loadError ? (
          <div className="profile-settings-error">
            <p>Failed to load profile settings.</p>
            <button onClick={handleRetry} className="profile-settings-retry">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="profile-settings-field">
              <label htmlFor="display-name">Display Name</label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                disabled={loadingProfile || loading}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                aria-describedby="display-name-hint display-name-count"
              />
              <div className="profile-settings-field-footer">
                <p id="display-name-hint" className="profile-settings-hint">
                  This name will appear on your shared patterns when you opt in.
                </p>
                <span
                  id="display-name-count"
                  className={`profile-settings-char-count ${charactersRemaining <= 10 ? 'low' : ''}`}
                >
                  {charactersRemaining}
                </span>
              </div>
            </div>

            <div className="profile-settings-actions">
              <button
                className="profile-settings-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="profile-settings-save"
                onClick={handleSave}
                disabled={loading || loadingProfile}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </FocusTrap>
  );
}
