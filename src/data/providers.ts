/**
 * Every UK provider Cardinal will connect to. In v1 they are all "coming soon":
 * picking one labels a manually entered account. When a real connection is
 * built, change its `status` to 'available' and register a connector in
 * src/integrations/registry.ts under the same `id`.
 */
export type ProviderKind = 'bank' | 'isa' | 'investment' | 'pension_workplace' | 'pension_personal' | 'crypto';
export type ProviderStatus = 'coming_soon' | 'available';

export interface Provider {
  id: string;
  name: string;
  kinds: ProviderKind[];
  /** Brand colour for the monogram tile. */
  color: string;
  status: ProviderStatus;
}

type Row = [name: string, color: string, kinds: ProviderKind[]];

const B: ProviderKind[] = ['bank'];
const ROWS: Row[] = [
  // ── High-street & private banks ───────────────────────────────
  ['HSBC UK', '#DB0011', ['bank', 'isa', 'investment']],
  ['Barclays', '#00AEEF', ['bank', 'isa', 'investment']],
  ['Lloyds Bank', '#006A4D', ['bank', 'isa', 'investment']],
  ['NatWest', '#5A287D', ['bank', 'isa', 'investment']],
  ['Santander UK', '#EC0000', ['bank', 'isa']],
  ['Chase UK (J.P. Morgan)', '#117ACA', ['bank', 'isa']],
  ['Halifax', '#005EB8', ['bank', 'isa', 'investment']],
  ['Nationwide', '#1B1464', ['bank', 'isa']],
  ['Royal Bank of Scotland', '#0A2240', ['bank', 'isa']],
  ['Bank of Scotland', '#0E2A47', ['bank', 'isa']],
  ['TSB', '#1E3E8C', ['bank', 'isa']],
  ['Virgin Money', '#CC0000', ['bank', 'isa', 'investment']],
  ['The Co-operative Bank', '#00B1E7', B],
  ['Metro Bank', '#E2231A', ['bank', 'isa']],
  ['first direct', '#000000', ['bank', 'isa']],
  ['Ulster Bank', '#1E2F5D', B],
  ['Danske Bank UK', '#003755', B],
  ['Bank of Ireland UK', '#0033A0', ['bank', 'isa']],
  ['AIB (NI)', '#5B2C86', B],
  ['M&S Bank', '#000000', ['bank', 'isa']],
  ['Tesco Bank', '#00539F', ['bank', 'isa']],
  ['Sainsbury\'s Bank', '#F06C00', ['bank', 'isa']],
  ['Post Office Money', '#E10A0A', ['bank', 'isa']],
  ['Smile', '#E6007E', B],
  ['Cahoot', '#F7A600', B],
  ['Coutts', '#1D1D1B', ['bank', 'investment']],
  ['C. Hoare & Co.', '#2B2B2B', ['bank', 'investment']],
  ['Handelsbanken UK', '#005AA0', B],
  ['Investec', '#003B5C', ['bank', 'isa', 'investment']],
  ['Arbuthnot Latham', '#00263E', ['bank', 'investment']],
  ['Triodos Bank', '#00395D', ['bank', 'isa']],
  ['Al Rayan Bank', '#6E2B62', ['bank', 'isa']],
  // ── Digital banks & money apps ────────────────────────────────
  ['Monzo', '#FF4F40', ['bank', 'isa', 'pension_personal']],
  ['Starling Bank', '#7433FF', B],
  ['Revolut', '#191C1F', ['bank', 'isa', 'investment', 'crypto']],
  ['Kroo', '#00B6A4', B],
  ['Atom bank', '#2E1A47', ['bank', 'isa']],
  ['Zopa', '#1B1E3F', ['bank', 'isa']],
  ['Wise', '#9FE870', B],
  ['Chip', '#2D2D2D', ['bank', 'isa', 'investment']],
  ['Plum', '#2B2A33', ['bank', 'isa', 'investment', 'pension_personal']],
  ['Marcus by Goldman Sachs', '#002B5C', ['bank', 'isa']],
  // ── Savings banks & building societies ───────────────────────
  ['NS&I', '#7D2B8B', ['bank', 'isa']],
  ['Yorkshire Building Society', '#0072CE', ['bank', 'isa']],
  ['Coventry Building Society', '#00447C', ['bank', 'isa']],
  ['Skipton Building Society', '#004F9F', ['bank', 'isa']],
  ['Leeds Building Society', '#006BB6', ['bank', 'isa']],
  ['Principality Building Society', '#E4002B', ['bank', 'isa']],
  ['West Bromwich Building Society', '#00843D', ['bank', 'isa']],
  ['Newcastle Building Society', '#0D2A54', ['bank', 'isa']],
  ['Nottingham Building Society', '#004C97', ['bank', 'isa']],
  ['Cumberland Building Society', '#003C71', ['bank', 'isa']],
  ['Paragon Bank', '#00A3AD', ['bank', 'isa']],
  ['Shawbrook Bank', '#5A1F7A', ['bank', 'isa']],
  ['Aldermore', '#E5007D', ['bank', 'isa']],
  ['OakNorth', '#0B1F3A', ['bank', 'isa']],
  ['Close Brothers Savings', '#00205B', ['bank', 'isa']],
  ['Charter Savings Bank', '#00365F', ['bank', 'isa']],
  ['Secure Trust Bank', '#2B2B6F', ['bank', 'isa']],
  ['United Trust Bank', '#00283C', ['bank', 'isa']],
  ['Cynergy Bank', '#E4003A', ['bank', 'isa']],
  ['Hampshire Trust Bank', '#003A63', ['bank', 'isa']],
  ['Gatehouse Bank', '#1C3F94', ['bank', 'isa']],
  ['Raisin UK', '#00A6A6', ['bank', 'isa']],
  ['Ford Money', '#003478', B],
  ['Allica Bank', '#FF5A5F', B],
  // ── Investment platforms & ISA managers ───────────────────────
  ['Hargreaves Lansdown', '#00205B', ['isa', 'investment', 'pension_personal', 'pension_workplace']],
  ['AJ Bell', '#E4002B', ['isa', 'investment', 'pension_personal']],
  ['interactive investor', '#E6007E', ['isa', 'investment', 'pension_personal']],
  ['Vanguard UK', '#96151D', ['isa', 'investment', 'pension_personal']],
  ['Fidelity International', '#368727', ['isa', 'investment', 'pension_personal', 'pension_workplace']],
  ['Trading 212', '#0A84FF', ['isa', 'investment']],
  ['Freetrade', '#3D4BE0', ['isa', 'investment', 'pension_personal']],
  ['InvestEngine', '#1A1F71', ['isa', 'investment', 'pension_personal']],
  ['Lightyear', '#111111', ['isa', 'investment']],
  ['Nutmeg', '#1A1A2E', ['isa', 'investment', 'pension_personal']],
  ['Moneybox', '#1C2B39', ['isa', 'investment', 'pension_personal']],
  ['Moneyfarm', '#00294B', ['isa', 'investment', 'pension_personal']],
  ['Wealthify', '#6A2C91', ['isa', 'investment', 'pension_personal']],
  ['Dodl by AJ Bell', '#FF4F4F', ['isa', 'investment']],
  ['eToro', '#13C636', ['isa', 'investment', 'crypto']],
  ['DEGIRO', '#00A2E8', ['investment']],
  ['Interactive Brokers', '#D81222', ['isa', 'investment', 'pension_personal']],
  ['Saxo Markets', '#0A2240', ['isa', 'investment', 'pension_personal']],
  ['IG', '#E5212D', ['isa', 'investment', 'pension_personal']],
  ['Charles Stanley Direct', '#002855', ['isa', 'investment', 'pension_personal']],
  ['Bestinvest', '#00A9A5', ['isa', 'investment', 'pension_personal']],
  ['HSBC InvestDirect', '#DB0011', ['isa', 'investment']],
  ['Barclays Smart Investor', '#00AEEF', ['isa', 'investment', 'pension_personal']],
  ['Lloyds Bank Share Dealing', '#006A4D', ['isa', 'investment', 'pension_personal']],
  ['Halifax Share Dealing', '#005EB8', ['isa', 'investment', 'pension_personal']],
  ['Scottish Widows', '#00543C', ['isa', 'investment', 'pension_workplace', 'pension_personal']],
  ['Aviva', '#FFD900', ['isa', 'investment', 'pension_workplace', 'pension_personal']],
  ['Legal & General', '#0072CE', ['isa', 'investment', 'pension_workplace', 'pension_personal']],
  ['Standard Life', '#0A2C5A', ['isa', 'investment', 'pension_workplace', 'pension_personal']],
  ['Royal London', '#002C77', ['isa', 'investment', 'pension_workplace', 'pension_personal']],
  ['Aegon', '#0F3F7A', ['isa', 'investment', 'pension_workplace', 'pension_personal']],
  ['Quilter', '#2A1556', ['isa', 'investment', 'pension_personal']],
  ['St. James\'s Place', '#00264D', ['isa', 'investment', 'pension_personal']],
  ['True Potential', '#00A3E0', ['isa', 'investment', 'pension_personal']],
  ['Transact', '#003B71', ['isa', 'investment', 'pension_personal']],
  ['M&G Wealth', '#E30613', ['isa', 'investment', 'pension_workplace', 'pension_personal']],
  ['Wealth at Work', '#00467F', ['isa', 'investment', 'pension_workplace']],
  // ── Workplace pensions ────────────────────────────────────────
  ['Nest', '#E5007E', ['pension_workplace']],
  ['The People\'s Pension', '#6B2C91', ['pension_workplace']],
  ['NOW: Pensions', '#00A9E0', ['pension_workplace']],
  ['Smart Pension', '#00C389', ['pension_workplace']],
  ['Cushon', '#2E1A47', ['pension_workplace', 'isa']],
  ['Mercer Workplace Savings', '#002C77', ['pension_workplace']],
  ['LifeSight (WTW)', '#702082', ['pension_workplace']],
  ['Aon MasterTrust', '#EB0017', ['pension_workplace']],
  ['Zurich', '#2167AE', ['pension_workplace', 'pension_personal']],
  ['Prudential', '#ED1B2E', ['pension_workplace', 'pension_personal']],
  ['Phoenix Life', '#E2001A', ['pension_workplace', 'pension_personal']],
  ['Royal London Workplace', '#002C77', ['pension_workplace']],
  ['Salvus Master Trust', '#003B5C', ['pension_workplace']],
  ['TPT Retirement Solutions', '#00426A', ['pension_workplace']],
  ['USS', '#003B71', ['pension_workplace']],
  ['NHS Pension Scheme', '#005EB8', ['pension_workplace']],
  ['Civil Service Pension (Alpha)', '#00703C', ['pension_workplace']],
  ['Teachers\' Pension', '#3F2A56', ['pension_workplace']],
  ['Local Government Pension Scheme', '#1D70B8', ['pension_workplace']],
  ['Armed Forces Pension', '#532A45', ['pension_workplace']],
  ['Police Pension Scheme', '#0B0C0C', ['pension_workplace']],
  ['Railpen', '#E31837', ['pension_workplace']],
  // ── Personal pensions / SIPPs ─────────────────────────────────
  ['PensionBee', '#FFCD00', ['pension_personal']],
  ['Penfold', '#2D2D86', ['pension_personal']],
  ['Hargreaves Lansdown SIPP', '#00205B', ['pension_personal']],
  ['Vanguard Personal Pension', '#96151D', ['pension_personal']],
  // ── Crypto ────────────────────────────────────────────────────
  ['Coinbase', '#0052FF', ['crypto']],
  ['Binance', '#F0B90B', ['crypto']],
  ['Kraken', '#5741D9', ['crypto']],
  ['Crypto.com', '#002D74', ['crypto']],
  ['Bybit', '#F7A600', ['crypto']],
  ['Gemini', '#00DCFA', ['crypto']],
  ['Bitstamp', '#16B157', ['crypto']],
  ['OKX', '#000000', ['crypto']],
  ['Bitpanda', '#2ECC71', ['crypto']],
  ['Uphold', '#49CC68', ['crypto']],
  ['KuCoin', '#23AF91', ['crypto']],
  ['Gate.io', '#2354E6', ['crypto']],
  ['Bitget', '#00F0FF', ['crypto']],
  ['Ledger', '#000000', ['crypto']],
  ['Trezor', '#00854D', ['crypto']],
  ['MetaMask', '#F6851B', ['crypto']],
  ['Exodus', '#1F2033', ['crypto']],
  ['Trust Wallet', '#3375BB', ['crypto']],
  ['Phantom', '#AB9FF2', ['crypto']],
];

function slug(s: string): string {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const seen = new Set<string>();
export const PROVIDERS: Provider[] = ROWS.filter(([name]) => {
  const k = slug(name);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
}).map(([name, color, kinds]) => ({ id: slug(name), name, color, kinds, status: 'coming_soon' as const }));

export function providersFor(kinds: ProviderKind[]): Provider[] {
  return PROVIDERS.filter((p) => p.kinds.some((k) => kinds.includes(k))).sort((a, b) => a.name.localeCompare(b.name));
}

export function providerById(id?: string): Provider | undefined {
  return id ? PROVIDERS.find((p) => p.id === id) : undefined;
}

export const KIND_LABELS: Record<ProviderKind, string> = {
  bank: 'Banks & building societies',
  isa: 'ISA providers',
  investment: 'Investment platforms',
  pension_workplace: 'Workplace pensions',
  pension_personal: 'Personal pensions & SIPPs',
  crypto: 'Crypto exchanges & wallets',
};
