import { describe, it, expect } from 'vitest';
import { TRACK_COLORS } from '../src/constants';

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

describe('Theme: Accessibility Contrast', () => {
  // These are the Bloom palette values
  const bgSurface = '#1a1525';
  const textPrimary = '#e8e0f0';
  const accentPrimary = '#b8a0d2';

  it('text-primary vs bg-surface meets WCAG AA (>= 4.5:1)', () => {
    const ratio = contrastRatio(textPrimary, bgSurface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('accent-primary vs bg-surface meets WCAG AA for large text (>= 3:1)', () => {
    const ratio = contrastRatio(accentPrimary, bgSurface);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});
