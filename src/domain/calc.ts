import { convert, type CurrencyCode } from '../config/currencies';
import type { CategoryId, Holding, Position, Valuation } from './types';
import { addDays, parseISO, todayISO, DAY, RANGES, type RangeId } from './dates';

/** Value of a valuation series on a given date (last known value, 0 before the first entry). */
export function valueOn(valuations: Valuation[], date: string): number {
  let v = 0;
  for (const x of valuations) {
    if (x.date <= date) v = x.value;
    else break;
  }
  return v;
}

export function sortValuations(v: Valuation[]): Valuation[] {
  return [...v].sort((a, b) => a.date.localeCompare(b.date));
}

/** A holding's value in its own currency on a date. */
export function holdingValueOn(h: Holding, date: string): number {
  if (h.positions.length) return h.positions.reduce((s, p) => s + valueOn(p.valuations, date), 0);
  return valueOn(h.valuations, date);
}

export function holdingValue(h: Holding, ccy: CurrencyCode, date = todayISO()): number {
  return convert(holdingValueOn(h, date), h.currency, ccy);
}

export function positionValue(p: Position, h: Holding, ccy: CurrencyCode, date = todayISO()): number {
  return convert(valueOn(p.valuations, date), h.currency, ccy);
}

export function categoryValue(holdings: Holding[], cat: CategoryId, ccy: CurrencyCode, date = todayISO()): number {
  return holdings.filter((h) => h.category === cat).reduce((s, h) => s + holdingValue(h, ccy, date), 0);
}

export function totalValue(holdings: Holding[], ccy: CurrencyCode, date = todayISO()): number {
  return holdings.reduce((s, h) => s + holdingValue(h, ccy, date), 0);
}

/** Earliest date any value was recorded. */
export function firstDate(holdings: Holding[]): string | null {
  let first: string | null = null;
  const consider = (v: Valuation[]) => {
    if (v.length && (!first || v[0].date < first)) first = v[0].date;
  };
  for (const h of holdings) {
    consider(h.valuations);
    h.positions.forEach((p) => consider(p.valuations));
  }
  return first;
}

/** The start date of a range, never earlier than the first recorded value. */
export function rangeStart(range: RangeId, holdings: Holding[]): string {
  const today = todayISO();
  const first = firstDate(holdings) ?? today;
  const r = RANGES.find((x) => x.id === range)!;
  if (r.days === null) return first < today ? first : addDays(today, -1);
  const start = addDays(today, -r.days);
  return start;
}

export interface SeriesPoint {
  date: string;
  [key: string]: number | string;
}

/**
 * Builds a chart series from `start` to today. `lines` maps a key to a function
 * returning the value on a date. Points are sampled so charts stay light.
 */
export function buildSeries(start: string, lines: Record<string, (date: string) => number>, maxPoints = 120): SeriesPoint[] {
  const today = todayISO();
  const span = Math.max(1, Math.round((parseISO(today).getTime() - parseISO(start).getTime()) / DAY));
  const step = Math.max(1, Math.ceil(span / maxPoints));
  const dates: string[] = [];
  for (let i = 0; i <= span; i += step) dates.push(addDays(start, i));
  if (dates[dates.length - 1] !== today) dates.push(today);
  return dates.map((date) => {
    const p: SeriesPoint = { date };
    for (const [k, fn] of Object.entries(lines)) p[k] = Math.round(fn(date) * 100) / 100;
    return p;
  });
}

export interface Change {
  from: number;
  to: number;
  abs: number;
  pct: number | null;
}

export function change(from: number, to: number): Change {
  return { from, to, abs: to - from, pct: from !== 0 ? ((to - from) / Math.abs(from)) * 100 : null };
}

export function holdingChange(h: Holding, ccy: CurrencyCode, start: string): Change {
  return change(holdingValue(h, ccy, start), holdingValue(h, ccy));
}

export function positionChange(p: Position, h: Holding, ccy: CurrencyCode, start: string): Change {
  return change(positionValue(p, h, ccy, start), positionValue(p, h, ccy));
}

export function categoryChange(holdings: Holding[], cat: CategoryId, ccy: CurrencyCode, start: string): Change {
  return change(categoryValue(holdings, cat, ccy, start), categoryValue(holdings, cat, ccy));
}

export function totalChange(holdings: Holding[], ccy: CurrencyCode, start: string): Change {
  return change(totalValue(holdings, ccy, start), totalValue(holdings, ccy));
}

/** The individual things (accounts without positions, and positions) that moved most. */
export interface Mover {
  holding: Holding;
  position?: Position;
  label: string;
  change: Change;
}

export function topMovers(holdings: Holding[], ccy: CurrencyCode, start: string, limit = 6): Mover[] {
  const all: Mover[] = [];
  for (const h of holdings) {
    if (h.positions.length) {
      for (const p of h.positions) all.push({ holding: h, position: p, label: p.name, change: positionChange(p, h, ccy, start) });
    } else {
      all.push({ holding: h, label: h.name, change: holdingChange(h, ccy, start) });
    }
  }
  return all
    .filter((m) => Math.abs(m.change.abs) >= 0.005)
    .sort((a, b) => Math.abs(b.change.abs) - Math.abs(a.change.abs))
    .slice(0, limit);
}
