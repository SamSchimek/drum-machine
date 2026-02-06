import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getProfile, updateProfile } from '../storage/SupabaseStorage';

export type ThemeId = 'bloom' | 'sunset' | 'midnight' | 'forest' | 'neon' | 'monochrome';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    accentPrimary: string;
    accentPrimaryHover: string;
    accentPrimaryDim: string;
    accentPrimaryGlow: string;
    accentSecondary: string;
    accentWarm: string;
  };
}

export const THEMES: Record<ThemeId, Theme> = {
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    colors: {
      accentPrimary: '#c4b0e0',
      accentPrimaryHover: '#d8c8f0',
      accentPrimaryDim: 'rgba(196,176,224,0.18)',
      accentPrimaryGlow: 'rgba(196,176,224,0.45)',
      accentSecondary: '#e0b0c8',
      accentWarm: '#e0c8a8',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      accentPrimary: '#e8a87c',
      accentPrimaryHover: '#f0c0a0',
      accentPrimaryDim: 'rgba(232,168,124,0.18)',
      accentPrimaryGlow: 'rgba(232,168,124,0.45)',
      accentSecondary: '#d4798a',
      accentWarm: '#f0d8a0',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      accentPrimary: '#6bb5ff',
      accentPrimaryHover: '#90c8ff',
      accentPrimaryDim: 'rgba(107,181,255,0.18)',
      accentPrimaryGlow: 'rgba(107,181,255,0.45)',
      accentSecondary: '#a78bfa',
      accentWarm: '#7dd3fc',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    colors: {
      accentPrimary: '#86d9a0',
      accentPrimaryHover: '#a8e8b8',
      accentPrimaryDim: 'rgba(134,217,160,0.18)',
      accentPrimaryGlow: 'rgba(134,217,160,0.45)',
      accentSecondary: '#c9e4a8',
      accentWarm: '#d4e8a8',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    colors: {
      accentPrimary: '#ff6b9d',
      accentPrimaryHover: '#ff8fb8',
      accentPrimaryDim: 'rgba(255,107,157,0.18)',
      accentPrimaryGlow: 'rgba(255,107,157,0.45)',
      accentSecondary: '#c084fc',
      accentWarm: '#fbbf24',
    },
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      accentPrimary: '#b0b0b0',
      accentPrimaryHover: '#d0d0d0',
      accentPrimaryDim: 'rgba(176,176,176,0.18)',
      accentPrimaryGlow: 'rgba(176,176,176,0.45)',
      accentSecondary: '#a0a0a0',
      accentWarm: '#c8c8c8',
    },
  },
};

const THEME_IDS = Object.keys(THEMES) as ThemeId[];
const DEFAULT_THEME: ThemeId = 'bloom';

interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => Promise<void>;
  availableThemes: Theme[];
  isLocked: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--accent-primary', theme.colors.accentPrimary);
  root.style.setProperty('--accent-primary-hover', theme.colors.accentPrimaryHover);
  root.style.setProperty('--accent-primary-dim', theme.colors.accentPrimaryDim);
  root.style.setProperty('--accent-primary-glow', theme.colors.accentPrimaryGlow);
  root.style.setProperty('--accent-secondary', theme.colors.accentSecondary);
  root.style.setProperty('--accent-warm', theme.colors.accentWarm);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);

  // Load theme from profile when user logs in
  useEffect(() => {
    if (user) {
      getProfile(user.id).then((profile) => {
        if (profile?.theme && THEME_IDS.includes(profile.theme as ThemeId)) {
          setThemeId(profile.theme as ThemeId);
        }
      });
    } else {
      // Reset to default when logged out
      setThemeId(DEFAULT_THEME);
    }
  }, [user]);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyThemeToDOM(THEMES[themeId]);
  }, [themeId]);

  const setTheme = async (id: ThemeId) => {
    if (!user) return;

    setThemeId(id);
    applyThemeToDOM(THEMES[id]);

    // Persist to database
    await updateProfile(user.id, { theme: id });
  };

  const value: ThemeContextType = {
    theme: THEMES[themeId],
    themeId,
    setTheme,
    availableThemes: Object.values(THEMES),
    isLocked: !user,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
