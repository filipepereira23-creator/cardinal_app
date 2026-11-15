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

/** A provider monogram tile (real logos can replace this once we license them). */
export function ProviderMark({ provider, typeId, size = 40 }: { provider?: Provider; typeId?: string; size?: number }) {
  if (provider) {
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
