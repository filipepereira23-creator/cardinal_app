import { formatMoney, type CurrencyCode } from '../config/currencies';
import type { Change } from '../domain/calc';
import { Icon } from './Icon';

export function Money({ value, ccy, className = '', decimals = true }: { value: number; ccy: CurrencyCode; className?: string; decimals?: boolean }) {
  return <span className={`money ${className}`}>{formatMoney(value, ccy, { decimals })}</span>;
}

export function ChangePill({ change, ccy, onClick, showAbs = true, size = 'md' }: { change: Change; ccy: CurrencyCode; onClick?: () => void; showAbs?: boolean; size?: 'sm' | 'md' }) {
  const dir = Math.abs(change.abs) < 0.005 ? 'flat' : change.abs > 0 ? 'up' : 'down';
  const pct = change.pct === null ? '' : `${change.pct >= 0 ? '+' : '−'}${Math.abs(change.pct).toFixed(2)}%`;
  const body = (
    <>
      {dir !== 'flat' && <Icon name={dir} size={size === 'sm' ? 12 : 14} />}
      {showAbs && <span>{formatMoney(change.abs, ccy, { sign: true, decimals: Math.abs(change.abs) < 1000 })}</span>}
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
