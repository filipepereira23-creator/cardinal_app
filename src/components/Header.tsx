import { useState } from 'react';
import { Logo } from './Logo';
import { CurrencySelect } from './CurrencySelect';
import { Icon } from './Icon';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { RATES_AS_OF, RATES_IN_GBP } from '../config/currencies';

export function Header() {
  const { user, logout, loadSample, clearAll, holdings } = useStore();
  const [open, setOpen] = useState(false);
  const initials = user ? (user.firstName[0] + (user.lastName[0] ?? '')).toUpperCase() : '';
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a href="#/dashboard" className="plain"><Logo size={30} /></a>
        <div className="header-right">
          <CurrencySelect />
          <div className="menu-wrap">
            <button className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Account menu">{initials}</button>
            {open && (
              <>
                <div className="menu-scrim" onClick={() => setOpen(false)} />
                <div className="menu">
                  <div className="menu-user">
                    <b>{user?.firstName} {user?.lastName}</b>
                    <span className="muted small">{user?.email}</span>
                  </div>
                  <button onClick={() => { loadSample(); setOpen(false); go('dashboard'); }}><Icon name="sparkle" size={16} /> Add sample data</button>
                  {holdings.length > 0 && (
                    <button onClick={() => { if (confirm('Remove every account and asset from Cardinal? This can\'t be undone.')) clearAll(); setOpen(false); }}>
                      <Icon name="trash" size={16} /> Clear all data
                    </button>
                  )}
                  <div className="menu-note muted small">Rates: €1 = £{RATES_IN_GBP.EUR}, $1 = £{RATES_IN_GBP.USD} · {RATES_AS_OF}</div>
                  <button onClick={async () => { await logout(); go('welcome'); }}><Icon name="logout" size={16} /> Log out</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
