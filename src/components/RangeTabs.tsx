import { RANGES } from '../domain/dates';
import { useStore } from '../state/store';

export function RangeTabs() {
  const { range, setRange } = useStore();
  return (
    <div className="range-tabs" role="tablist" aria-label="Time range">
      {RANGES.map((r) => (
        <button key={r.id} role="tab" aria-selected={range === r.id} className={range === r.id ? 'on' : ''} onClick={() => setRange(r.id)}>
          {r.label}
        </button>
      ))}
    </div>
  );
}
