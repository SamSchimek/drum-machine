import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES, ThemeId, applyThemeToDOM } from '../../context/ThemeContext';
import './ThemeSelector.css';

export function ThemeSelector() {
  const { themeId, setTheme, availableThemes, isLocked } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        handlePreviewEnd();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeClick = async (id: ThemeId) => {
    if (isLocked) {
      // Just close - user sees "Sign in to unlock" message
      return;
    }
    await setTheme(id);
    setIsOpen(false);
  };

  const handlePreview = (id: ThemeId) => {
    if (!isLocked) {
      setPreviewTheme(id);
      applyThemeToDOM(THEMES[id]);
    }
  };

  const handlePreviewEnd = () => {
    if (previewTheme) {
      applyThemeToDOM(THEMES[themeId]);
      setPreviewTheme(null);
    }
  };

  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button
        className="theme-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span
          className="theme-swatch"
          style={{ backgroundColor: THEMES[themeId].colors.accentPrimary }}
        />
        <span className="theme-selector-label">Theme</span>
        {isLocked && <span className="theme-lock-icon">🔒</span>}
      </button>

      {isOpen && (
        <div className="theme-selector-dropdown" role="menu">
          <div className="theme-selector-header">
            {isLocked ? 'Sign in to unlock themes' : 'Choose a theme'}
          </div>
          <div className="theme-options">
            {availableThemes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-option ${theme.id === themeId ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => handleThemeClick(theme.id)}
                onMouseEnter={() => handlePreview(theme.id)}
                onMouseLeave={handlePreviewEnd}
                role="menuitem"
                aria-current={theme.id === themeId ? 'true' : undefined}
              >
                <span
                  className="theme-option-swatch"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.accentPrimary} 0%, ${theme.colors.accentSecondary} 100%)`,
                  }}
                />
                <span className="theme-option-name">{theme.name}</span>
                {theme.id === themeId && <span className="theme-check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
