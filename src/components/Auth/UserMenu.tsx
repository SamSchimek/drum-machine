import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTutorial } from '../../context/TutorialContext';
import { AuthModal } from './AuthModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import './UserMenu.css';

export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const { isSignupStep, onAuthComplete } = useTutorial();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    setShowSettingsModal(true);
  };

  if (loading) {
    return (
      <div className="user-menu">
        <div className="user-menu-loading">...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-menu">
        <button
          className={`user-menu-signin-button ${isSignupStep ? 'tutorial-highlight' : ''}`}
          onClick={() => setShowAuthModal(true)}
        >
          {isSignupStep ? 'Sign Up' : 'Sign In'}
        </button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={isSignupStep ? 'signup' : 'signin'}
          onAuthSuccess={isSignupStep ? onAuthComplete : undefined}
        />
      </div>
    );
  }

  // Get user initial for avatar
  const initial = user.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="user-menu" ref={dropdownRef}>
      <button
        className="user-menu-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <div className="user-avatar">{initial}</div>
      </button>

      {showDropdown && (
        <div className="user-menu-dropdown">
          <div className="user-menu-email">{user.email}</div>
          <hr className="user-menu-divider" />
          <button
            className="user-menu-item"
            onClick={handleSettingsClick}
          >
            Settings
          </button>
          <button
            className="user-menu-item"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      )}

      <ProfileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
