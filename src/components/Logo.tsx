export function Logo({ size = 32, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="logo">
      <img src="./cardinal.png" alt="" width={size} height={size} style={{ objectFit: 'contain' }} />
      {wordmark && <span className="logo-word">Cardinal</span>}
    </span>
  );
}
