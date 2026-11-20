import { useEffect, useState } from 'react';

/** Tiny hash router: works on any static host (GitHub Pages) without server rewrites. */
export function useRoute(): string[] {
  const read = () => (window.location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const [parts, setParts] = useState(read);
  let prev = parts;
  useEffect(() => {
    const on = () => {
      const next = read();
      // Switching between top level tabs keeps the scroll position; opening or leaving a detail page starts at the top.
      const keep = (prev.length <= 1 && next.length <= 1) || (prev[0] === 'dashboard' && next[0] === 'dashboard');
      prev = next;
      setParts(next);
      if (!keep) window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export function go(path: string) {
  window.location.hash = '#/' + path.replace(/^\//, '');
}
