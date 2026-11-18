import type { CurrencyCode } from '../config/currencies';

export type CategoryId = 'cash' | 'investment' | 'crypto' | 'assets' | 'debts';

/** Categories that add to net worth. Debts subtract. */
export const ASSET_CATEGORIES: CategoryId[] = ['cash', 'investment', 'crypto', 'assets'];

/** One recorded value at a point in time (ISO date, YYYY-MM-DD). */
export interface Valuation {
  date: string;
  value: number;
}

/**
 * Where a holding's numbers come from.
 *  - manual: typed in by the user (the only source in v1)
 *  - connected: pulled from a provider via open banking / API (see src/integrations)
 *  - priced: valued by a live price source, e.g. the gold spot price (see src/valuation)
 */
export type DataSource = 'manual' | 'connected' | 'priced';

/** A fund, share or coin held inside an account (e.g. a NASDAQ 100 fund in an ISA). */
export interface Position {
  id: string;
  name: string;
  /** Optional ticker / ISIN / coin symbol. */
  symbol?: string;
  /** Crypto only: number of coins held. With a symbol, today's value comes from the live price. */
  quantity?: number;
  valuations: Valuation[];
}

/**
 * Structured terms of a debt. Every field is a number or a fixed id (no free text),
 * so debts can later be aggregated anonymously (see src/domain/debts.ts).
 */
export interface DebtTerms {
  /** Annual interest rate in %, e.g. 4.29. */
  interestRate?: number;
  /** Contractual monthly payment, in the debt's currency. */
  monthlyPayment?: number;
}

/**
 * Anything on the balance sheet: a bank account, an ISA, a pension,
 * a crypto wallet, a watch, a house... and debts (category 'debts').
 * A debt's valuations are its outstanding balance as a positive number;
 * calc.ts applies the minus sign.
 *
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
  /**
   * What was paid for an asset, if anything. Optional: cars and watches are often gifts.
   * Gains since purchase are only shown when `price` is meaningful (see calc.purchaseGain).
   */
  acquisition?: { price?: number; date?: string; gift?: boolean };
  /** Debts only: rate and monthly payment. The lender is `providerId`. */
  debt?: DebtTerms;
  /** Set when `source` is 'priced': where the latest automatic value came from. */
  priced?: { source: string; url?: string; asOf: string };
  createdAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export type Theme = 'light' | 'dark' | 'system' | 'auto';

/** Per-user preferences from the Settings page. */
export interface Settings {
  theme: Theme;
  numberFormat: 'en-GB' | 'de-DE' | 'fr-FR';
  showDecimals: boolean;
  hideBalances: boolean;
  defaultRange: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
  notifications: { weeklySummary: boolean; bigMoves: boolean; updateReminders: boolean };
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  numberFormat: 'en-GB',
  showDecimals: true,
  hideBalances: false,
  defaultRange: '1M',
  notifications: { weeklySummary: false, bigMoves: false, updateReminders: false },
};

export interface Portfolio {
  holdings: Holding[];
  displayCurrency: CurrencyCode;
}
