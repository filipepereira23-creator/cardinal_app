import type { CurrencyCode } from '../config/currencies';

export type CategoryId = 'cash' | 'investment' | 'crypto' | 'assets';

/** One recorded value at a point in time (ISO date, YYYY-MM-DD). */
export interface Valuation {
  date: string;
  value: number;
}

/**
 * Where a holding's numbers come from.
 *  - manual: typed in by the user (the only source in v1)
 *  - connected: pulled from a provider via open banking / API (see src/integrations)
 *  - priced: valued by a live price source, e.g. Chrono24 for watches (see src/valuation)
 */
export type DataSource = 'manual' | 'connected' | 'priced';

/** A fund, share or coin held inside an account (e.g. a NASDAQ 100 fund in an ISA). */
export interface Position {
  id: string;
  name: string;
  /** Optional ticker / ISIN / coin symbol. */
  symbol?: string;
  valuations: Valuation[];
}

/**
 * Anything that adds to net worth: a bank account, an ISA, a pension,
 * a crypto wallet, a watch, a house...
 *
 * If `positions` is non-empty the holding's value is the sum of its positions;
 * otherwise it is taken from its own `valuations`.
 */
export interface Holding {
  id: string;
  category: CategoryId;
  /** Account or asset type id, see src/data/holdingTypes.ts */
  type: string;
  name: string;
  /** Provider id from src/data/providers.ts (banks, platforms, pensions, exchanges). */
  providerId?: string;
  currency: CurrencyCode;
  source: DataSource;
  valuations: Valuation[];
  positions: Position[];
  /** Free-form details, e.g. { brand: 'Rolex', model: 'Submariner', year: '2019' }. */
  details?: Record<string, string>;
  notes?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface Portfolio {
  holdings: Holding[];
  displayCurrency: CurrencyCode;
}
