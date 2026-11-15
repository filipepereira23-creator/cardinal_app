import { CURRENCIES, type CurrencyCode } from '../config/currencies';
import { useStore } from '../state/store';

export function CurrencySelect() {
  const { currency, setCurrency } = useStore();
  return (
    <label className="ccy-select" title="Show everything in">
      <span className="sr-only">Display currency</span>
      <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </option>
        ))}
      </select>
    </label>
  );
}
