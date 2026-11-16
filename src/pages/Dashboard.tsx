import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_COLORS } from '../data/categories';
import { buildSeries, categoryChange, categoryValue, holdingChange, holdingValue, holdingValueOn, rangeStart, totalChange, totalValue } from '../domain/calc';
import { convert } from '../config/currencies';
import { RANGES } from '../domain/dates';
import type { CategoryId, Holding } from '../domain/types';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { AreaTrend, LINE_COLORS, MultiTrend } from '../components/Charts';
import { ChangePill, GrowthStats, Money } from '../components/Money';
import { RangeTabs } from '../components/RangeTabs';
import { AddHoldingModal } from '../components/Forms';
import { ProviderList } from '../components/ProviderGrid';
import { ConnectFlow } from '../components/ConnectFlow';
import { ProviderMark } from '../components/ProviderMark';
import { Icon } from '../components/Icon';
import { WhatMoved } from './WhatMoved';
import { providerById } from '../data/providers';
import { typeById, typesFor } from '../data/holdingTypes';
import type { Provider, ProviderKind } from '../data/providers';

export function Dashboard({ tab }: { tab: CategoryId }) {
  const { holdings, currency, range, user, loadSample } = useStore();
  const [moved, setMoved] = useState(false);
  const start = rangeStart(range, holdings);
  const total = totalValue(holdings, currency);
  const ch = totalChange(holdings, currency, start);
  const series = useMemo(() => buildSeries(start, { total: (d) => totalValue(holdings, currency, d) }), [holdings, currency, start]);
  const rangeDesc = RANGES.find((r) => r.id === range)!.desc;
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;
  const empty = holdings.length === 0;

  return (
    <div className="page">
      <section className="card hero">
        <div className="hero-top">
          <div>
            <div className="eyebrow">Total net worth</div>
            <div className="hero-figure"><Money value={total} ccy={currency} /></div>
            {!empty && (
              <div className="hero-change">
                <ChangePill change={ch} ccy={currency} onClick={() => setMoved(true)} />
                <span className="muted small">{rangeDesc}</span>
              </div>
            )}
          </div>
          {!empty && <RangeTabs />}
        </div>
        {empty ? (
          <div className="empty">
            <h3>Hi {user?.firstName}, let's build your picture.</h3>
            <p className="muted">Add your first account or asset below. Your net worth and its graph appear here as soon as you do.</p>
            <button className="btn btn-outline" onClick={loadSample}><Icon name="sparkle" size={16} /> Explore with sample data</button>
          </div>
        ) : (
          <>
            <AreaTrend series={series} ccy={currency} height={240} />
            <GrowthStats change={ch} periodLabel={rangeLabel} note="Net worth growth includes money you add or withdraw, not only investment returns." />
          </>
        )}
      </section>

      <nav className="cat-tabs" aria-label="Categories">
        {CATEGORIES.map((c) => {
          const v = categoryValue(holdings, c.id, currency);
          const cc = categoryChange(holdings, c.id, currency, start);
          const share = total > 0 ? (v / total) * 100 : 0;
          return (
            <a key={c.id} href={`#/dashboard/${c.id}`} className={`cat-tab ${tab === c.id ? 'on' : ''}`} aria-current={tab === c.id}>
              <span className="cat-tab-label"><i style={{ background: CATEGORY_COLORS[c.id] }} />{c.label}</span>
              <Money value={v} ccy={currency} decimals={false} className="cat-tab-value" />
              <span className="cat-tab-foot">
                {holdings.some((h) => h.category === c.id) ? <ChangePill change={cc} ccy={currency} showAbs={false} size="sm" /> : <span className="muted small">Add</span>}
                {share > 0 && <span className="muted small">{share.toFixed(0)}%</span>}
              </span>
            </a>
          );
        })}
      </nav>

      <CategoryPanel key={tab} category={tab} />

      {moved && <WhatMoved onClose={() => setMoved(false)} />}
    </div>
  );
}

function CategoryPanel({ category }: { category: CategoryId }) {
  const { holdings, currency, range } = useStore();
  const [view, setView] = useState<'overview' | 'connect'>('overview');
  const [adding, setAdding] = useState<{ providerId?: string } | null>(null);
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const cat = CATEGORIES.find((c) => c.id === category)!;
  const items = holdings.filter((h) => h.category === category);
  const start = rangeStart(range, holdings);
  const total = categoryValue(holdings, category, currency);
  const ch = categoryChange(holdings, category, currency, start);
  const kinds = useMemo(() => [...new Set(typesFor(category).flatMap((t) => t.providerKinds))] as ProviderKind[], [category]);
  const canConnect = kinds.length > 0;
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;
  const addedName = holdings.find((h) => h.id === justAdded)?.name;
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(null), 8000);
    return () => clearTimeout(t);
  }, [justAdded]);

  const sorted = [...items].sort((a, b) => holdingValue(b, currency) - holdingValue(a, currency));
  const lines = useMemo(
    () => [
      { key: 'total', name: `Total ${cat.label.toLowerCase()}`, color: '#DB0011' },
      ...sorted.slice(0, 9).map((h, i) => ({ key: h.id, name: h.name, color: LINE_COLORS[i % LINE_COLORS.length] })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((h) => h.id + h.name).join(), currency],
  );
  const series = useMemo(() => {
    const fns: Record<string, (d: string) => number> = { total: (d) => categoryValue(holdings, category, currency, d) };
    for (const h of sorted.slice(0, 9)) fns[h.id] = (d) => convert(holdingValueOn(h, d), h.currency, currency);
    return buildSeries(start, fns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, currency, start, category]);

  return (
    <section className="card panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">{cat.label}</div>
          <div className="panel-figure"><Money value={total} ccy={currency} /></div>
          {items.length > 0 && <ChangePill change={ch} ccy={currency} />}
          {items.length > 0 && <GrowthStats change={ch} periodLabel={rangeLabel} />}
        </div>
        <div className="panel-actions">
          {canConnect && (
            <div className="seg" role="tablist">
              <button role="tab" aria-selected={view === 'overview'} className={view === 'overview' ? 'on' : ''} onClick={() => setView('overview')}>Overview</button>
              <button role="tab" aria-selected={view === 'connect'} className={view === 'connect' ? 'on' : ''} onClick={() => setView('connect')}>Connect</button>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setAdding({})}><Icon name="plus" size={16} /> {items.length ? 'Add another' : 'Add'}</button>
        </div>
      </div>

      {addedName && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          <span><b>{addedName}</b> added.</span>
          <button className="link-btn" onClick={() => setAdding({})}>Add another</button>
          <button className="icon-btn sm" aria-label="Dismiss" onClick={() => setJustAdded(null)}><Icon name="close" size={14} /></button>
        </div>
      )}

      {view === 'connect' && canConnect ? (
        <div className="connect-view">
          <h3 className="center">{connectTitle(category)}</h3>
          <p className="muted center small">Read-only and secure. Cardinal will never move your money. Live connections are coming soon, so add balances manually for now.</p>
          <ProviderList kinds={kinds} onPick={(p) => setConnecting(p)} onManual={() => setAdding({})} />
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <p className="muted">{cat.blurb}. Nothing added yet.</p>
          <div className="type-quick">
            {typesFor(category).map((t) => (
              <button key={t.id} className="chip" onClick={() => setAdding({})}><Icon name={t.icon} size={16} /> {t.label}</button>
            ))}
          </div>
          {canConnect && <button className="link-btn" onClick={() => setView('connect')}>Or pick your {category === 'cash' ? 'bank' : 'provider'} from the list</button>}
        </div>
      ) : (
        <>
          <MultiTrend series={series} lines={lines} ccy={currency} />
          <ul className="rows">
            {sorted.map((h) => (
              <HoldingRow key={h.id} h={h} start={start} />
            ))}
            <li>
              <button className="row row-add" onClick={() => setAdding({})}>
                <span className="add-circle sm"><Icon name="plus" size={18} /></span>
                <span className="row-main">
                  <span className="row-title">Add another {cat.singular}</span>
                  <span className="row-sub">{canConnect ? 'Type in a balance, or pick a provider under Connect' : 'Type in what it’s worth today'}</span>
                </span>
              </button>
            </li>
          </ul>
        </>
      )}

      {connecting && (
        <ConnectFlow
          kinds={kinds}
          initial={connecting}
          title={connectTitle(category)}
          onClose={() => setConnecting(null)}
          onManual={(pid) => { setConnecting(null); setAdding({ providerId: pid }); }}
        />
      )}
      {adding && <AddHoldingModal category={category} providerId={adding.providerId} onClose={() => setAdding(null)} onAdded={(id) => setJustAdded(id)} />}
    </section>
  );
}

function connectTitle(category: CategoryId) {
  return category === 'cash' ? 'Select a bank' : category === 'crypto' ? 'Select an exchange or wallet' : 'Select a provider';
}

function HoldingRow({ h, start }: { h: Holding; start: string }) {
  const { currency } = useStore();
  const p = providerById(h.providerId);
  const t = typeById(h.type);
  const v = holdingValue(h, currency);
  const c = holdingChange(h, currency, start);
  const sub = [t?.label, p?.name, h.positions.length ? `${h.positions.length} holdings` : null, h.currency !== currency ? h.currency : null].filter(Boolean).join(' · ');
  return (
    <li>
      <button className="row" onClick={() => go(`holding/${h.id}`)}>
        <ProviderMark provider={p} typeId={h.type} />
        <span className="row-main">
          <span className="row-title">{h.name}</span>
          <span className="row-sub">{sub}</span>
        </span>
        <span className="row-end">
          <Money value={v} ccy={currency} />
          <ChangePill change={c} ccy={currency} size="sm" showAbs={false} />
        </span>
        <Icon name="chevron" size={16} className="row-chev" />
      </button>
    </li>
  );
}
