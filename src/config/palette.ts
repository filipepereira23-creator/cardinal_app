import type { CategoryId } from '../domain/types';

/**
 * Cardinal chart palette (v1.7, Filipe 18 Nov 2026): distinct hues that sit well with red #DB0011 and white,
 * not shades of red. Order matters: neighbouring colours differ in hue AND lightness, which keeps them
 * apart for colour-blind users too. Dark mode uses lighter versions so they read on the dark background.
 */
const LIGHT = ['#DB0011', '#1F3A5F', '#1A9E8F', '#E0A526', '#6E7F91', '#93B79A', '#7B4B94', '#4A9FD8', '#C2603A', '#3A3A40'];
const DARK = ['#FF3B47', '#6E95D6', '#2BC2B0', '#F2B93B', '#A3B1C0', '#A9D1AF', '#B48CD0', '#7CC4F2', '#E58660', '#D9CBB0'];

export type ThemeName = 'light' | 'dark';
export const palette = (theme: ThemeName) => (theme === 'dark' ? DARK : LIGHT);

/** Cash red, Investment navy, Crypto gold, Assets teal, Debts slate. */
export function categoryColors(theme: ThemeName): Record<CategoryId, string> {
  const p = palette(theme);
  return { cash: p[0], investment: p[1], crypto: p[3], assets: p[2], debts: p[4] };
}

/** Colours for one line or slice per account. Pass skipRed when the total is already drawn in red. */
export function seriesColors(theme: ThemeName, skipRed = false): string[] {
  const p = palette(theme);
  return skipRed ? p.slice(1) : p;
}
