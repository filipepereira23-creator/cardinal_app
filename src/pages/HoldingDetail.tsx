import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { buildSeries, holdingChange, holdingValue, holdingValueOn, positionChange, positionValue, rangeStart, valueOn } from '../domain/calc';
import { convert, formatMoney } from '../config/currencies';
import { formatDate, RANGES } from '../domain/dates';
import { providerById } from '../data/providers';
import { typeById } from '../data/holdingTypes';
import { CATEGORIES } from '../data/categories';
import { PLANNED_SOURCES } from '../valuation/valuers';
import { AreaTrend } from '../components/Charts';
import { ChangePill, Money } from '../components/Money';
import { RangeTabs } from '../components/RangeTabs';
import { ProviderMark } from '../components/ProviderMark';
import { Icon } from '../components/Icon';
import { AddPositionModal, UpdateValueModal, Field } from '../components/Forms';
import { Modal } from '../components/Modal';
import type { Position } from '../domain/types';

export function HoldingDetail({ id }: { id: string }) {
  const { holdings, currency, range, addValuation, deleteValuation, deleteHolding, updateHolding, deletePosition } = useStore();
  const h = holdings.find((x) => x.id === id);
  const [updating, setUpdating] = useState<{ position?: Position } | null>(null);
  const [addingPos, setAddingPos] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openPos, setOpenPos] = useState<string | null>(null);
  const start = rangeStart(range, holdings);
  const series = useMemo(() => (h ? buildSeries(start, { total: (d) => convert(holdingValueOn(h, d), h.currency, currency) }) : []), [h, start, currency]);

  if (!h) {
    return (
      <div className="page">
        <div className="card empty">
          <p>This item no longer exists.</p>
          <a className="btn btn-outline" href="#/dashboard">Back to dashboard</a>
        </div>
      </div>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === h.category)!;
  const p = providerById(h.providerId);
  const t = typeById(h.type);
  const v = holdingValue(h, currency);
  const ch = holdingChange(h, currency, start);
  const native = holdingValueOn(h, '9999-12-31');
  const desc = RANGES.find((r) => r.id === range)!.desc;
  const positions = [...h.positions].sort((a, b) => valueOn(b.valuations, '9999') - valueOn(a.valuations, '9999'));
  const detailEntries = Object.entries(h.details ?? {}).filter(([, val]) => val);
  const history = [...h.valuations].reverse();

  return (
    <div className="page">
      <button className="back" onClick={() => go(`dashboard/${h.category}`)}><Icon name="back" size={18} /> {cat.label}</button>

      <section className="card hero">
        <div className="detail-head">
          <ProviderMark provider={p} typeId={h.type} size={48} />
          <div className="detail-title">
            <h1>{h.name}</h1>
            <span className="muted small">{[t?.label, p?.name].filter(Boolean).join(' · ')}</span>
          </div>
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit"><Icon name="edit" size={18} /></button>
        </div>
        <div className="hero-top">
          <div>
            <div className="hero-figure"><Money value={v} ccy={currency} /></div>
            {h.currency !== currency && <div className="muted small">{formatMoney(native, h.currency)} at the fixed rate</div>}
            <div className="hero-change">
              <ChangePill change={ch} ccy={currency} />
              <span className="muted small">{desc}</span>
            </div>
          </div>
          <RangeTabs />
        </div>
        <AreaTrend series={series} ccy={currency} height={200} />
        <div className="detail-actions">
          {!h.positions.length && (
            <button className="btn btn-primary" onClick={() => setUpdating({})}>Update value</button>
          )}
          {t?.allowsPositions && (
            <button className={`btn ${h.positions.length ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAddingPos(true)}><Icon name="plus" size={16} /> Add fund, share or coin</button>
          )}
        </div>
        {PLANNED_SOURCES[h.type] && <p className="field-hint">Live value from {PLANNED_SOURCES[h.type]} is coming soon. For now, update it by hand.</p>}
      </section>

      {positions.length > 0 && (
        <section className="card panel">
          <h3 className="panel-subtitle">Inside this account</h3>
          <ul className="rows">
            {positions.map((pos) => {
              const pv = positionValue(pos, h, currency);
              const pc = positionChange(pos, h, currency, start);
              const share = v ? (pv / v) * 100 : 0;
              const open = openPos === pos.id;
              return (
                <li key={pos.id} className={open ? 'open' : ''}>
                  <button className="row" onClick={() => setOpenPos(open ? null : pos.id)}>
                    <span className="pmark pmark-icon"><b className="small">{(pos.symbol || pos.name).slice(0, 4).toUpperCase()}</b></span>
                    <span className="row-main">
                      <span className="row-title">{pos.name}</span>
                      <span className="row-sub">{share.toFixed(1)}% of account</span>
                    </span>
                    <span className="row-end">
                      <Money value={pv} ccy={currency} />
                      <ChangePill change={pc} ccy={currency} size="sm" />
                    </span>
                    <Icon name={open ? 'up' : 'down'} size={16} className="row-chev" />
                  </button>
                  {open && (
                    <div className="row-drawer">
                      <div className="drawer-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => setUpdating({ position: pos })}>Update value</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => confirm(`Remove ${pos.name}?`) && deletePosition(h.id, pos.id)}><Icon name="trash" size={14} /> Remove</button>
                      </div>
                      <History currency={h.currency} items={[...pos.valuations].reverse()} onDelete={(d) => deleteValuation(h.id, d, pos.id)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(detailEntries.length > 0 || history.length > 0) && (
        <section className="card panel">
          {detailEntries.length > 0 && (
            <>
              <h3 className="panel-subtitle">Details</h3>
              <dl className="details">
                {detailEntries.map(([k, val]) => (
                  <div key={k}>
                    <dt>{t?.fields?.find((f) => f.key === k)?.label ?? k}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {history.length > 0 && (
            <>
              <h3 className="panel-subtitle">Value history</h3>
              <History currency={h.currency} items={history} onDelete={(d) => deleteValuation(h.id, d)} />
            </>
          )}
        </section>
      )}

      <div className="danger-zone">
        <button className="btn btn-ghost" onClick={() => { if (confirm(`Remove ${h.name} from Cardinal?`)) { deleteHolding(h.id); go(`dashboard/${h.category}`); } }}>
          <Icon name="trash" size={16} /> Remove {cat.singular}
        </button>
      </div>

      {updating && (
        <UpdateValueModal
          title={`Update ${updating.position?.name ?? h.name}`}
          currency={h.currency}
          current={updating.position ? valueOn(updating.position.valuations, '9999') : native}
          onSave={(date, value) => addValuation(h.id, { date, value }, updating.position?.id)}
          onClose={() => setUpdating(null)}
        />
      )}
      {addingPos && <AddPositionModal holdingId={h.id} currency={h.currency} onClose={() => setAddingPos(false)} />}
      {editing && (
        <EditModal
          name={h.name}
          details={h.details ?? {}}
          fields={t?.fields ?? []}
          onClose={() => setEditing(false)}
          onSave={(name, details) => updateHolding(h.id, { name, details })}
        />
      )}
    </div>
  );
}

function History({ items, currency, onDelete }: { items: { date: string; value: number }[]; currency: any; onDelete: (date: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 6);
  return (
    <ul className="history">
      {shown.map((x) => (
        <li key={x.date}>
          <span>{formatDate(x.date, 'long')}</span>
          <b>{formatMoney(x.value, currency)}</b>
          <button className="icon-btn sm" aria-label="Delete entry" onClick={() => items.length > 1 ? onDelete(x.date) : alert('Keep at least one value. Remove the item instead.')}>
            <Icon name="close" size={14} />
          </button>
        </li>
      ))}
      {items.length > 6 && (
        <li><button className="link-btn" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${items.length} entries`}</button></li>
      )}
    </ul>
  );
}

function EditModal({ name, details, fields, onSave, onClose }: { name: string; details: Record<string, string>; fields: { key: string; label: string; placeholder?: string }[]; onSave: (n: string, d: Record<string, string>) => void; onClose: () => void }) {
  const [n, setN] = useState(name);
  const [d, setD] = useState(details);
  return (
    <Modal title="Edit" onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(n.trim() || name, d); onClose(); }}>
        <Field label="Name"><input className="input" value={n} onChange={(e) => setN(e.target.value)} autoFocus /></Field>
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <input className="input" placeholder={f.placeholder} value={d[f.key] ?? ''} onChange={(e) => setD({ ...d, [f.key]: e.target.value })} />
          </Field>
        ))}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}
