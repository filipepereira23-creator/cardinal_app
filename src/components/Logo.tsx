import { useStore } from '../state/store';

/** The cardinal bird turns yellow in dark mode (cardinal-yellow.png is a recoloured copy of cardinal.png). */
export function birdSrc(theme: 'light' | 'dark') {
  return theme === 'dark' ? './cardinal-yellow.png' : './cardinal.png';
}

export function Bird({ size, className }: { size?: number; className?: string }) {
  const { theme } = useStore();
  return <img className={className} src={birdSrc(theme)} alt="" width={size} height={size} style={size ? { objectFit: 'contain' } : undefined} />;
}

export function Logo({ size = 32, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="logo">
      <Bird size={size} />
      {wordmark && <span className="logo-word">Cardinal</span>}
    </span>
  );
}
