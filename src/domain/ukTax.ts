/**
 * UK take-home pay for an employee paid through PAYE, tax year 2026/27 (6 April 2026 to 5 April 2027).
 *
 * Figures from HMRC "Rates and thresholds for employers 2026 to 2027" (checked 19 Nov 2026):
 *  - Personal Allowance £12,570, reduced by £1 for every £2 of adjusted net income over £100,000.
 *  - England, Wales and NI: 20% on the first £37,700 of taxable income, 40% to £125,140, 45% above.
 *  - Scotland: 19% to £3,967, 20% to £16,956, 21% to £31,092, 42% to £62,430, 45% to £125,140, 48% above
 *    (all of taxable income, i.e. above the Personal Allowance).
 *  - Employee Class 1 NI (category A): 8% between £12,570 and £50,270, 2% above.
 *  - Student loans at 9% above: Plan 1 £26,900, Plan 2 £29,385, Plan 4 £33,795, Plan 5 £25,000.
 *    Postgraduate loan at 6% above £21,000 (repaid alongside any undergraduate plan).
 *
 * Pension:
 *  - Salary sacrifice lowers pay before tax, NI and student loan.
 *  - Net pay arrangement lowers pay before tax only (NI and student loan still on full pay).
 *
 * Annual figures assume pay is spread evenly through the year. Tax codes other than 1257L,
 * benefits in kind, the High Income Child Benefit Charge and Marriage Allowance are not modelled.
 */

export const TAX_YEAR = '2026/27';

export type TaxRegion = 'rUK' | 'scotland';
export type LoanPlan = 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgrad';
export type PensionMethod = 'sacrifice' | 'netpay';

export interface IncomeProfile {
  /** Yearly gross salary in GBP. */
  salary: number;
  /** Yearly bonus in GBP (optional). */
  bonus?: number;
  /** Employee pension contribution as % of salary + bonus. */
  pensionPct?: number;
  pensionMethod?: PensionMethod;
  loan?: LoanPlan;
  /** Also repaying a Postgraduate Loan alongside an undergraduate plan. */
  postgrad?: boolean;
  region?: TaxRegion;
  /** % of take-home saved or invested each year (used by the forecast). */
  savingsRate?: number;
  /** Whether the forecast should include savings from income. */
  inForecast?: boolean;
  updatedAt?: string;
}

export const DEFAULT_SAVINGS_RATE = 20;

const PA = 12_570;
const PA_TAPER_FROM = 100_000;
const NI_PT = 12_570;
const NI_UEL = 50_270;
const NI_MAIN = 0.08;
const NI_UPPER = 0.02;

/** Bands over taxable income: [upper limit of band, rate]. */
const BANDS: Record<TaxRegion, [number, number][]> = {
  rUK: [
    [37_700, 0.2],
    [125_140, 0.4],
    [Infinity, 0.45],
  ],
  scotland: [
    [3_967, 0.19],
    [16_956, 0.2],
    [31_092, 0.21],
    [62_430, 0.42],
    [125_140, 0.45],
    [Infinity, 0.48],
  ],
};

export const LOAN_THRESHOLDS: Record<Exclude<LoanPlan, 'none'>, { threshold: number; rate: number; label: string }> = {
  plan1: { threshold: 26_900, rate: 0.09, label: 'Plan 1' },
  plan2: { threshold: 29_385, rate: 0.09, label: 'Plan 2' },
  plan4: { threshold: 33_795, rate: 0.09, label: 'Plan 4 (Scotland)' },
  plan5: { threshold: 25_000, rate: 0.09, label: 'Plan 5' },
  postgrad: { threshold: 21_000, rate: 0.06, label: 'Postgraduate Loan' },
};

export interface TakeHome {
  gross: number;
  pension: number;
  personalAllowance: number;
  taxable: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  takeHome: number;
  monthly: number;
  /** Income tax by band, for the breakdown. */
  bands: { rate: number; amount: number; tax: number }[];
  /** Marginal rate on the next £1 of salary (tax + NI + loan, before pension). */
  marginal: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function personalAllowance(adjustedNetIncome: number): number {
  if (adjustedNetIncome <= PA_TAPER_FROM) return PA;
  return Math.max(0, PA - Math.floor((adjustedNetIncome - PA_TAPER_FROM) / 2));
}

function core(p: IncomeProfile) {
  const gross = Math.max(0, (p.salary || 0) + (p.bonus || 0));
  const pct = Math.min(100, Math.max(0, p.pensionPct || 0));
  const method: PensionMethod = p.pensionMethod ?? 'sacrifice';
  const pension = r2((gross * pct) / 100);
  const region: TaxRegion = p.region ?? 'rUK';

  // Pay that NI and student loans are worked out on: salary sacrifice reduces it, net pay does not.
  const niPay = method === 'sacrifice' ? gross - pension : gross;
  // Pay that income tax is worked out on: both methods reduce it.
  const taxPay = gross - pension;

  const allowance = personalAllowance(taxPay);
  const taxable = Math.max(0, taxPay - allowance);
  let left = taxable;
  let prev = 0;
  let incomeTax = 0;
  const bands: TakeHome['bands'] = [];
  for (const [top, rate] of BANDS[region]) {
    const width = top - prev;
    const amt = Math.min(left, width);
    if (amt > 0) {
      const tax = amt * rate;
      bands.push({ rate, amount: r2(amt), tax: r2(tax) });
      incomeTax += tax;
      left -= amt;
    }
    prev = top;
    if (left <= 0) break;
  }

  const ni = Math.max(0, Math.min(niPay, NI_UEL) - NI_PT) * NI_MAIN + Math.max(0, niPay - NI_UEL) * NI_UPPER;

  let loan = 0;
  const plan = p.loan ?? 'none';
  if (plan !== 'none') {
    const l = LOAN_THRESHOLDS[plan];
    loan += Math.max(0, niPay - l.threshold) * l.rate;
  }
  if (p.postgrad && plan !== 'postgrad') {
    const l = LOAN_THRESHOLDS.postgrad;
    loan += Math.max(0, niPay - l.threshold) * l.rate;
  }
  return { gross, pension, allowance, taxable, incomeTax, ni, loan, bands };
}

export function takeHome(p: IncomeProfile): TakeHome {
  const c = core(p);
  const incomeTax = r2(c.incomeTax);
  const ni = r2(c.ni);
  const loan = r2(c.loan);
  const net = r2(c.gross - c.pension - incomeTax - ni - loan);
  // Marginal rate: what the next £100 of salary loses to tax, NI and loans.
  const next = core({ ...p, salary: (p.salary || 0) + 100, pensionPct: 0 });
  const base = core({ ...p, pensionPct: 0 });
  const marginal = (next.incomeTax + next.ni + next.loan - (base.incomeTax + base.ni + base.loan)) / 100;
  return {
    gross: r2(c.gross),
    pension: r2(c.pension),
    personalAllowance: c.allowance,
    taxable: r2(c.taxable),
    incomeTax,
    nationalInsurance: ni,
    studentLoan: loan,
    takeHome: net,
    monthly: r2(net / 12),
    bands: c.bands,
    marginal: Math.round(marginal * 1000) / 1000,
  };
}

/** Yearly amount saved from income for the forecast, in GBP. */
export function yearlySavings(p: IncomeProfile | undefined): number {
  if (!p || !(p.salary > 0) || p.inForecast === false) return 0;
  const rate = Math.min(100, Math.max(0, p.savingsRate ?? DEFAULT_SAVINGS_RATE));
  return r2((takeHome(p).takeHome * rate) / 100);
}
