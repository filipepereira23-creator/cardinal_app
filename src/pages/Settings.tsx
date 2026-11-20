import { useAvatar, setAvatar, resizeToAvatar } from '../components/Avatar';
import { titleCase } from '../domain/titleCase';
import { useState, type ReactNode } from 'react';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { downloadExcel } from '../export/excel';
import { CURRENCIES, convert, formatMoney, type CurrencyCode } from '../config/currencies';
import { formatDate } from '../domain/dates';
import { METALS, spotPerGram } from '../valuation/metals';
import { RANGES, type RangeId } from '../domain/dates';
import type { Settings as SettingsT, Theme } from '../domain/types';
import { Field, CurrencyOptions } from '../components/Forms';
import { Icon } from '../components/Icon';

function Section({ title, icon, children, note }: { title: string; icon: string; children: ReactNode; note?: string }) {
  return (
    <section className="card settings-section">
      <h2 className="settings-title"><Icon name={icon} size={18} /> {titleCase(title)}</h2>
      {note && <p className="muted small settings-note">{note}</p>}
      {children}
    </section>
  );
}

function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (b: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <span className="toggle-text">
        <span>{titleCase(label)}</span>
        {hint && <span className="muted small">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg seg-full" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** An exchange rate with four significant decimals, e.g. £0.7577 or ¥210.64. */
function rateText(v: number, ccy: CurrencyCode): string {
  const sym = CURRENCIES.find((c) => c.code === ccy)?.symbol ?? '';
  const dp = v >= 100 ? 2 : v >= 1 ? 4 : 4;
  return `${sym}${new Intl.NumberFormat('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v)}`;
}

export function SettingsPage() {
  const { user, settings, updateSettings, updateProfile, currency, setCurrency, clearAll, deleteAccount, logout, holdings, fx, spot, refreshMarket } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const photo = useAvatar(user?.id);
  const [p, setP] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = p.firstName !== user?.firstName || p.lastName !== user?.lastName || p.email !== user?.email;
  const notif = (k: keyof SettingsT['notifications'], v: boolean) => updateSettings({ notifications: { ...settings.notifications, [k]: v } });

  const download = () => downloadExcel(holdings, currency, `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim());

  return (
    <div className="page settings">
      <button className="back" onClick={() => go('dashboard')}><Icon name="back" size={18} /> Dashboard</button>
      <h1 className="page-title">Settings</h1>

      <Section title="Profile" icon="user">
        <div className="avatar-edit">
          <span className="avatar">{photo ? <img src={photo} alt="Your profile" /> : (user ? (user.firstName[0] + (user.lastName[0] ?? '')).toUpperCase() : '')}</span>
          <div>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              Choose From Gallery
              <input type="file" accept="image/*" hidden onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f || !user) return;
                try { setAvatar(user.id, await resizeToAvatar(f)); setMsg({ ok: true, text: 'Profile picture saved' }); } catch (x: any) { setMsg({ ok: false, text: x.message }); }
              }} />
            </label>
            {photo && user && <button type="button" className="link-btn" style={{ marginLeft: 10 }} onClick={() => setAvatar(user.id, null)}>Remove</button>}
          </div>
        </div>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setMsg(null);
            try {
              await updateProfile(p);
              setMsg({ ok: true, text: 'Profile saved' });
            } catch (x: any) {
              setMsg({ ok: false, text: x.message });
            }
          }}
        >
          <div className="grid-2">
            <Field label="First name"><input className="input" required value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} /></Field>
            <Field label="Last name"><input className="input" required value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} /></Field>
          </div>
          <Field label="Email"><input className="input" type="email" required value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></Field>
          {msg && <p className={msg.ok ? 'ok-msg' : 'error'}>{msg.text}</p>}
          <div className="form-actions">
            <button className="btn btn-primary" disabled={!dirty}>Save profile</button>
          </div>
        </form>
      </Section>

      <Section title="Appearance" icon="moon">
        <Field label="Theme">
          <Segmented<Theme> label="Theme" value={settings.theme} onChange={(theme) => updateSettings({ theme })} options={[{ id: 'auto', label: 'Auto' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'system', label: 'Phone' }]} />
          <p className="muted small">Auto is dark from 6pm to 7am your local time, and light the rest of the day</p>
        </Field>
        <p className="field-hint">In dark mode the Cardinal bird turns yellow and the wordmark turns white</p>
      </Section>

      <Section title="Display" icon="chart">
        <div className="form">
          <div className="grid-2">
            <Field label="Default currency">
              <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                <CurrencyOptions />
              </select>
            </Field>
            <Field label="Default chart period">
              <select className="input" value={settings.defaultRange} onChange={(e) => updateSettings({ defaultRange: e.target.value as RangeId })}>
                {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label} · {r.desc}</option>)}
              </select>
            </Field>
          </div>
          <Toggle label="Show pence and cents" checked={settings.showDecimals} onChange={(showDecimals) => updateSettings({ showDecimals })} />
          <Toggle label="Hide balances" hint="Shows •••• instead of amounts. Handy in public." checked={settings.hideBalances} onChange={(hideBalances) => updateSettings({ hideBalances })} />
        </div>
      </Section>

      <Section title="Exchange Rates & Live Prices" icon="chart">
        <div className="rates-head">
          <span className={`live-badge ${fx.live ? '' : 'off'}`}>{fx.live ? 'Live' : 'Offline'}</span>
          <button className="btn btn-ghost btn-sm" disabled={refreshing} onClick={async () => { setRefreshing(true); await refreshMarket(); setRefreshing(false); }}>
            {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
        <p className="rates-asof">
          Rates as of <b>{formatDate(fx.asOf, 'long')}</b>
          {fx.fetchedAt && <span className="muted small"> · checked {new Date(fx.fetchedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
        </p>
        <table className="rates-table" aria-label={`Exchange rates in ${currency}`}>
          <tbody>
            {CURRENCIES.filter((c) => c.code !== currency).map((c) => (
              <tr key={c.code}>
                <td>{c.code === 'JPY' ? 100 : 1} {c.code} <span className="muted small">{c.name}</span></td>
                <td>{rateText(convert(c.code === 'JPY' ? 100 : 1, c.code, currency), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="field-hint">Accounts can be entered in any of these {CURRENCIES.length} currencies and are converted at these rates. Without a connection, the last saved rates (or built-in ones) are used</p>
        <h3 className="panel-subtitle">Precious Metals</h3>
        {spot ? (
          <table className="rates-table">
            <tbody>
              {METALS.filter((m) => spot.usdPerOz[m.id]).map((m) => (
                <tr key={m.id}>
                  <td>{m.label}</td>
                  <td>{formatMoney(spotPerGram(m.id, spot, currency) ?? 0, currency)}/g · {formatMoney(convert(spot.usdPerOz[m.id]!, 'USD', currency), currency, { decimals: false })}/oz</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted small">Spot prices aren't available right now</p>}
      </Section>

      <Section title="Notifications" icon="bell" note="Coming soon. These need a server to send email or push messages, so they don't do anything yet">
        <Toggle disabled label="Weekly summary email" hint="Your net worth and what moved, every Monday" checked={settings.notifications.weeklySummary} onChange={(v) => notif('weeklySummary', v)} />
        <Toggle disabled label="Big move alerts" hint="When net worth moves more than 5% in a day" checked={settings.notifications.bigMoves} onChange={(v) => notif('bigMoves', v)} />
        <Toggle disabled label="Reminders to update values" hint="Monthly nudge for manually tracked assets" checked={settings.notifications.updateReminders} onChange={(v) => notif('updateReminders', v)} />
      </Section>

      <Section title="Your Data" icon="download" note="Your accounts and values are stored in this browser on this device only">
        <div className="settings-actions">
          <button className="btn btn-outline" onClick={download}><Icon name="download" size={16} /> Export to Excel</button>
          <button className="btn btn-ghost" disabled={!holdings.length} onClick={() => confirm("Remove every account and asset from Cardinal? Your login stays. This can't be undone") && clearAll()}>
            <Icon name="trash" size={16} /> Delete all data
          </button>
        </div>
      </Section>

      <Section title="Account" icon="lock">
        <div className="settings-actions">
          <button className="btn btn-outline" onClick={async () => { await logout(); go('welcome'); }}><Icon name="logout" size={16} /> Log out</button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (!confirm('Delete your Cardinal account and everything in it? This can\'t be undone')) return;
              await deleteAccount();
              go('welcome');
            }}
          >
            <Icon name="trash" size={16} /> Delete account
          </button>
        </div>
      </Section>
    </div>
  );
}
