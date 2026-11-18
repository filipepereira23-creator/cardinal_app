import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, type CurrencyCode } from '../config/currencies';
import type { SeriesPoint } from '../domain/calc';
import { formatDate, parseISO, todayISO } from '../domain/dates';
import { useStore } from '../state/store';

function useChartTheme() {
  const { theme } = useStore();
  return theme === 'dark' ? { grid: '#2a2a2f', tick: '#8f8f96', dotRing: '#17171a' } : { grid: '#F0F0F0', tick: '#8A8A8E', dotRing: '#fff' };
}

export const LINE_COLORS = ['#DB0011', '#1D1D1F', '#F0807F', '#8E0A12', '#8A8A8E', '#E9B3B6', '#4A4A4F', '#B8434B', '#C9C9CE', '#5A0007'];

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

/** Calendar-aligned tick steps, in months, from finest to coarsest. */
const TICK_STEPS = [1, 2, 3, 6, 12, 24, 60, 120];

/**
 * One tick interval for the whole axis (history and forecast alike), aligned to the calendar:
 * the finest step whose ticks fit the available width. When ticks would crowd, the step grows
 * for the entire axis, so spacing never differs between the past and the projection.
 */
export function uniformTicks(startMs: number, endMs: number, maxTicks: number): { ticks: number[]; months: number } {
  const s = new Date(startMs);
  for (const months of TICK_STEPS) {
    const ticks: number[] = [];
    // First boundary on or after the start, aligned so that (year*12 + month) % step === 0.
    let idx = Math.ceil((s.getFullYear() * 12 + s.getMonth() + (s.getDate() > 1 ? 1 : 0)) / months) * months;
    for (;;) {
      const t = new Date(Math.floor(idx / 12), idx % 12, 1).getTime();
      if (t > endMs) break;
      ticks.push(t);
      idx += months;
    }
    if (ticks.length <= Math.max(2, maxTicks) || months === TICK_STEPS[TICK_STEPS.length - 1]) return { ticks, months };
  }
  return { ticks: [], months: 12 };
}

/** Evenly spaced round-number ticks (steps of 1, 2, 2.5 or 5 × 10ⁿ) covering [lo, hi]. */
function niceTicks(lo: number, hi: number, count: number): number[] {
  const raw = (hi - lo) / Math.max(1, count - 1) || 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.floor(lo / step) * step; v < hi + step * 0.999; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(360);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Net worth history (solid area) with a dotted forecast line continuing from today.
 * The horizontal axis is real time, so a year of history takes the same width as a year of forecast.
 */
export function ForecastTrend({ series, ccy, height = 260 }: { series: SeriesPoint[]; ccy: CurrencyCode; height?: number }) {
  const id = useId().replace(/:/g, '');
  const t = useChartTheme();
  const [ref, width] = useWidth<HTMLDivElement>();
  const today = todayISO();
  const data = useMemo(() => series.map((p) => ({ ...p, t: parseISO(p.date).getTime() })), [series]);
  const vals = series.flatMap((p) => [p.total, p.forecast].filter((v) => typeof v === 'number') as number[]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.08 || 1;
  const yTicks = niceTicks(Math.max(0, min - pad), max + pad, 5);
  const startMs = data[0]?.t ?? 0;
  const endMs = data[data.length - 1]?.t ?? 0;
  const plotW = Math.max(120, width - 56 - 12);
  const probe = uniformTicks(startMs, endMs, Math.floor(plotW / 46));
  // Year labels ("2031") are narrower than month labels ("Mar 27").
  const { ticks, months } = probe.months >= 12 ? uniformTicks(startMs, endMs, Math.floor(plotW / 34)) : probe;
  const fmtTick = (ms: number) => {
    const d = new Date(ms);
    return months >= 12 ? String(d.getFullYear()) : d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };
  const tip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    const future = row.date > today;
    const p = payload.find((x: any) => x.value !== undefined && x.value !== null);
    if (!p) return null;
    return (
      <div className="chart-tip">
        <div className="chart-tip-date">{formatDate(row.date, 'long')}</div>
        <div className="chart-tip-row"><b>{formatMoney(p.value, ccy)}</b>{future && <span className="muted"> forecast*</span>}</div>
      </div>
    );
  };
  return (
    <div className="chart" style={{ height }} ref={ref} data-tick-months={months}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DB0011" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#DB0011" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis dataKey="t" type="number" scale="time" domain={[startMs, endMs]} ticks={ticks} interval={0} tickFormatter={fmtTick} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} />
          <YAxis domain={[yTicks[0], yTicks[yTicks.length - 1]]} ticks={yTicks} interval={0} tickFormatter={(v) => formatMoney(v, ccy, { compact: true, decimals: false })} tick={{ fontSize: 11, fill: t.tick }} axisLine={false} tickLine={false} width={56} />
          <Tooltip content={tip} cursor={{ stroke: '#DB0011', strokeOpacity: 0.3 }} />
          <Area type="monotone" dataKey="total" stroke="#DB0011" strokeWidth={2.2} fill={`url(#g${id})`} dot={false} isAnimationActive={false} connectNulls={false} />
          <Line type="monotone" dataKey="forecast" stroke="#DB0011" strokeWidth={2.6} strokeDasharray="1 7" strokeLinecap="round" dot={false} isAnimationActive={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
