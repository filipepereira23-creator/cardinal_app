import { useEffect, useState } from 'react';
import type { Provider, ProviderKind } from '../data/providers';
import { CONSENT_DAYS, consentScopes, startConsent } from '../integrations/openBanking';
import { ProviderList } from './ProviderGrid';
import { ProviderMark } from './ProviderMark';
import { Bird } from './Logo';
import { Icon } from './Icon';

type Step = 'list' | 'consent' | 'soon';

/**
 * Open-banking style connect journey: Select a bank → what Cardinal will see → Continue.
 * Nothing connects in v1: Continue ends on a "coming soon" screen with a manual fallback.
 */
export function ConnectFlow({ kinds, initial, onClose, onManual, title }: { kinds: ProviderKind[]; initial?: Provider; onClose: () => void; onManual: (providerId?: string) => void; title: string }) {
  const [step, setStep] = useState<Step>(initial ? 'consent' : 'list');
  const [prov, setProv] = useState<Provider | undefined>(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', k);
      document.body.classList.remove('no-scroll');
    };
  }, [onClose]);

  const back = () => {
    if (step === 'list' || (step === 'consent' && initial)) return onClose();
    setStep(step === 'soon' ? 'consent' : 'list');
  };

  const scopes = prov ? consentScopes(prov.kinds.filter((k) => kinds.includes(k)).length ? prov.kinds.filter((k) => kinds.includes(k)) : prov.kinds) : [];

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-nav">
          <button className="icon-btn" onClick={back} aria-label="Back"><Icon name="back" size={22} /></button>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={22} /></button>
        </div>

        {step === 'list' && (
          <div className="sheet-body">
            <h2 className="sheet-title">{title}</h2>
            <ProviderList kinds={kinds} compact onPick={(p) => { setProv(p); setStep('consent'); }} onManual={() => onManual()} />
          </div>
        )}

        {step === 'consent' && prov && (
          <div className="sheet-body consent">
            <div className="consent-pair" aria-hidden="true">
              <span className="consent-bird"><Bird size={34} /></span>
              <span className="consent-dots"><i /><i /><i /></span>
              <ProviderMark provider={prov} size={56} />
            </div>
            <h2 className="sheet-title center">Connect your {prov.name} account</h2>
            <p className="muted center">Cardinal is asking {prov.name} for <b>read-only</b> access to:</p>
            <ul className="scopes">
              {scopes.map((s) => (
                <li key={s.title}>
                  <span className="scope-check"><Icon name="check" size={16} /></span>
                  <span><b>{s.title}</b><span className="muted small">{s.detail}</span></span>
                </li>
              ))}
            </ul>
            <ul className="consent-facts">
              <li><Icon name="lock" size={18} /> Cardinal can never move money or make payments.</li>
              <li><Icon name="eye" size={18} /> Access lasts {CONSENT_DAYS} days, then we ask you to reconfirm.</li>
              <li><Icon name="close" size={18} /> You can withdraw access at any time.</li>
            </ul>
            <div className="sheet-actions">
              <button
                className="btn btn-primary btn-lg"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const r = await startConsent(prov.id);
                  setBusy(false);
                  if (r.status === 'coming_soon') setStep('soon');
                }}
              >
                Continue
              </button>
              <p className="muted small center">You'll be taken to {prov.name} to log in securely. Cardinal never sees your login details.</p>
            </div>
          </div>
        )}

        {step === 'soon' && prov && (
          <div className="sheet-body consent">
            <ProviderMark provider={prov} size={64} />
            <h2 className="sheet-title center">Live connection coming soon</h2>
            <p className="muted center">
              We haven't connected to {prov.name} yet, so nothing was shared and no login was asked for.
              Add your balance by hand for now and Cardinal will keep track of it.
            </p>
            <div className="sheet-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onManual(prov.id)}>Add {prov.name} manually</button>
              <button className="btn btn-ghost btn-lg" onClick={() => (initial ? onClose() : setStep('list'))}>Choose another provider</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
