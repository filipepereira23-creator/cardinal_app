/**
 * Debts are stored as ordinary holdings with category 'debts' and only structured fields:
 *   type (fixed list), providerId (lender from the UK list, optional), currency (ISO code),
 *   valuations (outstanding balance by date), debt.interestRate, debt.monthlyPayment.
 * The name is optional (auto-generated from type + lender) and never needed for analysis.
 *
 * `anonymisedDebt()` is the shape a future backend could collect, with consent, to publish
 * aggregate statistics (e.g. average credit-card APR by lender). It contains no ids, names,
 * notes or exact dates, and rounds the balance into bands.
 */
import { convert, type CurrencyCode } from '../config/currencies';
import type { Holding } from './types';
import { rawValueOn } from './calc';
import { todayISO } from './dates';

export const DEBT_TYPE_IDS = ['mortgage', 'personal_loan', 'car_finance', 'credit_card', 'student_loan', 'overdraft', 'debt_other'] as const;
export type DebtTypeId = (typeof DEBT_TYPE_IDS)[number];

export interface AnonymisedDebt {
  schema: 'cardinal.debt.v1';
  type: DebtTypeId;
  lenderId: string | null;
  currency: CurrencyCode;
  /** Outstanding balance in GBP, rounded down to a band (e.g. 25000 = £25k–£50k). */
  balanceBandGbp: number;
  interestRate: number | null;
  monthlyPaymentGbp: number | null;
  /** Month of the latest balance, YYYY-MM. */
  asOfMonth: string;
}

const BANDS = [0, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

export function anonymisedDebt(h: Holding): AnonymisedDebt | null {
  if (h.category !== 'debts') return null;
  const gbp = convert(rawValueOn(h, todayISO()), h.currency, 'GBP');
  const last = h.valuations[h.valuations.length - 1];
  return {
    schema: 'cardinal.debt.v1',
    type: (DEBT_TYPE_IDS as readonly string[]).includes(h.type) ? (h.type as DebtTypeId) : 'debt_other',
    lenderId: h.providerId ?? null,
    currency: h.currency,
    balanceBandGbp: [...BANDS].reverse().find((b) => gbp >= b) ?? 0,
    interestRate: h.debt?.interestRate ?? null,
    monthlyPaymentGbp: h.debt?.monthlyPayment !== undefined ? Math.round(convert(h.debt.monthlyPayment, h.currency, 'GBP')) : null,
    asOfMonth: (last?.date ?? todayISO()).slice(0, 7),
  };
}
