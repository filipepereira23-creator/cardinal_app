/**
 * Title Case for headings, tabs and labels (Filipe, 18 Nov 2026: every word starts with a capital,
 * e.g. "Net Worth Path", "Where Your Wealth Sits"). Units such as m², g and oz are left alone.
 */
const KEEP = new Set(['m²', '(m²)', 'g', 'oz', 'kg', 'e.g.', 'vs']);
export function titleCase(s: string): string {
  return s.split(/(\s+)/).map((w) => {
    if (!w.trim() || KEEP.has(w)) return w;
    return w.replace(/^([^A-Za-zÀ-ÿ]*)([a-zà-ÿ])/, (_, pre: string, c: string) => pre + c.toUpperCase());
  }).join('');
}
