export const DAY = 86_400_000;

export function todayISO(): string {
  const d = new Date();
  return toISO(d);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function formatDate(iso: string, style: 'short' | 'long' | 'month' = 'short'): string {
  const d = parseISO(iso);
  if (style === 'month') return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  if (style === 'long') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export type RangeId = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export const RANGES: { id: RangeId; label: string; days: number | null; desc: string }[] = [
  { id: '1D', label: '1D', days: 1, desc: 'today' },
  { id: '1W', label: '1W', days: 7, desc: 'this week' },
  { id: '1M', label: '1M', days: 30, desc: 'this month' },
  { id: '3M', label: '3M', days: 91, desc: 'last 3 months' },
  { id: '1Y', label: '1Y', days: 365, desc: 'this year' },
  { id: 'ALL', label: 'All', days: null, desc: 'all time' },
];
