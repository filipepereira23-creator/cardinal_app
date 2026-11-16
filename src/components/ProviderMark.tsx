import { useState } from 'react';
import type { Provider } from '../data/providers';
import { typeById } from '../data/holdingTypes';
import { Icon } from './Icon';

function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9& ]/g, ' ').split(/\s+/).filter((w) => w && !['the', 'of', 'by', 'and', '&', 'uk'].includes(w.toLowerCase()));
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
}

function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.65 ? '#1d1d1f' : '#fff';
}

/**
 * Logo sources, tried in order. Each is the provider's own site icon, fetched by
 * domain from a public favicon service. When every source fails (or only returns
 * a generic 16px globe) the brand-coloured initials tile is shown instead.
 * To use licensed logo files later, put them first in this list
 * (e.g. `./logos/${domain}.svg`).
 */
const SOURCES = [
  (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=128`,
  (d: string) => `https://icon.horse/icon/${d}`,
];

/** Remembers, per domain, which source to use, so lists don't re-try failed ones. */
const stageCache = new Map<string, number>();

/** Domains Google's favicon service doesn't know (it answers 404). Start these on the next source. */
const SKIP_GOOGLE = ['civilservicepensionscheme.org.uk', 'salvusmastertrust.co.uk', 'thenottingham.com', 'westbrom.co.uk'];
SKIP_GOOGLE.forEach((d) => stageCache.set(d, 1));

export function ProviderMark({ provider, typeId, size = 40 }: { provider?: Provider; typeId?: string; size?: number }) {
  const domain = provider?.domain;
  const [stage, setStage] = useState(() => (domain ? stageCache.get(domain) ?? 0 : SOURCES.length));
  const next = () => {
    if (!domain) return;
    const n = stage + 1;
    stageCache.set(domain, n);
    setStage(n);
  };

  if (provider) {
    if (domain && stage < SOURCES.length) {
      return (
        <span className="pmark pmark-logo" style={{ width: size, height: size }}>
          <img
            src={SOURCES[stage](domain)}
            alt=""
            width={Math.round(size * 0.66)}
            height={Math.round(size * 0.66)}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={next}
            // Favicon services answer unknown sites with a tiny generic globe: treat that as a miss.
            onLoad={(e) => (e.currentTarget.naturalWidth <= 16 ? next() : stageCache.set(domain, stage))}
          />
        </span>
      );
    }
    return (
      <span className="pmark" style={{ width: size, height: size, background: provider.color, color: textOn(provider.color), fontSize: size * 0.36 }}>
        {initials(provider.name)}
      </span>
    );
  }
  return (
    <span className="pmark pmark-icon" style={{ width: size, height: size }}>
      <Icon name={typeById(typeId || '')?.icon ?? 'box'} size={size * 0.5} />
    </span>
  );
}
