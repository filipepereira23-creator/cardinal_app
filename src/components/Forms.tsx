import { useMemo, useState, type ReactNode } from 'react';
import { CURRENCIES, convert, formatMoney, type CurrencyCode } from '../config/currencies';
import { typesFor, typeById } from '../data/holdingTypes';
import { providersFor, providerById, searchProviders, type Provider } from '../data/providers';
import type { CategoryId } from '../domain/types';
import { CATEGORIES } from '../data/categories';
import { todayISO } from '../domain/dates';
import { meaningfulBase } from '../domain/calc';
import { useStore } from '../state/store';
import { pricingMode } from '../valuation/valuers';
import { areaLookup } from '../valuation/areaPrice';
import { metalValue, spotPerGram, metalSpec, METALS } from '../valuation/metals';
import type { FieldDef } from '../data/holdingTypes';
import { Modal } from './Modal';
import { ProviderMark } from './ProviderMark';
import { Icon } from './Icon';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function parseAmount(s: string): number {
  return Number(s.replace(/[^0-9.\-]/g, ''));
}

/** One structured detail field: a select when it has fixed options, else a text/number input. */
export function DetailInput({ f, value, onChange }: { f: FieldDef; value: string; onChange: (v: string) => void }) {
  if (f.options) {
    return (
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={f.label}>
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return <input className="input" inputMode={f.numeric ? 'decimal' : undefined} placeholder={f.placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label={f.label} />;
}

/** Defaults for option fields, so a select's first choice is stored even if untouched. */
export function detailDefaults(fields?: FieldDef[]): Record<string, string> {
  return Object.fromEntries((fields ?? []).filter((f) => f.options?.length).map((f) => [f.key, f.options![0].value]));
}

/** Every currency, USD, GBP and EUR first. */
export function CurrencyOptions() {
  return <>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}</>;
}

export function AmountInput({ value, onChange, currency, autoFocus, required = false, placeholder = '0.00' }: { value: string; onChange: (s: string) => void; currency: CurrencyCode; autoFocus?: boolean; required?: boolean; placeholder?: string }) {
  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol;
  return (
    <div className="amount-input">
      <span>{sym}</span>
      <input inputMode="decimal" placeholder={placeholder} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

function ProviderPicker({ providers, value, onChange }: { providers: Provider[]; value?: string; onChange: (id?: string) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const sel = providerById(value);
  const list = searchProviders(providers, q);
  return (
    <div className="provider-picker">
      <button type="button" className="input provider-picker-btn" onClick={() => setOpen((o) => !o)}>
        {sel ? (
          <>
            <ProviderMark provider={sel} size={24} /> {sel.name}
          </>
        ) : (
          <span className="muted">Choose provider (optional)</span>
        )}
        <Icon name="down" size={16} />
      </button>
      {open && (
        <div className="provider-picker-pop">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input autoFocus placeholder="Search providers" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="provider-picker-list">
            {sel && (
              <button type="button" onClick={() => { onChange(undefined); setOpen(false); }} className="muted">
                No provider
              </button>
            )}
            {list.map((p) => (
              <button type="button" key={p.id} onClick={() => { onChange(p.id); setOpen(false); setQ(''); }}>
                <ProviderMark provider={p} size={24} /> {p.name}
              </button>
            ))}
            {!list.length && <div className="muted pad">No match. Leave it blank and use the name field.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Live "area price × floor area" suggestion while adding a property. */
function AreaEstimateBox({ details, ccy, onUse }: { details: Record<string, string>; ccy: CurrencyCode; onUse: (v: number) => void }) {
  const r = areaLookup(details);
  if (r.kind === 'no-postcode') return <p className="field-hint">Add the postcode and floor area and Cardinal will suggest a value from London sold prices per square metre.</p>;
  if (r.kind === 'not-london') return <p className="field-hint">Area prices cover London postcodes for now, so type in the value yourself for {r.district}.</p>;
  if (r.kind === 'no-figure') return <p className="field-hint">There aren't enough recent sales in {r.district} for a reliable price per square metre. Type in the value yourself.</p>;
  if (r.kind === 'no-area') return <p className="field-hint">Add the floor area in m² to get a suggested value (1 m² = 10.76 sq ft).</p>;
  const e = r.est;
  const v = Math.round(convert(e.value, 'GBP', ccy));
  return (
    <div className="hpi-card">
      <div><b>Area estimate: {formatMoney(v, ccy, { decimals: false })}</b> — {e.area} ({e.district}) sells for about {formatMoney(convert(e.psm, 'GBP', ccy), ccy, { decimals: false })} per m², × {e.sqm} m².</div>
      <div><button type="button" className="btn btn-outline btn-sm" onClick={() => onUse(v)}>Use this value</button> <span className="muted small">or type your own below</span></div>
    </div>
  );
}

/** Add an account or asset by hand. */
export function AddHoldingModal({ category, providerId, onClose, onAdded }: { category: CategoryId; providerId?: string; onClose: () => void; onAdded?: (id: string) => void }) {
  const { addHolding, currency: displayCcy, spot } = useStore();
  const types = typesFor(category);
  const presetProvider = providerById(providerId);
  const initialType = presetProvider ? types.find((t) => t.providerKinds.some((k) => presetProvider.kinds.includes(k)))?.id ?? types[0].id : types[0].id;
  const [typeId, setTypeId] = useState(initialType);
  const [prov, setProv] = useState<string | undefined>(providerId);
  const [name, setName] = useState('');
  const [ccy, setCcy] = useState<CurrencyCode>(displayCcy);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [details, setDetails] = useState<Record<string, string>>({});
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [gift, setGift] = useState(false);
  const [rate, setRate] = useState('');
  const [monthly, setMonthly] = useState('');
  const [livePrice, setLivePrice] = useState(true);
  const [err, setErr] = useState('');
  const type = typeById(typeId)!;
  const isDebtCat = category === 'debts';
  // Only this type's fields, with select defaults filled in.
  const allDetails: Record<string, string> = Object.fromEntries(
    (type.fields ?? []).map((f) => [f.key, details[f.key] ?? detailDefaults(type.fields)[f.key] ?? '']).filter(([, v]) => v !== ''),
  );
  const liveValue = pricingMode(typeId) === 'live' ? metalValue({ details: allDetails }, spot, ccy) : null;
  const useLive = livePrice && liveValue !== null;
  const providers = useMemo(() => providersFor(type.providerKinds), [type]);
  const cat = CATEGORIES.find((c) => c.id === category)!;

  const autoName = () => {
    if (typeId === 'gold') {
      const spec = metalSpec({ details: allDetails });
      const metal = METALS.find((m) => m.id === allDetails.metal)?.label ?? 'Metal';
      return spec ? `${metal} ${allDetails.weight} ${allDetails.unit}` : metal;
    }
    if (type.fields?.length) {
      const f = details;
      const parts = [f.brand || f.make || f.artist, f.model || f.address || f.location || f.description].filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    const p = providerById(prov);
    return p ? `${p.name} ${type.label}` : type.label;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = useLive ? liveValue! : parseAmount(amount);
    if (!useLive && (!amount || Number.isNaN(v))) return setErr(isDebtCat ? 'Enter the outstanding balance.' : 'Enter the current value.');
    if (isDebtCat && v < 0) return setErr('Enter the balance you owe as a positive number.');
    const r = rate.trim() ? parseAmount(rate) : undefined;
    const m = monthly.trim() ? parseAmount(monthly) : undefined;
    if (r !== undefined && (Number.isNaN(r) || r < 0 || r > 100)) return setErr('Interest rate should be a % between 0 and 100, or leave it blank.');
    if (m !== undefined && (Number.isNaN(m) || m < 0)) return setErr('Monthly payment should be a number, or leave it blank.');
    const valuations = [{ date: useLive ? todayISO() : date, value: v }];
    const bp = buyPrice.trim() ? parseAmount(buyPrice) : undefined;
    if (bp !== undefined && (Number.isNaN(bp) || bp < 0)) return setErr('Purchase price should be a number, or leave it blank.');
    // Only draw history from the purchase price if it's a real price. A £0 or £1 gift would make the chart and % meaningless.
    if (!gift && bp !== undefined && bp >= 100 && meaningfulBase(bp, v) && buyDate && buyDate < date) valuations.unshift({ date: buyDate, value: bp });
    const acquisition = category === 'assets' && (gift || bp !== undefined || buyDate) ? { price: gift ? undefined : bp, date: buyDate || undefined, gift: gift || undefined } : undefined;
    const h = addHolding({
      category,
      type: typeId,
      name: name.trim() || autoName(),
      providerId: prov,
      currency: ccy,
      source: useLive ? 'priced' : 'manual',
      valuations,
      positions: [],
      details: type.fields ? allDetails : undefined,
      acquisition,
      debt: isDebtCat ? { interestRate: r, monthlyPayment: m } : undefined,
    });
    onAdded?.(h.id);
    onClose();
  };

  return (
    <Modal title={`Add ${cat.singular}`} onClose={onClose}>
      <form onSubmit={submit} className="form">
        {presetProvider && (
          <div className="notice">
            <ProviderMark provider={presetProvider} size={28} />
            <span>
              A live connection to <b>{presetProvider.name}</b> is coming soon. For now, type in your balance and we'll keep track of it.
            </span>
          </div>
        )}
        <Field label="Type">
          <div className="chips">
            {types.map((t) => (
              <button type="button" key={t.id} className={`chip ${t.id === typeId ? 'on' : ''}`} onClick={() => setTypeId(t.id)}>
                <Icon name={t.icon} size={16} /> {t.label}
              </button>
            ))}
          </div>
        </Field>
        {type.providerKinds.length > 0 && (
          <Field label={isDebtCat ? 'Lender (optional)' : 'Provider'}>
            <ProviderPicker providers={providers} value={prov} onChange={setProv} />
          </Field>
        )}
        {type.fields && (
          <div className="grid-2">
            {type.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                <DetailInput f={f} value={allDetails[f.key] ?? ''} onChange={(v) => setDetails({ ...details, [f.key]: v })} />
              </Field>
            ))}
          </div>
        )}
        {typeId === 'property' && <AreaEstimateBox details={allDetails} ccy={ccy} onUse={(v) => setAmount(String(v))} />}
        {pricingMode(typeId) === 'live' && (
          <div className="value-source">
            {spot ? (
              <>
                <label className="check-row">
                  <input type="checkbox" checked={livePrice} onChange={(e) => setLivePrice(e.target.checked)} />
                  <span>Value it automatically from the live spot price</span>
                </label>
                {liveValue !== null ? (
                  <span><span className="live-dot" />Worth <b>{formatMoney(liveValue, ccy)}</b> today · spot {formatMoney(spotPerGram(metalSpec({ details: allDetails })!.metal, spot, ccy) ?? 0, ccy)}/g</span>
                ) : (
                  <span className="muted">Enter a weight to value it live.</span>
                )}
              </>
            ) : (
              <span className="muted">The live spot price isn't available right now, so type in today's value.</span>
            )}
          </div>
        )}
        <Field label="Name" hint="Leave blank and we'll name it for you.">
          <input className="input" placeholder={autoName()} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid-2">
          {!useLive && (
            <Field label={isDebtCat ? 'Outstanding balance' : category === 'assets' ? 'Current value' : 'Current balance'}>
              <AmountInput value={amount} onChange={setAmount} currency={ccy} required />
            </Field>
          )}
          <Field label="Currency">
            <select className="input" value={ccy} onChange={(e) => setCcy(e.target.value as CurrencyCode)}>
              <CurrencyOptions />
            </select>
          </Field>
        </div>
        {isDebtCat && (
          <div className="grid-2">
            <Field label="Interest rate (optional)" hint="Annual rate, e.g. 4.29">
              <div className="amount-input"><input inputMode="decimal" placeholder="0.00" value={rate} onChange={(e) => setRate(e.target.value)} /><span>%</span></div>
            </Field>
            <Field label="Monthly payment (optional)">
              <AmountInput value={monthly} onChange={setMonthly} currency={ccy} placeholder="0.00" />
            </Field>
          </div>
        )}
        {!useLive && (
          <Field label={isDebtCat ? 'Balance as of' : 'Value as of'}>
            <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
        )}
        {category === 'assets' && (
          <AcquisitionFields currency={ccy} price={buyPrice} setPrice={setBuyPrice} date={buyDate} setDate={setBuyDate} gift={gift} setGift={setGift} maxDate={date} />
        )}
        {pricingMode(typeId) === 'link' && <p className="field-hint">There's no free live price feed for this, so type in today's value. Once it's added you'll get a link to check the market price and a reminder to update it.</p>}
        {pricingMode(typeId) === 'index' && <p className="field-hint">You can always type in your own value. Cardinal can also suggest one from London prices per square metre, and track it with the HM Land Registry house price index.</p>}
        {isDebtCat && <p className="field-hint">Debts subtract from your net worth. Only structured details are kept (type, lender, balance, rate) — no account numbers needed.</p>}
        {type.allowsPositions && <p className="field-hint">You can add the individual funds, shares or coins inside it once it's added.</p>}
        {err && <p className="error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Add</button>
        </div>
      </form>
    </Modal>
  );
}

/** Optional "what you paid" fields for assets. Nothing here is required: cars and watches are often gifts. */
export function AcquisitionFields({ currency, price, setPrice, date, setDate, gift, setGift, maxDate }: { currency: CurrencyCode; price: string; setPrice: (s: string) => void; date: string; setDate: (s: string) => void; gift: boolean; setGift: (b: boolean) => void; maxDate?: string }) {
  return (
    <fieldset className="acq">
      <legend>What you paid <span className="muted">(optional)</span></legend>
      <label className="check-row">
        <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} />
        <span>It was a gift or inherited</span>
      </label>
      <div className="grid-2">
        {!gift && (
          <Field label="Purchase price">
            <AmountInput value={price} onChange={setPrice} currency={currency} placeholder="Leave blank if unknown" />
          </Field>
        )}
        <Field label={gift ? 'Date received' : 'Purchase date'}>
          <input className="input" type="date" value={date} max={maxDate ?? todayISO()} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <p className="field-hint">Gain since purchase is only shown when there's a real purchase price. Gifts, £0 or token amounts don't count.</p>
    </fieldset>
  );
}

/** Record a new value for an account, asset or position. */
export function UpdateValueModal({ title, currency, current, onSave, onClose }: { title: string; currency: CurrencyCode; current: number; onSave: (date: string, value: number) => void; onClose: () => void }) {
  const [amount, setAmount] = useState(current ? String(current) : '');
  const [date, setDate] = useState(todayISO());
  const [err, setErr] = useState('');
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const v = parseAmount(amount);
          if (!amount || Number.isNaN(v)) return setErr('Enter a value.');
          onSave(date, v);
          onClose();
        }}
      >
        <Field label="New value">
          <AmountInput value={amount} onChange={setAmount} currency={currency} autoFocus required />
        </Field>
        <Field label="As of" hint="Pick an earlier date to fill in past values.">
          <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {err && <p className="error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export function AddPositionModal({ holdingId, currency, onClose }: { holdingId: string; currency: CurrencyCode; onClose: () => void }) {
  const { addPosition } = useStore();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [err, setErr] = useState('');
  return (
    <Modal title="Add fund, share or coin" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const v = parseAmount(amount);
          if (!name.trim()) return setErr('Give it a name.');
          if (!amount || Number.isNaN(v)) return setErr('Enter its current value.');
          addPosition(holdingId, { name: name.trim(), symbol: symbol.trim() || undefined, value: v, date });
          onClose();
        }}
      >
        <Field label="Name">
          <input className="input" autoFocus placeholder="e.g. iShares NASDAQ 100 ETF" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Ticker or symbol (optional)">
          <input className="input" placeholder="e.g. CNX1, BTC" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </Field>
        <div className="grid-2">
          <Field label="Current value">
            <AmountInput value={amount} onChange={setAmount} currency={currency} required />
          </Field>
          <Field label="As of">
            <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        {err && <p className="error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Add</button>
        </div>
      </form>
    </Modal>
  );
}
