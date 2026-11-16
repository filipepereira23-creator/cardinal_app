/**
 * Every UK provider Cardinal will connect to. In v1 they are all "coming soon":
 * picking one labels a manually entered account. When a real connection is
 * built, change its `status` to 'available' and register a connector in
 * src/integrations/registry.ts under the same `id`.
 */
export type ProviderKind = 'bank' | 'isa' | 'investment' | 'pension_workplace' | 'pension_personal' | 'crypto' | 'lender';
export type ProviderStatus = 'coming_soon' | 'available';

export interface Provider {
  id: string;
  name: string;
  kinds: ProviderKind[];
  /** Brand colour for the fallback monogram tile. */
  color: string;
  /** Website domain. The logo is the site's own icon, loaded by domain (see ProviderMark). */
  domain: string;
  status: ProviderStatus;
}

type Row = [name: string, color: string, kinds: ProviderKind[], domain: string];

const B: ProviderKind[] = ['bank'];
const ROWS: Row[] = [
  // ── High-street & private banks ───────────────────────────────
  ['HSBC UK', '#DB0011', ['bank', 'isa', 'investment'], 'hsbc.co.uk'],
  ['Barclays', '#00AEEF', ['bank', 'isa', 'investment'], 'barclays.co.uk'],
  ['Lloyds Bank', '#006A4D', ['bank', 'isa', 'investment'], 'lloydsbank.com'],
  ['NatWest', '#5A287D', ['bank', 'isa', 'investment'], 'natwest.com'],
  ['Santander UK', '#EC0000', ['bank', 'isa'], 'santander.co.uk'],
  ['Chase UK (J.P. Morgan)', '#117ACA', ['bank', 'isa'], 'chase.co.uk'],
  ['Halifax', '#005EB8', ['bank', 'isa', 'investment'], 'halifax.co.uk'],
  ['Nationwide', '#1B1464', ['bank', 'isa'], 'nationwide.co.uk'],
  ['Royal Bank of Scotland', '#0A2240', ['bank', 'isa'], 'rbs.co.uk'],
  ['Bank of Scotland', '#0E2A47', ['bank', 'isa'], 'bankofscotland.co.uk'],
  ['TSB', '#1E3E8C', ['bank', 'isa'], 'tsb.co.uk'],
  ['Virgin Money', '#CC0000', ['bank', 'isa', 'investment'], 'virginmoney.com'],
  ['The Co-operative Bank', '#00B1E7', B, 'co-operativebank.co.uk'],
  ['Metro Bank', '#E2231A', ['bank', 'isa'], 'metrobankonline.co.uk'],
  ['first direct', '#000000', ['bank', 'isa'], 'firstdirect.com'],
  ['Ulster Bank', '#1E2F5D', B, 'ulsterbank.co.uk'],
  ['Danske Bank UK', '#003755', B, 'danskebank.co.uk'],
  ['Bank of Ireland UK', '#0033A0', ['bank', 'isa'], 'bankofireland.com'],
  ['AIB (NI)', '#5B2C86', B, 'aibni.co.uk'],
  ['M&S Bank', '#000000', ['bank', 'isa'], 'bank.marksandspencer.com'],
  ['Tesco Bank', '#00539F', ['bank', 'isa'], 'tescobank.com'],
  ['Sainsbury\'s Bank', '#F06C00', ['bank', 'isa'], 'sainsburysbank.co.uk'],
  ['Post Office Money', '#E10A0A', ['bank', 'isa'], 'postoffice.co.uk'],
  ['Smile', '#E6007E', B, 'smile.co.uk'],
  ['Cahoot', '#F7A600', B, 'cahoot.com'],
  ['Coutts', '#1D1D1B', ['bank', 'investment'], 'coutts.com'],
  ['C. Hoare & Co.', '#2B2B2B', ['bank', 'investment'], 'hoaresbank.co.uk'],
  ['Handelsbanken UK', '#005AA0', B, 'handelsbanken.co.uk'],
  ['Investec', '#003B5C', ['bank', 'isa', 'investment'], 'investec.com'],
  ['Arbuthnot Latham', '#00263E', ['bank', 'investment'], 'arbuthnotlatham.co.uk'],
  ['Triodos Bank', '#00395D', ['bank', 'isa'], 'triodos.co.uk'],
  ['Al Rayan Bank', '#6E2B62', ['bank', 'isa'], 'alrayanbank.co.uk'],
  // ── Digital banks & money apps ────────────────────────────────
  ['Monzo', '#FF4F40', ['bank', 'isa', 'pension_personal'], 'monzo.com'],
  ['Starling Bank', '#7433FF', B, 'starlingbank.com'],
  ['Revolut', '#191C1F', ['bank', 'isa', 'investment', 'crypto'], 'revolut.com'],
  ['Kroo', '#00B6A4', B, 'kroo.com'],
  ['Atom bank', '#2E1A47', ['bank', 'isa'], 'atombank.co.uk'],
  ['Zopa', '#1B1E3F', ['bank', 'isa'], 'zopa.com'],
  ['Wise', '#9FE870', B, 'wise.com'],
  ['Chip', '#2D2D2D', ['bank', 'isa', 'investment'], 'getchip.uk'],
  ['Plum', '#2B2A33', ['bank', 'isa', 'investment', 'pension_personal'], 'withplum.com'],
  ['Marcus by Goldman Sachs', '#002B5C', ['bank', 'isa'], 'marcus.co.uk'],
  // ── Savings banks & building societies ───────────────────────
  ['NS&I', '#7D2B8B', ['bank', 'isa'], 'nsandi.com'],
  ['Yorkshire Building Society', '#0072CE', ['bank', 'isa'], 'ybs.co.uk'],
  ['Coventry Building Society', '#00447C', ['bank', 'isa'], 'coventrybuildingsociety.co.uk'],
  ['Skipton Building Society', '#004F9F', ['bank', 'isa'], 'skipton.co.uk'],
  ['Leeds Building Society', '#006BB6', ['bank', 'isa'], 'leedsbuildingsociety.co.uk'],
  ['Principality Building Society', '#E4002B', ['bank', 'isa'], 'principality.co.uk'],
  ['West Bromwich Building Society', '#00843D', ['bank', 'isa'], 'westbrom.co.uk'],
  ['Newcastle Building Society', '#0D2A54', ['bank', 'isa'], 'newcastle.co.uk'],
  ['Nottingham Building Society', '#004C97', ['bank', 'isa'], 'thenottingham.com'],
  ['Cumberland Building Society', '#003C71', ['bank', 'isa'], 'cumberland.co.uk'],
  ['Paragon Bank', '#00A3AD', ['bank', 'isa'], 'paragon.co.uk'],
  ['Shawbrook Bank', '#5A1F7A', ['bank', 'isa'], 'shawbrook.co.uk'],
  ['Aldermore', '#E5007D', ['bank', 'isa'], 'aldermore.co.uk'],
  ['OakNorth', '#0B1F3A', ['bank', 'isa'], 'oaknorth.co.uk'],
  ['Close Brothers Savings', '#00205B', ['bank', 'isa'], 'closebrothers.com'],
  ['Charter Savings Bank', '#00365F', ['bank', 'isa'], 'chartersavingsbank.co.uk'],
  ['Secure Trust Bank', '#2B2B6F', ['bank', 'isa'], 'securetrustbank.com'],
  ['United Trust Bank', '#00283C', ['bank', 'isa'], 'utbank.co.uk'],
  ['Cynergy Bank', '#E4003A', ['bank', 'isa'], 'cynergybank.co.uk'],
  ['Hampshire Trust Bank', '#003A63', ['bank', 'isa'], 'htb.co.uk'],
  ['Gatehouse Bank', '#1C3F94', ['bank', 'isa'], 'gatehousebank.com'],
  ['Raisin UK', '#00A6A6', ['bank', 'isa'], 'raisin.co.uk'],
  ['Ford Money', '#003478', B, 'fordmoney.co.uk'],
  ['Allica Bank', '#FF5A5F', B, 'allica.bank'],
  // ── Investment platforms & ISA managers ───────────────────────
  ['Hargreaves Lansdown', '#00205B', ['isa', 'investment', 'pension_personal', 'pension_workplace'], 'hl.co.uk'],
  ['AJ Bell', '#E4002B', ['isa', 'investment', 'pension_personal'], 'ajbell.co.uk'],
  ['interactive investor', '#E6007E', ['isa', 'investment', 'pension_personal'], 'ii.co.uk'],
  ['Vanguard UK', '#96151D', ['isa', 'investment', 'pension_personal'], 'vanguardinvestor.co.uk'],
  ['Fidelity', '#368727', ['isa', 'investment', 'pension_personal', 'pension_workplace'], 'fidelityinternational.com'],
  ['Trading 212', '#0A84FF', ['isa', 'investment'], 'trading212.com'],
  ['Freetrade', '#3D4BE0', ['isa', 'investment', 'pension_personal'], 'freetrade.io'],
  ['InvestEngine', '#1A1F71', ['isa', 'investment', 'pension_personal'], 'investengine.com'],
  ['Lightyear', '#111111', ['isa', 'investment'], 'lightyear.com'],
  ['Nutmeg', '#1A1A2E', ['isa', 'investment', 'pension_personal'], 'nutmeg.com'],
  ['Moneybox', '#1C2B39', ['isa', 'investment', 'pension_personal'], 'moneyboxapp.com'],
  ['Moneyfarm', '#00294B', ['isa', 'investment', 'pension_personal'], 'moneyfarm.com'],
  ['Wealthify', '#6A2C91', ['isa', 'investment', 'pension_personal'], 'wealthify.com'],
  ['Dodl by AJ Bell', '#FF4F4F', ['isa', 'investment'], 'dodl.co.uk'],
  ['eToro', '#13C636', ['isa', 'investment', 'crypto'], 'etoro.com'],
  ['DEGIRO', '#00A2E8', ['investment'], 'degiro.co.uk'],
  ['Interactive Brokers', '#D81222', ['isa', 'investment', 'pension_personal'], 'interactivebrokers.co.uk'],
  ['Saxo Markets', '#0A2240', ['isa', 'investment', 'pension_personal'], 'home.saxo'],
  ['IG', '#E5212D', ['isa', 'investment', 'pension_personal'], 'ig.com'],
  ['Charles Stanley Direct', '#002855', ['isa', 'investment', 'pension_personal'], 'charles-stanley.co.uk'],
  ['Bestinvest', '#00A9A5', ['isa', 'investment', 'pension_personal'], 'bestinvest.co.uk'],
  ['HSBC InvestDirect', '#DB0011', ['isa', 'investment'], 'hsbc.co.uk'],
  ['Barclays Smart Investor', '#00AEEF', ['isa', 'investment', 'pension_personal'], 'barclays.co.uk'],
  ['Lloyds Bank Share Dealing', '#006A4D', ['isa', 'investment', 'pension_personal'], 'lloydsbank.com'],
  ['Halifax Share Dealing', '#005EB8', ['isa', 'investment', 'pension_personal'], 'halifax.co.uk'],
  ['Scottish Widows', '#00543C', ['isa', 'investment', 'pension_workplace', 'pension_personal'], 'scottishwidows.co.uk'],
  ['Aviva', '#FFD900', ['isa', 'investment', 'pension_workplace', 'pension_personal'], 'aviva.co.uk'],
  ['Legal & General', '#0072CE', ['isa', 'investment', 'pension_workplace', 'pension_personal'], 'legalandgeneral.com'],
  ['Standard Life', '#0A2C5A', ['isa', 'investment', 'pension_workplace', 'pension_personal'], 'standardlife.co.uk'],
  ['Royal London', '#002C77', ['isa', 'investment', 'pension_workplace', 'pension_personal'], 'royallondon.com'],
  ['Aegon', '#0F3F7A', ['isa', 'investment', 'pension_workplace', 'pension_personal'], 'aegon.com'],
  ['Quilter', '#2A1556', ['isa', 'investment', 'pension_personal'], 'quilter.com'],
  ['St. James\'s Place', '#00264D', ['isa', 'investment', 'pension_personal'], 'sjp.co.uk'],
  ['True Potential', '#00A3E0', ['isa', 'investment', 'pension_personal'], 'truepotential.co.uk'],
  ['Transact', '#003B71', ['isa', 'investment', 'pension_personal'], 'transact-online.co.uk'],
  ['M&G Wealth', '#E30613', ['isa', 'investment', 'pension_workplace', 'pension_personal'], 'mandg.com'],
  ['Wealth at Work', '#00467F', ['isa', 'investment', 'pension_workplace'], 'wealthatwork.co.uk'],
  // ── Workplace pensions ────────────────────────────────────────
  ['Nest', '#E5007E', ['pension_workplace'], 'nestpensions.org.uk'],
  ['The People\'s Pension', '#6B2C91', ['pension_workplace'], 'thepeoplespension.co.uk'],
  ['NOW: Pensions', '#00A9E0', ['pension_workplace'], 'nowpensions.com'],
  ['Smart Pension', '#00C389', ['pension_workplace'], 'smartpension.co.uk'],
  ['Cushon', '#2E1A47', ['pension_workplace', 'isa'], 'cushon.co.uk'],
  ['Mercer Workplace Savings', '#002C77', ['pension_workplace'], 'mercer.co.uk'],
  ['LifeSight (WTW)', '#702082', ['pension_workplace'], 'wtwco.com'],
  ['Aon MasterTrust', '#EB0017', ['pension_workplace'], 'aon.com'],
  ['Zurich', '#2167AE', ['pension_workplace', 'pension_personal'], 'zurich.co.uk'],
  ['Prudential', '#ED1B2E', ['pension_workplace', 'pension_personal'], 'pru.co.uk'],
  ['Phoenix Life', '#E2001A', ['pension_workplace', 'pension_personal'], 'thephoenixgroup.com'],
  ['Royal London Workplace', '#002C77', ['pension_workplace'], 'royallondon.com'],
  ['Salvus Master Trust', '#003B5C', ['pension_workplace'], 'salvusmastertrust.co.uk'],
  ['TPT Retirement Solutions', '#00426A', ['pension_workplace'], 'tpt.org.uk'],
  ['USS', '#003B71', ['pension_workplace'], 'uss.co.uk'],
  ['NHS Pension Scheme', '#005EB8', ['pension_workplace'], 'nhsbsa.nhs.uk'],
  ['Civil Service Pension (Alpha)', '#00703C', ['pension_workplace'], 'civilservicepensionscheme.org.uk'],
  ['Teachers\' Pension', '#3F2A56', ['pension_workplace'], 'teacherspensions.co.uk'],
  ['Local Government Pension Scheme', '#1D70B8', ['pension_workplace'], 'lgpsmember.org'],
  ['Armed Forces Pension', '#532A45', ['pension_workplace'], 'gov.uk'],
  ['Police Pension Scheme', '#0B0C0C', ['pension_workplace'], 'gov.uk'],
  ['Railpen', '#E31837', ['pension_workplace'], 'railpen.com'],
  // ── Personal pensions / SIPPs ─────────────────────────────────
  ['PensionBee', '#FFCD00', ['pension_personal'], 'pensionbee.com'],
  ['Penfold', '#2D2D86', ['pension_personal'], 'getpenfold.com'],
  ['Hargreaves Lansdown SIPP', '#00205B', ['pension_personal'], 'hl.co.uk'],
  ['Vanguard Personal Pension', '#96151D', ['pension_personal'], 'vanguardinvestor.co.uk'],
  // ── More pension providers ────────────────────────────────────
  ['Canada Life', '#D52B1E', ['pension_workplace', 'pension_personal'], 'canadalife.co.uk'],
  ['Utmost Life and Pensions', '#00263A', ['pension_workplace', 'pension_personal'], 'utmost.co.uk'],
  ['Just Group', '#00A19A', ['pension_personal'], 'justgroup.co.uk'],
  ['Barnett Waddingham', '#00205B', ['pension_workplace'], 'barnett-waddingham.co.uk'],
  ['Evelyn Partners', '#1B365D', ['isa', 'investment', 'pension_personal'], 'evelyn.com'],
  ['Rathbones', '#0D2240', ['isa', 'investment', 'pension_personal'], 'rathbones.com'],
  ['RBC Brewin Dolphin', '#002144', ['isa', 'investment', 'pension_personal'], 'brewin.co.uk'],
  ['Nucleus', '#00A6CE', ['isa', 'investment', 'pension_personal'], 'nucleusfinancial.com'],
  ['Aviva Workplace Pension', '#FFD900', ['pension_workplace'], 'aviva.co.uk'],
  ['Scottish Widows Workplace Pension', '#00543C', ['pension_workplace'], 'scottishwidows.co.uk'],
  ['Legal & General WorkSave', '#0072CE', ['pension_workplace'], 'legalandgeneral.com'],
  ['Standard Life Workplace', '#0A2C5A', ['pension_workplace'], 'standardlife.co.uk'],
  ['Aegon Workplace (TargetPlan)', '#0F3F7A', ['pension_workplace'], 'aegon.com'],
  ['Fidelity Workplace Investing', '#368727', ['pension_workplace'], 'fidelityinternational.com'],
  // ── Crypto ────────────────────────────────────────────────────
  ['Coinbase', '#0052FF', ['crypto'], 'coinbase.com'],
  ['Binance', '#F0B90B', ['crypto'], 'binance.com'],
  ['Kraken', '#5741D9', ['crypto'], 'kraken.com'],
  ['Crypto.com', '#002D74', ['crypto'], 'crypto.com'],
  ['Bybit', '#F7A600', ['crypto'], 'bybit.com'],
  ['Gemini', '#00DCFA', ['crypto'], 'gemini.com'],
  ['Bitstamp', '#16B157', ['crypto'], 'bitstamp.net'],
  ['OKX', '#000000', ['crypto'], 'okx.com'],
  ['Bitpanda', '#2ECC71', ['crypto'], 'bitpanda.com'],
  ['Uphold', '#49CC68', ['crypto'], 'uphold.com'],
  ['KuCoin', '#23AF91', ['crypto'], 'kucoin.com'],
  ['Gate.io', '#2354E6', ['crypto'], 'gate.io'],
  ['Bitget', '#00F0FF', ['crypto'], 'bitget.com'],
  ['Ledger', '#000000', ['crypto'], 'ledger.com'],
  ['Trezor', '#00854D', ['crypto'], 'trezor.io'],
  ['MetaMask', '#F6851B', ['crypto'], 'metamask.io'],
  ['Exodus', '#1F2033', ['crypto'], 'exodus.com'],
  ['Trust Wallet', '#3375BB', ['crypto'], 'trustwallet.com'],
  ['Phantom', '#AB9FF2', ['crypto'], 'phantom.app'],
  // ── Lenders, card issuers & finance houses (for Debts) ─────────
  ['American Express', '#006FCF', ['lender'], 'americanexpress.com'],
  ['Barclaycard', '#00AEEF', ['lender'], 'barclaycard.co.uk'],
  ['Capital One UK', '#004879', ['lender'], 'capitalone.co.uk'],
  ['MBNA', '#0B3D91', ['lender'], 'mbna.co.uk'],
  ['Vanquis', '#00A0DF', ['lender'], 'vanquis.co.uk'],
  ['NewDay (Aqua, Marbles)', '#00263E', ['lender'], 'newday.co.uk'],
  ['Black Horse', '#006A4D', ['lender'], 'blackhorse.co.uk'],
  ['Santander Consumer Finance', '#EC0000', ['lender'], 'santanderconsumer.co.uk'],
  ['Close Brothers Motor Finance', '#00205B', ['lender'], 'closebrothers.com'],
  ['Novuna', '#E4002B', ['lender'], 'novuna.co.uk'],
  ['Moneybarn', '#F26522', ['lender'], 'moneybarn.com'],
  ['BMW Financial Services', '#1C69D4', ['lender'], 'bmwfs.co.uk'],
  ['Volkswagen Financial Services', '#001E50', ['lender'], 'vwfs.co.uk'],
  ['Mercedes-Benz Finance', '#000000', ['lender'], 'mercedes-benz.co.uk'],
  ['Porsche Financial Services', '#B12B28', ['lender'], 'porsche.com'],
  ['Student Loans Company', '#1D70B8', ['lender'], 'gov.uk'],
  ['Klarna', '#FFB3C7', ['lender'], 'klarna.com'],
  ['PayPal Credit', '#003087', ['lender'], 'paypal.com'],
  ['Funding Circle', '#00B67A', ['lender'], 'fundingcircle.com'],
  ['Together Money', '#E5007E', ['lender'], 'togethermoney.com'],
  ['Kensington Mortgages', '#00395D', ['lender'], 'kensingtonmortgages.co.uk'],
  ['Pepper Money', '#E30613', ['lender'], 'pepper.money'],
  ['Accord Mortgages', '#00467F', ['lender'], 'accordmortgages.com'],
  ['Platform (Co-op Bank)', '#00B1E7', ['lender'], 'platform.co.uk'],
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
}).map(([name, color, kinds, domain]) => ({ id: slug(name), name, color, kinds, domain, status: 'coming_soon' as const }));

/** Lower-case letters and digits only, so "Scottish Widow's" finds "Scottish Widows". */
export function normalise(s: string): string {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

export function searchProviders(list: Provider[], q: string): Provider[] {
  const n = normalise(q);
  if (!n) return list;
  return list.filter((p) => normalise(p.name).includes(n) || normalise(p.domain).includes(n));
}

export function providersFor(kinds: ProviderKind[]): Provider[] {
  return PROVIDERS.filter((p) => p.kinds.some((k) => kinds.includes(k))).sort((a, b) => a.name.localeCompare(b.name));
}

/** Ids that were renamed, so accounts saved under the old id keep their provider. */
const LEGACY_IDS: Record<string, string> = { 'fidelity-international': 'fidelity' };

export function providerById(id?: string): Provider | undefined {
  if (!id) return undefined;
  const key = LEGACY_IDS[id] ?? id;
  return PROVIDERS.find((p) => p.id === key);
}

export const KIND_LABELS: Record<ProviderKind, string> = {
  bank: 'Banks & building societies',
  isa: 'ISA providers',
  investment: 'Investment platforms',
  pension_workplace: 'Workplace pensions',
  pension_personal: 'Personal pensions & SIPPs',
  crypto: 'Crypto exchanges & wallets',
  lender: 'Lenders & card issuers',
};
