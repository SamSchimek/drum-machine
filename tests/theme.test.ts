import { describe, it, expect } from 'vitest';
import { TRACK_COLORS } from '../src/constants';
import { THEMES, THEME_IDS, applyThemeToDOM } from '../src/context/ThemeContext';
import type { Theme } from '../src/context/ThemeContext';

// Helper: parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Helper: relative luminance per WCAG 2.0
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper: contrast ratio per WCAG 2.0
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Theme: Track Colors', () => {
  const expectedTracks = [
    'kick', 'snare', 'closedHH', 'openHH', 'clap', 'tomLow',
    'tomMid', 'tomHigh', 'rimshot', 'cowbell', 'clave', 'maracas',
  ];

  it('defines exactly 12 track colors', () => {
    expect(Object.keys(TRACK_COLORS)).toHaveLength(12);
  });

  it('has all expected track IDs', () => {
    for (const track of expectedTracks) {
      expect(TRACK_COLORS).toHaveProperty(track);
    }
  });

  it('uses valid 7-character hex colors', () => {
    for (const [track, color] of Object.entries(TRACK_COLORS)) {
      expect(color, `${track} color should be valid hex`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('uses muted colors (no channel exceeds 0xD4)', () => {
    for (const [track, color] of Object.entries(TRACK_COLORS)) {
      const { r, g, b } = hexToRgb(color);
      expect(Math.max(r, g, b), `${track} color ${color} should be muted`).toBeLessThanOrEqual(0xD4);
    }
  });

  it('has visually distinct colors (all pairs differ by at least 15 in some channel)', () => {
    const colors = Object.entries(TRACK_COLORS);
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const [nameA, hexA] = colors[i];
        const [nameB, hexB] = colors[j];
        const a = hexToRgb(hexA);
        const b = hexToRgb(hexB);
        const maxDiff = Math.max(
          Math.abs(a.r - b.r),
          Math.abs(a.g - b.g),
          Math.abs(a.b - b.b),
        );
        expect(maxDiff, `${nameA} and ${nameB} should be visually distinct`).toBeGreaterThanOrEqual(15);
      }
    }
  });
});

describe('Theme: Full-Feel Color System', () => {
  const allColorKeys: (keyof Theme['colors'])[] = [
    'accentPrimary', 'accentPrimaryHover', 'accentPrimaryDim', 'accentPrimaryGlow',
    'accentSecondary', 'accentWarm',
    'bgDeepest', 'bgDeep', 'bgSurface', 'bgRaised', 'bgElevated',
    'borderSubtle', 'borderDefault', 'borderStrong',
    'textPrimary', 'textSecondary', 'textTertiary', 'textMuted',
  ];

  it('every theme has all 18 color properties', () => {
    for (const themeId of THEME_IDS) {
      const theme = THEMES[themeId];
      for (const key of allColorKeys) {
        expect(theme.colors[key], `${themeId}.colors.${key} should be defined`).toBeDefined();
        expect(typeof theme.colors[key], `${themeId}.colors.${key} should be a string`).toBe('string');
      }
    }
  });

  it('all hex colors are valid format', () => {
    const hexKeys: (keyof Theme['colors'])[] = [
      'accentPrimary', 'accentPrimaryHover', 'accentSecondary', 'accentWarm',
      'bgDeepest', 'bgDeep', 'bgSurface', 'bgRaised', 'bgElevated',
      'borderSubtle', 'borderDefault', 'borderStrong',
      'textPrimary', 'textSecondary', 'textTertiary', 'textMuted',
    ];
    for (const themeId of THEME_IDS) {
      const theme = THEMES[themeId];
      for (const key of hexKeys) {
        expect(theme.colors[key], `${themeId}.colors.${key} = ${theme.colors[key]}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it('background luminance ordering: bgDeepest < bgDeep < bgSurface < bgRaised < bgElevated', () => {
    for (const themeId of THEME_IDS) {
      const c = THEMES[themeId].colors;
      const lDeepest = relativeLuminance(c.bgDeepest);
      const lDeep = relativeLuminance(c.bgDeep);
      const lSurface = relativeLuminance(c.bgSurface);
      const lRaised = relativeLuminance(c.bgRaised);
      const lElevated = relativeLuminance(c.bgElevated);
      expect(lDeepest, `${themeId}: bgDeepest < bgDeep`).toBeLessThan(lDeep);
      expect(lDeep, `${themeId}: bgDeep < bgSurface`).toBeLessThan(lSurface);
      expect(lSurface, `${themeId}: bgSurface < bgRaised`).toBeLessThan(lRaised);
      expect(lRaised, `${themeId}: bgRaised < bgElevated`).toBeLessThan(lElevated);
    }
  });

  it('text luminance ordering: textMuted < textTertiary < textSecondary < textPrimary', () => {
    for (const themeId of THEME_IDS) {
      const c = THEMES[themeId].colors;
      const lMuted = relativeLuminance(c.textMuted);
      const lTertiary = relativeLuminance(c.textTertiary);
      const lSecondary = relativeLuminance(c.textSecondary);
      const lPrimary = relativeLuminance(c.textPrimary);
      expect(lMuted, `${themeId}: textMuted < textTertiary`).toBeLessThan(lTertiary);
      expect(lTertiary, `${themeId}: textTertiary < textSecondary`).toBeLessThan(lSecondary);
      expect(lSecondary, `${themeId}: textSecondary < textPrimary`).toBeLessThan(lPrimary);
    }
  });

  it('border luminance ordering: borderSubtle < borderDefault < borderStrong', () => {
    for (const themeId of THEME_IDS) {
      const c = THEMES[themeId].colors;
      const lSubtle = relativeLuminance(c.borderSubtle);
      const lDefault = relativeLuminance(c.borderDefault);
      const lStrong = relativeLuminance(c.borderStrong);
      expect(lSubtle, `${themeId}: borderSubtle < borderDefault`).toBeLessThan(lDefault);
      expect(lDefault, `${themeId}: borderDefault < borderStrong`).toBeLessThan(lStrong);
    }
  });

  it('WCAG AA contrast: textPrimary vs bgSurface >= 4.5:1 for every theme', () => {
    for (const themeId of THEME_IDS) {
      const c = THEMES[themeId].colors;
      const ratio = contrastRatio(c.textPrimary, c.bgSurface);
      expect(ratio, `${themeId}: textPrimary vs bgSurface = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('WCAG AA large text: accentPrimary vs bgSurface >= 3:1 for every theme', () => {
    for (const themeId of THEME_IDS) {
      const c = THEMES[themeId].colors;
      const ratio = contrastRatio(c.accentPrimary, c.bgSurface);
      expect(ratio, `${themeId}: accentPrimary vs bgSurface = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('Bloom values match current hardcoded :root defaults', () => {
    const bloom = THEMES.bloom.colors;
    expect(bloom.bgDeepest).toBe('#14101a');
    expect(bloom.bgDeep).toBe('#1a1528');
    expect(bloom.bgSurface).toBe('#241d35');
    expect(bloom.bgRaised).toBe('#302542');
    expect(bloom.bgElevated).toBe('#3d3055');
    expect(bloom.borderSubtle).toBe('#3a3058');
    expect(bloom.borderDefault).toBe('#4d4068');
    expect(bloom.borderStrong).toBe('#5f5080');
    expect(bloom.textPrimary).toBe('#f0e8f8');
    expect(bloom.textSecondary).toBe('#b8a8c8');
    expect(bloom.textTertiary).toBe('#8878a0');
    expect(bloom.textMuted).toBe('#685888');
  });

  it('applyThemeToDOM sets core and derived CSS custom properties', () => {
    const theme = THEMES.sunset;
    applyThemeToDOM(theme);
    const root = document.documentElement;
    // Core properties
    expect(root.style.getPropertyValue('--accent-primary')).toBe(theme.colors.accentPrimary);
    expect(root.style.getPropertyValue('--accent-primary-hover')).toBe(theme.colors.accentPrimaryHover);
    expect(root.style.getPropertyValue('--accent-primary-dim')).toBe(theme.colors.accentPrimaryDim);
    expect(root.style.getPropertyValue('--accent-primary-glow')).toBe(theme.colors.accentPrimaryGlow);
    expect(root.style.getPropertyValue('--accent-secondary')).toBe(theme.colors.accentSecondary);
    expect(root.style.getPropertyValue('--accent-warm')).toBe(theme.colors.accentWarm);
    expect(root.style.getPropertyValue('--bg-deepest')).toBe(theme.colors.bgDeepest);
    expect(root.style.getPropertyValue('--bg-deep')).toBe(theme.colors.bgDeep);
    expect(root.style.getPropertyValue('--bg-surface')).toBe(theme.colors.bgSurface);
    expect(root.style.getPropertyValue('--bg-raised')).toBe(theme.colors.bgRaised);
    expect(root.style.getPropertyValue('--bg-elevated')).toBe(theme.colors.bgElevated);
    expect(root.style.getPropertyValue('--border-subtle')).toBe(theme.colors.borderSubtle);
    expect(root.style.getPropertyValue('--border-default')).toBe(theme.colors.borderDefault);
    expect(root.style.getPropertyValue('--border-strong')).toBe(theme.colors.borderStrong);
    expect(root.style.getPropertyValue('--text-primary')).toBe(theme.colors.textPrimary);
    expect(root.style.getPropertyValue('--text-secondary')).toBe(theme.colors.textSecondary);
    expect(root.style.getPropertyValue('--text-tertiary')).toBe(theme.colors.textTertiary);
    expect(root.style.getPropertyValue('--text-muted')).toBe(theme.colors.textMuted);
    // Derived properties (spot-check)
    expect(root.style.getPropertyValue('--btn-primary-top')).toBeTruthy();
    expect(root.style.getPropertyValue('--btn-secondary-top')).toBeTruthy();
    expect(root.style.getPropertyValue('--step-bg-top')).toBeTruthy();
    expect(root.style.getPropertyValue('--playing-tint-light')).toBeTruthy();
    expect(root.style.getPropertyValue('--menu-item-hover')).toBeTruthy();
  });

  it('applyThemeToDOM for Bloom uses exact hardcoded values', () => {
    applyThemeToDOM(THEMES.bloom);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--btn-primary-top')).toBe('#3c3250');
    expect(root.style.getPropertyValue('--btn-primary-mid')).toBe('#2a2240');
    expect(root.style.getPropertyValue('--btn-secondary-top')).toBe('#322d3c');
    expect(root.style.getPropertyValue('--playing-tint-light')).toBe('#5a4a6a');
    expect(root.style.getPropertyValue('--btn-primary-border-top')).toBe('rgba(184,160,210,0.5)');
  });
});
