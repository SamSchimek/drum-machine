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

// --- Derived color helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('');
}

function mix(c1: string, c2: string, p1: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const p2 = 1 - p1;
  return rgbToHex(r1 * p1 + r2 * p2, g1 * p1 + g2 * p2, b1 * p1 + b2 * p2);
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface DerivedColors {
  btnPrimaryTop: string; btnPrimaryMid: string; btnPrimaryBot: string;
  btnPrimaryTopHover: string; btnPrimaryMidHover: string; btnPrimaryBotHover: string;
  btnPrimaryTopActive: string; btnPrimaryBotActive: string;
  btnPrimaryBorderTop: string;
  btnSecondaryTop: string; btnSecondaryMid: string; btnSecondaryBot: string;
  btnSecondaryTopHover: string; btnSecondaryMidHover: string; btnSecondaryBotHover: string;
  stepBgTop: string; stepBgMid: string; stepBgBot: string;
  stepBgDownbeatTop: string; stepBgDownbeatMid: string; stepBgDownbeatBot: string;
  patternItemTop: string; patternItemMid: string; patternItemBot: string;
  patternItemTopHover: string; patternItemMidHover: string; patternItemBotHover: string;
  playingTintLight: string; playingTintMid: string; playingTintDark: string;
  playingTintLightHover: string; playingTintMidHover: string; playingTintDarkHover: string;
  kbdBgTop: string; kbdBgMid: string; kbdBgBot: string;
  menuItemHover: string; menuItemFocus: string;
  inputFocusGlow: string; headerTextGlow: string;
}

// Exact pre-theme hardcoded values for Bloom
const BLOOM_DERIVED: DerivedColors = {
  btnPrimaryTop: '#3c3250', btnPrimaryMid: '#2a2240', btnPrimaryBot: '#1a1525',
  btnPrimaryTopHover: '#463c5f', btnPrimaryMidHover: '#342c4a', btnPrimaryBotHover: '#241f2f',
  btnPrimaryTopActive: '#231c32', btnPrimaryBotActive: '#2a2240',
  btnPrimaryBorderTop: 'rgba(184,160,210,0.5)',
  btnSecondaryTop: '#322d3c', btnSecondaryMid: '#252030', btnSecondaryBot: '#1a1520',
  btnSecondaryTopHover: '#3c344b', btnSecondaryMidHover: '#302a40', btnSecondaryBotHover: '#252030',
  stepBgTop: '#211b2c', stepBgMid: '#1c1726', stepBgBot: '#181320',
  stepBgDownbeatTop: '#2a223a', stepBgDownbeatMid: '#231c30', stepBgDownbeatBot: '#1c1726',
  patternItemTop: '#282236', patternItemMid: '#231d30', patternItemBot: '#1e192a',
  patternItemTopHover: '#302841', patternItemMidHover: '#2a2337', patternItemBotHover: '#241e30',
  playingTintLight: '#5a4a6a', playingTintMid: '#3a2a4a', playingTintDark: '#2a1a3a',
  playingTintLightHover: '#6a5a7a', playingTintMidHover: '#4a3a5a', playingTintDarkHover: '#3a2a4a',
  kbdBgTop: '#3c3746', kbdBgMid: '#2d2837', kbdBgBot: '#231e2d',
  menuItemHover: 'rgba(184,160,210,0.1)', menuItemFocus: 'rgba(184,160,210,0.15)',
  inputFocusGlow: 'rgba(232,224,240,0.08)', headerTextGlow: 'rgba(184,160,210,0.3)',
};

function computeDerivedColors(theme: Theme): DerivedColors {
  if (theme.id === 'bloom') return BLOOM_DERIVED;

  const c = theme.colors;
  const G3 = '#333333';
  const G4 = '#444444';

  return {
    btnPrimaryTop: mix(c.bgRaised, c.accentPrimary, 0.90),
    btnPrimaryMid: mix(c.bgSurface, c.accentPrimary, 0.95),
    btnPrimaryBot: mix(c.bgDeepest, c.accentPrimary, 0.95),
    btnPrimaryTopHover: mix(c.bgRaised, c.accentPrimary, 0.80),
    btnPrimaryMidHover: mix(c.bgSurface, c.accentPrimary, 0.85),
    btnPrimaryBotHover: mix(c.bgDeepest, c.accentPrimary, 0.90),
    btnPrimaryTopActive: mix(c.bgDeep, c.accentPrimary, 0.90),
    btnPrimaryBotActive: mix(c.bgSurface, c.accentPrimary, 0.88),
    btnPrimaryBorderTop: withAlpha(c.accentPrimary, 0.5),
    btnSecondaryTop: mix(c.bgRaised, G3, 0.55),
    btnSecondaryMid: mix(c.bgDeep, G3, 0.60),
    btnSecondaryBot: mix(c.bgDeepest, G3, 0.75),
    btnSecondaryTopHover: mix(c.bgElevated, G4, 0.55),
    btnSecondaryMidHover: mix(c.bgRaised, G4, 0.55),
    btnSecondaryBotHover: mix(c.bgDeep, G3, 0.60),
    stepBgTop: mix(c.bgDeep, c.bgSurface, 0.95),
    stepBgMid: mix(c.bgDeep, c.bgDeepest, 0.85),
    stepBgBot: mix(c.bgDeepest, c.bgDeep, 0.80),
    stepBgDownbeatTop: mix(c.bgSurface, c.bgElevated, 0.80),
    stepBgDownbeatMid: mix(c.bgSurface, c.bgDeep, 0.60),
    stepBgDownbeatBot: mix(c.bgDeep, c.bgSurface, 0.85),
    patternItemTop: mix(c.bgSurface, c.bgRaised, 0.70),
    patternItemMid: mix(c.bgSurface, c.bgDeep, 0.80),
    patternItemBot: mix(c.bgDeep, c.bgSurface, 0.60),
    patternItemTopHover: mix(c.bgRaised, c.bgElevated, 0.70),
    patternItemMidHover: mix(c.bgRaised, c.bgSurface, 0.80),
    patternItemBotHover: mix(c.bgSurface, c.bgRaised, 0.60),
    playingTintLight: mix(c.bgRaised, c.accentPrimary, 0.75),
    playingTintMid: mix(c.bgDeep, c.accentPrimary, 0.82),
    playingTintDark: mix(c.bgDeepest, c.accentPrimary, 0.88),
    playingTintLightHover: mix(c.bgRaised, c.accentPrimary, 0.65),
    playingTintMidHover: mix(c.bgDeep, c.accentPrimary, 0.72),
    playingTintDarkHover: mix(c.bgDeepest, c.accentPrimary, 0.80),
    kbdBgTop: mix(c.bgRaised, G4, 0.55),
    kbdBgMid: mix(c.bgDeep, G3, 0.55),
    kbdBgBot: mix(c.bgDeepest, G3, 0.55),
    menuItemHover: withAlpha(c.accentPrimary, 0.1),
    menuItemFocus: withAlpha(c.accentPrimary, 0.15),
    inputFocusGlow: withAlpha(c.accentPrimary, 0.08),
    headerTextGlow: withAlpha(c.accentPrimary, 0.3),
  };
}

// --- DOM application ---

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
  // Core colors
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

  // Derived colors
  const d = computeDerivedColors(theme);
  root.style.setProperty('--btn-primary-top', d.btnPrimaryTop);
  root.style.setProperty('--btn-primary-mid', d.btnPrimaryMid);
  root.style.setProperty('--btn-primary-bot', d.btnPrimaryBot);
  root.style.setProperty('--btn-primary-top-hover', d.btnPrimaryTopHover);
  root.style.setProperty('--btn-primary-mid-hover', d.btnPrimaryMidHover);
  root.style.setProperty('--btn-primary-bot-hover', d.btnPrimaryBotHover);
  root.style.setProperty('--btn-primary-top-active', d.btnPrimaryTopActive);
  root.style.setProperty('--btn-primary-bot-active', d.btnPrimaryBotActive);
  root.style.setProperty('--btn-primary-border-top', d.btnPrimaryBorderTop);
  root.style.setProperty('--btn-secondary-top', d.btnSecondaryTop);
  root.style.setProperty('--btn-secondary-mid', d.btnSecondaryMid);
  root.style.setProperty('--btn-secondary-bot', d.btnSecondaryBot);
  root.style.setProperty('--btn-secondary-top-hover', d.btnSecondaryTopHover);
  root.style.setProperty('--btn-secondary-mid-hover', d.btnSecondaryMidHover);
  root.style.setProperty('--btn-secondary-bot-hover', d.btnSecondaryBotHover);
  root.style.setProperty('--step-bg-top', d.stepBgTop);
  root.style.setProperty('--step-bg-mid', d.stepBgMid);
  root.style.setProperty('--step-bg-bot', d.stepBgBot);
  root.style.setProperty('--step-bg-downbeat-top', d.stepBgDownbeatTop);
  root.style.setProperty('--step-bg-downbeat-mid', d.stepBgDownbeatMid);
  root.style.setProperty('--step-bg-downbeat-bot', d.stepBgDownbeatBot);
  root.style.setProperty('--pattern-item-top', d.patternItemTop);
  root.style.setProperty('--pattern-item-mid', d.patternItemMid);
  root.style.setProperty('--pattern-item-bot', d.patternItemBot);
  root.style.setProperty('--pattern-item-top-hover', d.patternItemTopHover);
  root.style.setProperty('--pattern-item-mid-hover', d.patternItemMidHover);
  root.style.setProperty('--pattern-item-bot-hover', d.patternItemBotHover);
  root.style.setProperty('--playing-tint-light', d.playingTintLight);
  root.style.setProperty('--playing-tint-mid', d.playingTintMid);
  root.style.setProperty('--playing-tint-dark', d.playingTintDark);
  root.style.setProperty('--playing-tint-light-hover', d.playingTintLightHover);
  root.style.setProperty('--playing-tint-mid-hover', d.playingTintMidHover);
  root.style.setProperty('--playing-tint-dark-hover', d.playingTintDarkHover);
  root.style.setProperty('--kbd-bg-top', d.kbdBgTop);
  root.style.setProperty('--kbd-bg-mid', d.kbdBgMid);
  root.style.setProperty('--kbd-bg-bot', d.kbdBgBot);
  root.style.setProperty('--menu-item-hover', d.menuItemHover);
  root.style.setProperty('--menu-item-focus', d.menuItemFocus);
  root.style.setProperty('--input-focus-glow', d.inputFocusGlow);
  root.style.setProperty('--header-text-glow', d.headerTextGlow);
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
