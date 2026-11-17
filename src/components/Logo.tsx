import { useState } from 'react';
import { useStore } from '../state/store';

/** The cardinal bird turns yellow in dark mode (cardinal-yellow.png is a recoloured copy of cardinal.png). */
export function birdSrc(theme: 'light' | 'dark') {
  return theme === 'dark' ? './cardinal-yellow.png' : './cardinal.png';
}

export function Bird({ size, className }: { size?: number; className?: string }) {
  const { theme } = useStore();
  return <img className={className} src={birdSrc(theme)} alt="" width={size} height={size} style={size ? { objectFit: 'contain' } : undefined} />;
}

/**
 * The bird with a separate wing layer: tapping it plays a short "about to take flight" animation
 * (crouch, two wing beats, a lift). CSS in styles.css; skipped when the user prefers reduced motion.
 */
export function FlyingBird({ size = 32, onTap }: { size?: number; onTap?: () => void }) {
  const { theme } = useStore();
  const [run, setRun] = useState(0);
  const src = birdSrc(theme);
  return (
    <button
      type="button"
      className={`bird-btn ${run ? 'flap' : ''}`}
      key={run}
      style={{ width: size, height: size }}
      aria-label="Cardinal"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setRun((r) => r + 1);
        onTap?.();
      }}
      onAnimationEnd={(e) => {
        if (e.animationName === 'bird-body') setRun(0);
      }}
    >
      <span className="bird-body">
        <img src={src} alt="" draggable={false} />
        <img src={src} alt="" draggable={false} className="bird-wing" />
      </span>
    </button>
  );
}

export function Logo({ size = 32, wordmark = true, animated = false }: { size?: number; wordmark?: boolean; animated?: boolean }) {
  return (
    <span className="logo">
      {animated ? <FlyingBird size={size} /> : <Bird size={size} />}
      {wordmark && <span className="logo-word">Cardinal</span>}
    </span>
  );
}
