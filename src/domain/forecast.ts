import type { CurrencyCode } from '../config/currencies';
import type { Holding } from './types';
import { annualise, daysBetween, firstDate, totalValue, type SeriesPoint } from './calc';
import { addDays, todayISO } from './dates';

export interface Forecast {
  /** Points from today to the horizon (the first is today, so the line joins the history). */
  points: { date: string; forecast: number }[];
  /** 'savings': not enough history for a trend, so today's net worth plus yearly savings from income. */
  method: 'compound' | 'linear' | 'savings';
  /** Yearly growth rate in % (compound) or £ per year (linear). */
  rate: number;
  endValue: number;
  years: number;
  basedOnDays: number;
  /** Yearly amount added from income (display currency); 0 when income is not included. */
  contribution: number;
  /** Growth rate applied to the money added from income, in % a year. */
  contributionGrowth: number;
  /** How much of `endValue` comes from money added from income (with its growth). */
  fromIncome: number;
}

/** Money added from income grows at the trend's rate, kept between 0% and 7% a year so a hot streak isn't compounded onto new savings. */
export const MAX_CONTRIBUTION_GROWTH = 7;

/**
 * Projects net worth forward by repeating its average past trend.
 * Uses the whole recorded history: compound annual growth when that is meaningful,
 * otherwise the average straight-line change. It is an extrapolation, not a prediction.
 */
export function buildForecast(holdings: Holding[], ccy: CurrencyCode, years: number, contribution = 0): Forecast | null {
  const first = firstDate(holdings);
  const today = todayISO();
  const add = Math.max(0, contribution || 0);
  if (!first) return null;
  const days = daysBetween(first, today);
  const from = totalValue(holdings, ccy, first);
  const to = totalValue(holdings, ccy, today);
  const hasTrend = days >= 14 && to > 0;
  // Without income the forecast is unchanged: it needs two weeks of history and a positive net worth.
  if (!hasTrend && add <= 0) return null;
  const cagr = hasTrend ? annualise(from, to, Math.max(days, 30)) : null;
  const method: Forecast['method'] = !hasTrend ? 'savings' : cagr !== null && days >= 30 ? 'compound' : 'linear';
  const perYear = hasTrend ? ((to - from) / days) * 365 : 0;
  const trend = (t: number) => (method === 'compound' ? to * Math.pow(1 + (cagr as number) / 100, t) : method === 'linear' ? to + perYear * t : to);
  const g = method === 'compound' ? Math.max(0, Math.min(MAX_CONTRIBUTION_GROWTH, cagr as number)) / 100 : 0;
  // Future value of adding `add` a year, paid in evenly through the year.
  const saved = (t: number) => (add <= 0 ? 0 : g > 0 ? (add * (Math.pow(1 + g, t) - 1)) / Math.log(1 + g) : add * t);
  const steps = Math.max(12, Math.min(years * 4, 120));
  const points: Forecast['points'] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (years * i) / steps;
    points.push({ date: addDays(today, Math.round(t * 365)), forecast: Math.round((method === 'savings' ? trend(t) : Math.max(0, trend(t))) + saved(t)) });
  }
  const end = points[points.length - 1].forecast;
  return {
    points,
    method,
    rate: method === 'compound' ? (cagr as number) : perYear,
    endValue: end,
    years,
    basedOnDays: days,
    contribution: add,
    contributionGrowth: g * 100,
    fromIncome: Math.round(saved(years)),
  };
}

/** Joins a history series with a forecast so one chart can draw both. */
export function withForecast(series: SeriesPoint[], f: Forecast): SeriesPoint[] {
  const hist = series.map((p, i) => (i === series.length - 1 ? { ...p, forecast: p.total } : p));
  return [...hist, ...f.points.slice(1).map((p) => ({ date: p.date, forecast: p.forecast }) as SeriesPoint)];
}
