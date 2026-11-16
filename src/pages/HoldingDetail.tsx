import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { buildSeries, daysBetween, holdingChange, holdingValue, holdingValueOn, lastUpdated, positionChange, positionValue, purchaseGain, rangeStart, rawValueOn, valueOn } from '../domain/calc';
import { convert, formatMoney, formatPct, type CurrencyCode } from '../config/currencies';
import { formatDate, RANGES, todayISO } from '../domain/dates';
import { providerById } from '../data/providers';
import { typeById } from '../data/holdingTypes';
import { CATEGORIES } from '../data/categories';
import { AUTOTRADER_VALUATION_URL, STALE_AFTER_DAYS, goldQuote, priceCheckLink, pricingMode } from '../valuation/valuers';
import { metalSpec, spotPerGram } from '../valuation/metals';
import { hpiEstimate, type HpiEstimate } from '../valuation/houseIndex';
import { AreaTrend } from '../components/Charts';
import { ChangePill, GrowthStats, Money } from '../components/Money';
import { RangeTabs } from '../components/RangeTabs';
import { ProviderMark } from '../components/ProviderMark';
import { Icon } from '../components/Icon';
import { AddPositionModal, UpdateValueModal, Field, AcquisitionFields, DetailInput, detailDefaults } from '../components/Forms';
import type { FieldDef } from '../data/holdingTypes';
import { Modal } from '../components/Modal';
import type { Holding, Position } from '../domain/types';

export function HoldingDetail({ id }: { id: string }) {
  const { holdings, currency, range, addValuation, deleteValuation, deleteHolding, updateHolding, deletePosition, marketVersion, spot } = useStore();
  const h = holdings.find((x) => x.id === id);
  const [updating, setUpdating] = useState<{ position?: Position } | null>(null);
  const [addingPos, setAddingPos] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openPos, setOpenPos] = useState<string | null>(null);
  const start = rangeStart(range, holdings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const series = useMemo(() => (h ? buildSeries(start, { total: (d) => convert(holdingValueOn(h, d), h.currency, currency) }) : []), [h, start, currency, marketVersion]);

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
  const raw = rawValueOn(h, '9999-12-31');
  const isDebt = h.category === 'debts';
  const priced = h.source === 'priced';
  const desc = RANGES.find((r) => r.id === range)!.desc;
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;
  const positions = [...h.positions].sort((a, b) => valueOn(b.valuations, '9999') - valueOn(a.valuations, '9999'));
  const fieldLabel = (k: string, val: string) => {
    const f = t?.fields?.find((x) => x.key === k);
    return { label: f?.label ?? k, value: f?.options?.find((o) => o.value === val)?.label ?? val };
  };
  const detailEntries: [string, string][] = Object.entries(h.details ?? {}).filter(([, val]) => val).map(([k, val]) => {
    const x = fieldLabel(k, val);
    return [x.label, x.value];
  });
  if (isDebt) {
    if (p) detailEntries.unshift(['Lender', p.name]);
    if (h.debt?.interestRate !== undefined) detailEntries.push(['Interest rate', `${h.debt.interestRate}% a year`]);
    if (h.debt?.monthlyPayment !== undefined) detailEntries.push(['Monthly payment', formatMoney(h.debt.monthlyPayment, h.currency)]);
  }
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
            {isDebt && <div className="eyebrow">Outstanding balance · counts against net worth</div>}
            <div className="hero-figure"><Money value={v} ccy={currency} /></div>
            {h.currency !== currency && <div className="muted small">{formatMoney(native, h.currency)} at today's exchange rate</div>}
            <div className="hero-change">
              <ChangePill change={ch} ccy={currency} />
              <span className="muted small">{desc}</span>
            </div>
          </div>
          <RangeTabs />
        </div>
        <AreaTrend series={series} ccy={currency} height={200} />
        <GrowthStats change={ch} periodLabel={rangeLabel} />
        {h.category === 'assets' && <PurchaseInfo h={h} ccy={currency} onEdit={() => setEditing(true)} />}
        {h.category === 'assets' && <ValueSource h={h} />}
        <div className="detail-actions">
          {!h.positions.length && !priced && (
            <button className="btn btn-primary" onClick={() => setUpdating({})}>{isDebt ? 'Update balance' : 'Update value'}</button>
          )}
          {h.type === 'gold' && priced && (
            <button className="btn btn-outline" onClick={() => updateHolding(h.id, { source: 'manual', priced: undefined })}>Switch to a value I type in</button>
          )}
          {h.type === 'gold' && !priced && metalSpec(h) && spot && (
            <button className="btn btn-outline" onClick={() => updateHolding(h.id, { source: 'priced' })}><span className="live-dot" /> Value it from the live spot price</button>
          )}
          {t?.allowsPositions && (
            <button className={`btn ${h.positions.length ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAddingPos(true)}><Icon name="plus" size={16} /> Add fund, share or coin</button>
          )}
        </div>
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
                    <dt>{k}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {history.length > 0 && (
            <>
              <h3 className="panel-subtitle">{isDebt ? 'Balance history' : 'Value history'}</h3>
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
          current={updating.position ? valueOn(updating.position.valuations, '9999') : raw}
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
          acquisition={h.category === 'assets' ? h.acquisition ?? {} : undefined}
          debt={isDebt ? h.debt ?? {} : undefined}
          currency={h.currency}
          onClose={() => setEditing(false)}
          onSave={(name, details, acquisition, debt) => updateHolding(h.id, { name, details, ...(acquisition !== undefined ? { acquisition } : {}), ...(debt !== undefined ? { debt } : {}) })}
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

/** "Since purchase" line for assets. Only shows a gain when a meaningful purchase price exists. */
function PurchaseInfo({ h, ccy, onEdit }: { h: Holding; ccy: CurrencyCode; onEdit: () => void }) {
  const a = h.acquisition;
  const g = purchaseGain(h, ccy);
  const when = a?.date ? formatDate(a.date, 'long') : null;
  let body;
  if (g) {
    body = (
      <>
        <span>Since purchase{when ? ` (${when})` : ''}: </span>
        <b className={g.abs >= 0 ? 'pos' : 'neg'}>{formatMoney(g.abs, ccy, { sign: true, decimals: false })}{g.pct !== null ? ` · ${formatPct(g.pct)}` : ''}</b>
        {g.annualised !== null && <span className="muted"> · {formatPct(g.annualised)} a year</span>}
        <span className="muted"> · paid {formatMoney(convert(a!.price!, h.currency, ccy), ccy, { decimals: false })}</span>
      </>
    );
  } else if (a?.gift) {
    body = <span>Gift or inheritance{when ? `, received ${when}` : ''}. No gain since purchase is shown.</span>;
  } else if (a?.price !== undefined) {
    body = <span>Paid {formatMoney(convert(a.price, h.currency, ccy), ccy)}. Too small to compare against, so no gain since purchase is shown.</span>;
  } else {
    body = <span className="muted">No purchase price added. That's fine: it's optional.</span>;
  }
  return (
    <div className="purchase-info">
      <div>{body}</div>
      <button className="link-btn" onClick={onEdit}>{a ? 'Edit' : 'Add what you paid'}</button>
    </div>
  );
}

type Acq = NonNullable<Holding['acquisition']>;

type Debt = NonNullable<Holding['debt']>;

function EditModal({ name, details, fields, acquisition, debt, currency, onSave, onClose }: { name: string; details: Record<string, string>; fields: FieldDef[]; acquisition?: Acq; debt?: Debt; currency: CurrencyCode; onSave: (n: string, d: Record<string, string>, a?: Acq, debt?: Debt) => void; onClose: () => void }) {
  const [n, setN] = useState(name);
  const [d, setD] = useState({ ...detailDefaults(fields), ...details });
  const [rate, setRate] = useState(debt?.interestRate !== undefined ? String(debt.interestRate) : '');
  const [monthly, setMonthly] = useState(debt?.monthlyPayment !== undefined ? String(debt.monthlyPayment) : '');
  const [price, setPrice] = useState(acquisition?.price !== undefined ? String(acquisition.price) : '');
  const [date, setDate] = useState(acquisition?.date ?? '');
  const [gift, setGift] = useState(!!acquisition?.gift);
  const [err, setErr] = useState('');
  return (
    <Modal title="Edit" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          let acq: Acq | undefined;
          if (acquisition) {
            const p = price.trim() ? Number(price.replace(/[^0-9.\-]/g, '')) : undefined;
            if (p !== undefined && (Number.isNaN(p) || p < 0)) return setErr('Purchase price should be a number, or leave it blank.');
            acq = { price: gift ? undefined : p, date: date || undefined, gift: gift || undefined };
          }
          let dt: Debt | undefined;
          if (debt) {
            const r = rate.trim() ? Number(rate.replace(/[^0-9.]/g, '')) : undefined;
            const m = monthly.trim() ? Number(monthly.replace(/[^0-9.]/g, '')) : undefined;
            if ((r !== undefined && (Number.isNaN(r) || r > 100)) || (m !== undefined && Number.isNaN(m))) return setErr('Rate and monthly payment should be numbers, or leave them blank.');
            dt = { interestRate: r, monthlyPayment: m };
          }
          onSave(n.trim() || name, d, acq, dt);
          onClose();
        }}
      >
        <Field label="Name"><input className="input" value={n} onChange={(e) => setN(e.target.value)} autoFocus /></Field>
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <DetailInput f={f} value={d[f.key] ?? ''} onChange={(v) => setD({ ...d, [f.key]: v })} />
          </Field>
        ))}
        {debt && (
          <div className="grid-2">
            <Field label="Interest rate (%)"><input className="input" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Optional" /></Field>
            <Field label="Monthly payment"><input className="input" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="Optional" /></Field>
          </div>
        )}
        {acquisition && <AcquisitionFields currency={currency} price={price} setPrice={setPrice} date={date} setDate={setDate} gift={gift} setGift={setGift} />}
        {err && <p className="error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Where an asset's value comes from: live spot price (gold), a Land Registry index
 * estimate (property), or a "check the market" link plus a last-updated reminder.
 */
function ValueSource({ h }: { h: Holding }) {
  const { spot, currency } = useStore();
  const mode = pricingMode(h.type);
  const updated = lastUpdated(h);
  const age = updated ? daysBetween(updated, todayISO()) : 0;
  const link = priceCheckLink(h);

  if (h.type === 'gold' && h.source === 'priced') {
    const q = goldQuote(h, spot);
    const spec = metalSpec(h);
    const perG = spec ? spotPerGram(spec.metal, spot, currency) : null;
    return (
      <div className="value-source">
        <span><span className="live-dot" />Valued live from the spot price{perG !== null ? ` (${formatMoney(perG, currency)}/g)` : ''}{spec ? ` × ${+spec.grams.toFixed(2)} g × ${(spec.purity * 100).toFixed(2).replace(/\.?0+$/, '')}% pure` : ''}</span>
        <span className="muted">{q ? `Updated ${new Date(q.asOf).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ` : 'Waiting for a price · '}<a href="https://gold-api.com" target="_blank" rel="noreferrer">gold-api.com</a></span>
      </div>
    );
  }

  const stale = mode !== 'live' && age > STALE_AFTER_DAYS;
  return (
    <>
      <div className="value-source">
        <span>Last updated {updated ? formatDate(updated, 'long') : 'never'}{stale ? <span className="stale"> · it's been {Math.round(age / 30)} months, worth a quick check</span> : ''}</span>
        {link && (
          <span className="price-links">
            <a href={link.url} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> {link.label}</a>
            {h.type === 'car' && <a href={AUTOTRADER_VALUATION_URL} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> Free Auto Trader valuation</a>}
          </span>
        )}
      </div>
      {mode === 'index' && <HpiSuggestion h={h} />}
    </>
  );
}

function HpiSuggestion({ h }: { h: Holding }) {
  const { addValuation, currency } = useStore();
  const [est, setEst] = useState<HpiEstimate | null | 'loading'>('loading');
  const key = `${h.details?.postcode}|${h.valuations.length}|${h.valuations[h.valuations.length - 1]?.date}`;
  useEffect(() => {
    let live = true;
    setEst('loading');
    hpiEstimate(h).then((e) => live && setEst(e)).catch(() => live && setEst(null));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!h.details?.postcode) return <p className="field-hint">Add a postcode (Edit) to get a house price index estimate.</p>;
  if (est === 'loading') return <p className="field-hint">Checking the HM Land Registry house price index…</p>;
  if (!est) return <p className="field-hint">No house price index data for this postcode right now.</p>;
  const month = (m: string) => new Date(m + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const same = est.fromMonth === est.toMonth;
  return (
    <div className="hpi-card">
      <div>
        <b>House price index estimate:</b>{' '}
        {same
          ? <>no newer index data since your last value ({month(est.toMonth)} is the latest published for {est.area}).</>
          : <>{formatMoney(convert(est.value, h.currency, currency), currency, { decimals: false })} — {est.area} prices moved {formatPct(est.changePct)} from {month(est.fromMonth)} to {month(est.toMonth)}.</>}
      </div>
      <span className="muted small">HM Land Registry UK House Price Index, an area average for all property types; it lags about two months. <a href={est.url} target="_blank" rel="noreferrer">Source</a></span>
      {!same && <div><button className="btn btn-outline btn-sm" onClick={() => addValuation(h.id, { date: todayISO(), value: est.value })}>Use this estimate</button></div>}
    </div>
  );
}
