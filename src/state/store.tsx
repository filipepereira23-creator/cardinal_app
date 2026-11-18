import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setMoneyPrefs, type CurrencyCode } from '../config/currencies';
import { DEFAULT_SETTINGS, type Holding, type Portfolio, type Position, type Settings, type UserProfile, type Valuation } from '../domain/types';
import type { RangeId } from '../domain/dates';
import { sortValuations } from '../domain/calc';
import { auth, storage } from '../storage';
import { uid } from '../storage/local';
import { samplePortfolio } from '../data/sample';
import { email } from '../integrations/email';
import { fxIsFresh, initialFx, loadLiveFx, type FxInfo } from '../config/fx';
import { loadSpot, readCachedSpot, spotIsFresh, type SpotPrices } from '../valuation/metals';
import { goldQuote } from '../valuation/valuers';
import { coinPriceUsd, cryptoIsFresh, loadCrypto, readCachedCrypto, type CryptoPrices } from '../valuation/crypto';
import { convert } from '../config/currencies';
import { todayISO } from '../domain/dates';
import { isCurrency } from '../config/currencies';

const THEME_KEY = 'cardinal.theme.v1';

function systemDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Applies the theme to <html data-theme> so CSS variables switch, and remembers it for the sign-in pages. */
function applyTheme(theme: Settings['theme']): 'light' | 'dark' {
  const resolved = theme === 'system' ? (systemDark() ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', resolved === 'dark' ? '#0f0f11' : '#ffffff');
  return resolved;
}

function storedTheme(): Settings['theme'] {
  const t = localStorage.getItem(THEME_KEY);
  return t === 'light' || t === 'dark' || t === 'system' ? t : 'system';
}

interface Store {
  ready: boolean;
  user: UserProfile | null;
  holdings: Holding[];
  currency: CurrencyCode;
  range: RangeId;
  setRange(r: RangeId): void;
  setCurrency(c: CurrencyCode): void;
  register(i: { firstName: string; lastName: string; email: string; password: string }): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  addHolding(h: Omit<Holding, 'id' | 'createdAt'>): Holding;
  updateHolding(id: string, patch: Partial<Holding>): void;
  deleteHolding(id: string): void;
  addValuation(holdingId: string, v: Valuation, positionId?: string): void;
  deleteValuation(holdingId: string, date: string, positionId?: string): void;
  addPosition(holdingId: string, p: { name: string; symbol?: string; quantity?: number; value: number; date: string }): void;
  updatePosition(holdingId: string, positionId: string, patch: Partial<Position>): void;
  deletePosition(holdingId: string, positionId: string): void;
  loadSample(): void;
  clearAll(): void;
  settings: Settings;
  /** The theme actually showing, after resolving 'system'. */
  theme: 'light' | 'dark';
  updateSettings(patch: Partial<Settings>): void;
  updateProfile(patch: { firstName?: string; lastName?: string; email?: string }): Promise<void>;
  deleteAccount(): Promise<void>;
  exportData(): string;
  /** Whether a confirmation email actually went out for the account just created (false until a backend exists). */
  confirmationEmailSent: boolean | null;
  /** Exchange rates in use (live, cached, or the offline fallback). */
  fx: FxInfo;
  /** Live precious-metal spot prices, or null when unavailable. */
  spot: SpotPrices | null;
  /** Live crypto prices (Coinbase), or null when unavailable. */
  crypto: CryptoPrices | null;
  /** Bumps whenever rates or prices change, so memoised charts recompute. */
  marketVersion: number;
  refreshMarket(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

/** Older saves (or hand-edited data) may hold a currency no longer offered; fall back to GBP. */
function clean(p: Portfolio): Portfolio {
  return {
    displayCurrency: isCurrency(p.displayCurrency) ? p.displayCurrency : 'GBP',
    holdings: (p.holdings ?? []).map((h) => (isCurrency(h.currency) ? h : { ...h, currency: 'GBP' as CurrencyCode })),
  };
}

function upsert(vals: Valuation[], v: Valuation): Valuation[] {
  return sortValuations([...vals.filter((x) => x.date !== v.date), v]);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio>({ holdings: [], displayCurrency: 'GBP' });
  const [range, setRange] = useState<RangeId>('1M');
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, theme: storedTheme() });
  // Apply display prefs during render, so children rendered in this pass already see them (an effect would be one render late).
  setMoneyPrefs({ locale: 'en-GB', hide: settings.hideBalances, decimals: settings.showDecimals });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => applyTheme(storedTheme()));
  const [confirmationEmailSent, setConfirmationEmailSent] = useState<boolean | null>(null);
  const loadedFor = useRef<string | null>(null);
  const [fx, setFx] = useState<FxInfo>(initialFx);
  const [spot, setSpot] = useState<SpotPrices | null>(readCachedSpot);
  const [marketVersion, setMarketVersion] = useState(0);
  const [crypto, setCrypto] = useState<CryptoPrices | null>(readCachedCrypto);

  const refreshMarket = useCallback(async (force = true) => {
    const [f, sp, cr] = await Promise.all([
      force || !fxIsFresh(initialFx()) ? loadLiveFx() : Promise.resolve(null),
      force || !spotIsFresh(readCachedSpot()) ? loadSpot() : Promise.resolve(null),
      force || !cryptoIsFresh(readCachedCrypto()) ? loadCrypto() : Promise.resolve(null),
    ]);
    if (f) setFx(f);
    if (sp) setSpot(sp);
    if (cr) setCrypto(cr);
    if (f || sp || cr) setMarketVersion((v) => v + 1);
  }, []);

  // Live exchange rates and metal prices on load (cached ones are already applied).
  useEffect(() => {
    refreshMarket(false);
  }, [refreshMarket]);

  // Theme, number format and hidden balances follow settings everywhere.
  useEffect(() => {
    setMoneyPrefs({ locale: 'en-GB', hide: settings.hideBalances, decimals: settings.showDecimals });
    setTheme(applyTheme(settings.theme));
    localStorage.setItem(THEME_KEY, settings.theme);
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const on = () => setTheme(applyTheme('system'));
    mq?.addEventListener?.('change', on);
    return () => mq?.removeEventListener?.('change', on);
  }, [settings]);

  useEffect(() => {
    (async () => {
      const u = await auth.currentUser();
      if (u) {
        setPortfolio(clean(await storage.loadPortfolio(u.id)));
        const st = await storage.loadSettings(u.id);
        setSettings(st);
        setRange(st.defaultRange);
        loadedFor.current = u.id;
      }
      setUser(u);
      setReady(true);
    })();
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (user && loadedFor.current === user.id) storage.savePortfolio(user.id, portfolio);
  }, [portfolio, user]);

  useEffect(() => {
    if (user && loadedFor.current === user.id) storage.saveSettings(user.id, settings);
  }, [settings, user]);

  // Precious metals with a weight are valued from the live spot price: today's value is
  // (re)written whenever the price or rates move, which builds a daily history over time.
  useEffect(() => {
    if (!spot) return;
    const today = todayISO();
    const updates = new Map<string, { value: number; priced: Holding['priced'] }>();
    for (const h of portfolio.holdings) {
      if (h.type !== 'gold' || h.source !== 'priced') continue;
      const q = goldQuote(h, spot);
      if (!q) continue;
      const cur = h.valuations.find((v) => v.date === today);
      if (!cur || Math.abs(cur.value - q.value) >= 0.01) updates.set(h.id, { value: q.value, priced: { source: q.source, url: q.url, asOf: q.asOf } });
    }
    if (!updates.size) return;
    setPortfolio((p) => ({
      ...p,
      holdings: p.holdings.map((h) => {
        const u = updates.get(h.id);
        return u ? { ...h, priced: u.priced, valuations: upsert(h.valuations, { date: today, value: u.value }) } : h;
      }),
    }));
  }, [spot, fx, portfolio.holdings]);

  // Coins with a symbol and a quantity are valued live: today's value = quantity × Coinbase price.
  useEffect(() => {
    if (!crypto) return;
    const today = todayISO();
    let changed = false;
    const holdings = portfolio.holdings.map((h) => {
      if (h.category !== 'crypto' || !h.positions.some((p) => p.quantity)) return h;
      let touched = false;
      const positions = h.positions.map((p) => {
        const usd = p.quantity ? coinPriceUsd(p.symbol, crypto) : null;
        if (!usd || !p.quantity) return p;
        const value = Math.round(convert(usd * p.quantity, 'USD', h.currency) * 100) / 100;
        const cur = p.valuations.find((v) => v.date === today);
        if (cur && Math.abs(cur.value - value) < 0.01) return p;
        touched = true;
        return { ...p, valuations: upsert(p.valuations, { date: today, value }) };
      });
      if (!touched) return h;
      changed = true;
      return { ...h, positions };
    });
    if (changed) setPortfolio((p) => ({ ...p, holdings }));
  }, [crypto, fx, portfolio.holdings]);

  const signIn = useCallback(async (u: UserProfile, isNew = false) => {
    const p = clean(await storage.loadPortfolio(u.id));
    // A new account starts with whatever theme was picked on the sign-in pages.
    const st = isNew ? { ...DEFAULT_SETTINGS, theme: storedTheme() } : await storage.loadSettings(u.id);
    loadedFor.current = u.id;
    setPortfolio(p);
    setSettings(st);
    setRange(st.defaultRange);
    setUser(u);
  }, []);

  const signOutLocal = useCallback(() => {
    loadedFor.current = null;
    setUser(null);
    setPortfolio({ holdings: [], displayCurrency: 'GBP' });
    setSettings((s) => ({ ...DEFAULT_SETTINGS, theme: s.theme }));
    setConfirmationEmailSent(null);
  }, []);

  const mutate = useCallback((fn: (h: Holding[]) => Holding[]) => setPortfolio((p) => ({ ...p, holdings: fn(p.holdings) })), []);
  const mapHolding = useCallback(
    (id: string, fn: (h: Holding) => Holding) => mutate((hs) => hs.map((h) => (h.id === id ? fn(h) : h))),
    [mutate],
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      user,
      holdings: portfolio.holdings,
      currency: portfolio.displayCurrency,
      range,
      setRange,
      setCurrency: (c) => setPortfolio((p) => ({ ...p, displayCurrency: c })),
      register: async (i) => {
        const u = await auth.register(i);
        const res = await email.sendAccountConfirmation(u).catch(() => ({ sent: false }));
        setConfirmationEmailSent(res.sent);
        await signIn(u, true);
      },
      login: async (e, pw) => {
        setConfirmationEmailSent(null);
        await signIn(await auth.login(e, pw));
      },
      logout: async () => {
        await auth.logout();
        signOutLocal();
      },
      settings,
      theme,
      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),
      updateProfile: async (patch) => {
        if (!user) return;
        setUser(await auth.updateProfile(user.id, patch));
      },
      deleteAccount: async () => {
        if (!user) return;
        await storage.deleteAll(user.id);
        await auth.deleteAccount(user.id);
        signOutLocal();
      },
      exportData: () =>
        JSON.stringify(
          { app: 'Cardinal', version: 1, exportedAt: new Date().toISOString(), profile: user, settings, portfolio },
          null,
          2,
        ),
      confirmationEmailSent,
      fx,
      spot,
      crypto,
      marketVersion,
      refreshMarket: () => refreshMarket(true),
      addHolding: (h) => {
        const full: Holding = { ...h, id: uid(), createdAt: new Date().toISOString(), valuations: sortValuations(h.valuations) };
        mutate((hs) => [...hs, full]);
        return full;
      },
      updateHolding: (id, patch) => mapHolding(id, (h) => ({ ...h, ...patch })),
      deleteHolding: (id) => mutate((hs) => hs.filter((h) => h.id !== id)),
      addValuation: (hid, v, pid) =>
        mapHolding(hid, (h) =>
          pid
            ? { ...h, positions: h.positions.map((p) => (p.id === pid ? { ...p, valuations: upsert(p.valuations, v) } : p)) }
            : { ...h, valuations: upsert(h.valuations, v) },
        ),
      deleteValuation: (hid, date, pid) =>
        mapHolding(hid, (h) =>
          pid
            ? { ...h, positions: h.positions.map((p) => (p.id === pid ? { ...p, valuations: p.valuations.filter((x) => x.date !== date) } : p)) }
            : { ...h, valuations: h.valuations.filter((x) => x.date !== date) },
        ),
      addPosition: (hid, { name, symbol, quantity, value, date }) =>
        mapHolding(hid, (h) => {
          const positions = [...h.positions];
          // First position: keep the account's existing history as an "Other" line so nothing is lost.
          if (!positions.length && h.valuations.length) {
            positions.push({ id: uid(), name: 'Other / uninvested', valuations: h.valuations });
          }
          positions.push({ id: uid(), name, symbol, quantity, valuations: [{ date, value }] });
          return { ...h, positions, valuations: [] };
        }),
      updatePosition: (hid, pid, patch) =>
        mapHolding(hid, (h) => ({ ...h, positions: h.positions.map((p) => (p.id === pid ? { ...p, ...patch } : p)) })),
      deletePosition: (hid, pid) => mapHolding(hid, (h) => ({ ...h, positions: h.positions.filter((p) => p.id !== pid) })),
      loadSample: () => mutate((hs) => [...hs, ...samplePortfolio()]),
      clearAll: () => mutate(() => []),
    }),
    [ready, user, portfolio, range, settings, theme, confirmationEmailSent, signIn, signOutLocal, mutate, mapHolding, fx, spot, crypto, marketVersion, refreshMarket],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
