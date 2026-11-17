import { formatMoney, formatPct, type CurrencyCode } from '../config/currencies';
import { MIN_ANNUALISE_DAYS, type Change } from '../domain/calc';
import { Icon } from './Icon';

export function Money({ value, ccy, className = '', decimals = true }: { value: number; ccy: CurrencyCode; className?: string; decimals?: boolean }) {
  return <span className={`money ${className}`}>{formatMoney(value, ccy, { decimals })}</span>;
}

const dirOf = (n: number) => (Math.abs(n) < 0.005 ? 'flat' : n > 0 ? 'up' : 'down');

export function ChangePill({ change, ccy, onClick, showAbs = true, size = 'md' }: { change: Change; ccy: CurrencyCode; onClick?: () => void; showAbs?: boolean; size?: 'sm' | 'md' }) {
  const dir = dirOf(change.abs);
  const pct = change.pct === null ? '' : formatPct(change.pct);
  const body = (
    <>
      {dir !== 'flat' && <Icon name={dir} size={size === 'sm' ? 12 : 14} />}
      {(showAbs || !pct) && <span>{formatMoney(change.abs, ccy, { sign: true, decimals: Math.abs(change.abs) < 1000 })}</span>}
      {pct && <span className="pct">{showAbs ? `(${pct})` : pct}</span>}
    </>
  );
  const cls = `change change-${dir} change-${size}${onClick ? ' change-click' : ''}`;
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} title="See what moved">
      {body}
      <Icon name="chevron" size={12} />
    </button>
  ) : (
    <span className={cls}>{body}</span>
  );
}

/**
 * The two growth figures shown wherever a period is selected:
 * % change over the period, and the same move expressed as an annual rate (CAGR).
 */
export function GrowthStats({ change, periodLabel, note }: { change: Change; periodLabel: string; note?: string }) {
  const pctDir = change.pct === null ? 'flat' : dirOf(change.pct);
  const annDir = change.annualised === null ? 'flat' : dirOf(change.annualised);
  const annHint =
    change.annualised !== null
      ? 'Compound annual rate for this period'
      : change.days < MIN_ANNUALISE_DAYS
        ? 'Pick 1M or longer to annualise'
        : 'Not enough history to annualise';
  return (
    <div className="growth" title={note}>
      <div className="growth-item">
        <span className="growth-label">Change · {periodLabel}</span>
        <span className={`growth-val g-${pctDir}`}>{change.pct === null ? '-' : formatPct(change.pct)}</span>
      </div>
      <div className="growth-item">
        <span className="growth-label">Annualised</span>
        <span className={`growth-val g-${annDir}`} title={annHint}>{change.annualised === null ? '-' : formatPct(change.annualised)}</span>
        {change.annualised === null && <span className="growth-hint">{annHint}</span>}
      </div>
    </div>
  );
}
