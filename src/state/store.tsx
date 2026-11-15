import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CurrencyCode } from '../config/currencies';
import type { Holding, Portfolio, Position, UserProfile, Valuation } from '../domain/types';
import type { RangeId } from '../domain/dates';
import { sortValuations } from '../domain/calc';
import { auth, storage } from '../storage';
import { uid } from '../storage/local';
import { samplePortfolio } from '../data/sample';

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
  addPosition(holdingId: string, p: { name: string; symbol?: string; value: number; date: string }): void;
  updatePosition(holdingId: string, positionId: string, patch: Partial<Position>): void;
  deletePosition(holdingId: string, positionId: string): void;
  loadSample(): void;
  clearAll(): void;
}

const Ctx = createContext<Store | null>(null);

function upsert(vals: Valuation[], v: Valuation): Valuation[] {
  return sortValuations([...vals.filter((x) => x.date !== v.date), v]);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio>({ holdings: [], displayCurrency: 'GBP' });
  const [range, setRange] = useState<RangeId>('1M');
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = await auth.currentUser();
      if (u) {
        setPortfolio(await storage.loadPortfolio(u.id));
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

  const signIn = useCallback(async (u: UserProfile) => {
    const p = await storage.loadPortfolio(u.id);
    loadedFor.current = u.id;
    setPortfolio(p);
    setUser(u);
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
      register: async (i) => signIn(await auth.register(i)),
      login: async (e, pw) => signIn(await auth.login(e, pw)),
      logout: async () => {
        await auth.logout();
        loadedFor.current = null;
        setUser(null);
        setPortfolio({ holdings: [], displayCurrency: 'GBP' });
      },
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
      addPosition: (hid, { name, symbol, value, date }) =>
        mapHolding(hid, (h) => {
          const positions = [...h.positions];
          // First position: keep the account's existing history as an "Other" line so nothing is lost.
          if (!positions.length && h.valuations.length) {
            positions.push({ id: uid(), name: 'Other / uninvested', valuations: h.valuations });
          }
          positions.push({ id: uid(), name, symbol, valuations: [{ date, value }] });
          return { ...h, positions, valuations: [] };
        }),
      updatePosition: (hid, pid, patch) =>
        mapHolding(hid, (h) => ({ ...h, positions: h.positions.map((p) => (p.id === pid ? { ...p, ...patch } : p)) })),
      deletePosition: (hid, pid) => mapHolding(hid, (h) => ({ ...h, positions: h.positions.filter((p) => p.id !== pid) })),
      loadSample: () => mutate((hs) => [...hs, ...samplePortfolio()]),
      clearAll: () => mutate(() => []),
    }),
    [ready, user, portfolio, range, signIn, mutate, mapHolding],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
