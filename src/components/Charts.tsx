import { useId, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, type CurrencyCode } from '../config/currencies';
import type { SeriesPoint } from '../domain/calc';
import { formatDate, parseISO, todayISO } from '../domain/dates';
import { useStore } from '../state/store';

function useChartTheme() {
  const { theme } = useStore();
  return theme === 'dark' ? { grid: '#2a2a2f', tick: '#8f8f96', dotRing: '#17171a' } : { grid: '#F0F0F0', tick: '#8A8A8E', dotRing: '#fff' };
}

export const LINE_COLORS = ['#1F6FB2', '#2E9E6A', '#C9A227', '#7A3E9D', '#E07B39', '#0097A7', '#6D6D6D', '#B5446E', '#5C7A29', '#3949AB'];

function tickFormatter(series: SeriesPoint[]) {
  const first = series[0]?.date;
  const last = series[series.length - 1]?.date;
  const span = first && last ? (parseISO(last).getTime() - parseISO(first).getTime()) / 86_400_000 : 0;
  return (d: string) => (span > 120 ? formatDate(d, 'month') : formatDate(d));
}

function ChartTooltip({ active, payload, label, ccy, names }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-date">{formatDate(label, 'long')}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="chart-tip-row">
          {payload.length > 1 && <i style={{ background: p.color }} />}
          {payload.length > 1 && <span>{names?.[p.dataKey] ?? p.dataKey}</span>}
          <b>{formatMoney(p.value, ccy)}</b>
        </div>
      ))}
    </div>
  );
}

/** The red area chart used for net worth and single totals. */
export function AreaTrend({ series, dataKey = 'total', ccy, height = 220, mini = false, color = '#DB0011' }: { series: SeriesPoint[]; dataKey?: string; ccy: CurrencyCode; height?: number; mini?: boolean; color?: string }) {
  const id = useId().replace(/:/g, '');
  const t = useChartTheme();
  const values = series.map((p) => Number(p[dataKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.12 || Math.abs(max) * 0.05 || 1;
  return (
    <div className="chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={mini ? { top: 4, right: 0, left: 0, bottom: 0 } : { top: 10, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {!mini && <CartesianGrid vertical={false} stroke={t.grid} />}
          <XAxis dataKey="date" hide={mini} tickFormatter={tickFormatter(series)} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} minTickGap={36} />
          <YAxis hide={mini} domain={[min - pad, max + pad]} tickFormatter={(v) => formatMoney(v, ccy, { compact: true, decimals: false })} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} width={56} />
          {!mini && <Tooltip content={<ChartTooltip ccy={ccy} />} cursor={{ stroke: '#DB0011', strokeOpacity: 0.3 }} />}
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={mini ? 1.5 : 2.2} fill={`url(#g${id})`} isAnimationActive={!mini} animationDuration={500} dot={false} activeDot={{ r: 4, fill: color, stroke: t.dotRing, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Multi-line chart with a "Show on graph" legend to pick which lines to include. */
export function MultiTrend({ series, lines, ccy, height = 260 }: { series: SeriesPoint[]; lines: { key: string; name: string; color: string }[]; ccy: CurrencyCode; height?: number }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const t = useChartTheme();
  const names = useMemo(() => Object.fromEntries(lines.map((l) => [l.key, l.name])), [lines]);
  const toggle = (k: string) =>
    setHidden((h) => {
      const n = new Set(h);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  return (
    <div className="multi-trend">
      <div className="chart" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis dataKey="date" tickFormatter={tickFormatter(series)} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} minTickGap={36} />
            <YAxis tickFormatter={(v) => formatMoney(v, ccy, { compact: true, decimals: false })} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} width={56} />
            <Tooltip content={<ChartTooltip ccy={ccy} names={names} />} />
            {lines.filter((l) => !hidden.has(l.key)).map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={l.key === 'total' ? 2.6 : 1.8} dot={false} isAnimationActive animationDuration={400} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="legend" aria-label="Show on graph">
        <div className="legend-title">Show on graph</div>
        {lines.map((l) => (
          <label key={l.key} className={`legend-item ${hidden.has(l.key) ? 'off' : ''}`}>
            <input type="checkbox" checked={!hidden.has(l.key)} onChange={() => toggle(l.key)} />
            <i style={{ background: l.color }} />
            <span>{l.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Net worth history (solid area) with a dotted forecast line continuing from today. */
export function ForecastTrend({ series, ccy, height = 260 }: { series: SeriesPoint[]; ccy: CurrencyCode; height?: number }) {
  const id = useId().replace(/:/g, '');
  const t = useChartTheme();
  const today = todayISO();
  const vals = series.flatMap((p) => [p.total, p.forecast].filter((v) => typeof v === 'number') as number[]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.08 || 1;
  const tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const future = label > today;
    const p = payload.find((x: any) => x.value !== undefined && x.value !== null);
    if (!p) return null;
    return (
      <div className="chart-tip">
        <div className="chart-tip-date">{formatDate(label, 'long')}</div>
        <div className="chart-tip-row"><b>{formatMoney(p.value, ccy)}</b>{future && <span className="muted"> forecast*</span>}</div>
      </div>
    );
  };
  return (
    <div className="chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DB0011" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#DB0011" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis dataKey="date" tickFormatter={(d: string) => formatDate(d, 'month')} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} minTickGap={36} />
          <YAxis domain={[Math.max(0, min - pad), max + pad]} tickFormatter={(v) => formatMoney(v, ccy, { compact: true, decimals: false })} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} width={56} />
          <Tooltip content={tip} cursor={{ stroke: '#DB0011', strokeOpacity: 0.3 }} />
          <Area type="monotone" dataKey="total" stroke="#DB0011" strokeWidth={2.2} fill={`url(#g${id})`} dot={false} isAnimationActive={false} connectNulls={false} />
          <Line type="monotone" dataKey="forecast" stroke="#DB0011" strokeWidth={2.6} strokeDasharray="1 7" strokeLinecap="round" dot={false} isAnimationActive={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
