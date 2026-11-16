import { useMemo, useState, type ReactNode } from 'react';
import { CURRENCIES, type CurrencyCode } from '../config/currencies';
import { typesFor, typeById } from '../data/holdingTypes';
import { providersFor, providerById, searchProviders, type Provider } from '../data/providers';
import type { CategoryId } from '../domain/types';
import { CATEGORIES } from '../data/categories';
import { todayISO } from '../domain/dates';
import { meaningfulBase } from '../domain/calc';
import { useStore } from '../state/store';
import { PLANNED_SOURCES } from '../valuation/valuers';
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

/** Add an account or asset by hand. */
export function AddHoldingModal({ category, providerId, onClose, onAdded }: { category: CategoryId; providerId?: string; onClose: () => void; onAdded?: (id: string) => void }) {
  const { addHolding, currency: displayCcy } = useStore();
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
  const [err, setErr] = useState('');
  const type = typeById(typeId)!;
  const providers = useMemo(() => providersFor(type.providerKinds), [type]);
  const cat = CATEGORIES.find((c) => c.id === category)!;

  const autoName = () => {
    if (type.fields?.length) {
      const f = details;
      const parts = [f.brand || f.make || f.metal || f.artist, f.model || f.weight || f.location || f.description].filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    const p = providerById(prov);
    return p ? `${p.name} ${type.label}` : type.label;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseAmount(amount);
    if (!amount || Number.isNaN(v)) return setErr('Enter the current value.');
    const valuations = [{ date, value: v }];
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
      source: 'manual',
      valuations,
      positions: [],
      details: type.fields ? details : undefined,
      acquisition,
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
          <Field label="Provider">
            <ProviderPicker providers={providers} value={prov} onChange={setProv} />
          </Field>
        )}
        {type.fields && (
          <div className="grid-2">
            {type.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                <input className="input" placeholder={f.placeholder} value={details[f.key] ?? ''} onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })} />
              </Field>
            ))}
          </div>
        )}
        <Field label="Name" hint="Leave blank and we'll name it for you.">
          <input className="input" placeholder={autoName()} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid-2">
          <Field label={category === 'assets' ? 'Current value' : 'Current balance'}>
            <AmountInput value={amount} onChange={setAmount} currency={ccy} required />
          </Field>
          <Field label="Currency">
            <select className="input" value={ccy} onChange={(e) => setCcy(e.target.value as CurrencyCode)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Value as of">
          <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {category === 'assets' && (
          <AcquisitionFields currency={ccy} price={buyPrice} setPrice={setBuyPrice} date={buyDate} setDate={setBuyDate} gift={gift} setGift={setGift} maxDate={date} />
        )}
        {PLANNED_SOURCES[typeId] && <p className="field-hint">Live pricing from {PLANNED_SOURCES[typeId]} is coming soon. Until then, type in today's value.</p>}
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
