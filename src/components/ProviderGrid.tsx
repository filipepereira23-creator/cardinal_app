import { useMemo, useState } from 'react';
import { KIND_LABELS, providersFor, type ProviderKind } from '../data/providers';
import { ProviderMark } from './ProviderMark';
import { Icon } from './Icon';

/** "Link your account" grid. Every provider is marked coming soon in v1. */
export function ProviderGrid({ kinds, onPick, onManual, title }: { kinds: ProviderKind[]; onPick: (id: string) => void; onManual: () => void; title: string }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<ProviderKind | 'all'>('all');
  const all = useMemo(() => providersFor(kind === 'all' ? kinds : [kind]), [kinds, kind]);
  const list = all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="provider-grid-wrap">
      <h3 className="center">{title}</h3>
      <p className="muted center small">Read-only and secure. Cardinal will never move your money. Live connections are coming soon, so add balances manually for now.</p>
      <div className="search-box">
        <Icon name="search" size={16} />
        <input placeholder="Search providers" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {kinds.length > 1 && (
        <div className="chips chips-scroll">
          <button className={`chip ${kind === 'all' ? 'on' : ''}`} onClick={() => setKind('all')}>All</button>
          {kinds.map((k) => (
            <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{KIND_LABELS[k]}</button>
          ))}
        </div>
      )}
      <div className="provider-grid">
        {list.map((p) => (
          <button key={p.id} className="provider-tile" onClick={() => onPick(p.id)}>
            <ProviderMark provider={p} size={44} />
            <span className="provider-name">{p.name}</span>
            <span className="soon">Coming soon</span>
          </button>
        ))}
        <button className="provider-tile provider-add" onClick={onManual}>
          <span className="add-circle"><Icon name="plus" size={22} /></span>
          <span className="provider-name">Add manually</span>
          <span className="soon soon-ok">Available now</span>
        </button>
      </div>
      <p className="muted center small">{all.length} providers</p>
    </div>
  );
}
