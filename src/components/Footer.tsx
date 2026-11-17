import { useState } from 'react';
import { Logo } from './Logo';
import { useStore } from '../state/store';

/** Brand marks drawn inline, so they need no network and work offline. */
function SocialIcon({ name }: { name: Social['id'] }) {
  const s = 30;
  switch (name) {
    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
              <stop offset="0" stopColor="#fdf497" />
              <stop offset=".05" stopColor="#fdf497" />
              <stop offset=".45" stopColor="#fd5949" />
              <stop offset=".6" stopColor="#d6249f" />
              <stop offset=".9" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="12" fill="url(#ig-g)" />
          <rect x="6.5" y="6.5" width="11" height="11" rx="3.2" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="2.7" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="15.4" cy="8.6" r=".9" fill="#fff" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#0A66C2" />
          <rect x="6.6" y="10" width="2.4" height="7.2" fill="#fff" />
          <circle cx="7.8" cy="7.5" r="1.4" fill="#fff" />
          <path d="M10.8 10h2.3v1c.5-.8 1.4-1.2 2.4-1.2 1.9 0 2.8 1.2 2.8 3.3v4.1h-2.4v-3.7c0-1-.3-1.6-1.2-1.6-1 0-1.5.7-1.5 1.7v3.6h-2.4z" fill="#fff" />
        </svg>
      );
    case 'x':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#fff" />
          <path d="M6.6 6.5h3.1l7.7 11h-3.1z" fill="none" stroke="#000" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M17.2 6.5l-4.4 5M11.2 13.1l-4.4 4.4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#000" />
          <path d="M13.9 13.6V5.5" stroke="#25F4EE" strokeWidth="2" transform="translate(-.6 .4)" />
          <path d="M13.2 5.5h2.2c.2 1.6 1.3 2.8 3 3v2.2c-1.1 0-2.1-.3-3-.9v4.8a3.9 3.9 0 11-3.9-3.9v2.2a1.7 1.7 0 101.7 1.7z" fill="#fff" />
        </svg>
      );
    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#FF0000" />
          <rect x="5.2" y="7.6" width="13.6" height="8.8" rx="2.6" fill="#fff" />
          <path d="M10.6 9.9v4.2l3.7-2.1z" fill="#FF0000" />
        </svg>
      );
  }
}

interface Social {
  id: 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'youtube';
  label: string;
}
const SOCIALS: Social[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
];

const GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: 'Company', links: [{ label: 'About', href: '#/info/about' }, { label: 'Contact', href: '#/info/contact' }] },
  { title: 'Legal', links: [{ label: 'Privacy', href: '#/info/privacy' }, { label: 'Terms', href: '#/info/terms' }] },
];

/**
 * Site footer, laid out like the reference Filipe sent: account link, collapsible
 * link groups, a "Connect" list of socials, then the copyright line.
 * Social accounts don't exist yet, so the icons link nowhere.
 */
export function Footer() {
  const { user } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo size={34} />
          <p>Your net worth, all in one place.</p>
        </div>
        <a className="footer-account" href={user ? '#/settings' : '#/login'}>
          {user ? 'Your settings' : 'Sign in / Register'} <span className="raquo">»</span>
        </a>
        <div className="footer-groups">
          {GROUPS.map((g) => {
            const isOpen = open === g.title;
            return (
              <div key={g.title} className={`footer-group ${isOpen ? 'open' : ''}`}>
                <button className="footer-group-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.title)}>
                  <span className="footer-plus" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  {g.title}
                </button>
                <ul>
                  {g.links.map((l) => (
                    <li key={l.label}><a href={l.href}>{l.label}</a></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="footer-connect">
          <h4>Connect</h4>
          <ul>
            {SOCIALS.map((s) => (
              <li key={s.id}>
                <a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true" title={`${s.label} - coming soon`}>
                  <SocialIcon name={s.id} />
                  <span>{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Cardinal. All rights reserved.</span>
          <button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 14l6-6 6 6" /></svg>
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
