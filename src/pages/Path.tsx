import { useState } from 'react';
import { formatMoney, symbolFor, type CurrencyCode } from '../config/currencies';
import { totalValue } from '../domain/calc';
import { useStore } from '../state/store';
import { MainTabs } from '../components/MainTabs';

/**
 * Net worth milestones. The same round numbers in every currency (Filipe, 18 Nov 2026): $10k in dollars,
 * £10k in pounds, never converted. Progress is measured in the currency you pick, so you may be further
 * along in one currency than another; partner rewards will follow the currency too.
 */
export const MILESTONES = [1_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 100_000_000, 1_000_000_000];

const short = (v: number) => {
  const dp = (x: number) => +x.toPrecision(3);
  return v >= 1e9 ? `${dp(v / 1e9)}b` : v >= 1e6 ? `${dp(v / 1e6)}m` : v >= 1e3 ? `${dp(v / 1e3)}k` : `${Math.round(v)}`;
};
const makeLabel = (ccy: CurrencyCode) => (n: number) => `${symbolFor(ccy).trim()}${short(n)}`;
const STEP = 118;
const W = 360;
const xs = (i: number) => (i % 2 === 0 ? 105 : 255) + (i % 4 === 1 ? 10 : i % 4 === 3 ? -10 : 0);

export function PathPage() {
  const { holdings, currency } = useStore();
  const label = makeLabel(currency);
  const ms = MILESTONES;
  const total = totalValue(holdings, currency);
  const gbp = total;
  const reached = ms.filter((m) => gbp >= m).length;
  const next = ms[reached];
  const prev = reached > 0 ? ms[reached - 1] : 0;
  const pct = next ? Math.max(0, Math.min(100, ((gbp - prev) / (next - prev)) * 100)) : 100;
  const [sel, setSel] = useState<number | null>(null);
  const pts = ms.map((_, i) => ({ x: xs(i), y: 80 + (ms.length - 1 - i) * STEP })); // level 1 at the bottom
  const H = 80 + (ms.length - 1) * STEP + 90;
  const start = { x: W / 2, y: H - 30 };
  const all = [start, ...pts];
  const d = all.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const q = all[i - 1];
    const my = (p.y + q.y) / 2;
    return `C ${q.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }).join(' ');
  // Progress path ends at the last unlocked ball (or the start).
  const dDone = all.slice(0, reached + 1).map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const q = all[i - 1];
    const my = (p.y + q.y) / 2;
    return `C ${q.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }).join(' ');
  const info = sel !== null ? sel : reached < ms.length ? reached : ms.length - 1;

  return (
    <div className="page">
      <MainTabs active="path" />
      <section className="card path-hero">
        <div className="eyebrow">Your Net Worth Path</div>
        <div className="path-level">Level {reached}<span className="muted"> Of {ms.length}</span></div>
        <div className="path-sub">You're at <b>{formatMoney(total, currency, { decimals: false })}</b>{next ? <>, <b>{formatMoney(next - gbp, currency, { decimals: false })}</b> to unlock level {reached + 1} ({label(next)})</> : <>, every level unlocked. Legend</>}</div>
        {next && (
          <div className="path-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${pct}%` }} />
            <span>{prev ? label(prev) : `${symbolFor(currency).trim()}0`}</span><span>{label(next)}</span>
          </div>
        )}
        <p className="muted small">Linked to your total net worth. Each level unlocks rewards from official partners, coming soon</p>
      </section>

      <section className="card path-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="path-svg" role="img" aria-label="Net worth milestones path">
          <path d={d} className="path-track" />
          <path d={dDone} className="path-done" />
          <g transform={`translate(${start.x},${start.y})`}><circle r="20" className="path-start" /><text className="path-start-text" textAnchor="middle" dominantBaseline="middle">Start</text></g>
          {pts.map((p, i) => {
            const state = i < reached ? 'done' : i === reached ? 'next' : 'locked';
            return (
              <g key={i} className={`ball ${state} ${sel === i ? 'sel' : ''}`} transform={`translate(${p.x},${p.y})`} onClick={() => setSel(i)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(i)} role="button" aria-label={`Level ${i + 1}, ${label(ms[i])}, ${state === 'done' ? 'unlocked' : 'locked'}`}>
                {state === 'next' && <circle r="38" className="ball-pulse" />}
                <circle r="31" className="ball-body" />
                <circle r="31" className="ball-shine" />
                <text className="ball-text" y="1" textAnchor="middle" dominantBaseline="middle">{label(ms[i])}</text>
                <text className="ball-lvl" y="-40" textAnchor="middle">Level {i + 1}</text>
                {state === 'done' && <g transform="translate(17,-33)"><circle r="9" className="ball-tick" /><path d="M-4 0 L-1 3 L4 -3" className="ball-tick-mark" /></g>}
                {state === 'locked' && <g transform="translate(0,15)"><rect x="-5" y="-1" width="10" height="8" rx="1.5" className="ball-lock" /><path d="M-3 -1 v-3 a3 3 0 0 1 6 0 v3" className="ball-lock-arc" /></g>}
              </g>
            );
          })}
        </svg>
      </section>

      <section className="card path-info">
        <div className="eyebrow">Level {info + 1} · {label(ms[info])}</div>
        <p><b>{gbp >= ms[info] ? 'Unlocked' : 'Locked'}</b>: reach {formatMoney(ms[info], currency, { decimals: false })} of net worth{gbp < ms[info] ? <>, {formatMoney(ms[info] - gbp, currency, { decimals: false })} to go</> : null}.</p>
        <p className="muted small">Reward from our official partners: coming soon</p>
      </section>
    </div>
  );
}
