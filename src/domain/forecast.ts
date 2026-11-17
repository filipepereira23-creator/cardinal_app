import type { CurrencyCode } from '../config/currencies';
import type { Holding } from './types';
import { annualise, daysBetween, firstDate, totalValue, type SeriesPoint } from './calc';
import { addDays, todayISO } from './dates';

export interface Forecast {
  /** Points from today to the horizon (the first is today, so the line joins the history). */
  points: { date: string; forecast: number }[];
  method: 'compound' | 'linear';
  /** Yearly growth rate in % (compound) or £ per year (linear). */
  rate: number;
  endValue: number;
  years: number;
  basedOnDays: number;
}

/**
 * Projects net worth forward by repeating its average past trend.
 * Uses the whole recorded history: compound annual growth when that is meaningful,
 * otherwise the average straight-line change. It is an extrapolation, not a prediction.
 */
export function buildForecast(holdings: Holding[], ccy: CurrencyCode, years: number): Forecast | null {
  const first = firstDate(holdings);
  const today = todayISO();
  if (!first) return null;
  const days = daysBetween(first, today);
  if (days < 14) return null;
  const from = totalValue(holdings, ccy, first);
  const to = totalValue(holdings, ccy, today);
  if (to <= 0) return null;
  const cagr = annualise(from, to, Math.max(days, 30));
  const method: Forecast['method'] = cagr !== null && days >= 30 ? 'compound' : 'linear';
  const perYear = ((to - from) / days) * 365;
  const at = (t: number) => (method === 'compound' ? to * Math.pow(1 + (cagr as number) / 100, t) : to + perYear * t);
  const steps = Math.max(12, Math.min(years * 4, 120));
  const points: Forecast['points'] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (years * i) / steps;
    points.push({ date: addDays(today, Math.round(t * 365)), forecast: Math.round(Math.max(0, at(t))) });
  }
  return { points, method, rate: method === 'compound' ? (cagr as number) : perYear, endValue: points[points.length - 1].forecast, years, basedOnDays: days };
}

/** Joins a history series with a forecast so one chart can draw both. */
export function withForecast(series: SeriesPoint[], f: Forecast): SeriesPoint[] {
  const hist = series.map((p, i) => (i === series.length - 1 ? { ...p, forecast: p.total } : p));
  return [...hist, ...f.points.slice(1).map((p) => ({ date: p.date, forecast: p.forecast }) as SeriesPoint)];
}
