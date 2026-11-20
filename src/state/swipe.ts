import { useEffect } from 'react';

const MAIN = ['dashboard', 'path', 'income', 'connections'];
const CATS = ['cash', 'investment', 'crypto', 'assets', 'debts'];

/**
 * Swipe left or right on a phone to move between tabs, so nobody has to scroll back up.
 * Over the Cash / Investment / Crypto / Assets / Debts tiles it moves between those;
 * anywhere else it moves between the main tabs. Ignored on charts, inputs and pop ups.
 */
export function useSwipeTabs(enabled: boolean, page: string | undefined, arg: string | undefined) {
  useEffect(() => {
    if (!enabled) return;
    let x0 = 0, y0 = 0, t0 = 0, mode: 'main' | 'cat' | null = null;
    const start = (e: TouchEvent) => {
      const el = e.target as HTMLElement;
      mode = null;
      if (e.touches.length !== 1) return;
      if (el.closest('input, textarea, select, .recharts-wrapper, .range-tabs, .main-tabs, .seg, .modal-backdrop, [role="dialog"], .rank, .report-grid')) return;
      mode = el.closest('.cat-tabs') ? 'cat' : 'main';
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    };
    const end = (e: TouchEvent) => {
      if (!mode) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - t0 > 700) return;
      const dir = dx < 0 ? 1 : -1;
      const p = page || 'dashboard';
      if (mode === 'cat' && p === 'dashboard') {
        const i = Math.max(0, CATS.indexOf(arg && CATS.includes(arg) ? arg : 'cash')) + dir;
        if (i >= 0 && i < CATS.length) window.location.hash = `#/dashboard/${CATS[i]}`;
        return;
      }
      const i = MAIN.indexOf(p);
      if (i < 0) return;
      const n = i + dir;
      if (n >= 0 && n < MAIN.length) window.location.hash = `#/${MAIN[n]}`;
    };
    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    return () => { document.removeEventListener('touchstart', start); document.removeEventListener('touchend', end); };
  }, [enabled, page, arg]);
}
