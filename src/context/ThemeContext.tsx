import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getProfile, updateProfile } from '../storage/SupabaseStorage';
import { logger } from '../utils/logger';

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
    bgDeepest: string;
    bgDeep: string;
    bgSurface: string;
    bgRaised: string;
    bgElevated: string;
    borderSubtle: string;
    borderDefault: string;
    borderStrong: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textMuted: string;
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
      bgDeepest: '#14101a',
      bgDeep: '#1a1528',
      bgSurface: '#241d35',
      bgRaised: '#302542',
      bgElevated: '#3d3055',
      borderSubtle: '#3a3058',
      borderDefault: '#4d4068',
      borderStrong: '#5f5080',
      textPrimary: '#f0e8f8',
      textSecondary: '#b8a8c8',
      textTertiary: '#8878a0',
      textMuted: '#685888',
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
      bgDeepest: '#161210',
      bgDeep: '#1e1814',
      bgSurface: '#2a221c',
      bgRaised: '#382e26',
      bgElevated: '#4a3e34',
      borderSubtle: '#3e3428',
      borderDefault: '#564a3c',
      borderStrong: '#6e5f4e',
      textPrimary: '#f5ece0',
      textSecondary: '#c8b8a0',
      textTertiary: '#9a8870',
      textMuted: '#7a6850',
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
      bgDeepest: '#0c1018',
      bgDeep: '#121a26',
      bgSurface: '#1a2438',
      bgRaised: '#24304a',
      bgElevated: '#303e5c',
      borderSubtle: '#2a3854',
      borderDefault: '#3c4e6e',
      borderStrong: '#4e6088',
      textPrimary: '#e0e8f5',
      textSecondary: '#a0b0c8',
      textTertiary: '#7088a8',
      textMuted: '#506888',
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
      bgDeepest: '#0e140e',
      bgDeep: '#141e14',
      bgSurface: '#1c2c1c',
      bgRaised: '#283828',
      bgElevated: '#344634',
      borderSubtle: '#2a3e2a',
      borderDefault: '#3e563e',
      borderStrong: '#4e6e4e',
      textPrimary: '#e4f0e4',
      textSecondary: '#a8c4a8',
      textTertiary: '#78a078',
      textMuted: '#588058',
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
      bgDeepest: '#0a0a10',
      bgDeep: '#10101c',
      bgSurface: '#18182c',
      bgRaised: '#22223c',
      bgElevated: '#2e2e50',
      borderSubtle: '#2a2a48',
      borderDefault: '#3e3e64',
      borderStrong: '#52527e',
      textPrimary: '#f0ecff',
      textSecondary: '#b8b0d0',
      textTertiary: '#8880a8',
      textMuted: '#686088',
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
      bgDeepest: '#121216',
      bgDeep: '#18181e',
      bgSurface: '#1e1e26',
      bgRaised: '#282830',
      bgElevated: '#34343e',
      borderSubtle: '#2e2e38',
      borderDefault: '#40404c',
      borderStrong: '#545460',
      textPrimary: '#e4e4ea',
      textSecondary: '#a8a8b4',
      textTertiary: '#787888',
      textMuted: '#585868',
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
const DEFAULT_THEME: ThemeId = 'bloom';

export function isValidThemeId(id: string): id is ThemeId {
  return THEME_IDS.includes(id as ThemeId);
}

interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => Promise<void>;
  availableThemes: Theme[];
  isLocked: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--accent-primary', theme.colors.accentPrimary);
  root.style.setProperty('--accent-primary-hover', theme.colors.accentPrimaryHover);
  root.style.setProperty('--accent-primary-dim', theme.colors.accentPrimaryDim);
  root.style.setProperty('--accent-primary-glow', theme.colors.accentPrimaryGlow);
  root.style.setProperty('--accent-secondary', theme.colors.accentSecondary);
  root.style.setProperty('--accent-warm', theme.colors.accentWarm);
  root.style.setProperty('--bg-deepest', theme.colors.bgDeepest);
  root.style.setProperty('--bg-deep', theme.colors.bgDeep);
  root.style.setProperty('--bg-surface', theme.colors.bgSurface);
  root.style.setProperty('--bg-raised', theme.colors.bgRaised);
  root.style.setProperty('--bg-elevated', theme.colors.bgElevated);
  root.style.setProperty('--border-subtle', theme.colors.borderSubtle);
  root.style.setProperty('--border-default', theme.colors.borderDefault);
  root.style.setProperty('--border-strong', theme.colors.borderStrong);
  root.style.setProperty('--text-primary', theme.colors.textPrimary);
  root.style.setProperty('--text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--text-tertiary', theme.colors.textTertiary);
  root.style.setProperty('--text-muted', theme.colors.textMuted);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);
  const loadingRef = useRef(false);

  // Load theme from profile when user logs in
  useEffect(() => {
    if (user) {
      // Track if this effect is still active to prevent race conditions
      let cancelled = false;
      loadingRef.current = true;

      getProfile(user.id)
        .then((profile) => {
          if (cancelled) return;
          if (profile?.theme && isValidThemeId(profile.theme)) {
            setThemeId(profile.theme);
          }
        })
        .catch((error) => {
          if (cancelled) return;
          logger.error('Failed to load theme preference:', error);
          // Keep default theme on error
        })
        .finally(() => {
          if (!cancelled) {
            loadingRef.current = false;
          }
        });

      return () => {
        cancelled = true;
      };
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
