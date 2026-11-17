import { useMemo, useState } from 'react';
import { Area, AreaChart, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORIES, CATEGORY_COLORS } from '../data/categories';
import { buildSeries, categoryValue, daysBetween, firstDate, holdingValue } from '../domain/calc';
import { addDays, formatDate, todayISO } from '../domain/dates';
import { ASSET_CATEGORIES, type Holding } from '../domain/types';
import { formatMoney } from '../config/currencies';
import { useStore } from '../state/store';
import { LINE_COLORS } from './Charts';

type Slice = { key: string; name: string; value: number; color: string };

const parts = ASSET_CATEGORIES.map((id) => CATEGORIES.find((c) => c.id === id)!);

function slicesOn(holdings: Holding[], by: 'category' | 'account', ccy: Parameters<typeof formatMoney>[1], date: string): Slice[] {
  if (by === 'category') {
    return parts.map((c) => ({ key: c.id, name: c.label, value: Math.max(0, categoryValue(holdings, c.id, ccy, date)), color: CATEGORY_COLORS[c.id] }));
  }
  const assets = holdings.filter((h) => h.category !== 'debts');
  return assets.map((h, i) => ({ key: h.id, name: h.name, value: Math.max(0, holdingValue(h, ccy, date)), color: LINE_COLORS[i % LINE_COLORS.length] }));
}

/** How your assets are split, with a date slider to go back in time and a chart of the proportions over time. */
export function Allocation() {
  const { holdings, currency, marketVersion, theme } = useStore();
  const [by, setBy] = useState<'category' | 'account'>('category');
  const today = todayISO();
  const first = firstDate(holdings) ?? today;
  const span = Math.max(1, daysBetween(first, today));
  const [back, setBack] = useState(0); // days before today
  const date = addDays(today, -Math.min(back, span));

  const slices = useMemo(() => {
    const all = slicesOn(holdings, by, currency, date).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
    if (by === 'account' && all.length > 7) {
      const rest = all.slice(7).reduce((s, x) => s + x.value, 0);
      return [...all.slice(0, 7), { key: 'other', name: 'Everything else', value: rest, color: '#9A9AA0' }];
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, by, currency, date, marketVersion]);
  const total = slices.reduce((s, x) => s + x.value, 0);

  // Stacked 100% history by category (always categories: readable at a glance).
  const history = useMemo(() => {
    const fns: Record<string, (d: string) => number> = {};
    for (const c of parts) fns[c.id] = (d) => Math.max(0, categoryValue(holdings, c.id, currency, d));
    return buildSeries(first, fns, 90);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, currency, first, marketVersion]);

  if (total <= 0 && back === 0) return null;
  const grid = theme === 'dark' ? '#8f8f96' : '#8A8A8E';
  return (
    <section className="card alloc">
      <div className="panel-head">
        <div>
          <div className="eyebrow">Where your wealth sits</div>
          <div className="alloc-date">{back === 0 ? 'Today' : formatDate(date, 'long')}</div>
        </div>
        <div className="seg" role="tablist">
          <button className={by === 'category' ? 'on' : ''} onClick={() => setBy('category')}>By type</button>
          <button className={by === 'account' ? 'on' : ''} onClick={() => setBy('account')}>By account</button>
        </div>
      </div>
      <div className="alloc-body">
        <div className="alloc-pie">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={slices.length > 1 ? 1.5 : 0} stroke="none" isAnimationActive={false}>
                {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [`${formatMoney(Number(v), currency, { decimals: false })} · ${total ? ((Number(v) / total) * 100).toFixed(1) : 0}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="alloc-centre"><span className="muted small">Assets</span><b>{formatMoney(total, currency, { compact: true, decimals: false })}</b></div>
        </div>
        <ul className="alloc-legend">
          {slices.map((s) => (
            <li key={s.key}>
              <i style={{ background: s.color }} />
              <span className="alloc-name">{s.name}</span>
              <b>{total ? ((s.value / total) * 100).toFixed(1) : '0.0'}%</b>
              <span className="muted small">{formatMoney(s.value, currency, { compact: true, decimals: false })}</span>
            </li>
          ))}
        </ul>
      </div>
      {span > 1 && (
        <div className="alloc-time">
          <div className="alloc-slider">
            <span className="muted small">{formatDate(first, 'month')}</span>
            <input type="range" min={0} max={span} step={1} value={span - Math.min(back, span)} aria-label="Go back in time" onChange={(e) => setBack(span - Number(e.target.value))} />
            <span className="muted small">Today</span>
          </div>
          <div className="alloc-hist">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} stackOffset="expand" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={(d: string) => formatDate(d, 'month')} tick={{ fontSize: 10, fill: grid }} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis hide />
                {parts.map((c) => <Area key={c.id} type="monotone" dataKey={c.id} stackId="1" stroke="none" fill={CATEGORY_COLORS[c.id]} isAnimationActive={false} />)}
                <ReferenceLine x={history.reduce((best, p) => (Math.abs(daysBetween(p.date, date)) < Math.abs(daysBetween(best, date)) ? p.date : best), history[0].date)} stroke="#fff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="muted small">Drag the slider to see your split on any past day. The strip shows how the mix changed over time.</p>
        </div>
      )}
    </section>
  );
}
