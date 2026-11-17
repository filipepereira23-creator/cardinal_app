import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { buildSeries, daysBetween, holdingChange, holdingValue, holdingValueOn, lastUpdated, positionChange, positionValue, purchaseGain, rangeStart, rawValueOn, valueOn } from '../domain/calc';
import { convert, formatMoney, formatPct, type CurrencyCode } from '../config/currencies';
import { formatDate, RANGES, todayISO } from '../domain/dates';
import { providerById } from '../data/providers';
import { typeById } from '../data/holdingTypes';
import { CATEGORIES } from '../data/categories';
import { AUTOTRADER_VALUATION_URL, MOVALUE_URL, STALE_AFTER_DAYS, goldQuote, priceCheckLink, pricingMode } from '../valuation/valuers';
import { metalSpec, spotPerGram } from '../valuation/metals';
import { areaLookup } from '../valuation/areaPrice';
import { LONDON_PSM_SOURCE_URL } from '../data/londonPsm';
import { hpiEstimate, type HpiEstimate } from '../valuation/houseIndex';
import { PPD_ATTRIBUTION, PPD_URL, recentSales, type SalesResult } from '../valuation/streetSales';
import { CAR_CURVE_SOURCE_URL, carEstimate } from '../valuation/carEstimate';
import { WATCH_INDEX_AS_OF, WATCH_INDEX_URL, brandTrend, watchChartsLink, watchEstimate } from '../valuation/watchEstimate';
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
                      <span className="row-sub">{pos.quantity && pos.symbol ? <><span className="live-dot-inline" title="Live price" />{+pos.quantity.toFixed(8)} {pos.symbol}</> : `${share.toFixed(1)}% of account`}</span>
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
            {h.type === 'watch' && <a href={watchChartsLink(h)} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> Free WatchCharts price</a>}
            {h.type === 'car' && <a href={MOVALUE_URL} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> Free moValue valuation</a>}
            {h.type === 'car' && <a href={AUTOTRADER_VALUATION_URL} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> Free Auto Trader valuation</a>}
          </span>
        )}
      </div>
      {mode === 'index' && <AreaSuggestion h={h} />}
      {mode === 'index' && <HpiSuggestion h={h} />}
      {mode === 'index' && <StreetSales h={h} />}
      {h.type === 'watch' && <WatchSuggestion h={h} />}
      {h.type === 'car' && <CarSuggestion h={h} />}
    </>
  );
}

function AreaSuggestion({ h }: { h: Holding }) {
  const { addValuation, currency } = useStore();
  const r = areaLookup(h.details);
  if (r.kind === 'no-postcode') return null; // HpiSuggestion already asks for the postcode
  if (r.kind === 'not-london') return <p className="field-hint">Price per square metre covers London for now; {r.district} isn't in it.</p>;
  if (r.kind === 'no-figure') return <p className="field-hint">Too few recent sales in {r.district} for a reliable price per square metre.</p>;
  if (r.kind === 'no-area') return <p className="field-hint">Add the floor area in m² (Edit) to get a value from the local price per square metre.</p>;
  const e = r.est;
  const v = convert(e.value, 'GBP', h.currency);
  return (
    <div className="hpi-card">
      <div>
        <b>Area estimate: {formatMoney(convert(e.value, 'GBP', currency), currency, { decimals: false })}</b>: {e.area} ({e.district}) median {formatMoney(convert(e.psm, 'GBP', currency), currency, { decimals: false })} per m² × {e.sqm} m².
      </div>
      <span className="muted small">HM Land Registry sold prices matched to EPC floor areas, 12 months to {e.asOf} ({e.sales} sales). A district average, so your own value may differ. <a href={LONDON_PSM_SOURCE_URL} target="_blank" rel="noreferrer">Source</a></span>
      <div><button className="btn btn-outline btn-sm" onClick={() => addValuation(h.id, { date: todayISO(), value: Math.round(v) })}>Use this estimate</button></div>
    </div>
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
          : <>{formatMoney(convert(est.value, h.currency, currency), currency, { decimals: false })}: {est.area} prices moved {formatPct(est.changePct)} from {month(est.fromMonth)} to {month(est.toMonth)}.</>}
      </div>
      <span className="muted small">HM Land Registry UK House Price Index, an area average for all property types; it lags about two months. <a href={est.url} target="_blank" rel="noreferrer">Source</a></span>
      {!same && <div><button className="btn btn-outline btn-sm" onClick={() => addValuation(h.id, { date: todayISO(), value: est.value })}>Use this estimate</button></div>}
    </div>
  );
}

const fmtYears = (y: number) => (y < 1 ? `${Math.max(1, Math.round(y * 12))} months` : `${(Math.round(y * 10) / 10).toString()} years`);

/** Watch: last value × brand's 1-year market trend (WatchCharts public index). */
function WatchSuggestion({ h }: { h: Holding }) {
  const { addValuation, currency } = useStore();
  const e = watchEstimate(h);
  if (!h.details?.brand) return <p className="field-hint">Add the brand (Edit) to get a free estimate from that brand's market trend.</p>;
  if (!brandTrend(h.details.brand)) return <p className="field-hint">No free market index for {h.details.brand} yet, so no automatic estimate. Use the price links above and update the value by hand.</p>;
  if (!e) return null;
  const same = e.appliedYears < 1 / 52;
  return (
    <div className="hpi-card">
      <div>
        <span className="tag-est">Estimate</span>{' '}
        {same
          ? <>{e.brand} prices moved <b>{formatPct(e.trendPct)}</b> over the last year. Your value is from this week, so there's nothing to adjust yet.</>
          : <><b>{formatMoney(convert(e.value, h.currency, currency), currency, { decimals: false })}</b>: your value from {formatDate(e.base.date, 'long')} moved by the {e.brand} market trend ({formatPct(e.trendPct)} a year{e.appliedYears < 1 ? `, ${fmtYears(e.appliedYears)} of it` : ''}).</>}
      </div>
      <span className="muted small">
        WatchCharts {e.brand} index, 1-year change, as of {WATCH_INDEX_AS_OF}. A brand average of its 30 most traded models, not your exact watch{e.olderThanYear ? '; your last value is over a year old and only the last 12 months of trend are known, so check the price link too' : ''}. <a href={WATCH_INDEX_URL} target="_blank" rel="noreferrer">Source</a>
      </span>
      {!same && <div><button className="btn btn-outline btn-sm" onClick={() => addValuation(h.id, { date: todayISO(), value: e.value })}>Use this estimate</button></div>}
    </div>
  );
}

/** Car: UK depreciation curve by age, with a mileage adjustment. */
function CarSuggestion({ h }: { h: Holding }) {
  const { addValuation, currency } = useStore();
  const e = carEstimate(h);
  if (!h.details?.year) return <p className="field-hint">Add the year (Edit) to get a free estimate from typical UK depreciation.</p>;
  if (!e) return null;
  const same = Math.abs(e.value - e.base.value) < 1;
  return (
    <div className="hpi-card">
      <div>
        <span className="tag-est">Estimate</span>{' '}
        {same
          ? <>{e.classic ? 'Over 25 years old, so treated as a classic and held at your value.' : 'Your value is recent, so typical depreciation hasn\'t moved it yet.'}</>
          : <><b>{formatMoney(convert(e.value, h.currency, currency), currency, { decimals: false })}</b>: typical depreciation for a car aged {fmtYears(e.ageThen)} → {fmtYears(e.ageNow)} ({formatPct(e.changePct)}) from your {e.base.kind} of {formatMoney(convert(e.base.value, h.currency, currency), currency, { decimals: false })}{e.mileageAdjPct ? `, ${e.mileageAdjPct > 0 ? 'plus' : 'minus'} ${Math.abs(e.mileageAdjPct)}% for mileage` : ''}.</>}
      </div>
      <span className="muted small">Average UK curve (about 25% in year one, around 60% gone by year five, flattening after eight; AA, RAC). Real prices vary a lot by model and condition, so check the free valuation links too. <a href={CAR_CURVE_SOURCE_URL} target="_blank" rel="noreferrer">Source</a></span>
      {!same && <div><button className="btn btn-outline btn-sm" onClick={() => addValuation(h.id, { date: todayISO(), value: e.value })}>Use this estimate</button></div>}
    </div>
  );
}

/** Property: recent sold prices on the same street (HM Land Registry Price Paid Data, live). */
function StreetSales({ h }: { h: Holding }) {
  const { currency } = useStore();
  const [r, setR] = useState<SalesResult | null | 'loading' | 'error'>('loading');
  const [all, setAll] = useState(false);
  const key = `${h.details?.postcode}|${h.details?.address}`;
  useEffect(() => {
    let live = true;
    if (!h.details?.postcode) return;
    setR('loading');
    recentSales(h.details).then((x) => live && setR(x)).catch(() => live && setR('error'));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!h.details?.postcode) return null;
  if (r === 'loading') return <p className="field-hint">Checking recent sold prices nearby…</p>;
  if (r === 'error') return <p className="field-hint">Couldn't reach HM Land Registry sold prices just now.</p>;
  if (!r || !r.sales.length) return <p className="field-hint">No recorded sales at this postcode in the last five years (sold prices cover England and Wales).</p>;
  const shown = all ? r.sales.slice(0, 20) : r.sales.slice(0, 4);
  const money = (n: number) => formatMoney(convert(n, 'GBP', currency), currency, { decimals: false, compact: n >= 1_000_000 });
  return (
    <div className="hpi-card sales-card">
      <div>
        <span className="tag-live"><span className="live-dot-inline" />Live</span>{' '}
        <b>Sold prices {r.scope === 'street' ? `on ${r.label}` : `at ${r.label}`}</b>
        {r.median !== null && <> · typical {money(r.median)} over the last 3 years</>}
      </div>
      {r.building.length > 0 && (
        <div className="small"><b>In your building:</b> {r.building.slice(0, 3).map((s) => `${money(s.price)} (${formatDate(s.date, 'month')})`).join(', ')}</div>
      )}
      <ul className="sales">
        {shown.map((s, i) => (
          <li key={i}><span>{s.address}<span className="muted"> · {s.type} · {formatDate(s.date, 'month')}</span></span><b>{money(s.price)}</b></li>
        ))}
      </ul>
      {r.sales.length > 4 && <button className="link-btn small" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show ${Math.min(20, r.sales.length)} recent sales`}</button>}
      <span className="muted small">For comparison, not a valuation: sizes vary a lot. {PPD_ATTRIBUTION} <a href={PPD_URL} target="_blank" rel="noreferrer">Source</a></span>
    </div>
  );
}
