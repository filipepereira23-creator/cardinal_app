import { useState } from 'react';
import { convert, formatMoney } from '../config/currencies';
import { totalValue } from '../domain/calc';
import { useStore } from '../state/store';
import { MainTabs } from '../components/MainTabs';

/** Net worth milestones in pounds. Reaching one unlocks the next level. Partner rewards are added later. */
export const MILESTONES = [1_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 100_000_000, 1_000_000_000];

const label = (n: number) => (n >= 1e9 ? `£${n / 1e9}b` : n >= 1e6 ? `£${n / 1e6}m` : `£${n / 1e3}k`);
const STEP = 118;
const W = 360;
const xs = (i: number) => (i % 2 === 0 ? 105 : 255) + (i % 4 === 1 ? 10 : i % 4 === 3 ? -10 : 0);

export function PathPage() {
  const { holdings, currency } = useStore();
  const gbp = convert(totalValue(holdings, currency), currency, 'GBP');
  const reached = MILESTONES.filter((m) => gbp >= m).length;
  const next = MILESTONES[reached];
  const prev = reached > 0 ? MILESTONES[reached - 1] : 0;
  const pct = next ? Math.max(0, Math.min(100, ((gbp - prev) / (next - prev)) * 100)) : 100;
  const [sel, setSel] = useState<number | null>(null);
  const pts = MILESTONES.map((_, i) => ({ x: xs(i), y: 80 + (MILESTONES.length - 1 - i) * STEP })); // level 1 at the bottom
  const H = 80 + (MILESTONES.length - 1) * STEP + 90;
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
  const info = sel !== null ? sel : reached < MILESTONES.length ? reached : MILESTONES.length - 1;

  return (
    <div className="page">
      <MainTabs active="path" />
      <section className="card path-hero">
        <div className="eyebrow">Your net worth path</div>
        <div className="path-level">Level {reached}<span className="muted"> of {MILESTONES.length}</span></div>
        <div className="path-sub">You're at <b>{formatMoney(gbp, 'GBP', { decimals: false })}</b>{next ? <>, <b>{formatMoney(next - gbp, 'GBP', { decimals: false })}</b> to unlock level {reached + 1} ({label(next)}).</> : <>, every level unlocked. Legend.</>}</div>
        {next && (
          <div className="path-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${pct}%` }} />
            <span>{label(prev || 0).replace('£0k', '£0')}</span><span>{label(next)}</span>
          </div>
        )}
        <p className="muted small">Linked to your total net worth. Each level unlocks rewards from official partners, coming soon.</p>
      </section>

      <section className="card path-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="path-svg" role="img" aria-label="Net worth milestones path">
          <path d={d} className="path-track" />
          <path d={dDone} className="path-done" />
          <g transform={`translate(${start.x},${start.y})`}><circle r="20" className="path-start" /><text className="path-start-text" textAnchor="middle" dominantBaseline="middle">START</text></g>
          {pts.map((p, i) => {
            const state = i < reached ? 'done' : i === reached ? 'next' : 'locked';
            return (
              <g key={i} className={`ball ${state} ${sel === i ? 'sel' : ''}`} transform={`translate(${p.x},${p.y})`} onClick={() => setSel(i)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(i)} role="button" aria-label={`Level ${i + 1}, ${label(MILESTONES[i])}, ${state === 'done' ? 'unlocked' : 'locked'}`}>
                {state === 'next' && <circle r="38" className="ball-pulse" />}
                <circle r="31" className="ball-body" />
                <circle r="31" className="ball-shine" />
                <text className="ball-text" y="1" textAnchor="middle" dominantBaseline="middle">{label(MILESTONES[i])}</text>
                <text className="ball-lvl" y="-40" textAnchor="middle">LEVEL {i + 1}</text>
                {state === 'done' && <g transform="translate(17,-33)"><circle r="9" className="ball-tick" /><path d="M-4 0 L-1 3 L4 -3" className="ball-tick-mark" /></g>}
                {state === 'locked' && <g transform="translate(0,15)"><rect x="-5" y="-1" width="10" height="8" rx="1.5" className="ball-lock" /><path d="M-3 -1 v-3 a3 3 0 0 1 6 0 v3" className="ball-lock-arc" /></g>}
              </g>
            );
          })}
        </svg>
      </section>

      <section className="card path-info">
        <div className="eyebrow">Level {info + 1} · {label(MILESTONES[info])}</div>
        <p><b>{gbp >= MILESTONES[info] ? 'Unlocked' : 'Locked'}</b>: reach {formatMoney(MILESTONES[info], 'GBP', { decimals: false })} of net worth{gbp < MILESTONES[info] ? <>, {formatMoney(MILESTONES[info] - gbp, 'GBP', { decimals: false })} to go</> : null}.</p>
        <p className="muted small">Reward from our official partners: coming soon.</p>
      </section>
    </div>
  );
}
