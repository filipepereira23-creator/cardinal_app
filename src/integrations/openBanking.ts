/**
 * ─── OPEN BANKING CONSENT (UI seam, nothing connects yet) ──────────────────
 *
 * The "Connect" flow mirrors a UK Open Banking AIS consent journey:
 *   1. Select a provider          (ConnectFlow: list step)
 *   2. Review what Cardinal asks  (ConnectFlow: consent step, CONSENT_SCOPES below)
 *   3. Continue → the provider's own login (redirect via an aggregator such as
 *      TrueLayer / Yapily / GoCardless Bank Account Data), then back to Cardinal
 *      with read-only access for up to 90 days before reconfirming.
 *
 * In v1 `startConsent` never redirects: it reports 'coming_soon' and the user
 * can add the balance by hand. Wire a real connector in ./registry.ts and
 * `startConsent` will hand over to it.
 */
import type { ProviderKind } from '../data/providers';
import { connectorFor, isConnectable } from './registry';

export interface ConsentScope {
  title: string;
  detail: string;
}

const BANK: ConsentScope[] = [
  { title: 'Your account details', detail: 'Account name, type, sort code and account number' },
  { title: 'Your balances', detail: 'Current and available balance, including any overdraft' },
  { title: 'Your transactions', detail: 'Money in and out, for up to the last 12 months' },
  { title: 'Your regular payments', detail: 'Standing orders and direct debits' },
];
const INVEST: ConsentScope[] = [
  { title: 'Your account details', detail: 'Account type, e.g. ISA, SIPP or general account' },
  { title: 'Your holdings', detail: 'Funds, shares and cash held, with units and value' },
  { title: 'Your valuation history', detail: 'How the account value changed over time' },
];
const PENSION: ConsentScope[] = [
  { title: 'Your pension details', detail: 'Scheme name, policy number and employer' },
  { title: 'Your pot value', detail: 'Current value and the funds it is invested in' },
  { title: 'Your contributions', detail: 'What you and your employer pay in' },
];
const CRYPTO: ConsentScope[] = [
  { title: 'Your wallets', detail: 'Which coins and tokens you hold' },
  { title: 'Your balances', detail: 'Amount of each coin and its value' },
  { title: 'Your trade history', detail: 'Buys, sells and transfers' },
];

export function consentScopes(kinds: ProviderKind[]): ConsentScope[] {
  if (kinds.includes('bank')) return BANK;
  if (kinds.includes('crypto')) return CRYPTO;
  if (kinds.some((k) => k.startsWith('pension'))) return PENSION;
  return INVEST;
}

/** How long a consent lasts before the user has to reconfirm (UK AIS rules: 90 days). */
export const CONSENT_DAYS = 90;

export type ConsentResult = { status: 'coming_soon' } | { status: 'redirecting' };

export async function startConsent(providerId: string): Promise<ConsentResult> {
  const c = connectorFor(providerId);
  if (c && isConnectable(providerId)) {
    await c.connect();
    return { status: 'redirecting' };
  }
  return { status: 'coming_soon' };
}
