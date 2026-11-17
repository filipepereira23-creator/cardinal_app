/**
 * Car value ESTIMATE from a standard UK depreciation curve. Free and automatic, but not a market price.
 *
 * There is no free, keyless car valuation API: Auto Trader and CAP HPI are paid and partner-only.
 * The DVLA Vehicle Enquiry API and DVSA MOT History API are free but need a private key, so they
 * belong on a server (on the to-do list), not in this public web app.
 *
 * Curve: share of value lost in each year of the car's life. Shaped to the published UK averages:
 * 15–35% in year one, about 60% gone by year five, flattening after about eight years
 * (AA, RAC, Motorway). Cars over 25 years old are treated as classics and held flat.
 * Mileage: the AA's figures assume ~10,000 miles a year; each 1,000 miles above (below) that pace
 * takes off (adds) 0.5%, capped at -15% / +10%. Both are Cardinal's own simplifying assumptions.
 */
import type { Holding } from '../domain/types';
import { sortValuations } from '../domain/calc';
import { parseISO, todayISO } from '../domain/dates';

const YEARLY_LOSS = [0.25, 0.15, 0.15, 0.12, 0.1, 0.08, 0.07, 0.06, 0.05, 0.05];
const lossInYear = (n: number) => (n < YEARLY_LOSS.length ? YEARLY_LOSS[n] : n < 15 ? 0.04 : n < 25 ? 0.02 : 0);
const MILES_PER_YEAR = 10_000;

export const CAR_CURVE_SOURCE_URL = 'https://www.theaa.com/cars/advice/selling-a-car/how-much-do-cars-depreciate-every-year';

/** Share of its new value a car keeps at `age` years (fractional ages interpolate within the year). */
export function retention(age: number): number {
  let r = 1;
  const a = Math.max(0, age);
  const whole = Math.floor(a);
  for (let i = 0; i < whole; i++) r *= 1 - lossInYear(i);
  return r * (1 - lossInYear(whole) * (a - whole));
}

export interface CarEstimate {
  value: number;
  base: { value: number; date: string; kind: 'purchase' | 'last value' };
  ageThen: number;
  ageNow: number;
  changePct: number;
  mileageAdjPct: number | null;
  classic: boolean;
}

const years = (from: string, to: string) => (parseISO(to).getTime() - parseISO(from).getTime()) / (365.25 * 86_400_000);

export function carEstimate(h: Pick<Holding, 'details' | 'valuations' | 'acquisition'>): CarEstimate | null {
  const year = Number((h.details?.year || '').match(/\d{4}/)?.[0]);
  const thisYear = new Date().getFullYear();
  if (!year || year < 1900 || year > thisYear + 1) return null;
  const today = todayISO();
  const vals = sortValuations(h.valuations);
  const last = vals[vals.length - 1];
  const a = h.acquisition;
  // Prefer the most recent known price: the last value the user typed, else what they paid.
  const base = last
    ? { value: last.value, date: last.date, kind: 'last value' as const }
    : a?.price && a.date
      ? { value: a.price, date: a.date, kind: 'purchase' as const }
      : null;
  if (!base || base.value <= 0) return null;
  const built = `${year}-07-01`; // mid-year: the registration month is unknown
  const ageThen = Math.max(0, years(built, base.date));
  const ageNow = Math.max(ageThen, years(built, today));
  let value = base.value * (retention(ageNow) / retention(ageThen));
  let mileageAdjPct: number | null = null;
  const miles = Number(String(h.details?.mileage ?? '').replace(/[^0-9]/g, ''));
  if (miles > 0 && ageNow > 0.5) {
    const expected = ageNow * MILES_PER_YEAR;
    mileageAdjPct = Math.max(-15, Math.min(10, ((expected - miles) / 1000) * 0.5));
    // Only the change since the user's value is ours to adjust, so scale the adjustment by the share of the car's life since then.
    const share = ageNow > 0 ? Math.min(1, (ageNow - ageThen) / ageNow) : 0;
    mileageAdjPct = Math.round(mileageAdjPct * share * 10) / 10;
    value *= 1 + mileageAdjPct / 100;
  }
  value = Math.round(value / 50) * 50;
  return { value, base, ageThen, ageNow, changePct: (value / base.value - 1) * 100, mileageAdjPct, classic: ageNow >= 25 };
}
