import { useState } from 'react';
import { useAvatar } from './Avatar';
import { FlyingBird } from './Logo';
import { CurrencySelect } from './CurrencySelect';
import { Icon } from './Icon';
import { useStore } from '../state/store';
import { go } from '../state/router';

export function Header() {
  const { user, logout, loadSample, clearAll, holdings, settings, updateSettings } = useStore();
  const hidden = settings.hideBalances;
  const photo = useAvatar(user?.id);
  const [open, setOpen] = useState(false);
  const initials = user ? (user.firstName[0] + (user.lastName[0] ?? '')).toUpperCase() : '';
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="logo">
          <FlyingBird size={30} onTap={() => { if (!window.location.hash.startsWith('#/dashboard')) go('dashboard'); }} />
          <a href="#/dashboard" className="plain logo-word">Cardinal</a>
        </span>
        <div className="header-right">
          <CurrencySelect />
          <button className="icon-btn" aria-label={hidden ? 'Show balances' : 'Hide balances'} aria-pressed={hidden} title={hidden ? 'Show balances' : 'Hide balances'} onClick={() => updateSettings({ hideBalances: !hidden })}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {hidden && <path d="M4 4l16 16" />}
            </svg>
          </button>
          <a href="#/settings" className="icon-btn header-gear" aria-label="Settings" title="Settings"><Icon name="gear" size={20} /></a>
          <div className="menu-wrap">
            <button className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Account menu">{photo ? <img src={photo} alt="" /> : initials}</button>
            {open && (
              <>
                <div className="menu-scrim" onClick={() => setOpen(false)} />
                <div className="menu">
                  <div className="menu-user">
                    <b>{user?.firstName} {user?.lastName}</b>
                    <span className="muted small">{user?.email}</span>
                  </div>
                  <button onClick={() => { setOpen(false); go('settings'); }}><Icon name="gear" size={16} /> Settings</button>
                  <button onClick={() => { loadSample(); setOpen(false); go('dashboard'); }}><Icon name="sparkle" size={16} /> Add sample data</button>
                  {holdings.length > 0 && (
                    <button onClick={() => { if (confirm('Remove every account and asset from Cardinal? This can\'t be undone')) clearAll(); setOpen(false); }}>
                      <Icon name="trash" size={16} /> Clear all data
                    </button>
                  )}
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
