import { CATEGORIES } from '../data/categories';
import { categoryColors } from '../config/palette';
import { categoryChange, rangeStart, topMovers, totalChange } from '../domain/calc';
import { RANGES } from '../domain/dates';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { Modal } from '../components/Modal';
import { ChangePill } from '../components/Money';
import { formatMoney } from '../config/currencies';

/** Explains a net worth move: by category, then the individual things that drove it. */
export function WhatMoved({ onClose }: { onClose: () => void }) {
  const { holdings, currency, range, theme } = useStore();
  const CATEGORY_COLORS = categoryColors(theme);
  const start = rangeStart(range, holdings);
  const total = totalChange(holdings, currency, start);
  const cats = CATEGORIES.map((c) => ({ c, ch: categoryChange(holdings, c.id, currency, start) })).filter((x) => holdings.some((h) => h.category === x.c.id));
  const maxAbs = Math.max(1, ...cats.map((x) => Math.abs(x.ch.abs)));
  const movers = topMovers(holdings, currency, start, 8);
  const desc = RANGES.find((r) => r.id === range)!.desc;
  return (
    <Modal title={`What Moved ${desc}`} onClose={onClose}>
      <div className="moved-total">
        <span className="muted">Net worth</span>
        <ChangePill change={total} ccy={currency} />
      </div>
      <h4 className="section-label">By Category</h4>
      <ul className="bars">
        {cats.map(({ c, ch }) => (
          <li key={c.id}>
            <button className="bar-row" onClick={() => { onClose(); go(`dashboard/${c.id}`); }}>
              <span className="bar-label"><i style={{ background: CATEGORY_COLORS[c.id] }} />{c.label}</span>
              <span className="bar-track">
                <span className={`bar ${ch.abs < 0 ? 'neg' : 'pos'}`} style={{ width: `${(Math.abs(ch.abs) / maxAbs) * 50}%` }} />
              </span>
              <span className={`bar-val ${ch.abs < 0 ? 'neg' : ch.abs > 0 ? 'pos' : ''}`}>{formatMoney(ch.abs, currency, { sign: true, decimals: false })}</span>
            </button>
          </li>
        ))}
      </ul>
      <h4 className="section-label">Biggest Movers</h4>
      {movers.length === 0 && <p className="muted">Nothing changed in this period</p>}
      <ul className="rows compact">
        {movers.map((m) => (
          <li key={(m.position?.id ?? '') + m.holding.id}>
            <button className="row" onClick={() => { onClose(); go(`holding/${m.holding.id}`); }}>
              <span className="row-main">
                <span className="row-title">{m.label}</span>
                <span className="row-sub">{m.position ? `in ${m.holding.name}` : CATEGORIES.find((c) => c.id === m.holding.category)?.label}</span>
              </span>
              <ChangePill change={m.change} ccy={currency} size="sm" />
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
