import { useMemo, useState } from 'react';
import { KIND_LABELS, providersFor, searchProviders, type Provider, type ProviderKind } from '../data/providers';
import { ProviderMark } from './ProviderMark';
import { Icon } from './Icon';

/** Searchable provider list in the style of a bank's "Select a bank" screen: logo, name, arrow. */
export function ProviderList({ kinds, onPick, onManual, compact = false }: { kinds: ProviderKind[]; onPick: (p: Provider) => void; onManual: () => void; compact?: boolean }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<ProviderKind | 'all'>('all');
  const all = useMemo(() => providersFor(kind === 'all' ? kinds : [kind]), [kinds, kind]);
  const list = searchProviders(all, q);
  return (
    <div className={`plist-wrap ${compact ? 'compact' : ''}`}>
      <div className="search-box">
        <Icon name="search" size={16} />
        <input placeholder="Search providers" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search providers" />
      </div>
      {kinds.length > 1 && (
        <div className="chips chips-scroll">
          <button className={`chip ${kind === 'all' ? 'on' : ''}`} onClick={() => setKind('all')}>All</button>
          {kinds.map((k) => (
            <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{KIND_LABELS[k]}</button>
          ))}
        </div>
      )}
      <ul className="plist" aria-label="Providers">
        {list.map((p) => (
          <li key={p.id}>
            <button className="plist-row" onClick={() => onPick(p)}>
              <ProviderMark provider={p} size={44} />
              <span className="plist-name">{p.name}</span>
              <span className="soon">Coming soon</span>
              <Icon name="arrow" size={20} className="plist-arrow" />
            </button>
          </li>
        ))}
        {!list.length && <li className="muted pad">No provider matches “{q}”. You can still add it manually.</li>}
        <li>
          <button className="plist-row plist-manual" onClick={onManual}>
            <span className="add-circle"><Icon name="plus" size={20} /></span>
            <span className="plist-name">Add manually<span className="muted small"> · type in a balance</span></span>
            <span className="soon soon-ok">Available now</span>
            <Icon name="arrow" size={20} className="plist-arrow" />
          </button>
        </li>
      </ul>
      <p className="muted center small">{all.length} providers</p>
    </div>
  );
}
