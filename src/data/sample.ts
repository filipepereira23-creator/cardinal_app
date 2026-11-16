/**
 * A realistic sample portfolio with two years of history, so a new user can see
 * how Cardinal works before typing in their own numbers. Loaded only on request.
 */
import type { Holding, Position, Valuation } from '../domain/types';
import type { CurrencyCode } from '../config/currencies';
import { addDays, todayISO } from '../domain/dates';
import { uid } from '../storage/local';

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random walk that ends exactly on `target` today.
 * `annualDrift` and `vol` are per year; `lastDay` is the % move on the final day.
 * `cadence` is days between entries for older history (daily for the last 30 days).
 */
function walk(seed: number, target: number, o: { drift?: number; vol?: number; lastDay?: number; cadence?: number; startDaysAgo?: number; steps?: boolean } = {}): Valuation[] {
  const { drift = 0.05, vol = 0.12, lastDay = 0, cadence = 7, startDaysAgo = 730, steps = false } = o;
  const r = rng(seed);
  const today = todayISO();
  const days: number[] = [];
  for (let d = startDaysAgo; d > 30; d -= cadence) days.push(d);
  for (let d = Math.min(30, startDaysAgo); d >= 0; d--) days.push(d);
  let v = 1;
  const raw: { d: number; v: number }[] = [];
  let prev = days[0];
  for (const d of days) {
    const dt = (prev - d) / 365;
    prev = d;
    if (d === 0) v *= 1 + lastDay / 100;
    else if (steps) v *= 1 + drift * dt + (r() < 0.15 ? (r() - 0.4) * vol * 0.5 : 0);
    else v *= Math.exp((drift - (vol * vol) / 2) * dt + vol * Math.sqrt(Math.max(dt, 1 / 365)) * (r() * 2 - 1) * 1.7);
    raw.push({ d, v });
  }
  const scale = target / raw[raw.length - 1].v;
  return raw.map(({ d, v }) => ({ date: addDays(today, -d), value: Math.round(v * scale * 100) / 100 }));
}

function holding(p: Partial<Holding> & Pick<Holding, 'category' | 'type' | 'name'>, currency: CurrencyCode = 'GBP'): Holding {
  return { id: uid(), currency, source: 'manual', valuations: [], positions: [], createdAt: new Date().toISOString(), ...p };
}
function pos(name: string, symbol: string, valuations: Valuation[]): Position {
  return { id: uid(), name, symbol, valuations };
}

export function samplePortfolio(): Holding[] {
  return [
    // Cash
    holding({ category: 'cash', type: 'current', name: 'HSBC Advance', providerId: 'hsbc-uk', valuations: walk(1, 6840.12, { drift: 0.02, vol: 0.12, cadence: 14 }) }),
    holding({ category: 'cash', type: 'savings', name: 'Chase Saver', providerId: 'chase-uk-j-p-morgan', valuations: walk(2, 18250, { drift: 0.25, vol: 0.1, cadence: 30, steps: true }) }),
    holding({ category: 'cash', type: 'current', name: 'Revolut EUR', providerId: 'revolut', valuations: walk(3, 2310.55, { drift: 0, vol: 0.15, cadence: 14 }) }, 'EUR'),

    // Investment
    holding({
      category: 'investment', type: 'ss_isa', name: 'Vanguard Stocks & Shares ISA', providerId: 'vanguard-uk',
      positions: [
        pos('iShares NASDAQ 100 UCITS ETF', 'CNX1', walk(4, 31480, { drift: 0.18, vol: 0.24, lastDay: -6.4 })),
        pos('Vanguard FTSE Global All Cap', 'VAFTGAG', walk(5, 14920, { drift: 0.1, vol: 0.14, lastDay: -1.1 })),
        pos('Cash in ISA', 'GBP', walk(6, 410, { drift: 0, vol: 0.05, cadence: 60, steps: true })),
      ],
    }),
    holding({
      category: 'investment', type: 'workplace_pension', name: 'Kroll workplace pension', providerId: 'scottish-widows',
      positions: [pos('Scottish Widows Pension Portfolio Two', 'SWPP2', walk(7, 21760, { drift: 0.32, vol: 0.1, lastDay: -0.8, startDaysAgo: 520 }))],
    }),
    holding({
      category: 'investment', type: 'gia', name: 'Trading 212 Invest', providerId: 'trading-212', currency: 'USD',
      positions: [
        pos('Apple', 'AAPL', walk(8, 4210, { drift: 0.12, vol: 0.25, lastDay: -2.3 })),
        pos('Berkshire Hathaway B', 'BRK.B', walk(9, 3080, { drift: 0.08, vol: 0.15, lastDay: 0.4 })),
      ],
    }),

    // Crypto
    holding({
      category: 'crypto', type: 'exchange', name: 'Coinbase', providerId: 'coinbase',
      positions: [
        pos('Bitcoin', 'BTC', walk(10, 9120, { drift: 0.3, vol: 0.55, lastDay: -3.1 })),
        pos('Ethereum', 'ETH', walk(11, 2740, { drift: 0.15, vol: 0.65, lastDay: -4.2 })),
      ],
    }),

    // Assets
    holding({ category: 'assets', type: 'watch', name: 'Rolex Submariner Date', details: { brand: 'Rolex', model: 'Submariner Date', reference: '126610LN', year: '2021' }, acquisition: { price: 9800, date: addDays(todayISO(), -730) }, valuations: walk(12, 11650, { drift: 0.03, vol: 0.06, lastDay: 0.6, cadence: 30 }) }),
    holding({ category: 'assets', type: 'watch', name: 'Omega Speedmaster Moonwatch', details: { brand: 'Omega', model: 'Speedmaster Professional', reference: '310.30.42.50.01.001', year: '2022' }, acquisition: { gift: true, date: addDays(todayISO(), -700) }, valuations: walk(13, 5480, { drift: 0.01, vol: 0.05, lastDay: 0.3, cadence: 30 }) }),
    holding({ category: 'assets', type: 'car', name: 'Porsche 911 Carrera (997)', details: { make: 'Porsche', model: '911 Carrera 997', year: '2008' }, acquisition: { price: 36500, date: addDays(todayISO(), -730) }, valuations: walk(14, 41500, { drift: 0.04, vol: 0.05, cadence: 60, steps: true }) }),
    holding({ category: 'assets', type: 'gold', name: 'Gold bars', details: { metal: 'Gold', weight: '100 g' }, valuations: walk(15, 9420, { drift: 0.22, vol: 0.12, lastDay: 0.9, cadence: 14 }) }),
  ];
}
